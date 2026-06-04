// 주간 분석 API — 7개 이상 응답 시 리포트 생성
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeWeeklyResponses } from '@/lib/claude/analyze';

export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: '로그인이 필요합니다.' },
                { status: 401 }
            );
        }

        // 이미 분석되지 않은 최근 7개 응답 가져오기
        // 최신 리포트의 week_number를 먼저 확인
        const { data: latestReport } = await supabase
            .from('analysis_reports')
            .select('week_number, created_at')
            .eq('user_id', user.id)
            .order('week_number', { ascending: false })
            .limit(1)
            .single();

        const nextWeekNumber = (latestReport?.week_number ?? 0) + 1;

        // 이전 리포트 이후의 응답만 가져오기
        let query = supabase
            .from('responses')
            .select(`
        *,
        question:daily_questions(question_text, category)
      `)
            .eq('user_id', user.id)
            .order('responded_at', { ascending: true });

        if (latestReport?.created_at) {
            query = query.gt('responded_at', latestReport.created_at);
        }

        const { data: responses } = await query;

        if (!responses || responses.length < 7) {
            return NextResponse.json(
                {
                    success: false,
                    error: `분석을 위해 ${7 - (responses?.length ?? 0)}개의 응답이 더 필요합니다.`,
                    currentCount: responses?.length ?? 0,
                    requiredCount: 7,
                },
                { status: 400 }
            );
        }

        // 최근 7개 응답으로 분석 실행
        const recentResponses = responses.slice(0, 7);

        const analysisData = recentResponses.map((r) => ({
            question_text: r.question?.question_text ?? '',
            category: r.question?.category ?? '',
            text_response: r.text_response,
            image_url: r.image_url,
            responded_at: r.responded_at,
        }));

        const reportText = await analyzeWeeklyResponses(analysisData);

        // 리포트 저장
        const { error: insertError } = await supabase
            .from('analysis_reports')
            .insert({
                user_id: user.id,
                report_text: reportText,
                week_number: nextWeekNumber,
            });

        if (insertError) {
            console.error('리포트 저장 실패 상세:', JSON.stringify(insertError));
            return NextResponse.json(
                { success: false, error: '리포트 저장에 실패했습니다.', detail: insertError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                report_text: reportText,
                week_number: nextWeekNumber,
            },
        });
    } catch (error) {
        console.error('분석 API 오류:', error);
        return NextResponse.json(
            { success: false, error: '분석 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
