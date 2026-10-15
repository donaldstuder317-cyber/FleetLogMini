import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '../lib/dates';
import { formatCurrency } from '../lib/format';
import type { FleetData, ServiceEntry, TaskType } from '../types';

export interface ExportFilters {
  assetIds: string[]; // empty = all assets
  from: string;
  to: string;
  task?: TaskType | 'all';
}

export interface ExportRow {
  date: string;
  asset: string;
  task: string;
  odometer: number;
  parts_cost: number;
  notes: string;
}

export const CSV_HEADERS = ['date', 'asset', 'task', 'odometer', 'parts_cost', 'notes'] as const;

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

export function toRows(data: FleetData, entries: ServiceEntry[]): ExportRow[] {
  const names = new Map(data.assets.map((a) => [a.id, a.name]));
  return entries.map((e) => ({
    date: e.date,
    asset: names.get(e.assetId) ?? e.assetId,
    task: e.task,
    odometer: e.reading,
    parts_cost: e.partsCost,
    notes: e.notes,
  }));
}

export function totalPartsCost(entries: ServiceEntry[]): number {
  return entries.reduce((sum, e) => sum + e.partsCost, 0);
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

export function buildPdf(rows: ExportRow[], assetLabel: string, from: string, to: string): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  doc.setFontSize(18);
  doc.text('FleetLog Mini — Service History', 40, 50);
  doc.setFontSize(11);
  doc.text(`Assets: ${assetLabel}`, 40, 72);
  doc.text(`Date range: ${formatDate(from)} – ${formatDate(to)}`, 40, 88);
  autoTable(doc, {
    startY: 108,
    head: [['Date', 'Asset', 'Task', 'Odometer', 'Parts cost', 'Notes']],
    body: rows.map((r) => [
      r.date,
      r.asset,
      r.task,
      r.odometer.toLocaleString('en-US'),
      formatCurrency(r.parts_cost),
      r.notes,
    ]),
    foot: [['', '', '', 'Total', formatCurrency(rows.reduce((s, r) => s + r.parts_cost, 0)), '']],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [31, 111, 229] },
    footStyles: { fillColor: [230, 234, 242], textColor: 20 },
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
