import { NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

export const DEEP_DAILY_QUESTIONS_PRESET: {
    category: 'emotion' | 'relationship' | 'space' | 'time';
    question_text: string;
}[] = [
    // 감정 (emotion)
    { category: 'emotion', question_text: '오늘 하루 중 가장 마음이 따뜻해진 순간은 언제였나요?' },
    { category: 'emotion', question_text: '요즘 반복해서 듣는 노래가 있다면, 그 노래가 지금의 기분과 어떻게 연결되나요?' },
    { category: 'emotion', question_text: '오늘 느낀 감정 중 가장 강렬했던 것을 색깔로 표현한다면 어떤 색인가요?' },
    { category: 'emotion', question_text: '마지막으로 진심으로 소리 내어 웃었던 순간은 언제였나요?' },
    { category: 'emotion', question_text: '최근 마음속으로 조용히 삼켜버렸던 다정한 말 한마디가 있다면 적어주세요.' },
    { category: 'emotion', question_text: '남들은 잘 모르지만 나만의 기분을 금방 좋아지게 만드는 사소한 루틴은 무엇인가요?' },
    { category: 'emotion', question_text: '유독 마음이 지치는 날, 나에게 가장 큰 위로가 되는 것은 말인가요, 침묵인가요?' },
    { category: 'emotion', question_text: '요즘 내가 가장 지키고 싶은 내 마음의 평화는 어떤 모습인가요?' },

    // 관계 (relationship)
    { category: 'relationship', question_text: '가장 최근에 누군가에게 진심으로 고마웠던 순간을 떠올려 보세요.' },
    { category: 'relationship', question_text: '당신이 사랑하는 사람에게 가장 듣고 싶은 말은 무엇인가요?' },
    { category: 'relationship', question_text: '당신이 생각하는 "좋은 관계"의 가장 중요한 조건은 무엇인가요?' },
    { category: 'relationship', question_text: '만약 누군가 당신의 마음을 읽을 수 있다면, 지금 가장 들키고 싶은 생각은 무엇인가요?' },
    { category: 'relationship', question_text: '관계에 있어 당신이 생각하는 가장 편안하고 완벽한 적정 거리는 몇 걸음 정도인가요?' },
    { category: 'relationship', question_text: '처음 만난 사람에게서 "이 사람과 결이 비슷하다"고 느끼는 순간은 언제인가요?' },
    { category: 'relationship', question_text: '서로 다른 두 사람이 오래도록 함께하기 위해 가장 필요한 태도는 무엇이라고 생각하나요?' },
    { category: 'relationship', question_text: '누군가를 좋아하게 될 때, 당신의 행동이나 말투에서 나타나는 작은 변화가 있나요?' },

    // 공간 (space)
    { category: 'space', question_text: '당신이 세상의 소음으로부터 가장 편안함을 느끼는 장소는 어디인가요?' },
    { category: 'space', question_text: '지금 창밖을 본다면, 어떤 풍경이 당신을 가장 위로해줄 것 같나요?' },
    { category: 'space', question_text: '가장 기억에 남는 여행지의 한 장면을 글이나 사진으로 묘사한다면?' },
    { category: 'space', question_text: '당신에게 "집"이란 어떤 의미를 가진 공간인가요?' },
    { category: 'space', question_text: '비가 오는 날, 창가에 앉아 듣고 싶은 단 하나의 백색소음은 어떤 소리인가요?' },
    { category: 'space', question_text: '소중한 사람과 아무 말 없이 나란히 앉아 있고 싶은 장소는 어디인가요?' },
    { category: 'space', question_text: '계절이 바뀔 때마다 꼭 한 번씩 걷고 싶어지는 길이 있나요?' },

    // 시간 (time)
    { category: 'time', question_text: '만약 시간을 되돌릴 수 있다면, 다시 한 번 살아보고 싶은 하루는 언제인가요?' },
    { category: 'time', question_text: '10년 후의 나에게 짧은 편지를 쓴다면, 첫 문장은 무엇일까요?' },
    { category: 'time', question_text: '어제의 나와 오늘의 나 사이에서 아주 작게라도 달라진 점이 있다면 무엇인가요?' },
    { category: 'time', question_text: '과거로 돌아가 단 1분 동안 그 시절의 나를 안아줄 수 있다면, 언제의 나를 안아주고 싶나요?' },
    { category: 'time', question_text: '하루 중 당신의 감성이 가장 깊어지는 시간대는 언제인가요?' },
    { category: 'time', question_text: '일 년 중 당신의 마음을 가장 설레게 하는 계절과 그 이유는 무엇인가요?' },
    { category: 'time', question_text: '다가오는 주말, 오직 나만을 위해 비워두고 싶은 두 시간이 있다면 무엇을 하고 싶나요?' },
];

export const TREND_GATEKEEPER_PRESET = [
    { option_a: '연락은 칼답이 기본 ⚡', option_b: '서로 여유 있을 때 답장 ☕' },
    { option_a: '웨이팅 1시간 핫플 맛집 🍲', option_b: '바로 들어가는 조용한 식당 🌿' },
    { option_a: '갈등은 그날 바로 대화로 🔥', option_b: '생각 정리 후 차분히 대화 🌙' },
    { option_a: '주말엔 밖에서 데이트 🚗', option_b: '주말엔 집에서 힐링 충전 🏠' },
    { option_a: '분위기 좋은 와인바 🍷', option_b: '정겨운 포장마차 우동 🍢' },
    { option_a: '분 단위 완벽 계획 여행 📝', option_b: '발길 닿는 대로 즉흥 여행 ✈️' },
    { option_a: '고민 상담은 따뜻한 공감 🫂', option_b: '고민 상담은 현실적 해결책 💡' },
];

async function verifyAdminAndGetClient() {
    const serverSupabase = await createServerClient();
    const {
        data: { user },
    } = await serverSupabase.auth.getUser();

    if (!user) {
        return { authorized: false as const, error: '로그인이 필요합니다.', status: 401 };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const dbClient = supabaseServiceKey
        ? createSupabaseAdmin(supabaseUrl, supabaseServiceKey)
        : serverSupabase;

    const allowedEmails = [
        process.env.NEXT_PUBLIC_ADMIN_EMAIL,
        'admin@resonance.com',
        'jupark1004@gmail.com',
        'jupark1004@gamil.com',
        'jupark1004@naver.com',
        'chb2049@naver.com',
    ].filter(Boolean);

    const { data: myProfile } = await dbClient
        .from('users')
        .select('nickname')
        .eq('id', user.id)
        .maybeSingle();

    const isAuthorized =
        allowedEmails.includes(user.email) || myProfile?.nickname === '굽다만감자';

    if (!isAuthorized) {
        return {
            authorized: false as const,
            error: `현재 로그인된 계정(${user.email})에는 관리자 권한이 없습니다.`,
            status: 403,
        };
    }

    return { authorized: true as const, dbClient };
}

// 어드민 대시보드 데이터 통합 조회 (RLS에 막히지 않도록 서버에서 Service Role로 조회)
export async function GET() {
    const auth = await verifyAdminAndGetClient();
    if (!auth.authorized) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { dbClient } = auth;

    const [questionsRes, gatekeeperRes, usersRes] = await Promise.all([
        dbClient.from('daily_questions').select('*').order('created_at', { ascending: false }),
        dbClient.from('gatekeeper_questions').select('*').order('created_at', { ascending: false }),
        dbClient.from('users').select('id, gender, region'),
    ]);

    return NextResponse.json({
        success: true,
        questions: questionsRes.data ?? [],
        gatekeeperQuestions: gatekeeperRes.data ?? [],
        userProfiles: usersRes.data ?? [],
    });
}

// 어드민 질문 추가 / 일괄 확충 / 관문 ON·OFF 상태 토글
export async function POST(request: Request) {
    const auth = await verifyAdminAndGetClient();
    if (!auth.authorized) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { dbClient } = auth;

    try {
        const body = await request.json();
        const { action } = body;

        if (action === 'add_daily') {
            const { question_text, category } = body;
            const { error } = await dbClient
                .from('daily_questions')
                .insert([{ question_text: String(question_text).trim(), category }]);
            if (error) throw error;
            return NextResponse.json({ success: true, message: '새 데일리 질문이 등록되었습니다.' });
        }

        if (action === 'seed_daily_30') {
            const { data: existing } = await dbClient
                .from('daily_questions')
                .select('question_text');
            const existingSet = new Set((existing ?? []).map((q) => q.question_text.trim()));
            const toInsert = DEEP_DAILY_QUESTIONS_PRESET.filter(
                (p) => !existingSet.has(p.question_text.trim())
            );

            if (toInsert.length === 0) {
                return NextResponse.json({
                    success: true,
                    message: '이미 30선 심층 데일리 질문이 모두 등록되어 있습니다.',
                });
            }

            const { error } = await dbClient.from('daily_questions').insert(toInsert);
            if (error) throw error;

            return NextResponse.json({
                success: true,
                message: `✨ ${toInsert.length}개의 심층 내면 데일리 질문이 새로 확충되었습니다!`,
            });
        }

        if (action === 'add_gatekeeper') {
            const { option_a, option_b } = body;
            const { error } = await dbClient.from('gatekeeper_questions').insert([
                {
                    option_a: String(option_a).trim(),
                    option_b: String(option_b).trim(),
                    is_active: true,
                },
            ]);
            if (error) throw error;
            return NextResponse.json({ success: true, message: '새 관문 밸런스 질문이 등록되었습니다.' });
        }

        if (action === 'toggle_gatekeeper') {
            const { id, is_active } = body;
            const { error } = await dbClient
                .from('gatekeeper_questions')
                .update({ is_active: Boolean(is_active) })
                .eq('id', id);
            if (error) throw error;
            return NextResponse.json({ success: true, message: '관문 질문 상태가 변경되었습니다.' });
        }

        if (action === 'seed_gatekeeper_trend') {
            const { data: existing } = await dbClient
                .from('gatekeeper_questions')
                .select('option_a, option_b');
            const existingSet = new Set(
                (existing ?? []).map((q) => `${q.option_a}|${q.option_b}`)
            );
            const toInsert = TREND_GATEKEEPER_PRESET.filter(
                (p) => !existingSet.has(`${p.option_a}|${p.option_b}`)
            ).map((p) => ({ ...p, is_active: true }));

            if (toInsert.length === 0) {
                return NextResponse.json({
                    success: true,
                    message: '이미 모든 최신 트렌드 밸런스 질문이 등록되어 있습니다.',
                });
            }

            const { error } = await dbClient.from('gatekeeper_questions').insert(toInsert);
            if (error) throw error;
            return NextResponse.json({
                success: true,
                message: `✨ ${toInsert.length}개의 최신 트렌드 밸런스 질문이 추가되었습니다!`,
            });
        }

        return NextResponse.json({ success: false, error: '알 수 없는 요청입니다.' }, { status: 400 });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '요청 처리 실패';
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}

