import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ReportContent from './ReportContent';

export default async function ReportPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // 모든 주간 리포트 조회 (최신순)
    const { data: reports } = await supabase
        .from('analysis_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('week_number', { ascending: false });

    // 현재 미분석 응답 수 확인
    const latestReport = reports?.[0];
    let query = supabase
        .from('responses')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id);

    if (latestReport?.created_at) {
        query = query.gt('responded_at', latestReport.created_at);
    }

    const { count: unanalyzedCount } = await query;

    // 각 리포트에 해당하는 주간 응답(이미지 포함)을 조회
    // 리포트 생성일 기준으로 이전 7일간의 응답을 가져옴
    const reportsWithImages = await Promise.all(
        (reports ?? []).map(async (report) => {
            const reportDate = new Date(report.created_at);
            const weekAgo = new Date(reportDate);
            weekAgo.setDate(weekAgo.getDate() - 8); // 넉넉히 8일

            const { data: weekResponses } = await supabase
                .from('responses')
                .select(`
                    *,
                    question:daily_questions(question_text, category)
                `)
                .eq('user_id', user.id)
                .gte('responded_at', weekAgo.toISOString())
                .lte('responded_at', reportDate.toISOString())
                .order('responded_at', { ascending: true });

            return {
                ...report,
                weekResponses: weekResponses ?? [],
            };
        })
    );

    return (
        <ReportContent
            reports={reportsWithImages}
            unanalyzedCount={unanalyzedCount ?? 0}
        />
    );
}
