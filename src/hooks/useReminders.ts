import { useEffect, useRef } from 'react';
import { useGoals, useLogs } from './useSupabaseData';
import { useHabits } from './useHabits';

const LAST_NOTIFIED_PREFIX = 'reminder-last-notified:';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function currentHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// reminder_time from Postgres comes back as "HH:MM:SS"
function normalizeTime(t: string | null | undefined): string | null {
  if (!t) return null;
  const parts = t.split(':');
  if (parts.length < 2) return null;
  return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
}

/**
 * Foreground scheduler. Checks every 60s and fires a browser notification
 * when a goal/habit's reminder_time matches the current minute and it hasn't
 * been logged today. Uses localStorage to ensure once-per-day per item.
 */
export function useReminderScheduler() {
  const { goals } = useGoals();
  const { logs } = useLogs();
  const { habits, completions } = useHabits();

  const dataRef = useRef({ goals, logs, habits, completions });
  dataRef.current = { goals, logs, habits, completions };

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    const tick = () => {
      if (Notification.permission !== 'granted') return;
      const now = currentHHMM();
      const today = todayStr();
      const { goals, logs, habits, completions } = dataRef.current;

      // Goals
      for (const g of goals) {
        const t = normalizeTime((g as any).reminder_time);
        if (!t || t !== now || g.paused) continue;
        const loggedToday = logs.some(
          (l) => l.goal_id === g.id && l.date === today && l.completed
        );
        if (loggedToday) continue;
        const key = `${LAST_NOTIFIED_PREFIX}goal:${g.id}`;
        if (localStorage.getItem(key) === today) continue;
        try {
          const n = new Notification(`Time for: ${g.name} ${g.emoji || '🔥'}`, {
            body: 'Tap to log your progress and keep your streak alive!',
            tag: `goal-${g.id}-${today}`,
            data: { kind: 'goal', id: g.id },
          });
          n.onclick = () => {
            window.focus();
            window.location.href = `/?remind=goal:${g.id}`;
            n.close();
          };
          localStorage.setItem(key, today);
        } catch (e) {
          console.error('Notification failed', e);
        }
      }

      // Habits
      for (const h of habits) {
        const t = normalizeTime((h as any).reminder_time);
        if (!t || t !== now) continue;
        const doneToday = completions.some(
          (c) => c.habit_id === h.id && c.date === today
        );
        if (doneToday) continue;
        const key = `${LAST_NOTIFIED_PREFIX}habit:${h.id}`;
        if (localStorage.getItem(key) === today) continue;
        try {
          const n = new Notification(`Time for: ${h.name} ${h.icon || '🔥'}`, {
            body: 'Tap to log your progress and keep your streak alive!',
            tag: `habit-${h.id}-${today}`,
            data: { kind: 'habit', id: h.id },
          });
          n.onclick = () => {
            window.focus();
            window.location.href = `/track?remind=habit:${h.id}`;
            n.close();
          };
          localStorage.setItem(key, today);
        } catch (e) {
          console.error('Notification failed', e);
        }
      }
    };

    // Initial check + every 60s
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);
}
