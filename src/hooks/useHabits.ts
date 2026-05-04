import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Habit = Tables<'habits'>;
type HabitCompletion = Tables<'habit_completions'>;

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function calcStreak(dates: Set<string>): number {
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i <= 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    if (dates.has(ds)) {
      streak++;
    } else if (i === 0) {
      continue;
    } else {
      break;
    }
  }
  return streak;
}

export function useHabits() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const [{ data: h }, { data: c }] = await Promise.all([
      supabase.from('habits').select('*').eq('user_id', user.id).order('created_at'),
      supabase.from('habit_completions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(1000),
    ]);

    // Defensive UI dedupe: keep earliest per (user_id, lower(name))
    const seen = new Set<string>();
    const uniqueHabits: Habit[] = [];
    for (const habit of (h || [])) {
      const key = habit.name.trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueHabits.push(habit);
      }
    }

    setHabits(uniqueHabits);
    setCompletions(c || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addHabit = async (habit: Omit<TablesInsert<'habits'>, 'user_id'>) => {
    if (!user) return { error: 'No user' as const };
    const { error } = await supabase.from('habits').insert({ ...habit, user_id: user.id });
    if (error) {
      if ((error as any).code === '23505') {
        toast.error('You already have a habit with that name');
        return { error: 'duplicate' as const };
      }
      toast.error('Failed to add habit');
      return { error: 'unknown' as const };
    }
    await fetchAll();
    return { error: null };
  };

  const updateHabit = async (id: string, updates: Partial<Habit>) => {
    if (!user) return;
    const { error } = await supabase
      .from('habits')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      if ((error as any).code === '23505') {
        toast.error('You already have a habit with that name');
      } else {
        toast.error('Failed to update habit');
      }
    } else {
      await fetchAll();
    }
  };

  const deleteHabit = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('habits').delete().eq('id', id).eq('user_id', user.id);
    if (error) toast.error('Failed to delete habit');
    else {
      toast.success('Habit deleted');
      await fetchAll();
    }
  };

  const toggleToday = async (habitId: string) => {
    if (!user) return;
    const today = todayStr();
    const existing = completions.find(c => c.habit_id === habitId && c.date === today);

    if (existing) {
      await supabase.from('habit_completions').delete().eq('id', existing.id).eq('user_id', user.id);
    } else {
      await supabase.from('habit_completions').insert({ user_id: user.id, habit_id: habitId, date: today });
    }

    // Recalc streak
    const { data: c } = await supabase
      .from('habit_completions')
      .select('date')
      .eq('habit_id', habitId)
      .eq('user_id', user.id);
    const dateSet = new Set((c || []).map(x => x.date));
    const newStreak = calcStreak(dateSet);
    const habit = habits.find(h => h.id === habitId);
    const bestStreak = Math.max(habit?.best_streak ?? 0, newStreak);
    await supabase.from('habits').update({ streak: newStreak, best_streak: bestStreak }).eq('id', habitId).eq('user_id', user.id);

    await fetchAll();
  };

  const getCompletionsFor = (habitId: string) =>
    completions.filter(c => c.habit_id === habitId);

  const isCompletedToday = (habitId: string) => {
    const today = todayStr();
    return completions.some(c => c.habit_id === habitId && c.date === today);
  };

  return { habits, completions, loading, addHabit, updateHabit, deleteHabit, toggleToday, getCompletionsFor, isCompletedToday, refetch: fetchAll };
}
