import type { jsPDF } from 'jspdf';
import { formatDate } from '../lib/dates';
import { formatCurrency } from '../lib/format';
import type { Asset, Fault, FleetData, ServiceEntry, TaskType } from '../types';

export interface ExportFilters {
  assetIds: string[]; // empty = all assets
  from: string;
  to: string;
  task?: TaskType | 'all';
}

/** One line of the export. Totals count parts cost plus corrected fault costs; open faults are listed but not counted. */
export type ExportRowType = 'service' | 'fault_corrected' | 'open_fault' | 'total' | 'grand_total';

export interface ExportRow {
  row_type: ExportRowType;
  date: string;
  asset: string;
  task: string;
  odometer: number | '';
  parts_cost: number | '';
  fault: string;
  deadline: 'DEADLINE' | '';
  fault_cost: number | '';
  /** Filled on total / grand_total rows: parts + corrected fault costs. */
  total: number | '';
  notes: string;
}

export const CSV_HEADERS = [
  'row_type', 'date', 'asset', 'task', 'odometer', 'parts_cost', 'fault', 'deadline', 'fault_cost', 'total', 'notes',
] as const;

export function selectEntries(data: FleetData, f: ExportFilters): ServiceEntry[] {
  return data.entries
    .filter(
      (e) =>
        (f.assetIds.length === 0 || f.assetIds.includes(e.assetId)) &&
        (!f.from || e.date >= f.from) &&
        (!f.to || e.date <= f.to) &&
        (!f.task || f.task === 'all' || e.task === f.task),
    )
    .sort((a, b) => a.date.localeCompare(b.date) || a.assetId.localeCompare(b.assetId));
}

const BLANK = { date: '', task: '', odometer: '', parts_cost: '', fault: '', deadline: '', fault_cost: '', total: '', notes: '' } as const;

function faultRow(type: 'fault_corrected' | 'open_fault', asset: string, f: Fault): ExportRow {
  return {
    ...BLANK,
    row_type: type,
    date: f.date,
    asset,
    fault: f.description,
    deadline: f.deadline ? 'DEADLINE' : '',
    fault_cost: f.cost,
    notes: type === 'open_fault' ? 'Open — not counted in total' : '',
  };
}

/**
 * Grouped by asset (fleet order): each service entry, the faults it corrected, the asset's open DEADLINE
 * faults (current status, whatever the date range), then the asset's total. A grand total ends the export.
 * `entries` come from selectEntries; `assetIds` is the selection ([] = every asset).
 */
export function buildExportRows(data: FleetData, entries: ServiceEntry[], assetIds: string[]): ExportRow[] {
  const rows: ExportRow[] = [];
  let grandParts = 0;
  let grandFaults = 0;
  for (const asset of data.assets) {
    if (assetIds.length > 0 && !assetIds.includes(asset.id)) continue;
    const own = entries.filter((e) => e.assetId === asset.id);
    const openDeadline = data.faults.filter((f) => f.assetId === asset.id && f.deadline && f.correctedEntryId === null);
    if (own.length === 0 && openDeadline.length === 0) continue;

    let parts = 0;
    let faultCost = 0;
    for (const e of own) {
      rows.push({ ...BLANK, row_type: 'service', date: e.date, asset: asset.name, task: e.task, odometer: e.reading, parts_cost: e.partsCost, notes: e.notes });
      parts += e.partsCost;
      for (const f of data.faults.filter((x) => x.correctedEntryId === e.id)) {
        rows.push(faultRow('fault_corrected', asset.name, f));
        faultCost += f.cost;
      }
    }
    for (const f of openDeadline) rows.push(faultRow('open_fault', asset.name, f));
    rows.push({ ...BLANK, row_type: 'total', asset: asset.name, task: 'Total', parts_cost: parts, fault_cost: faultCost, total: parts + faultCost });
    grandParts += parts;
    grandFaults += faultCost;
  }
  if (rows.length > 0) {
    rows.push({ ...BLANK, row_type: 'grand_total', asset: 'All assets', task: 'Grand total', parts_cost: grandParts, fault_cost: grandFaults, total: grandParts + grandFaults });
  }
  return rows;
}

export interface ExportSummary {
  entries: number;
  faultsCorrected: number;
  total: number;
}

export function summarizeExport(rows: ExportRow[]): ExportSummary {
  const grand = rows.find((r) => r.row_type === 'grand_total');
  return {
    entries: rows.filter((r) => r.row_type === 'service').length,
    faultsCorrected: rows.filter((r) => r.row_type === 'fault_corrected').length,
    total: grand ? Number(grand.total) : 0,
  };
}

function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildCsv(rows: ExportRow[]): string {
  const lines = [CSV_HEADERS.join(',')];
  for (const r of rows) lines.push(CSV_HEADERS.map((h) => csvCell(r[h])).join(','));
  return lines.join('\r\n') + '\r\n';
}

/**
 * Asset selection for export. An empty array means "all assets".
 * Ids that no longer exist are dropped, and a selection covering every current asset collapses to "all".
 */
