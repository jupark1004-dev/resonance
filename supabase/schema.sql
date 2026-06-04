-- ============================================
-- RESONANCE 데이터베이스 스키마
-- Supabase SQL Editor에서 실행
-- ============================================

-- 1. users 테이블 — 사용자 프로필 정보
create table public.users (
  id uuid primary key references auth.users on delete cascade,
  nickname text,
  birth_year int,
  gender text check (gender in ('male', 'female', 'other')),
  region text,
  created_at timestamptz default now()
);

-- users 테이블 RLS 활성화
alter table public.users enable row level security;

-- 자신의 프로필만 조회 가능
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

-- 자신의 프로필만 수정 가능
create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- 회원가입 시 자신의 프로필 생성 가능
create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);


-- 2. daily_questions 테이블 — 데일리 질문
create table public.daily_questions (
  id uuid primary key default gen_random_uuid(),
  question_text text not null,
  category text check (category in ('emotion', 'relationship', 'space', 'time')),
  created_at timestamptz default now()
);

-- daily_questions RLS 활성화
alter table public.daily_questions enable row level security;

-- 모든 인증된 사용자가 질문을 조회 가능
create policy "Authenticated users can view questions"
  on public.daily_questions for select
  to authenticated
  using (true);


-- 3. responses 테이블 — 사용자 응답
create table public.responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  question_id uuid references public.daily_questions(id) on delete cascade,
  text_response text,
  image_url text,
  responded_at timestamptz default now()
);

-- responses RLS 활성화
alter table public.responses enable row level security;

-- 자신의 응답만 조회 가능
create policy "Users can view own responses"
  on public.responses for select
  using (auth.uid() = user_id);

-- 자신의 응답만 생성 가능
create policy "Users can insert own responses"
  on public.responses for insert
  with check (auth.uid() = user_id);


-- 4. analysis_reports 테이블 — AI 분석 리포트
create table public.analysis_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  report_text text,
  week_number int,
  created_at timestamptz default now()
);

-- analysis_reports RLS 활성화
alter table public.analysis_reports enable row level security;

-- 자신의 리포트만 조회 가능
create policy "Users can view own reports"
  on public.analysis_reports for select
  using (auth.uid() = user_id);

-- 자신의 리포트 생성 가능
create policy "Users can insert own reports"
  on public.analysis_reports for insert
  with check (auth.uid() = user_id);

-- 5. matches 테이블 — 매칭 (Phase 2에서 활용)
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid references public.users(id) on delete cascade,
  user_b_id uuid references public.users(id) on delete cascade,
  resonance_score float,
  match_reason text,
  status text default 'pending' check (status in ('pending', 'gatekeeper', 'matched', 'missed')),
  created_at timestamptz default now()
);

-- matches RLS 활성화
alter table public.matches enable row level security;

-- 자신이 포함된 매칭만 조회 가능
create policy "Users can view own matches"
  on public.matches for select
  using (auth.uid() = user_a_id or auth.uid() = user_b_id);

-- 자신이 포함된 매칭 업데이트 가능 (status 변경용)
create policy "Users can update own matches"
  on public.matches for update
  using (auth.uid() = user_a_id or auth.uid() = user_b_id);

-- 자신이 포함된 매칭 생성 가능 (시뮬레이션 용도)
create policy "Users can insert own matches"
  on public.matches for insert
  with check (auth.uid() = user_a_id or auth.uid() = user_b_id);


-- ============================================
-- 5.5 gatekeeper_questions 테이블 — 관문 질문 (트렌드 반영 가능한 동적 질문)
-- ============================================
create table public.gatekeeper_questions (
  id uuid primary key default gen_random_uuid(),
  option_a text not null,
  option_b text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- gatekeeper_questions RLS 활성화
alter table public.gatekeeper_questions enable row level security;

-- 누구나 활성화된 질문 조회 가능
create policy "Anyone can view active gatekeeper questions"
  on public.gatekeeper_questions for select
  using (is_active = true);


-- 6. gatekeeper_answers 테이블 — 관문 답변 (Phase 2에서 활용)
create table public.gatekeeper_answers (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  answers jsonb, -- { "question_id": "option_a" } 형태
  answered_at timestamptz default now()
);

-- gatekeeper_answers RLS 활성화
alter table public.gatekeeper_answers enable row level security;

-- 자신의 매칭에 포함된 관문 답변은 교차 조회 가능
create policy "Users can view own and partner's gatekeeper answers"
  on public.gatekeeper_answers for select
  using (
    exists (
      select 1 from public.matches
      where id = gatekeeper_answers.match_id
      and (user_a_id = auth.uid() or user_b_id = auth.uid())
    )
  );

-- 자신의 관문 답변만 생성 가능
create policy "Users can insert own gatekeeper answers"
  on public.gatekeeper_answers for insert
  with check (auth.uid() = user_id);


-- ============================================
-- 6.5 messages 테이블 — 실시간 채팅방 (Phase 2)
-- ============================================
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id) on delete cascade,
  sender_id uuid references public.users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- messages RLS 활성화
