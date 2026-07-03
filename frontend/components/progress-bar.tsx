export function ProgressBar({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(pct, 150));
  const color = pct >= 100 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div className="flex items-center gap-2.5 w-full">
      <div className="h-1.5 flex-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-[width] duration-500 ease-out`} style={{ width: `${(clamped / 150) * 100}%` }} />
      </div>
      <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400 w-12 text-right font-medium">
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}
