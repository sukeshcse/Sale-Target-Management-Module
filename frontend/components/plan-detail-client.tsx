'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '@/lib/api';
import { LINE_STATUSES, type LineStatus, type TargetPlanDetail } from '@/lib/types';
import { StatusBadge } from '@/components/status-badge';
import { ImportUploader } from '@/components/import-uploader';
import { SummaryDashboard } from '@/components/summary-dashboard';
import { ProgressBar } from '@/components/progress-bar';

export function PlanDetailClient({ planId }: { planId: string }) {
  const [plan, setPlan] = useState<TargetPlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<LineStatus | ''>('');

  const refetch = useCallback(() => {
    setLoading(true);
    return apiGet<TargetPlanDetail>(`/target-plans/${planId}`)
      .then(setPlan)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load plan'))
      .finally(() => setLoading(false));
  }, [planId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function handleActivate() {
    setActivating(true);
    setError(null);
    try {
      await apiPatch(`/target-plans/${planId}/activate`);
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate plan');
    } finally {
      setActivating(false);
    }
  }

  async function handleRecalculate() {
    setRecalculating(true);
    setError(null);
    try {
      await apiPost(`/target-plans/${planId}/calculate-achievement`);
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to recalculate achievement');
    } finally {
      setRecalculating(false);
    }
  }

  const filteredLines = useMemo(() => {
    if (!plan) return [];
    return statusFilter ? plan.lines.filter((line) => line.status === statusFilter) : plan.lines;
  }, [plan, statusFilter]);

  if (loading && !plan) return <div className="p-8 text-sm text-zinc-500">Loading…</div>;
  if (!plan) return <div className="p-8 text-sm text-red-600">{error ?? 'Plan not found'}</div>;

  return (
    <div className="mx-auto max-w-6xl w-full p-8">
      <Link href="/plans" className="text-sm text-zinc-500 hover:underline">
        ← Back to plans
      </Link>

      <div className="flex items-start justify-between mt-2 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{plan.name}</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {plan.dimensionType} · {plan.periodType} · {plan.startDate.slice(0, 10)} → {plan.endDate.slice(0, 10)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={plan.status} />
          {plan.status === 'Draft' && (
            <Link
              href={`/plans/${planId}/edit`}
              className="rounded-md border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              Edit
            </Link>
          )}
          <button
            onClick={handleRecalculate}
            disabled={recalculating || plan.lines.length === 0}
            className="rounded-md border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-50"
          >
            {recalculating ? 'Recalculating…' : 'Recalculate'}
          </button>
          {plan.status === 'Draft' && (
            <button
              onClick={handleActivate}
              disabled={activating || plan.lines.length === 0}
              title={plan.lines.length === 0 ? 'Import target lines before activating' : undefined}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {activating ? 'Activating…' : 'Activate Plan'}
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <SummaryDashboard summary={plan.summary} />

      <div className="mb-6">
        <ImportUploader planId={planId} onImported={refetch} />
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Target Lines</h2>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as LineStatus | '')}
          className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-1.5 text-sm"
        >
          <option value="">All statuses</option>
          {LINE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900 text-left text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Period</th>
              <th className="px-4 py-3 font-medium">Dimension</th>
              <th className="px-4 py-3 font-medium text-right">Target</th>
              <th className="px-4 py-3 font-medium text-right">Actual</th>
              <th className="px-4 py-3 font-medium w-48">Achievement</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredLines.map((line) => (
              <tr key={line.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-4 py-3">{line.periodLabel}</td>
                <td className="px-4 py-3">{line.dimensionName}</td>
                <td className="px-4 py-3 text-right">{line.targetValue.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">{line.actualValue.toLocaleString()}</td>
                <td className="px-4 py-3">
                  {line.status === 'NoTargetSet' ? <span className="text-zinc-400">—</span> : <ProgressBar pct={line.achievementPct} />}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={line.status} />
                </td>
              </tr>
            ))}
            {filteredLines.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  {plan.lines.length === 0
                    ? 'No target lines yet. Import an XLSX file to populate targets for this plan.'
                    : 'No lines match this status filter.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
