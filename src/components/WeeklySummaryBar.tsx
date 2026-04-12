import { TrendingUp } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Goal = Tables<'goals'>;
type Log = Tables<'logs'>;

interface Props {
  goals: Goal[];
  logs: Log[];
}

export function WeeklySummaryBar({ goals, logs }: Props) {
  const totalLogs = logs.filter((l) => {
    const diff = (Date.now() - new Date(l.date).getTime()) / (1000 * 60 * 60 * 24);
    return diff < 7 && l.completed;
  }).length;

  const totalPossible = goals.filter(g => !g.paused).length * 7;
  const pct = totalPossible > 0 ? Math.round((totalLogs / totalPossible) * 100) : 0;

  return (
    <div className="bg-card rounded-lg p-4 border border-border">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-primary" />
          <span className="text-sm font-medium text-foreground">This Week</span>
        </div>
        <span className="text-sm font-bold gradient-primary-text">{pct}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full gradient-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        {totalLogs} of {totalPossible} goals completed
      </p>
    </div>
  );
}
