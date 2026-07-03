'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPatch } from '@/lib/api';
import type { TargetPlanDetail } from '@/lib/types';
import { StatusBadge } from '@/components/status-badge';

export function PlanDetailClient({ planId }: { planId: string }) {
  const [plan, setPlan] = useState<TargetPlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);

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

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900 text-left text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Period</th>
              <th className="px-4 py-3 font-medium">Dimension</th>
              <th className="px-4 py-3 font-medium text-right">Target</th>
              <th className="px-4 py-3 font-medium text-right">Actual</th>
              <th className="px-4 py-3 font-medium text-right">Achievement</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {plan.lines.map((line) => (
              <tr key={line.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-4 py-3">{line.periodLabel}</td>
                <td className="px-4 py-3">{line.dimensionName}</td>
                <td className="px-4 py-3 text-right">{line.targetValue.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">{line.actualValue.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">{line.achievementPct.toFixed(1)}%</td>
                <td className="px-4 py-3">
                  <StatusBadge status={line.status} />
                </td>
              </tr>
            ))}
            {plan.lines.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  No target lines yet. Import an XLSX file to populate targets for this plan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
