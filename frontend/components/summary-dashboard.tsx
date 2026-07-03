import type { PlanSummary } from '@/lib/types';
import { StatusBadge } from '@/components/status-badge';

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-xl font-semibold mt-1">{value}</p>
    </div>
  );
}

export function SummaryDashboard({ summary }: { summary: PlanSummary }) {
  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        <StatTile label="Total Target" value={summary.totalTarget.toLocaleString()} />
        <StatTile label="Total Actual" value={summary.totalActual.toLocaleString()} />
        <StatTile label="Overall Achievement" value={`${summary.overallAchievementPct.toFixed(1)}%`} />
        <StatTile label="Target Lines" value={String(summary.lineCount)} />
      </div>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(summary.countsByStatus) as Array<keyof typeof summary.countsByStatus>).map((status) => (
          <div key={status} className="flex items-center gap-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 px-2.5 py-1">
            <StatusBadge status={status} />
            <span className="text-sm text-zinc-500">{summary.countsByStatus[status]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
