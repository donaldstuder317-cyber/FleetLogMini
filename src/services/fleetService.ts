import type { Asset, DeadlineFilter, Fault, FleetData, ReadingUnit, ScheduleStatus, ServiceEntry, Status, TaskType } from '../types';

export interface NewEntryInput {
  assetId: string;
  task: TaskType;
  date: string;
  reading: number;
  partsCost: number;
  notes: string;
  /** Open faults of this asset that the service fixed. */
  faultIds?: string[];
}

export interface NewAssetInput {
  name: string;
  kind: string;
  model: string;
  reading: number;
  unit: ReadingUnit;
}

export interface AssetEditInput {
  name: string;
  kind: string;
  model: string;
  reading: number;
}

/** Task and asset are fixed; the server recalculates the task's schedule. */
export interface EntryEditInput {
  date: string;
  reading: number;
  partsCost: number;
  notes: string;
}

export interface NewFaultInput {
  description: string;
  deadline: boolean;
  cost: number;
}

/** Deadline and cost are sent only while the fault is open (the server locks them once corrected). */
export interface FaultEditInput {
  date: string;
  description: string;
  deadline?: boolean;
  cost?: number;
}

/** Highest logged service reading for an asset (the floor for its reading), or null if none. */
export function maxEntryReading(data: FleetData, assetId: string): number | null {
  const readings = data.entries.filter((e) => e.assetId === assetId).map((e) => e.reading);
  return readings.length ? Math.max(...readings) : null;
}

export function entriesForAsset(data: FleetData, assetId: string): ServiceEntry[] {
  return data.entries
    .filter((e) => e.assetId === assetId)
    .sort((a, b) => b.date.localeCompare(a.date) || b.reading - a.reading);
}

/** Faults for one asset, newest first. */
export function faultsForAsset(data: FleetData, assetId: string): Fault[] {
  return data.faults
    .filter((f) => f.assetId === assetId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function isFaultOpen(fault: Fault): boolean {
  return fault.correctedEntryId === null;
}

/** Open faults for one asset, newest first. */
export function openFaultsForAsset(data: FleetData, assetId: string): Fault[] {
  return faultsForAsset(data, assetId).filter(isFaultOpen);
}

/** Corrected faults for one asset, newest first. */
export function correctedFaultsForAsset(data: FleetData, assetId: string): Fault[] {
  return faultsForAsset(data, assetId).filter((f) => !isFaultOpen(f));
}

/** Date of the service that corrected a fault (undefined while open). */
export function correctedOn(data: FleetData, fault: Fault): string | undefined {
  return data.entries.find((e) => e.id === fault.correctedEntryId)?.date;
}

/** Faults a service entry fixed. */
export function faultsCorrectedBy(data: FleetData, entryId: string): Fault[] {
  return data.faults.filter((f) => f.correctedEntryId === entryId);
}

/** Assets with at least one open DEADLINE fault. */
export function deadlinedAssetIds(data: FleetData): Set<string> {
  return new Set(data.faults.filter((f) => f.deadline && isFaultOpen(f)).map((f) => f.assetId));
}

export function isAssetDeadlined(data: FleetData, assetId: string): boolean {
  return data.faults.some((f) => f.assetId === assetId && f.deadline && isFaultOpen(f));
}

export type StatusFilter = 'all' | Status;

export function matchesStatus(filter: StatusFilter, status: Status): boolean {
  return filter === 'all' || filter === status;
}

export function matchesDeadline(filter: DeadlineFilter, deadlined: boolean): boolean {
  return filter === 'all' || (filter === 'yes') === deadlined;
}

export type AssetSort = 'urgent' | 'name';

const RANK: Record<Status, number> = { overdue: 0, due: 1, good: 2 };

/** Most urgent: deadlined assets first, then Overdue → Due Soon → Good, then the most-used interval. */
export function sortAssetSummaries<T extends { asset: Asset; status: Status; urgent?: ScheduleStatus; deadlined: boolean }>(
  list: T[],
  sort: AssetSort,
): T[] {
  return [...list].sort((a, b) =>
    sort === 'name'
      ? a.asset.name.localeCompare(b.asset.name)
      : Number(b.deadlined) - Number(a.deadlined) ||
        RANK[a.status] - RANK[b.status] ||
        (b.urgent?.percent ?? 0) - (a.urgent?.percent ?? 0),
  );
}

// ── "Faults corrected" picker: an empty list is None ─────────────────────────

/** All ↔ none: All clears when every fault is already picked, otherwise picks every fault. */
export function toggleAllFaults(selected: string[], faults: Pick<Fault, 'id'>[]): string[] {
  return faults.length > 0 && selected.length === faults.length ? [] : faults.map((f) => f.id);
}

/** Adds or removes one fault, keeping the faults' own order. */
export function toggleFault(selected: string[], faults: Pick<Fault, 'id'>[], id: string): string[] {
  const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
  return faults.map((f) => f.id).filter((x) => next.includes(x));
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
