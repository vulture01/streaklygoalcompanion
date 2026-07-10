import { useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useHabits } from '@/hooks/useHabits';

const ICONS = ['💧', '🏃', '📚', '💤', '🧘', '🥗', '✍️', '🚭', '☀️', '🎯'];
const FREQUENCIES: Array<'daily' | 'weekly'> = ['daily', 'weekly'];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AddHabitSheet({ open, onClose }: Props) {
  const { habits, addHabit } = useHabits();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💧');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [reminderTime, setReminderTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim() || saving) return;
    const trimmed = name.trim();
    if (habits.some(h => h.name.trim().toLowerCase() === trimmed.toLowerCase())) {
      setError('You already have a habit with this name');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await addHabit({
        name: trimmed,
        icon,
        frequency,
        reminder_time: reminderTime ? `${reminderTime}:00` : null,
      } as any);
      if (res?.error === 'duplicate') {
        setError('You already have a habit with this name');
        return;
      }
      if (res?.error) return;
      setName('');
      setIcon('💧');
      setFrequency('daily');
      setReminderTime('');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="New Habit">
      <div className="space-y-5 pb-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Name</label>
          <Input
            value={name}
            onChange={(e) => { setName(e.target.value); if (error) setError(null); }}
            placeholder="e.g. Drink water"
            autoFocus
            className={error ? 'ring-2 ring-destructive focus-visible:ring-destructive' : ''}
          />
          {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
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

        <div>
          <label className="text-sm font-medium mb-2 block">Daily Reminder Time (optional)</label>
          <input
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="w-full bg-muted rounded-lg px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary h-11"
          />
          {reminderTime && (
            <button
              type="button"
              onClick={() => setReminderTime('')}
              className="text-xs text-muted-foreground mt-1.5 underline"
            >
              Clear reminder
            </button>
          )}
        </div>


        <Button onClick={handleSave} disabled={!name.trim() || saving} className="w-full h-12">
          {saving ? 'Adding…' : 'Add Habit'}
        </Button>
      </div>
    </BottomSheet>
  );
}
