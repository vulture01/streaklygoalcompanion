import { PageTransition } from '@/components/PageTransition';
import { useAppStore } from '@/store/useAppStore';
import { motion } from 'framer-motion';
import { Check, SkipForward } from 'lucide-react';

export default function FocusPage() {
  const { goals, logGoal } = useAppStore();
  const activeGoals = goals.filter((g) => !g.paused);

  const todayStr = new Date().toISOString().split('T')[0];

  const handleLog = (goalId: string) => {
    logGoal(goalId, {
      id: Date.now().toString(),
      date: todayStr,
      note: 'Completed from Focus mode',
      mood: '💪',
      energy: 'Medium',
      completed: true,
    });
  };

  return (
    <PageTransition>
      <div className="px-4 pt-16 pb-4 max-w-lg mx-auto flex flex-col min-h-screen">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-foreground mb-1">Focus Mode</h1>
          <p className="text-sm text-muted-foreground">Complete today's goals. Nothing else.</p>
        </div>

        <div className="space-y-4 flex-1">
          {activeGoals.map((goal, i) => {
            const logged = goal.logs.some((l) => l.date === todayStr && l.completed);
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`bg-card rounded-lg p-5 border border-border flex items-center gap-4 ${logged ? 'opacity-50' : ''}`}
              >
                <button
                  onClick={() => !logged && handleLog(goal.id)}
                  disabled={logged}
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
            );
          })}
        </div>
      </div>
    </PageTransition>
  );
}
