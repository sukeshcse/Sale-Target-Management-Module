'use client';

import { useRef, useState, type DragEvent } from 'react';
import { apiPostForm } from '@/lib/api';
import type { ImportPreviewResult, ImportRunResult } from '@/lib/import-types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Stage = 'idle' | 'previewing' | 'preview' | 'confirming' | 'result';

export function ImportUploader({ planId, onImported }: { planId: string; onImported: () => void }) {
  const [stage, setStage] = useState<Stage>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [result, setResult] = useState<ImportRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(selected: File) {
    setFile(selected);
    setStage('previewing');
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', selected);
      const res = await apiPostForm<ImportPreviewResult>(`/target-plans/${planId}/import?preview=true`, formData);
      setPreview(res);
      setStage('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
      setStage('idle');
    }
  }

  async function handleConfirm() {
    if (!file) return;
    setStage('confirming');
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiPostForm<ImportRunResult>(`/target-plans/${planId}/import`, formData);
      setResult(res);
      setStage('result');
      if (res.status === 'Success') onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setStage('preview');
    }
  }

  function reset() {
    setStage('idle');
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleFile(dropped);
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold tracking-tight mb-4">Import Target Values (XLSX)</h2>

      {(stage === 'idle' || stage === 'previewing') && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
            dragOver
              ? 'border-primary bg-indigo-50 dark:bg-indigo-500/10'
              : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected) handleFile(selected);
            }}
          />
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
              <UploadIcon />
            </div>
            {stage === 'previewing' ? (
              <p className="text-sm text-zinc-500">Parsing {file?.name}…</p>
            ) : (
              <>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  <span className="font-medium text-primary">Click to browse</span> or drag and drop an .xlsx file
                </p>
                <p className="text-xs text-zinc-400">Period, DimensionCode, DimensionName, TargetValue columns expected</p>
              </>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-500/10 rounded-lg px-3 py-2 mt-3">{error}</p>
      )}

      {preview && (stage === 'preview' || stage === 'confirming') && (
        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{file?.name}</span> — {preview.totalRows} row
              {preview.totalRows === 1 ? '' : 's'} parsed, {preview.hasErrors ? 'errors found' : 'all valid'}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={reset}>
                Cancel
              </Button>
              <Button variant={preview.hasErrors ? 'danger' : 'primary'} size="sm" onClick={handleConfirm} disabled={stage === 'confirming'}>
                {stage === 'confirming' ? 'Importing…' : preview.hasErrors ? 'Confirm Anyway (will fail)' : 'Confirm Import'}
              </Button>
            </div>
          </div>

          {preview.hasErrors && (
            <p className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-500/10 rounded-lg px-3 py-2 mb-3">
              This file has row errors — the import is all-or-nothing, so confirming now will save nothing and show you
              the same errors as a rejected-import report. Fix the rows below and re-upload, or confirm anyway to see
              that report.
            </p>
          )}

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 max-h-96 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-950/40 text-left sticky top-0">
                <tr>
                  {['Row', 'Period', 'DimensionCode', 'DimensionName'].map((h) => (
                    <th key={h} className="px-3.5 py-2.5 font-medium text-xs uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                      {h}
                    </th>
                  ))}
                  <th className="px-3.5 py-2.5 font-medium text-xs uppercase tracking-wide text-zinc-400 dark:text-zinc-500 text-right">
                    TargetValue
                  </th>
                  <th className="px-3.5 py-2.5 font-medium text-xs uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Errors</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr
                    key={row.row}
                    className={`border-t border-zinc-100 dark:border-zinc-800 ${row.errors.length > 0 ? 'bg-rose-50/70 dark:bg-rose-500/[0.06]' : ''}`}
                  >
                    <td className="px-3.5 py-2.5 tabular-nums text-zinc-500">{row.row}</td>
                    <td className="px-3.5 py-2.5">{row.period}</td>
                    <td className="px-3.5 py-2.5">{row.dimensionCode}</td>
                    <td className="px-3.5 py-2.5">{row.dimensionName}</td>
                    <td className="px-3.5 py-2.5 text-right tabular-nums">{row.targetValue?.toLocaleString() ?? '—'}</td>
                    <td className="px-3.5 py-2.5 text-rose-600 dark:text-rose-400 text-xs">{row.errors.join('; ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result && stage === 'result' && (
        <div className="mt-4">
          <div
            className={`rounded-xl p-4 text-sm ${
              result.status === 'Success'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-500/10 text-rose-900 dark:text-rose-200'
            }`}
          >
            <p className="font-medium mb-1.5">{result.status === 'Success' ? 'Import succeeded' : 'Import failed'}</p>
            <p className="opacity-90">
              {result.totalRows} row{result.totalRows === 1 ? '' : 's'} total · {result.importedRows} imported ·{' '}
              {result.totalRows - result.importedRows - result.failedRows} skipped · {result.failedRows} failed
            </p>
            {result.status === 'Failed' && result.failedRows < result.totalRows && (
              <p className="mt-1 text-xs opacity-75">
                Skipped rows were individually valid but weren&apos;t saved — the import is all-or-nothing, so nothing
                persists until every row passes.
              </p>
            )}
            {result.errors.length > 0 && (
              <ul className="mt-2 list-disc list-inside space-y-0.5">
                {result.errors.map((e) => (
                  <li key={e.row}>
                    Row {e.row}: {e.errors.join('; ')}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Button variant="secondary" size="sm" onClick={reset} className="mt-3">
            Import Another File
          </Button>
        </div>
      )}
    </Card>
  );
}

function UploadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 16V4m0 0-4 4m4-4 4 4M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
