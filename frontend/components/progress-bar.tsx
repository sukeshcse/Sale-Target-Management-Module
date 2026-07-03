export function ProgressBar({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(pct, 150));
  const color = pct >= 100 ? 'bg-green-500' : pct >= 70 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="h-2 flex-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${(clamped / 150) * 100}%` }} />
      </div>
      <span className="text-xs tabular-nums text-zinc-500 w-12 text-right">{pct.toFixed(1)}%</span>
    </div>
  );
}
