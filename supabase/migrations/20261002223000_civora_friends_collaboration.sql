-- Civora Friends, Unique Civora IDs, Project Collaboration Requests, and Direct Messages
-- Applied idempotently to existing Supabase project.

-- 1. Ensure profiles table has unique civora_id
alter table public.profiles
  add column if not exists civora_id text;

create unique index if not exists profiles_civora_id_unique_idx
  on public.profiles (lower(civora_id))
  where civora_id is not null;

-- 2. Friendships and friend requests table
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  friend_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'rejected')) default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, friend_id),
  constraint friendships_distinct_users check (user_id != friend_id)
);

create index if not exists friendships_user_status_idx on public.friendships (user_id, status);
create index if not exists friendships_friend_status_idx on public.friendships (friend_id, status);

alter table public.friendships enable row level security;

-- Policies for friendships
create policy "Users can view their own friendships"
  on public.friendships for select
  using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "Users can send friend requests"
  on public.friendships for insert
  with check (auth.uid() = user_id);

create policy "Users can update received or sent requests"
  on public.friendships for update
  using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "Users can remove their friendships"
  on public.friendships for delete
  using (auth.uid() = user_id or auth.uid() = friend_id);

-- 3. Project Collaboration Requests table
create table if not exists public.project_collaboration_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  project_title text not null,
  project_pitch text not null,
  skills_needed text[] not null default '{}'::text[],
  status text not null check (status in ('pending', 'accepted', 'declined')) default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint proj_collab_distinct_users check (sender_id != receiver_id)
);

create index if not exists proj_collab_sender_idx on public.project_collaboration_requests (sender_id, status);
create index if not exists proj_collab_receiver_idx on public.project_collaboration_requests (receiver_id, status);

alter table public.project_collaboration_requests enable row level security;

-- Policies for project collaboration requests
create policy "Users can view project requests sent or received"
  on public.project_collaboration_requests for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can create project collaboration requests"
  on public.project_collaboration_requests for insert
  with check (auth.uid() = sender_id);

create policy "Receivers or senders can update project request status"
  on public.project_collaboration_requests for update
  using (auth.uid() = receiver_id or auth.uid() = sender_id);

create policy "Users can delete project requests they sent"
  on public.project_collaboration_requests for delete
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- 4. Direct 1-to-1 Messages table
create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint direct_msg_distinct_users check (sender_id != receiver_id)
);

create index if not exists direct_messages_conversation_idx on public.direct_messages (sender_id, receiver_id, created_at asc);
create index if not exists direct_messages_receiver_unread_idx on public.direct_messages (receiver_id, read) where not read;

alter table public.direct_messages enable row level security;

-- Policies for direct messages
create policy "Users can read messages they sent or received"
  on public.direct_messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send direct messages"
  on public.direct_messages for insert
  with check (auth.uid() = sender_id);

create policy "Receivers can mark messages as read"
  on public.direct_messages for update
  using (auth.uid() = receiver_id);

create policy "Senders can delete their sent messages"
  on public.direct_messages for delete
  using (auth.uid() = sender_id);
