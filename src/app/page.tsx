import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] selection:bg-[var(--color-primary-subtle)] selection:text-[var(--color-primary)]">
      {/* 상단 네비게이션 바 */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-[var(--color-background)]/80 border-b border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center shadow-sm">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <circle cx="12" cy="12" r="7" opacity="0.6" />
                <circle cx="12" cy="12" r="11" opacity="0.3" />
              </svg>
            </div>
            <span className="font-bold tracking-tight text-lg text-[var(--color-text)]">
              RESONANCE
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
              BETA
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors px-3 py-1.5"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold px-4 py-2 rounded-full bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] transition-colors shadow-sm"
            >
              시작하기
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-14 pb-24">
        {/* 1. 히어로 섹션 */}
        <section className="text-center max-w-2xl mx-auto mb-20 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-primary-subtle)] border border-[var(--color-primary)]/15 text-[var(--color-primary)] text-xs font-semibold mb-6">
            <span>✦</span>
            <span>스와이프 없는 자기발견형 AI 내면 매칭</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.25] mb-6 text-[var(--color-text)]">
            나를 가장 깊이 이해한 날,
            <br />
            <span className="text-[var(--color-primary)]">결이 같은 사람</span>을 만납니다
          </h1>

          <p className="text-base sm:text-lg text-[var(--color-text-secondary)] leading-relaxed mb-10 max-w-lg mx-auto">
            사진과 스펙을 넘기던 피로한 손끝을 멈춰보세요.
            <br />
            매일 도착하는 하나의 질문에 답하며 나를 발견하면,
            <br />
            AI가 당신의 내면 주파수와 공명하는 단 한 사람을 찾아드립니다.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <Link
              href="/signup"
              className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white text-center font-semibold text-base shadow-md hover:shadow-lg hover:scale-[1.01] transition-all duration-200"
            >
              내 첫 내면 리포트 받아보기
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto py-4 px-6 rounded-2xl bg-[var(--color-surface)] text-[var(--color-text)] text-center font-semibold text-base border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all duration-200"
            >
              이미 계정이 있어요
            </Link>
          </div>

          <p className="mt-4 text-xs text-[var(--color-text-light)]">
            🔒 작성한 일기 원본은 타인에게 절대 공개되지 않으며, 오직 AI 내면 분석에만 사용됩니다.
          </p>
        </section>

        {/* 2. 실제 서비스 화면 미리보기 (질문 카드 -> AI 리포트 -> 공명 매칭) */}
        <section className="mb-24 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* 왼쪽: 오늘의 질문 & 기록 미리보기 */}
            <div className="p-6 sm:p-7 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                    <span>💭</span> STEP 1 · 오늘의 질문 기록
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-background)] text-[var(--color-text-secondary)]">
                    하루 1분 일기
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] mb-4">
                  <p className="text-xs text-[var(--color-primary)] font-semibold mb-1.5">
                    Q. 감정의 결
                  </p>
                  <p className="text-base font-semibold text-[var(--color-text)] leading-relaxed">
                    &ldquo;오늘 하루 중 가장 마음이 따뜻해진 순간은 언제였나요?&rdquo;
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--color-primary-subtle)]/40 border border-[var(--color-primary)]/10">
                  <p className="text-xs text-[var(--color-text-secondary)] mb-1">
                    나의 기록
                  </p>
                  <p className="text-sm text-[var(--color-text)] leading-relaxed">
                    퇴근길 버스 창가에 노을이 비치는데, 이어폰에서 좋아하는 잔잔한 기타 연주곡이 흘러나왔을 때요. 유독 오늘따라 작은 풍경이 큰 위로가 됐어요.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                <span>첫 3개의 기록이 모이면 즉시 분석 시작</span>
                <span className="font-semibold text-[var(--color-primary)]">3 / 3 달성 ✨</span>
              </div>
            </div>

            {/* 오른쪽: AI 내면 리포트 & 공명 매칭 미리보기 */}
            <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[var(--color-surface)] via-[var(--color-surface)] to-[var(--color-primary-subtle)]/50 border border-[var(--color-primary)]/20 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)] uppercase tracking-wider">
                    <span>🔮</span> STEP 2 · AI 내면 리포트 & 공명
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
                    공명 지수 94%
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] mb-4">
                  <p className="text-xs text-[var(--color-text-light)] text-center mb-1">
                    AI가 발견한 당신의 내면 페르소나
                  </p>
                  <p className="text-base font-bold text-[var(--color-primary)] text-center mb-3">
                    &ldquo;조용히 빛나는 감정의 결을 가진 사람&rdquo;
                  </p>
                  <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    무거운 하루들 사이에서도 작은 풍경과 음악에 마음을 기울이는 당신의 다정함이 문장마다 배어 있습니다. 말로 다 표현하지 않아도 곁에 있는 것만으로 소리 없는 위안이 되는 분이에요.
                  </p>
                </div>

                {/* 매칭 & 관문 배지 */}
                <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-text)]">
                      나와 같은 온도차를 가진 상대와 연결됨
                    </p>
                    <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                      3문항 취향 관문(산 vs 바다, 짜장 vs 짬뽕) 통과 시 채팅 오픈
                    </p>
                  </div>
                  <span className="text-xl">💌</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                <span>✦ Claude 심리 분석 엔진 기반</span>
                <span>매주 깊어지는 리포트</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. 왜 RESONANCE인가요? (기존 소개팅 앱과의 차이) */}
        <section className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)] mb-3">
              기존 데이팅 앱의 피로감, 이렇게 바꿨습니다
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              꾸며낸 30분짜리 AI 면접도, 가벼운 사진 넘기기도 아닌 가장 진솔한 연결 방식
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-subtle)] text-[var(--color-primary)] flex items-center justify-center text-lg mb-4">
                📖
              </div>
              <h3 className="text-base font-bold text-[var(--color-text)] mb-2">
                면접이 아닌 나만의 일기장
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                잘 보이기 위해 꾸며내는 자기소개서 대신, 하루 한 문장 솔직한 내 마음을 기록하며 먼저 나 자신을 알아갑니다.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-subtle)] text-[var(--color-primary)] flex items-center justify-center text-lg mb-4">
                ✨
              </div>
              <h3 className="text-base font-bold text-[var(--color-text)] mb-2">
                매칭 전에도 가치 있는 시간
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                매칭만을 기다리며 감정을 소모하지 마세요. AI가 써 내려간 나의 심리 분석 리포트 자체가 매주의 따뜻한 선물이 됩니다.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-subtle)] text-[var(--color-primary)] flex items-center justify-center text-lg mb-4">
                🎯
              </div>
              <h3 className="text-base font-bold text-[var(--color-text)] mb-2">
                유쾌한 3문항 관문과 대화
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                깊은 내면이 통했다면, 어색한 첫인사 대신 &lsquo;짜장 vs 짬뽕&rsquo; 같은 3문항 동시 선택 관문으로 기분 좋게 대화를 시작합니다.
              </p>
            </div>
          </div>
        </section>

        {/* 4. 하단 시작 배너 */}
        <section className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] text-white text-center shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            오늘, 당신의 첫 번째 질문이 기다리고 있어요
          </h2>
          <p className="text-sm sm:text-base text-white/90 mb-8 max-w-md mx-auto leading-relaxed">
            단 3개의 질문에 답하면 당신의 첫 번째 내면 리포트와
            <br />
            공명 매칭 자격이 즉시 열립니다.
          </p>
          <Link
            href="/signup"
            className="inline-block py-4 px-8 rounded-2xl bg-white text-[var(--color-primary)] font-bold text-base shadow-md hover:scale-[1.02] transition-all duration-200"
          >
            무료로 베타 시작하기 →
          </Link>
        </section>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-[var(--color-border)] py-8 px-6 text-center text-xs text-[var(--color-text-light)]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 RESONANCE. 내면이 공명하는 만남.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-[var(--color-text-secondary)] transition-colors">
              이용약관
            </Link>
            <Link href="/privacy" className="hover:text-[var(--color-text-secondary)] transition-colors">
              개인정보처리방침
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

