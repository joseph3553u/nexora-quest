-- Civora backend feature schema. Safe to apply repeatedly; does not delete existing data.
create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists program text not null default '',
  add column if not exists department text not null default '',
  add column if not exists semester text not null default '',
  add column if not exists cgpa numeric(4,2),
  add column if not exists attendance numeric(5,2),
  add column if not exists credits integer,
  add column if not exists target_role text not null default '',
  add column if not exists onboarding_answers jsonb not null default '{}'::jsonb,
  add column if not exists onboarding_complete boolean not null default false;

create table if not exists public.courses (
  id text primary key,
  title text not null,
  provider text not null default 'Civora Learn',
  level text not null default 'Beginner' check (level in ('Beginner','Intermediate','Advanced')),
  hours integer not null default 0 check (hours >= 0),
  track text not null default 'Core CS',
  created_at timestamptz not null default now()
);
create table if not exists public.course_lessons (
  id text not null,
  course_id text not null references public.courses(id) on delete cascade,
  title text not null,
  position integer not null default 0,
  minutes integer not null default 0 check (minutes >= 0),
  primary key (course_id, id)
);
create index if not exists course_lessons_position_idx on public.course_lessons(course_id, position);
create table if not exists public.course_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null references public.courses(id) on delete cascade,
  lesson_id text not null,
  completed boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, course_id, lesson_id),
  foreign key (course_id, lesson_id) references public.course_lessons(course_id, id) on delete cascade
);
create unique index if not exists course_progress_owner_lesson_idx on public.course_progress(user_id, course_id, lesson_id);

insert into public.courses (id,title,provider,level,hours,track) values
 ('c1','Data Structures Masterclass','Civora Learn','Intermediate',28,'Core CS'),
 ('c2','Full-Stack Web Engineering','Civora Learn','Advanced',42,'Development'),
 ('c3','Applied Machine Learning','Civora Learn','Advanced',36,'AI & Data'),
 ('c4','Aptitude & Placement Prep','Civora Learn','Beginner',18,'Careers')
on conflict (id) do nothing;
insert into public.course_lessons (id,course_id,title,position,minutes) values
 ('l1','c1','Arrays & Two Pointers',1,45),('l2','c1','Linked Lists',2,50),('l3','c1','Trees & Traversals',3,65),('l4','c1','Graphs & Shortest Paths',4,80),
 ('l1','c2','Modern React Foundations',1,60),('l2','c2','APIs and Data Fetching',2,55),('l3','c2','Deployment Pipelines',3,40),
 ('l1','c3','Regression Refresher',1,40),('l2','c3','Model Evaluation',2,45),('l3','c3','Neural Networks Intro',3,70),
 ('l1','c4','Quantitative Basics',1,35),('l2','c4','Logical Reasoning',2,35),('l3','c4','Verbal Ability',3,30)
on conflict (course_id,id) do nothing;

create table if not exists public.student_roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Personal learning roadmap',
  roadmap jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists student_roadmaps_owner_updated_idx on public.student_roadmaps(user_id, updated_at desc);

