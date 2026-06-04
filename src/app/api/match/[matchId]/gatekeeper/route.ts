import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ matchId: string }> }
) {
    try {
        const { matchId } = await params;
        const { answers } = await req.json();

        if (!answers || !Array.isArray(answers) || answers.length !== 3) {
            return NextResponse.json(
                { error: '잘못된 답변 형식입니다.' },
                { status: 400 }
            );
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. 매칭이 유효한지, 사용자가 포함되어 있는지 확인
        const { data: match, error: matchError } = await supabase
            .from('matches')
            .select('*')
            .eq('id', matchId)
            .single();

        if (matchError || !match) {
            return NextResponse.json({ error: '매칭을 찾을 수 없습니다.' }, { status: 404 });
        }

        if (match.user_a_id !== user.id && match.user_b_id !== user.id) {
            return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
        }

        // 2. 이미 답변을 제출했는지 확인
        const { data: existingAnswer } = await supabase
            .from('gatekeeper_answers')
            .select('id')
            .eq('match_id', matchId)
            .eq('user_id', user.id)
            .single();

        if (existingAnswer) {
            return NextResponse.json({ error: '이미 답변을 제출했습니다.' }, { status: 400 });
        }

        // 3. 답변 저장
        const { error: insertError } = await supabase
            .from('gatekeeper_answers')
            .insert({
                match_id: matchId,
                user_id: user.id,
                answers: answers
            });

        if (insertError) throw insertError;

        // 4. 상대방이 답변을 제출했는지 확인
        const { count: answerCount, error: countError } = await supabase
            .from('gatekeeper_answers')
            .select('*', { count: 'exact', head: true })
            .eq('match_id', matchId);

        if (countError) throw countError;

        let newStatus = 'gatekeeper';
        if (answerCount === 2) {
            newStatus = 'matched';
        }

        // 5. 매칭 상태 업데이트
        const { error: updateError } = await supabase
            .from('matches')
            .update({ status: newStatus })
            .eq('id', matchId);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, status: newStatus });
    } catch (error: any) {
        console.error('Gatekeeper API Error:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
