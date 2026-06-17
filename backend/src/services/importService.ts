import fs from 'node:fs';
import csv from 'csv-parser';
import * as XLSX from 'xlsx';
import { prisma } from '../utils/prisma.js';
import { AppError } from '../middlewares/errorHandler.js';
import { normalizeKey, toDate, toNumber, toText } from '../utils/parse.js';
import { classifyAthletes } from './analyticsService.js';

const requiredCanonical = ['athleteId', 'startDate'];

const columnAliases: Record<string, string[]> = {
  athleteId: ['Athlete ID', 'Player ID', 'Player', 'Athlete'],
  position: ['Athlete Position', 'Position'],
  groups: ['Athlete Groups', 'Group', 'Team Group'],
  profile: ['Athlete Profile', 'Profile'], // Adicionado para mapear o profile
  startDate: ['Start Date', 'Date', 'Session Date'],
  startTime: ['Start Time'],
  startTimeSeconds: ['Start Time (s)'],
  endTimeSeconds: ['End Time (s)'],
  weekStartDate: ['Week Start Date'],
  monthStartDate: ['Month Start Date'],
  segmentName: ['Segment Name', 'Period', 'Session Segment'],
  durationMins: ['Duration (mins)', 'Duration', 'Minutes'],
  sessionLoad: ['Session Load', 'Training Load'],
  workload: ['Workload', 'Player Load'],
  workloadVolume: ['Workload Volume'],
  workloadIntensity: ['Workload Intensity', 'Relative Intensity'],
  distanceM: ['Distance (m)', 'Total Distance', 'Distance'],
  metresPerMinute: ['Metres per Minute (m)', 'Meters per Minute', 'm/min'],
  highIntensityRunningM: ['High Intensity Running (m)', 'High Intensity Running'],
  noOfHighIntensityEvents: ['No. of High Intensity Events'],
  sprintDistanceM: ['Sprint Distance (m)', 'Sprint Distance'],
  rawTopSpeedKph: ['Raw Top Speed (kph)'],
  noOfSprints: ['No. of Sprints', 'Sprints'],
  topSpeedKph: ['Top Speed (kph)', 'Top Speed'],
  avgSpeedKph: ['Avg Speed (kph)', 'Average Speed'],
  accelerations: ['Accelerations'],
  decelerations: ['Decelerations'],
  percentageOfMaxSpeed: ['Percentage of Max Speed'],
  percentageOfRawMaxSpeedKph: ['Percentage of Raw Max Speed KPH'],
  ninetyPctOfMaxSpeedEvents: ['90% of Max Speed Events'],
  ninetyPctOfMaxSpeedDistanceM: ['90% of Max Speed Distance (m)'],
  ninetyPctOfMaxSpeedDurationSecs: ['90% of Max Speed Duration (secs)'],
  ninetyPctOfRawMaxSpeedEvents: ['90% of Raw Max Speed Events'],
  ninetyPctOfRawMaxSpeedDistanceM: ['90% of Raw Max Speed Distance (m)'],
  ninetyPctOfRawMaxSpeedDurationSecs: ['90% of Raw Max Speed Duration (secs)'],
};

const capitalize = (str: string) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const validateColumns = (rows: any[]) => {
  if (!rows.length) return requiredCanonical;
  const header = Object.keys(rows[0]);
  return requiredCanonical.filter(c => !header.some(h => normalizeKey(h) === c));
};

const readCsv = (path: string): Promise<any[]> => new Promise((resolve, reject) => {
  const results: any[] = [];
  fs.createReadStream(path).pipe(csv()).on('data', (data) => results.push(data)).on('end', () => resolve(results)).on('error', reject);
});

const readXlsx = (path: string) => {
  console.log('XLSX:', Object.keys(XLSX));

  const wb = XLSX.readFile(path);
  return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
};

const mapRow = (row: any) => {
  const data: Record<string, any> = {};
  for (const [key, aliases] of Object.entries(columnAliases)) {
    const found = Object.keys(row).find(k => aliases.map(normalizeKey).includes(normalizeKey(k)));
    data[key] = found ? row[found] : null;
  }
  if (!data.athleteId || !data.startDate) return null;

  return {
    athlete: { 
        id: toText(data.athleteId), 
        position: toText(data.position), 
        groups: toText(data.groups),
        profile: toText(data.profile) // Agora o profile existe aqui
    },
    performance: {
      athleteId: toText(data.athleteId),
      startDate: toDate(data.startDate),
      segmentName: toText(data.segmentName) || 'General',
      durationMins: toNumber(data.durationMins),
      sessionLoad: toNumber(data.sessionLoad),
      workload: toNumber(data.workload),
      distanceM: toNumber(data.distanceM),
      highIntensityRunningM: toNumber(data.highIntensityRunningM),
      sprintDistanceM: toNumber(data.sprintDistanceM),
      topSpeedKph: toNumber(data.topSpeedKph),
      accelerations: toNumber(data.accelerations),
      decelerations: toNumber(data.decelerations),
      noOfSprints: toNumber(data.noOfSprints),
    }
  };
};

export async function importFile(file: Express.Multer.File) {
  const ext = file.originalname.split('.').pop()?.toLowerCase();
  if (!['csv', 'xlsx', 'xls'].includes(ext || '')) throw new AppError(400, 'Invalid format.');

  const rows = ext === 'csv' ? await readCsv(file.path) : readXlsx(file.path);
  const parsed = rows.map(mapRow).filter((x): x is NonNullable<ReturnType<typeof mapRow>> => Boolean(x));
  
  let importedRows = 0;
  let duplicateRows = 0;

  await prisma.$transaction(async tx => {
    for (const item of parsed) {
      const athleteData: any = { ...item.athlete };

      if (athleteData.profile) {
        athleteData.profile = capitalize(athleteData.profile);
      } else {
        delete athleteData.profile; // Remove se for null para evitar erro de Enum
      }

      await tx.athlete.upsert({ 
        where: { id: athleteData.id }, 
        update: athleteData, 
        create: athleteData 
      });
      
      const existing = await tx.performance.findFirst({ 
        where: { athleteId: item.performance.athleteId, startDate: item.performance.startDate } 
      });
      
      if (existing) { duplicateRows += 1; continue; }
      await tx.performance.create({ data: item.performance });
      importedRows += 1;
    }
  }, { timeout: 20000 });

  await classifyAthletes();
  return { importedRows, duplicateRows };
}