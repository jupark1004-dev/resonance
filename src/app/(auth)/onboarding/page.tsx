'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { OnboardingInput } from '@/types';

// 한국 주요 지역 목록
const REGIONS = [
    '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
    '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState<OnboardingInput>({
        nickname: '',
        birth_year: new Date().getFullYear() - 25,
        gender: 'male',
        region: '서울',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const steps = [
        {
            title: '어떻게 불러드릴까요?',
            subtitle: '다른 사용자에게 보여질 닉네임이에요',
        },
        {
            title: '태어난 해를 알려주세요',
            subtitle: '나이대가 비슷한 사람을 연결하는 데 참고해요',
        },
        {
            title: '성별을 선택해 주세요',
            subtitle: '매칭 기본 정보로 활용돼요',
        },
        {
            title: '어디에 살고 계신가요?',
            subtitle: '가까운 사람을 만날 수 있도록 도와줘요',
        },
    ];

    const handleNext = () => {
        if (step === 0 && formData.nickname.trim().length < 2) {
            setError('닉네임은 2자 이상이어야 합니다.');
            return;
        }
        setError('');
        setStep(step + 1);
    };

    const handleBack = () => {
        setError('');
        setStep(step - 1);
    };

    const handleSubmit = async () => {
        setError('');
        setLoading(true);

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setError('로그인이 필요합니다.');
                router.push('/login');
                return;
            }

            const { error: updateError } = await supabase
                .from('users')
                .update({
                    nickname: formData.nickname.trim(),
                    birth_year: formData.birth_year,
                    gender: formData.gender,
                    region: formData.region,
                })
                .eq('id', user.id);

            if (updateError) {
                setError('프로필 저장 중 문제가 발생했습니다. 다시 시도해 주세요.');
                return;
            }

            router.push('/home');
            router.refresh();
        } catch {
            setError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
        } finally {
            setLoading(false);
        }
    };

    // 현재 연도 기준 생년 범위 (만 18세 ~ 60세)
    const currentYear = new Date().getFullYear();
    const minYear = currentYear - 60;
    const maxYear = currentYear - 18;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[var(--color-background)]">
            <div className="w-full max-w-sm animate-fade-in">
                {/* 진행 표시 */}
                <div className="flex gap-2 mb-10">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step
                                    ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)]'
                                    : 'bg-[var(--color-border)]'
                                }`}
                        />
                    ))}
                </div>

                {/* 질문 헤더 */}
                <div className="mb-8" key={step}>
                    <h1 className="text-2xl font-bold text-[var(--color-text)] animate-fade-in">
                        {steps[step].title}
                    </h1>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-2 animate-fade-in">
                        {steps[step].subtitle}
                    </p>
                </div>

                {/* 입력 필드 */}
                <div className="mb-8 animate-slide-up" key={`input-${step}`}>
                    {step === 0 && (
                        <input
                            id="onboarding-nickname"
                            type="text"
                            value={formData.nickname}
                            onChange={(e) =>
                                setFormData({ ...formData, nickname: e.target.value })
                            }
                            placeholder="예: 하늘빛여행자"
                            maxLength={20}
                            className="w-full px-4 py-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-lg placeholder:text-[var(--color-text-light)] transition-all duration-200"
                            autoFocus
                        />
                    )}

                    {step === 1 && (
                        <div className="flex items-center gap-4">
                            <input
                                id="onboarding-birth-year"
                                type="number"
                                value={formData.birth_year}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        birth_year: parseInt(e.target.value) || currentYear - 25,
                                    })
                                }
                                min={minYear}
                                max={maxYear}
                                className="w-full px-4 py-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-lg text-center transition-all duration-200"
                            />
                            <span className="text-lg text-[var(--color-text-secondary)] shrink-0">
                                년생
                            </span>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { value: 'male' as const, label: '남성', emoji: '👨' },
                                { value: 'female' as const, label: '여성', emoji: '👩' },
                                { value: 'other' as const, label: '기타', emoji: '🌈' },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() =>
                                        setFormData({ ...formData, gender: option.value })
                                    }
                                    className={`py-4 rounded-xl border text-center transition-all duration-200 ${formData.gender === option.value
                                            ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
                                            : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-primary-light)]'
                                        }`}
                                >
                                    <span className="text-2xl block mb-1">{option.emoji}</span>
                                    <span className="text-sm font-medium">{option.label}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                            {REGIONS.map((region) => (
                                <button
                                    key={region}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, region })}
                                    className={`py-3 rounded-xl border text-sm font-medium text-center transition-all duration-200 ${formData.region === region
                                            ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
                                            : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-primary-light)]'
                                        }`}
                                >
                                    {region}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* 에러 메시지 */}
                {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-100 mb-4">
                        <p className="text-sm text-[var(--color-error)]">{error}</p>
                    </div>
                )}

                {/* 버튼 */}
                <div className="flex gap-3">
                    {step > 0 && (
                        <button
                            type="button"
                            onClick={handleBack}
                            className="py-4 px-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] font-medium transition-all duration-200 hover:border-[var(--color-text-light)]"
                        >
                            이전
                        </button>
                    )}
                    {step < steps.length - 1 ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="flex-1 py-4 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                        >
                            다음
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 py-4 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {loading ? (
                                <span className="animate-pulse-soft">저장 중...</span>
                            ) : (
                                '시작하기'
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
