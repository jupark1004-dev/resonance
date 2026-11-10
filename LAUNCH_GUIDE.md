# 🚀 RESONANCE 실전 배포 & 초기 1,000명 확산 마스터 가이드 (A to Z)

> **목표**: 오늘 바로 라이브 배포 완료 + 남녀 성비 5:5 균형을 유지하며 초기 1,000명 베타 유저 확보

---

## STEP 1. 오늘 바로 끝내는 배포 체크리스트 (소요 시간: 5분)

### 1) Supabase SQL 패치 실행 (아직 안 하셨다면 1회 실행)
**[Supabase Dashboard → SQL Editor]** 에서 아래 쿼리를 붙여넣고 `Run`을 클릭합니다.
```sql
-- 1. 실제 매칭 상대방의 닉네임이 보이도록 users 조회 정책 업데이트
drop policy if exists "Users can view own profile" on public.users;
drop policy if exists "Authenticated users can view profiles" on public.users;
create policy "Authenticated users can view profiles"
  on public.users for select
  to authenticated
  using (true);

-- 2. 관문 질문 어드민 추가/수정 정책
drop policy if exists "Anyone can view active gatekeeper questions" on public.gatekeeper_questions;
drop policy if exists "Anyone can view gatekeeper questions" on public.gatekeeper_questions;
create policy "Anyone can view gatekeeper questions"
  on public.gatekeeper_questions for select
  using (true);

create policy "Authenticated users can insert gatekeeper questions"
  on public.gatekeeper_questions for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update gatekeeper questions"
  on public.gatekeeper_questions for update
  to authenticated
  using (true);

-- 3. 1,000명 규모 고속 조회 인덱스 생성
create index if not exists idx_responses_user_responded on public.responses (user_id, responded_at desc);
create index if not exists idx_analysis_reports_user_created on public.analysis_reports (user_id, created_at desc);
create index if not exists idx_matches_user_a_status on public.matches (user_a_id, status);
create index if not exists idx_matches_user_b_status on public.matches (user_b_id, status);
create index if not exists idx_messages_match_created on public.messages (match_id, created_at asc);
```

### 2) Vercel 환경변수(Environment Variables) 최종 확인
**[Vercel Dashboard → 프로젝트 선택 → Settings → Environment Variables]** 에 아래 값들이 들어가 있는지 확인합니다.
- `NEXT_PUBLIC_SUPABASE_URL`: `https://oleijbhiqhqmcunzdlbr.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `.env.local`의 Anon Key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase 대시보드 → `Project Settings` → `API` → `service_role (secret)` 키 *(자동 매칭 스케줄러 및 어드민 전체 매칭에 필수!)*
- `ANTHROPIC_API_KEY`: `.env.local`의 Claude API Key
- `NEXT_PUBLIC_ADMIN_EMAIL`: 대표님이 가입하실 관리자 이메일 주소 (예: `admin@resonance.com` 또는 본인 이메일)

### 3) 관리자(`/admin`) 초기 세팅
1. 배포된 사이트에서 `NEXT_PUBLIC_ADMIN_EMAIL`로 지정한 이메일로 회원가입합니다.
2. `https://배포주소/admin` 으로 접속합니다.
3. **`⚖️ 관문 밸런스 질문`** 탭에서 **`✨ 최신 연애 트렌드 질문 일괄 추가`** 버튼을 한 번 눌러 최신 밸런스 질문 풀을 활성화합니다.

---

## STEP 2. 남녀 성비 5:5 & 초기 1,000명 모으는 실전 운영 공식

### 💡 핵심 운영 원칙: "평일엔 리포트 바이럴, 주말(금/일 밤 9시)엔 단체 공명 매칭!"
초기에 가입자가 10명뿐일 때 매칭을 돌리면 조건이 안 맞거나 기다리다 지칩니다.
1. **월~금요일**: 질문 3개 답하고 **'내 첫 AI 내면 페르소나 리포트 카드'**를 받아 인스타/쓰레드에 자랑하게 만듭니다.
2. **성비 모니터링**: `/admin` 상단의 **실시간 성비 밸런스 게이지(남성 % vs 여성 %)**를 확인합니다.
   - 만약 **남성이 60% 이상**으로 치우치면 → 아래 **[원고 1: 쓰레드/인스타 감성 리포트 타겟]**을 더 게시해 여성 유입을 늘립니다.
   - 만약 **여성이 60% 이상**으로 치우치면 → 아래 **[원고 2: 블라인드/직장인 커뮤니티 타겟]**을 게시해 남성 유입을 늘립니다.
3. **금요일/일요일 밤 9시 정각**: `/admin`에서 **`⚡ 지금 즉시 공명 매칭 실행`** 버튼을 눌러 모인 대기열을 한 번에 매칭시킵니다!

---

## STEP 3. 채널별 복사-붙여넣기용 바이럴 홍보 원고 5종

아래 원고에서 `[서비스 링크]` 부분만 실제 Vercel 배포 도메인으로 바꿔서 그대로 복사해 게시하시면 됩니다.

---

### 🌸 [원고 1] 쓰레드(Threads) / 인스타그램 / 블로그용 (여성 유저 유입 핵심!)
> **특징**: '소개팅 앱'이라는 단어를 앞세우지 않고 **'AI 내면 심리 리포트'**를 후킹 포인트로 삼아 여성 유입률과 스토리 공유율을 극대화합니다.

