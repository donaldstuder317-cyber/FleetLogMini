import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
const from = vi.fn();
vi.mock('../../src/lib/supabase', () => ({ supabase: { rpc: (...a: unknown[]) => rpc(...a), from: (...a: unknown[]) => from(...a) } }));

import * as api from '../../src/services/api';
import { toAsset, toEntry, toFault, toSchedule } from '../../src/services/mappers';

const assetRow = {
  id: 'a1', name: 'Truck 12', kind: 'Truck', model: 'F-650', reading: '48210.0' as unknown as number,
  reading_unit: 'mi', user_id: 'u1', created_at: '', updated_at: '',
};

beforeEach(() => {
  rpc.mockReset();
  from.mockReset();
});

describe('mappers', () => {
  it('maps snake_case rows and coerces numerics', () => {
    expect(toAsset(assetRow)).toEqual({ id: 'a1', name: 'Truck 12', kind: 'Truck', model: 'F-650', reading: 48210, unit: 'mi' });
    expect(
      toSchedule({ id: 's', asset_id: 'a1', task: 'Oil change', interval_value: 5000, interval_unit: 'mi', last_reading: 1, last_date: '2026-01-01', baseline_reading: 0, baseline_date: '2026-01-01', user_id: 'u1' }),
    ).toEqual({ id: 's', assetId: 'a1', task: 'Oil change', interval: 5000, unit: 'mi', lastReading: 1, lastDate: '2026-01-01' });
    expect(
      toEntry({ id: 'e', asset_id: 'a1', task: 'Brakes', service_date: '2026-01-01', reading: 5, parts_cost: '9.50' as unknown as number, notes: '', created_at: '', user_id: 'u1' }),
    ).toMatchObject({ date: '2026-01-01', partsCost: 9.5 });
    expect(
      toFault({
        id: 'f', asset_id: 'a1', fault_date: '2026-01-02', description: 'x', created_at: '', user_id: 'u1',
        deadline: true, cost: '12.50' as unknown as number, corrected_entry_id: null,
      }),
    ).toEqual({ id: 'f', assetId: 'a1', date: '2026-01-02', description: 'x', deadline: true, cost: 12.5, correctedEntryId: null });
  });
});

