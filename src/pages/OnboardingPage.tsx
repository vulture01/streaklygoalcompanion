import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useProfile, useGoals } from '@/hooks/useSupabaseData';
import { toast } from 'sonner';

const steps = [
  { title: "What's your name?", subtitle: "Let's personalize your experience" },
  { title: "Choose Your Goals", subtitle: "Select the areas you want to improve" },
  { title: "When do you wake up?", subtitle: "We'll set smart reminders for you" },
];

const GOAL_CATEGORIES = [
  { emoji: '🏋️', name: 'Fitness & Gym', goalTitle: 'Build a consistent gym routine' },
  { emoji: '📚', name: 'Study & Learning', goalTitle: 'Dedicate time to learning daily' },
  { emoji: '💼', name: 'Career & Skills', goalTitle: 'Work on career development' },
  { emoji: '🧘', name: 'Mental Health & Mindfulness', goalTitle: 'Practice mindfulness daily' },
  { emoji: '💧', name: 'Health & Hydration', goalTitle: 'Stay hydrated throughout the day' },
  { emoji: '😴', name: 'Sleep & Recovery', goalTitle: 'Maintain a healthy sleep schedule' },
  { emoji: '🍎', name: 'Nutrition & Diet', goalTitle: 'Eat balanced and nutritious meals' },
  { emoji: '💰', name: 'Finance & Savings', goalTitle: 'Track spending and save daily' },
  { emoji: '📖', name: 'Reading', goalTitle: 'Read at least 20 minutes a day' },
];

interface Props {
  onComplete: () => void;
}

export default function OnboardingPage({ onComplete }: Props) {
  const { updateProfile } = useProfile();
  const { addGoal } = useGoals();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [customGoal, setCustomGoal] = useState('');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    if (loading) return;
    setLoading(true);
    await updateProfile({ name: name || 'User', wake_up_time: wakeTime });

    // Create goals from selected categories
    for (const catName of selectedCategories) {
      const cat = GOAL_CATEGORIES.find(c => c.name === catName);
      if (cat) {
        await addGoal({
          name: cat.goalTitle,
          emoji: cat.emoji,
          type: 'boolean',
        });
      }
    }

    // Create custom goal if provided
    if (customGoal.trim()) {
      await addGoal({
        name: customGoal.trim(),
        emoji: '🎯',
        type: 'boolean',
      });
    }

    setLoading(false);
    toast.success('Welcome aboard! 🎉');
    onComplete();
  };

  const toggleCategory = (name: string) => {
    setSelectedCategories(prev =>
      prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]
    );
  };

  const next = () => {
    if (step < 2) setStep(step + 1);
    else handleFinish();
  };

  const canContinue = step === 0 || step === 2 || (step === 1); // step 1 is optional

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
          className="flex-1 flex flex-col px-6 pt-12 overflow-y-auto"
        >
          <div className="mb-2">
            <Sparkles size={28} className="text-primary mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">{steps[step].title}</h1>
            <p className="text-sm text-muted-foreground">{steps[step].subtitle}</p>
          </div>

          <div className="flex-1 flex flex-col justify-start pb-20 mt-6">
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
                <div className="grid grid-cols-2 gap-3">
                  {GOAL_CATEGORIES.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => toggleCategory(cat.name)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border tap-target transition-all ${
                        selectedCategories.includes(cat.name)
                          ? 'border-primary bg-primary/10 ring-1 ring-primary'
                          : 'border-border bg-card hover:bg-muted'
                      }`}
                    >
                      <span className="text-2xl">{cat.emoji}</span>
                      <span className="text-xs font-medium text-foreground text-center leading-tight">{cat.name}</span>
                    </button>
                  ))}
                  {/* Custom goal card */}
                  <button
                    onClick={() => document.getElementById('custom-goal-input')?.focus()}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border tap-target transition-all ${
                      customGoal.trim()
                        ? 'border-primary bg-primary/10 ring-1 ring-primary'
                        : 'border-border bg-card hover:bg-muted'
                    }`}
                  >
                    <span className="text-2xl">🎯</span>
                    <span className="text-xs font-medium text-foreground text-center leading-tight">Custom</span>
                  </button>
                </div>
                <input
                  id="custom-goal-input"
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  placeholder="Type your own goal..."
                  className="w-full bg-card border border-border rounded-lg px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary mt-2"
                />
                <p className="text-xs text-muted-foreground text-center">
                  {selectedCategories.length === 0 && !customGoal.trim()
                    ? 'You can skip this step — add goals later anytime'
                    : `${selectedCategories.length + (customGoal.trim() ? 1 : 0)} goal(s) selected`}
                </p>
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
          {loading ? 'Setting up...' : step === 1 && selectedCategories.length === 0 && !customGoal.trim() ? 'Skip' : step < 2 ? 'Continue' : 'Get Started'}
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
