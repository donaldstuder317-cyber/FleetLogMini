import { buildSeedData } from '../../src/data/seed';
import { buildCsv, selectEntries, toRows } from '../../src/services/exportService';

const data = buildSeedData();

describe('CSV export', () => {
  it('has the required headers and one row per service', () => {
    const entries = selectEntries(data, { assetIds: [], from: '2000-01-01', to: '2999-12-31' });
    const csv = buildCsv(toRows(data, entries));
    const lines = csv.trim().split('\r\n');
    expect(lines[0]).toBe('date,asset,task,odometer,parts_cost,notes');
    expect(lines).toHaveLength(entries.length + 1);
  });

  it('escapes commas and quotes', () => {
    const csv = buildCsv([
      { date: '2026-01-01', asset: 'A', task: 'Oil change', odometer: 1, parts_cost: 2, notes: 'say "hi", ok' },
    ]);
    expect(csv).toContain('"say ""hi"", ok"');
  });

  it('filters by asset and date range', () => {
    const entries = selectEntries(data, { assetIds: ['van-4'], from: '2000-01-01', to: '2999-12-31' });
    expect(entries.every((e) => e.assetId === 'van-4')).toBe(true);
    expect(selectEntries(data, { assetIds: [], from: '2999-01-01', to: '2999-12-31' })).toHaveLength(0);
  });
});
