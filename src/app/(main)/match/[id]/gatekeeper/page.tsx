import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import GatekeeperClient from './GatekeeperClient';
import type { GatekeeperQuestion } from '@/types';

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
        // 이미 완료했으면 목록으로 돌려보내거나 대기 화면 표시 (여기서는 간편하게 매칭 페이지로)
        redirect('/match');
    }

    // 3. 관문 질문 5개 무작위 가져오기
    // 실제 서비스에서는 날짜별로 고정하거나 캐싱할 수 있지만, 지금은 랜덤으로 5개
    const { data: questions } = await supabase
        .from('gatekeeper_questions')
        .select('*')
        .eq('is_active', true)
        .limit(20); // 일단 여러개 가져와서 클라이언트에서 랜덤 섞기

    let selectedQuestions: GatekeeperQuestion[] = [];
    if (questions && questions.length > 0) {
        // 배열 섞기 후 5개 추출
        const shuffled = [...questions].sort(() => 0.5 - Math.random());
        selectedQuestions = shuffled.slice(0, 5);
    }

    // 만약 파트너 정보가 필요하다면
    const isUserA = match.user_a_id === user.id;
    const partner = isUserA ? match.user_b : match.user_a;

    return (
        <GatekeeperClient 
            matchId={id} 
            questions={selectedQuestions} 
            partnerNickname={partner?.nickname || '익명의 누군가'}
        />
    );
}
