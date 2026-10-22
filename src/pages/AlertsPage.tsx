import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { Button, ButtonLink } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { Field } from '../components/forms/Field';
import { Select } from '../components/forms/controls';
import { PageHeader } from '../components/layout/PageHeader';
import { AlertRow } from '../components/modules/AlertRow';
import { useAllStatuses, useFleet } from '../hooks/useFleet';
import {
  DEFAULT_ALERT_FILTERS,
  MILES_PER_HOUR_RATIO,
  filterAlerts,
  type AlertFilters,
} from '../services/alerts';
import { deadlinedAssetIds } from '../services/fleetService';
import { TASK_TYPES, type DeadlineFilter, type TaskType } from '../types';

const DAY_OPTIONS = [7, 14, 30, 60, 90];
const MILE_OPTIONS = [100, 250, 500, 1000];

export function AlertsPage() {
  const { data } = useFleet();
  const all = useAllStatuses();
  const [filters, setFilters] = useState<AlertFilters>(DEFAULT_ALERT_FILTERS);

  const deadlined = useMemo(() => deadlinedAssetIds(data), [data]);
  const alerts = useMemo(() => filterAlerts(all, filters, deadlined), [all, filters, deadlined]);

  const exportQuery = useMemo(() => {
    const q = new URLSearchParams();
    const ids = [...new Set(alerts.map((a) => a.asset.id))];
    if (ids.length > 0) q.set('assets', ids.join(','));
    if (filters.task !== 'all') q.set('task', filters.task);
    return q.toString();
  }, [alerts, filters.task]);

  const set = <K extends keyof AlertFilters>(key: K, value: AlertFilters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  return (
    <>
      <PageHeader
        title="Upcoming Alerts"
        subtitle="Everything coming due — whichever limit comes first"
        actions={
          <ButtonLink to={`/export${exportQuery ? `?${exportQuery}` : ''}`} variant="secondary">
            <Download size={20} aria-hidden /> Export this list
          </ButtonLink>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <Field id="window-days" label="Within (days)">
          <Select id="window-days" value={filters.days} onChange={(e) => set('days', Number(e.target.value))}>
            {DAY_OPTIONS.map((d) => <option key={d} value={d}>{d} days</option>)}
          </Select>
        </Field>
        <Field id="window-miles" label="Or within (mi / hrs)">
          <Select id="window-miles" value={filters.miles} onChange={(e) => set('miles', Number(e.target.value))}>
            {MILE_OPTIONS.map((m) => (
              <option key={m} value={m}>{m} mi / {m / MILES_PER_HOUR_RATIO} hrs</option>
            ))}
          </Select>
        </Field>
        <Field id="alert-asset" label="Asset">
          <Select id="alert-asset" value={filters.assetId} onChange={(e) => set('assetId', e.target.value)}>
            <option value="all">All</option>
            {data.assets.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
        </Field>
        <Field id="alert-task" label="Task type">
          <Select id="alert-task" value={filters.task} onChange={(e) => set('task', e.target.value as TaskType | 'all')}>
            <option value="all">All</option>
            {TASK_TYPES.filter((t) => t !== 'Other').map((t) => <option key={t}>{t}</option>)}
          </Select>
        </Field>
        <Field id="alert-deadline" label="Deadline">
          <Select id="alert-deadline" value={filters.deadline} onChange={(e) => set('deadline', e.target.value as DeadlineFilter)}>
            <option value="all">All</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </Select>
        </Field>
      </div>

      {alerts.length === 0 ? (
        <EmptyState
          title="Nothing due in this window 🎉"
          action={<Button onClick={() => setFilters(DEFAULT_ALERT_FILTERS)}>Clear filters</Button>}
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {alerts.map((item) => (
            <li key={item.schedule.id}>
              <AlertRow item={item} deadlined={deadlined.has(item.asset.id)} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
