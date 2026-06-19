import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, CalendarCheck, Bot, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGoals } from '@/hooks/useSupabaseData';
import { useHabits } from '@/hooks/useHabits';
import { useWorkoutSessions } from '@/hooks/useWorkouts';
import { usePhysique } from '@/hooks/usePhysique';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PageTransition } from '@/components/PageTransition';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

export default function CoachPage({ onClose, embedded = false }: { onClose?: () => void; embedded?: boolean } = {}) {
  const navigate = useNavigate();
  const handleBack = () => { if (onClose) onClose(); else navigate(-1); };
  const { user } = useAuth();
  const { goals } = useGoals();
  const { habits, completions } = useHabits();
  const { sessions } = useWorkoutSessions();
  const { logs: physique } = usePhysique();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [briefingDone, setBriefingDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Build a compact context string from the user's data
  const buildContext = () => {
    const today = new Date().toISOString().split('T')[0];
    const activeGoals = (goals || [])
      .filter((g) => !g.paused)
      .slice(0, 8)
      .map((g) => `${g.emoji} ${g.name} (streak: ${g.streak}, best: ${g.best_streak})`)
      .join('; ') || 'none';

    const todaysHabits = (habits || [])
      .map((h) => {
        const done = (completions || []).some((c) => c.habit_id === h.id && c.date === today);
        return `${h.icon} ${h.name} — ${done ? '✅ done today' : '⬜ pending'} (streak: ${h.streak})`;
      })
      .join('; ') || 'none';

    const sortedSessions = [...(sessions || [])].sort(
      (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );
    const recentSessions = sortedSessions
      .slice(0, 3)
      .map((s) => {
        const d = new Date(s.started_at).toLocaleDateString();
        return `${d}: ${s.name} (volume ${Math.round(Number(s.total_volume))}kg)`;
      })
      .join('; ') || 'none';

    let physiqueTrend = 'no entries';
    if (physique && physique.length >= 1) {
      const latest = physique[physique.length - 1];
      const first = physique[0];
      const wDelta = latest.weight && first.weight ? (Number(latest.weight) - Number(first.weight)).toFixed(1) : null;
      const bfDelta = latest.body_fat && first.body_fat ? (Number(latest.body_fat) - Number(first.body_fat)).toFixed(1) : null;
      physiqueTrend = `latest weight: ${latest.weight ?? '?'}kg, BF: ${latest.body_fat ?? '?'}%`;
      if (wDelta) physiqueTrend += ` | weight Δ since start: ${wDelta}kg`;
      if (bfDelta) physiqueTrend += ` | BF Δ: ${bfDelta}%`;
    }

    return `Date: ${today}
Active goals: ${activeGoals}
Today's habits: ${todaysHabits}
Recent workouts: ${recentSessions}
Physique: ${physiqueTrend}`;
  };

  const callCoach = async (mode: 'briefing' | 'plan' | 'chat', userMessage?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('groq-ai', {
        body: {
          type: 'coach',
          mode,
          context: buildContext(),
          history: messages.slice(-10),
          message: userMessage,
        },
      });
      if (error) {
        const msg = (error as any)?.context?.body;
        if (msg) {
          try {
            const parsed = JSON.parse(typeof msg === 'string' ? msg : await msg.text());
            if (parsed.error === 'rate_limit') {
              toast.info(parsed.message);
              return null;
            }
          } catch {}
        }
        throw error;
      }
      if (data?.error === 'rate_limit') {
        toast.info(data.message);
        return null;
      }
      return data?.result as string;
    } catch (e) {
      console.error('Coach error:', e);
      toast.error('Coach is unavailable right now.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Auto daily briefing on first open (once data is ready)
  useEffect(() => {
    if (briefingDone || !user) return;
    // Wait until at least goals fetched
    if (goals === undefined) return;
    setBriefingDone(true);
    (async () => {
      const reply = await callCoach('briefing');
      if (reply) setMessages([{ role: 'assistant', content: reply }]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, goals, briefingDone]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const next: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    const reply = await callCoach('chat', text);
    if (reply) setMessages((m) => [...m, { role: 'assistant', content: reply }]);
  };

  const handlePlan = async () => {
    if (loading) return;
    const userMsg: ChatMessage = { role: 'user', content: "Get today's plan" };
    setMessages((m) => [...m, userMsg]);
    const reply = await callCoach('plan');
    if (reply) setMessages((m) => [...m, { role: 'assistant', content: reply }]);
  };

  const content = (
      <div className={`${embedded ? 'h-full' : 'min-h-screen'} flex flex-col bg-background`}>

        {/* Header */}
        <header
          className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border"
          style={{ paddingTop: 'var(--safe-top)' }}
        >
          <div className="flex items-center gap-3 px-4 h-14 max-w-lg mx-auto">
            <button onClick={handleBack} className="tap-target -ml-2" aria-label="Close coach">
              <ArrowLeft size={22} className="text-foreground" />
            </button>
            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center">
              <Bot size={18} className="text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-semibold text-foreground leading-tight">AI Coach</h1>
              <p className="text-[11px] text-muted-foreground">
                {loading ? 'typing…' : 'online'}
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={handlePlan} disabled={loading} className="gap-1.5">
              <CalendarCheck size={14} />
              <span className="text-xs">Today's Plan</span>
            </Button>
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 pb-32 max-w-lg w-full mx-auto">
          {messages.length === 0 && !loading && (
            <div className="text-center text-muted-foreground text-sm mt-12 px-6">
              <Sparkles className="mx-auto mb-3 text-primary" size={28} />
              Your coach is preparing your daily briefing…
            </div>
          )}

          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-end gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center flex-shrink-0 mb-0.5">
                      <Bot size={14} className="text-primary-foreground" />
                    </div>
                  )}
                  <div
                    className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-sm leading-snug whitespace-pre-wrap break-words ${
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-card border border-border text-foreground rounded-bl-md'
                    }`}
                  >
                    {m.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-end gap-2 justify-start"
              >
                <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center flex-shrink-0 mb-0.5">
                  <Bot size={14} className="text-primary-foreground" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-bl-md px-3.5 py-2.5">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Composer */}
        <div
          className={`${embedded ? 'sticky bottom-0' : 'fixed bottom-0 left-0 right-0'} z-40 bg-card/95 backdrop-blur-lg border-t border-border`}
          style={embedded ? undefined : { paddingBottom: 'calc(var(--safe-bottom) + 64px)' }}
        >
          <div className="flex items-center gap-2 px-4 py-3 max-w-lg mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask your coach…"
              disabled={loading}
              className="flex-1 h-11 px-4 rounded-full bg-muted text-sm text-foreground placeholder:text-muted-foreground border-none outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center disabled:opacity-40 tap-target"
            >
              <Send size={18} className="text-primary-foreground" />
            </button>
          </div>
        </div>
      </div>
  );

  return embedded ? content : <PageTransition>{content}</PageTransition>;
}

