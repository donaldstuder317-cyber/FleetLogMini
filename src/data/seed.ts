import { addDays, todayISO } from '../lib/dates';
import type { FleetData } from '../types';

/**
 * Three demo assets. Dates are relative to "today" so the demo always shows
 * 1 Overdue (Truck 12 oil, 340 mi over) and 2 Due Soon items.
 */
export function buildSeedData(): FleetData {
  const today = todayISO();
  const ago = (days: number) => addDays(today, -days);

  return {
    assets: [
      { id: 'truck-12', name: 'Truck 12', kind: 'Truck', model: 'Ford F-650', reading: 48210, unit: 'mi' },
      { id: 'van-4', name: 'Van 4', kind: 'Van', model: 'Mercedes Sprinter 2500', reading: 61300, unit: 'mi' },
      { id: 'excavator-3', name: 'Excavator 3', kind: 'Equipment', model: 'CAT 308', reading: 1230, unit: 'hrs' },
    ],
    schedules: [
      { id: 's1', assetId: 'truck-12', task: 'Oil change', interval: 5000, unit: 'mi', lastReading: 42870, lastDate: ago(160) },
      { id: 's2', assetId: 'truck-12', task: 'Tire rotation', interval: 8000, unit: 'mi', lastReading: 44000, lastDate: ago(120) },
      { id: 's3', assetId: 'truck-12', task: 'Brakes', interval: 30000, unit: 'mi', lastReading: 30000, lastDate: ago(300) },
      { id: 's4', assetId: 'truck-12', task: 'Inspection', interval: 365, unit: 'days', lastReading: 40000, lastDate: ago(120) },
      { id: 's5', assetId: 'van-4', task: 'Oil change', interval: 7500, unit: 'mi', lastReading: 57000, lastDate: ago(90) },
      { id: 's6', assetId: 'van-4', task: 'Tire rotation', interval: 180, unit: 'days', lastReading: 52000, lastDate: ago(168) },
      { id: 's7', assetId: 'van-4', task: 'Inspection', interval: 365, unit: 'days', lastReading: 56000, lastDate: ago(100) },
      { id: 's8', assetId: 'excavator-3', task: 'Oil change', interval: 250, unit: 'hrs', lastReading: 1000, lastDate: ago(45) },
      { id: 's9', assetId: 'excavator-3', task: 'Inspection', interval: 90, unit: 'days', lastReading: 1000, lastDate: ago(30) },
    ],
    entries: [
      { id: 'e1', assetId: 'truck-12', task: 'Oil change', date: ago(160), reading: 42870, partsCost: 86.5, notes: '15W-40, new filter' },
      { id: 'e2', assetId: 'truck-12', task: 'Tire rotation', date: ago(120), reading: 44000, partsCost: 0, notes: 'Rotated and balanced' },
      { id: 'e3', assetId: 'truck-12', task: 'Inspection', date: ago(120), reading: 44000, partsCost: 35, notes: 'Annual DOT inspection passed' },
      { id: 'e4', assetId: 'van-4', task: 'Oil change', date: ago(90), reading: 57000, partsCost: 112.25, notes: 'Synthetic' },
      { id: 'e5', assetId: 'van-4', task: 'Tire rotation', date: ago(168), reading: 52000, partsCost: 0, notes: '' },
      { id: 'e6', assetId: 'excavator-3', task: 'Oil change', date: ago(45), reading: 1000, partsCost: 210.8, notes: 'Hydraulic filter also replaced' },
      { id: 'e7', assetId: 'excavator-3', task: 'Inspection', date: ago(30), reading: 1000, partsCost: 0, notes: 'No issues found' },
    ],
    faults: [],
  };
}
