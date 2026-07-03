'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '@/lib/api';
import { LINE_STATUSES, type LineStatus, type TargetPlanDetail } from '@/lib/types';
import { StatusBadge } from '@/components/status-badge';
import { ImportUploader } from '@/components/import-uploader';
import { SummaryDashboard } from '@/components/summary-dashboard';
import { ProgressBar } from '@/components/progress-bar';
import { Card } from '@/components/ui/card';
import { Button, buttonClasses } from '@/components/ui/button';
import { Select } from '@/components/ui/form';

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

  if (loading && !plan) {
    return (
      <div className="mx-auto max-w-6xl w-full p-6 sm:p-8">
        <div className="h-9 w-80 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse mb-8" />
        <div className="h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse mb-5" />
        <div className="h-96 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
      </div>
    );
  }
  if (!plan) return <div className="p-8 text-sm text-rose-600">{error ?? 'Plan not found'}</div>;

  return (
    <div className="mx-auto max-w-6xl w-full p-6 sm:p-8">
      <Link href="/plans" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
        ← Back to plans
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mt-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{plan.name}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
            {plan.dimensionType} <span className="text-zinc-300 dark:text-zinc-700">·</span> {plan.periodType}{' '}
            <span className="text-zinc-300 dark:text-zinc-700">·</span> {plan.startDate.slice(0, 10)} → {plan.endDate.slice(0, 10)}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <StatusBadge status={plan.status} />
          {plan.status === 'Draft' && (
            <Link href={`/plans/${planId}/edit`} className={buttonClasses('secondary', 'md')}>
              Edit
            </Link>
          )}
          <Button variant="secondary" onClick={handleRecalculate} disabled={recalculating || plan.lines.length === 0}>
            {recalculating ? 'Recalculating…' : 'Recalculate'}
          </Button>
          {plan.status === 'Draft' && (
            <Button
              variant="primary"
              onClick={handleActivate}
              disabled={activating || plan.lines.length === 0}
              title={plan.lines.length === 0 ? 'Import target lines before activating' : undefined}
            >
              {activating ? 'Activating…' : 'Activate Plan'}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-500/10 rounded-lg px-3 py-2 mb-5">{error}</p>
      )}

      <SummaryDashboard summary={plan.summary} />

      <div className="mb-6">
        <ImportUploader planId={planId} onImported={refetch} />
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold tracking-tight">Target Lines</h2>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as LineStatus | '')} className="min-w-36">
          <option value="">All statuses</option>
          {LINE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-950/40 text-left">
              <tr>
                {['Period', 'Dimension'].map((h) => (
                  <th key={h} className="px-5 py-3 font-medium text-xs uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                    {h}
                  </th>
                ))}
                <th className="px-5 py-3 font-medium text-xs uppercase tracking-wide text-zinc-400 dark:text-zinc-500 text-right">
                  Target
                </th>
                <th className="px-5 py-3 font-medium text-xs uppercase tracking-wide text-zinc-400 dark:text-zinc-500 text-right">
                  Actual
                </th>
                <th className="px-5 py-3 font-medium text-xs uppercase tracking-wide text-zinc-400 dark:text-zinc-500 w-48">
                  Achievement
                </th>
                <th className="px-5 py-3 font-medium text-xs uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLines.map((line) => (
                <tr
                  key={line.id}
                  className="border-t border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <td className="px-5 py-3.5 font-medium text-zinc-700 dark:text-zinc-300">{line.periodLabel}</td>
                  <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">{line.dimensionName}</td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                    {line.targetValue.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                    {line.actualValue.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5">
                    {line.status === 'NoTargetSet' ? (
                      <span className="text-zinc-400">—</span>
                    ) : (
                      <ProgressBar pct={line.achievementPct} />
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={line.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLines.length === 0 && (
            <div className="py-16 text-center text-sm text-zinc-500">
              {plan.lines.length === 0
                ? 'No target lines yet. Import an XLSX file below to populate targets for this plan.'
                : 'No lines match this status filter.'}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
