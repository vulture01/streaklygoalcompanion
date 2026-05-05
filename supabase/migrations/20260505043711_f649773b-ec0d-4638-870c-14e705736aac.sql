
-- Username uniqueness + format
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_format
  CHECK (username IS NULL OR username ~ '^[A-Za-z0-9_]{3,20}$');

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;

-- friend_requests
CREATE TYPE public.friend_request_status AS ENUM ('pending', 'accepted', 'rejected');

CREATE TABLE public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  status public.friend_request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT friend_requests_no_self CHECK (sender_id <> receiver_id),
  CONSTRAINT friend_requests_unique_pair UNIQUE (sender_id, receiver_id)
);

CREATE INDEX idx_friend_requests_receiver ON public.friend_requests(receiver_id, status);
CREATE INDEX idx_friend_requests_sender ON public.friend_requests(sender_id, status);

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own requests"
  ON public.friend_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users create own requests"
  ON public.friend_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id AND status = 'pending');

CREATE POLICY "Receiver updates request status"
  ON public.friend_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id);

CREATE POLICY "Either party deletes request"
  ON public.friend_requests FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE TRIGGER update_friend_requests_updated_at
BEFORE UPDATE ON public.friend_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- friends (one row per direction)
CREATE TABLE public.friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT friends_no_self CHECK (user_id <> friend_id),
  CONSTRAINT friends_unique_pair UNIQUE (user_id, friend_id)
);

CREATE INDEX idx_friends_user ON public.friends(user_id);
CREATE INDEX idx_friends_friend ON public.friends(friend_id);

ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own friendships"
  ON public.friends FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own friendships"
  ON public.friends FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- (Inserts only via security-definer function below; no INSERT policy on purpose.)

-- Search users by username (returns minimal fields only)
CREATE OR REPLACE FUNCTION public.search_users_by_username(_query TEXT)
RETURNS TABLE(user_id UUID, username TEXT, name TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.user_id, p.username, p.name
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL
    AND p.username IS NOT NULL
    AND length(_query) >= 2
    AND p.username ILIKE _query || '%'
    AND p.user_id <> auth.uid()
  LIMIT 20;
$$;

-- Accept request: validates receiver, creates both friend rows, marks request accepted.
CREATE OR REPLACE FUNCTION public.accept_friend_request(_request_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _sender UUID;
  _receiver UUID;
  _status public.friend_request_status;
BEGIN
  SELECT sender_id, receiver_id, status
    INTO _sender, _receiver, _status
  FROM public.friend_requests WHERE id = _request_id;

  IF _receiver IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;
  IF _receiver <> auth.uid() THEN
    RAISE EXCEPTION 'Only the receiver can accept';
  END IF;
  IF _status <> 'pending' THEN
    RAISE EXCEPTION 'Request not pending';
  END IF;

  INSERT INTO public.friends (user_id, friend_id) VALUES (_sender, _receiver)
    ON CONFLICT DO NOTHING;
  INSERT INTO public.friends (user_id, friend_id) VALUES (_receiver, _sender)
    ON CONFLICT DO NOTHING;

  UPDATE public.friend_requests SET status = 'accepted' WHERE id = _request_id;
END;
$$;

-- Leaderboard: caller + their friends, ranked by streak total.
-- _weekly = false → sum of active goal streaks
-- _weekly = true  → count of completed log days this week (since Monday UTC)
CREATE OR REPLACE FUNCTION public.get_leaderboard(_weekly BOOLEAN DEFAULT FALSE)
RETURNS TABLE(user_id UUID, username TEXT, name TEXT, total_streak INTEGER, rank INTEGER)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _me UUID := auth.uid();
  _week_start DATE := (date_trunc('week', now()))::date; -- Monday in PG
BEGIN
  IF _me IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH ids AS (
    SELECT _me AS uid
    UNION
    SELECT friend_id FROM public.friends WHERE user_id = _me
  ),
  scores AS (
    SELECT
      i.uid,
      CASE
        WHEN _weekly THEN COALESCE((
          SELECT COUNT(DISTINCT date)::INTEGER
          FROM public.logs
          WHERE logs.user_id = i.uid
            AND logs.completed = TRUE
            AND logs.date >= _week_start
        ), 0)
        ELSE COALESCE((
          SELECT SUM(streak)::INTEGER
          FROM public.goals
          WHERE goals.user_id = i.uid AND goals.paused = FALSE
        ), 0)
      END AS total
    FROM ids i
  )
  SELECT
    s.uid,
    p.username,
    p.name,
    s.total,
    (RANK() OVER (ORDER BY s.total DESC))::INTEGER AS rnk
  FROM scores s
  JOIN public.profiles p ON p.user_id = s.uid
  ORDER BY rnk ASC, p.username ASC;
END;
$$;
