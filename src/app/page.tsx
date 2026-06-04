import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[var(--color-background)]">
      {/* 로고 & 타이틀 */}
      <div className="animate-fade-in text-center mb-12">
        {/* 공명 아이콘 */}
        <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center shadow-lg">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <circle cx="12" cy="12" r="7" opacity="0.6" />
            <circle cx="12" cy="12" r="11" opacity="0.3" />
          </svg>
        </div>

        <h1 className="text-4xl font-bold text-[var(--color-text)] tracking-tight mb-3">
          RESONANCE
        </h1>
        <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed max-w-sm mx-auto">
          내면이 공명하는 만남
        </p>
      </div>

      {/* 설명 텍스트 */}
      <div className="animate-slide-up text-center mb-12 max-w-md">
        <p className="text-[var(--color-text-secondary)] text-sm leading-7">
          매일 하나의 질문에 답하며
          <br />
          나도 몰랐던 나를 발견하고,
          <br />
          진짜 잘 맞는 사람을 만나보세요.
        </p>
      </div>

      {/* CTA 버튼 */}
      <div className="animate-slide-up flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/signup"
          className="w-full py-4 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white text-center font-semibold text-base shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
        >
          시작하기
        </Link>
        <Link
          href="/login"
          className="w-full py-4 rounded-xl bg-[var(--color-surface)] text-[var(--color-text)] text-center font-semibold text-base border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all duration-200"
        >
          이미 계정이 있어요
        </Link>
      </div>

      {/* 하단 장식 */}
      <p className="absolute bottom-8 text-xs text-[var(--color-text-light)]">
        당신의 내면을 탐험하는 여정이 시작됩니다
      </p>
    </div>
  );
}
