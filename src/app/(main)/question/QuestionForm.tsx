'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { DailyQuestion } from '@/types';

interface QuestionFormProps {
    question: DailyQuestion;
}

export default function QuestionForm({ question }: QuestionFormProps) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [textResponse, setTextResponse] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);

    // 카테고리별 배경 색상
    const getCategoryStyle = (category: string) => {
        switch (category) {
            case 'emotion':
                return { emoji: '💭', label: '감정', color: 'rgba(155, 89, 182, 0.08)' };
            case 'relationship':
                return { emoji: '💕', label: '관계', color: 'rgba(231, 76, 60, 0.08)' };
            case 'space':
                return { emoji: '🌿', label: '공간', color: 'rgba(39, 174, 96, 0.08)' };
            case 'time':
                return { emoji: '⏳', label: '시간', color: 'rgba(52, 152, 219, 0.08)' };
            default:
                return { emoji: '✨', label: '질문', color: 'rgba(231, 76, 60, 0.08)' };
        }
    };

    const categoryStyle = getCategoryStyle(question.category);

    // 이미지 선택 처리
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 5MB 제한
        if (file.size > 5 * 1024 * 1024) {
            setError('이미지는 5MB 이하만 업로드할 수 있어요.');
            return;
        }

        setImageFile(file);
        setError('');

        // 미리보기 생성
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    // 이미지 제거
    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // 응답 제출
    const handleSubmit = async () => {
        if (!textResponse.trim() && !imageFile) {
            setError('텍스트나 이미지 중 하나는 남겨주세요.');
            return;
        }

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

            let imageUrl: string | null = null;

            // 이미지 업로드
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('response-images')
                    .upload(fileName, imageFile);

                if (uploadError) {
                    setError('이미지 업로드에 실패했어요. 다시 시도해 주세요.');
                    setLoading(false);
                    return;
                }

                const { data: urlData } = supabase.storage
                    .from('response-images')
                    .getPublicUrl(fileName);

                imageUrl = urlData.publicUrl;
            }

            // 응답 저장
            const { error: insertError } = await supabase
                .from('responses')
                .insert({
                    user_id: user.id,
                    question_id: question.id,
                    text_response: textResponse.trim() || null,
                    image_url: imageUrl,
                });

            if (insertError) {
                setError('응답 저장에 실패했어요. 다시 시도해 주세요.');
                setLoading(false);
                return;
            }

            // 성공 애니메이션 표시
            setSubmitted(true);

            // 2초 후 홈으로 이동
            setTimeout(() => {
                router.push('/home');
                router.refresh();
            }, 2000);
        } catch {
            setError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
        } finally {
            setLoading(false);
        }
    };

    // 제출 성공 화면
    if (submitted) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[var(--color-background)]">
                <div className="text-center animate-fade-in">
                    <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
                        <svg
                            width="40"
                            height="40"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#27AE60"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-[var(--color-text)] mb-2">
                        오늘의 이야기를 들려주셔서 고마워요
                    </h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        당신의 답변이 소중하게 기록되었어요 ✨
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-background)] px-6 py-8">
            <div className="max-w-lg mx-auto">
                {/* 뒤로가기 */}
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="mb-6 flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    돌아가기
                </button>

                {/* 질문 카드 */}
                <div
                    className="p-8 rounded-2xl mb-8 animate-fade-in hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
                    style={{ backgroundColor: categoryStyle.color }}
                >
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-xl">{categoryStyle.emoji}</span>
                        <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-widest">
                            {categoryStyle.label}
                        </span>
                    </div>
                    <p className="text-xl font-semibold text-[var(--color-text)] leading-relaxed">
                        {question.question_text}
                    </p>
                </div>

                {/* 텍스트 응답 */}
                <div className="mb-6 animate-slide-up">
                    <label
                        htmlFor="response-text"
                        className="block text-sm font-medium text-[var(--color-text)] mb-3"
                    >
                        당신의 이야기를 들려주세요
                    </label>
                    <textarea
                        id="response-text"
                        value={textResponse}
                        onChange={(e) => setTextResponse(e.target.value)}
                        placeholder="자유롭게 적어보세요. 짧은 한 줄이어도 좋아요."
                        rows={6}
                        maxLength={1000}
                        className="w-full px-4 py-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-text-light)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 resize-none transition-all duration-300 leading-relaxed"
                    />
                    <p className="text-xs text-[var(--color-text-light)] mt-2 text-right">
                        {textResponse.length} / 1000
                    </p>
                </div>

                {/* 이미지 업로드 */}
                <div className="mb-8 animate-slide-up">
                    <label className="block text-sm font-medium text-[var(--color-text)] mb-3">
                        사진으로도 표현할 수 있어요 <span className="text-[var(--color-text-light)]">(선택)</span>
                    </label>

                    {imagePreview ? (
                        <div className="relative rounded-xl overflow-hidden border border-[var(--color-border)]">
                            <img
                                src={imagePreview}
                                alt="업로드 미리보기"
                                className="w-full h-48 object-cover"
                            />
                            <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-6 rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary-light)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 hover:shadow-sm transition-all duration-300 flex flex-col items-center gap-2"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <path d="M21 15l-5-5L5 21" />
                            </svg>
                            <span className="text-sm font-medium">사진 추가하기</span>
                            <span className="text-xs text-[var(--color-text-light)]">JPG, PNG, 5MB 이하</span>
                        </button>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageSelect}
                        className="hidden"
                    />
                </div>

                {/* 에러 메시지 */}
                {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-100 mb-4">
                        <p className="text-sm text-[var(--color-error)]">{error}</p>
                    </div>
                )}

                {/* 제출 버튼 */}
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || (!textResponse.trim() && !imageFile)}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white font-semibold text-base shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                    {loading ? (
                        <span className="animate-pulse-soft">기록하는 중...</span>
                    ) : (
                        '오늘의 이야기 기록하기'
                    )}
                </button>
            </div>
        </div>
    );
}
