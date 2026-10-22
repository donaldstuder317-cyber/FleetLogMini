import { buildSeedData } from '../../src/data/seed';
import { evaluateAll, evaluateAsset, describeRemaining } from '../../src/services/status';

const data = buildSeedData();
const byId = (id: string) => data.assets.find((a) => a.id === id)!;

describe('schedule status', () => {
  it('flags Truck 12 oil change as Overdue by 340 mi', () => {
    const oil = evaluateAsset(data, byId('truck-12')).find((s) => s.schedule.task === 'Oil change')!;
    expect(oil.status).toBe('overdue');
    expect(oil.remaining).toBe(-340);
    expect(describeRemaining(oil)).toBe('340 mi over');
  });

  it('flips to Due Soon at 90% of the interval', () => {
    const van = evaluateAsset(data, byId('van-4')).find((s) => s.schedule.task === 'Tire rotation')!;
    expect(van.status).toBe('due');
    expect(van.remaining).toBe(12);
  });

  it('seeded fleet has 1 Overdue and 2 Due Soon schedules', () => {
    const all = evaluateAll(data);
    expect(all.filter((s) => s.status === 'overdue')).toHaveLength(1);
    expect(all.filter((s) => s.status === 'due')).toHaveLength(2);
  });

  it('sorts Overdue first', () => {
    expect(evaluateAll(data)[0].asset.name).toBe('Truck 12');
  });
});

describe('lowered reading', () => {
  it('never shows more than the interval remaining when the reading is below the last-done point', () => {
    const asset = { ...byId('truck-12'), reading: 48000 };
    const oil = { ...data.schedules.find((s) => s.assetId === 'truck-12' && s.task === 'Oil change')!, lastReading: 50000 };
    const [status] = evaluateAsset({ ...data, assets: [asset], schedules: [oil] }, asset);
    expect(status.remaining).toBe(oil.interval);
    expect(status.used).toBe(0);
    expect(status.status).toBe('good');
  });
});
