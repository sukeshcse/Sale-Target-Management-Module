const COLORS: Record<string, string> = {
  Draft: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  Active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Achieved: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  Missed: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  NoTargetSet: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${COLORS[status] ?? COLORS.Draft}`}>
      {status}
    </span>
  );
}
