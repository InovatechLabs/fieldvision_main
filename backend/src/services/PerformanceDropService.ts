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
<<<<<<< HEAD
      const previous3 = athlete.performances.slice(-4, -1);
      const previous7 = athlete.performances.slice(Math.max(0, athlete.performances.length - 8), -1);
      const baseline = athlete.performances.slice(Math.max(0, athlete.performances.length - 29), -1);

      for (const metric of metrics) {
        const currentValue = Number(current[metric.field] ?? 0);
        const avg3 = avg(previous3.map(p => p[metric.field] as number | null));
        const avg7 = avg(previous7.map(p => p[metric.field] as number | null));
        const base = avg(baseline.map(p => p[metric.field] as number | null));
        if (currentValue <= 0 || Math.max(avg3, avg7, base) <= 0) continue;

        const drop3 = dropPct(currentValue, avg3);
        const drop7 = dropPct(currentValue, avg7);
        const dropBase = dropPct(currentValue, base);
        const persistent = [drop3, drop7, dropBase].filter(v => v >= metric.threshold).length;
        const score = Math.max(drop3, drop7, dropBase) + persistent * 10;
        const severity = classifyAlert(score);
        if (persistent === 0) continue;

        const message = `Performance decline detected: ${metric.label.toLowerCase()} is ${Math.max(drop3, drop7, dropBase).toFixed(0)}% below the athlete baseline/current rolling average.`;
        const alert = await prisma.alert.create({
          data: {
            athleteId: athlete.id,
            metric: metric.label,
            severity: severity === 'Critical' ? 'high' : severity === 'Warning' ? 'medium' : 'low',
            dropPercent: Math.max(drop3, drop7, dropBase),
            historical: base || avg7 || avg3,
            recent: currentValue,
            message,
          }
        });
        await (prisma as any).performanceAlert.create({ data: { athleteId: athlete.id, metric: metric.label, severity, score: Math.round(score), currentValue, baselineValue: base || avg7 || avg3, dropPercent: Math.max(drop3, drop7, dropBase), explanation: message, recommendation: severity === 'Critical' ? 'Review recovery status and reduce high-intensity work until performance stabilizes.' : 'Monitor the next sessions and compare against individual baseline.' } }).catch(() => null);
        created.push(alert);
=======
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
>>>>>>> 1122f1733359823ff46d03f4d1558eb6640415ce
      }
    }
    return created;
  }

  static async list() {
    const rows = await (prisma as any).performanceAlert.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }).catch(() => []);
    return rows;
  }
<<<<<<< HEAD
}
=======
}
>>>>>>> 1122f1733359823ff46d03f4d1558eb6640415ce
