import { useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { useGoals } from '@/hooks/useSupabaseData';

const EMOJIS = ['💪', '📚', '🧘', '💧', '🏃', '✍️', '🎯', '🚫', '💤', '🎨', '💻', '🥗'];

interface AddGoalSheetProps {
  open: boolean;
  onClose: () => void;
}

export function AddGoalSheet({ open, onClose }: AddGoalSheetProps) {
  const { goals, addGoal } = useGoals();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [type, setType] = useState<'boolean' | 'numeric'>('boolean');
  const [target, setTarget] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim() || saving) return;
    const trimmed = name.trim();
    const dupe = goals.some(g => g.name.trim().toLowerCase() === trimmed.toLowerCase());
    if (dupe) {
      setError('You already have a goal with this name');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await addGoal({
        name: trimmed,
        emoji,
        type,
        target: type === 'numeric' ? Number(target) || 1 : undefined,
        reminder_time: reminderTime ? `${reminderTime}:00` : null,
      } as any);
      if (res?.error === 'duplicate') {
        setError('You already have a goal with this name');
        return;
      }
      if (res?.error) return;
      setName('');
      setEmoji('🎯');
      setType('boolean');
      setTarget('');
      setReminderTime('');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="New Goal">
      <div className="space-y-5">
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Goal Name</label>
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); if (error) setError(null); }}
            placeholder="e.g. Meditate daily"
            className={`w-full bg-secondary rounded-lg px-4 py-3 text-foreground text-sm outline-none focus:ring-2 ${error ? 'ring-2 ring-destructive focus:ring-destructive' : 'focus:ring-primary'}`}
          />
          {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Icon</label>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map((e) => (
              <button key={e} onClick={() => setEmoji(e)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg tap-target ${emoji === e ? 'bg-primary/20 ring-2 ring-primary' : 'bg-secondary'}`}>
                {e}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Type</label>
          <div className="flex gap-2">
            {(['boolean', 'numeric'] as const).map((t) => (
              <button key={t} onClick={() => setType(t)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium tap-target ${type === t ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                {t === 'boolean' ? 'Yes/No' : 'Numeric'}
              </button>
            ))}
          </div>
        </div>
        {type === 'numeric' && (
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Daily Target</label>
            <input value={target} onChange={(e) => setTarget(e.target.value)} type="number" placeholder="e.g. 30 minutes"
              className="w-full bg-secondary rounded-lg px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary" />
          </div>
        )}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Daily Reminder Time (optional)</label>
          <input
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="w-full bg-secondary rounded-lg px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary"
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
        <button onClick={handleSave} disabled={saving} className="w-full py-3.5 rounded-lg gradient-primary text-primary-foreground font-semibold tap-target disabled:opacity-50">
          {saving ? 'Creating...' : 'Create Goal'}
        </button>
      </div>
    </BottomSheet>
  );
}
