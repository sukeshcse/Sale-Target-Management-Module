const STYLES: Record<string, string> = {
  Draft: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  Active: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300',
  Achieved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  Missed: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
  Pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  NoTargetSet: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
};

const DOTS: Record<string, string> = {
  Draft: 'bg-zinc-400',
  Active: 'bg-indigo-500',
  Achieved: 'bg-emerald-500',
  Missed: 'bg-rose-500',
  Pending: 'bg-amber-500',
  NoTargetSet: 'bg-zinc-400',
};

// Spec calls this status "No Target Set"; the enum value has no spaces.
const LABELS: Record<string, string> = { NoTargetSet: 'No Target Set' };

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[status] ?? STYLES.Draft}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOTS[status] ?? DOTS.Draft}`} />
      {LABELS[status] ?? status}
    </span>
  );
}
