'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const supabase = createClient();
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                if (authError.message.includes('Invalid login credentials')) {
                    setError('이메일 또는 비밀번호가 올바르지 않습니다.');
                } else {
                    setError('로그인 중 문제가 발생했습니다. 다시 시도해 주세요.');
                }
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

    return (
        <div>
            {/* 헤더 */}
            <div className="text-center mb-10">
                <Link href="/" className="inline-block mb-4">
                    <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center">
                        <svg
                            width="28"
                            height="28"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="3" />
                            <circle cx="12" cy="12" r="7" opacity="0.6" />
                            <circle cx="12" cy="12" r="11" opacity="0.3" />
                        </svg>
                    </div>
                </Link>
                <h1 className="text-2xl font-bold text-[var(--color-text)]">
                    다시 만나서 반가워요
                </h1>
                <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                    오늘도 당신의 이야기를 들려주세요
                </p>
            </div>

            {/* 로그인 폼 */}
            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label
                        htmlFor="login-email"
                        className="block text-sm font-medium text-[var(--color-text)] mb-2"
                    >
                        이메일
                    </label>
                    <input
                        id="login-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="hello@example.com"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-text-light)] transition-all duration-200"
                    />
                </div>

                <div>
                    <label
                        htmlFor="login-password"
                        className="block text-sm font-medium text-[var(--color-text)] mb-2"
                    >
                        비밀번호
                    </label>
                    <input
                        id="login-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="비밀번호를 입력해 주세요"
                        required
                        minLength={6}
                        className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-text-light)] transition-all duration-200"
                    />
                </div>

                {/* 에러 메시지 */}
                {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                        <p className="text-sm text-[var(--color-error)]">{error}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white font-semibold text-base shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                    {loading ? (
                        <span className="animate-pulse-soft">로그인 중...</span>
                    ) : (
                        '로그인'
                    )}
                </button>
            </form>

            {/* 회원가입 링크 */}
            <div className="mt-8 text-center">
                <p className="text-sm text-[var(--color-text-secondary)]">
                    아직 계정이 없으신가요?{' '}
                    <Link
                        href="/signup"
                        className="text-[var(--color-primary)] font-semibold hover:underline"
                    >
                        시작하기
                    </Link>
                </p>
            </div>
        </div>
    );
}
