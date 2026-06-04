'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        {
            name: '홈',
            href: '/home',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            )
        },
        {
            name: '기록',
            href: '/history',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
            )
        },
        {
            name: '매칭방',
            href: '/match',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
            )
        }
    ];

    // 채팅방 등 세부 라우트에서는 하단 탭바를 숨길 수 있습니다
    const isChatRoom = pathname.startsWith('/chat/');
    const isGatekeeper = pathname.includes('/gatekeeper');
    const isQuestionForm = pathname.startsWith('/question');

    if (isChatRoom || isGatekeeper || isQuestionForm) {
        return null;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-surface)]/90 backdrop-blur-md border-t border-[var(--color-border)] pb-[env(safe-area-inset-bottom)] transition-colors duration-300">
            <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${
                                isActive
                                    ? 'text-[var(--color-primary)]'
                                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                            }`}
                        >
                            <div className={`${isActive ? 'scale-110' : 'scale-100'} transition-transform duration-200`}>
                                {item.icon}
                            </div>
                            <span className="text-[10px] font-medium">{item.name}</span>
                        </Link>
                    )
                })}
            </div>
        </div>
    );
}
