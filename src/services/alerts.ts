import type { DeadlineFilter, ScheduleStatus, TaskType } from '../types';
import { matchesDeadline } from './fleetService';

export const MILES_PER_HOUR_RATIO = 20; // 500 mi ≙ 25 hrs

export interface AlertFilters {
  days: number;
  miles: number;
  assetId: string; // 'all' or an asset id
  task: TaskType | 'all';
  deadline: DeadlineFilter;
}

export const DEFAULT_ALERT_FILTERS: AlertFilters = {
  days: 30,
  miles: 500,
  assetId: 'all',
  task: 'all',
  deadline: 'all',
};

/** Overdue items always qualify; otherwise whichever limit (days or mi/hrs) matches first. */
export function isInWindow(s: ScheduleStatus, f: Pick<AlertFilters, 'days' | 'miles'>): boolean {
  if (s.status === 'overdue') return true;
  switch (s.schedule.unit) {
    case 'days':
      return s.remaining <= f.days;
    case 'mi':
      return s.remaining <= f.miles;
    case 'hrs':
      return s.remaining <= f.miles / MILES_PER_HOUR_RATIO;
  }
}

/**
 * `all` comes most-urgent first; `deadlined` = ids of assets with an open DEADLINE fault.
 * Deadlined assets' alerts move to the top, keeping the urgency order within each group (stable sort).
 */
export function filterAlerts(all: ScheduleStatus[], f: AlertFilters, deadlined: Set<string> = new Set()): ScheduleStatus[] {
  return all
    .filter(
      (s) =>
        isInWindow(s, f) &&
        (f.assetId === 'all' || s.asset.id === f.assetId) &&
        (f.task === 'all' || s.schedule.task === f.task) &&
        matchesDeadline(f.deadline, deadlined.has(s.asset.id)),
    )
    .sort((a, b) => Number(deadlined.has(b.asset.id)) - Number(deadlined.has(a.asset.id)));
}
