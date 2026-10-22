import { buildSeedData } from '../../src/data/seed';
import {
  buildCsv,
  buildExportRows,
  buildPdf,
  CSV_HEADERS,
  isAllSelected,
  isAssetSelected,
  isNoneSelected,
  normalizeSelection,
  selectionAssetIds,
  toggleAllSelection,
  selectEntries,
  summarizeExport,
  toggleAssetSelection,
} from '../../src/services/exportService';
import type { Fault } from '../../src/types';

const data = buildSeedData();

const ALL = { assetIds: [], from: '2000-01-01', to: '2999-12-31' };

describe('CSV export', () => {
  it('has the required headers, one service row per entry, a total per asset and a grand total', () => {
    const entries = selectEntries(data, ALL);
    const rows = buildExportRows(data, entries, []);
    const lines = buildCsv(rows).trim().split('\r\n');
    expect(lines[0]).toBe('row_type,date,asset,task,odometer,parts_cost,fault,deadline,fault_cost,total,notes');
    expect(CSV_HEADERS).toHaveLength(11);
    expect(rows.filter((r) => r.row_type === 'service')).toHaveLength(entries.length);
    expect(rows.filter((r) => r.row_type === 'total')).toHaveLength(data.assets.length);
    expect(rows.at(-1)!.row_type).toBe('grand_total');
    expect(lines).toHaveLength(rows.length + 1);
  });

  it('escapes commas and quotes', () => {
    const csv = buildCsv([
      {
        row_type: 'service', date: '2026-01-01', asset: 'A', task: 'Oil change', odometer: 1, parts_cost: 2,
        fault: '', deadline: '', fault_cost: '', total: '', notes: 'say "hi", ok',
      },
    ]);
    expect(csv).toContain('"say ""hi"", ok"');
  });

  it('filters by asset and date range', () => {
    const entries = selectEntries(data, { assetIds: ['van-4'], from: '2000-01-01', to: '2999-12-31' });
    expect(entries.every((e) => e.assetId === 'van-4')).toBe(true);
    expect(selectEntries(data, { assetIds: [], from: '2999-01-01', to: '2999-12-31' })).toHaveLength(0);
  });
});

describe('grouped export with faults', () => {
  const fault = (id: string, assetId: string, extra: Partial<Fault>): Fault => ({
    id, assetId, date: '2026-01-01', description: id, deadline: false, cost: 0, correctedEntryId: null, ...extra,
  });
  const withFaults = {
    ...data,
    faults: [
      fault('brake line', 'van-4', { deadline: true, cost: 240.5, correctedEntryId: 'e4' }),
      fault('mirror', 'van-4', { cost: 35, correctedEntryId: 'e4' }),
      fault('hydraulic leak', 'excavator-3', { deadline: true, cost: 900 }), // open DEADLINE: listed, not counted
      fault('wiper', 'excavator-3', { cost: 12 }), // open, not DEADLINE: not listed
    ],
  };
  const rows = buildExportRows(withFaults, selectEntries(withFaults, ALL), []);
  const forAsset = (name: string) => rows.filter((r) => r.asset === name);

  it('lists corrected faults right under the entry that fixed them', () => {
    const van = forAsset('Van 4');
    const i = van.findIndex((r) => r.row_type === 'service' && r.parts_cost === 112.25);
    expect(van.slice(i + 1, i + 3).map((r) => [r.row_type, r.fault, r.deadline, r.fault_cost])).toEqual([
      ['fault_corrected', 'brake line', 'DEADLINE', 240.5],
      ['fault_corrected', 'mirror', '', 35],
    ]);
  });

  it("each asset's total = parts cost + corrected fault costs", () => {
    const vanTotal = forAsset('Van 4').find((r) => r.row_type === 'total')!;
    expect(vanTotal).toMatchObject({ parts_cost: 112.25, fault_cost: 275.5, total: 387.75 });
  });

  it('lists open DEADLINE faults without counting them', () => {
    const ex = forAsset('Excavator 3');
    expect(ex.filter((r) => r.row_type === 'open_fault').map((r) => r.fault)).toEqual(['hydraulic leak']);
    expect(ex.find((r) => r.row_type === 'total')).toMatchObject({ parts_cost: 210.8, fault_cost: 0, total: 210.8 });
  });

  it('grand total and preview summary add up', () => {
    const parts = data.entries.reduce((sum, e) => sum + e.partsCost, 0);
    expect(rows.at(-1)).toMatchObject({ row_type: 'grand_total', total: parts + 275.5 });
    expect(summarizeExport(rows)).toEqual({ entries: data.entries.length, faultsCorrected: 2, total: parts + 275.5 });
  });

  it('open DEADLINE faults appear only for selected assets, even when a task filter hides their entries', () => {
    const vanOnly = buildExportRows(withFaults, selectEntries(withFaults, { ...ALL, assetIds: ['van-4'] }), ['van-4']);
    expect(vanOnly.some((r) => r.fault === 'hydraulic leak')).toBe(false); // Excavator 3 not selected

    const both = ['van-4', 'excavator-3'];
    const brakesOnly = buildExportRows(withFaults, selectEntries(withFaults, { ...ALL, assetIds: both, task: 'Tire rotation' }), both);
    expect(brakesOnly.filter((r) => r.row_type === 'open_fault').map((r) => r.fault)).toEqual(['hydraulic leak']);
  });

  it('only exports the selected assets', () => {
    const vanOnly = buildExportRows(withFaults, selectEntries(withFaults, { ...ALL, assetIds: ['van-4'] }), ['van-4']);
    expect(new Set(vanOnly.filter((r) => r.row_type !== 'grand_total').map((r) => r.asset))).toEqual(new Set(['Van 4']));
  });

  it('builds a PDF from the grouped rows', async () => {
    const doc = await buildPdf(rows, 'All assets', '2026-01-01', '2026-12-31');
    expect(doc.getNumberOfPages()).toBeGreaterThan(0);
    const red = (v: number) => String(Number((v / 255).toFixed(3)));
    const out = doc.output();
    expect(out).toContain(`${red(185)} ${red(28)} ${red(28)} rg`); // DEADLINE rows in print red
    const plain = buildExportRows(data, selectEntries(data, ALL), []); // no faults → no red
    expect((await buildPdf(plain, 'All assets', '2026-01-01', '2026-12-31')).output()).not.toContain(`${red(185)} ${red(28)} ${red(28)} rg`);
  });
});

