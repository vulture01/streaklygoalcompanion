
-- Create physique_logs table
CREATE TABLE public.physique_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight NUMERIC,
  body_fat NUMERIC,
  chest NUMERIC,
  waist NUMERIC,
  hips NUMERIC,
  arms NUMERIC,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.physique_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own physique logs"
  ON public.physique_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own physique logs"
  ON public.physique_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own physique logs"
  ON public.physique_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own physique logs"
  ON public.physique_logs FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_physique_logs_updated_at
  BEFORE UPDATE ON public.physique_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_physique_logs_user_date ON public.physique_logs(user_id, date DESC);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('physique-photos', 'physique-photos', false);

-- Storage RLS: each user can only access their own folder (path starts with their uid)
CREATE POLICY "Users view own physique photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'physique-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own physique photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'physique-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own physique photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'physique-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own physique photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'physique-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
