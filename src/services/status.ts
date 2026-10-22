import { daysBetween, todayISO } from '../lib/dates';
import { formatNumber } from '../lib/format';
import type { Asset, FleetData, Schedule, ScheduleStatus, Status } from '../types';

/** A task flips to "Due Soon" once this share of its interval is used. */
export const DUE_SOON_THRESHOLD = 90;

export const STATUS_LABEL: Record<Status, string> = {
  good: 'Good',
  due: 'Due Soon',
  overdue: 'Overdue',
};

const STATUS_RANK: Record<Status, number> = { overdue: 0, due: 1, good: 2 };

export function evaluateSchedule(
  schedule: Schedule,
  asset: Asset,
  today: string = todayISO(),
): ScheduleStatus {
  // Never below 0: a schedule can't sit above the asset's reading, so remaining never exceeds the interval.
  const used = Math.max(
    0,
    schedule.unit === 'days' ? daysBetween(schedule.lastDate, today) : asset.reading - schedule.lastReading,
  );
  const remaining = schedule.interval - used;
  const percent = Math.max(0, (used / schedule.interval) * 100);
  const status: Status =
    remaining < 0 ? 'overdue' : percent >= DUE_SOON_THRESHOLD ? 'due' : 'good';
  return { schedule, asset, used, remaining, percent, status };
}

/** Most urgent first: Overdue → Due Soon → Good, then by share of interval used. */
export function compareUrgency(a: ScheduleStatus, b: ScheduleStatus): number {
  return STATUS_RANK[a.status] - STATUS_RANK[b.status] || b.percent - a.percent;
}

export function evaluateAsset(data: FleetData, asset: Asset, today?: string): ScheduleStatus[] {
  return data.schedules
    .filter((s) => s.assetId === asset.id)
    .map((s) => evaluateSchedule(s, asset, today))
    .sort(compareUrgency);
}

export function evaluateAll(data: FleetData, today?: string): ScheduleStatus[] {
  return data.assets.flatMap((a) => evaluateAsset(data, a, today)).sort(compareUrgency);
}

export function worstStatus(items: ScheduleStatus[]): Status {
  return items[0]?.status ?? 'good';
}

/** "in 6 days" / "340 mi over" */
export function describeRemaining(s: ScheduleStatus): string {
  const amount = formatNumber(Math.abs(s.remaining));
  const unit = s.schedule.unit;
  if (s.remaining < 0) return `${amount} ${unit} over`;
  return `in ${amount} ${unit}`;
}

export function describeInterval(s: Schedule): string {
  return `every ${formatNumber(s.interval)} ${s.unit}`;
}
