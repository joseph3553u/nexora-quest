ALTER TABLE public.room_files ADD COLUMN chapter text NOT NULL DEFAULT 'General';
UPDATE public.room_files SET chapter = CASE
  WHEN title ILIKE '%Unit 3%' THEN 'Unit 3 — Normalization'
  WHEN title ILIKE '%Mid-1%' THEN 'Previous Papers'
  WHEN title ILIKE '%Lab Manual%' THEN 'Lab'
  WHEN title ILIKE '%DP Slides%' THEN 'Unit 4 — Dynamic Programming'
  WHEN title ILIKE '%End-Sem%' THEN 'Previous Papers'
  ELSE 'General' END;

CREATE OR REPLACE FUNCTION public.create_or_join_room(_code text, _name text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _room uuid; _c text := upper(trim(_code));
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF _c !~ '^[A-Z0-9-]{3,20}$' THEN RAISE EXCEPTION 'Code must be 3-20 letters, numbers or dashes'; END IF;
  SELECT id INTO _room FROM public.rooms WHERE upper(code) = _c;
  IF _room IS NULL THEN
    INSERT INTO public.rooms (code, name) VALUES (_c, COALESCE(NULLIF(left(trim(_name), 60), ''), _c))
    ON CONFLICT (code) DO NOTHING RETURNING id INTO _room;
    IF _room IS NULL THEN SELECT id INTO _room FROM public.rooms WHERE upper(code) = _c; END IF;
  END IF;
  INSERT INTO public.room_members (room_id, user_id) VALUES (_room, auth.uid()) ON CONFLICT DO NOTHING;
  RETURN _room;
END $$;
REVOKE EXECUTE ON FUNCTION public.create_or_join_room(text, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.create_or_join_room(text, text) TO authenticated;