import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const realAI = searchParams.get('realAI') === 'true';

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: '로그인된 상태에서 브라우저를 통해 접속해주세요!' }, { status: 401 });
        }

        // ==========================================
        // 1. 감성적인 데일리 질문 7개 주입
        // ==========================================
        const questionData = [
            { category: 'emotion', question_text: '오늘 가장 당신을 웃게 한 아주 사소한 순간은 언제였나요?' },
            { category: 'relationship', question_text: '만약 누군가 당신의 마음을 읽을 수 있다면, 지금 가장 들키고 싶은 생각은 무엇인가요?' },
            { category: 'space', question_text: '비가 오는 날, 창가에 앉아 듣고 싶은 단 하나의 백색소음은 어떤 소리인가요?' },
            { category: 'time', question_text: '과거로 돌아가 단 1분 동안 누군가를 안아줄 수 있다면, 누구를 선택하겠습니까?' },
             { category: 'emotion', question_text: '최근 마음속으로 조용히 삼켜버렸던 다정한 말 한마디가 있다면 적어주세요.' },
            { category: 'space', question_text: '당신이 가장 편안함을 느끼는 나만의 아지트는 어떤 풍경을 가지고 있나요?' },
            { category: 'relationship', question_text: '관계에 있어 당신이 생각하는 가장 완벽한 적정 거리는 몇 걸음 정도인가요?' }
        ];

        const { data: existingQuestions } = await supabase.from('daily_questions').select('id').limit(7);
        let questions = existingQuestions || [];

        if (questions.length < 7) {
            const { data: newQuestions, error: qrtErr } = await supabase
                .from('daily_questions')
                .insert(questionData)
                .select();
            if (qrtErr) console.error("Questions Error:", qrtErr);
            if (newQuestions) questions = newQuestions;
        }

        // ==========================================
        // 2. 현재 로그인된 유저의 일기(Response) 7일치 주입
        // ==========================================
        const responseTexts = [
            "출근길 라디오에서 우연히 내가 가장 좋아하는 옛날 노래가 흘러나왔을 때요.",
            "사실 요즘 조금 지쳤지만, 티 내고 싶지 않아서 씩씩하게 웃었다는 걸 누군가는 알아챘으면 좋겠어요.",
            "톡톡거리며 창문을 때리는 빗소리와 저 멀리서 들려오는 둔탁한 기차 소리요.",
            "10년 전, 혼자 밤새 울었던 그 시절의 나를 꽉 안아주고 싶어요. 다 괜찮아질 거라고.",
            "친구에게 '넌 정말 따뜻한 사람이야'라고 말하고 싶었는데 쑥스러워서 넘겨버렸네요.",
            "아무도 없는 한적한 카페의 구석 자리, 따뜻한 조명 아래요.",
            "힘들 때 손을 뻗으면 닿을 수 있지만 평소엔 너무 얽매이지 않는, 딱 세 걸음이요."
        ];

        // 7일 전부터 오늘까지 날짜 생성
        for (let i = 0; i < 7; i++) {
            if (!questions[i]) break;
            
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - (6 - i));

            // 혹시 이미 작성했는지 확인
            const { data: existingResp } = await supabase
                .from('responses')
                .select('id')
                .eq('user_id', user.id)
                .eq('question_id', questions[i].id)
                .single();

            if (!existingResp) {
                await supabase.from('responses').insert({
                    user_id: user.id,
                    question_id: questions[i].id,
                    text_response: responseTexts[i],
                    responded_at: pastDate.toISOString(),
                });
            }
        }

        // ==========================================
        // 3. AI 리포트 생성 (목업)
        // ==========================================
        if (!realAI) {
            const reportText = `**"비 오는 날의 따뜻한 우디 향 같은 사람"**\n\n이번 주 당신의 기록을 살펴보면, 겉으로는 담담해 보이지만 내면 깊은 곳에는 타인과 자신을 향한 깊은 다정함이 자리 잡고 있습니다. 혼자만의 시간(창가, 카페 구석 등)을 소중히 여기면서도, 사랑하는 사람과의 보이지 않는 연결고리('다 알아챘으면 좋겠다', '세 걸음의 거리')를 끊임없이 갈망하고 계시네요.\n\n과거의 자신을 안아주고 싶다는 당신의 바람처럼, 이번 주말은 잠시 멈춰 서서 스스로에게 가장 따뜻한 위로의 말을 건네보는 건 어떨까요? 당신의 섬세한 공감 능력이 당신의 삶을 더욱 풍성하게 만들어주고 있습니다.`;

            const { data: existingReport } = await supabase
                .from('analysis_reports')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!existingReport) {
                await supabase.from('analysis_reports').insert({
                    user_id: user.id,
                    week_number: 1,
                    report_text: reportText,
                    created_at: new Date().toISOString()
                });
            }
        }

        // ==========================================
        // 4. 가상의 매칭 파트너 생성 및 매칭 삽입 시도
        // (RLS나 FK 제약조건에 막힐 수 있으므로 try-catch)
        // ==========================================
        try {
            const fakeId = crypto.randomUUID();
            // Auth 우회해서 Public users에만 더미 넣기 시도
            const { error: dummyErr } = await supabase.from('users').insert({
                id: fakeId,
                nickname: '어스름한 새벽',
                birth_year: 1995,
                gender: 'other',
                region: '어디선가',
                created_at: new Date().toISOString()
            });

            if (!dummyErr) {
                // 더미 유저 생성이 성공했다면 매칭 데이터 주입
                const { data: matchCheck } = await supabase
                    .from('matches')
                    .select('id')
                    .eq('user_a_id', user.id)
                    .single();

                if (!matchCheck) {
                    await supabase.from('matches').insert({
                        user_a_id: user.id,
                        user_b_id: fakeId,
                        resonance_score: 98.5,
                        status: 'matched', // 채팅방을 바로 볼 수 있게 matched로 설정
                        created_at: new Date().toISOString()
                    });
                }
            }
        } catch (e) {
            console.log('Dummy matching creation skipped due to strict DB constraints', e);
        }

        return NextResponse.json({
            success: true,
            message: "홍보용 스크린샷을 위한 모든 가짜 데이터(7개 일기, 리포트, 일주일 치 질문 등)가 성공적으로 주입되었습니다! 이제 앱을 둘러보세요."
        });

    } catch (error: any) {
        console.error('Seed API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
