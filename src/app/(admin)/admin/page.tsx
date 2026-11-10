'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { GatekeeperQuestion } from '@/types';

type Question = {
    id: string;
    question_text: string;
    category: string;
    created_at: string;
};

type UserStatProfile = {
    id: string;
    gender: string | null;
    region: string | null;
};

const TREND_PRESET_QUESTIONS = [
    { option_a: '연락은 칼답이 기본 ⚡', option_b: '서로 여유 있을 때 답장 ☕' },
    { option_a: '웨이팅 1시간 핫플 맛집 🍲', option_b: '바로 들어가는 조용한 식당 🌿' },
    { option_a: '갈등은 그날 바로 대화로 🔥', option_b: '생각 정리 후 차분히 대화 🌙' },
    { option_a: '주말엔 밖에서 데이트 🚗', option_b: '주말엔 집에서 힐링 충전 🏠' },
    { option_a: '분위기 좋은 와인바 🍷', option_b: '정겨운 포장마차 우동 🍢' },
    { option_a: '분 단위 완벽 계획 여행 📝', option_b: '발길 닿는 대로 즉흥 여행 ✈️' },
    { option_a: '고민 상담은 따뜻한 공감 🫂', option_b: '고민 상담은 현실적 해결책 💡' },
];

export default function AdminPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'daily' | 'gatekeeper'>('gatekeeper');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [gatekeeperQuestions, setGatekeeperQuestions] = useState<GatekeeperQuestion[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    // 데일리 질문 상태
    const [newQuestion, setNewQuestion] = useState('');
    const [category, setCategory] = useState('emotion');

    // 관문 밸런스 질문 상태
    const [optionA, setOptionA] = useState('');
    const [optionB, setOptionB] = useState('');

    const [adding, setAdding] = useState(false);
    const [runningMatch, setRunningMatch] = useState(false);
    const [userProfiles, setUserProfiles] = useState<UserStatProfile[]>([]);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

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

            const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@resonance.com';
            if (user.email !== adminEmail) {
                setError('관리자 권한이 없습니다.');
                setLoading(false);
                return;
            }

            setIsAdmin(true);
            await Promise.all([fetchQuestions(), fetchGatekeeperQuestions(), fetchUserStats()]);
        } catch (e) {
            console.error(e);
            setError('인증 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserStats = async () => {
        const supabase = createClient();
        const { data } = await supabase
            .from('users')
            .select('id, gender, region');
        if (data) {
            setUserProfiles(data);
        }
    };

    const handleRunMatchNow = async () => {
        setRunningMatch(true);
        setError('');
        setSuccessMsg('');
        try {
            const res = await fetch('/api/cron/match', { method: 'POST' });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || '매칭 배치 실행에 실패했습니다.');
            }
            setSuccessMsg(`🔮 ${data.message}`);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : '알 수 없는 오류';
            setError('매칭 배치 실행 오류: ' + msg);
        } finally {
            setRunningMatch(false);
        }
    };

    const fetchQuestions = async () => {
        const supabase = createClient();
        const { data, error: fetchErr } = await supabase
            .from('daily_questions')
            .select('*')
            .order('created_at', { ascending: false });

        if (fetchErr) {
            console.error(fetchErr);
        } else {
            setQuestions(data || []);
        }
    };

    const fetchGatekeeperQuestions = async () => {
        const supabase = createClient();
        const { data, error: fetchErr } = await supabase
            .from('gatekeeper_questions')
            .select('*')
            .order('created_at', { ascending: false });

        if (fetchErr) {
            console.error(fetchErr);
        } else {
            setGatekeeperQuestions(data || []);
        }
    };

    const handleAddQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newQuestion.trim()) return;

        setAdding(true);
        setError('');
        setSuccessMsg('');
        try {
            const supabase = createClient();
            const { error: insertError } = await supabase
                .from('daily_questions')
                .insert([{ question_text: newQuestion.trim(), category }]);

            if (insertError) throw insertError;

            setNewQuestion('');
            setSuccessMsg('새 데일리 질문이 등록되었습니다.');
            await fetchQuestions();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : '알 수 없는 오류';
            setError('질문 등록에 실패했습니다: ' + msg);
        } finally {
            setAdding(false);
        }
    };

    const handleAddGatekeeperQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!optionA.trim() || !optionB.trim()) return;

        setAdding(true);
        setError('');
        setSuccessMsg('');
        try {
            const supabase = createClient();
            const { error: insertError } = await supabase
                .from('gatekeeper_questions')
                .insert([
                    {
                        option_a: optionA.trim(),
                        option_b: optionB.trim(),
                        is_active: true,
                    },
                ]);

            if (insertError) throw insertError;

            setOptionA('');
            setOptionB('');
            setSuccessMsg('새 관문 밸런스 질문이 등록되었습니다.');
            await fetchGatekeeperQuestions();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : '알 수 없는 오류';
            setError('관문 질문 등록에 실패했습니다: ' + msg);
        } finally {
            setAdding(false);
        }
    };

    const handleToggleGatekeeperActive = async (item: GatekeeperQuestion) => {
        setError('');
        setSuccessMsg('');
        try {
            const supabase = createClient();
            const { error: updateErr } = await supabase
                .from('gatekeeper_questions')
                .update({ is_active: !item.is_active })
                .eq('id', item.id);

            if (updateErr) throw updateErr;
            await fetchGatekeeperQuestions();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : '알 수 없는 오류';
            setError('상태 변경에 실패했습니다: ' + msg);
        }
    };

    const handleSeedTrendQuestions = async () => {
        setAdding(true);
        setError('');
        setSuccessMsg('');
        try {
            const supabase = createClient();
            const existingSet = new Set(
                gatekeeperQuestions.map((q) => `${q.option_a}|${q.option_b}`)
            );
            const toInsert = TREND_PRESET_QUESTIONS.filter(
                (p) => !existingSet.has(`${p.option_a}|${p.option_b}`)
            ).map((p) => ({ ...p, is_active: true }));

            if (toInsert.length === 0) {
                setSuccessMsg('이미 모든 추천 트렌드 질문이 등록되어 있습니다.');
                return;
            }

            const { error: insertErr } = await supabase
                .from('gatekeeper_questions')
                .insert(toInsert);

            if (insertErr) throw insertErr;
            setSuccessMsg(`${toInsert.length}개의 최신 트렌드 밸런스 질문이 추가되었습니다!`);
            await fetchGatekeeperQuestions();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : '알 수 없는 오류';
            setError('트렌드 질문 일괄 추가 실패: ' + msg);
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

    const totalUsers = userProfiles.length;
    const maleCount = userProfiles.filter((u) => u.gender === 'male').length;
    const femaleCount = userProfiles.filter((u) => u.gender === 'female').length;
    const maleRatio = totalUsers > 0 ? Math.round((maleCount / totalUsers) * 100) : 50;
    const femaleRatio = totalUsers > 0 ? Math.round((femaleCount / totalUsers) * 100) : 50;

    return (
        <div className="min-h-screen bg-[var(--color-background)] px-6 py-12">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--color-text)]">관리자 대시보드</h1>
                        <p className="text-[var(--color-text-secondary)] mt-2">
                            성비 현황 모니터링 · 수동 매칭 실행 · 트렌드 질문 관리
                        </p>
                    </div>
                    <button onClick={() => router.push('/home')} className="text-sm text-[var(--color-primary)] hover:underline">
                        앱으로 돌아가기
                    </button>
                </div>

                {/* 📊 실시간 성비 & 원클릭 매칭 컨트롤 패널 */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                        <div>
                            <span className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider">
                                LIVE OPERATIONS
                            </span>
                            <h2 className="text-lg font-bold text-[var(--color-text)] mt-0.5">
                                실시간 가입자 성비 & 매칭 컨트롤러
                            </h2>
                        </div>
                        <button
                            type="button"
                            disabled={runningMatch}
                            onClick={handleRunMatchNow}
                            className="py-3 px-5 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white text-xs sm:text-sm font-bold shadow-md hover:opacity-90 disabled:opacity-50 transition-all shrink-0"
                        >
                            {runningMatch ? '공명 매칭 실행 중...' : '⚡ 지금 즉시 공명 매칭 실행'}
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="p-3.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-center">
                            <p className="text-xs text-[var(--color-text-secondary)] mb-1">총 가입자</p>
                            <p className="text-xl font-bold text-[var(--color-text)]">{totalUsers}명</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-center">
                            <p className="text-xs text-[var(--color-text-secondary)] mb-1">남성 👨</p>
                            <p className="text-xl font-bold text-blue-600">{maleCount}명 ({maleRatio}%)</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-center">
                            <p className="text-xs text-[var(--color-text-secondary)] mb-1">여성 👩</p>
                            <p className="text-xl font-bold text-rose-500">{femaleCount}명 ({femaleRatio}%)</p>
                        </div>
                    </div>

                    {/* 성비 밸런스 게이지 */}
                    <div>
                        <div className="flex justify-between text-[11px] font-semibold text-[var(--color-text-secondary)] mb-1.5">
                            <span>남성 {maleRatio}%</span>
                            <span>성비 밸런스 (이상적 비율 50 : 50)</span>
                            <span>여성 {femaleRatio}%</span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-rose-200 overflow-hidden flex">
                            <div
                                className="h-full bg-blue-500 transition-all duration-500"
                                style={{ width: `${maleRatio}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* 탭 전환 */}
                <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] mb-8">
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab('gatekeeper');
                            setError('');
                            setSuccessMsg('');
                        }}
                        className={`py-3 rounded-xl text-sm font-bold transition-all ${
                            activeTab === 'gatekeeper'
                                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                        }`}
                    >
                        ⚖️ 관문 밸런스 질문 ({gatekeeperQuestions.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab('daily');
                            setError('');
                            setSuccessMsg('');
                        }}
                        className={`py-3 rounded-xl text-sm font-bold transition-all ${
                            activeTab === 'daily'
                                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                        }`}
                    >
                        💭 데일리 질문 ({questions.length})
                    </button>
                </div>

                {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">{error}</div>}
                {successMsg && <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl text-sm border border-green-100">{successMsg}</div>}

                {activeTab === 'gatekeeper' ? (
                    <>
                        {/* 관문 밸런스 질문 추가 폼 */}
                        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-[var(--color-text)]">
                                    새 관문(밸런스) 질문 등록
                                </h2>
                                <button
                                    type="button"
                                    disabled={adding}
                                    onClick={handleSeedTrendQuestions}
                                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--color-primary-subtle)] text-[var(--color-primary)] hover:opacity-80 transition-opacity"
                                >
                                    ✨ 최신 연애 트렌드 질문 일괄 추가
                                </button>
                            </div>

                            <form onSubmit={handleAddGatekeeperQuestion} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
                                            선택지 A
                                        </label>
                                        <input
                                            type="text"
                                            value={optionA}
                                            onChange={(e) => setOptionA(e.target.value)}
                                            placeholder="예: 연락은 칼답이 기본 ⚡"
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
                                            선택지 B
                                        </label>
                                        <input
                                            type="text"
                                            value={optionB}
                                            onChange={(e) => setOptionB(e.target.value)}
                                            placeholder="예: 서로 여유 있을 때 답장 ☕"
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] text-sm"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={adding || !optionA.trim() || !optionB.trim()}
                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white font-bold shadow-md hover:opacity-90 disabled:opacity-50 transition-all text-sm"
                                >
                                    {adding ? '등록 중...' : '관문 밸런스 질문 추가하기'}
                                </button>
                            </form>
                        </div>

                        {/* 관문 질문 목록 (활성/비활성 토글) */}
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-[var(--color-text)]">
                                관문 질문 풀 ({gatekeeperQuestions.filter((q) => q.is_active).length}개 활성 / 총 {gatekeeperQuestions.length}개)
                            </h2>
                            <span className="text-xs text-[var(--color-text-secondary)]">
                                활성(ON) 질문 중에서 커플별로 5개가 고정 배정됩니다
                            </span>
                        </div>

                        <div className="space-y-3">
                            {gatekeeperQuestions.map((gq) => (
                                <div
                                    key={gq.id}
                                    className={`p-4 rounded-xl bg-[var(--color-surface)] border flex items-center justify-between gap-4 transition-opacity ${
                                        gq.is_active
                                            ? 'border-[var(--color-border)]'
                                            : 'border-[var(--color-border)] opacity-55'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className="px-3 py-1.5 rounded-lg bg-[var(--color-background)] text-sm font-semibold text-[var(--color-text)]">
                                            {gq.option_a}
                                        </span>
                                        <span className="text-xs font-bold text-[var(--color-primary)]">
                                            VS
                                        </span>
                                        <span className="px-3 py-1.5 rounded-lg bg-[var(--color-background)] text-sm font-semibold text-[var(--color-text)]">
                                            {gq.option_b}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleToggleGatekeeperActive(gq)}
                                        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                                            gq.is_active
                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                        }`}
                                    >
                                        {gq.is_active ? '활성 ON' : '비활성 OFF'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        {/* 데일리 질문 추가 폼 */}
                        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm mb-10">
                            <h2 className="text-lg font-bold text-[var(--color-text)] mb-4">새 데일리 질문 등록</h2>
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
                        <h2 className="text-lg font-bold text-[var(--color-text)] mb-4">등록된 데일리 질문 리스트 ({questions.length})</h2>
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
                    </>
                )}
            </div>
        </div>
    );
}
