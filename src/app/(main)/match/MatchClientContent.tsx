'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function MatchClientContent({ matches, currentUser }: { matches: any[], currentUser: any }) {
    const router = useRouter();
    const [simulating, setSimulating] = useState(false);
    const [error, setError] = useState('');

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
                <div className="mb-10 animate-fade-in">
                    <h1 className="text-2xl font-bold text-[var(--color-text)]">
                        새로운 공명 ✨
                    </h1>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                        AI가 당신의 기록을 엮어 찾아낸 특별한 인연입니다.
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                        {error}
                    </div>
                )}

                {!matches || matches.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-center animate-slide-up">
                        <span className="text-4xl mb-4 block">🔮</span>
                        <p className="text-[var(--color-text)] font-semibold mb-2">아직 공명 중입니다</p>
                        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                            당신의 주파수와 꼭 맞는 사람을 찾고 있어요!<br/>조금만 더 기다려주세요.
                        </p>
                        
                        {/* 시뮬레이션 버튼 */}
                        <button
                            onClick={handleSimulate}
                            disabled={simulating}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            {simulating ? '시뮬레이션 중...' : '매칭 시뮬레이션 해보기'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {matches.map((match: any, i: number) => {
                            const isUserA = match.user_a_id === currentUser.id;
                            const partner = isUserA ? match.user_b : match.user_a;
                            
                            // 내가 관문 답변을 했는지 확인
                            const didIAnswer = match.gatekeeper_answers?.some(
                                (ans: any) => ans.user_id === currentUser.id
                            );

                            return (
                                <div key={match.id} className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-primary-light)] shadow-[var(--shadow-glow)] animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
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
                                        <Link
                                            href={`/chat/${match.id}`}
                                            className="block w-full py-4 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white text-center font-bold shadow-md hover:shadow-lg transition-all"
                                        >
                                            💬 새로운 인연과 대화하기
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
                                        <Link
                                            href={`/match/${match.id}/gatekeeper`}
                                            className="block w-full py-4 rounded-xl bg-[var(--color-text)] text-[var(--color-background)] text-center font-semibold shadow-md hover:opacity-90 transition-opacity"
                                        >
                                            {match.status === 'gatekeeper' 
                                                ? '상대방이 관문을 열었어요! 당신의 답은?' 
                                                : '마음의 관문 열기 (수락)'}
                                        </Link>
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
