ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS reminder_time time NULL;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS reminder_time time NULL;