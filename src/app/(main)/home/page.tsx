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

    // 사용자의 전체 응답 내역 및 리포트 보유 여부 확인
    const { data: userResponses } = await supabase
        .from('responses')
        .select('id, question_id, responded_at')
        .eq('user_id', user.id)
        .order('responded_at', { ascending: false });

    const { count: reportCount } = await supabase
        .from('analysis_reports')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

    const totalResponseCount = userResponses?.length ?? 0;
    const isFirstReportJourney = (reportCount ?? 0) === 0;

    // 날짜 기반으로 질문 인덱스 결정 (매일 다른 질문)
    const today = new Date();
    const dayOfYear = Math.floor(
        (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    const answeredQuestionIds = new Set((userResponses ?? []).map((r) => r.question_id));
    let todayQuestion = null;

    if (questions && questions.length > 0) {
        if (isFirstReportJourney && totalResponseCount < 3) {
            // 첫 리포트(3개 응답) 전까지는 아직 답하지 않은 질문을 우선 배정하여 연속 답변 허용
            const unanswered = questions.find((q) => !answeredQuestionIds.has(q.id));
            todayQuestion = unanswered ?? questions[dayOfYear % questions.length];
        } else {
            const questionIndex = dayOfYear % questions.length;
            todayQuestion = questions[questionIndex] ?? null;
        }
    }

    // 오늘 이미 응답했는지 확인 (단, 첫 리포트 여정 중이고 3개 미만이면 연속 응답 가능)
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const respondedToday = (userResponses ?? []).some((r) => r.responded_at >= todayStart);
    const hasRespondedToday = isFirstReportJourney && totalResponseCount < 3
        ? false
        : respondedToday;

    return (
        <HomeContent
            nickname={profile.nickname}
            todayQuestion={todayQuestion}
            hasRespondedToday={hasRespondedToday}
            isFirstReportJourney={isFirstReportJourney}
            firstJourneyCount={Math.min(totalResponseCount, 3)}
        />
    );
}
