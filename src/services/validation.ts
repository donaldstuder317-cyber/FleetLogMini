import { formatNumber } from '../lib/format';

export function parseNumber(raw: string): number | null {
  const cleaned = raw.replace(/[,$\s]/g, '');
  if (cleaned === '') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function validateReading(raw: string, lastReading: number): string | null {
  const n = parseNumber(raw);
  if (n === null) return 'Enter a number';
  if (n < lastReading) {
    return `Odometer can't be lower than last reading (${formatNumber(lastReading)})`;
  }
  return null;
}

export function validateCost(raw: string): string | null {
  if (raw.trim() === '') return null;
  const n = parseNumber(raw);
  if (n === null || n < 0) return 'Enter a valid cost';
  return null;
}

export function validateDateRange(from: string, to: string): string | null {
  if (from && to && from > to) return 'Start date must be before end date';
  return null;
}
