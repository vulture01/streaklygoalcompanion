-- Deduplicate goals: keep most recent per (user_id, lower(name))
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, lower(trim(name))
           ORDER BY created_at DESC, id DESC
         ) AS rn
  FROM public.goals
)
DELETE FROM public.goals g
USING ranked r
WHERE g.id = r.id AND r.rn > 1;

-- Unique index on (user_id, lower(trim(name)))
CREATE UNIQUE INDEX IF NOT EXISTS goals_user_id_name_unique
  ON public.goals (user_id, lower(trim(name)));

-- Ensure habits has the same protection
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, lower(trim(name))
           ORDER BY created_at DESC, id DESC
         ) AS rn
  FROM public.habits
)
DELETE FROM public.habits h
USING ranked r
WHERE h.id = r.id AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS habits_user_id_name_unique
  ON public.habits (user_id, lower(trim(name)));