create table if not exists public.timetable_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.timetable_classes (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.timetable_documents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  weekday smallint not null check (weekday between 0 and 6),
  starts_at time not null,
  ends_at time,
  location text not null default '',
  remind_minutes integer not null default 10 check (remind_minutes between 0 and 1440),
  reminder_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
create index if not exists timetable_classes_owner_time_idx on public.timetable_classes(user_id, weekday, starts_at);

create table if not exists public.paper_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  subject text not null default '',
  analysis jsonb not null,
  source_name text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists paper_analyses_owner_created_idx on public.paper_analyses(user_id, created_at desc);

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  author_role text not null default '',
  space text not null check (space in ('Academics','Placements','Competitions','Projects')),
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists community_posts_feed_idx on public.community_posts(created_at desc);
create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists community_comments_post_created_idx on public.community_comments(post_id, created_at);
create table if not exists public.community_likes (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  description text not null default '',
  subject text not null default '',
  resource_type text not null default 'Notes' check (resource_type in ('Notes','Book','Slides','Video','Cheatsheet','Other')),
  semester text not null default '',
  author_name text not null default 'Civora student',
  file_name text not null,
  storage_path text not null unique,
  mime_type text not null,
  size_bytes bigint not null default 0,
  extracted_text text not null default '',
  has_text boolean not null default false,
  is_public boolean not null default true,
  download_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists resources_created_idx on public.resources(created_at desc);
create index if not exists resources_search_idx on public.resources using gin (
  to_tsvector('english', coalesce(title,'') || ' ' || coalesce(subject,'') || ' ' || coalesce(description,'') || ' ' || coalesce(semester,''))
);
create table if not exists public.resource_saves (
  resource_id uuid not null references public.resources(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (resource_id, user_id)
);

create or replace function public.increment_resource_download(_resource_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
begin
  update public.resources set download_count = download_count + 1
  where id = _resource_id and (is_public or owner_id = auth.uid());
end;
$$;

drop policy if exists profiles_select_self on public.profiles;
drop policy if exists profiles_insert_self on public.profiles;
drop policy if exists profiles_update_self on public.profiles;
drop policy if exists courses_authenticated_read on public.courses;
drop policy if exists course_lessons_authenticated_read on public.course_lessons;
drop policy if exists course_progress_self_read on public.course_progress;
drop policy if exists course_progress_self_insert on public.course_progress;
drop policy if exists course_progress_self_update on public.course_progress;
drop policy if exists course_progress_self_delete on public.course_progress;
drop policy if exists student_roadmaps_self_all on public.student_roadmaps;
drop policy if exists timetable_documents_self_all on public.timetable_documents;
drop policy if exists timetable_classes_self_all on public.timetable_classes;
drop policy if exists paper_analyses_self_all on public.paper_analyses;
drop policy if exists community_posts_authenticated_read on public.community_posts;
drop policy if exists community_posts_author_insert on public.community_posts;
drop policy if exists community_posts_author_update on public.community_posts;
drop policy if exists community_posts_author_delete on public.community_posts;
drop policy if exists community_comments_authenticated_read on public.community_comments;
drop policy if exists community_comments_author_insert on public.community_comments;
drop policy if exists community_comments_author_delete on public.community_comments;
drop policy if exists community_likes_authenticated_read on public.community_likes;
drop policy if exists community_likes_self_insert on public.community_likes;
drop policy if exists community_likes_self_delete on public.community_likes;
drop policy if exists resources_visible_read on public.resources;
drop policy if exists resources_owner_insert on public.resources;
drop policy if exists resources_owner_update on public.resources;
drop policy if exists resources_owner_delete on public.resources;
drop policy if exists resource_saves_self_all on public.resource_saves;
drop policy if exists civora_files_owner_insert on storage.objects;
drop policy if exists civora_files_owner_read on storage.objects;
drop policy if exists civora_shared_resource_read on storage.objects;
drop policy if exists civora_files_owner_delete on storage.objects;

alter table public.profiles enable row level security;
create policy profiles_select_self on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_insert_self on public.profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_update_self on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

alter table public.courses enable row level security;
alter table public.course_lessons enable row level security;
alter table public.course_progress enable row level security;
create policy courses_authenticated_read on public.courses for select to authenticated using (true);
create policy course_lessons_authenticated_read on public.course_lessons for select to authenticated using (true);
create policy course_progress_self_read on public.course_progress for select to authenticated using (user_id = auth.uid());
create policy course_progress_self_insert on public.course_progress for insert to authenticated with check (user_id = auth.uid());
create policy course_progress_self_update on public.course_progress for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy course_progress_self_delete on public.course_progress for delete to authenticated using (user_id = auth.uid());

alter table public.student_roadmaps enable row level security;
create policy student_roadmaps_self_all on public.student_roadmaps for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table public.timetable_documents enable row level security;
create policy timetable_documents_self_all on public.timetable_documents for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table public.timetable_classes enable row level security;
create policy timetable_classes_self_all on public.timetable_classes for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table public.paper_analyses enable row level security;
create policy paper_analyses_self_all on public.paper_analyses for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.community_posts enable row level security;
create policy community_posts_authenticated_read on public.community_posts for select to authenticated using (true);
create policy community_posts_author_insert on public.community_posts for insert to authenticated with check (author_id = auth.uid());
create policy community_posts_author_update on public.community_posts for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy community_posts_author_delete on public.community_posts for delete to authenticated using (author_id = auth.uid());
alter table public.community_comments enable row level security;
create policy community_comments_authenticated_read on public.community_comments for select to authenticated using (true);
create policy community_comments_author_insert on public.community_comments for insert to authenticated with check (author_id = auth.uid());
create policy community_comments_author_delete on public.community_comments for delete to authenticated using (author_id = auth.uid());
alter table public.community_likes enable row level security;
create policy community_likes_authenticated_read on public.community_likes for select to authenticated using (true);
create policy community_likes_self_insert on public.community_likes for insert to authenticated with check (user_id = auth.uid());
create policy community_likes_self_delete on public.community_likes for delete to authenticated using (user_id = auth.uid());

alter table public.resources enable row level security;
create policy resources_visible_read on public.resources for select to authenticated using (is_public or owner_id = auth.uid());
create policy resources_owner_insert on public.resources for insert to authenticated with check (owner_id = auth.uid());
create policy resources_owner_update on public.resources for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy resources_owner_delete on public.resources for delete to authenticated using (owner_id = auth.uid());
alter table public.resource_saves enable row level security;
create policy resource_saves_self_all on public.resource_saves for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Private uploads; object paths begin with the authenticated user's UUID.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('civora-files', 'civora-files', false, 20971520, array['application/pdf','text/plain','text/markdown'])
on conflict (id) do nothing;
create policy civora_files_owner_insert on storage.objects for insert to authenticated
with check (bucket_id = 'civora-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy civora_files_owner_read on storage.objects for select to authenticated
using (bucket_id = 'civora-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy civora_shared_resource_read on storage.objects for select to authenticated
using (bucket_id = 'civora-files' and exists (
  select 1 from public.resources r where r.storage_path = name and (r.is_public or r.owner_id = auth.uid())
));
create policy civora_files_owner_delete on storage.objects for delete to authenticated
using (bucket_id = 'civora-files' and (storage.foldername(name))[1] = auth.uid()::text);

grant select on public.courses, public.course_lessons to authenticated;
grant select, insert, update, delete on public.course_progress to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.student_roadmaps, public.timetable_documents, public.timetable_classes, public.paper_analyses to authenticated;
grant select, insert, update, delete on public.community_posts to authenticated;
grant select, insert, delete on public.community_comments, public.community_likes to authenticated;
grant select, insert, update, delete on public.resources, public.resource_saves to authenticated;
grant execute on function public.increment_resource_download(uuid) to authenticated;
