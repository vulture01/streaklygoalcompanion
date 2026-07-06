CREATE OR REPLACE FUNCTION public.accept_friend_request(_request_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _sender UUID;
  _receiver UUID;
  _status public.friend_request_status;
  _uid UUID := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT sender_id, receiver_id, status
    INTO _sender, _receiver, _status
  FROM public.friend_requests WHERE id = _request_id;

  IF _receiver IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;
  IF _receiver <> _uid THEN
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
$function$;

REVOKE EXECUTE ON FUNCTION public.accept_friend_request(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.accept_friend_request(uuid) TO authenticated;