/** Which assets to export: every asset, or an explicit list (an empty list means none). */
export type AssetSelection = 'all' | string[];

/** Drops ids that no longer exist; a list covering every current asset becomes 'all'. */
export function normalizeSelection(selection: AssetSelection, assets: Pick<Asset, 'id'>[]): AssetSelection {
  if (selection === 'all') return 'all';
  const current = new Set(assets.map((a) => a.id));
  const kept = selection.filter((id) => current.has(id));
  return assets.length > 0 && kept.length === assets.length ? 'all' : kept;
}

export function isAllSelected(selection: AssetSelection, assets: Pick<Asset, 'id'>[]): boolean {
  return normalizeSelection(selection, assets) === 'all';
}

export function isNoneSelected(selection: AssetSelection, assets: Pick<Asset, 'id'>[]): boolean {
  const s = normalizeSelection(selection, assets);
  return s !== 'all' && s.length === 0;
}

export function isAssetSelected(selection: AssetSelection, assets: Pick<Asset, 'id'>[], id: string): boolean {
  const s = normalizeSelection(selection, assets);
  return s === 'all' || s.includes(id);
}

export function toggleAssetSelection(selection: AssetSelection, assets: Pick<Asset, 'id'>[], id: string): AssetSelection {
  const current = normalizeSelection(selection, assets);
  const base = current === 'all' ? assets.map((a) => a.id) : current;
  const next = base.includes(id) ? base.filter((x) => x !== id) : [...base, id];
  return normalizeSelection(next, assets);
}

/** The "All assets" box: all → none, anything else → all. */
export function toggleAllSelection(selection: AssetSelection, assets: Pick<Asset, 'id'>[]): AssetSelection {
  return isAllSelected(selection, assets) ? [] : 'all';
}

/** Asset ids for selectEntries ([] = every asset). Don't call when nothing is selected. */
export function selectionAssetIds(selection: AssetSelection, assets: Pick<Asset, 'id'>[]): string[] {
  const s = normalizeSelection(selection, assets);
  return s === 'all' ? [] : s;
}

/** Print-safe red for DEADLINE rows (the app's `danger` is too light on white paper). */
const PRINT_DEADLINE_RED: [number, number, number] = [185, 28, 28];
const HEAD_BLUE: [number, number, number] = [31, 111, 229];
const BAND_GREY: [number, number, number] = [230, 234, 242];

const money = (v: number | '') => (v === '' ? '' : formatCurrency(v));

/** jsPDF (and autotable/html2canvas) are loaded on demand so they stay out of the main bundle. */
export async function buildPdf(rows: ExportRow[], assetLabel: string, from: string, to: string): Promise<jsPDF> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  doc.setFontSize(18);
  doc.text('FleetLog Mini — Service History', 40, 50);
  doc.setFontSize(11);
  doc.text(`Assets: ${assetLabel}`, 40, 72);
  doc.text(`Date range: ${formatDate(from)} – ${formatDate(to)}`, 40, 88);

  type Cell = string | { content: string; colSpan?: number; styles?: Record<string, unknown> };
  const body: Cell[][] = [];
  const grand = rows.find((r) => r.row_type === 'grand_total');
  let current = '';
  for (const r of rows) {
    if (r.row_type === 'grand_total') continue;
    if (r.asset !== current) {
      current = r.asset;
      body.push([{ content: r.asset, colSpan: 7, styles: { fontStyle: 'bold', fontSize: 11, fillColor: BAND_GREY } }]);
    }
    const red = r.deadline ? { textColor: PRINT_DEADLINE_RED } : {};
    const cells = (item: string, styles: Record<string, unknown> = red): Cell[] =>
      [r.date, item, r.odometer === '' ? '' : r.odometer.toLocaleString('en-US'), money(r.parts_cost), money(r.fault_cost), money(r.total), r.notes]
        .map((content) => ({ content, styles }));
    switch (r.row_type) {
      case 'service':
        body.push(cells(r.task));
        break;
      case 'fault_corrected':
        body.push(cells(`${r.deadline ? 'DEADLINE — ' : ''}Fault corrected: ${r.fault}`));
        break;
      case 'open_fault':
        body.push(cells(`${r.deadline ? 'DEADLINE — ' : ''}Open fault: ${r.fault}`));
        break;
      case 'total':
        body.push(cells(`${r.asset} total`, { fontStyle: 'bold' }));
        break;
    }
  }

  autoTable(doc, {
    startY: 108,
    head: [['Date', 'Item', 'Odometer', 'Parts cost', 'Fault cost', 'Total', 'Notes']],
    body,
    foot: grand ? [['', 'Grand total', '', money(grand.parts_cost), money(grand.fault_cost), money(grand.total), '']] : undefined,
    styles: { fontSize: 9 },
    columnStyles: { 0: { cellWidth: 58 }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } },
    headStyles: { fillColor: HEAD_BLUE },
    footStyles: { fillColor: BAND_GREY, textColor: 20 },
    showFoot: 'lastPage',
  });
  return doc;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
