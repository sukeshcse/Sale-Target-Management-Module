'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import { DIMENSION_TYPES, PERIOD_TYPES, PLAN_STATUSES, type PaginatedResult, type TargetPlan } from '@/lib/types';
import { StatusBadge } from '@/components/status-badge';

export default function PlansListPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-zinc-500">Loading…</div>}>
      <PlansListInner />
    </Suspense>
  );
}

function PlansListInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<PaginatedResult<TargetPlan> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const status = searchParams.get('status') ?? '';
  const dimensionType = searchParams.get('dimensionType') ?? '';
  const periodType = searchParams.get('periodType') ?? '';

  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (dimensionType) params.set('dimensionType', dimensionType);
    if (periodType) params.set('periodType', periodType);

    setLoading(true);
    setError(null);
    apiGet<PaginatedResult<TargetPlan>>(`/target-plans?${params.toString()}`)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [status, dimensionType, periodType]);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/plans?${params.toString()}`);
  }

  return (
    <div className="mx-auto max-w-6xl w-full p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Sales Target Plans</h1>
        <Link
          href="/plans/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New Plan
        </Link>
      </div>

      <div className="flex gap-3 mb-6">
        <select
          className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-1.5 text-sm"
          value={status}
          onChange={(e) => updateFilter('status', e.target.value)}
        >
          <option value="">All statuses</option>
          {PLAN_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-1.5 text-sm"
          value={dimensionType}
          onChange={(e) => updateFilter('dimensionType', e.target.value)}
        >
          <option value="">All dimensions</option>
          {DIMENSION_TYPES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-1.5 text-sm"
          value={periodType}
          onChange={(e) => updateFilter('periodType', e.target.value)}
        >
          <option value="">All periods</option>
          {PERIOD_TYPES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-sm text-zinc-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {data && (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900 text-left text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Dimension</th>
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 font-medium">Date Range</th>
                <th className="px-4 py-3 font-medium">Lines</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((plan) => (
                <tr
                  key={plan.id}
                  className="border-t border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
                  onClick={() => router.push(`/plans/${plan.id}`)}
                >
                  <td className="px-4 py-3 font-medium text-blue-600 dark:text-blue-400">{plan.name}</td>
                  <td className="px-4 py-3">{plan.dimensionType}</td>
                  <td className="px-4 py-3">{plan.periodType}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {plan.startDate.slice(0, 10)} → {plan.endDate.slice(0, 10)}
                  </td>
                  <td className="px-4 py-3">{plan._count?.lines ?? 0}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={plan.status} />
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                    No plans found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
