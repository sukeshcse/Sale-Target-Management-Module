'use client';

import { useRef, useState, type DragEvent } from 'react';
import { apiPostForm } from '@/lib/api';
import type { ImportPreviewResult, ImportRunResult } from '@/lib/import-types';

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
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
      <h2 className="text-lg font-semibold mb-4">Import Target Values (XLSX)</h2>

      {(stage === 'idle' || stage === 'previewing') && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center text-sm ${
            dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-zinc-300 dark:border-zinc-700'
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
          {stage === 'previewing' ? (
            <p className="text-zinc-500">Parsing {file?.name}…</p>
          ) : (
            <p className="text-zinc-500">Drag and drop an .xlsx file here, or click to browse</p>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

      {preview && (stage === 'preview' || stage === 'confirming') && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-zinc-500">
              {file?.name} — {preview.totalRows} row{preview.totalRows === 1 ? '' : 's'} parsed
              {preview.hasErrors ? ', errors found' : ', all valid'}
            </p>
            <div className="flex gap-2">
              <button onClick={reset} className="rounded-md border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm">
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={preview.hasErrors || stage === 'confirming'}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {stage === 'confirming' ? 'Importing…' : 'Confirm Import'}
              </button>
            </div>
          </div>

          {preview.hasErrors && (
            <p className="text-sm text-red-600 mb-3">
              Fix the row errors below and re-upload — an import is all-or-nothing, so no rows will be saved until every row is valid.
            </p>
          )}

          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900 text-left text-zinc-500 sticky top-0">
                <tr>
                  <th className="px-3 py-2 font-medium">Row</th>
                  <th className="px-3 py-2 font-medium">Period</th>
                  <th className="px-3 py-2 font-medium">DimensionCode</th>
                  <th className="px-3 py-2 font-medium">DimensionName</th>
                  <th className="px-3 py-2 font-medium text-right">TargetValue</th>
                  <th className="px-3 py-2 font-medium">Errors</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr
                    key={row.row}
                    className={`border-t border-zinc-100 dark:border-zinc-800 ${row.errors.length > 0 ? 'bg-red-50 dark:bg-red-950/20' : ''}`}
                  >
                    <td className="px-3 py-2">{row.row}</td>
                    <td className="px-3 py-2">{row.period}</td>
                    <td className="px-3 py-2">{row.dimensionCode}</td>
                    <td className="px-3 py-2">{row.dimensionName}</td>
                    <td className="px-3 py-2 text-right">{row.targetValue?.toLocaleString() ?? '—'}</td>
                    <td className="px-3 py-2 text-red-600 text-xs">{row.errors.join('; ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result && stage === 'result' && (
        <div className="mt-4">
          <div className={`rounded-md p-4 text-sm ${result.status === 'Success' ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
            <p className="font-medium mb-2">{result.status === 'Success' ? 'Import succeeded' : 'Import failed'}</p>
            <p>
              {result.totalRows} row{result.totalRows === 1 ? '' : 's'} total · {result.importedRows} imported ·{' '}
              {result.failedRows} failed
            </p>
            {result.errors.length > 0 && (
              <ul className="mt-2 list-disc list-inside text-red-600">
                {result.errors.map((e) => (
                  <li key={e.row}>
                    Row {e.row}: {e.errors.join('; ')}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button onClick={reset} className="mt-3 rounded-md border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm">
            Import Another File
          </button>
        </div>
      )}
    </div>
  );
}
