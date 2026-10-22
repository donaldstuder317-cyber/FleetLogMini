import { createContext } from 'react';
import type { AssetEditInput, EntryEditInput, FaultEditInput, NewAssetInput, NewEntryInput, NewFaultInput } from '../services/fleetService';
import type { Asset, FleetData, ServiceEntry } from '../types';

export interface FleetContextValue {
  data: FleetData;
  /** Id of the most recently logged entry (drives the slide-in animation). */
  lastAddedEntryId: string | null;
  /** Mutations resolve once the server confirms and local data is refreshed; they reject on failure. */
  addEntry: (input: NewEntryInput) => Promise<ServiceEntry>;
  setReading: (assetId: string, reading: number) => Promise<void>;
  createAsset: (input: NewAssetInput) => Promise<Asset>;
  reportFault: (assetId: string, input: NewFaultInput) => Promise<void>;
  /** `onDeleted` runs right after the server confirms, before local data changes (use it to navigate away). */
  deleteAsset: (assetId: string, onDeleted?: () => void) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
  deleteFault: (faultId: string) => Promise<void>;
  updateAsset: (assetId: string, input: AssetEditInput) => Promise<void>;
  updateEntry: (entryId: string, input: EntryEditInput) => Promise<void>;
  updateFault: (faultId: string, input: FaultEditInput) => Promise<void>;
  updateInterval: (scheduleId: string, interval: number) => Promise<void>;
}

export const FleetContext = createContext<FleetContextValue | null>(null);

export interface ToastContextValue {
  showToast: (message: string, tone?: 'success' | 'error') => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
