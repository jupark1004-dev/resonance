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
    const [shareTarget, setShareTarget] = useState<ReportWithImages | null>(null);
    const [shareStatus, setShareStatus] = useState('');
    const [savingImage, setSavingImage] = useState(false);

    // 첫 리포트(1주차)는 3개 응답으로 오픈, 이후 리포트는 7개 응답 기준
    const requiredCount = reports.length === 0 ? 3 : 7;

    // 리포트에서 한 줄 페르소나 타이틀과 핵심 요약 문단 추출
    const extractPersonaSummary = (reportText: string) => {
        const paragraphs = reportText
            .split('\n')
            .map((p) => p.trim())
            .filter(Boolean);

        let personaTitle = '고유한 내면의 빛을 품은 사람';
        let bodyParagraphs = paragraphs;

        if (paragraphs.length > 0) {
            const boldMatch = paragraphs[0].match(/\*\*([^*]+)\*\*/);
            if (boldMatch) {
                personaTitle = boldMatch[1].replace(/^["“”]|["“”]$/g, '').trim();
                bodyParagraphs = paragraphs.slice(1);
            }
        }

        const firstBody = (bodyParagraphs[0] ?? paragraphs[0] ?? '')
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .trim();

        const excerpt =
            firstBody.length > 155 ? `${firstBody.slice(0, 152).trim()}...` : firstBody;

        return { personaTitle, excerpt };
    };

    // 캔버스 줄바꿈 헬퍼
    const drawWrappedText = (
        ctx: CanvasRenderingContext2D,
        text: string,
        x: number,
        y: number,
        maxWidth: number,
        lineHeight: number
    ) => {
        const words = text.split(' ');
        let line = '';
        let currentY = y;

        for (let i = 0; i < words.length; i++) {
            const testLine = line ? `${line} ${words[i]}` : words[i];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && line) {
                ctx.fillText(line, x, currentY);
                line = words[i];
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        if (line) {
            ctx.fillText(line, x, currentY);
            currentY += lineHeight;
        }
        return currentY;
    };

    // 인스타그램 스토리/피드 공유용 고해상도(1080x1350) PNG 카드 Blob 생성
    const createPersonaCardBlob = async (report: ReportWithImages): Promise<Blob | null> => {
        const { personaTitle, excerpt } = extractPersonaSummary(report.report_text);
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1350;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // 1. 따뜻한 그라데이션 배경
        const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1350);
        bgGrad.addColorStop(0, '#FFF5F3');
        bgGrad.addColorStop(0.5, '#FAFAFA');
        bgGrad.addColorStop(1, '#FFEAE5');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 1080, 1350);

        // 2. 배경 공명 파동 장식 원
        ctx.strokeStyle = 'rgba(231, 76, 60, 0.08)';
        ctx.lineWidth = 3;
        [220, 360, 500].forEach((radius) => {
            ctx.beginPath();
            ctx.arc(540, 320, radius, 0, Math.PI * 2);
            ctx.stroke();
        });

        // 3. 메인 화이트 카드 영역
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(44, 62, 80, 0.08)';
        ctx.shadowBlur = 40;
        ctx.shadowOffsetY = 16;
        ctx.beginPath();
        ctx.roundRect(90, 130, 900, 1020, 48);
        ctx.fill();
        ctx.shadowColor = 'transparent';

        // 카드 테두리
        ctx.strokeStyle = 'rgba(231, 76, 60, 0.18)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(90, 130, 900, 1020, 48);
        ctx.stroke();

        // 4. 상단 브랜드 배지
        ctx.fillStyle = '#FFF0EE';
        ctx.beginPath();
        ctx.roundRect(350, 210, 380, 56, 28);
        ctx.fill();

        ctx.fillStyle = '#E74C3C';
        ctx.font = '600 24px Pretendard, -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`✦ RESONANCE · ${report.week_number}주차 내면 리포트`, 540, 247);

        // 5. 큰따옴표 장식 및 페르소나 타이틀
        ctx.fillStyle = 'rgba(231, 76, 60, 0.22)';
        ctx.font = 'bold 96px Georgia, serif';
        ctx.fillText('“', 540, 375);

        ctx.fillStyle = '#E74C3C';
        ctx.font = 'bold 44px Pretendard, -apple-system, BlinkMacSystemFont, sans-serif';
        const nextYAfterTitle = drawWrappedText(
            ctx,
            personaTitle,
            540,
            435,
            740,
            62
        );

        // 구분선
        ctx.strokeStyle = '#ECF0F1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(460, nextYAfterTitle + 24);
        ctx.lineTo(620, nextYAfterTitle + 24);
        ctx.stroke();

        // 6. 본문 핵심 발췌문
        ctx.fillStyle = '#2C3E50';
        ctx.font = '400 32px Pretendard, -apple-system, BlinkMacSystemFont, sans-serif';
        drawWrappedText(
            ctx,
            excerpt,
            540,
            nextYAfterTitle + 96,
            720,
            54
        );

        // 7. 하단 감정 키워드 & 날짜
        const emojis = report.weekResponses
            .slice(0, 7)
            .map((r) => getCategoryEmoji(r.question?.category ?? ''))
            .join('   ');

        if (emojis) {
            ctx.font = '34px sans-serif';
            ctx.fillText(emojis, 540, 990);
        }

        ctx.fillStyle = '#95A5A6';
        ctx.font = '500 24px Pretendard, -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(`${formatDate(report.created_at)} · AI 내면 심리 분석`, 540, 1065);

        // 8. 카드 외부 하단 슬로건
        ctx.fillStyle = '#7F8C8D';
        ctx.font = '600 26px Pretendard, -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('나를 가장 깊이 이해한 날, 결이 같은 사람을 만납니다 · RESONANCE', 540, 1235);

        return new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob), 'image/png');
        });
    };

    // 이미지 저장 핸들러
    const handleDownloadCard = async (report: ReportWithImages) => {
        setSavingImage(true);
        setShareStatus('');
        try {
            const blob = await createPersonaCardBlob(report);
            if (!blob) {
                setShareStatus('카드 이미지를 생성하지 못했어요.');
                return;
            }
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `resonance-persona-week-${report.week_number}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            setShareStatus('인스타그램 스토리/피드용 이미지가 저장되었어요! ✨');
        } catch {
            setShareStatus('이미지 저장 중 오류가 발생했어요.');
        } finally {
            setSavingImage(false);
        }
    };

    // 모바일/웹 공유하기 핸들러
    const handleNativeShare = async (report: ReportWithImages) => {
        const { personaTitle, excerpt } = extractPersonaSummary(report.report_text);
        const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const shareText = `🔮 AI가 발견한 나의 내면 페르소나\n"${personaTitle}"\n\n${excerpt}\n\n나를 가장 깊이 이해한 날, 결이 같은 사람을 만납니다 — RESONANCE`;

        try {
            const blob = await createPersonaCardBlob(report);
            if (blob && typeof navigator !== 'undefined' && navigator.share) {
                const file = new File([blob], `resonance-persona-${report.week_number}.png`, {
                    type: 'image/png',
                });
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: `RESONANCE · "${personaTitle}"`,
                        text: shareText,
                        files: [file],
                    });
                    return;
                }
                await navigator.share({
                    title: `RESONANCE · "${personaTitle}"`,
                    text: shareText,
                    url: shareUrl,
                });
                return;
            }

            // Web Share 미지원 환경에서는 클립보드 복사
            await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
            setShareStatus('공유 문구와 링크가 복사되었어요! 원하는 곳에 붙여넣어 보세요 ✨');
        } catch {
            // 사용자가 공유 창을 닫은 경우 등 무시
        }
    };

    // 텍스트 & 링크 복사 핸들러
    const handleCopyText = async (report: ReportWithImages) => {
        const { personaTitle, excerpt } = extractPersonaSummary(report.report_text);
        const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const shareText = `🔮 AI가 발견한 나의 내면 페르소나\n"${personaTitle}"\n\n${excerpt}\n\n나도 내면 리포트 받아보기 👉 ${shareUrl}`;

        try {
            await navigator.clipboard.writeText(shareText);
            setShareStatus('문구와 링크가 클립보드에 복사되었어요! ✨');
        } catch {
            setShareStatus('복사에 실패했어요. 다시 시도해 주세요.');
        }
    };

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
                {unanalyzedCount >= requiredCount && (
                    <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-[var(--color-primary-subtle)] to-white border border-[var(--color-primary)]/20 animate-slide-up">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center shrink-0">
                                <span className="text-white text-lg">🔮</span>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-[var(--color-text)]">
                                    {reports.length === 0
                                        ? '첫 번째 내면 리포트가 준비되었어요!'
                                        : '새로운 분석이 준비되었어요!'}
                                </p>
                                <p className="text-xs text-[var(--color-text-secondary)]">
                                    {unanalyzedCount}개의 응답을 바탕으로 내면의 결을 분석할 수 있어요
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
                                reports.length === 0 ? '내 첫 내면 리포트 생성하기 ✨' : '주간 리포트 생성하기'
                            )}
                        </button>
                    </div>
                )}

                {/* 아직 분석 불가 */}
                {unanalyzedCount < requiredCount && unanalyzedCount > 0 && (
                    <div className="mb-6 p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] animate-fade-in">
                        <p className="text-sm text-[var(--color-text-secondary)] text-center">
                            {reports.length === 0 ? '첫 내면 리포트까지 ' : '다음 분석까지 '}
                            <span className="font-bold text-[var(--color-primary)]">
                                {requiredCount - unanalyzedCount}
                            </span>
                            개의 답변이 더 필요해요
                        </p>
                        {/* 진행 바 */}
                        <div className="mt-3 h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] transition-all duration-500"
                                style={{ width: `${(unanalyzedCount / requiredCount) * 100}%` }}
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
                            첫 3개의 질문에 답하면
                            <br />
                            AI가 당신의 첫 내면 리포트를 분석해 드려요
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
                                                                AI가 당신의 기록을 읽고 작성했어요
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] text-[var(--color-text-light)]">
                                                            {formatDate(report.created_at)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* 내면 페르소나 카드 공유 & 저장 버튼 */}
                                                <div className="mt-4 flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShareStatus('');
                                                            setShareTarget(report);
                                                        }}
                                                        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 flex items-center justify-center gap-2"
                                                    >
                                                        <span>✨</span>
                                                        <span>내면 페르소나 카드 공유 / 이미지 저장</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ===== 내면 페르소나 공유 카드 모달 ===== */}
                {shareTarget && (() => {
                    const { personaTitle, excerpt } = extractPersonaSummary(shareTarget.report_text);
                    return (
                        <div
                            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-5 animate-fade-in"
                            onClick={() => setShareTarget(null)}
                        >
                            <div
                                className="w-full max-w-md rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 shadow-xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-base font-bold text-[var(--color-text)]">
                                            나의 내면 페르소나 카드
                                        </h3>
                                        <p className="text-xs text-[var(--color-text-secondary)]">
                                            인스타그램 스토리나 친구에게 내면의 결을 공유해 보세요
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShareTarget(null)}
                                        className="w-8 h-8 rounded-full bg-[var(--color-background)] text-[var(--color-text-secondary)] flex items-center justify-center hover:text-[var(--color-text)]"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* 공유 카드 미리보기 (4:5 감성 비율) */}
                                <div className="relative rounded-2xl p-6 mb-5 bg-gradient-to-br from-[#FFF5F3] via-white to-[#FFEAE5] border border-[var(--color-primary)]/20 shadow-inner text-center overflow-hidden">
                                    <div className="inline-block px-3 py-1 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)] text-[11px] font-semibold mb-4">
                                        ✦ RESONANCE · {shareTarget.week_number}주차 내면 페르소나
                                    </div>

                                    <p className="text-lg font-bold text-[var(--color-primary)] leading-snug mb-3 px-2">
                                        &ldquo;{personaTitle}&rdquo;
                                    </p>

                                    <div className="w-10 h-0.5 bg-[var(--color-primary)]/20 mx-auto mb-4" />

                                    <p className="text-xs text-[#2C3E50] leading-relaxed mb-5 px-1">
                                        {excerpt}
                                    </p>

                                    <div className="flex items-center justify-center gap-1.5 mb-3">
                                        {shareTarget.weekResponses.slice(0, 7).map((resp, idx) => (
                                            <span key={idx} className="text-sm">
                                                {getCategoryEmoji(resp.question?.category ?? '')}
                                            </span>
                                        ))}
                                    </div>

                                    <p className="text-[10px] text-[#7F8C8D] font-medium">
                                        나를 가장 깊이 이해한 날, 결이 같은 사람을 만납니다
                                    </p>
                                </div>

                                {shareStatus && (
                                    <div className="mb-4 p-3 rounded-xl bg-[var(--color-primary-subtle)] text-[var(--color-primary)] text-xs font-medium text-center">
                                        {shareStatus}
                                    </div>
                                )}

                                {/* 액션 버튼들 */}
                                <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                                    <button
                                        type="button"
                                        disabled={savingImage}
                                        onClick={() => handleDownloadCard(shareTarget)}
                                        className="py-3 px-4 rounded-xl bg-[var(--color-primary)] text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                                    >
                                        {savingImage ? '이미지 생성 중...' : '📥 카드 이미지 저장'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleNativeShare(shareTarget)}
                                        className="py-3 px-4 rounded-xl bg-[var(--color-text)] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                                    >
                                        📤 바로 공유하기
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleCopyText(shareTarget)}
                                    className="w-full py-2.5 px-4 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] text-xs font-medium hover:text-[var(--color-text)] transition-colors"
                                >
                                    🔗 페르소나 문구 & 링크 복사하기
                                </button>
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}
