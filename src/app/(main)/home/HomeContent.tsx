'use client';

import Link from 'next/link';
import type { DailyQuestion } from '@/types';

interface HomeContentProps {
    nickname: string;
    todayQuestion: DailyQuestion | null;
    hasRespondedToday: boolean;
}

export default function HomeContent({
    nickname,
    todayQuestion,
    hasRespondedToday,
}: HomeContentProps) {
    // 시간대별 인사말
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 6) return '좋은 새벽이에요';
        if (hour < 12) return '좋은 아침이에요';
        if (hour < 18) return '좋은 오후예요';
        return '좋은 저녁이에요';
    };

    // 카테고리별 아이콘
    const getCategoryEmoji = (category: string) => {
        switch (category) {
            case 'emotion': return '💭';
            case 'relationship': return '💕';
            case 'space': return '🌿';
            case 'time': return '⏳';
            default: return '✨';
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)] px-6 py-8">
            <div className="max-w-lg mx-auto">
                {/* 인사 헤더 */}
                <div className="mb-10 animate-fade-in">
                    <p className="text-sm text-[var(--color-text-secondary)] mb-1">
                        {getGreeting()}
                    </p>
                    <h1 className="text-2xl font-bold text-[var(--color-text)]">
                        {nickname}님 ✨
                    </h1>
                </div>

                {/* 오늘의 질문 카드 */}
                {todayQuestion && (
                    <div className="animate-slide-up mb-6">
                        <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-lg">
                                    {getCategoryEmoji(todayQuestion.category)}
                                </span>
                                <span className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                                    오늘의 질문
                                </span>
                            </div>

                            <p className="text-lg font-medium text-[var(--color-text)] leading-relaxed mb-6">
                                {todayQuestion.question_text}
                            </p>

                            {hasRespondedToday ? (
                                <div className="flex items-center gap-2 py-3 px-4 rounded-xl bg-green-50 border border-green-100">
                                    <span className="text-green-600 text-sm">✓</span>
                                    <p className="text-sm text-green-700 font-medium">
                                        오늘의 답변을 완료했어요
                                    </p>
                                </div>
                            ) : (
                                <Link
                                    href={`/question?id=${todayQuestion.id}`}
                                    className="block w-full py-4 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white text-center font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                                >
                                    답변하기
                                </Link>
                            )}
                        </div>
                    </div>
                )}

                {/* 퀵 메뉴 */}
                <div className="grid grid-cols-3 gap-3 animate-slide-up">
                    <Link
                        href="/match"
                        className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary-light)] hover:shadow-sm transition-all duration-200 text-center"
                    >
                        <span className="text-2xl block mb-2">🔮</span>
                        <p className="text-sm font-semibold text-[var(--color-text)]">
                            새로운 공명
                        </p>
                    </Link>

                    <Link
                        href="/history"
                        className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary-light)] hover:shadow-sm transition-all duration-200 text-center"
                    >
                        <span className="text-2xl block mb-2">📖</span>
                        <p className="text-sm font-semibold text-[var(--color-text)]">
                            내 기록
                        </p>
                    </Link>

                    <Link
                        href="/report"
                        className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary-light)] hover:shadow-sm transition-all duration-200 text-center"
                    >
                        <span className="text-2xl block mb-2">✨</span>
                        <p className="text-sm font-semibold text-[var(--color-text)]">
                            주간 리포트
                        </p>
                    </Link>
                </div>

                {/* 하단 장식 */}
                <div className="mt-12 text-center">
                    <p className="text-xs text-[var(--color-text-light)]">
                        매일의 질문이 당신을 더 깊이 알게 해줄 거예요
                    </p>
                </div>
            </div>
        </div>
    );
}
