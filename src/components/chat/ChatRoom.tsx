'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

type Message = {
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
};

export default function ChatRoom({
    matchId,
    currentUserId,
    partnerName
}: {
    matchId: string;
    currentUserId: string;
    partnerName: string;
}) {
    const supabase = createClient();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const loadMessages = async () => {
        const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('match_id', matchId)
            .order('created_at', { ascending: true });
        
        if (data) setMessages(data);
    };

    useEffect(() => {
        loadMessages();

        // 실시간 구독
        const channel = supabase
            .channel(`chat_${matchId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `match_id=eq.${matchId}`
                },
                (payload) => {
                    const newMsg = payload.new as Message;
                    // 내가 보낸 메시지는 로컬 상태 업데이트로 이미 반영되었을 수 있으므로 중복 방지 필요
                    setMessages((prev) => {
                        if (prev.find(m => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [matchId]);

    // 새 메시지 시 스크롤 아래로
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        const content = newMessage.trim();
        setNewMessage(''); // 즉각적인 UI 반응성 (Optimistic UI는 복잡하니 일단 제거만)
        setIsSending(true);

        const { error } = await supabase
            .from('messages')
            .insert({
                match_id: matchId,
                sender_id: currentUserId,
                content
            });

        if (error) {
            console.error('Message send error:', error);
            // 에러 시 복구 생략, 실무에서는 에러 핸들링 추가
        }
        setIsSending(false);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-[env(safe-area-inset-top)])] sm:h-screen max-w-lg mx-auto bg-[var(--color-surface)] border-x border-[var(--color-border)]">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[var(--color-surface)]/80 backdrop-blur-md border-b border-[var(--color-border)] p-4 flex items-center justify-between">
                <a href="/match" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)]">
                    ← 돌아가기
                </a>
                <h2 className="text-lg font-bold text-[var(--color-text)]">{partnerName}</h2>
                <div className="w-16"></div> {/* balance flex */}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center text-[var(--color-text-secondary)] text-sm pt-10">
                        <p className="mb-2">관문이 열렸습니다.</p>
                        <p>이제 첫 인사를 건네보세요. 👋</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender_id === currentUserId;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                                        isMe
                                            ? 'bg-[var(--color-primary)] text-white rounded-br-sm shadow-md'
                                            : 'bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text)] rounded-bl-sm shadow-sm'
                                    }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-[var(--color-surface)] border-t border-[var(--color-border)] pb-[calc(1rem+env(safe-area-inset-bottom))]">
                <form onSubmit={handleSend} className="flex space-x-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="따뜻한 한마디를 입력하세요"
                        className="flex-1 bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-3 rounded-full focus:outline-none focus:border-[var(--color-primary)] transition-colors placeholder:text-sm"
                        disabled={isSending}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        className="bg-[var(--color-primary)] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-md hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                        <svg className="w-5 h-5 -ml-1 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
}