```text
요즘 내 마음이 어떤 상태인지, 내가 어떤 사람에게 끌리는지 궁금해서 해본 AI 내면 분석 서비스인데 문장이 너무 따뜻해서 위로받았어요 😭

얼굴이나 스펙 적는 거 하나도 없고,
그냥 나한테 던져주는 짧은 질문 3개에 일기처럼 답하면
AI가 내 무의식과 감정의 결을 읽어서 '내면 페르소나 리포트'를 편지처럼 써줘요.

저는 "조용히 빛나는 감정의 결을 가진 사람"이라고 나왔는데,
내가 쓴 문장 속 단어들을 짚어주면서 왜 내가 그동안 인간관계에서 피로했는지 딱 맞춰서 소름 돋았어요..

신기한 건 이 리포트를 바탕으로 나랑 내면 주파수가 90% 이상 겹치는 사람이 나타나면
'짜장 vs 짬뽕' 같은 가벼운 밸런스 관문을 통과했을 때만 익명 대화가 열린다는 점!
내가 쓴 일기 원본은 절대 남한테 공개 안 된대요 🔒

질문 3개 답하는 데 3분도 안 걸리니까 본인 내면 페르소나 뭐 나오는지 꼭 해보세요 ✨
👉 [서비스 링크]
```

---

### 💼 [원고 2] 직장인 블라인드(Blind) / 커리어·연애 게시판용 (진정성 있는 남녀 타겟)
> **특징**: 기존 데이팅 앱의 '스와이프 피로감', '과금 유도', '외모/스펙 품평회'에 지친 2030 직장인을 타겟팅합니다.

```text
제목: 얼굴/스펙 품평회 같은 소개팅 앱 지쳐서 만든 '글과 가치관'으로만 만나는 AI 매칭 웹앱 (베타 오픈)

본문:
기존 소개팅 앱들의 끝없는 사진 넘기기(스와이프)와 유령 회원, 피로한 조건 비교에 지쳐서
'진짜 대화가 통하고 내면의 결이 비슷한 사람'만 연결해주는 서비스를 직접 만들었습니다.

이름은 RESONANCE(레조넌스)입니다.

[기존 앱들과 완전히 다른 3가지]
1. 사진 평가나 30분짜리 딱딱한 설문조사가 없습니다.
   하루 1분, 나에게 던져지는 질문 3개에 짧은 일기처럼 답하면 끝납니다.
   (작성한 일기 원본은 타인에게 절대 공개되지 않습니다.)

2. 매칭 전에도 '나만의 AI 심리 분석 리포트'를 먼저 받습니다.
   Claude AI가 내가 쓴 문장들의 감정선과 연애 가치관을 분석해 리포트로 정리해 줍니다.

3. 어색한 첫인사 대신 '5문항 밸런스 관문'으로 시작합니다.
   AI가 내면 리포트 공명 지수가 높은 상대를 찾아주면,
   '칼답 vs 여유 답장', '그날 바로 대화 vs 생각 정리 후 대화' 같은 5가지 밸런스 게임에서 4개 이상 통했을 때만 채팅방이 열립니다.

현재 11월 베타 기간이라 모든 기능 100% 무료이고 광고도 일절 없습니다.
가벼운 만남 말고, 진짜 결이 맞는 사람과 대화해보고 싶은 분들 와서 첫 리포트 받아보세요!

👉 [서비스 링크]
(써보시고 불편한 점이나 피드백 댓글로 남겨주시면 바로바로 반영하겠습니다!)
```

---

### 🎓 [원고 3] 에브리타임(대학생) / 20대 커뮤니티용 (가볍고 트렌디한 바이럴)

```text
제목: 질문 3개 답하면 AI가 내 연애 페르소나 분석해주고 결 맞는 사람 매칭해주는 사이트 ㅋㅋㅋ

본문:
MBTI보다 훨씬 정확한 듯..
질문 3개에 평소 내 생각 적으면 AI가 내 내면 리포트 써주는데
결과 카드로 저장해서 인스타 스토리에 올릴 수도 있음!

리포트 나오고 나면 나랑 가치관 공명 지수 제일 높은 이성 매칭해주는데,
바로 채팅 열리는 게 아니라
둘이 밸런스 게임(연락 칼답 vs 여유, 핫플 웨이팅 vs 조용한 식당 등) 5문제 중 4개 이상 똑같이 골라야만 채팅방 열림 ㅋㅋㅋㅋ

설치 필요 없이 웹에서 바로 됨! 다들 본인은 무슨 페르소나 나오는지 해봐
👉 [서비스 링크]
```

---

### 💬 [원고 4] 카카오톡 지인 / 단톡방 초기 시드 유저(첫 50명) 모집용

```text
내가 이번에 '스와이프 없이 AI가 내면 일기를 분석해서 결 맞는 사람을 연결해주는 서비스(RESONANCE)' 베타를 오픈했어! 🎉

가입하고 짧은 질문 3개만 답하면 AI가 네 성향이랑 내면 페르소나를 편지처럼 분석해 주는데,
3분이면 결과 카드까지 바로 나와! (인스타 스토리 공유용 이미지도 저장됨 ✨)

지금 초기 베타 테스터 모으고 있어서, 시간 될 때 한 번 들어가서 첫 리포트 받아보고 솔직한 후기 알려주면 진짜 고마울 것 같아 🙏
👉 [서비스 링크]
```
