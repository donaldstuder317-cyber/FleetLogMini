import { buildSeedData } from '../../src/data/seed';
import { DEFAULT_ALERT_FILTERS, filterAlerts } from '../../src/services/alerts';
import { evaluateAll } from '../../src/services/status';

const all = evaluateAll(buildSeedData());

describe('alert window', () => {
  it('default window shows 1 Overdue and 2 Due Soon', () => {
    const list = filterAlerts(all, DEFAULT_ALERT_FILTERS);
    expect(list.map((s) => s.status)).toEqual(['overdue', 'due', 'due']);
  });

  it('a 7-day window hides Van 4 tire rotation but keeps overdue items', () => {
    const list = filterAlerts(all, { ...DEFAULT_ALERT_FILTERS, days: 7 });
    expect(list.some((s) => s.asset.name === 'Van 4')).toBe(false);
    expect(list.some((s) => s.status === 'overdue')).toBe(true);
  });

  it('filters by asset', () => {
    const list = filterAlerts(all, { ...DEFAULT_ALERT_FILTERS, assetId: 'excavator-3' });
    expect(list).toHaveLength(1);
  });
});

describe('deadline filter', () => {
  const deadlined = new Set(['van-4']);

  it('All keeps everything; Yes keeps only deadlined assets; No keeps the rest', () => {
    expect(filterAlerts(all, DEFAULT_ALERT_FILTERS, deadlined)).toHaveLength(3);
    expect(filterAlerts(all, { ...DEFAULT_ALERT_FILTERS, deadline: 'yes' }, deadlined).map((s) => s.asset.id)).toEqual(['van-4']);
    expect(filterAlerts(all, { ...DEFAULT_ALERT_FILTERS, deadline: 'no' }, deadlined).every((s) => s.asset.id !== 'van-4')).toBe(true);
  });

  it('Yes with no deadlined assets is empty', () => {
    expect(filterAlerts(all, { ...DEFAULT_ALERT_FILTERS, deadline: 'yes' })).toEqual([]);
  });
});

describe('deadlined first', () => {
  it('moves deadlined assets to the top, keeping urgency order within each group', () => {
    const plain = filterAlerts(all, DEFAULT_ALERT_FILTERS).map((s) => s.asset.id);
    expect(plain[0]).toBe('truck-12'); // overdue first without DEADLINE
    const sorted = filterAlerts(all, DEFAULT_ALERT_FILTERS, new Set(['excavator-3'])).map((s) => s.asset.id);
    expect(sorted).toEqual(['excavator-3', ...plain.filter((id) => id !== 'excavator-3')]);
  });
});
