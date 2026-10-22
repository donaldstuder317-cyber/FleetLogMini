import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import * as api from '../services/api';
import type { FleetData } from '../types';
import { FleetContext, type FleetContextValue } from './fleetContext';

export function FleetProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<FleetData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [lastAddedEntryId, setLastAddedEntryId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setData(await api.fetchFleetData());
  }, []);

  const load = useCallback(() => {
    setLoadError(false);
    reload().catch(() => setLoadError(true));
  }, [reload]);

  useEffect(() => {
    load();
  }, [load]);

  /** After a confirmed write, refresh from the server. A failed refresh must not report the write as failed. */
  const refreshQuietly = useCallback(() => reload().catch(() => undefined), [reload]);

  const value = useMemo<FleetContextValue | null>(
    () =>
      data && {
        data,
        lastAddedEntryId,
        addEntry: async (input) => {
          const entry = await api.logServiceEntry(input);
          await refreshQuietly();
          setLastAddedEntryId(entry.id);
          return entry;
        },
        setReading: async (assetId, reading) => {
          await api.updateAssetReading(assetId, reading);
          await refreshQuietly();
        },
        createAsset: async (input) => {
          const asset = await api.createAsset(input);
          await refreshQuietly();
          return asset;
        },
        reportFault: async (assetId, input) => {
          await api.insertFault(assetId, input);
          await refreshQuietly();
        },
        deleteAsset: async (assetId, onDeleted) => {
          await api.deleteAsset(assetId);
          // Prune locally and let the caller navigate in the same tick, so "Asset not found" never flashes.
          onDeleted?.();
          setData((prev) =>
            prev && {
              assets: prev.assets.filter((a) => a.id !== assetId),
              schedules: prev.schedules.filter((s) => s.assetId !== assetId),
              entries: prev.entries.filter((e) => e.assetId !== assetId),
              faults: prev.faults.filter((f) => f.assetId !== assetId),
            },
          );
          await refreshQuietly();
        },
        deleteEntry: async (entryId) => {
          await api.deleteEntry(entryId);
          await refreshQuietly();
        },
        deleteFault: async (faultId) => {
          await api.deleteFault(faultId);
          await refreshQuietly();
        },
        updateAsset: async (assetId, input) => {
          await api.updateAsset(assetId, input);
          await refreshQuietly();
        },
        updateEntry: async (entryId, input) => {
          await api.updateServiceEntry(entryId, input);
          await refreshQuietly();
        },
        updateFault: async (faultId, input) => {
          await api.updateFault(faultId, input);
          await refreshQuietly();
        },
        updateInterval: async (scheduleId, interval) => {
          await api.updateScheduleInterval(scheduleId, interval);
          await refreshQuietly();
        },
      },
    [data, lastAddedEntryId, refreshQuietly],
  );

  if (!value) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4 text-ink">
        {loadError ? (
          <EmptyState
            title="Couldn't load your fleet data — check your connection and try again"
            action={<Button onClick={load}>Try again</Button>}
          />
        ) : (
          <p role="status" className="text-base text-muted">Loading fleet data…</p>
        )}
      </div>
    );
  }

  return <FleetContext.Provider value={value}>{children}</FleetContext.Provider>;
}
