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
