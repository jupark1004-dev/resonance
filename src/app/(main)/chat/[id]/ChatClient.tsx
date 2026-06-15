'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Message } from '@/types';

export default function ChatClient({
    matchId,
    currentUserId,
    partnerId,
    partnerNickname,
    initialMessages
}: {
    matchId: string;
    currentUserId: string;
    partnerId: string;
    partnerNickname: string;
    initialMessages: Message[];
}) {
    const router = useRouter();
    const supabase = createClient();
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [isPartnerTyping, setIsPartnerTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 스크롤 맨 아래로 이동
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 실시간 구독 설정
    useEffect(() => {
        const channel = supabase
            .channel(`match_${matchId}`)
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
                    // 상대방 메시지가 오면 타이핑 상태 해제
                    if (newMsg.sender_id === partnerId) {
                        setIsPartnerTyping(false);
                    }
                    // 내가 보낸 메시지는 로컬 상태에 먼저 추가하므로 중복 방지
                    setMessages((prev) => {
                        if (prev.find(m => m.id === newMsg.id || (m.content === newMsg.content && m.sender_id === newMsg.sender_id && m.id.startsWith('temp-')))) return prev;
                        return [...prev, newMsg];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [matchId, supabase]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        const text = newMessage.trim();
        setNewMessage('');
        
        // 낙관적 UI 업데이트 (임시 ID 부여)
        const tempId = `temp-${Date.now()}`;
        setMessages(prev => [...prev, {
            id: tempId,
            match_id: matchId,
            sender_id: currentUserId,
            content: text,
            created_at: new Date().toISOString()
        }]);

        setSending(true);

        // 시뮬레이션 봇인 경우 타이핑 인디케이터 표시
        const isBot = partnerNickname === '겨울밤바다' || partnerNickname.startsWith('dummy_');
        if (isBot) {
            setIsPartnerTyping(true);
        }

        try {
            // API를 통해 메시지 전송 (시뮬레이션 봇 연동을 위함)
            const res = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId, content: text, partnerId })
            });
            
            // 만약 API 실패 시, 로컬 에러 처리 및 임시 메시지 삭제 필요 (생략)
            if (!res.ok) {
                console.error('메시지 전송 실패');
                setIsPartnerTyping(false);
            }
        } catch (error) {
            console.error('Send error:', error);
            setIsPartnerTyping(false);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[var(--color-background)]">
            {/* 헤더 */}
            <div className="fixed top-0 left-0 right-0 z-10 bg-[var(--color-surface)]/90 backdrop-blur-md border-b border-[var(--color-border)]">
                <div className="max-w-lg mx-auto flex items-center h-14 px-4">
                    <button 
                        onClick={() => router.push('/match')}
                        className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full hover:bg-[var(--color-background)] transition-colors text-[var(--color-text)]"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                    <div className="flex-1 text-center font-bold text-[var(--color-text)]">
                        {partnerNickname}
                    </div>
                    <div className="w-10 h-10" /> {/* 우측 여백 맞춤 */}
                </div>
            </div>

            {/* 채팅 영역 */}
            <div className="flex-1 overflow-y-auto px-4 pt-20 pb-24 max-w-lg mx-auto w-full">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in opacity-50">
                        <span className="text-4xl mb-3">💬</span>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                            인사가 가장 설레는 순간이죠.<br/>먼저 말을 건네보세요.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((msg, i) => {
                            const isMe = msg.sender_id === currentUserId;
                            const showProfile = !isMe && (i === 0 || messages[i-1].sender_id !== msg.sender_id);
                            
                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                                    {!isMe && (
                                        <div className="w-8 shrink-0 mr-2 flex items-end">
                                            {showProfile && (
                                                <div className="w-8 h-8 rounded-full bg-[var(--color-primary-subtle)] flex items-center justify-center text-xs">
                                                    👤
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                                        isMe 
                                            ? 'bg-[var(--color-primary)] text-white rounded-br-sm' 
                                            : 'bg-white border border-[var(--color-border)] text-[var(--color-text)] rounded-bl-sm'
                                    }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            );
                        })}
                        
                        {/* 타이핑 인디케이터 */}
                        {isPartnerTyping && (
                            <div className="flex justify-start animate-fade-in">
                                <div className="w-8 shrink-0 mr-2 flex items-end">
                                    <div className="w-8 h-8 rounded-full bg-[var(--color-primary-subtle)] flex items-center justify-center text-xs">
                                        👤
                                    </div>
                                </div>
                                <div className="px-4 py-3.5 rounded-2xl rounded-bl-sm bg-white border border-[var(--color-border)] flex items-center space-x-1 shadow-sm">
                                    <div className="w-1.5 h-1.5 bg-[var(--color-text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-1.5 h-1.5 bg-[var(--color-text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-1.5 h-1.5 bg-[var(--color-text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* 입력 영역 */}
            <div className="fixed bottom-0 left-0 right-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] pb-[env(safe-area-inset-bottom)]">
                <form onSubmit={handleSend} className="max-w-lg mx-auto p-4 flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="메시지 보내기..."
                        className="flex-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors text-[var(--color-text)]"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="w-10 h-10 shrink-0 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center disabled:opacity-50 transition-opacity hover:shadow-md"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="-ml-0.5">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
}
