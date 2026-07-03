'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { apiPost } from '@/lib/api';
import { DIMENSION_TYPES, PERIOD_TYPES, type DimensionType, type PeriodType, type TargetPlan } from '@/lib/types';

export default function NewPlanPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [dimensionType, setDimensionType] = useState<DimensionType>('Store');
  const [periodType, setPeriodType] = useState<PeriodType>('Monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const plan = await apiPost<TargetPlan>('/target-plans', {
        name,
        dimensionType,
        periodType,
        startDate,
        endDate,
      });
      router.push(`/plans/${plan.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create plan');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl w-full p-8">
      <Link href="/plans" className="text-sm text-zinc-500 hover:underline">
        ← Back to plans
      </Link>
      <h1 className="text-2xl font-semibold mt-2 mb-6">New Sales Target Plan</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Plan name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Q1 2024 - Store-wise Target"
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
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 flex-1">
            <span className="text-sm font-medium">End date</span>
            <input
              required
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
            />
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Creating…' : 'Create Plan'}
        </button>
      </form>
    </div>
  );
}
