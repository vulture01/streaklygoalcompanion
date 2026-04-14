
-- Fix profiles RLS policies: change auth.uid() = id to auth.uid() = user_id
DROP POLICY IF EXISTS "own_profile_insert" ON public.profiles;
DROP POLICY IF EXISTS "own_profile_select" ON public.profiles;
DROP POLICY IF EXISTS "own_profile_update" ON public.profiles;

CREATE POLICY "own_profile_select" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "own_profile_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_profile_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
