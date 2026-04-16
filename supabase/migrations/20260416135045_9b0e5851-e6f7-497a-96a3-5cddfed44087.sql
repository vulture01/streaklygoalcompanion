
CREATE OR REPLACE FUNCTION public.increment_ai_usage(_user_id UUID, _date DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.ai_usage (user_id, date, call_count)
  VALUES (_user_id, _date, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET call_count = ai_usage.call_count + 1;
END;
$$;
