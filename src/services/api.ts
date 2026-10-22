import { todayISO } from '../lib/dates';
import { supabase } from '../lib/supabase';
import type { Asset, FleetData, ServiceEntry } from '../types';
import { toAsset, toEntry, toFault, toSchedule } from './mappers';
import type { AssetEditInput, EntryEditInput, FaultEditInput, NewAssetInput, NewEntryInput, NewFaultInput } from './fleetService';

/** Supabase data layer: the single source of truth. */

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null) throw new Error('Empty response from server');
  return result.data;
}

function check(result: { error: { message: string } | null }): void {
  if (result.error) throw new Error(result.error.message);
}

/** RLS silently filters rows the user doesn't own, so an empty result means nothing changed. */
function expectRows(result: { data: unknown[] | null; error: { message: string } | null }, notFound: string): void {
  if (result.error) throw new Error(result.error.message);
  if (!result.data || result.data.length === 0) throw new Error(notFound);
}

export async function fetchFleetData(): Promise<FleetData> {
  const [assets, schedules, entries, faults] = await Promise.all([
    supabase.from('assets').select('*').order('created_at', { ascending: true }).order('id', { ascending: true }),
    supabase.from('schedules').select('*'),
    supabase.from('service_entries').select('*'),
    supabase.from('faults').select('*'),
  ]);
  return {
    assets: unwrap(assets).map(toAsset),
    schedules: unwrap(schedules).map(toSchedule),
    entries: unwrap(entries).map(toEntry),
    faults: unwrap(faults).map(toFault),
  };
}

/** Throws `Asset not found` / `Reading is lower than the last reading` / `Fault not found or already corrected`. */
export async function logServiceEntry(input: NewEntryInput): Promise<ServiceEntry> {
  const result = await supabase.rpc('log_service_entry', {
    p_asset_id: input.assetId,
    p_task: input.task,
    p_service_date: input.date,
    p_reading: input.reading,
    p_parts_cost: input.partsCost,
    p_notes: input.notes,
    p_fault_ids: input.faultIds ?? [],
  });
  return toEntry(unwrap(result));
}

export async function createAsset(input: NewAssetInput): Promise<Asset> {
  const result = await supabase.rpc('create_asset', {
    p_name: input.name,
    p_kind: input.kind,
    p_model: input.model,
    p_reading: input.reading,
    p_unit: input.unit,
    p_last_date: todayISO(),
  });
  return toAsset(unwrap(result));
}

/** The server rejects a reading below the highest logged service. */
export async function updateAssetReading(assetId: string, reading: number): Promise<void> {
  expectRows(await supabase.from('assets').update({ reading }).eq('id', assetId).select('id'), 'Asset not found');
}

export async function updateAsset(assetId: string, input: AssetEditInput): Promise<void> {
  const { name, kind, model, reading } = input;
  expectRows(
    await supabase.from('assets').update({ name, kind, model, reading }).eq('id', assetId).select('id'),
    'Asset not found',
  );
}

/** Always via RPC: the server validates the reading/date and recalculates the task's schedule. */
export async function updateServiceEntry(entryId: string, input: EntryEditInput): Promise<ServiceEntry> {
  const result = await supabase.rpc('update_service_entry', {
    p_id: entryId,
    p_service_date: input.date,
    p_reading: input.reading,
    p_parts_cost: input.partsCost,
    p_notes: input.notes,
  });
  return toEntry(unwrap(result));
}

/** The server rejects a cost or deadline change on a corrected fault. */
export async function updateFault(faultId: string, input: FaultEditInput): Promise<void> {
  const { date, description, deadline, cost } = input;
  expectRows(
    await supabase
      .from('faults')
      .update({
        fault_date: date,
        description,
        ...(deadline !== undefined && { deadline }),
        ...(cost !== undefined && { cost }),
      })
      .eq('id', faultId)
      .select('id'),
    'Fault not found',
  );
}

export async function updateScheduleInterval(scheduleId: string, interval: number): Promise<void> {
  expectRows(
    await supabase.from('schedules').update({ interval_value: interval }).eq('id', scheduleId).select('id'),
    'Schedule not found',
  );
}

export async function insertFault(assetId: string, input: NewFaultInput): Promise<void> {
  const { description, deadline, cost } = input;
  check(await supabase.from('faults').insert({ asset_id: assetId, fault_date: todayISO(), description, deadline, cost }));
}

/** Deletes the asset; its schedules, entries and faults cascade. */
export async function deleteAsset(assetId: string): Promise<void> {
  check(await supabase.rpc('delete_asset', { p_id: assetId }));
}

/** Always via RPC: the server rolls the matching schedule back; faults the entry corrected reopen. */
export async function deleteEntry(entryId: string): Promise<void> {
  check(await supabase.rpc('delete_service_entry', { p_id: entryId }));
}

export async function deleteFault(faultId: string): Promise<void> {
  expectRows(await supabase.from('faults').delete().eq('id', faultId).select('id'), 'Fault not found');
}
