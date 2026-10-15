import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { buildSeedData } from '../data/seed';
import * as fleet from '../services/fleetService';
import { loadData, saveData } from '../services/storage';
import type { FleetData } from '../types';
import { FleetContext, type FleetContextValue } from './fleetContext';

export function FleetProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<FleetData>(loadData);
  const dataRef = useRef(data);
  const [lastAddedEntryId, setLastAddedEntryId] = useState<string | null>(null);

  /** Persist first; only update state if the write succeeded. */
  const commit = useCallback((next: FleetData) => {
    saveData(next);
    dataRef.current = next;
    setData(next);
  }, []);

  const value = useMemo<FleetContextValue>(
    () => ({
      data,
      lastAddedEntryId,
      addEntry: (input) => {
        const result = fleet.addServiceEntry(dataRef.current, input);
        commit(result.data);
        setLastAddedEntryId(result.entry.id);
        return result.entry;
      },
      setReading: (assetId, reading) => commit(fleet.updateReading(dataRef.current, assetId, reading)),
      createAsset: (input) => {
        const result = fleet.addAsset(dataRef.current, input);
        commit(result.data);
        return result.asset;
      },
      reportFault: (assetId, description) =>
        commit(fleet.reportFault(dataRef.current, assetId, description)),
      resetDemoData: () => {
        commit(buildSeedData());
        setLastAddedEntryId(null);
      },
    }),
    [data, lastAddedEntryId, commit],
  );

  return <FleetContext.Provider value={value}>{children}</FleetContext.Provider>;
}
