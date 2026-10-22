import { randomUUID } from 'node:crypto';
import { test as base, expect, type Page, type Request, type Route } from '@playwright/test';
import { buildSeedData } from '../../src/data/seed';

/**
 * Fakes Supabase for every e2e run, so tests never touch the real project:
 * - `**\/auth\/v1\/**`: sign up, sign in (password), token refresh, current user, sign out.
 * - `**\/rest\/v1\/**`: an in-memory copy of the seed data, scoped per user the way RLS is.
 * The signed-in user comes from the request's bearer token (a fake JWT with `sub`).
 * State is per test. By default each test starts signed in as the demo user; use
 * `test.use({ signedInAs: null })` to start signed out.
 */

export const USERS = {
  demo: { id: 'd0000000-0000-4000-8000-000000000001', email: 'demo@fleetlog.test', password: 'Demo-pass1!', name: 'Dana Demo' },
  other: { id: 'e0000000-0000-4000-8000-000000000002', email: 'other@fleetlog.test', password: 'Other-pass1!', name: 'Olive Other' },
} as const;
export type UserKey = keyof typeof USERS;

export const IDS = {
  truck12: '11111111-1111-4111-8111-111111111111',
  van4: '22222222-2222-4222-8222-222222222222',
  excavator3: '33333333-3333-4333-8333-333333333333',
  /** Owned by the "other" user; the demo user must never see it. */
  otherRig: '44444444-4444-4444-8444-444444444444',
} as const;

const SEED_ID: Record<string, string> = {
  'truck-12': IDS.truck12,
  'van-4': IDS.van4,
  'excavator-3': IDS.excavator3,
};

/** supabase-js stores the session under `sb-<project ref>-auth-token` (ref = e2e-mock). */
const STORAGE_KEY = 'sb-e2e-mock-auth-token';

type Row = Record<string, unknown>;
type AuthUser = { id: string; email: string; password: string; name: string };

const DEFAULT_SCHEDULES: Record<string, Array<[string, number, string]>> = {
  mi: [
    ['Oil change', 5000, 'mi'],
    ['Tire rotation', 8000, 'mi'],
    ['Brakes', 30000, 'mi'],
    ['Inspection', 365, 'days'],
  ],
  hrs: [
    ['Oil change', 250, 'hrs'],
    ['Inspection', 90, 'days'],
  ],
};

function buildDb() {
  const seed = buildSeedData();
  const base = Date.parse('2026-01-01T00:00:00Z');
  const owner = USERS.demo.id;
  const today = new Date().toISOString().slice(0, 10);
  return {
    // staggered created_at keeps Truck 12, Van 4, Excavator 3 in that order
    assets: [
      ...seed.assets.map((a, i): Row => ({
        id: SEED_ID[a.id], name: a.name, kind: a.kind, model: a.model, reading: a.reading,
        reading_unit: a.unit, user_id: owner,
        created_at: new Date(base + i * 1000).toISOString(), updated_at: new Date(base).toISOString(),
      })),
      {
        id: IDS.otherRig, name: 'Other Rig', kind: 'Truck', model: 'Isuzu NPR', reading: 500, reading_unit: 'mi',
        user_id: USERS.other.id, created_at: new Date(base).toISOString(), updated_at: new Date(base).toISOString(),
      },
    ] as Row[],
    schedules: [
      ...seed.schedules.map((s): Row => ({
        id: randomUUID(), asset_id: SEED_ID[s.assetId], task: s.task, interval_value: s.interval,
        interval_unit: s.unit, last_reading: s.lastReading, last_date: s.lastDate,
        baseline_reading: s.lastReading, baseline_date: s.lastDate, user_id: owner,
      })),
      {
        id: randomUUID(), asset_id: IDS.otherRig, task: 'Oil change', interval_value: 5000, interval_unit: 'mi',
        last_reading: 0, last_date: today, baseline_reading: 0, baseline_date: today, user_id: USERS.other.id,
      },
    ] as Row[],
    service_entries: seed.entries.map((e): Row => ({
      id: randomUUID(), asset_id: SEED_ID[e.assetId], task: e.task, service_date: e.date,
      reading: e.reading, parts_cost: e.partsCost, notes: e.notes, user_id: owner, created_at: new Date(base).toISOString(),
    })),
    faults: [] as Row[],
  } as Record<'assets' | 'schedules' | 'service_entries' | 'faults', Row[]>;
}

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
};

