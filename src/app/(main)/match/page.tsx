import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import MatchClientContent from './MatchClientContent';

export default async function MatchPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // 현재 접속한 유저의 매칭 조회 (pending, gatekeeper, matched)
    const { data: matches } = await supabase
        .from('matches')
        .select(`
            *,
            user_a:users!user_a_id(nickname, birth_year),
            user_b:users!user_b_id(nickname, birth_year),
            gatekeeper_answers(user_id)
        `)
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
        .in('status', ['pending', 'gatekeeper', 'matched'])
        .order('created_at', { ascending: false });

    return (
        <MatchClientContent matches={matches || []} currentUser={user} />
    );
}
