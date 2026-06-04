'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { GatekeeperQuestion } from '@/types';

export default function GatekeeperClient({ 
    matchId, 
    questions, 
    partnerNickname 
}: { 
    matchId: string; 
    questions: GatekeeperQuestion[]; 
    partnerNickname: string;
}) {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<{status: string, matchCount: number, total: number} | null>(null);

    const currentQuestion = questions[currentIndex];

    const handleSelect = async (choice: 'option_a' | 'option_b') => {
        const newAnswers = { ...answers, [currentQuestion.id]: currentQuestion[choice] };
        setAnswers(newAnswers);

        if (currentIndex < questions.length - 1) {
            // 다음 질문으로 부드럽게 넘어가기
            setTimeout(() => {
                setCurrentIndex(currentIndex + 1);
            }, 300);
        } else {
            // 모든 질문 완료 시 자동 제출
            submitAnswers(newAnswers);
        }
    };

    const submitAnswers = async (finalAnswers: Record<string, string>) => {
        setSubmitting(true);
        setError('');

        try {
            const res = await fetch('/api/gatekeeper/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId, answers: finalAnswers })
            });

            const data = await res.json();

            if (data.success) {
                // 결과 확인 화면으로 상태 변경 (시뮬레이션일 경우 상대방도 즉시 응답하므로 결과가 나옴)
                if (data.matchResult) {
                    setResult(data.matchResult);
                } else {
                    // 상대방 응답 대기 상태
                    router.push('/match');
                }
            } else {
                setError(data.error || '저장에 실패했습니다.');
                setSubmitting(false);
            }
        } catch (e) {
            setError('서버 오류가 발생했습니다.');
            setSubmitting(false);
        }
    };

    if (result) {
        const isMatched = result.status === 'matched';
        return (
            <div className="min-h-screen bg-[var(--color-background)] px-6 flex flex-col items-center justify-center">
                <div className="max-w-md w-full p-8 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] text-center shadow-lg animate-slide-up">
                    <span className="text-6xl mb-6 block">
                        {isMatched ? '🎉' : '🍂'}
                    </span>
                    <h2 className="text-2xl font-bold text-[var(--color-text)] mb-3">
                        {isMatched ? '운명적인 만남이네요!' : '아쉽게 엇갈렸어요'}
                    </h2>
                    <p className="text-[var(--color-text-secondary)] mb-6 leading-relaxed">
                        {partnerNickname}님과 {result.total}문제 중 <strong className="text-[var(--color-primary)]">{result.matchCount}개</strong>가 일치했어요.
                        <br/>
                        {isMatched 
                            ? '지금 바로 대화를 시작해보세요.' 
                            : '나와 더 꼭 맞는 인연이 기다리고 있을 거예요.'}
                    </p>
                    
                    {isMatched ? (
                        <button
                            onClick={() => router.push(`/chat/${matchId}`)}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white font-bold shadow-md hover:shadow-lg transition-all"
                        >
                            채팅방 입장하기
                        </button>
                    ) : (
                        <button
                            onClick={() => router.push('/match')}
                            className="w-full py-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] font-semibold hover:bg-[var(--color-background)] transition-colors"
                        >
                            목록으로 돌아가기
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-background)] px-6 flex flex-col pt-20">
            <div className="max-w-md mx-auto w-full">
                {/* 헤더 & 진행 바 */}
                <div className="mb-12 text-center animate-fade-in">
                    <p className="text-sm font-semibold text-[var(--color-primary)] mb-2">
                        {partnerNickname}님과의 관문
                    </p>
                    <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">
                        당신의 취향은?
                    </h1>
                    
                    <div className="flex gap-2 justify-center">
                        {questions.map((_, i) => (
                            <div 
                                key={i} 
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                    i < currentIndex ? 'w-8 bg-[var(--color-primary)]' : 
                                    i === currentIndex ? 'w-8 bg-[var(--color-primary-light)] animate-pulse-soft' : 
                                    'w-4 bg-[var(--color-border)]'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
                        {error}
                    </div>
                )}

                {/* 질문 카드 (현재 질문만 표시) */}
                {currentQuestion && !submitting && (
                    <div key={currentIndex} className="space-y-4 animate-slide-up">
                        <button
                            onClick={() => handleSelect('option_a')}
                            className="w-full py-10 px-6 rounded-2xl bg-[var(--color-surface)] border-2 border-[var(--color-border)] hover:border-[var(--color-primary)] text-xl font-bold text-[var(--color-text)] transition-all hover:shadow-md hover:-translate-y-1 active:scale-95"
                        >
                            {currentQuestion.option_a}
                        </button>
                        
                        <div className="relative h-8 flex items-center justify-center">
                            <div className="absolute w-full h-px bg-[var(--color-border)]" />
                            <span className="relative z-10 px-4 bg-[var(--color-background)] text-sm font-semibold text-[var(--color-text-light)]">
                                VS
                            </span>
                        </div>

                        <button
                            onClick={() => handleSelect('option_b')}
                            className="w-full py-10 px-6 rounded-2xl bg-[var(--color-surface)] border-2 border-[var(--color-border)] hover:border-[var(--color-primary)] text-xl font-bold text-[var(--color-text)] transition-all hover:shadow-md hover:-translate-y-1 active:scale-95"
                        >
                            {currentQuestion.option_b}
                        </button>
                    </div>
                )}

                {submitting && (
                    <div className="py-20 text-center animate-pulse-soft">
                        <span className="text-4xl mb-4 block">🔮</span>
                        <p className="text-[var(--color-text-secondary)] font-medium">상대방의 마음을 확인하는 중...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
