import { buildSeedData } from '../../src/data/seed';
import {
  deadlinedAssetIds,
  entriesForAsset,
  correctedFaultsForAsset,
  correctedOn,
  faultsCorrectedBy,
  faultsForAsset,
  isAssetDeadlined,
  matchesDeadline,
  matchesStatus,
  maxEntryReading,
  monthlyPartsCost,
  openFaultsForAsset,
  sortAssetSummaries,
  toggleAllFaults,
  toggleFault,
} from '../../src/services/fleetService';
import type { Fault } from '../../src/types';
import { evaluateAsset } from '../../src/services/status';
import { validateCost, validateDateRange, validateReading } from '../../src/services/validation';

describe('service history', () => {
  it('sorts an asset history newest first', () => {
    const seed = buildSeedData();
    seed.entries.push({
      id: 'new', assetId: 'truck-12', task: 'Brakes', date: '2099-01-01', reading: 49000, partsCost: 0, notes: '',
    });
    expect(entriesForAsset(seed, 'truck-12')[0].id).toBe('new');
    expect(entriesForAsset(seed, 'van-4').every((e) => e.assetId === 'van-4')).toBe(true);
  });

  it('turns Truck 12 oil change Good once the server schedule resets', () => {
    const seed = buildSeedData();
    // what the server does on log_service_entry, reflected back by a re-fetch
    const data = {
      ...seed,
      assets: seed.assets.map((a) => (a.id === 'truck-12' ? { ...a, reading: 48210 } : a)),
      schedules: seed.schedules.map((s) =>
        s.assetId === 'truck-12' && s.task === 'Oil change' ? { ...s, lastReading: 48210 } : s,
      ),
    };
    const oil = evaluateAsset(data, data.assets[0]).find((s) => s.schedule.task === 'Oil change')!;
    expect(oil.status).toBe('good');
  });

  it('buckets parts cost by month', () => {
    const buckets = monthlyPartsCost(
      [
        { id: '1', assetId: 'a', task: 'Brakes', date: '2026-10-02', reading: 1, partsCost: 10, notes: '' },
        { id: '2', assetId: 'a', task: 'Brakes', date: '2026-10-20', reading: 2, partsCost: 5.5, notes: '' },
      ],
      3,
      new Date(2026, 9, 17),
    );
    expect(buckets.map((b) => b.key)).toEqual(['2026-08', '2026-09', '2026-10']);
    expect(buckets[2].total).toBe(15.5);
  });
});

describe('faultsForAsset', () => {
  it('filters to the asset and sorts newest first', () => {
    const seed = buildSeedData();
    const open = { deadline: false, cost: 0, correctedEntryId: null };
    seed.faults.push(
      { id: 'f1', assetId: 'van-4', date: '2026-01-01', description: 'old', ...open },
      { id: 'f2', assetId: 'van-4', date: '2026-03-01', description: 'new', ...open },
      { id: 'f3', assetId: 'truck-12', date: '2026-05-01', description: 'other', ...open },
    );
    expect(faultsForAsset(seed, 'van-4').map((f) => f.id)).toEqual(['f2', 'f1']);
    expect(faultsForAsset(seed, 'excavator-3')).toEqual([]);
  });
});

describe('maxEntryReading', () => {
  it('returns the highest logged reading for the asset, or null with no entries', () => {
    const seed = buildSeedData();
    expect(maxEntryReading(seed, 'truck-12')).toBe(44000);
    seed.entries = seed.entries.filter((e) => e.assetId !== 'van-4');
    expect(maxEntryReading(seed, 'van-4')).toBeNull();
  });
});

describe('validation', () => {
  it('shows the last reading in the odometer error', () => {
    expect(validateReading('40000', 48210)).toBe("Odometer can't be lower than last reading (48,210)");
    expect(validateReading('48,210', 48210)).toBeNull();
  });
  it('validates cost and date range', () => {
    expect(validateCost('')).toBeNull();
    expect(validateCost('-3')).toBe('Enter a valid cost');
    expect(validateCost('12.5')).toBeNull();
    expect(validateCost('$1,200.99')).toBeNull();
    expect(validateCost('1.999')).toBe('Enter a valid cost');
    expect(validateCost('abc')).toBe('Enter a valid cost');
    expect(validateCost('100000000')).toBe('Enter a valid cost');
    expect(validateDateRange('2026-05-01', '2026-01-01')).toBe('Start date must be before end date');
  });
});

