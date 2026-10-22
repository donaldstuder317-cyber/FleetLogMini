import { todayISO } from '../lib/dates';
import { formatNumber } from '../lib/format';
import { AUTH_MESSAGES } from './authMessages';

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

/** Blank is allowed (means 0). Matches numeric(10,2): ≥ 0, at most 2 decimals, below 100,000,000. */
export function validateCost(raw: string): string | null {
  if (raw.trim() === '') return null;
  const n = parseNumber(raw);
  if (n === null || n < 0 || n >= 1e8 || /\.\d{3,}$/.test(raw.trim())) return 'Enter a valid cost';
  return null;
}

export function validateDateRange(from: string, to: string): string | null {
  if (from && to && from > to) return 'Start date must be before end date';
  return null;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateName(raw: string): string | null {
  const name = raw.trim();
  if (!name) return 'Enter your name.';
  if (name.length > 120) return 'Name must be 120 characters or fewer.';
  return null;
}

export function validateEmail(raw: string): string | null {
  return EMAIL.test(raw.trim()) ? null : AUTH_MESSAGES.invalidEmail;
}

/** Sign-up strength rule: 8+ characters, an uppercase letter, a number and a symbol. */
export function validatePassword(raw: string): string | null {
  const strong = raw.length >= 8 && /[A-Z]/.test(raw) && /\d/.test(raw) && /[^A-Za-z0-9]/.test(raw);
  return strong ? null : AUTH_MESSAGES.weakPassword;
}

/** Sign-in only checks something was typed, so older passwords still work. */
export function validatePasswordEntered(raw: string): string | null {
  return raw ? null : 'Enter your password.';
}

export function validatePasswordMatch(password: string, confirm: string): string | null {
  return password === confirm ? null : "Passwords don't match.";
}

// ── Edits ─────────────────────────────────────────────────────────────────────

export function validateAssetName(raw: string): string | null {
  return raw.trim() ? null : 'Enter a name';
}

export function validateAssetModel(raw: string): string | null {
  return raw.trim() ? null : 'Enter a model';
}

/** Asset reading may be corrected down, but never below the highest logged service (`floor`). */
export function validateAssetReading(raw: string, floor: number | null): string | null {
  const n = parseNumber(raw);
  if (n === null || n < 0) return 'Enter a valid number';
  if (floor !== null && n < floor) {
    return `Reading can't be lower than the last logged service (${formatNumber(floor)})`;
  }
  return null;
}

/** A service entry's reading can't be above the asset's current reading. */
export function validateEntryReading(raw: string, max: number): string | null {
  const n = parseNumber(raw);
  if (n === null || n < 0) return 'Enter a valid number';
  if (n > max) return `Reading can't be higher than the current reading (${formatNumber(max)})`;
  return null;
}

export function validatePastDate(iso: string, today: string = todayISO()): string | null {
  if (!iso) return 'Enter a date';
  if (iso > today) return "Date can't be in the future";
  return null;
}

export function validateFaultDescription(raw: string): string | null {
  return raw.trim() ? null : 'Describe the fault';
}

export function validateInterval(raw: string): string | null {
  const n = parseNumber(raw);
  return n !== null && Number.isInteger(n) && n > 0 ? null : 'Enter a whole number greater than 0';
}
