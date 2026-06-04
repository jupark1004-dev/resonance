import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import HistoryContent from './HistoryContent';

export default async function HistoryPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // 응답 목록 조회 (질문과 조인, 최신순)
    const { data: responses } = await supabase
        .from('responses')
        .select(`
      *,
      question:daily_questions(*)
    `)
        .eq('user_id', user.id)
        .order('responded_at', { ascending: false });

    return <HistoryContent responses={responses ?? []} />;
}
