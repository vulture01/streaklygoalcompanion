import { PageTransition } from '@/components/PageTransition';
import { useGoals, useLogs } from '@/hooks/useSupabaseData';
import { ProgressRing } from '@/components/ProgressRing';
import { HeatmapStrip } from '@/components/HeatmapStrip';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { Download, Pencil, Trash2 } from 'lucide-react';
import { useRef, useCallback, useState } from 'react';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import { EditGoalSheet } from '@/components/EditGoalSheet';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import type { Tables } from '@/integrations/supabase/types';

type Goal = Tables<'goals'>;

export default function AnalyticsPage() {
  const { goals, deleteGoal } = useGoals();
  const { logs, refetch: refetchLogs } = useLogs();
  const shareRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Goal | null>(null);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayStats = dayNames.map((name, dayIndex) => {
    const count = logs.filter((l) => {
      const d = new Date(l.date).getDay();
      return d === dayIndex && l.completed;
    }).length;
    return { day: name, count };
  });

  const handleExport = useCallback(async () => {
    if (!shareRef.current) return;
    try {
      const canvas = await html2canvas(shareRef.current, {
        backgroundColor: '#0A0A0A',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = 'streakly-progress.png';
      link.href = canvas.toDataURL();
      link.click();
      toast.success('Image saved!');
    } catch {
      toast.error('Failed to export');
    }
  }, []);

  return (
    <PageTransition>
      <div className="px-4 pt-12 pb-24 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <button onClick={handleExport} className="tap-target flex items-center gap-1 text-sm text-primary font-medium">
            <Download size={16} /> Export
          </button>
        </div>

        {/* Share Card */}
        <div ref={shareRef} className="bg-card rounded-lg p-5 border border-border mb-5">
          <div className="flex items-center justify-around flex-wrap gap-3">
            {goals.map((goal) => {
              const goalLogs = logs.filter(l => l.goal_id === goal.id);
              const completed = goalLogs.filter(l => l.completed).length;
              const pct = Math.round((completed / Math.max(30, 1)) * 100);
              return (
                <div key={goal.id} className="flex flex-col items-center gap-2">
                  <ProgressRing progress={Math.min(pct, 100)} size={56} strokeWidth={4} label={`${Math.min(pct, 100)}%`} />
                  <span className="text-xs text-muted-foreground">{goal.emoji} {goal.name}</span>
                  <span className="text-xs text-foreground font-medium">{goal.streak}🔥</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card rounded-lg p-4 border border-border mb-5">
          <h3 className="text-sm font-medium text-foreground mb-3">Best & Worst Days</h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={dayStats}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(0,0%,55%)', fontSize: 11 }} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: 'hsl(0,0%,8%)', border: '1px solid hsl(0,0%,16%)', borderRadius: 8, color: '#fff', fontSize: 12 }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="url(#analyticsGrad)" />
              <defs>
                <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(263, 70%, 58%)" />
                  <stop offset="100%" stopColor="hsl(330, 80%, 60%)" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {goals.map((goal, i) => {
          const goalLogs = logs.filter(l => l.goal_id === goal.id);
          return (
            <motion.div key={goal.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-card rounded-lg p-4 border border-border mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{goal.emoji}</span>
                <h3 className="text-sm font-medium text-foreground">{goal.name}</h3>
                <span className="ml-auto text-xs text-muted-foreground">{goal.streak} day streak</span>
                <button
                  onClick={() => setEditing(goal)}
                  className="text-muted-foreground hover:text-primary p-1.5 tap-target"
                  aria-label="Edit goal"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => setPendingDelete(goal)}
                  className="text-muted-foreground hover:text-destructive p-1.5 tap-target"
                  aria-label="Delete goal"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <HeatmapStrip logs={goalLogs} />
            </motion.div>
          );
        })}
      </div>

      <EditGoalSheet goal={editing} onClose={() => setEditing(null)} />
      <ConfirmDeleteDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title="Delete this goal?"
        description="This will remove all its history too."
        onConfirm={async () => {
          if (pendingDelete) {
            await deleteGoal(pendingDelete.id);
            await refetchLogs();
            setPendingDelete(null);
          }
        }}
      />
    </PageTransition>
  );
}
