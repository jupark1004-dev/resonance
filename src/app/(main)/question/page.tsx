import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import QuestionForm from './QuestionForm';

interface QuestionPageProps {
    searchParams: Promise<{ id?: string }>;
}

export default async function QuestionPage({ searchParams }: QuestionPageProps) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const params = await searchParams;
    const questionId = params.id;

    if (!questionId) {
        redirect('/home');
    }

    // 질문 조회
    const { data: question } = await supabase
        .from('daily_questions')
        .select('*')
        .eq('id', questionId)
        .single();

    if (!question) {
        redirect('/home');
    }

    // 오늘 이미 응답했는지 확인
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const { data: existingResponse } = await supabase
        .from('responses')
        .select('id')
        .eq('user_id', user.id)
        .gte('responded_at', todayStart)
        .limit(1);

    if (existingResponse && existingResponse.length > 0) {
        redirect('/home');
    }

    return <QuestionForm question={question} />;
}
