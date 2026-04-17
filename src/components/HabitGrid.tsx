interface HabitGridProps {
  completionDates: string[];
  days?: number;
}

export function HabitGrid({ completionDates, days = 7 }: HabitGridProps) {
  const set = new Set(completionDates);
  const cells = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const ds = date.toISOString().split('T')[0];
    const done = set.has(ds);
    cells.push(
      <div
        key={ds}
        className={`w-5 h-5 rounded-sm ${done ? 'gradient-primary' : 'bg-muted'}`}
        title={`${ds}: ${done ? '✓' : '—'}`}
      />
    );
  }
  return <div className="flex gap-1">{cells}</div>;
}
