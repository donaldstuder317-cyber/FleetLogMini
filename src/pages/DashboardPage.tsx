import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, ButtonLink } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { Field } from '../components/forms/Field';
import { Select } from '../components/forms/controls';
import { PageHeader } from '../components/layout/PageHeader';
import { AssetRow } from '../components/modules/AssetRow';
import { SummaryStrip } from '../components/modules/SummaryStrip';
import { useAssetSummaries } from '../hooks/useFleet';
import { STATUS_LABEL } from '../services/status';
import type { Status } from '../types';

type StatusFilter = 'all' | Status;
type SortMode = 'urgent' | 'name';

const RANK: Record<Status, number> = { overdue: 0, due: 1, good: 2 };

export function DashboardPage() {
  const summaries = useAssetSummaries();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortMode>('urgent');

  const counts = useMemo(() => {
    const c: Record<Status, number> = { overdue: 0, due: 0, good: 0 };
    for (const s of summaries) c[s.status] += 1;
    return c;
  }, [summaries]);

  const visible = useMemo(() => {
    const list = summaries.filter((s) => filter === 'all' || s.status === filter);
    return [...list].sort((a, b) =>
      sort === 'name'
        ? a.asset.name.localeCompare(b.asset.name)
        : RANK[a.status] - RANK[b.status] || (b.urgent?.percent ?? 0) - (a.urgent?.percent ?? 0),
    );
  }, [summaries, filter, sort]);

  const actions = (
    <>
      <ButtonLink to="/log">
        <Plus size={20} aria-hidden /> Log Service
      </ButtonLink>
      <ButtonLink to="/assets/new" variant="secondary">
        <Plus size={20} aria-hidden /> Add Asset
      </ButtonLink>
    </>
  );

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Every asset's maintenance status at a glance" actions={actions} />

      {summaries.length === 0 ? (
        <EmptyState
          title="No equipment yet — add your first asset"
          action={<ButtonLink to="/assets/new">Add Asset</ButtonLink>}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <SummaryStrip counts={counts} />

          <div className="grid grid-cols-2 gap-3 md:max-w-md">
            <Field id="status-filter" label="Status">
              <Select id="status-filter" value={filter} onChange={(e) => setFilter(e.target.value as StatusFilter)}>
                <option value="all">All</option>
                <option value="overdue">{STATUS_LABEL.overdue}</option>
                <option value="due">{STATUS_LABEL.due}</option>
                <option value="good">{STATUS_LABEL.good}</option>
              </Select>
            </Field>
            <Field id="sort-mode" label="Sort">
              <Select id="sort-mode" value={sort} onChange={(e) => setSort(e.target.value as SortMode)}>
                <option value="urgent">Most urgent</option>
                <option value="name">Name</option>
              </Select>
            </Field>
          </div>

          {visible.length === 0 ? (
            <EmptyState
              title="No assets match this filter"
              action={<Button onClick={() => setFilter('all')}>Clear filter</Button>}
            />
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {visible.map(({ asset, status, urgent }) => (
                <li key={asset.id}>
                  <AssetRow asset={asset} status={status} urgent={urgent} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
