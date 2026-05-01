import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Key, ExternalLink, Dumbbell, BookOpen, Briefcase, Layers, PartyPopper } from 'lucide-react';
import { useProfile, useGoals } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const TOTAL_STEPS = 7;

const FOCUS_OPTIONS = [
  { id: 'fitness', label: 'Fitness', icon: Dumbbell, emoji: '🏋️', goal: 'Train consistently 4× per week' },
  { id: 'study', label: 'Study', icon: BookOpen, emoji: '📚', goal: 'Study 1 hour every day' },
  { id: 'career', label: 'Career', icon: Briefcase, emoji: '💼', goal: 'Make daily progress on career goals' },
  { id: 'allaround', label: 'All-around', icon: Layers, emoji: '✨', goal: 'Build balanced daily habits' },
] as const;

interface Props {
  onComplete: () => void;
}

export default function OnboardingPage({ onComplete }: Props) {
  const { user } = useAuth();
  const { updateProfile } = useProfile();
  const { addGoal } = useGoals();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [focus, setFocus] = useState<typeof FOCUS_OPTIONS[number]['id'] | null>(null);
  const [calories, setCalories] = useState(2200);
  const [protein, setProtein] = useState(150);
  const [carbs, setCarbs] = useState(220);
  const [fat, setFat] = useState(70);
  const [groqKey, setGroqKey] = useState('');
  const [firstGoal, setFirstGoal] = useState('');
  const [loading, setLoading] = useState(false);

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const focusOption = FOCUS_OPTIONS.find((f) => f.id === focus);

  // When focus is picked, prefill the goal suggestion
  const goToGoalStep = () => {
    if (focusOption && !firstGoal) setFirstGoal(focusOption.goal);
    next();
  };

  const finish = async () => {
    if (!user || loading) return;
    setLoading(true);
    try {
      // Save profile + nutrition + onboarding flag
      await updateProfile({
        name: name.trim() || 'User',
        username: username.trim() || null,
        focus: focus || 'allaround',
        calorie_target: calories,
        protein_target: protein,
        carbs_target: carbs,
        fat_target: fat,
        onboarding_completed: true,
      } as any);

      // Save Groq key if provided
      if (groqKey.trim()) {
        await supabase
          .from('profiles')
          .update({ groq_api_key: groqKey.trim() } as any)
          .eq('user_id', user.id);
      }

      // Create the first goal
      if (firstGoal.trim()) {
        await addGoal({
          name: firstGoal.trim(),
          emoji: focusOption?.emoji ?? '🎯',
          type: 'boolean',
        });
      }

      toast.success("You're all set 🎉");
      onComplete();
    } catch (e) {
      toast.error('Something went wrong, please try again');
    } finally {
      setLoading(false);
    }
  };

  const canContinue = (() => {
    switch (step) {
      case 0: return true;
      case 1: return name.trim().length > 0 && username.trim().length >= 3;
      case 2: return !!focus;
      case 3: return calories > 0;
      case 4: return true; // Groq key optional
      case 5: return firstGoal.trim().length > 0;
      case 6: return true;
      default: return true;
    }
  })();

  const onPrimary = () => {
    if (step === 2) return goToGoalStep();
    if (step === TOTAL_STEPS - 1) return finish();
    next();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Step progress bar */}
      <div className="flex gap-1.5 px-6 pt-12">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= step ? 'gradient-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.22 }}
          className="flex-1 flex flex-col px-6 pt-10 overflow-y-auto pb-32"
        >
          {step === 0 && (
            <div className="flex-1 flex flex-col justify-center text-center">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-6 mx-auto">
                <Sparkles size={28} className="text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to Streakly</h1>
              <p className="text-base text-muted-foreground">
                Build streaks. Crush goals. Level up — one day at a time.
              </p>
            </div>
          )}

          {step === 1 && (
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">What should we call you?</h1>
              <p className="text-sm text-muted-foreground mb-6">Pick a display name and a username.</p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Display name"
                autoFocus
                className="w-full bg-card border border-border rounded-lg px-5 py-4 text-base text-foreground outline-none focus:ring-2 focus:ring-primary mb-3"
              />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s+/g, '').toLowerCase())}
                placeholder="username"
                maxLength={20}
                className="w-full bg-card border border-border rounded-lg px-5 py-4 text-base text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-2">Min. 3 characters, lowercase, no spaces.</p>
            </div>
          )}

          {step === 2 && (
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">What's your primary focus?</h1>
              <p className="text-sm text-muted-foreground mb-6">We'll tailor your suggestions.</p>
              <div className="grid grid-cols-2 gap-3">
                {FOCUS_OPTIONS.map((f) => {
                  const Icon = f.icon;
                  const selected = focus === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setFocus(f.id)}
                      className={`flex flex-col items-center gap-2 p-5 rounded-xl border tap-target transition-all ${
                        selected
                          ? 'border-primary bg-primary/10 ring-1 ring-primary'
                          : 'border-border bg-card hover:bg-muted'
                      }`}
                    >
                      <Icon size={24} className={selected ? 'text-primary' : 'text-muted-foreground'} />
                      <span className="text-sm font-medium text-foreground">{f.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Set nutrition targets</h1>
              <p className="text-sm text-muted-foreground mb-6">Defaults work for most — adjust anytime.</p>
              <div className="space-y-3">
                {[
                  { label: 'Calories (kcal)', value: calories, setter: setCalories, step: 50 },
                  { label: 'Protein (g)', value: protein, setter: setProtein, step: 5 },
                  { label: 'Carbs (g)', value: carbs, setter: setCarbs, step: 10 },
                  { label: 'Fat (g)', value: fat, setter: setFat, step: 5 },
                ].map((row) => (
                  <div key={row.label} className="bg-card border border-border rounded-lg px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-foreground">{row.label}</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={row.value}
                      onChange={(e) => row.setter(Number(e.target.value) || 0)}
                      step={row.step}
                      className="w-24 bg-secondary rounded-md px-3 py-2 text-foreground text-sm text-right outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-5">
                <Key size={24} className="text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Connect AI features</h1>
              <p className="text-sm text-muted-foreground mb-4">
                Paste your free Groq API key to unlock the AI Coach and smart suggestions.
              </p>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-primary text-sm font-medium mb-4"
              >
                Get a free key at groq.com <ExternalLink size={14} />
              </a>
              <input
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                placeholder="gsk_..."
                className="w-full bg-card border border-border rounded-lg px-4 py-3.5 text-foreground outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">Optional — you can add it later in your profile.</p>
            </div>
          )}

          {step === 5 && (
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Create your first goal</h1>
              <p className="text-sm text-muted-foreground mb-6">
                Based on your focus on <span className="text-foreground font-medium">{focusOption?.label}</span>.
              </p>
              <input
                value={firstGoal}
                onChange={(e) => setFirstGoal(e.target.value)}
                placeholder="e.g. Train 4× per week"
                autoFocus
                className="w-full bg-card border border-border rounded-lg px-5 py-4 text-base text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-2">
                You can edit, pause, or add more goals anytime.
              </p>
            </div>
          )}

          {step === 6 && (
            <div className="flex-1 flex flex-col justify-center text-center">
              <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mb-6 mx-auto glow-violet">
                <PartyPopper size={36} className="text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">You're all set 🎉</h1>
              <p className="text-base text-muted-foreground">
                Your first streak starts today. Let's go, {name || 'champion'}.
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="px-6 pb-10 pt-2 flex items-center gap-3 bg-background">
        {step > 0 && step < TOTAL_STEPS - 1 && (
          <button
            onClick={back}
            className="px-4 py-3.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium tap-target"
          >
            Back
          </button>
        )}
        <button
          onClick={onPrimary}
          disabled={!canContinue || loading}
          className="flex-1 py-3.5 rounded-lg gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 tap-target disabled:opacity-50"
        >
          {loading
            ? 'Setting up...'
            : step === 0
              ? 'Get started'
              : step === TOTAL_STEPS - 1
                ? 'Enter Streakly'
                : step === 4 && !groqKey.trim()
                  ? 'Skip for now'
                  : 'Continue'}
          {!loading && <ArrowRight size={18} />}
        </button>
      </div>
    </div>
  );
}
