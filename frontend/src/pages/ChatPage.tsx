import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatApi, friendsApi } from '../utils/api';
import type { ChatMessage } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getGameImageUrl } from '../utils/imageUtils';
import './ChatPage.css';

interface FriendInfo {
    id: number;
    username: string;
    avatar_url?: string;
    disponibilidad?: string;
}

const ChatPage: React.FC = () => {
    const { friendId } = useParams<{ friendId: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [friendInfo, setFriendInfo] = useState<FriendInfo | null>(null);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const numericFriendId = Number(friendId);

    // Cargar info del usuario desto desde /friends, o en su defecto desde /players
    useEffect(() => {
        const loadFriendInfo = async () => {
            try {
                const data = await friendsApi.getAll();
                const found = data.friends.find((f: any) => f.id === numericFriendId);
                if (found) {
                    setFriendInfo(found);
                    return;
                }
            } catch (e) {
                console.error('No se pudo cargar info de amigos', e);
            }
            // Fallback: buscar en la lista general de jugadores
            try {
                const { playersApi } = await import('../utils/api');
                const players = await playersApi.getAll();
                const player = players.find((p: any) => p.id === numericFriendId);
                if (player) setFriendInfo(player as any);
            } catch (e) {
                console.error('No se pudo cargar info del jugador', e);
            }
        };
        if (numericFriendId) loadFriendInfo();
    }, [numericFriendId]);

    // Cargar mensajes
    const fetchMessages = useCallback(async () => {
        try {
            const msgs = await chatApi.getMessages(numericFriendId);
            setMessages(msgs);
            setError(null);
        } catch (e: any) {
            setError('No se pudieron cargar los mensajes.');
        } finally {
            setLoading(false);
        }
    }, [numericFriendId]);

    useEffect(() => {
        fetchMessages();
        // Polling cada 3 segundos para simular tiempo real
        pollingRef.current = setInterval(fetchMessages, 3000);
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [fetchMessages]);

    // Scroll automático al último mensaje
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        const text = input.trim();
        if (!text || sending) return;

        setSending(true);
        setInput('');
        try {
            const newMsg = await chatApi.sendMessage(numericFriendId, text);
            setMessages(prev => [...prev, newMsg]);
        } catch (e: any) {
            setError(e?.response?.data?.error || 'Error al enviar el mensaje.');
            setInput(text); // Restaurar texto si falla
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

    const resolveAvatarUrl = (url?: string) => {
        if (!url) return undefined;
        return url.startsWith('/static') ? getGameImageUrl(url) : url;
    };

    const friendAvatar = resolveAvatarUrl(friendInfo?.avatar_url)
        || `https://ui-avatars.com/api/?name=${friendInfo?.username ?? 'U'}&background=random`;

    const statusMap: Record<string, { label: string; cls: string }> = {
        online: { label: 'En línea', cls: 'dot-online' },
        'in-game': { label: 'En partida', cls: 'dot-ingame' },
        offline: { label: 'Desconectado', cls: 'dot-offline' },
    };
    const statusInfo = statusMap[friendInfo?.disponibilidad ?? 'offline'] ?? statusMap['offline'];

    return (
        <div className="chat-page">
            {/* Header */}
            <header className="chat-header">
                <button className="chat-back-btn" onClick={() => navigate('/friends')} title="Volver">
                    ← Amigos
                </button>

                {friendInfo && (
                    <div className="chat-friend-info">
                        <div className="chat-avatar-wrap">
                            <img src={friendAvatar} alt={friendInfo.username} className="chat-avatar" />
                            <span className={`chat-dot ${statusInfo.cls}`} />
                        </div>
                        <div>
                            <p className="chat-friend-name">{friendInfo.username}</p>
                            <p className="chat-friend-status">{statusInfo.label}</p>
                        </div>
                    </div>
                )}
            </header>

            {/* Messages area */}
            <main className="chat-messages">
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
                        <p>Sé el primero en escribir algo a <strong>{friendInfo?.username}</strong>.</p>
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
                                                src={resolveAvatarUrl(msg.sender_avatar) || `https://ui-avatars.com/api/?name=${msg.sender_username}&background=random`}
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
            </main>

            {/* Input area */}
            <footer className="chat-footer">
                <div className="chat-input-wrap">
                    <textarea
                        ref={inputRef}
                        className="chat-input"
                        rows={1}
                        placeholder={`Escribe un mensaje a ${friendInfo?.username ?? ''}...`}
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
            </footer>
        </div>
    );
};

export default ChatPage;
