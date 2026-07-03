'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { apiGet, apiPatch } from '@/lib/api';
import { DIMENSION_TYPES, PERIOD_TYPES, type DimensionType, type PeriodType, type TargetPlanDetail } from '@/lib/types';

export function PlanEditClient({ planId }: { planId: string }) {
  const router = useRouter();
  const [plan, setPlan] = useState<TargetPlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [dimensionType, setDimensionType] = useState<DimensionType>('Store');
  const [periodType, setPeriodType] = useState<PeriodType>('Monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiGet<TargetPlanDetail>(`/target-plans/${planId}`)
      .then((p) => {
        setPlan(p);
        setName(p.name);
        setDimensionType(p.dimensionType);
        setPeriodType(p.periodType);
        setStartDate(p.startDate.slice(0, 10));
        setEndDate(p.endDate.slice(0, 10));
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load plan'))
      .finally(() => setLoading(false));
  }, [planId]);

  if (loading) return <div className="p-8 text-sm text-zinc-500">Loading…</div>;
  if (loadError || !plan) return <div className="p-8 text-sm text-red-600">{loadError ?? 'Plan not found'}</div>;

  const datesLocked = plan.lines.length > 0;

  if (plan.status !== 'Draft') {
    return (
      <div className="mx-auto max-w-xl w-full p-8">
        <Link href={`/plans/${planId}`} className="text-sm text-zinc-500 hover:underline">
          ← Back to plan
        </Link>
        <p className="mt-4 text-sm text-red-600">Only Draft plans can be edited — this plan is {plan.status}.</p>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiPatch(`/target-plans/${planId}`, {
        name,
        dimensionType,
        periodType,
        ...(datesLocked ? {} : { startDate, endDate }),
      });
      router.push(`/plans/${planId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update plan');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl w-full p-8">
      <Link href={`/plans/${planId}`} className="text-sm text-zinc-500 hover:underline">
        ← Back to plan
      </Link>
      <h1 className="text-2xl font-semibold mt-2 mb-6">Edit Sales Target Plan</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Plan name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Dimension type</span>
          <select
            value={dimensionType}
            onChange={(e) => setDimensionType(e.target.value as DimensionType)}
            className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
          >
            {DIMENSION_TYPES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Period type</span>
          <select
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value as PeriodType)}
            className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
          >
            {PERIOD_TYPES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-4">
          <label className="flex flex-col gap-1 flex-1">
            <span className="text-sm font-medium">Start date</span>
            <input
              required
              type="date"
              value={startDate}
              disabled={datesLocked}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 disabled:opacity-50"
            />
          </label>
          <label className="flex flex-col gap-1 flex-1">
            <span className="text-sm font-medium">End date</span>
            <input
              required
              type="date"
              value={endDate}
              disabled={datesLocked}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 disabled:opacity-50"
            />
          </label>
        </div>

        {datesLocked && (
          <p className="text-xs text-zinc-500">
            The date range can&apos;t be changed because this plan already has {plan.lines.length} target line
            {plan.lines.length === 1 ? '' : 's'} attached.
          </p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
