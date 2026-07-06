'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import { DIMENSION_TYPES, PERIOD_TYPES, PLAN_STATUSES, type PaginatedResult, type TargetPlan } from '@/lib/types';
import { StatusBadge } from '@/components/status-badge';
import { Card } from '@/components/ui/card';
import { buttonClasses } from '@/components/ui/button';
import { Select } from '@/components/ui/form';

export default function PlansListPage() {
  return (
    <Suspense fallback={<PageShell />}>
      <PlansListInner />
    </Suspense>
  );
}

function PageShell() {
  return (
    <div className="mx-auto max-w-6xl w-full p-6 sm:p-8">
      <div className="h-9 w-64 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse mb-8" />
      <div className="h-64 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
    </div>
  );
}

function PlansListInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Loading is derived (result for the current filter key hasn't arrived yet) instead of
  // being set synchronously inside the effect — avoids cascading renders and, via the
  // key check + cancellation flag, stale responses from superseded filter changes.
  const [result, setResult] = useState<{
    key: string;
    data: PaginatedResult<TargetPlan> | null;
    error: string | null;
  } | null>(null);

  const status = searchParams.get('status') ?? '';
  const dimensionType = searchParams.get('dimensionType') ?? '';
  const periodType = searchParams.get('periodType') ?? '';
  const filterKey = `${status}|${dimensionType}|${periodType}`;

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (dimensionType) params.set('dimensionType', dimensionType);
    if (periodType) params.set('periodType', periodType);

    apiGet<PaginatedResult<TargetPlan>>(`/target-plans?${params.toString()}`)
      .then((data) => {
        if (!cancelled) setResult({ key: filterKey, data, error: null });
      })
      .catch((err: Error) => {
        if (!cancelled) setResult({ key: filterKey, data: null, error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [status, dimensionType, periodType, filterKey]);

  const current = result?.key === filterKey ? result : null;
  const loading = !current;
  const data = current?.data ?? null;
  const error = current?.error ?? null;

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/plans?${params.toString()}`);
  }

  return (
    <div className="mx-auto max-w-6xl w-full p-6 sm:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sales Target Plans</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Define, import, and track achievement across your business dimensions.
          </p>
        </div>
        <Link href="/plans/new" className={buttonClasses('primary', 'md')}>
          <PlusIcon />
          New Plan
        </Link>
      </div>

      <Card className="p-4 mb-5 flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mr-1">Filter</span>
        <Select value={status} onChange={(e) => updateFilter('status', e.target.value)} className="min-w-36">
          <option value="">All statuses</option>
          {PLAN_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select value={dimensionType} onChange={(e) => updateFilter('dimensionType', e.target.value)} className="min-w-36">
          <option value="">All dimensions</option>
          {DIMENSION_TYPES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Select>
        <Select value={periodType} onChange={(e) => updateFilter('periodType', e.target.value)} className="min-w-36">
          <option value="">All periods</option>
          {PERIOD_TYPES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
      </Card>

      {error && <p className="text-sm text-rose-600 mb-4">{error}</p>}

      {loading && <PageShell />}

      {!loading && data && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-950/40 text-left">
                <tr>
                  {['Name', 'Dimension', 'Period', 'Date Range', 'Lines', 'Status'].map((h) => (
                    <th key={h} className="px-5 py-3 font-medium text-xs uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.items.map((plan) => (
                  <tr
                    key={plan.id}
                    className="border-t border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors"
                    onClick={() => router.push(`/plans/${plan.id}`)}
                  >
                    <td className="px-5 py-3.5 font-medium text-primary">{plan.name}</td>
                    <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">{plan.dimensionType}</td>
                    <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">{plan.periodType}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                      {plan.startDate.slice(0, 10)} → {plan.endDate.slice(0, 10)}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">{plan._count?.lines ?? 0}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={plan.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.items.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                  <InboxIcon />
                </div>
                <p className="text-sm text-zinc-500">No plans match these filters yet.</p>
                <Link href="/plans/new" className={buttonClasses('secondary', 'sm')}>
                  Create your first plan
                </Link>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 12h4l2 3h6l2-3h4M5 12 3 19a2 2 0 0 0 2 2.5h14A2 2 0 0 0 21 19l-2-7M5 12l2.5-6.5A2 2 0 0 1 9.4 4h5.2a2 2 0 0 1 1.9 1.5L19 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