describe('asset selection', () => {
  const assets = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  it('unticking one asset from "all" leaves the others selected', () => {
    expect(isAllSelected('all', assets)).toBe(true);
    expect(toggleAssetSelection('all', assets, 'b')).toEqual(['a', 'c']);
  });

  it('collapses back to "all" when every asset is selected', () => {
    expect(toggleAssetSelection(['a', 'c'], assets, 'b')).toBe('all');
    expect(normalizeSelection(['a', 'b', 'c'], assets)).toBe('all');
  });

  it('unticking the last asset means none, never all', () => {
    expect(toggleAssetSelection(['a'], assets, 'a')).toEqual([]);
    expect(isNoneSelected([], assets)).toBe(true);
    expect(isAllSelected([], assets)).toBe(false);
  });

  it('the "All assets" box toggles between all and none', () => {
    expect(toggleAllSelection('all', assets)).toEqual([]);
    expect(toggleAllSelection([], assets)).toBe('all');
    expect(toggleAllSelection(['a'], assets)).toBe('all');
  });

  it('prunes stale ids after a reload', () => {
    expect(normalizeSelection(['a', 'gone'], assets)).toEqual(['a']);
    expect(toggleAssetSelection(['a', 'gone'], assets, 'b')).toEqual(['a', 'b']);
  });

  it('a selection whose assets were all deleted becomes none, not the whole fleet', () => {
    expect(normalizeSelection(['gone'], assets)).toEqual([]);
    expect(isNoneSelected(['gone'], assets)).toBe(true);
    expect(isAllSelected(['gone'], assets)).toBe(false);
  });

  it('compares against the current assets, not the stale selection size', () => {
    expect(isAllSelected(['a', 'b', 'gone'], [{ id: 'a' }, { id: 'b' }])).toBe(true);
  });

  it('maps the selection to selectEntries ids', () => {
    expect(selectionAssetIds('all', assets)).toEqual([]);
    expect(selectionAssetIds(['b', 'gone'], assets)).toEqual(['b']);
    expect(isAssetSelected('all', assets, 'c')).toBe(true);
    expect(isAssetSelected(['a'], assets, 'c')).toBe(false);
  });
});
