import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import HomeContent from './HomeContent';

export default async function HomePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // 사용자 프로필 조회
    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

    // 온보딩 미완료 시 리디렉트
    if (!profile?.nickname) {
        redirect('/onboarding');
    }

    // 오늘의 질문 가져오기 (날짜 기반으로 질문 하나 선택)
    const { data: questions } = await supabase
        .from('daily_questions')
        .select('*')
        .order('created_at', { ascending: true });

    // 날짜 기반으로 질문 인덱스 결정 (매일 다른 질문)
    const today = new Date();
    const dayOfYear = Math.floor(
        (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const questionIndex = questions
        ? dayOfYear % questions.length
        : 0;
    const todayQuestion = questions?.[questionIndex] ?? null;

    // 오늘 이미 응답했는지 확인
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const { data: todayResponse } = await supabase
        .from('responses')
        .select('id')
        .eq('user_id', user.id)
        .gte('responded_at', todayStart)
        .limit(1);

    const hasRespondedToday = (todayResponse?.length ?? 0) > 0;

    return (
        <HomeContent
            nickname={profile.nickname}
            todayQuestion={todayQuestion}
            hasRespondedToday={hasRespondedToday}
        />
    );
}
