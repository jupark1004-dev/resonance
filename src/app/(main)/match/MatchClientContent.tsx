'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface MatchPartnerProfile {
    nickname: string | null;
    birth_year: number | null;
}

interface MatchItem {
    id: string;
    user_a_id: string;
    user_b_id: string;
    resonance_score: number | null;
    match_reason: string | null;
    status: 'pending' | 'gatekeeper' | 'matched' | 'missed';
    user_a?: MatchPartnerProfile | null;
    user_b?: MatchPartnerProfile | null;
    gatekeeper_answers?: { user_id: string }[];
}

export default function MatchClientContent({
    matches,
    currentUser,
    hasReport = false,
    responseCount = 0,
}: {
    matches: MatchItem[];
    currentUser: { id: string; email?: string };
    hasReport?: boolean;
    responseCount?: number;
}) {
    const router = useRouter();
    const [simulating, setSimulating] = useState(false);
    const [error, setError] = useState('');
    const [copiedInvite, setCopiedInvite] = useState(false);

    const handleInviteShare = async () => {
        const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const text = `🔮 스와이프 없이 AI가 내면의 결을 분석해 이어주는 자기발견 매칭 서비스, RESONANCE\n첫 3개의 질문에 답하고 내면 페르소나 리포트를 받아보세요 👉 ${shareUrl}`;
        try {
            if (typeof navigator !== 'undefined' && navigator.share) {
                await navigator.share({
                    title: 'RESONANCE — 내면이 공명하는 만남',
                    text,
                    url: shareUrl,
                });
                return;
            }
            await navigator.clipboard.writeText(text);
            setCopiedInvite(true);
            setTimeout(() => setCopiedInvite(false), 2500);
        } catch {
            // 공유 취소 무시
        }
    };

    const handleSimulate = async () => {
        setSimulating(true);
        setError('');
        try {
            const res = await fetch('/api/simulate', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                router.refresh(); // 새로고침해서 매칭된 데이터 표시
            } else {
                setError(data.error || '시뮬레이션 실패');
            }
        } catch (e) {
            setError('요청 중 오류가 발생했습니다.');
        } finally {
            setSimulating(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)] px-6 py-8 pb-32">
            <div className="max-w-lg mx-auto">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-10"
                >
                    <h1 className="text-2xl font-bold text-[var(--color-text)]">
                        새로운 공명 ✨
                    </h1>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                        AI가 당신의 기록을 엮어 찾아낸 특별한 인연입니다.
                    </p>
                </motion.div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                        {error}
                    </div>
                )}

                {!matches || matches.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                        className="space-y-4"
                    >
                        {!hasReport ? (
                            <div className="p-8 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-center shadow-sm">
                                <span className="text-4xl mb-4 block">📖</span>
                                <p className="text-[var(--color-text)] font-bold text-lg mb-2">
                                    첫 내면 리포트가 완성되면 매칭이 시작돼요
                                </p>
                                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
                                    현재 <strong className="text-[var(--color-primary)]">{Math.min(responseCount, 3)} / 3개</strong>의 질문에 답하셨어요.
                                    <br />
                                    {responseCount >= 3
                                        ? '지금 바로 첫 AI 내면 리포트를 생성하면 공명 매칭 대기열에 등록됩니다!'
                                        : `${3 - Math.min(responseCount, 3)}개의 질문에 더 답하고 첫 AI 내면 리포트를 받아보세요.`}
                                </p>
                                <Link
                                    href={responseCount >= 3 ? '/report' : '/home'}
                                    className="block w-full py-3.5 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                                >
                                    {responseCount >= 3 ? '첫 AI 내면 리포트 생성하러 가기 →' : '질문 이어서 답변하기 →'}
                                </Link>
                            </div>
                        ) : (
                            <div className="p-8 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-center shadow-sm">
                                <span className="text-4xl mb-4 block">🔮</span>
                                <span className="inline-block px-3 py-1 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)] text-xs font-bold mb-3">
                                    공명 주파수 탐색 중
                                </span>
                                <p className="text-[var(--color-text)] font-bold text-lg mb-2">
                                    당신과 결이 닿는 사람을 찾고 있어요
                                </p>
                                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
                                    작성하신 내면 리포트를 바탕으로 정기 공명 매칭이 진행됩니다.
                                    <br />
                                    주파수가 맞는 상대가 나타나면 이곳에 카드가 도착해요.
                                </p>

                                <button
                                    type="button"
                                    onClick={handleInviteShare}
                                    className="w-full py-3.5 px-4 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text)] font-semibold text-sm hover:border-[var(--color-primary)] transition-colors"
                                >
                                    {copiedInvite
                                        ? '초대 링크가 복사되었어요! ✨'
                                        : '💌 주변 친구에게도 RESONANCE 알려주기'}
                                </button>
                            </div>
                        )}

                        {/* 베타 체험용 AI 가상 매칭 미리보기 (실제 매칭과 명확히 구분) */}
                        <div className="p-5 rounded-2xl bg-[var(--color-surface)]/70 border border-dashed border-[var(--color-border)] text-center">
                            <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                                🧪 매칭 후 진행되는 &lsquo;밸런스 관문 & 실시간 채팅&rsquo;이 궁금하신가요?
                            </p>
                            <p className="text-[11px] text-[var(--color-text-light)] mb-3">
                                실제 매칭을 기다리는 동안 AI 가상 파트너와 관문 통과 과정을 미리 체험해 볼 수 있어요.
                            </p>
                            <button
                                type="button"
                                onClick={handleSimulate}
                                disabled={simulating}
                                className="py-2.5 px-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors disabled:opacity-50"
                            >
                                {simulating ? '체험 매칭 생성 중...' : 'AI 가상 파트너로 관문·채팅 미리 체험하기'}
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <div className="space-y-6">
                        {matches.map((match: MatchItem, i: number) => {
                            const isUserA = match.user_a_id === currentUser.id;
                            const partner = isUserA ? match.user_b : match.user_a;
                            
                            // 내가 관문 답변을 했는지 확인
                            const didIAnswer = match.gatekeeper_answers?.some(
                                (ans) => ans.user_id === currentUser.id
                            );

                            return (
                                <motion.div 
                                    key={match.id} 
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-primary-light)] shadow-[var(--shadow-glow)]"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className="inline-block px-3 py-1 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)] text-xs font-bold mb-3">
                                                공명 지수 {Math.round(match.resonance_score || 0)}%
                                            </span>
                                            <h2 className="text-xl font-bold text-[var(--color-text)] mb-1">
                                                {partner?.nickname ?? '익명의 누군가'}
                                            </h2>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-[var(--color-background)] mb-6 text-sm text-[var(--color-text)] leading-relaxed border border-[var(--color-border)]">
                                        <p className="italic text-[var(--color-text-secondary)] mb-2">"이 사람과 당신은..."</p>
                                        <p>
                                            {match.match_reason || "서로의 기록을 분석해본 결과, 깊은 결에서 공통점을 확인했어요. 마치 오랜 친구처럼 편안함을 느낄 수 있을 거예요."}
                                        </p>
                                    </div>

                                    {match.status === 'matched' ? (
                                        <Link href={`/chat/${match.id}`} passHref legacyBehavior>
                                            <motion.a
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="block w-full py-4 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white text-center font-bold shadow-md hover:shadow-lg transition-shadow"
                                            >
                                                💬 새로운 인연과 대화하기
                                            </motion.a>
                                        </Link>
                                    ) : match.status === 'missed' ? (
                                        <div className="py-4 rounded-xl border border-[var(--color-border)] text-center text-[var(--color-text-secondary)] font-semibold bg-[var(--color-surface)] opacity-70">
                                            🍂 아쉽게 엇갈린 인연입니다.
                                        </div>
                                    ) : didIAnswer ? (
                                        <div className="py-4 rounded-xl border-2 border-dashed border-[var(--color-primary-light)] text-center text-[var(--color-primary)] font-semibold bg-[var(--color-primary-subtle)]">
                                            상대방의 응답을 기다리는 중...
                                        </div>
                                    ) : (
                                        <Link href={`/match/${match.id}/gatekeeper`} passHref legacyBehavior>
                                            <motion.a
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="block w-full py-4 rounded-xl bg-[var(--color-text)] text-[var(--color-background)] text-center font-semibold shadow-md hover:shadow-lg transition-shadow"
                                            >
                                                {match.status === 'gatekeeper' 
                                                    ? '상대방이 관문을 열었어요! 당신의 답은?' 
                                                    : '마음의 관문 열기 (수락)'}
                                            </motion.a>
                                        </Link>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
