import { useParams, useNavigate } from 'react-router-dom';
import { PageTransition } from '@/components/PageTransition';
import { ProgressRing } from '@/components/ProgressRing';
import { HeatmapStrip } from '@/components/HeatmapStrip';
import { useGoals, useLogs, useBadges, useStreakCalculator } from '@/hooks/useSupabaseData';
import { useGroqAI } from '@/hooks/useGroqAI';
import { ArrowLeft, Flame, Sparkles, Pause, Play, RefreshCw } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { BottomSheet } from '@/components/BottomSheet';
import { ConfettiCelebration } from '@/components/ConfettiCelebration';
import { BarChart, Bar, XAxis, ResponsiveContainer } from 'recharts';

const MOODS = ['💪', '😐', '😓'];
const ENERGIES = ['High', 'Medium', 'Low'] as const;

export default function GoalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { goals, updateGoal, refetch: refetchGoals } = useGoals();
  const { logs, addLog, refetch: refetchLogs } = useLogs(id);
  const { badges } = useBadges();
  const { recalcStreak } = useStreakCalculator();
  const { callGroq, loading: aiLoading, rateLimited, rateLimitMessage } = useGroqAI();
  const [logOpen, setLogOpen] = useState(false);
  const [note, setNote] = useState('');
  const [mood, setMood] = useState('💪');
  const [energy, setEnergy] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<number | null>(null);
  const { checkAndAwardBadge } = useBadges();

  const goal = goals.find((g) => g.id === id);
  const goalBadges = badges.filter(b => b.goal_id === id);

  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const log = logs.find((l) => l.date === dateStr);
    return { day: d.toLocaleDateString('en', { weekday: 'short' }), value: log?.completed ? 1 : 0 };
  });

  const weeklyPct = Math.round((weekData.filter(d => d.value).length / 7) * 100);

  const fetchAI = useCallback(async () => {
    if (!goal) return;
    const last14 = logs.slice(0, 14).map(l => `${l.date}: mood=${l.mood}, energy=${l.energy}, note=${l.note || 'none'}`).join('\n');
    const result = await callGroq('suggestions', last14);
    setSuggestions(result);
    const pred = await callGroq('prediction', `Current streak: ${goal.streak}, best: ${goal.best_streak}, weekly completion: ${weeklyPct}%`);
    setPrediction(pred);
  }, [goal, logs, weeklyPct]);

  useEffect(() => {
    if (goal && logs.length > 0 && !suggestions) fetchAI();
  }, [goal, logs.length]);

  const handleLog = async () => {
    if (!goal) return;
    await addLog({
      goal_id: goal.id,
      date: new Date().toISOString().split('T')[0],
      note,
      mood,
      energy,
      completed: true,
    });
    const { streak } = await recalcStreak(goal.id);
    const awarded = await checkAndAwardBadge(goal.id, streak);
    if (awarded) setCelebration(awarded);
    await refetchGoals();
    await refetchLogs();
    setNote('');
    setLogOpen(false);
  };

  if (!goal) return <div className="p-4 text-foreground">Goal not found</div>;

  return (
    <PageTransition>
      <div className="px-4 pt-12 safe-bottom max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="tap-target"><ArrowLeft size={22} className="text-foreground" /></button>
          <span className="text-2xl">{goal.emoji}</span>
          <h1 className="text-xl font-bold text-foreground flex-1">{goal.name}</h1>
          <button onClick={() => updateGoal(goal.id, { paused: !goal.paused })}
            className="tap-target flex items-center justify-center w-10 h-10 rounded-full bg-secondary">
            {goal.paused ? <Play size={16} className="text-success" /> : <Pause size={16} className="text-warning" />}
          </button>
        </div>

        <div className="flex items-center justify-around mb-6">
          <ProgressRing progress={weeklyPct} size={72} strokeWidth={5} label={`${weeklyPct}%`} sublabel="week" />
          <div className="flex flex-col items-center gap-1">
            <Flame size={20} className="text-primary" />
            <span className="text-2xl font-bold text-foreground">{goal.streak}</span>
            <span className="text-xs text-muted-foreground">Current</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg">🏆</span>
            <span className="text-2xl font-bold text-foreground">{goal.best_streak}</span>
            <span className="text-xs text-muted-foreground">Best</span>
          </div>
        </div>

        {/* Badges */}
        {goalBadges.length > 0 && (
          <div className="bg-card rounded-lg p-4 border border-border mb-4">
            <h3 className="text-sm font-medium text-foreground mb-2">Badges Earned</h3>
            <div className="flex gap-2 flex-wrap">
              {goalBadges.map(b => (
                <div key={b.id} className="px-3 py-1.5 rounded-full gradient-primary text-primary-foreground text-xs font-medium">
                  🏆 {b.milestone}-day
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-card rounded-lg p-4 border border-border mb-4">
          <h3 className="text-sm font-medium text-foreground mb-3">30-Day Activity</h3>
          <HeatmapStrip logs={logs} />
        </div>

        <div className="bg-card rounded-lg p-4 border border-border mb-4">
          <h3 className="text-sm font-medium text-foreground mb-3">This Week</h3>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={weekData}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(0,0%,55%)', fontSize: 11 }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="url(#barGrad)" />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(263, 70%, 58%)" />
                  <stop offset="100%" stopColor="hsl(330, 80%, 60%)" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Prediction */}
        <div className="bg-card rounded-lg p-4 border border-border mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-primary" />
            <h3 className="text-sm font-medium text-foreground">Prediction</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {prediction || `At this rate, you'll hit a 30-day streak in ${Math.max(0, 30 - goal.streak)} days.`}
          </p>
        </div>

        {/* AI Suggestions */}
        <div className="gradient-border bg-card rounded-lg p-4 mb-4 glow-violet">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-primary" />
            <h3 className="text-sm font-medium gradient-primary-text">AI Suggestions</h3>
            <button onClick={fetchAI} disabled={aiLoading} className="ml-auto tap-target text-primary">
              <RefreshCw size={14} className={aiLoading ? 'animate-spin' : ''} />
            </button>
          </div>
          {rateLimited ? (
            <p className="text-sm text-warning">{rateLimitMessage}</p>
          ) : suggestions ? (
            <p className="text-sm text-muted-foreground whitespace-pre-line">{suggestions}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              {aiLoading ? 'Generating suggestions...' : 'AI suggestions will appear here'}
            </p>
          )}
        </div>

        {/* Recent Logs */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-foreground mb-3">Recent Entries</h3>
          <div className="space-y-2">
            {logs.filter(l => l.completed).slice(0, 5).map((log) => (
              <div key={log.id} className="bg-card rounded-lg p-3 border border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{log.date}</span>
                  <div className="flex items-center gap-2">
                    <span>{log.mood}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      log.energy === 'High' ? 'bg-success/20 text-success' :
                      log.energy === 'Medium' ? 'bg-warning/20 text-warning' : 'bg-destructive/20 text-destructive'
                    }`}>{log.energy}</span>
                  </div>
                </div>
                {log.note && <p className="text-sm text-foreground">{log.note}</p>}
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => setLogOpen(true)}
          style={{ bottom: 'calc(var(--nav-height) + var(--safe-bottom) + 16px)' }}
          className="fixed right-4 w-14 h-14 rounded-full gradient-primary flex items-center justify-center shadow-lg glow-violet z-40">
          <span className="text-primary-foreground text-2xl">+</span>
        </button>

        <BottomSheet open={logOpen} onClose={() => setLogOpen(false)} title="Log Entry">
          <div className="space-y-4">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Describe your progress..."
              className="w-full bg-secondary rounded-lg px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary resize-none" />
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
              <label className="text-sm text-muted-foreground mb-2 block">Energy Level</label>
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
      </div>
      <ConfettiCelebration milestone={celebration} onDone={() => setCelebration(null)} />
    </PageTransition>
  );
}
