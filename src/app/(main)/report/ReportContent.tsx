'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { AnalysisReport, DailyQuestion } from '@/types';

interface WeekResponse {
    id: string;
    text_response: string | null;
    image_url: string | null;
    responded_at: string;
    question: DailyQuestion | null;
}

interface ReportWithImages extends AnalysisReport {
    weekResponses: WeekResponse[];
}

interface ReportContentProps {
    reports: ReportWithImages[];
    unanalyzedCount: number;
}

export default function ReportContent({ reports, unanalyzedCount }: ReportContentProps) {
    const router = useRouter();
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(
        reports[0]?.id ?? null
    );

    // 분석 요청
    const handleAnalyze = async () => {
        setError('');
        setAnalyzing(true);

        try {
            const res = await fetch('/api/analyze', { method: 'POST' });
            const data = await res.json();

            if (!data.success) {
                setError(data.error);
                return;
            }

            // 새 리포트가 생성되면 페이지 새로고침
            router.refresh();
        } catch {
            setError('분석 요청 중 오류가 발생했습니다.');
        } finally {
            setAnalyzing(false);
        }
    };

    // 날짜 포맷
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    };

    // 카테고리 이모지
    const getCategoryEmoji = (category: string) => {
        switch (category) {
            case 'emotion': return '💭';
            case 'relationship': return '💕';
            case 'space': return '🌿';
            case 'time': return '⏳';
            default: return '✨';
        }
    };

    // 리포트 텍스트에서 **볼드** 구문을 파싱
    const renderReportText = (text: string) => {
        return text.split('\n').filter(p => p.trim()).map((paragraph, i) => {
            // **텍스트** 패턴을 감지하여 볼드 처리
            const parts = paragraph.split(/(\*\*[^*]+\*\*)/g);
            return (
                <p
                    key={i}
                    className="text-sm text-[var(--color-text)] leading-[1.8] mb-4 last:mb-0"
                    style={{ animationDelay: `${i * 0.15}s` }}
                >
                    {parts.map((part, j) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return (
                                <span
                                    key={j}
                                    className="block text-center text-base font-bold text-[var(--color-primary)] mb-4 mt-1"
                                >
                                    {part.slice(2, -2)}
                                </span>
                            );
                        }
                        return <span key={j}>{part}</span>;
                    })}
                </p>
            );
        });
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)] px-6 py-8">
            <div className="max-w-lg mx-auto">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-8 animate-fade-in">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--color-text)]">주간 리포트</h1>
                        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                            AI가 분석한 나의 내면 이야기
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

                {/* 분석 가능 알림 */}
                {unanalyzedCount >= 7 && (
                    <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-[var(--color-primary-subtle)] to-white border border-[var(--color-primary)]/20 animate-slide-up">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center shrink-0">
                                <span className="text-white text-lg">🔮</span>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-[var(--color-text)]">
                                    새로운 분석이 준비되었어요!
                                </p>
                                <p className="text-xs text-[var(--color-text-secondary)]">
                                    {unanalyzedCount}개의 응답을 분석할 수 있어요
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleAnalyze}
                            disabled={analyzing}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--color-primary)] via-[#ff8a8a] to-[var(--color-primary)] bg-[length:200%_auto] text-white font-semibold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 animate-shimmer"
                        >
                            {analyzing ? (
                                <span className="animate-pulse-soft">AI가 분석 중이에요... ✨</span>
                            ) : (
                                '주간 리포트 생성하기'
                            )}
                        </button>
                    </div>
                )}

                {/* 아직 분석 불가 */}
                {unanalyzedCount < 7 && unanalyzedCount > 0 && (
                    <div className="mb-6 p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] animate-fade-in">
                        <p className="text-sm text-[var(--color-text-secondary)] text-center">
                            다음 분석까지{' '}
                            <span className="font-bold text-[var(--color-primary)]">
                                {7 - unanalyzedCount}
                            </span>
                            개의 답변이 더 필요해요
                        </p>
                        {/* 진행 바 */}
                        <div className="mt-3 h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] transition-all duration-500"
                                style={{ width: `${(unanalyzedCount / 7) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* 에러 */}
                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100">
                        <p className="text-sm text-[var(--color-error)]">{error}</p>
                    </div>
                )}

                {/* 리포트 목록 */}
                {reports.length === 0 ? (
                    <div className="text-center py-20 animate-fade-in">
                        <span className="text-5xl block mb-4">🔮</span>
                        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">
                            아직 리포트가 없어요
                        </h2>
                        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                            7일간 질문에 답하면
                            <br />
                            AI가 당신의 내면을 분석해 드려요
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4 animate-slide-up">
                        {reports.map((report) => {
                            const weekImages = report.weekResponses
                                .filter((r) => r.image_url)
                                .map((r) => ({
                                    url: r.image_url as string,
                                    date: r.responded_at,
                                    question: r.question?.question_text ?? '',
                                }));

                            return (
                                <div
                                    key={report.id}
                                    className="rounded-2xl bg-gradient-to-br from-white to-[var(--color-primary-subtle)]/40 border border-[var(--color-border)] overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                                >
                                    {/* 리포트 헤더 */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setExpandedId(expandedId === report.id ? null : report.id)
                                        }
                                        className="w-full p-5 flex items-center justify-between text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary-subtle)] to-white flex items-center justify-center border border-[var(--color-primary)]/10">
                                                <span className="text-sm font-bold text-[var(--color-primary)]">
                                                    {report.week_number}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-[var(--color-text)]">
                                                    {report.week_number}주차 리포트
                                                </p>
                                                <p className="text-xs text-[var(--color-text-light)]">
                                                    {formatDate(report.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            className={`text-[var(--color-text-light)] transition-transform duration-200 ${expandedId === report.id ? 'rotate-180' : ''
                                                }`}
                                        >
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </button>

                                    {/* 리포트 내용 (확장) */}
                                    {expandedId === report.id && (
                                        <div className="border-t border-[var(--color-border)]">
                                            {/* ===== 이미지 갤러리 (사용자가 올린 이미지) ===== */}
                                            {weekImages.length > 0 && (
                                                <div className="px-5 pt-5">
                                                    <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <rect x="3" y="3" width="18" height="18" rx="2" />
                                                            <circle cx="8.5" cy="8.5" r="1.5" />
                                                            <path d="M21 15l-5-5L5 21" />
                                                        </svg>
                                                        이번 주의 순간들
                                                    </p>
                                                    <div className={`grid gap-2 mb-4 ${weekImages.length === 1 ? 'grid-cols-1' : weekImages.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                                        {weekImages.map((img, i) => (
                                                            <div
                                                                key={i}
                                                                className="relative group rounded-xl overflow-hidden aspect-square animate-fade-in"
                                                                style={{ animationDelay: `${i * 0.1}s` }}
                                                            >
                                                                <img
                                                                    src={img.url}
                                                                    alt={img.question}
                                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                                />
                                                                {/* 호버 시 질문 표시 */}
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2">
                                                                    <p className="text-[10px] text-white/90 leading-tight line-clamp-2">
                                                                        {img.question}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* ===== 주간 응답 미니 타임라인 ===== */}
                                            <div className="px-5 pt-3 pb-2">
                                                <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M12 20V10M18 20V4M6 20v-4" />
                                                    </svg>
                                                    일주일의 기록
                                                </p>
                                                <div className="flex gap-1.5 mb-4">
                                                    {report.weekResponses.slice(0, 7).map((resp, i) => (
                                                        <div
                                                            key={i}
                                                            className="flex-1 group relative"
                                                        >
                                                            <div
                                                                className="h-8 rounded-lg flex items-center justify-center text-xs cursor-default transition-all duration-300 hover:scale-110 hover:-translate-y-1"
                                                                style={{
                                                                    backgroundColor: resp.question?.category === 'emotion' ? 'rgba(155, 89, 182, 0.15)'
                                                                        : resp.question?.category === 'relationship' ? 'rgba(231, 76, 60, 0.15)'
                                                                            : resp.question?.category === 'space' ? 'rgba(39, 174, 96, 0.15)'
                                                                                : 'rgba(52, 152, 219, 0.15)',
                                                                }}
                                                            >
                                                                {getCategoryEmoji(resp.question?.category ?? '')}
                                                            </div>
                                                            {/* 호버 시 응답 미리보기 */}
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 p-2 rounded-lg bg-[var(--color-text)] text-white text-[10px] leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 shadow-lg">
                                                                <p className="line-clamp-3">{resp.text_response ?? '이미지로 답변'}</p>
                                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--color-text)]" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* ===== 분석 리포트 본문 ===== */}
                                            <div className="px-5 pb-6">
                                                <div className="relative p-5 rounded-2xl bg-gradient-to-br from-white via-[var(--color-primary-subtle)]/20 to-white border border-[var(--color-border)]/50">
                                                    {/* 장식용 따옴표 */}
                                                    <div className="absolute -top-3 left-5 text-4xl text-[var(--color-primary)]/20 font-serif select-none">
                                                        &ldquo;
                                                    </div>

                                                    <div className="pt-3">
                                                        {renderReportText(report.report_text)}
                                                    </div>

                                                    {/* 하단 AI 분석 표시 */}
                                                    <div className="mt-4 pt-3 border-t border-[var(--color-border)]/50 flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center">
                                                                <span className="text-[8px] text-white">✦</span>
                                                            </div>
                                                            <span className="text-[10px] text-[var(--color-text-light)]">
                                                                AI가 당신의 일주일을 읽고 작성했어요
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] text-[var(--color-text-light)]">
                                                            {formatDate(report.created_at)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
