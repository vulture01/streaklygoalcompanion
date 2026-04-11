import type { GoalLog } from '@/store/useAppStore';

interface HeatmapStripProps {
  logs: GoalLog[];
  days?: number;
}

export function HeatmapStrip({ logs, days = 30 }: HeatmapStripProps) {
  const cells = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const log = logs.find((l) => l.date === dateStr);
    const completed = log?.completed;

    let bgClass = 'bg-muted';
    if (log && completed) bgClass = 'gradient-primary';
    else if (log && !completed) bgClass = 'bg-destructive/40';

    cells.push(
      <div
        key={dateStr}
        className={`w-2.5 h-2.5 rounded-sm ${bgClass}`}
        title={`${dateStr}: ${completed ? '✓' : log ? '✗' : '—'}`}
      />
    );
  }

  return (
    <div className="flex gap-[3px] flex-wrap">
      {cells}
    </div>
  );
}
