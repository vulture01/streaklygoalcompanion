import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGoals } from '@/hooks/useSupabaseData';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Category = {
  key: string;
  label: string;
  emoji: string;
  description: string;
  starterGoals: Array<{ name: string; emoji: string; type: 'boolean' | 'numeric'; target?: number }>;
};

const CATEGORIES: Category[] = [
  {
    key: 'fitness',
    label: 'Fitness',
    emoji: '💪',
    description: 'Build strength & energy',
    starterGoals: [
      { name: 'Workout', emoji: '🏋️', type: 'boolean' },
      { name: 'Steps', emoji: '🏃', type: 'numeric', target: 8000 },
    ],
  },
  {
    key: 'study',
    label: 'Study',
    emoji: '📚',
    description: 'Learn something new',
    starterGoals: [
      { name: 'Study session', emoji: '📚', type: 'numeric', target: 30 },
    ],
  },
  {
    key: 'mental',
    label: 'Mental Health',
    emoji: '🧘',
    description: 'Calm and clarity',
    starterGoals: [
      { name: 'Meditate', emoji: '🧘', type: 'boolean' },
      { name: 'Journal', emoji: '✍️', type: 'boolean' },
    ],
  },
  {
    key: 'finance',
    label: 'Finance',
    emoji: '💰',
    description: 'Track your money',
    starterGoals: [
      { name: 'Track expenses', emoji: '💰', type: 'boolean' },
    ],
  },
  {
    key: 'habits',
    label: 'Habit Building',
    emoji: '🎯',
    description: 'Daily consistency',
    starterGoals: [
      { name: 'Drink water', emoji: '💧', type: 'numeric', target: 8 },
      { name: 'Sleep 8h', emoji: '💤', type: 'boolean' },
    ],
  },
  {
    key: 'custom',
    label: 'Custom',
    emoji: '✨',
    description: 'A blank goal to set up',
    starterGoals: [
      { name: 'My first goal', emoji: '🎯', type: 'boolean' },
    ],
  },
];

interface Props {
  onComplete: () => void;
}

export function GoalsOnboarding({ onComplete }: Props) {
  const { addGoal } = useGoals();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleStart = async () => {
    if (selected.size === 0 || saving) return;
    setSaving(true);
    try {
      const picks = CATEGORIES.filter((c) => selected.has(c.key));
      let createdAny = false;
      for (const cat of picks) {
        for (const g of cat.starterGoals) {
          const res = await addGoal({
            name: g.name,
            emoji: g.emoji,
            type: g.type,
            target: g.target,
          });
          if (!res?.error || res.error === 'duplicate') createdAny = true;
        }
      }
      if (!createdAny) {
        toast.error("Couldn't create your goals. Try again.");
        return;
      }
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-5 pt-14 pb-28 max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="text-4xl mb-3">🎯</div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Let's set your first goals</h1>
        <p className="text-sm text-muted-foreground">
          Pick the areas you want to focus on. We'll create a few starter goals for you.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {CATEGORIES.map((cat, i) => {
          const active = selected.has(cat.key);
          return (
            <motion.button
              key={cat.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => toggle(cat.key)}
              className={`relative text-left rounded-xl p-4 border tap-target transition-colors ${
                active
                  ? 'bg-primary/10 border-primary'
                  : 'bg-card border-border hover:border-muted-foreground/40'
              }`}
            >
              <div className="text-2xl mb-2">{cat.emoji}</div>
              <div className="font-semibold text-sm text-foreground mb-0.5">{cat.label}</div>
              <div className="text-xs text-muted-foreground leading-snug">{cat.description}</div>
              {active && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full gradient-primary flex items-center justify-center">
                  <Check size={12} className="text-primary-foreground" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      <button
        onClick={handleStart}
        disabled={selected.size === 0 || saving}
        className="w-full py-3.5 rounded-lg gradient-primary text-primary-foreground font-semibold tap-target disabled:opacity-40 flex items-center justify-center gap-2"
      >
        {saving && <Loader2 size={16} className="animate-spin" />}
        {saving ? 'Creating goals…' : 'Get Started'}
      </button>
      <p className="text-center text-xs text-muted-foreground mt-3">
        {selected.size === 0
          ? 'Select at least one category'
          : `${selected.size} ${selected.size === 1 ? 'category' : 'categories'} selected`}
      </p>
    </div>
  );
}
