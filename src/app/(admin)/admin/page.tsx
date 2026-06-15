'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Question = {
    id: string;
    question_text: string;
    category: string;
    created_at: string;
};

export default function AdminPage() {
    const router = useRouter();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [newQuestion, setNewQuestion] = useState('');
    const [category, setCategory] = useState('emotion');
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        checkAdminAndLoad();
    }, []);

    const checkAdminAndLoad = async () => {
        try {
            const supabase = createClient();
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError || !user) {
                router.push('/login');
                return;
            }

            // 아주 간단한 형태의 관리자 검증 로직 (환경 변수 또는 특정 이메일)
            const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@resonance.com';
            if (user.email !== adminEmail) {
                setError('관리자 권한이 없습니다.');
                setLoading(false);
                return;
            }

            setIsAdmin(true);
            fetchQuestions(supabase);
        } catch (e) {
            console.error(e);
            setError('인증 중 오류가 발생했습니다.');
            setLoading(false);
        }
    };

    const fetchQuestions = async (supabase: any) => {
        const { data, error } = await supabase
            .from('daily_questions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            setError('질문 목록을 불러오지 못했습니다.');
        } else {
            setQuestions(data || []);
        }
        setLoading(false);
    };

    const handleAddQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newQuestion.trim()) return;

        setAdding(true);
        setError('');
        try {
            const supabase = createClient();
            const { error: insertError } = await supabase
                .from('daily_questions')
                .insert([{ question_text: newQuestion, category }]);

            if (insertError) throw insertError;

            setNewQuestion('');
            fetchQuestions(supabase); // 새로고침
        } catch (e: any) {
            console.error(e);
            setError('질문 등록에 실패했습니다: ' + e.message);
        } finally {
            setAdding(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] text-[var(--color-text)]">로딩 중...</div>;
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)] px-6">
                <span className="text-4xl mb-4">⛔</span>
                <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">접근 권한이 없습니다</h1>
                <p className="text-sm text-[var(--color-text-secondary)] text-center mb-8">{error}</p>
                <button onClick={() => router.push('/')} className="px-6 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)]">
                    홈으로 돌아가기
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-background)] px-6 py-12">
            <div className="max-w-2xl mx-auto">
                <div className="mb-10 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--color-text)]">관리자 대시보드</h1>
                        <p className="text-[var(--color-text-secondary)] mt-2">데일리 질문 및 관문 관리</p>
                    </div>
                    <button onClick={() => router.push('/')} className="text-sm text-[var(--color-primary)] hover:underline">
                        앱으로 돌아가기
                    </button>
                </div>

                {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">{error}</div>}

                {/* 질문 추가 폼 */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm mb-10">
                    <h2 className="text-lg font-bold text-[var(--color-text)] mb-4">새 질문 등록</h2>
                    <form onSubmit={handleAddQuestion} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">카테고리</label>
                            <select 
                                value={category} 
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none"
                            >
                                <option value="emotion">감정 (Emotion)</option>
                                <option value="relationship">관계 (Relationship)</option>
                                <option value="space">공간 (Space)</option>
                                <option value="time">시간 (Time)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">질문 내용</label>
                            <textarea 
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                                placeholder="예: 오늘 하루 중 가장 마음이 따뜻해진 순간은 언제였나요?"
                                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none min-h-[100px] resize-none"
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={adding || !newQuestion.trim()}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white font-bold shadow-md hover:opacity-90 disabled:opacity-50 transition-all"
                        >
                            {adding ? '등록 중...' : '새 질문 등록하기'}
                        </button>
                    </form>
                </div>

                {/* 질문 리스트 */}
                <h2 className="text-lg font-bold text-[var(--color-text)] mb-4">등록된 질문 리스트 ({questions.length})</h2>
                <div className="space-y-4">
                    {questions.map((q) => (
                        <div key={q.id} className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex justify-between items-start gap-4">
                            <div>
                                <span className="inline-block px-2 py-1 bg-[var(--color-primary-subtle)] text-[var(--color-primary)] text-xs font-bold rounded-lg mb-2 uppercase">
                                    {q.category}
                                </span>
                                <p className="text-[var(--color-text)] font-medium leading-snug">{q.question_text}</p>
                            </div>
                            <span className="text-xs text-[var(--color-text-secondary)] whitespace-nowrap">
                                {new Date(q.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
