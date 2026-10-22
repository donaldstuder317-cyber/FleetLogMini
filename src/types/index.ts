export const TASK_TYPES = ['Oil change', 'Brakes', 'Tire rotation', 'Inspection', 'Other'] as const;
export type TaskType = (typeof TASK_TYPES)[number];
/** Tasks that have a recurring schedule ("Other" never does). */
export type ScheduledTask = Exclude<TaskType, 'Other'>;

export const ASSET_KINDS = ['Truck', 'Van', 'Trailer', 'Equipment', 'Other'];

export type ReadingUnit = 'mi' | 'hrs';
export type IntervalUnit = ReadingUnit | 'days';
export type Status = 'good' | 'due' | 'overdue';
/** Dashboard / Alerts filter on an asset's DEADLINE state. */
export type DeadlineFilter = 'all' | 'yes' | 'no';

export interface Asset {
  id: string;
  name: string;
  kind: string;
  model: string;
  /** Current odometer (mi) or engine hours (hrs). */
  reading: number;
  unit: ReadingUnit;
}

export interface Schedule {
  id: string;
  assetId: string;
  task: ScheduledTask;
  interval: number;
  unit: IntervalUnit;
  /** Odometer / hours when the task was last done. */
  lastReading: number;
  /** ISO date (yyyy-mm-dd) when the task was last done. */
  lastDate: string;
}

export interface ServiceEntry {
  id: string;
  assetId: string;
  task: TaskType;
  date: string;
  reading: number;
  partsCost: number;
  notes: string;
}

export interface Fault {
  id: string;
  assetId: string;
  date: string;
  description: string;
  /** DEADLINE: the asset is out of service while this fault is open. */
  deadline: boolean;
  cost: number;
  /** Service entry that fixed it; null while the fault is open. Cost and deadline are locked once set. */
  correctedEntryId: string | null;
}

export interface FleetData {
  assets: Asset[];
  schedules: Schedule[];
  entries: ServiceEntry[];
  faults: Fault[];
}

export interface ScheduleStatus {
  schedule: Schedule;
  asset: Asset;
  /** Miles / hours / days consumed since the last service. */
  used: number;
  /** Negative when overdue. */
  remaining: number;
  /** Interval used, 0+ (can exceed 100 when overdue). */
  percent: number;
  status: Status;
}