describe('api', () => {
  it('fetchFleetData loads the four tables', async () => {
    const table = (rows: unknown[]) => {
      const q: Record<string, unknown> = { data: rows, error: null };
      q.order = () => q;
      return { select: () => q };
    };
    from.mockImplementation((name: string) =>
      table(name === 'assets' ? [assetRow] : []),
    );
    const data = await api.fetchFleetData();
    expect(data.assets).toHaveLength(1);
    expect(data.schedules).toEqual([]);
  });

  it('logServiceEntry calls the RPC and maps the row', async () => {
    rpc.mockResolvedValue({
      data: { id: 'e1', asset_id: 'a1', task: 'Brakes', service_date: '2026-10-01', reading: 5, parts_cost: 0, notes: '', created_at: '' },
      error: null,
    });
    const entry = await api.logServiceEntry({ assetId: 'a1', task: 'Brakes', date: '2026-10-01', reading: 5, partsCost: 0, notes: '' });
    expect(rpc).toHaveBeenCalledWith('log_service_entry', {
      p_asset_id: 'a1', p_task: 'Brakes', p_service_date: '2026-10-01', p_reading: 5, p_parts_cost: 0, p_notes: '', p_fault_ids: [],
    });
    expect(entry.id).toBe('e1');
    await api.logServiceEntry({ assetId: 'a1', task: 'Other', date: '2026-10-01', reading: 5, partsCost: 0, notes: '', faultIds: ['f1', 'f2'] });
    expect(rpc.mock.calls[1][1].p_fault_ids).toEqual(['f1', 'f2']);
  });

  it('surfaces server error messages', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'Reading is lower than the last reading' } });
    await expect(
      api.logServiceEntry({ assetId: 'a1', task: 'Brakes', date: '2026-10-01', reading: 1, partsCost: 0, notes: '' }),
    ).rejects.toThrow('Reading is lower than the last reading');
  });

  it('createAsset sends today as the schedule start date', async () => {
    rpc.mockResolvedValue({ data: assetRow, error: null });
    const asset = await api.createAsset({ name: 'Truck 12', kind: 'Truck', model: '', reading: 0, unit: 'mi' });
    expect(rpc.mock.calls[0][0]).toBe('create_asset');
    expect(rpc.mock.calls[0][1].p_last_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(asset.id).toBe('a1');
  });

  it('updateAssetReading and insertFault throw on error', async () => {
    from.mockReturnValue({
      update: () => ({ eq: () => ({ select: () => Promise.resolve({ data: null, error: { message: 'nope' } }) }) }),
      insert: () => Promise.resolve({ error: { message: 'bad' } }),
    });
    await expect(api.updateAssetReading('a1', 5)).rejects.toThrow('nope');
    await expect(api.insertFault('a1', { description: 'x', deadline: false, cost: 0 })).rejects.toThrow('bad');
  });

  it('insertFault sends deadline and cost', async () => {
    let sent: Record<string, unknown> = {};
    from.mockReturnValue({ insert: (v: Record<string, unknown>) => { sent = v; return Promise.resolve({ error: null }); } });
    await api.insertFault('a1', { description: 'Brake line', deadline: true, cost: 120 });
    expect(sent).toMatchObject({ asset_id: 'a1', description: 'Brake line', deadline: true, cost: 120 });
    expect(sent.fault_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  /** from(table).update(values).eq(col, id).select() resolving to `result`; records what was sent. */
  function mockUpdate(result: { data: unknown[] | null; error: { message: string } | null }) {
    const sent: { table?: string; values?: unknown; eq?: unknown[] } = {};
    from.mockImplementation((table: string) => {
      sent.table = table;
      return {
        update: (values: unknown) => {
          sent.values = values;
          return { eq: (...a: unknown[]) => { sent.eq = a; return { select: () => Promise.resolve(result) }; } };
        },
      };
    });
    return sent;
  }

  it('updateAsset sends only the editable columns and rejects when no row changed', async () => {
    const sent = mockUpdate({ data: [{ id: 'a1' }], error: null });
    await api.updateAsset('a1', { name: 'Truck 12B', kind: 'Truck', model: 'F-750', reading: 50000 });
    expect(sent).toEqual({ table: 'assets', values: { name: 'Truck 12B', kind: 'Truck', model: 'F-750', reading: 50000 }, eq: ['id', 'a1'] });
    mockUpdate({ data: [], error: null });
    await expect(api.updateAsset('a1', { name: 'x', kind: 'Truck', model: 'y', reading: 1 })).rejects.toThrow('Asset not found');
  });

  it('updateFault and updateScheduleInterval map to their columns', async () => {
    let sent = mockUpdate({ data: [{ id: 'f1' }], error: null });
    await api.updateFault('f1', { date: '2026-10-01', description: 'Leak' });
    expect(sent).toEqual({ table: 'faults', values: { fault_date: '2026-10-01', description: 'Leak' }, eq: ['id', 'f1'] });
    sent = mockUpdate({ data: [{ id: 'f1' }], error: null });
    await api.updateFault('f1', { date: '2026-10-01', description: 'Leak', deadline: false, cost: 0 });
    expect(sent.values).toEqual({ fault_date: '2026-10-01', description: 'Leak', deadline: false, cost: 0 });
    sent = mockUpdate({ data: [{ id: 's1' }], error: null });
    await api.updateScheduleInterval('s1', 3000);
    expect(sent).toEqual({ table: 'schedules', values: { interval_value: 3000 }, eq: ['id', 's1'] });
    mockUpdate({ data: [], error: null });
    await expect(api.updateScheduleInterval('s1', 3000)).rejects.toThrow('Schedule not found');
  });

  it('updateServiceEntry calls the RPC and surfaces server errors', async () => {
    rpc.mockResolvedValue({
      data: { id: 'e1', asset_id: 'a1', task: 'Brakes', service_date: '2026-10-01', reading: 5, parts_cost: 12, notes: 'x', created_at: '', user_id: 'u1' },
      error: null,
    });
    const entry = await api.updateServiceEntry('e1', { date: '2026-10-01', reading: 5, partsCost: 12, notes: 'x' });
    expect(rpc).toHaveBeenCalledWith('update_service_entry', {
      p_id: 'e1', p_service_date: '2026-10-01', p_reading: 5, p_parts_cost: 12, p_notes: 'x',
    });
    expect(entry.partsCost).toBe(12);
    rpc.mockResolvedValue({ data: null, error: { message: "Date can't be in the future" } });
    await expect(api.updateServiceEntry('e1', { date: '2099-01-01', reading: 5, partsCost: 0, notes: '' })).rejects.toThrow(
      "Date can't be in the future",
    );
  });

  it('deleteAsset and deleteEntry call their RPCs and surface server errors', async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await api.deleteAsset('a1');
    await api.deleteEntry('e1');
    expect(rpc).toHaveBeenCalledWith('delete_asset', { p_id: 'a1' });
    expect(rpc).toHaveBeenCalledWith('delete_service_entry', { p_id: 'e1' });
    rpc.mockResolvedValue({ data: null, error: { message: 'Asset not found' } });
    await expect(api.deleteAsset('a1')).rejects.toThrow('Asset not found');
    rpc.mockResolvedValue({ data: null, error: { message: 'Entry not found' } });
    await expect(api.deleteEntry('e1')).rejects.toThrow('Entry not found');
  });

  it('deleteFault deletes, and treats an empty result (another user\'s row) as not found', async () => {
    const eq = vi.fn();
    from.mockReturnValue({ delete: () => ({ eq: (...a: unknown[]) => { eq(...a); return { select: () => Promise.resolve(next) }; } }) });
    let next: { data: unknown[] | null; error: { message: string } | null } = { data: [{ id: 'f1' }], error: null };
    await expect(api.deleteFault('f1')).resolves.toBeUndefined();
    expect(eq).toHaveBeenCalledWith('id', 'f1');
    next = { data: [], error: null };
    await expect(api.deleteFault('f1')).rejects.toThrow('Fault not found');
    next = { data: null, error: { message: 'boom' } };
    await expect(api.deleteFault('f1')).rejects.toThrow('boom');
  });
});
