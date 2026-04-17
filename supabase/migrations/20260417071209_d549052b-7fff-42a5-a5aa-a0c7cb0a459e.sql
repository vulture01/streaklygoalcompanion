-- Routines (templates)
CREATE TABLE public.routines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own routines" ON public.routines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own routines" ON public.routines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own routines" ON public.routines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own routines" ON public.routines FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_routines_updated_at
  BEFORE UPDATE ON public.routines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Routine exercises
CREATE TABLE public.routine_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sets INTEGER NOT NULL DEFAULT 3,
  reps INTEGER NOT NULL DEFAULT 10,
  weight NUMERIC NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.routine_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own routine exercises" ON public.routine_exercises FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own routine exercises" ON public.routine_exercises FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own routine exercises" ON public.routine_exercises FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own routine exercises" ON public.routine_exercises FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_routine_exercises_routine ON public.routine_exercises(routine_id, position);

-- Workout sessions
CREATE TABLE public.workout_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  routine_id UUID REFERENCES public.routines(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT 'Workout',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  total_volume NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own sessions" ON public.workout_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sessions" ON public.workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sessions" ON public.workout_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own sessions" ON public.workout_sessions FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_sessions_user_started ON public.workout_sessions(user_id, started_at DESC);

-- Session sets
CREATE TABLE public.session_sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  set_number INTEGER NOT NULL DEFAULT 1,
  reps INTEGER NOT NULL DEFAULT 0,
  weight NUMERIC NOT NULL DEFAULT 0,
  is_pr BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.session_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own sets" ON public.session_sets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sets" ON public.session_sets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sets" ON public.session_sets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own sets" ON public.session_sets FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_session_sets_session ON public.session_sets(session_id);
CREATE INDEX idx_session_sets_user_exercise ON public.session_sets(user_id, exercise_name);