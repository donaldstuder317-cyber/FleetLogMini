import type { ScheduleStatus, TaskType } from '../types';

export const MILES_PER_HOUR_RATIO = 20; // 500 mi ≙ 25 hrs

export interface AlertFilters {
  days: number;
  miles: number;
  assetId: string; // 'all' or an asset id
  task: TaskType | 'all';
}

export const DEFAULT_ALERT_FILTERS: AlertFilters = {
  days: 30,
  miles: 500,
  assetId: 'all',
  task: 'all',
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

export function filterAlerts(all: ScheduleStatus[], f: AlertFilters): ScheduleStatus[] {
  return all.filter(
    (s) =>
      isInWindow(s, f) &&
      (f.assetId === 'all' || s.asset.id === f.assetId) &&
      (f.task === 'all' || s.schedule.task === f.task),
  );
}
