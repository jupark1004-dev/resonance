import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import QuestionForm from './QuestionForm';

interface QuestionPageProps {
    searchParams: Promise<{ id?: string }>;
}

export default async function QuestionPage({ searchParams }: QuestionPageProps) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const params = await searchParams;
    const questionId = params.id;

    if (!questionId) {
        redirect('/home');
    }

    // 질문 조회
    const { data: question } = await supabase
        .from('daily_questions')
        .select('*')
        .eq('id', questionId)
        .single();

    if (!question) {
        redirect('/home');
    }

    // 오늘 이미 응답했는지 확인 (단, 첫 리포트 전 총 응답이 3개 미만이면 연속 답변 허용)
    const { data: userResponses } = await supabase
        .from('responses')
        .select('id, question_id, responded_at')
        .eq('user_id', user.id);

    const { count: reportCount } = await supabase
        .from('analysis_reports')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

    const totalResponseCount = userResponses?.length ?? 0;
    const isFirstReportJourney = (reportCount ?? 0) === 0 && totalResponseCount < 3;

    // 이미 같은 질문에 답한 경우 홈으로 이동
    const alreadyAnsweredThisQuestion = (userResponses ?? []).some(
        (r) => r.question_id === questionId
    );
    if (alreadyAnsweredThisQuestion && isFirstReportJourney) {
        redirect('/home');
    }

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const respondedToday = (userResponses ?? []).some((r) => r.responded_at >= todayStart);

    if (respondedToday && !isFirstReportJourney) {
        redirect('/home');
    }

    return <QuestionForm question={question} />;
}
