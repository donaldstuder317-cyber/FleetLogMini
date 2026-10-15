import { buildSeedData } from '../data/seed';
import type { FleetData } from '../types';

export const STORAGE_KEY = 'fleetlog-mini:v1';

export function loadData(): FleetData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FleetData;
      if (Array.isArray(parsed.assets) && Array.isArray(parsed.schedules)) {
        return { ...parsed, entries: parsed.entries ?? [], faults: parsed.faults ?? [] };
      }
    }
  } catch {
    /* corrupted or unavailable storage → fall through to seed data */
  }
  const seed = buildSeedData();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  } catch {
    /* ignore: app still works in memory */
  }
  return seed;
}

/** Throws if the data could not be persisted (quota, private mode, …). */
export function saveData(data: FleetData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
