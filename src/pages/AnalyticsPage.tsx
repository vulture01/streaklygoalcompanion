import { PageTransition } from '@/components/PageTransition';
import { useAppStore } from '@/store/useAppStore';
import { ProgressRing } from '@/components/ProgressRing';
import { HeatmapStrip } from '@/components/HeatmapStrip';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { Share2 } from 'lucide-react';

export default function AnalyticsPage() {
  const { goals } = useAppStore();

  // Best/worst day per goal
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayStats = dayNames.map((name, dayIndex) => {
    const count = goals.reduce((acc, g) => {
      return acc + g.logs.filter((l) => {
        const d = new Date(l.date).getDay();
        return d === dayIndex && l.completed;
      }).length;
    }, 0);
    return { day: name, count };
  });

  return (
    <PageTransition>
      <div className="px-4 pt-12 pb-4 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <button className="tap-target flex items-center gap-1 text-sm text-primary font-medium">
            <Share2 size={16} /> Share
          </button>
        </div>

        {/* Overall Progress */}
        <div className="flex items-center justify-around bg-card rounded-lg p-5 border border-border mb-5">
          {goals.map((goal) => {
            const completed = goal.logs.filter(l => l.completed).length;
            const total = Math.max(goal.logs.length, 1);
            const pct = Math.round((completed / 30) * 100);
            return (
              <div key={goal.id} className="flex flex-col items-center gap-2">
                <ProgressRing progress={pct} size={56} strokeWidth={4} label={`${pct}%`} />
                <span className="text-xs text-muted-foreground">{goal.emoji} {goal.name}</span>
              </div>
            );
          })}
        </div>

        {/* Best/Worst Day */}
        <div className="bg-card rounded-lg p-4 border border-border mb-5">
          <h3 className="text-sm font-medium text-foreground mb-3">Best & Worst Days</h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={dayStats}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(0,0%,55%)', fontSize: 11 }} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: 'hsl(0,0%,8%)', border: '1px solid hsl(0,0%,16%)', borderRadius: 8, color: '#fff', fontSize: 12 }}
              />
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

        {/* Per-Goal Heatmaps */}
        {goals.map((goal, i) => (
          <motion.div key={goal.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-card rounded-lg p-4 border border-border mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{goal.emoji}</span>
              <h3 className="text-sm font-medium text-foreground">{goal.name}</h3>
              <span className="ml-auto text-xs text-muted-foreground">{goal.streak} day streak</span>
            </div>
            <HeatmapStrip logs={goal.logs} />
          </motion.div>
        ))}

        {/* Correlation Insight */}
        <div className="gradient-border bg-card rounded-lg p-4">
          <h3 className="text-sm font-medium gradient-primary-text mb-2">💡 Correlation Insight</h3>
          <p className="text-sm text-muted-foreground">
            On days you completed <span className="text-foreground font-medium">{goals[0]?.emoji} {goals[0]?.name}</span>,
            your <span className="text-foreground font-medium">{goals[1]?.emoji} {goals[1]?.name}</span> completion was 35% higher.
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
