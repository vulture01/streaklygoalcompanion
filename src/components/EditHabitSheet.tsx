import { useEffect, useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useHabits } from '@/hooks/useHabits';
import type { Tables } from '@/integrations/supabase/types';

type Habit = Tables<'habits'>;

const ICONS = ['💧', '🏃', '📚', '💤', '🧘', '🥗', '✍️', '🚭', '☀️', '🎯'];
const FREQUENCIES: Array<'daily' | 'weekly'> = ['daily', 'weekly'];

interface Props {
  habit: Habit | null;
  onClose: () => void;
}

export function EditHabitSheet({ habit, onClose }: Props) {
  const { updateHabit } = useHabits();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💧');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setIcon(habit.icon);
      setFrequency((habit.frequency as 'daily' | 'weekly') || 'daily');
    }
  }, [habit]);

  const handleSave = async () => {
    if (!habit || !name.trim() || saving) return;
    setSaving(true);
    try {
      await updateHabit(habit.id, { name: name.trim(), icon, frequency });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet open={!!habit} onClose={onClose} title="Edit Habit">
      <div className="space-y-5 pb-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Drink water"
            autoFocus
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Icon</label>
          <div className="grid grid-cols-5 gap-2">
            {ICONS.map((i) => (
              <button
                key={i}
                onClick={() => setIcon(i)}
                className={`h-12 rounded-lg text-2xl tap-target transition-colors ${
                  icon === i ? 'bg-primary/20 ring-2 ring-primary' : 'bg-muted'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Frequency</label>
          <div className="grid grid-cols-2 gap-2">
            {FREQUENCIES.map((f) => (
              <button
                key={f}
                onClick={() => setFrequency(f)}
                className={`h-11 rounded-lg text-sm font-medium capitalize tap-target transition-colors ${
                  frequency === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleSave} disabled={!name.trim() || saving} className="w-full h-12">
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </BottomSheet>
  );
}
