import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useProfile, useGoals } from '@/hooks/useSupabaseData';
import { toast } from 'sonner';

const steps = [
  { title: "What's your name?", subtitle: "Let's personalize your experience" },
  { title: "Set your first goal", subtitle: "What do you want to track daily?" },
  { title: "When do you wake up?", subtitle: "We'll set smart reminders for you" },
];

const STARTER_GOALS = [
  { emoji: '💪', name: 'Fitness' },
  { emoji: '📚', name: 'Learning' },
  { emoji: '🧘', name: 'Meditate' },
  { emoji: '💧', name: 'Drink Water' },
  { emoji: '🚫', name: 'No Sugar' },
];

interface Props {
  onComplete: () => void;
}

export default function OnboardingPage({ onComplete }: Props) {
  const { updateProfile } = useProfile();
  const { addGoal } = useGoals();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['Fitness', 'Learning']);
  const [wakeTime, setWakeTime] = useState('07:00');
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    setLoading(true);
    await updateProfile({ name: name || 'User', wake_up_time: wakeTime });
    for (const g of selectedGoals) {
      const starter = STARTER_GOALS.find(s => s.name === g);
      await addGoal({
        name: g,
        emoji: starter?.emoji || '🎯',
        type: 'boolean',
      });
    }
    setLoading(false);
    toast.success('Welcome aboard! 🎉');
    onComplete();
  };

  const toggleGoal = (g: string) => {
    setSelectedGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  };

  const next = () => {
    if (step < 2) setStep(step + 1);
    else handleFinish();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex gap-2 px-6 pt-12">
        {steps.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'gradient-primary' : 'bg-muted'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25 }}
          className="flex-1 flex flex-col px-6 pt-12"
        >
          <div className="mb-2">
            <Sparkles size={28} className="text-primary mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">{steps[step].title}</h1>
            <p className="text-sm text-muted-foreground">{steps[step].subtitle}</p>
          </div>

          <div className="flex-1 flex flex-col justify-center pb-20">
            {step === 0 && (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoFocus
                className="w-full bg-card border border-border rounded-lg px-5 py-4 text-lg text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            )}

            {step === 1 && (
              <div className="space-y-3">
                {STARTER_GOALS.map((g) => (
                  <button
                    key={g.name}
                    onClick={() => toggleGoal(g.name)}
                    className={`w-full flex items-center gap-3 p-4 rounded-lg border tap-target ${
                      selectedGoals.includes(g.name) ? 'border-primary bg-primary/10' : 'border-border bg-card'
                    }`}
                  >
                    <span className="text-xl">{g.emoji}</span>
                    <span className="text-foreground font-medium">{g.name}</span>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="text-center">
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="bg-card border border-border rounded-lg px-6 py-4 text-2xl text-foreground outline-none focus:ring-2 focus:ring-primary text-center"
                />
                <p className="text-sm text-muted-foreground mt-4">We'll remind you 30 minutes after wake-up</p>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="px-6 pb-10">
        <button
          onClick={next}
          disabled={loading}
          className="w-full py-4 rounded-lg gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 tap-target disabled:opacity-50"
        >
          {loading ? 'Setting up...' : step < 2 ? 'Continue' : 'Get Started'}
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
