import { Bell } from 'lucide-react';
import { useMemo, useState, useRef, useEffect } from 'react';
import { useGoals } from '@/hooks/useSupabaseData';
import { useHabits } from '@/hooks/useHabits';

const MILESTONES = [3, 7, 14, 30, 60, 100];

interface NotificationItem {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
}

export function NotificationsBell() {
  const { goals } = useGoals();
  const { habits } = useHabits();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [];
    for (const g of goals) {
      const hit = [...MILESTONES].reverse().find((m) => g.streak >= m);
      if (hit) {
        items.push({
          id: `goal-${g.id}-${hit}`,
          emoji: g.emoji || '🔥',
          title: `You hit a ${hit}-day streak on ${g.name}!`,
          subtitle: 'Keep the momentum going.',
        });
      }
    }
    for (const h of habits) {
      const hit = [...MILESTONES].reverse().find((m) => h.streak >= m);
      if (hit) {
        items.push({
          id: `habit-${h.id}-${hit}`,
          emoji: h.icon || '✨',
          title: `${hit}-day streak on ${h.name}!`,
          subtitle: 'Consistency pays off.',
        });
      }
    }
    return items;
  }, [goals, habits]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="tap-target flex items-center justify-center rounded-full bg-secondary w-10 h-10 relative"
        aria-label="Notifications"
      >
        <Bell size={18} className="text-muted-foreground" />
        {notifications.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 max-h-96 overflow-y-auto bg-card border border-border rounded-xl shadow-xl z-50">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
          </div>
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">No new notifications</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n) => (
                <li key={n.id} className="px-4 py-3 flex items-start gap-3">
                  <span className="text-xl shrink-0">{n.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.subtitle}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
