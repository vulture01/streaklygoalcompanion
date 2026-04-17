import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Routine = Tables<'routines'>;
type RoutineExercise = Tables<'routine_exercises'>;
type WorkoutSession = Tables<'workout_sessions'>;
type SessionSet = Tables<'session_sets'>;

export function useRoutines() {
  const { user } = useAuth();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const [{ data: r }, { data: e }] = await Promise.all([
      supabase.from('routines').select('*').eq('user_id', user.id).order('created_at'),
      supabase.from('routine_exercises').select('*').eq('user_id', user.id).order('position'),
    ]);
    setRoutines(r || []);
    setExercises(e || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addRoutine = async (
    name: string,
    description: string,
    items: Array<{ name: string; sets: number; reps: number; weight: number }>
  ): Promise<string | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('routines')
      .insert({ user_id: user.id, name, description })
      .select('id')
      .single();
    if (error || !data) {
      toast.error('Failed to create routine');
      return null;
    }
    if (items.length > 0) {
      const rows = items.map((it, idx) => ({
        user_id: user.id,
        routine_id: data.id,
        name: it.name,
        sets: it.sets,
        reps: it.reps,
        weight: it.weight,
        position: idx,
      }));
      await supabase.from('routine_exercises').insert(rows);
    }
    await fetchAll();
    return data.id;
  };

  const deleteRoutine = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('routines').delete().eq('id', id).eq('user_id', user.id);
    if (error) toast.error('Failed to delete routine');
    else await fetchAll();
  };

  const getExercises = (routineId: string) =>
    exercises.filter(e => e.routine_id === routineId).sort((a, b) => a.position - b.position);

  return { routines, exercises, loading, addRoutine, deleteRoutine, getExercises, refetch: fetchAll };
}

export function useWorkoutSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(200);
    setSessions(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const startSession = async (name: string, routineId: string | null): Promise<string | null> => {
    if (!user) return null;
    const insert: TablesInsert<'workout_sessions'> = {
      user_id: user.id,
      name,
      routine_id: routineId,
    };
    const { data, error } = await supabase
      .from('workout_sessions')
      .insert(insert)
      .select('id')
      .single();
    if (error || !data) {
      toast.error('Failed to start session');
      return null;
    }
    await fetchSessions();
    return data.id;
  };

  const finishSession = async (sessionId: string) => {
    if (!user) return;
    // Compute total volume
    const { data: sets } = await supabase
      .from('session_sets')
      .select('reps, weight')
      .eq('session_id', sessionId)
      .eq('user_id', user.id);
    const total = (sets || []).reduce((sum, s) => sum + Number(s.reps) * Number(s.weight), 0);
    await supabase
      .from('workout_sessions')
      .update({ ended_at: new Date().toISOString(), total_volume: total })
      .eq('id', sessionId)
      .eq('user_id', user.id);
    await fetchSessions();
  };

  const deleteSession = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('workout_sessions').delete().eq('id', id).eq('user_id', user.id);
    if (error) toast.error('Failed to delete');
    else await fetchSessions();
  };

  return { sessions, loading, startSession, finishSession, deleteSession, refetch: fetchSessions };
}

export function useSessionSets(sessionId: string | null) {
  const { user } = useAuth();
  const [sets, setSets] = useState<SessionSet[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSets = useCallback(async () => {
    if (!user || !sessionId) {
      setSets([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('session_sets')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .order('completed_at');
    setSets(data || []);
    setLoading(false);
  }, [user, sessionId]);

  useEffect(() => { fetchSets(); }, [fetchSets]);

  const logSet = async (exerciseName: string, setNumber: number, reps: number, weight: number) => {
    if (!user || !sessionId) return false;

    // Check current PR for this exercise
    const { data: prRows } = await supabase
      .from('session_sets')
      .select('weight')
      .eq('user_id', user.id)
      .eq('exercise_name', exerciseName)
      .order('weight', { ascending: false })
      .limit(1);
    const currentPR = prRows && prRows.length > 0 ? Number(prRows[0].weight) : 0;
    const isPR = weight > 0 && weight > currentPR;

    const { error } = await supabase.from('session_sets').insert({
      user_id: user.id,
      session_id: sessionId,
      exercise_name: exerciseName,
      set_number: setNumber,
      reps,
      weight,
      is_pr: isPR,
    });
    if (error) {
      toast.error('Failed to log set');
      return false;
    }
    if (isPR) toast.success(`🏆 New PR! ${weight}kg on ${exerciseName}`);
    await fetchSets();
    return isPR;
  };

  const deleteSet = async (id: string) => {
    if (!user) return;
    await supabase.from('session_sets').delete().eq('id', id).eq('user_id', user.id);
    await fetchSets();
  };

  return { sets, loading, logSet, deleteSet, refetch: fetchSets };
}
