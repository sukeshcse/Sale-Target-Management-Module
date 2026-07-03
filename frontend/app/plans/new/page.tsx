'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { apiPost } from '@/lib/api';
import { DIMENSION_TYPES, PERIOD_TYPES, type DimensionType, type PeriodType, type TargetPlan } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';

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
    <div className="mx-auto max-w-xl w-full p-6 sm:p-8">
      <Link href="/plans" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
        ← Back to plans
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight mt-3 mb-6">New Sales Target Plan</h1>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Field label="Plan name">
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Q1 2024 - Store-wise Target"
            />
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
              <Input required type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
            <Field label="End date">
              <Input required type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Field>
          </div>

          {error && (
            <p className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-500/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <Button type="submit" variant="primary" disabled={submitting} className="mt-1 w-full">
            {submitting ? 'Creating…' : 'Create Plan'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
