import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ChatClient from './ChatClient';

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // 매칭 정보 및 상대방 확인
    const { data: match } = await supabase
        .from('matches')
        .select(`
            *,
            user_a:users!user_a_id(id, nickname),
            user_b:users!user_b_id(id, nickname)
        `)
        .eq('id', id)
        .eq('status', 'matched') // 매칭 완료 상태만 허용
        .single();

    if (!match) {
        redirect('/match');
    }

    if (match.user_a_id !== user.id && match.user_b_id !== user.id) {
        redirect('/match');
    }

    const isUserA = match.user_a_id === user.id;
    const partner = isUserA ? match.user_b : match.user_a;

    // 기존 메시지 불러오기 (최신순 50개)
    const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', id)
        .order('created_at', { ascending: false })
        .limit(50);

    return (
        <ChatClient 
            matchId={id}
            currentUserId={user.id}
            partnerId={partner.id}
            partnerNickname={partner.nickname || '익명의 누군가'}
            initialMessages={(messages || []).reverse()} 
        />
    );
}
