import React, { useState, useEffect, useRef, useCallback } from 'react';
import { chatApi } from '../utils/api';
import type { ChatMessage } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import type { User } from '../types';

interface InlineChatProps {
    friend: User;
    onBack?: () => void;
}

const InlineChat: React.FC<InlineChatProps> = ({ friend, onBack }) => {
    const { user: currentUser } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchMessages = useCallback(async () => {
        try {
            const msgs = await chatApi.getMessages(friend.id);
            setMessages(msgs);
            setError(null);
        } catch (e: any) {
            setError('No se pudieron cargar los mensajes.');
        } finally {
            setLoading(false);
        }
    }, [friend.id]);

    // Reset al cambiar de amigo
    useEffect(() => {
        setMessages([]);
        setInput('');
        setLoading(true);
        setError(null);
    }, [friend.id]);

    useEffect(() => {
        fetchMessages();
        pollingRef.current = setInterval(fetchMessages, 3000);
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [fetchMessages]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        const text = input.trim();
        if (!text || sending) return;
        setSending(true);
        setInput('');
        try {
            const newMsg = await chatApi.sendMessage(friend.id, text);
            setMessages(prev => [...prev, newMsg]);
        } catch (e: any) {
            setError(e?.response?.data?.error || 'Error al enviar el mensaje.');
            setInput(text);
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        if (d.toDateString() === today.toDateString()) return 'Hoy';
        if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
        return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
    };

    // Agrupar mensajes por fecha
    const grouped: { date: string; msgs: ChatMessage[] }[] = [];
    messages.forEach(msg => {
        const dateLabel = formatDate(msg.created_at);
        const last = grouped[grouped.length - 1];
        if (last && last.date === dateLabel) {
            last.msgs.push(msg);
        } else {
            grouped.push({ date: dateLabel, msgs: [msg] });
        }
    });

    const friendAvatar =
        friend.avatar_url || `https://ui-avatars.com/api/?name=${friend.username}&background=random`;



    return (
        <div className="inline-chat">
            {/* Mini header con info del amigo */}
            <div className="inline-chat-header">
                {onBack && (
                    <button className="inline-chat-back-btn" onClick={onBack} aria-label="Volver">
                        ←
                    </button>
                )}
                <div className="chat-avatar-wrap">
                    <img src={friendAvatar} alt={friend.username} className="chat-avatar" />
                </div>
                <div>
                    <p className="chat-friend-name">{friend.username}</p>
                </div>
            </div>

            {/* Mensajes */}
            <div className="inline-chat-messages">
                {loading ? (
                    <div className="chat-center">
                        <div className="chat-spinner" />
                        <p>Cargando mensajes...</p>
                    </div>
                ) : error ? (
                    <div className="chat-center chat-error">
                        <span>⚠️</span>
                        <p>{error}</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="chat-center chat-empty">
                        <span className="chat-empty-icon">💬</span>
                        <p>Sé el primero en escribir algo a <strong>{friend.username}</strong>.</p>
                    </div>
                ) : (
                    grouped.map(group => (
                        <div key={group.date}>
                            <div className="chat-date-divider">
                                <span>{group.date}</span>
                            </div>
                            {group.msgs.map((msg, i) => {
                                const isMine = msg.sender_id === currentUser?.id;
                                const prev = i > 0 ? group.msgs[i - 1] : null;
                                const consecutive = prev && prev.sender_id === msg.sender_id;
                                return (
                                    <div
                                        key={msg.id}
                                        className={`chat-bubble-wrap ${isMine ? 'mine' : 'theirs'} ${consecutive ? 'consecutive' : ''}`}
                                    >
                                        {!isMine && !consecutive && (
                                            <img
                                                src={msg.sender_avatar || `https://ui-avatars.com/api/?name=${msg.sender_username}&background=random`}
                                                alt={msg.sender_username ?? ''}
                                                className="bubble-avatar"
                                            />
                                        )}
                                        {!isMine && consecutive && <div className="bubble-avatar-spacer" />}
                                        <div className="chat-bubble-col">
                                            {!isMine && !consecutive && (
                                                <span className="bubble-sender">{msg.sender_username}</span>
                                            )}
                                            <div className={`chat-bubble ${isMine ? 'bubble-mine' : 'bubble-theirs'}`}>
                                                <p>{msg.content}</p>
                                                <span className="bubble-time">{formatTime(msg.created_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="inline-chat-footer">
                <div className="chat-input-wrap">
                    <textarea
                        ref={inputRef}
                        className="chat-input"
                        rows={1}
                        placeholder={`Escribe a ${friend.username}...`}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        maxLength={1000}
                    />
                    <button
                        className="chat-send-btn"
                        onClick={handleSend}
                        disabled={!input.trim() || sending}
                        title="Enviar (Enter)"
                    >
                        {sending ? '⏳' : '➤'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default InlineChat;
