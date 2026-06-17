import { prisma } from '../utils/prisma.js';
import { avg, classifyAlert, dropPct } from './metricUtils.js';

type MetricDef = { field: 'topSpeedKph' | 'sprintDistanceM' | 'highIntensityRunningM' | 'accelerations' | 'distanceM' | 'workload' | 'sessionLoad'; label: string; threshold: number };
const metrics: MetricDef[] = [
  { field: 'topSpeedKph', label: 'Top Speed', threshold: 8 },
  { field: 'sprintDistanceM', label: 'Sprint Distance', threshold: 15 },
  { field: 'highIntensityRunningM', label: 'High Intensity Distance', threshold: 15 },
  { field: 'accelerations', label: 'Accelerations', threshold: 12 },
  { field: 'distanceM', label: 'Total Volume', threshold: 15 },
  { field: 'workload', label: 'Player Load', threshold: 15 },
  { field: 'sessionLoad', label: 'Session Load', threshold: 15 },
];

export class PerformanceDropService {
  static async recalculate() {
    await prisma.alert.updateMany({ where: { active: true }, data: { active: false } });
    const athletes = await prisma.athlete.findMany({ include: { performances: { orderBy: { startDate: 'asc' } } } });
    const created: any[] = [];

    for (const athlete of athletes) {
      if (athlete.performances.length < 4) continue;
      const current = athlete.performances.at(-1)!;
      // Pegamos o histórico completo do atleta (exceto a sessão atual)
      const historicalData = athlete.performances.slice(0, -1);
      
      for (const metric of metrics) {
        const currentValue = Number(current[metric.field] ?? 0);
        const historyValues = historicalData.map(p => Number(p[metric.field] ?? 0));
        
        if (currentValue <= 0 || historyValues.length < 3) continue;

        let isAnomaly = false;
        
        // -------------------------------------------------------------
        // INTEGRAÇÃO COM A INTELIGÊNCIA ARTIFICIAL (ISOLATION FOREST)
        // -------------------------------------------------------------
        try {
            // Chama o microserviço Python rodando na porta 8000
            const response = await fetch('http://host.docker.internal:8000/detect-anomaly', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ history: historyValues, current: currentValue })
            });
            
            if (response.ok) {
                const data = await response.json();
                isAnomaly = data.is_anomaly; // O Python decide se é anomalia!
            }
        } catch (error) {
            console.error(`[IA Offline] Não foi possível conectar ao fv-categorizing para ${metric.label}`);
            // Se o Python estiver desligado, ele ignora para não travar o sistema
            continue;
        }

        // Se o Isolation Forest detectou anomalia, criamos o alerta!
        if (isAnomaly) {
            const baseAvg = avg(historyValues);
            const drop = dropPct(currentValue, baseAvg);
            
            const message = `Anomalia de IA (Isolation Forest): Queda atípica no desempenho de ${metric.label}. Redução de ${drop.toFixed(0)}% em relação ao padrão isolado do atleta.`;
            
            const alert = await prisma.alert.create({
                data: {
                    athleteId: athlete.id,
                    metric: metric.label,
                    severity: drop > 25 ? 'high' : 'medium', // Severidade baseada na queda
                    dropPercent: drop,
                    historical: baseAvg,
                    recent: currentValue,
                    message,
                }
            });
            created.push(alert);
        }
      }
    }
    return created;
  }

  static async list() {
    const rows = await (prisma as any).performanceAlert.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }).catch(() => []);
    return rows;
  }
}