'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { apiGet, apiPatch } from '@/lib/api';
import { DIMENSION_TYPES, PERIOD_TYPES, type DimensionType, type PeriodType, type TargetPlanDetail } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';

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

  if (loading) {
    return (
      <div className="mx-auto max-w-xl w-full p-6 sm:p-8">
        <div className="h-64 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
      </div>
    );
  }
  if (loadError || !plan) return <div className="p-8 text-sm text-rose-600">{loadError ?? 'Plan not found'}</div>;

  const datesLocked = plan.lines.length > 0;

  if (plan.status !== 'Draft') {
    return (
      <div className="mx-auto max-w-xl w-full p-6 sm:p-8">
        <Link href={`/plans/${planId}`} className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          ← Back to plan
        </Link>
        <p className="mt-4 text-sm text-rose-600 bg-rose-50 dark:bg-rose-500/10 rounded-lg px-3 py-2">
          Only Draft plans can be edited — this plan is {plan.status}.
        </p>
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
    <div className="mx-auto max-w-xl w-full p-6 sm:p-8">
      <Link href={`/plans/${planId}`} className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
        ← Back to plan
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight mt-3 mb-6">Edit Sales Target Plan</h1>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Field label="Plan name">
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Dimension type">
              <Select value={dimensionType} onChange={(e) => setDimensionType(e.target.value as DimensionType)}>
                {DIMENSION_TYPES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Period type">
              <Select value={periodType} onChange={(e) => setPeriodType(e.target.value as PeriodType)}>
                {PERIOD_TYPES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Start date">
              <Input required type="date" value={startDate} disabled={datesLocked} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
            <Field label="End date">
              <Input required type="date" value={endDate} disabled={datesLocked} onChange={(e) => setEndDate(e.target.value)} />
            </Field>
          </div>

          {datesLocked && (
            <p className="text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg px-3 py-2">
              The date range can&apos;t be changed because this plan already has {plan.lines.length} target line
              {plan.lines.length === 1 ? '' : 's'} attached.
            </p>
          )}

          {error && (
            <p className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-500/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <Button type="submit" variant="primary" disabled={submitting} className="mt-1 w-full">
            {submitting ? 'Saving…' : 'Save Changes'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