describe('faults', () => {
  const fault = (id: string, assetId: string, extra: Partial<Fault> = {}): Fault => ({
    id, assetId, date: '2026-10-01', description: id, deadline: false, cost: 0, correctedEntryId: null, ...extra,
  });

  it('an asset is deadlined only while it has an open DEADLINE fault', () => {
    const data = buildSeedData();
    data.faults = [
      fault('f1', 'truck-12', { deadline: true }),
      fault('f2', 'truck-12', { deadline: true, correctedEntryId: 'e1' }),
      fault('f3', 'van-4', { deadline: true, correctedEntryId: 'e4' }),
      fault('f4', 'van-4'),
    ];
    expect([...deadlinedAssetIds(data)]).toEqual(['truck-12']);
    expect(isAssetDeadlined(data, 'truck-12')).toBe(true);
    expect(isAssetDeadlined(data, 'van-4')).toBe(false);

    data.faults[0].correctedEntryId = 'e2'; // last open DEADLINE fault fixed
    expect(isAssetDeadlined(data, 'truck-12')).toBe(false);
  });

  it('splits open faults from the ones an entry corrected', () => {
    const data = buildSeedData();
    data.faults = [fault('f1', 'truck-12'), fault('f2', 'truck-12', { correctedEntryId: 'e1' }), fault('f3', 'van-4')];
    expect(openFaultsForAsset(data, 'truck-12').map((f) => f.id)).toEqual(['f1']);
    expect(faultsCorrectedBy(data, 'e1').map((f) => f.id)).toEqual(['f2']);
    expect(correctedFaultsForAsset(data, 'truck-12').map((f) => f.id)).toEqual(['f2']);
    expect(correctedOn(data, data.faults[1])).toBe(data.entries.find((e) => e.id === 'e1')!.date);
    expect(correctedOn(data, data.faults[0])).toBeUndefined();
  });
});

describe('faults corrected picker', () => {
  const faults = [{ id: 'f1' }, { id: 'f2' }, { id: 'f3' }];

  it('All picks every fault, and clears when everything is already picked', () => {
    expect(toggleAllFaults([], faults)).toEqual(['f1', 'f2', 'f3']);
    expect(toggleAllFaults(['f2'], faults)).toEqual(['f1', 'f2', 'f3']);
    expect(toggleAllFaults(['f1', 'f2', 'f3'], faults)).toEqual([]);
    expect(toggleAllFaults([], [])).toEqual([]);
  });

  it('toggles one fault and keeps list order', () => {
    expect(toggleFault([], faults, 'f3')).toEqual(['f3']);
    expect(toggleFault(['f3'], faults, 'f1')).toEqual(['f1', 'f3']);
    expect(toggleFault(['f1', 'f3'], faults, 'f1')).toEqual(['f3']);
  });
});

describe('dashboard deadline filter and sort', () => {
  const summaries = (deadlined: string[]) => {
    const data = buildSeedData();
    return data.assets.map((asset) => {
      const schedules = evaluateAsset(data, asset);
      const rank = { overdue: 0, due: 1, good: 2 } as const;
      const status = schedules.reduce<'good' | 'due' | 'overdue'>((w, s) => (rank[s.status] < rank[w] ? s.status : w), 'good');
      return { asset, urgent: schedules[0], status, deadlined: deadlined.includes(asset.id) };
    });
  };

  it('matchesStatus: All matches everything, otherwise exact', () => {
    expect(matchesStatus('all', 'good')).toBe(true);
    expect(matchesStatus('overdue', 'overdue')).toBe(true);
    expect(matchesStatus('overdue', 'due')).toBe(false);
  });

  it('matchesDeadline: All / Yes / No', () => {
    expect([matchesDeadline('all', true), matchesDeadline('all', false)]).toEqual([true, true]);
    expect([matchesDeadline('yes', true), matchesDeadline('yes', false)]).toEqual([true, false]);
    expect([matchesDeadline('no', true), matchesDeadline('no', false)]).toEqual([false, true]);
  });

  it('Most urgent puts deadlined assets first, then the status order', () => {
    expect(sortAssetSummaries(summaries([]), 'urgent').map((s) => s.asset.name)[0]).toBe('Truck 12');
    const sorted = sortAssetSummaries(summaries(['excavator-3']), 'urgent').map((s) => s.asset.name);
    expect(sorted[0]).toBe('Excavator 3');
    expect(sorted[1]).toBe('Truck 12');
  });

  it('Name sort ignores DEADLINE', () => {
    expect(sortAssetSummaries(summaries(['van-4']), 'name').map((s) => s.asset.name)).toEqual(['Excavator 3', 'Truck 12', 'Van 4']);
  });
});
