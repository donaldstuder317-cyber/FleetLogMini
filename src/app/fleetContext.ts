import { createContext } from 'react';
import type { NewAssetInput, NewEntryInput } from '../services/fleetService';
import type { Asset, FleetData, ServiceEntry } from '../types';

export interface FleetContextValue {
  data: FleetData;
  /** Id of the most recently logged entry (drives the slide-in animation). */
  lastAddedEntryId: string | null;
  /** All mutations throw if persisting fails, leaving state untouched. */
  addEntry: (input: NewEntryInput) => ServiceEntry;
  setReading: (assetId: string, reading: number) => void;
  createAsset: (input: NewAssetInput) => Asset;
  reportFault: (assetId: string, description: string) => void;
  resetDemoData: () => void;
}

export const FleetContext = createContext<FleetContextValue | null>(null);

export interface ToastContextValue {
  showToast: (message: string, tone?: 'success' | 'error') => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
