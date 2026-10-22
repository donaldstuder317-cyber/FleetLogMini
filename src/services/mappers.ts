import type { Tables } from '../types/database';
import type {
  Asset,
  Fault,
  IntervalUnit,
  ReadingUnit,
  Schedule,
  ScheduledTask,
  ServiceEntry,
  TaskType,
} from '../types';

/** Pure snake_case row -> camelCase app type mappers. */

export function toAsset(row: Tables<'assets'>): Asset {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    model: row.model,
    reading: Number(row.reading),
    unit: row.reading_unit as ReadingUnit,
  };
}

export function toSchedule(row: Tables<'schedules'>): Schedule {
  return {
    id: row.id,
    assetId: row.asset_id,
    task: row.task as ScheduledTask,
    interval: Number(row.interval_value),
    unit: row.interval_unit as IntervalUnit,
    lastReading: Number(row.last_reading),
    lastDate: row.last_date,
  };
}

export function toEntry(row: Tables<'service_entries'>): ServiceEntry {
  return {
    id: row.id,
    assetId: row.asset_id,
    task: row.task as TaskType,
    date: row.service_date,
    reading: Number(row.reading),
    partsCost: Number(row.parts_cost),
    notes: row.notes ?? '',
  };
}

export function toFault(row: Tables<'faults'>): Fault {
  return {
    id: row.id,
    assetId: row.asset_id,
    date: row.fault_date,
    description: row.description,
    deadline: row.deadline,
    cost: Number(row.cost),
    correctedEntryId: row.corrected_entry_id,
  };
}
