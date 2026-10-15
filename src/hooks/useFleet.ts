import { useContext, useMemo } from 'react';
import { FleetContext, ToastContext } from '../app/fleetContext';
import { evaluateAll, evaluateAsset, worstStatus } from '../services/status';
import type { Asset } from '../types';

export function useFleet() {
  const ctx = useContext(FleetContext);
  if (!ctx) throw new Error('useFleet must be used inside <FleetProvider>');
  return ctx;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

/** Every schedule across the fleet, evaluated and sorted most-urgent first. */
export function useAllStatuses() {
  const { data } = useFleet();
  return useMemo(() => evaluateAll(data), [data]);
}

/** Assets with their evaluated schedules and worst status. */
export function useAssetSummaries() {
  const { data } = useFleet();
  return useMemo(
    () =>
      data.assets.map((asset: Asset) => {
        const schedules = evaluateAsset(data, asset);
        return { asset, schedules, urgent: schedules[0], status: worstStatus(schedules) };
      }),
    [data],
  );
}
