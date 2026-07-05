'use client';

import { useState, type FormEvent } from 'react';
import { apiPost } from '@/lib/api';
import type { DimensionType, SalesActual } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';

/**
 * Historical sales normally come from an external system (POS/ERP) and there's no
 * spec'd endpoint to create them — but without one, demoing achievement calculation
 * means editing the database directly. This form exists purely to make that demoable
 * through the UI: it records a SalesActual row for the plan's dimension so a follow-up
 * Recalculate actually has new data to sum.
 */
export function SalesActualForm({ dimensionType }: { dimensionType: DimensionType }) {
  const [dimensionId, setDimensionId] = useState('');
  const [dimensionName, setDimensionName] = useState('');
  const [saleDate, setSaleDate] = useState('');
  const [saleAmount, setSaleAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await apiPost<SalesActual>('/sales-actuals', {
        dimensionType,
        dimensionId,
        dimensionName,
        saleDate,
        saleAmount: Number(saleAmount),
      });
      setSuccess(true);
      setDimensionId('');
      setDimensionName('');
      setSaleDate('');
      setSaleAmount('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record sale');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold tracking-tight mb-1">Add Historical Sale</h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
        Records a sale for this plan&apos;s dimension ({dimensionType}) so achievement calculation has real data to
        sum — click <strong>Recalculate</strong> afterward to see it reflected.
      </p>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
        <Field label="Dimension code">
          <Input required value={dimensionId} onChange={(e) => setDimensionId(e.target.value)} placeholder="STR001" />
        </Field>
        <Field label="Dimension name">
          <Input required value={dimensionName} onChange={(e) => setDimensionName(e.target.value)} placeholder="Store North" />
        </Field>
        <Field label="Sale date">
          <Input required type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} />
        </Field>
        <Field label="Sale amount">
          <Input
            required
            type="number"
            min="0"
            step="0.01"
            value={saleAmount}
            onChange={(e) => setSaleAmount(e.target.value)}
            placeholder="25000"
          />
        </Field>
        <div className="col-span-2 sm:col-span-4 flex items-center gap-3 flex-wrap">
          <Button type="submit" variant="secondary" disabled={submitting}>
            {submitting ? 'Recording…' : 'Record Sale'}
          </Button>
          {success && (
            <span className="text-sm text-emerald-600 dark:text-emerald-400">
              Recorded — click Recalculate to update achievement.
            </span>
          )}
          {error && <span className="text-sm text-rose-600">{error}</span>}
        </div>
      </form>
    </Card>
  );
}
