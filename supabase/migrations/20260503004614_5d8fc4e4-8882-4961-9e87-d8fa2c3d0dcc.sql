-- Prevent negative or pre-inflated call_count values
ALTER TABLE public.ai_usage
  ADD CONSTRAINT ai_usage_call_count_nonneg CHECK (call_count >= 0);

-- Tighten client INSERT policy: rows must start at 0
DROP POLICY IF EXISTS "Users can insert own usage" ON public.ai_usage;
CREATE POLICY "Users can insert own usage"
  ON public.ai_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND call_count = 0);