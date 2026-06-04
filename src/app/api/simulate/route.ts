import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createVanillaClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
        }

        // 바닐라 클라이언트 생성 (쿠키/세션 영향 안 줌)
        const vanillaClient = createVanillaClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // 1. 가짜 사용자(상대방) 회원가입
        const dummyEmail = `dummy_${Date.now()}@resonance.app`;
        const { data: dummyAuth, error: signUpError } = await vanillaClient.auth.signUp({
            email: dummyEmail,
            password: 'password123'
        });

        if (signUpError || !dummyAuth.user) {
            return NextResponse.json({ success: false, error: '가상 사용자 생성 실패', details: signUpError }, { status: 500 });
        }

        const dummyUserId = dummyAuth.user.id;

        // 2. 가짜 사용자 프로필 업데이트
        const { error: profileError } = await vanillaClient
            .from('users')
            .update({
                nickname: '겨울밤바다',
                birth_year: 1995,
                gender: 'female',
                region: '서울'
            })
            .eq('id', dummyUserId);

        if (profileError) {
            return NextResponse.json({ success: false, error: '가상 사용자 프로필 업데이트 실패' }, { status: 500 });
        }

        // 3. 매칭 데이터 생성 (현재 접속 중인 사용자 <-> 가짜 사용자)
        const { error: matchError } = await supabase
            .from('matches')
            .insert({
                user_a_id: user.id,
                user_b_id: dummyUserId,
                resonance_score: 92.5,
                match_reason: "최근 기록에서 '위로', '따뜻함', '새벽'이라는 공통된 감정의 주파수가 발견되었어요. 특히 혼자만의 시간을 소중히 여기면서도, 깊은 대화를 나눌 수 있는 사람을 기다리는 마음이 서로 닿았습니다.",
                status: 'gatekeeper' // 시뮬레이션을 위해 바로 관문 단계로 설정
            });

        if (matchError) {
            return NextResponse.json({ success: false, error: '매칭 데이터 생성 실패', details: matchError }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: '시뮬레이션 매칭 완료!' });
    } catch (error) {
        console.error('Simulation error:', error);
        return NextResponse.json({ success: false, error: '시뮬레이션 중 알 수 없는 오류 발생' }, { status: 500 });
    }
}
