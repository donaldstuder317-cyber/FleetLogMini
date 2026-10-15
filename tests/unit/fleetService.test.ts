import { buildSeedData } from '../../src/data/seed';
import { addServiceEntry, entriesForAsset } from '../../src/services/fleetService';
import { evaluateAsset } from '../../src/services/status';
import { validateCost, validateDateRange, validateReading } from '../../src/services/validation';

describe('logging a service', () => {
  it('resets the schedule so Truck 12 oil change becomes Good', () => {
    const seed = buildSeedData();
    const { data } = addServiceEntry(seed, {
      assetId: 'truck-12',
      task: 'Oil change',
      date: '2026-10-15',
      reading: 48210,
      partsCost: 90,
      notes: '',
    });
    const asset = data.assets.find((a) => a.id === 'truck-12')!;
    const oil = evaluateAsset(data, asset).find((s) => s.schedule.task === 'Oil change')!;
    expect(oil.status).toBe('good');
  });

  it('puts the new entry at the top of history', () => {
    const { data, entry } = addServiceEntry(buildSeedData(), {
      assetId: 'truck-12', task: 'Brakes', date: '2099-01-01', reading: 49000, partsCost: 0, notes: '',
    });
    expect(entriesForAsset(data, 'truck-12')[0].id).toBe(entry.id);
  });

  it('rejects a reading below the last one', () => {
    expect(() =>
      addServiceEntry(buildSeedData(), {
        assetId: 'truck-12', task: 'Oil change', date: '2026-10-15', reading: 40000, partsCost: 0, notes: '',
      }),
    ).toThrow();
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
    expect(validateDateRange('2026-05-01', '2026-01-01')).toBe('Start date must be before end date');
  });
});
