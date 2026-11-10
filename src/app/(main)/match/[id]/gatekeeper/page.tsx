import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import GatekeeperClient from './GatekeeperClient';
import type { GatekeeperQuestion } from '@/types';

// DB에 활성 질문이 부족할 때 사용할 2026 트렌드 폴백 질문 풀
const FALLBACK_TREND_QUESTIONS: GatekeeperQuestion[] = [
    { id: 'trend-1', option_a: '연락은 칼답이 기본 ⚡', option_b: '서로 여유 있을 때 답장 ☕', is_active: true, created_at: '' },
    { id: 'trend-2', option_a: '웨이팅 1시간 핫플 맛집 🍲', option_b: '바로 들어가는 조용한 식당 🌿', is_active: true, created_at: '' },
    { id: 'trend-3', option_a: '갈등은 그날 바로 대화로 🔥', option_b: '생각 정리 후 차분히 대화 🌙', is_active: true, created_at: '' },
    { id: 'trend-4', option_a: '주말엔 밖에서 데이트 🚗', option_b: '주말엔 집에서 힐링 충전 🏠', is_active: true, created_at: '' },
    { id: 'trend-5', option_a: '분위기 좋은 와인바 🍷', option_b: '정겨운 포장마차 우동 🍢', is_active: true, created_at: '' },
    { id: 'trend-6', option_a: '분 단위 완벽 계획 여행 📝', option_b: '발길 닿는 대로 즉흥 여행 ✈️', is_active: true, created_at: '' },
    { id: 'trend-7', option_a: '짜장면 🍝', option_b: '짬뽕 🍜', is_active: true, created_at: '' },
    { id: 'trend-8', option_a: '고민 상담은 따뜻한 공감 🫂', option_b: '고민 상담은 현실적 해결책 💡', is_active: true, created_at: '' },
];

// matchId와 질문 ID를 조합해 항상 동일한 난수를 반환하는 결정론적 해시 함수
function seededScore(matchId: string, questionId: string): number {
    const str = `${matchId}:${questionId}`;
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

export default async function GatekeeperPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // 1. 매칭 정보 확인
    const { data: match } = await supabase
        .from('matches')
        .select(`
            *,
            user_a:users!user_a_id(id, nickname),
            user_b:users!user_b_id(id, nickname)
        `)
        .eq('id', id)
        .single();

    if (!match) {
        redirect('/match');
    }

    // 내가 포함된 매칭인지 확인
    if (match.user_a_id !== user.id && match.user_b_id !== user.id) {
        redirect('/match');
    }

    // 2. 이미 내가 답변을 완료했는지 확인
    const { data: myAnswers } = await supabase
        .from('gatekeeper_answers')
        .select('*')
        .eq('match_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

    if (myAnswers) {
        redirect('/match');
    }

    const isUserA = match.user_a_id === user.id;
    const partnerId = isUserA ? match.user_b_id : match.user_a_id;
    const partner = isUserA ? match.user_b : match.user_a;

    // 3. 활성화된 관문 질문 풀 조회 (트렌드 반영 최신 질문 포함)
    const { data: dbQuestions } = await supabase
        .from('gatekeeper_questions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(50);

    const questionPool: GatekeeperQuestion[] =
        dbQuestions && dbQuestions.length >= 5 ? dbQuestions : FALLBACK_TREND_QUESTIONS;

    // 4. 상대방이 먼저 답변한 내역이 있는지 확인
    const { data: partnerAnswerRow } = await supabase
        .from('gatekeeper_answers')
        .select('answers')
        .eq('match_id', id)
        .eq('user_id', partnerId)
        .maybeSingle();

    let selectedQuestions: GatekeeperQuestion[] = [];

    if (partnerAnswerRow?.answers && typeof partnerAnswerRow.answers === 'object') {
        // 상대방이 이미 답한 질문 ID 목록과 동일한 질문들을 우선 배정
        const partnerQuestionIds = Object.keys(partnerAnswerRow.answers as Record<string, string>);
        const poolMap = new Map(questionPool.map((q) => [q.id, q]));
        selectedQuestions = partnerQuestionIds
            .map((qId) => poolMap.get(qId))
            .filter((q): q is GatekeeperQuestion => Boolean(q));
    }

    // 상대방이 아직 답하지 않았거나 질문 매핑이 부족한 경우: matchId 시드 기반으로 커플마다 고유한 5문제 고정 추출
    if (selectedQuestions.length < 5) {
        const deterministicSorted = [...questionPool].sort(
            (a, b) => seededScore(id, a.id) - seededScore(id, b.id)
        );
        selectedQuestions = deterministicSorted.slice(0, 5);
    }

    return (
        <GatekeeperClient
            matchId={id}
            questions={selectedQuestions}
            partnerNickname={partner?.nickname || '익명의 누군가'}
        />
    );
}
