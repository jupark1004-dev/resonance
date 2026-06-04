'use client';

import { useState } from 'react';
import { useTheme, THEMES } from './ThemeProvider';

export default function ThemeSelector() {
    const { theme, setTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            {/* 토글 버튼 */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-9 h-9 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center hover:border-[var(--color-primary-light)] hover:shadow-sm transition-all duration-300"
                aria-label="테마 변경"
            >
                <span className="text-sm">
                    {THEMES.find((t) => t.name === theme)?.emoji ?? '☀️'}
                </span>
            </button>

            {/* 드롭다운 */}
            {isOpen && (
                <>
                    {/* 배경 오버레이 (닫기용) */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    <div className="absolute right-0 top-12 z-50 w-48 py-2 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-lg animate-fade-in">
                        <p className="px-4 py-1.5 text-[10px] font-semibold text-[var(--color-text-light)] uppercase tracking-widest">
                            테마 선택
                        </p>
                        {THEMES.map((t) => (
                            <button
                                key={t.name}
                                type="button"
                                onClick={() => {
                                    setTheme(t.name);
                                    setIsOpen(false);
                                }}
                                className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors duration-200 ${
                                    theme === t.name
                                        ? 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
                                        : 'hover:bg-[var(--color-primary-subtle)]/50 text-[var(--color-text)]'
                                }`}
                            >
                                <span className="text-base">{t.emoji}</span>
                                <span className="text-sm font-medium">{t.label}</span>
                                {theme === t.name && (
                                    <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        className="ml-auto"
                                    >
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                                {/* 컬러 프리뷰 */}
                                <div
                                    className="ml-auto w-3 h-3 rounded-full border border-white/50"
                                    style={{
                                        backgroundColor: t.color,
                                        marginLeft: theme === t.name ? '0' : 'auto',
                                    }}
                                />
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