function json(route: Route, status: number, body: unknown) {
  return route.fulfill({ status, headers: CORS, contentType: 'application/json', body: JSON.stringify(body) });
}

function pgError(route: Route, message: string, status = 400, code = 'P0001') {
  return json(route, status, { code, message, details: null, hint: null });
}

// ── Fake auth ─────────────────────────────────────────────────────────────────

const b64url = (v: unknown) => Buffer.from(JSON.stringify(v)).toString('base64url');

/** Unsigned JWT-shaped token: only `sub` is read back (by this mock). */
function fakeJwt(user: AuthUser) {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ sub: user.id, email: user.email, role: 'authenticated', aud: 'authenticated', exp })}.e2e`;
}

function authUser(user: AuthUser) {
  return {
    id: user.id, aud: 'authenticated', role: 'authenticated', email: user.email,
    user_metadata: { name: user.name }, app_metadata: { provider: 'email', providers: ['email'] },
    identities: [{ id: user.id, user_id: user.id, provider: 'email' }],
    created_at: '2026-01-01T00:00:00Z',
  };
}

function sessionFor(user: AuthUser) {
  const expiresIn = 3600;
  return {
    access_token: fakeJwt(user), token_type: 'bearer', expires_in: expiresIn,
    expires_at: Math.floor(Date.now() / 1000) + expiresIn, refresh_token: `refresh-${user.id}`, user: authUser(user),
  };
}

/** The user id in the request's bearer token, or null for the anon key / no token. */
function requestUserId(req: Request): string | null {
  const token = (req.headers()['authorization'] ?? '').replace(/^Bearer\s+/i, '');
  try {
    const sub = JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString()).sub;
    return typeof sub === 'string' ? sub : null;
  } catch {
    return null;
  }
}

function authError(route: Route, status: number, code: string, msg: string) {
  return json(route, status, { code: status, error_code: code, msg });
}

export async function mockSupabase(page: Page, signedInAs: UserKey | null) {
  const db = buildDb();
  const users: AuthUser[] = Object.values(USERS).map((u) => ({ ...u }));

  if (signedInAs) {
    // Seed the stored session once per tab; later navigations must not undo a sign-out.
    await page.addInitScript(
      ({ key, session }) => {
        if (sessionStorage.getItem('e2e-session-seeded')) return;
        localStorage.setItem(key, JSON.stringify(session));
        sessionStorage.setItem('e2e-session-seeded', '1');
      },
      { key: STORAGE_KEY, session: sessionFor(USERS[signedInAs]) },
    );
  }

  await page.route('**/auth/v1/**', async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    const url = new URL(req.url());
    const path = url.pathname.replace(/^.*\/auth\/v1\//, '');
    const body = (req.postDataJSON() ?? {}) as Row;

    if (req.method() === 'GET' && path === 'user') {
      const user = users.find((u) => u.id === requestUserId(req));
      return user ? json(route, 200, authUser(user)) : authError(route, 401, 'bad_jwt', 'invalid JWT');
    }
    if (req.method() === 'POST' && path === 'token') {
      const grant = url.searchParams.get('grant_type');
      const user =
        grant === 'password'
          ? users.find((u) => u.email === body.email && u.password === body.password)
          : users.find((u) => `refresh-${u.id}` === body.refresh_token);
      if (!user) return authError(route, 400, 'invalid_credentials', 'Invalid login credentials');
      return json(route, 200, sessionFor(user));
    }
    if (req.method() === 'POST' && path === 'signup') {
      if (users.some((u) => u.email === body.email)) {
        return authError(route, 422, 'user_already_exists', 'User already registered');
      }
      const meta = (body.data ?? {}) as Row;
      const user = { id: randomUUID(), email: String(body.email), password: String(body.password), name: String(meta.name ?? '') };
      users.push(user);
      return json(route, 200, sessionFor(user)); // email confirmation off: signed straight in
    }
    if (req.method() === 'POST' && path === 'logout') return route.fulfill({ status: 204, headers: CORS });
    return json(route, 404, { msg: `Unmocked auth ${req.method()} ${path}` });
  });

  /** Mirrors recalc_schedule(): latest entry for the task, else the schedule baseline. */
  function recalcSchedule(assetId: unknown, task: unknown) {
    const newest = db.service_entries
      .filter((e) => e.asset_id === assetId && e.task === task)
      .sort(
        (a, b) =>
          String(b.service_date).localeCompare(String(a.service_date)) ||
          Number(b.reading) - Number(a.reading) ||
          String(b.created_at).localeCompare(String(a.created_at)),
      )[0];
    for (const s of db.schedules) {
      if (s.asset_id === assetId && s.task === task) {
        // Baseline fallback is capped at the asset's current reading.
        const reading = Number(db.assets.find((a) => a.id === assetId)?.reading ?? Infinity);
        s.last_reading = newest ? newest.reading : Math.min(Number(s.baseline_reading), reading);
        s.last_date = newest ? newest.service_date : s.baseline_date;
      }
    }
  }

  await page.route('**/rest/v1/**', async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });

    const url = new URL(req.url());
    const path = url.pathname.replace(/^.*\/rest\/v1\//, '');
    const body = req.postDataJSON() as Row | null;
    const uid = requestUserId(req);
    // Signed out = anon role: no grants on any table or RPC.
    if (!uid) return pgError(route, 'permission denied', 401, '42501');

    // RLS: every query only ever sees the caller's rows.
    const mine = (table: keyof typeof db) => db[table].filter((r) => r.user_id === uid);
    const idParam = () => url.searchParams.get('id')?.replace(/^eq\./, '');

    if (req.method() === 'GET' && path in db) {
      return json(route, 200, mine(path as keyof typeof db));
    }

    if (req.method() === 'POST' && path === 'rpc/log_service_entry') {
      const b = body as Row;
      const asset = mine('assets').find((a) => a.id === b.p_asset_id);
      if (!asset) return pgError(route, 'Asset not found');
      if ((b.p_reading as number) < (asset.reading as number)) return pgError(route, 'Reading is lower than the last reading');
      // Only open faults of this asset can be corrected (same check as the RPC; nothing is written on failure).
      const faultIds = [...new Set((b.p_fault_ids as string[] | undefined) ?? [])];
      const fixed = mine('faults').filter((f) => faultIds.includes(String(f.id)) && f.asset_id === asset.id && f.corrected_entry_id == null);
      if (fixed.length !== faultIds.length) return pgError(route, 'Fault not found or already corrected');
      const entry: Row = {
        id: randomUUID(), asset_id: asset.id, task: b.p_task, service_date: b.p_service_date, reading: b.p_reading,
        parts_cost: b.p_parts_cost, notes: b.p_notes, user_id: uid, created_at: new Date().toISOString(),
      };
      db.service_entries.push(entry);
      for (const f of fixed) f.corrected_entry_id = entry.id;
      asset.reading = b.p_reading;
      for (const s of db.schedules) {
        if (s.asset_id === asset.id && s.task === b.p_task) {
          s.last_reading = b.p_reading;
          s.last_date = b.p_service_date;
        }
      }
      return json(route, 200, entry);
    }

    if (req.method() === 'POST' && path === 'rpc/create_asset') {
      const b = body as Row;
      const asset: Row = {
        id: randomUUID(), name: b.p_name, kind: b.p_kind, model: b.p_model, reading: b.p_reading, reading_unit: b.p_unit,
        user_id: uid, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      };
      db.assets.push(asset);
      for (const [task, interval, unit] of DEFAULT_SCHEDULES[b.p_unit as string] ?? []) {
        db.schedules.push({
          id: randomUUID(), asset_id: asset.id, task, interval_value: interval, interval_unit: unit,
          last_reading: b.p_reading, last_date: b.p_last_date,
          baseline_reading: b.p_reading, baseline_date: b.p_last_date, user_id: uid,
        });
      }
      return json(route, 200, asset);
    }

    if (req.method() === 'POST' && path === 'rpc/update_service_entry') {
      const b = body as Row;
      const entry = mine('service_entries').find((e) => e.id === b.p_id);
      if (!entry) return pgError(route, 'Entry not found');
      if (String(b.p_service_date) > new Date().toISOString().slice(0, 10)) return pgError(route, "Date can't be in the future");
      const asset = db.assets.find((a) => a.id === entry.asset_id)!;
      if ((b.p_reading as number) > (asset.reading as number)) {
        return pgError(route, `Reading can't be higher than the current reading (${asset.reading})`);
      }
      Object.assign(entry, { service_date: b.p_service_date, reading: b.p_reading, parts_cost: b.p_parts_cost, notes: b.p_notes });
      recalcSchedule(entry.asset_id, entry.task);
      return json(route, 200, entry);
    }

    // PATCH with return=representation: an empty array when RLS hides the row.
    if (req.method() === 'PATCH' && (path === 'assets' || path === 'schedules' || path === 'faults')) {
      const row = mine(path).find((r) => r.id === idParam());
      if (!row) return json(route, 200, []);
      // faults_correction_guard: cost and deadline are locked once corrected.
      if (path === 'faults' && row.corrected_entry_id != null && body &&
          (('cost' in body && Number(body.cost) !== Number(row.cost)) || ('deadline' in body && body.deadline !== row.deadline))) {
        return pgError(route, "A corrected fault's cost and deadline can't be changed");
      }
      if (path === 'assets' && body && 'reading' in body) {
        const floor = Math.max(-Infinity, ...db.service_entries.filter((e) => e.asset_id === row.id).map((e) => Number(e.reading)));
        if (Number(body.reading) < floor) return pgError(route, `Reading can't be lower than the last logged service (${floor})`);
      }
      Object.assign(row, body);
      // assets_clamp_schedules: lowering the reading pulls higher schedules down to it.
      if (path === 'assets' && body && 'reading' in body) {
        for (const s of db.schedules) {
          if (s.asset_id === row.id && Number(s.last_reading) > Number(body.reading)) s.last_reading = body.reading;
        }
      }
      return json(route, 200, [{ id: row.id }]);
    }

    if (req.method() === 'POST' && path === 'faults') {
      const b = body as Row;
      // Composite FK (asset_id, user_id): the asset must belong to the caller.
      if (!mine('assets').some((a) => a.id === b.asset_id)) {
        return pgError(route, 'insert or update on table "faults" violates foreign key constraint "faults_asset_fkey"', 409, '23503');
      }
      if (b.corrected_entry_id != null) return pgError(route, "A new fault can't already be corrected");
      db.faults.push({ id: randomUUID(), created_at: new Date().toISOString(), user_id: uid, deadline: false, cost: 0, corrected_entry_id: null, ...b });
      return route.fulfill({ status: 201, headers: CORS });
    }

    if (req.method() === 'POST' && path === 'rpc/delete_asset') {
      const asset = mine('assets').find((a) => a.id === (body as Row).p_id);
      if (!asset) return pgError(route, 'Asset not found');
      db.assets = db.assets.filter((a) => a !== asset);
      db.schedules = db.schedules.filter((s) => s.asset_id !== asset.id);
      db.service_entries = db.service_entries.filter((e) => e.asset_id !== asset.id);
      db.faults = db.faults.filter((f) => f.asset_id !== asset.id);
      return route.fulfill({ status: 204, headers: CORS });
    }

    if (req.method() === 'POST' && path === 'rpc/delete_service_entry') {
      const entry = mine('service_entries').find((e) => e.id === (body as Row).p_id);
      if (!entry) return pgError(route, 'Entry not found');
      db.service_entries = db.service_entries.filter((e) => e !== entry);
      // FK on delete set null (corrected_entry_id): the faults it fixed reopen.
      for (const f of db.faults) if (f.corrected_entry_id === entry.id) f.corrected_entry_id = null;
      recalcSchedule(entry.asset_id, entry.task);
      return route.fulfill({ status: 204, headers: CORS });
    }

    if (req.method() === 'DELETE' && path === 'faults') {
      const fault = mine('faults').find((f) => f.id === idParam());
      if (!fault) return json(route, 200, []);
      db.faults = db.faults.filter((f) => f !== fault);
      return json(route, 200, [{ id: fault.id }]);
    }

    return json(route, 404, { message: `Unmocked ${req.method()} ${path}` });
  });
}

export const test = base.extend<{ signedInAs: UserKey | null }>({
  signedInAs: ['demo', { option: true }],
  page: async ({ page, signedInAs }, use) => {
    await mockSupabase(page, signedInAs);
    await use(page);
  },
});

/** Opens a mobile <details> history row if it is collapsed (no-op on the desktop table). */
export async function expandRow(row: import('@playwright/test').Locator) {
  await row.waitFor(); // count() below doesn't wait; a row still loading would be skipped
  const summary = row.locator('summary');
  if (await summary.count()) {
    const open = await row.locator('details').evaluate((d) => (d as HTMLDetailsElement).open);
    if (!open) await summary.click();
  }
}

export { expect };
