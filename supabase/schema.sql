-- 스탬프트립 Supabase 스키마
-- Supabase 대시보드 → SQL Editor 에 전체 붙여넣고 Run 하면 됩니다. (여러 번 실행해도 안전)

-- ─────────────────────────────────────────────
-- 1. 프로필 (첫 로그인 시 닉네임 설정 화면에서 생성)
-- ─────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nickname    text not null check (char_length(nickname) between 2 and 12),
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 2. 스탬프 (방문 인증)
-- ─────────────────────────────────────────────
create table if not exists public.stamps (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  content_id  text not null,
  title       text,
  addr1       text,
  firstimage  text,
  stamped_at  timestamptz not null default now(),
  unique (user_id, content_id)
);
create index if not exists stamps_user_id_idx on public.stamps(user_id);

-- ─────────────────────────────────────────────
-- 3. 관심 목록
-- ─────────────────────────────────────────────
create table if not exists public.favorites (
  id              bigint generated always as identity primary key,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  content_id      text not null,
  title           text,
  addr1           text,
  firstimage      text,
  event_end_date  text,
  saved_at        timestamptz not null default now(),
  unique (user_id, content_id)
);
create index if not exists favorites_user_id_idx on public.favorites(user_id);

-- ─────────────────────────────────────────────
-- 3-1. 내 코스 (주변 코스 스팟에서 직접 골라 만든 코스)
--      spots: 방문 순서대로 정렬된 관광지 배열
--      [{ contentid, title, addr1, firstimage, mapx, mapy }, ...]
-- ─────────────────────────────────────────────
create table if not exists public.courses (
  id                bigint generated always as identity primary key,
  user_id           uuid not null references public.profiles(id) on delete cascade,
  name              text not null check (char_length(name) between 1 and 30),
  event_content_id  text,
  event_title       text,
  event_mapx        text,
  event_mapy        text,
  spots             jsonb not null default '[]'::jsonb,
  created_at        timestamptz not null default now()
);
create index if not exists courses_user_id_idx on public.courses(user_id);

-- ─────────────────────────────────────────────
-- 4. RLS: 본인 데이터만 읽고 쓸 수 있게
-- ─────────────────────────────────────────────
alter table public.profiles  enable row level security;
alter table public.stamps    enable row level security;
alter table public.favorites enable row level security;
alter table public.courses   enable row level security;

drop policy if exists "courses: own" on public.courses;
create policy "courses: own" on public.courses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "profiles: own" on public.profiles;
create policy "profiles: own" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "stamps: own" on public.stamps;
create policy "stamps: own" on public.stamps
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "favorites: own" on public.favorites;
create policy "favorites: own" on public.favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- 5. 회원 탈퇴 RPC: 로그인한 본인 계정을 auth.users에서 삭제
--    (profiles / stamps / favorites / courses 는 FK cascade 로 함께 삭제됨)
-- ─────────────────────────────────────────────
create or replace function public.delete_my_account()
returns void
language sql
security definer
set search_path = public
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
