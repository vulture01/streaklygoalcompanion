import { useEffect, useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { useGoals } from '@/hooks/useSupabaseData';
import type { Tables } from '@/integrations/supabase/types';

type Goal = Tables<'goals'>;

const EMOJIS = ['💪', '📚', '🧘', '💧', '🏃', '✍️', '🎯', '🚫', '💤', '🎨', '💻', '🥗'];

interface Props {
  goal: Goal | null;
  onClose: () => void;
}

export function EditGoalSheet({ goal, onClose }: Props) {
  const { updateGoal } = useGoals();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [type, setType] = useState<'boolean' | 'numeric'>('boolean');
  const [target, setTarget] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (goal) {
      setName(goal.name);
      setEmoji(goal.emoji);
      setType((goal.type as 'boolean' | 'numeric') || 'boolean');
      setTarget(goal.target ? String(goal.target) : '');
      const rt = (goal as any).reminder_time as string | null | undefined;
      setReminderTime(rt ? rt.split(':').slice(0, 2).join(':') : '');
    }
  }, [goal]);

  const handleSave = async () => {
    if (!goal || !name.trim() || saving) return;
    setSaving(true);
    try {
      await updateGoal(goal.id, {
        name: name.trim(),
        emoji,
        type,
        target: type === 'numeric' ? Number(target) || 1 : null,
        reminder_time: reminderTime ? `${reminderTime}:00` : null,
      } as any);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet open={!!goal} onClose={onClose} title="Edit Goal">
      <div className="space-y-5">
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Goal Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Meditate daily"
            className="w-full bg-secondary rounded-lg px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Icon</label>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg tap-target ${
                  emoji === e ? 'bg-primary/20 ring-2 ring-primary' : 'bg-secondary'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Type</label>
          <div className="flex gap-2">
            {(['boolean', 'numeric'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium tap-target ${
                  type === t ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {t === 'boolean' ? 'Yes/No' : 'Numeric'}
              </button>
            ))}
          </div>
        </div>
        {type === 'numeric' && (
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Daily Target</label>
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              type="number"
              placeholder="e.g. 30 minutes"
              className="w-full bg-secondary rounded-lg px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary"
            />
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
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="w-full py-3.5 rounded-lg gradient-primary text-primary-foreground font-semibold tap-target disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </BottomSheet>
  );
}
