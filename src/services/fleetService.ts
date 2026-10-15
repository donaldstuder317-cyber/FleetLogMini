import { newId } from '../lib/format';
import { todayISO } from '../lib/dates';
import type {
  Asset,
  FleetData,
  ReadingUnit,
  Schedule,
  ScheduledTask,
  ServiceEntry,
  TaskType,
} from '../types';

export interface NewEntryInput {
  assetId: string;
  task: TaskType;
  date: string;
  reading: number;
  partsCost: number;
  notes: string;
}

export interface NewAssetInput {
  name: string;
  kind: string;
  model: string;
  reading: number;
  unit: ReadingUnit;
}

const DEFAULT_SCHEDULES: Record<ReadingUnit, Array<[ScheduledTask, number, Schedule['unit']]>> = {
  mi: [
    ['Oil change', 5000, 'mi'],
    ['Tire rotation', 8000, 'mi'],
    ['Brakes', 30000, 'mi'],
    ['Inspection', 365, 'days'],
  ],
  hrs: [
    ['Oil change', 250, 'hrs'],
    ['Inspection', 90, 'days'],
  ],
};

/** Records a service, bumps the asset reading and resets the matching schedule. */
export function addServiceEntry(data: FleetData, input: NewEntryInput): {
  data: FleetData;
  entry: ServiceEntry;
} {
  const asset = data.assets.find((a) => a.id === input.assetId);
  if (!asset) throw new Error('Asset not found');
  if (input.reading < asset.reading) throw new Error('Reading is lower than the last reading');

  const entry: ServiceEntry = { id: newId('svc'), ...input };
  return {
    entry,
    data: {
      ...data,
      entries: [...data.entries, entry],
      assets: data.assets.map((a) => (a.id === asset.id ? { ...a, reading: input.reading } : a)),
      schedules: data.schedules.map((s) =>
        s.assetId === asset.id && s.task === input.task
          ? { ...s, lastReading: input.reading, lastDate: input.date }
          : s,
      ),
    },
  };
}

export function updateReading(data: FleetData, assetId: string, reading: number): FleetData {
  return {
    ...data,
    assets: data.assets.map((a) => (a.id === assetId ? { ...a, reading } : a)),
  };
}

export function addAsset(data: FleetData, input: NewAssetInput): { data: FleetData; asset: Asset } {
  const asset: Asset = { id: newId('asset'), ...input };
  const today = todayISO();
  const schedules: Schedule[] = DEFAULT_SCHEDULES[input.unit].map(([task, interval, unit]) => ({
    id: newId('sch'),
    assetId: asset.id,
    task,
    interval,
    unit,
    lastReading: input.reading,
    lastDate: today,
  }));
  return {
    asset,
    data: { ...data, assets: [...data.assets, asset], schedules: [...data.schedules, ...schedules] },
  };
}

export function reportFault(data: FleetData, assetId: string, description: string): FleetData {
  return {
    ...data,
    faults: [...data.faults, { id: newId('fault'), assetId, date: todayISO(), description }],
  };
}

export function entriesForAsset(data: FleetData, assetId: string): ServiceEntry[] {
  return data.entries
    .filter((e) => e.assetId === assetId)
    .sort((a, b) => b.date.localeCompare(a.date) || b.reading - a.reading);
}

/** Total parts cost per month for the last `months` months (oldest → newest). */
export function monthlyPartsCost(
  entries: ServiceEntry[],
  months = 6,
  now: Date = new Date(),
): Array<{ key: string; label: string; total: number }> {
  const buckets = Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      total: 0,
    };
  });
  for (const e of entries) {
    const bucket = buckets.find((b) => e.date.startsWith(b.key));
    if (bucket) bucket.total += e.partsCost;
  }
  return buckets;
}
