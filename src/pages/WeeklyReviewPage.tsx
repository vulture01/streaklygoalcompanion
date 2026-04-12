import { PageTransition } from '@/components/PageTransition';
import { useGoals, useLogs } from '@/hooks/useSupabaseData';
import { useGroqAI } from '@/hooks/useGroqAI';
import { ArrowLeft, Sparkles, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function WeeklyReviewPage() {
  const navigate = useNavigate();
  const { goals } = useGoals();
  const { logs } = useLogs();
  const { callGroq, loading } = useGroqAI();
  const [review, setReview] = useState<string | null>(null);

  const last7Logs = logs.filter(l => {
    const diff = (Date.now() - new Date(l.date).getTime()) / (1000 * 60 * 60 * 24);
    return diff < 7;
  });

  const completedDays = new Set(last7Logs.filter(l => l.completed).map(l => l.date)).size;
  const missedDays = 7 - completedDays;
  const totalLogs = last7Logs.filter(l => l.completed).length;
  const bestStreak = Math.max(...goals.map(g => g.streak), 0);

  const fetchReview = async () => {
    const summary = `This week: ${completedDays} active days, ${missedDays} missed days, ${totalLogs} total completions across ${goals.length} goals. Best current streak: ${bestStreak}. Goals: ${goals.map(g => `${g.emoji} ${g.name} (streak: ${g.streak})`).join(', ')}`;
    const result = await callGroq('weekly-review', summary);
    setReview(result);
  };

  useEffect(() => {
    if (!review && goals.length > 0) fetchReview();
  }, [goals.length]);

  return (
    <PageTransition>
      <div className="px-4 pt-12 pb-24 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="tap-target"><ArrowLeft size={22} className="text-foreground" /></button>
          <h1 className="text-xl font-bold text-foreground">Weekly Review</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { label: 'Active Days', value: completedDays, color: 'text-success' },
            { label: 'Missed Days', value: missedDays, color: 'text-destructive' },
            { label: 'Total Logs', value: totalLogs, color: 'text-primary' },
            { label: 'Best Streak', value: bestStreak, color: 'text-warning' },
          ].map(s => (
            <div key={s.label} className="bg-card rounded-lg p-4 border border-border text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* AI Review */}
        <div className="gradient-border bg-card rounded-lg p-5 glow-violet">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-primary" />
            <h3 className="text-sm font-medium gradient-primary-text">AI Weekly Review</h3>
            <button onClick={fetchReview} disabled={loading} className="ml-auto tap-target text-primary">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          {review ? (
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{review}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              {loading ? 'Generating your weekly review...' : 'Configure Groq API key for AI reviews'}
            </p>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