alter table public.messages enable row level security;

-- 참여 중인 매칭의 메시지만 조회 가능
create policy "Users can view messages in their matches"
  on public.messages for select
  using (
    exists (
      select 1 from public.matches
      where id = messages.match_id
      and (user_a_id = auth.uid() or user_b_id = auth.uid())
    )
  );

-- 참여 중인 매칭에만 메시지 생성 가능
create policy "Users can insert messages in their matches"
  on public.messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.matches
      where id = messages.match_id
      and (user_a_id = auth.uid() or user_b_id = auth.uid())
      and status = 'matched' -- 매칭이 완료된 후만 전송 가능
    )
  );

-- messages 테이블 Realtime 환성화
alter publication supabase_realtime add table messages;

-- ============================================
-- 7. 초기 시드 데이터 — 데일리 질문 샘플
-- ============================================
insert into public.daily_questions (question_text, category) values
  ('오늘 하루 중 가장 마음이 따뜻해진 순간은 언제였나요?', 'emotion'),
  ('당신이 가장 편안함을 느끼는 장소는 어디인가요?', 'space'),
  ('가장 최근에 누군가에게 고마웠던 순간을 떠올려 보세요.', 'relationship'),
  ('만약 시간을 되돌릴 수 있다면, 어떤 하루로 돌아가고 싶나요?', 'time'),
  ('요즘 반복해서 듣는 노래가 있다면, 그 노래가 지금의 기분과 어떻게 연결되나요?', 'emotion'),
  ('당신이 사랑하는 사람에게 가장 듣고 싶은 말은 무엇인가요?', 'relationship'),
  ('지금 창밖을 본다면, 어떤 풍경이 당신을 가장 위로해줄 것 같나요?', 'space'),
  ('10년 후의 나에게 편지를 쓴다면, 첫 문장은 무엇일까요?', 'time'),
  ('오늘 느낀 감정 중 가장 강렬했던 것을 색깔로 표현한다면?', 'emotion'),
  ('당신이 생각하는 "좋은 관계"의 가장 중요한 조건은 무엇인가요?', 'relationship'),
  ('가장 기억에 남는 여행지를 사진 한 장으로 보여준다면?', 'space'),
  ('어제와 오늘, 무엇이 달라졌나요?', 'time'),
  ('마지막으로 진심으로 웃었던 순간은 언제인가요?', 'emotion'),
  ('당신에게 "집"이란 어떤 의미인가요?', 'space');

-- ============================================
-- 7.5 초기 시드 데이터 — 관문 질문 샘플 (트렌드 반영 가능)
-- ============================================
insert into public.gatekeeper_questions (option_a, option_b) values
  ('산 ⛰️', '바다 🌊'),
  ('콜라 🥤', '사이다 🧊'),
  ('여름 ☀️', '겨울 ❄️'),
  ('전화 📞', '문자 💬'),
  ('짜장면 🍝', '짬뽕 🍜'),
  ('영화관람 🎬', '넷플릭스 📺'), -- 예시 추가
  ('계획적인 J 📝', '즉흥적인 P 🚀'); -- 예시 추가


-- ============================================
-- 8. 회원가입 시 자동으로 users 프로필 생성하는 함수 & 트리거
-- ============================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================
-- 9. Storage 버킷 — 이미지 응답 저장용
-- ============================================
insert into storage.buckets (id, name, public)
values ('response-images', 'response-images', true);

-- 인증된 사용자만 이미지 업로드 가능
create policy "Authenticated users can upload images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'response-images');

-- 모든 사용자가 이미지 조회 가능 (공개 버킷)
create policy "Anyone can view response images"
  on storage.objects for select
  using (bucket_id = 'response-images');
