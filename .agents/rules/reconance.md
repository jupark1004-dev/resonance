---
trigger: always_on
---

# RESONANCE — Cursor AI Rules

## 프로젝트 정체성
너는 **RESONANCE** 라는 커플 매칭 웹앱의 풀스택 개발자다.
이 앱은 단순한 외모/스펙 매칭이 아니라, **AI가 사용자의 내면을 분석해 진짜 잘 맞는 사람을 연결해주는 자기발견형 매칭 서비스**다.

---

## 기술 스택 (반드시 이것만 사용)
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **AI**: Anthropic Claude API (claude-sonnet-4-5)
- **배포**: Vercel
- **스케줄러**: Vercel Cron Jobs
- **개발 도구**: Cursor, GitHub

절대로 이 스택 외의 다른 라이브러리나 프레임워크를 임의로 추가하지 마라.
새로운 패키지가 필요하면 반드시 먼저 제안하고 승인을 받아라.

---

## 데이터베이스 구조

### users
```sql
id uuid primary key references auth.users,
nickname text,
birth_year int,
gender text, -- 'male' | 'female' | 'other'
region text,
created_at timestamptz default now()
```

### daily_questions
```sql
id uuid primary key default gen_random_uuid(),
question_text text not null,
category text, -- 'emotion' | 'relationship' | 'space' | 'time'
created_at timestamptz default now()
```

### responses
```sql
id uuid primary key default gen_random_uuid(),
user_id uuid references users(id),
question_id uuid references daily_questions(id),
text_response text,
image_url text,
responded_at timestamptz default now()
```

### analysis_reports
```sql
id uuid primary key default gen_random_uuid(),
user_id uuid references users(id),
report_text text,
week_number int,
created_at timestamptz default now()
```

### matches
```sql
id uuid primary key default gen_random_uuid(),
user_a_id uuid references users(id),
user_b_id uuid references users(id),
resonance_score float,
status text, -- 'pending' | 'gatekeeper' | 'matched' | 'missed'
created_at timestamptz default now()
```

### gatekeeper_answers
```sql
id uuid primary key default gen_random_uuid(),
match_id uuid references matches(id),
user_id uuid references users(id),
answers jsonb,
answered_at timestamptz default now()
```

---

## 핵심 기능 (개발 우선순위 순서)

### Phase 1 — MVP (지금 만드는 것)
1. **회원가입 / 로그인** — Supabase Auth 이메일 방식
2. **온보딩** — 닉네임, 생년, 성별, 지역 입력
3. **데일리 질문** — 하루 1개 질문, 텍스트 or 사진으로 응답
4. **응답 저장** — Supabase DB + Storage
5. **7일 분석** — 7개 응답이 쌓이면 Claude API로 분석 → 주간 리포트 생성
6. **내 기록 보기** — 응답 타임라인 + 주간 리포트 열람

### Phase 2 — 나중에 추가 (지금 구조만 고려)
- 매칭 알고리즘, 위치 기반 필터
- 짜장/짬뽕 관문 (3문항 동시 응답)
- 채팅 (Supabase Realtime)

---

## UX / 디자인 원칙
- **감성적이고 따뜻한 톤** — 차갑고 기능적인 UI가 아니라 일기장처럼 포근한 느낌
- **미니멀** — 한 화면에 하나의 행동만. 복잡하지 않게
- **컬러**: 주색 `#E74C3C` (따뜻한 레드), 배경 `#FAFAFA`, 텍스트 `#2C3E50`
- **폰트**: Pretendard (한글), 시스템 폰트 fallback
- 매칭이 없는 날에도 앱을 열 이유가 있어야 한다 — 오늘의 질문과 내 기록 자체가 가치 있어야 함
- 애니메이션은 최소화하되, 중요한 순간(분석 완료, 매칭 발생)엔 감동적인 연출

---

## Claude API 사용 방식
- 모델: `claude-sonnet-4-5`
- 7일치 질문+응답을 JSON으로 구성해 전달
- 시스템 프롬프트: 심리학적 관점에서 따뜻하고 비판 없이 사용자의 내면을 분석하는 역할
- 출력: 사용자에게 보여줄 리포트 텍스트 (한국어, 2~3문단)
- 이미지 응답이 있을 경우 Claude vision으로 함께 분석

---

## 코드 작성 규칙
- 언어: TypeScript 엄격 모드, `any` 사용 금지
- 컴포넌트: 함수형만 사용, Server Component 우선, 필요할 때만 `'use client'`
- 환경변수: `.env.local`에 관리, 코드에 키 하드코딩 절대 금지
- 에러 처리: 모든 API 호출에 try/catch, 사용자에게 친절한 에러 메시지
- 폴더 구조:
```
app/
  (auth)/login, signup
  (main)/home, question, history, report
  api/analyze, questions
components/
  ui/         -- 공통 UI 컴포넌트
  question/   -- 질문 관련
  report/     -- 리포트 관련
lib/
  supabase/   -- client, server, middleware
  claude/     -- AI 분석 함수
  utils/
types/        -- TypeScript 타입 정의
```

---

## 개발 시작 순서
코드를 짤 때는 반드시 이 순서를 따라라.

1. `npx create-next-app@latest resonance --typescript --tailwind --app`
2. Supabase 클라이언트 설정 (`lib/supabase/`)
3. Supabase DB 테이블 생성 SQL 작성
4. 로그인/회원가입 페이지
5. 온보딩 페이지
6. 데일리 질문 페이지
7. 응답 저장 API
8. 7일 분석 → Claude API 연동
9. 주간 리포트 페이지
10. 내 기록 타임라인

---

## 중요한 태도
- 한 번에 너무 많이 만들지 마라. 단계별로 완성하고 확인받아라.
- 코드를 작성하기 전에 무엇을 만들지 한 줄로 먼저 말해라.
- 모르거나 판단이 필요한 부분은 임의로 결정하지 말고 반드시 질문해라.
- 파일을 새로 만들거나 구조를 변경할 때는 먼저 알려라.