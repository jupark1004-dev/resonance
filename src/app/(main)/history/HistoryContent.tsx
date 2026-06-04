'use client';

import Link from 'next/link';
import type { DailyQuestion } from '@/types';

interface ResponseWithQuestion {
    id: string;
    user_id: string;
    question_id: string;
    text_response: string | null;
    image_url: string | null;
    responded_at: string;
    question: DailyQuestion;
}

interface HistoryContentProps {
    responses: ResponseWithQuestion[];
}

export default function HistoryContent({ responses }: HistoryContentProps) {
    // 카테고리별 이모지
    const getCategoryEmoji = (category: string) => {
        switch (category) {
            case 'emotion': return '💭';
            case 'relationship': return '💕';
            case 'space': return '🌿';
            case 'time': return '⏳';
            default: return '✨';
        }
    };

    // 날짜 포맷
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
        const weekday = weekdays[date.getDay()];
        return `${month}월 ${day}일 (${weekday})`;
    };

    // 날짜별 그룹핑
    const groupedByDate = responses.reduce<Record<string, ResponseWithQuestion[]>>(
        (acc, response) => {
            const dateKey = new Date(response.responded_at).toDateString();
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(response);
            return acc;
        },
        {}
    );

    return (
        <div className="min-h-screen bg-[var(--color-background)] px-6 py-8">
            <div className="max-w-lg mx-auto">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-8 animate-fade-in">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--color-text)]">내 기록</h1>
                        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                            {responses.length}개의 이야기가 쌓여있어요
                        </p>
                    </div>
                    <Link
                        href="/home"
                        className="w-10 h-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center hover:border-[var(--color-primary-light)] transition-colors"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                    </Link>
                </div>

                {/* 비어있을 때 */}
                {responses.length === 0 && (
                    <div className="text-center py-20 animate-fade-in">
                        <span className="text-5xl block mb-4">📝</span>
                        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">
                            아직 기록이 없어요
                        </h2>
                        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                            오늘의 질문에 답해보세요!
                        </p>
                        <Link
                            href="/home"
                            className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200"
                        >
                            질문 보러가기
                        </Link>
                    </div>
                )}

                {/* 타임라인 */}
                <div className="space-y-8 animate-slide-up">
                    {Object.entries(groupedByDate).map(([dateKey, dateResponses]) => (
                        <div key={dateKey}>
                            {/* 날짜 헤더 */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
                                <span className="text-sm font-semibold text-[var(--color-text)]">
                                    {formatDate(dateResponses[0].responded_at)}
                                </span>
                                <div className="flex-1 h-px bg-[var(--color-border)]" />
                            </div>

                            {/* 응답 카드 */}
                            <div className="space-y-3 pl-5">
                                {dateResponses.map((response) => (
                                    <div
                                        key={response.id}
                                        className="p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:shadow-sm transition-all duration-200"
                                    >
                                        {/* 질문 */}
                                        <div className="flex items-start gap-2 mb-3">
                                            <span className="text-sm shrink-0">
                                                {getCategoryEmoji(response.question.category)}
                                            </span>
                                            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                                                {response.question.question_text}
                                            </p>
                                        </div>

                                        {/* 구분선 */}
                                        <div className="h-px bg-[var(--color-border)] my-3" />

                                        {/* 텍스트 응답 */}
                                        {response.text_response && (
                                            <p className="text-[var(--color-text)] leading-relaxed text-sm">
                                                {response.text_response}
                                            </p>
                                        )}

                                        {/* 이미지 응답 */}
                                        {response.image_url && (
                                            <div className="mt-3 rounded-lg overflow-hidden">
                                                <img
                                                    src={response.image_url}
                                                    alt="응답 이미지"
                                                    className="w-full h-40 object-cover"
                                                    loading="lazy"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
