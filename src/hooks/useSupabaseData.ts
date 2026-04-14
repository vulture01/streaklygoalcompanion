import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Goal = Tables<'goals'>;
type Log = Tables<'logs'>;
type Todo = Tables<'todos'>;
type Badge = Tables<'badges'>;
type Profile = Tables<'profiles'>;

const MILESTONES = [3, 7, 14, 30, 60, 100];

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Omit<Profile, 'groq_api_key'> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('id, user_id, name, wake_up_time, created_at, updated_at')
      .eq('user_id', user.id)
      .single();
    setProfile(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id);
    if (error) toast.error('Failed to update profile');
    else await fetchProfile();
  };

  return { profile, loading, updateProfile, refetch: fetchProfile };
}

export function useGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at');
    setGoals(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const addGoal = async (goal: Omit<TablesInsert<'goals'>, 'user_id'>) => {
    if (!user) return;
    const { error } = await supabase
      .from('goals')
      .insert({ ...goal, user_id: user.id });
    if (error) toast.error('Failed to add goal');
    else await fetchGoals();
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    if (!user) return;
    const { error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) toast.error('Failed to update goal');
    else await fetchGoals();
  };

  const seedDefaultGoals = async () => {
    if (!user) return;
    const defaults = [
      { name: 'Fitness', emoji: '💪', type: 'boolean' },
      { name: 'Learning', emoji: '📚', type: 'boolean' },
      { name: 'No Sugar', emoji: '🚫', type: 'boolean' },
    ];
    const { error } = await supabase
      .from('goals')
      .insert(defaults.map(g => ({ ...g, user_id: user.id })));
    if (error) console.error('Failed to seed goals', error);
    else await fetchGoals();
  };

  return { goals, loading, addGoal, updateGoal, seedDefaultGoals, refetch: fetchGoals };
}

export function useLogs(goalId?: string) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    let query = supabase
      .from('logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });
    if (goalId) query = query.eq('goal_id', goalId);
    const { data } = await query.limit(500);
    setLogs(data || []);
    setLoading(false);
  }, [user, goalId]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const addLog = async (log: Omit<TablesInsert<'logs'>, 'user_id'>) => {
    if (!user) return;
    const { error } = await supabase
      .from('logs')
      .insert({ ...log, user_id: user.id });
    if (error) {
      toast.error('Failed to log');
      return;
    }
    await fetchLogs();
  };

  return { logs, loading, addLog, refetch: fetchLogs };
}

export function useTodos() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTodos = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at');
    setTodos(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchTodos(); }, [fetchTodos]);

  const addTodo = async (todo: Omit<TablesInsert<'todos'>, 'user_id'>) => {
    if (!user) return;
    const { error } = await supabase
      .from('todos')
      .insert({ ...todo, user_id: user.id });
    if (error) toast.error('Failed to add task');
    else await fetchTodos();
  };

  const updateTodo = async (id: string, updates: Partial<Todo>) => {
    if (!user) return;
    const { error } = await supabase
      .from('todos')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) toast.error('Failed to update task');
    else await fetchTodos();
  };

  const deleteTodo = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) toast.error('Failed to delete task');
    else await fetchTodos();
  };

  return { todos, loading, addTodo, updateTodo, deleteTodo, refetch: fetchTodos };
}

export function useBadges() {
  const { user } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);

  const fetchBadges = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('badges')
      .select('*')
      .eq('user_id', user.id);
    setBadges(data || []);
  }, [user]);

  useEffect(() => { fetchBadges(); }, [fetchBadges]);

  const checkAndAwardBadge = async (goalId: string, streak: number): Promise<number | null> => {
    if (!user) return null;
    for (const m of MILESTONES) {
      if (streak >= m) {
        const exists = badges.some(b => b.goal_id === goalId && b.milestone === m);
        if (!exists) {
          await supabase.from('badges').insert({
            user_id: user.id,
            goal_id: goalId,
            milestone: m,
          });
          await fetchBadges();
          return m;
        }
      }
    }
    return null;
  };

  return { badges, checkAndAwardBadge, refetch: fetchBadges };
}

export function useStreakCalculator() {
  const { user } = useAuth();

  const recalcStreak = async (goalId: string) => {
    if (!user) return { streak: 0, bestStreak: 0 };
    const { data: logs } = await supabase
      .from('logs')
      .select('date, completed')
      .eq('goal_id', goalId)
      .eq('user_id', user.id)
      .eq('completed', true)
      .order('date', { ascending: false });

    if (!logs || logs.length === 0) return { streak: 0, bestStreak: 0 };

    let streak = 0;
    let bestStreak = 0;
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dates = new Set(logs.map(l => l.date));
    
    // Calculate current streak
    for (let i = 0; i <= 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (dates.has(dateStr)) {
        streak++;
      } else if (i === 0) {
        continue; // today not logged yet is OK
      } else {
        break;
      }
    }

    // Calculate best streak
    const sortedDates = Array.from(dates).sort();
    currentStreak = 1;
    bestStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }
    bestStreak = Math.max(bestStreak, streak);

    // Update goal
    await supabase
      .from('goals')
      .update({ streak, best_streak: bestStreak })
      .eq('id', goalId)
      .eq('user_id', user.id);

    return { streak, bestStreak };
  };

  return { recalcStreak };
}
