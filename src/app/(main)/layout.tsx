import BottomNav from '@/components/ui/BottomNav';
import ThemeSelector from '@/components/ui/ThemeSelector';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 혹시라도 세션이 없는 사용자가 접근하면 로그인 페이지로 돌려보냅니다
    if (!user) {
        redirect('/login');
    }

    return (
        <div className="relative min-h-screen bg-[var(--color-background)] pb-16 sm:pb-0">
            {/* 
              모바일에서는 pb-16 (BottomNav 높이 여백)을 줘서 
              가장 아래 컨텐츠가 탭바에 가려지지 않게 합니다.
            */}
            
            {/* 메인 컨텐츠 */}
            <main className="w-full max-w-lg mx-auto relative h-full min-h-screen bg-[var(--color-surface)] md:border-x md:border-[var(--color-border)] shadow-sm shadow-[var(--color-border)] transition-colors duration-300">
                {/* 테마 선택 버튼 — 우측 상단 고정 */}
                <div className="absolute top-4 right-4 z-30">
                    <ThemeSelector />
                </div>

                {children}
            </main>

            {/* 하단 탭바 (특정 페이지에서는 내부 설정에 의해 숨겨집니다) */}
            <BottomNav />
        </div>
    );
}
