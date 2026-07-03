import type { PlanSummary } from '@/lib/types';
import { StatusBadge } from '@/components/status-badge';
import { Card } from '@/components/ui/card';

function StatTile({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">{label}</p>
      <p className={`text-2xl font-semibold tracking-tight mt-1.5 ${accent ?? 'text-zinc-900 dark:text-zinc-50'}`}>{value}</p>
    </Card>
  );
}

export function SummaryDashboard({ summary }: { summary: PlanSummary }) {
  const achievementAccent =
    summary.overallAchievementPct >= 100
      ? 'text-emerald-600 dark:text-emerald-400'
      : summary.overallAchievementPct >= 70
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-rose-600 dark:text-rose-400';

  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-3.5">
        <StatTile label="Total Target" value={summary.totalTarget.toLocaleString()} />
        <StatTile label="Total Actual" value={summary.totalActual.toLocaleString()} />
        <StatTile label="Overall Achievement" value={`${summary.overallAchievementPct.toFixed(1)}%`} accent={achievementAccent} />
        <StatTile label="Target Lines" value={String(summary.lineCount)} />
      </div>
      <Card className="p-3.5 flex flex-wrap gap-2">
        {(Object.keys(summary.countsByStatus) as Array<keyof typeof summary.countsByStatus>).map((status) => (
          <div
            key={status}
            className="flex items-center gap-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 px-2.5 py-1.5"
          >
            <StatusBadge status={status} />
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 tabular-nums">
              {summary.countsByStatus[status]}
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}
