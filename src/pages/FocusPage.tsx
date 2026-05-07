import { PageTransition } from '@/components/PageTransition';
import { useGoals, useLogs, useBadges, useStreakCalculator } from '@/hooks/useSupabaseData';
import { ConfettiCelebration } from '@/components/ConfettiCelebration';
import { SwipeableCard } from '@/components/SwipeableCard';
import { motion } from 'framer-motion';
import { Check, SkipForward } from 'lucide-react';
import { useState } from 'react';

export default function FocusPage() {
  const { goals, refetch: refetchGoals } = useGoals();
  const { logs, addLog, refetch: refetchLogs } = useLogs();
  const { checkAndAwardBadge } = useBadges();
  const { recalcStreak } = useStreakCalculator();
  const [celebration, setCelebration] = useState<number | null>(null);
  const [logging, setLogging] = useState<string | null>(null);

  const activeGoals = goals.filter((g) => !g.paused);
  const todayStr = new Date().toISOString().split('T')[0];

  const handleLog = async (goalId: string) => {
    setLogging(goalId);
    await addLog({
      goal_id: goalId,
      date: todayStr,
      note: 'Completed from Focus mode',
      mood: '💪',
      energy: 'Medium',
      completed: true,
    });
    const { streak } = await recalcStreak(goalId);
    const awarded = await checkAndAwardBadge(goalId, streak);
    if (awarded) setCelebration(awarded);
    await refetchGoals();
    await refetchLogs();
    setLogging(null);
  };

  return (
    <PageTransition>
      <div className="px-4 pt-16 safe-bottom max-w-lg mx-auto flex flex-col min-h-screen">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-foreground mb-1">Focus Mode</h1>
          <p className="text-sm text-muted-foreground">Complete today's goals. Nothing else.</p>
        </div>

        <div className="space-y-4 flex-1">
          {activeGoals.map((goal, i) => {
            const logged = logs.some((l) => l.goal_id === goal.id && l.date === todayStr && l.completed);
            return (
              <SwipeableCard key={goal.id} onSwipeRight={() => !logged && handleLog(goal.id)} rightLabel="Complete" leftLabel="Skip">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`bg-card rounded-lg p-5 border border-border flex items-center gap-4 ${logged ? 'opacity-50' : ''}`}
                >
                  <button
                    onClick={() => !logged && handleLog(goal.id)}
                    disabled={logged || logging === goal.id}
                    className={`w-12 h-12 rounded-full flex items-center justify-center tap-target shrink-0 ${
                      logged ? 'gradient-primary' : 'border-2 border-border'
                    }`}
                  >
                    {logged && <Check size={20} className="text-primary-foreground" />}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{goal.emoji}</span>
                      <h3 className={`font-semibold text-lg ${logged ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {goal.name}
                      </h3>
                    </div>
                  </div>
                  {!logged && (
                    <button className="tap-target text-muted-foreground">
                      <SkipForward size={18} />
                    </button>
                  )}
                </motion.div>
              </SwipeableCard>
            );
          })}
        </div>
      </div>
      <ConfettiCelebration milestone={celebration} onDone={() => setCelebration(null)} />
    </PageTransition>
  );
}
