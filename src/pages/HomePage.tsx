import { PageTransition } from '@/components/PageTransition';
import { GoalCard } from '@/components/GoalCard';
import { WeeklySummaryBar } from '@/components/WeeklySummaryBar';
import { useGoals, useLogs, useTodos, useProfile, useBadges, useStreakCalculator } from '@/hooks/useSupabaseData';
import { SwipeableCard } from '@/components/SwipeableCard';
import { ConfettiCelebration } from '@/components/ConfettiCelebration';
import { Plus, Bell } from 'lucide-react';
import { useState, useCallback } from 'react';
import { AddGoalSheet } from '@/components/AddGoalSheet';
import { BottomSheet } from '@/components/BottomSheet';

const MOODS = ['💪', '😐', '😓'];
const ENERGIES = ['High', 'Medium', 'Low'] as const;
const PAUSE_REASONS = ['Sick', 'Travel', 'Rest'];

export default function HomePage() {
  const { goals, updateGoal, refetch: refetchGoals } = useGoals();
  const { logs, addLog, refetch: refetchLogs } = useLogs();
  const { todos } = useTodos();
  const { profile } = useProfile();
  const { checkAndAwardBadge } = useBadges();
  const { recalcStreak } = useStreakCalculator();
  const [addOpen, setAddOpen] = useState(false);
  const [logGoalId, setLogGoalId] = useState<string | null>(null);
  const [pauseGoalId, setPauseGoalId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [mood, setMood] = useState('💪');
  const [energy, setEnergy] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [celebration, setCelebration] = useState<number | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTodos = todos.filter((t) => !t.completed).slice(0, 3);

  const handleLog = async () => {
    if (!logGoalId) return;
    await addLog({
      goal_id: logGoalId,
      date: todayStr,
      note,
      mood,
      energy,
      completed: true,
    });
    const { streak } = await recalcStreak(logGoalId);
    const awarded = await checkAndAwardBadge(logGoalId, streak);
    if (awarded) setCelebration(awarded);
    await refetchGoals();
    await refetchLogs();
    setNote('');
    setLogGoalId(null);
  };

  const handlePause = async (reason: string) => {
    if (!pauseGoalId) return;
    await updateGoal(pauseGoalId, { paused: true, pause_reason: reason });
    setPauseGoalId(null);
  };

  return (
    <PageTransition>
      <div className="px-4 pt-12 pb-24 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground">Good {getGreeting()},</p>
            <h1 className="text-2xl font-bold text-foreground">{profile?.name || 'User'} 👋</h1>
          </div>
          <button className="tap-target flex items-center justify-center rounded-full bg-secondary w-10 h-10">
            <Bell size={18} className="text-muted-foreground" />
          </button>
        </div>

        <div className="mb-5">
          <WeeklySummaryBar goals={goals} logs={logs} />
        </div>

        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground">Active Goals</h2>
          <button onClick={() => setAddOpen(true)} className="tap-target flex items-center gap-1 text-sm text-primary font-medium">
            <Plus size={16} /> Add
          </button>
        </div>

        <div className="space-y-3 mb-6">
          {goals.filter(g => !g.paused).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="text-4xl mb-3">🎯</span>
              <p className="text-muted-foreground text-sm mb-4">No goals yet — add your first one</p>
              <button onClick={() => setAddOpen(true)} className="px-5 py-2.5 rounded-lg gradient-primary text-primary-foreground font-medium text-sm tap-target flex items-center gap-1.5">
                <Plus size={16} /> Create Goal
              </button>
            </div>
          ) : (
            goals.filter(g => !g.paused).map((goal, i) => (
              <SwipeableCard
                key={goal.id}
                onSwipeRight={() => setLogGoalId(goal.id)}
                onSwipeLeft={() => setPauseGoalId(goal.id)}
                rightLabel="Log"
                leftLabel="Pause"
              >
                <GoalCard goal={goal} logs={logs.filter(l => l.goal_id === goal.id)} index={i} />
              </SwipeableCard>
            ))
          )}
        </div>

        {todayTodos.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-foreground mb-3">Today's Tasks</h2>
            <div className="space-y-2">
              {todayTodos.map((todo) => (
                <div key={todo.id} className="bg-card rounded-lg p-3 border border-border flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    todo.priority === 'High' ? 'bg-destructive' : todo.priority === 'Medium' ? 'bg-warning' : 'bg-success'
                  }`} />
                  <span className="text-sm text-foreground flex-1">{todo.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Log Sheet */}
      <BottomSheet open={!!logGoalId} onClose={() => setLogGoalId(null)} title="Quick Log">
        <div className="space-y-4">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="What did you do?"
            className="w-full bg-secondary rounded-lg px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
          />
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Mood</label>
            <div className="flex gap-3">
              {MOODS.map((m) => (
                <button key={m} onClick={() => setMood(m)}
                  className={`w-12 h-12 rounded-lg text-xl flex items-center justify-center tap-target ${mood === m ? 'bg-primary/20 ring-2 ring-primary' : 'bg-secondary'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Energy</label>
            <div className="flex gap-2">
              {ENERGIES.map((e) => (
                <button key={e} onClick={() => setEnergy(e)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium tap-target ${energy === e ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleLog} className="w-full py-3.5 rounded-lg gradient-primary text-primary-foreground font-semibold tap-target">
            Save Entry
          </button>
        </div>
      </BottomSheet>

      {/* Pause Sheet */}
      <BottomSheet open={!!pauseGoalId} onClose={() => setPauseGoalId(null)} title="Pause Goal">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Select a reason:</p>
          {PAUSE_REASONS.map((r) => (
            <button key={r} onClick={() => handlePause(r)}
              className="w-full p-4 rounded-lg bg-secondary text-foreground text-left tap-target hover:bg-muted">
              {r}
            </button>
          ))}
        </div>
      </BottomSheet>

      <AddGoalSheet open={addOpen} onClose={() => setAddOpen(false)} />
      <ConfettiCelebration milestone={celebration} onDone={() => setCelebration(null)} />
    </PageTransition>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
