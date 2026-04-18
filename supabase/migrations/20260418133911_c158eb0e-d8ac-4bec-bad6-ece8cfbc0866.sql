-- 1. Dedupe habits: keep earliest per (user_id, lower(name)), repoint completions, delete the rest
WITH ranked AS (
  SELECT
    id,
    user_id,
    lower(name) AS lname,
    ROW_NUMBER() OVER (PARTITION BY user_id, lower(name) ORDER BY created_at ASC, id ASC) AS rn,
    FIRST_VALUE(id) OVER (PARTITION BY user_id, lower(name) ORDER BY created_at ASC, id ASC) AS keeper_id
  FROM public.habits
),
dupes AS (
  SELECT id, keeper_id FROM ranked WHERE rn > 1
)
UPDATE public.habit_completions hc
SET habit_id = d.keeper_id
FROM dupes d
WHERE hc.habit_id = d.id;

DELETE FROM public.habits h
USING (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, lower(name) ORDER BY created_at ASC, id ASC) AS rn
    FROM public.habits
  ) t WHERE rn > 1
) d
WHERE h.id = d.id;

-- 2. Unique constraint to prevent future duplicates (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS habits_user_name_unique
  ON public.habits (user_id, lower(name));

-- 3. Cascade deletes via FKs (drop existing if any, then re-add ON DELETE CASCADE)
ALTER TABLE public.habit_completions
  DROP CONSTRAINT IF EXISTS habit_completions_habit_id_fkey;
ALTER TABLE public.habit_completions
  ADD CONSTRAINT habit_completions_habit_id_fkey
  FOREIGN KEY (habit_id) REFERENCES public.habits(id) ON DELETE CASCADE;

ALTER TABLE public.logs
  DROP CONSTRAINT IF EXISTS logs_goal_id_fkey;
ALTER TABLE public.logs
  ADD CONSTRAINT logs_goal_id_fkey
  FOREIGN KEY (goal_id) REFERENCES public.goals(id) ON DELETE CASCADE;

ALTER TABLE public.badges
  DROP CONSTRAINT IF EXISTS badges_goal_id_fkey;
ALTER TABLE public.badges
  ADD CONSTRAINT badges_goal_id_fkey
  FOREIGN KEY (goal_id) REFERENCES public.goals(id) ON DELETE CASCADE;

ALTER TABLE public.todos
  DROP CONSTRAINT IF EXISTS todos_goal_id_fkey;
ALTER TABLE public.todos
  ADD CONSTRAINT todos_goal_id_fkey
  FOREIGN KEY (goal_id) REFERENCES public.goals(id) ON DELETE SET NULL;