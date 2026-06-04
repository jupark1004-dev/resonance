'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const QUESTIONS = [
    {
        id: 'q1',
        title: '주말을 보내는 방식?',
        optionA: '에너지 충전! 활기차게 밖에서',
        optionB: '나만의 시간, 여유롭게 집에서'
    },
    {
        id: 'q2',
        title: '연락의 빈도와 방식?',
        optionA: '수시로 소소한 일상을 공유',
        optionB: '하루 한두 번, 필요할 때 집중해서'
    },
    {
        id: 'q3',
        title: '갈등이 생겼을 때 어떻게 해결하나요?',
        optionA: '답답한 건 못 참아, 바로 대화로 풀기',
        optionB: '생각 정리 필수, 시간을 두고 풀기'
    }
];

export default function GatekeeperForm({ matchId }: { matchId: string }) {
    const router = useRouter();
    const [answers, setAnswers] = useState<string[]>([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSelect = (option: string) => {
        const newAnswers = [...answers];
        newAnswers[currentStep] = option;
        setAnswers(newAnswers);

        if (currentStep < QUESTIONS.length - 1) {
            setTimeout(() => setCurrentStep(prev => prev + 1), 300);
        }
    };

    const handleSubmit = async () => {
        if (answers.length !== QUESTIONS.length) return;
        
        setIsSubmitting(true);
        setError('');
        try {
            const res = await fetch(`/api/match/${matchId}/gatekeeper`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '답변 제출 실패');

            router.push('/match');
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            setIsSubmitting(false);
        }
    };

    const question = QUESTIONS[currentStep];

    return (
        <div className="max-w-md mx-auto py-12 px-6 bg-[var(--color-background)] min-h-[70vh] flex flex-col justify-center">
            <div className="mb-8 text-center animate-fade-in">
                <span className="text-3xl mb-4 block">⚖️</span>
                <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">마음의 관문</h1>
                <p className="text-sm text-[var(--color-text-secondary)]">
                    서로의 가치관이 얼마나 맞닿아 있는지<br/>3가지 질문으로 확인해보세요.
                </p>
            </div>

            <div className="mb-6 flex justify-center space-x-2">
                {QUESTIONS.map((_, i) => (
                    <div
                        key={i}
                        className={`h-2 rounded-full transition-all duration-300 ${
                            i <= currentStep ? 'w-8 bg-[var(--color-primary)]' : 'w-4 bg-[var(--color-border)]'
                        }`}
                    />
                ))}
            </div>

            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 shadow-sm animate-slide-up" key={currentStep}>
                <h2 className="text-lg font-bold text-[var(--color-text)] text-center mb-8">
                    {question.title}
                </h2>

                <div className="space-y-4">
                    <button
                        onClick={() => handleSelect('A')}
                        className={`w-full p-4 rounded-xl text-left border-2 transition-all ${
                            answers[currentStep] === 'A'
                                ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)]'
                                : 'border-transparent bg-[var(--color-background)] hover:bg-[var(--color-primary-subtle)] hover:border-[var(--color-primary-light)]'
                        }`}
                    >
                        <span className="text-[var(--color-text)] font-medium block">
                            A. {question.optionA}
                        </span>
                    </button>
                    <button
                        onClick={() => handleSelect('B')}
                        className={`w-full p-4 rounded-xl text-left border-2 transition-all ${
                            answers[currentStep] === 'B'
                                ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)]'
                                : 'border-transparent bg-[var(--color-background)] hover:bg-[var(--color-primary-subtle)] hover:border-[var(--color-primary-light)]'
                        }`}
                    >
                        <span className="text-[var(--color-text)] font-medium block">
                            B. {question.optionB}
                        </span>
                    </button>
                </div>
            </div>

            {error && (
                <p className="text-[var(--color-danger)] text-sm text-center mt-4">{error}</p>
            )}

            {currentStep === QUESTIONS.length - 1 && answers.length === QUESTIONS.length && (
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="mt-8 w-full py-4 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white font-bold shadow-lg shadow-[var(--color-primary-subtle)] hover:opacity-90 transition-opacity disabled:opacity-50 animate-fade-in"
                >
                    {isSubmitting ? '전달 중...' : '마음 전달하기'}
                </button>
            )}
        </div>
    );
}
