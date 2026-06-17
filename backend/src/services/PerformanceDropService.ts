import { prisma } from '../utils/prisma.js';
import { avg, dropPct } from './metricUtils.js';

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

// Tipagem para auxiliar no autocompletar da resposta da IA
interface IAResult {
  athlete_id: string;
  is_anomaly: boolean;
  message: string;
}

export class PerformanceDropService {
  static async recalculate() {
    // 1. Inativa alertas antigos
    await prisma.alert.updateMany({ where: { active: true }, data: { active: false } });
    
    // 2. Busca o histórico de atletas
    const athletes = await prisma.athlete.findMany({ 
        include: { performances: { orderBy: { startDate: 'asc' } } } 
    });

    const batchPayload: any[] = [];
    const baseAverages = new Map<string, number>(); 

    // 3. Monta o payload GIGANTE com todos os atletas
    for (const athlete of athletes) {
      if (athlete.performances.length < 4) continue;
      
      const current = athlete.performances.at(-1)!;
      const historicalData = athlete.performances.slice(0, -1);
      
      for (const metric of metrics) {
        const currentValue = Number(current[metric.field] ?? 0);
        const historyValues = historicalData.map(p => Number(p[metric.field] ?? 0));
        
        if (currentValue <= 0 || historyValues.length < 3) continue;

        const compositeId = `${athlete.id}::${metric.field}`;
        
        batchPayload.push({
          athlete_id: compositeId,
          history: historyValues,
          current: currentValue
        });

        baseAverages.set(compositeId, avg(historyValues));
      }
    }

    if (batchPayload.length === 0) return [];

    let anomalyResults: IAResult[] = [];
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    // 4. INTEGRAÇÃO COM A INTELIGÊNCIA ARTIFICIAL
    try {
      const response = await fetch('http://127.0.0.1:8000/detect-anomaly/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athletes: batchPayload }),
        signal: controller.signal
      });
      
      clearTimeout(timeout);

      if (!response.ok) {
         console.error(`[IA Error] Status ${response.status} retornado pelo serviço Python.`);
         return [];
      } 
      
      const data = await response.json();
      anomalyResults = data.results || [];
      
    } catch (error) {
      clearTimeout(timeout);
      console.error(`[IA Offline ou Timeout] Não foi possível conectar. Ignorando cálculo...`, error);
      return []; 
    }

    // 5. Processa as respostas para salvar no banco
    const alertsToCreateData = [];

for (const result of anomalyResults) {
  if (!result.is_anomaly) continue;

  const [athleteId, metricField] = result.athlete_id.split('::');
  const metricDef = metrics.find(m => m.field === metricField);
  
  if (!metricDef) continue;

  const payloadItem = batchPayload.find(p => p.athlete_id === result.athlete_id);
  if (!payloadItem) continue;

  const baseAvg = baseAverages.get(result.athlete_id) ?? 0;
  const currentValue = payloadItem.current;
  
  // Calcula a variação percentual real (positiva para aumento, negativa para queda)
  const percentChange = ((currentValue - baseAvg) / baseAvg) * 100;
  const isSpike = percentChange > 0;
  const absPercent = Math.abs(percentChange);
  
  alertsToCreateData.push({
    athleteId: athleteId,
    metric: metricDef.label,
    severity: absPercent > 25 ? 'high' : 'medium', // Usa o valor absoluto para severidade
    dropPercent: percentChange, // Salva o valor real (positivo ou negativo)
    historical: baseAvg,
    recent: currentValue,
    message: `Performance Anomaly Detected: An anomalous ${isSpike ? 'Peak' : 'Drop'} of ${metricDef.label}. ${isSpike ? 'Raise' : 'Reduction'} of ${absPercent.toFixed(0)}% in relation to the isolated pattern of the athlete.`,
  });
}

    // 6. Insere no PostgreSQL usando createMany (MUITO mais rápido que Promise.all)
    if (alertsToCreateData.length > 0) {
      await prisma.alert.createMany({ data: alertsToCreateData });
    }

    return alertsToCreateData;
  }

  static async list() {
    // Nota: Removido o "(prisma as any).performanceAlert" e padronizado para "prisma.alert" 
    // conforme usado no updateMany acima. Certifique-se de que o nome no schema.prisma está assim!
    const rows = await prisma.alert.findMany({ 
      orderBy: { createdAt: 'desc' }, 
      take: 100 
    }).catch(() => []);
    
    return rows;
  }
}