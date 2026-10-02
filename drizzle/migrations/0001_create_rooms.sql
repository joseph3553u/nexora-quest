CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rooms TO authenticated;
GRANT ALL ON public.rooms TO service_role;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.room_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, user_id)
);
GRANT SELECT, DELETE ON public.room_members TO authenticated;
GRANT ALL ON public.room_members TO service_role;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read own memberships" ON public.room_members FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Students leave own rooms" ON public.room_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.is_room_member(_room_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.room_members WHERE room_id = _room_id AND user_id = _user_id)
$$;

CREATE POLICY "Members read their rooms" ON public.rooms FOR SELECT TO authenticated USING (public.is_room_member(id, auth.uid()));

CREATE TABLE public.room_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  title text NOT NULL,
  subject text NOT NULL DEFAULT '',
  file_type text NOT NULL DEFAULT 'PDF',
  semester int,
  uploaded_by text NOT NULL DEFAULT '',
  size_label text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.room_files TO authenticated;
GRANT ALL ON public.room_files TO service_role;
ALTER TABLE public.room_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read room files" ON public.room_files FOR SELECT TO authenticated USING (public.is_room_member(room_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.join_room(_code text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _room uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT id INTO _room FROM public.rooms WHERE upper(code) = upper(trim(_code));
  IF _room IS NULL THEN RAISE EXCEPTION 'Room not found'; END IF;
  INSERT INTO public.room_members (room_id, user_id) VALUES (_room, auth.uid()) ON CONFLICT DO NOTHING;
  RETURN _room;
END $$;
REVOKE EXECUTE ON FUNCTION public.join_room(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.join_room(text) TO authenticated;

INSERT INTO public.rooms (id, code, name, description) VALUES
 ('11111111-1111-4111-8111-111111111111', 'KLRCSE', 'KLR - CSE', 'KL University, Computer Science & Engineering — shared notes, papers and lab files.');

INSERT INTO public.room_files (room_id, title, subject, file_type, semester, uploaded_by, size_label) VALUES
 ('11111111-1111-4111-8111-111111111111', 'DBMS Unit 3 — Normalization Notes', 'Database Management Systems', 'PDF', 5, 'Prof. S. Ramesh', '2.4 MB'),
 ('11111111-1111-4111-8111-111111111111', 'Operating Systems Mid-1 Paper 2025', 'Operating Systems', 'PDF', 5, 'Exam Cell', '850 KB'),
 ('11111111-1111-4111-8111-111111111111', 'Computer Networks Lab Manual', 'Computer Networks', 'PDF', 5, 'CN Lab Faculty', '5.1 MB'),
 ('11111111-1111-4111-8111-111111111111', 'Design & Analysis of Algorithms — DP Slides', 'DAA', 'Slides', 5, 'Dr. K. Lakshmi', '3.7 MB'),
 ('11111111-1111-4111-8111-111111111111', 'Software Engineering Case Study Template', 'Software Engineering', 'DOCX', 5, 'Class Rep — Harshith', '120 KB'),
 ('11111111-1111-4111-8111-111111111111', 'Sem 5 Timetable (Section A)', 'General', 'Image', 5, 'CSE Department', '410 KB'),
 ('11111111-1111-4111-8111-111111111111', 'Python for ML — Workshop Notebook', 'Machine Learning', 'Notebook', 5, 'AI Club KLR', '1.2 MB'),
 ('11111111-1111-4111-8111-111111111111', 'Theory of Computation End-Sem 2024', 'Theory of Computation', 'PDF', 5, 'Exam Cell', '980 KB');