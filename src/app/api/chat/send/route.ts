import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
// 간단한 키워드 기반 로컬 챗봇 (API 에러 대비)
function generateLocalReply(message: string): string {
    const text = message.toLowerCase();
    if (text.includes('안녕') || text.includes('반갑')) return '안녕하세요! 기록을 보니 저랑 결이 비슷하신 것 같아 반가웠어요 😊';
    if (text.includes('어디') || text.includes('지역')) return '저는 서울에 살아요. 가까운 곳일까요?';
    if (text.includes('이름') || text.includes('누구')) return '저는 겨울밤바다라고 해요. 서로 알아가는 단계니까 천천히 대화해봐요.';
    if (text.includes('나이') || text.includes('몇살')) return '저는 95년생이에요. 비슷한 나이대이려나요?';
    if (text.includes('영화') || text.includes('넷플릭스')) return '앗 저도 그거 좋아해요! 퇴근하고 보면 진짜 힐링되죠.';
    if (text.includes('산') || text.includes('바다')) return '전 바다를 좋아해요. 겨울밤바다라는 닉네임처럼요 🌊';
    if (text.includes('콜라') || text.includes('사이다')) return '음... 전 사이다 파이긴 한데 콜라도 가끔 마셔요 ㅎㅎ';
    if (text.includes('좋아')) return '저도요! 왠지 말이 잘 통할 것 같아서 기대되네요.';
    return '아, 그러시군요! 다이어리에 적었던 내용이랑 비슷한 감성이 느껴져서 신기하네요 ㅎㅎ 또 어떤 이야기들이 있을지 궁금해요.';
}

export async function POST(request: Request) {
    try {
        const { matchId, content, partnerId } = await request.json();
        
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || !matchId || !content) {
            return NextResponse.json({ success: false, error: '잘못된 요청입니다.' }, { status: 400 });
        }

        // 1. 사용자 메시지 저장
        const { error: insertError } = await supabase
            .from('messages')
            .insert({
                match_id: matchId,
                sender_id: user.id,
                content: content
            });

        if (insertError) {
            return NextResponse.json({ success: false, error: '메시지 저장 실패' }, { status: 500 });
        }

        // 2. 상대방이 봇인지 확인 (시뮬레이션 처리)
        // 시뮬레이션임을 확인하기 위해 파트너 정보를 가져옴
        const { data: partner } = await supabase
            .from('users')
            .select('nickname')
            .eq('id', partnerId)
            .single();

        // 시뮬레이션용 봇인지 판단
        const isSimulation = partner?.nickname === '겨울밤바다' || partner?.nickname?.startsWith('dummy_');

        if (isSimulation) {
            // 비동기로 백그라운드에서 봇 응답 처리
            // Vercel 환경에서는 비동기 처리가 끊길 수 있으므로 Edge 함수로 변경하거나 바로 await 처리
            // 여기서는 사용자 경험(딜레이)을 위해 바로 await 후 응답
            
            // 약간의 타이핑 지연 시간 (1.5초)
            await new Promise(resolve => setTimeout(resolve, 1500));

            // 실제로는 Claude API를 써서 답장을 생성할 수 있음.
            // 여기서는 MVP 수준의 키워드 기반 로컬 응답을 사용.
            let botReply = generateLocalReply(content);

            // API 키가 있다면 Claude로 챗봇 응답 시도 (옵션)
            try {
                if (process.env.ANTHROPIC_API_KEY) {
                    const response = await fetch('https://api.anthropic.com/v1/messages', {
                        method: 'POST',
                        headers: {
                            'x-api-key': process.env.ANTHROPIC_API_KEY,
                            'anthropic-version': '2023-06-01',
                            'content-type': 'application/json'
                        },
                        body: JSON.stringify({
                            model: 'claude-3-haiku-20240307', // 가장 빠르고 저렴한 모델
                            max_tokens: 150,
                            system: "너는 RESONANCE 앱을 통해 방금 매칭된 20대 후반 여성 사용자 '겨울밤바다'야. 데이팅 앱이 아니라 감성적인 일기장 앱에서 결이 맞아 매칭된 거니까 소개팅처럼 딱딱하게 굴지 말고, 동네 친구나 예전부터 알던 사람처럼 다정하고 차분하게 대답해. 한두 문장으로 짧게 이모티콘을 섞어서 자연스럽게 반응해줘.",
                            messages: [
                                { role: 'user', content: content }
                            ]
                        })
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        botReply = data.content[0].text;
                    }
                }
            } catch (e) {
                console.error('Claude Chat API Error:', e);
                // 에러 시 로컬 폴백 유지
            }

            // 봇 메시지 저장
            await supabase
                .from('messages')
                .insert({
                    match_id: matchId,
                    sender_id: partnerId,
                    content: botReply
                });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Send message error:', error);
        return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 });
    }
}
