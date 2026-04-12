import { motion } from 'framer-motion';
import { ProgressRing } from './ProgressRing';
import { HeatmapStrip } from './HeatmapStrip';
import { Flame, Pause } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import { useNavigate } from 'react-router-dom';

type Goal = Tables<'goals'>;
type Log = Tables<'logs'>;

interface GoalCardProps {
  goal: Goal;
  logs: Log[];
  index: number;
}

export function GoalCard({ goal, logs, index }: GoalCardProps) {
  const navigate = useNavigate();

  const last7 = logs.filter((l) => {
    const d = new Date(l.date);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff < 7 && l.completed;
  });
  const weekProgress = Math.round((last7.length / 7) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={() => navigate(`/goal/${goal.id}`)}
      className="bg-card rounded-lg p-4 border border-border active:scale-[0.98] transition-transform cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <ProgressRing
          progress={weekProgress}
          size={64}
          strokeWidth={5}
          label={`${weekProgress}%`}
          sublabel="week"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{goal.emoji}</span>
            <h3 className="font-semibold text-foreground truncate">{goal.name}</h3>
            {goal.paused && <Pause size={14} className="text-warning" />}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Flame size={12} className="text-primary" />
            <span>{goal.streak} day streak</span>
            <span className="text-border">•</span>
            <span>Best: {goal.best_streak}</span>
          </div>
          <HeatmapStrip logs={logs} />
        </div>
      </div>
    </motion.div>
  );
}
