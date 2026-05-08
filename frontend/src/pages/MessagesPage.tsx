import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { chatApi } from '../utils/api';
import type { User } from '../types';
import InlineChat from '../components/InlineChat';
import './MessagesPage.css';

interface Conversation {
    user: User;
    last_message: {
        content: string;
        created_at: string;
        sender_id: number;
    };
    is_friend: boolean;
}

const MessagesPage: React.FC = () => {
    const location = useLocation();
    const openFriend: User | undefined = (location.state as any)?.openFriend;

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(openFriend ?? null);

    const fetchConversations = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const convs = await chatApi.getConversations();
            setConversations(convs);
            // Autoselección del primer chat solo si no llegó ningún amigo desde FriendsPage
            if (!openFriend && convs.length > 0) {
                setSelectedUser(prev => prev ?? convs[0].user);
            }
        } catch (err: any) {
            setError('No se pudieron cargar los mensajes.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    const formatLastMessage = (conv: Conversation) => {
        const maxLen = 42;
        const text = conv.last_message.content;
        return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
    };

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        const today = new Date();
        if (d.toDateString() === today.toDateString()) {
            return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        }
        return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="messages-page">
            {/* Header */}
            <header className="messages-header">
                <div className="messages-header-content">
                    <h1 className="messages-title">💬 Mensajes</h1>
                    <p className="messages-subtitle">
                        {conversations.length > 0
                            ? `${conversations.length} conversación${conversations.length !== 1 ? 'es' : ''}`
                            : 'Sin conversaciones aún'}
                    </p>
                </div>
            </header>

            {/* Body */}
            <main className="messages-body">
                {loading ? (
                    <div className="messages-loading">
                        <div className="spinner" />
                        <p>Cargando mensajes...</p>
                    </div>
                ) : error ? (
                    <div className="messages-error">
                        <span>⚠️</span>
                        <p>{error}</p>
                        <button className="btn-retry" onClick={fetchConversations}>Reintentar</button>
                    </div>
                ) : (
                    <div className="messages-layout">
                        {/* Columna izquierda: lista de conversaciones */}
                        <aside className="messages-list-column">
                            <div className="messages-list-header">
                                <span>Conversaciones</span>
                            </div>

                            {conversations.length === 0 ? (
                                <div className="messages-empty">
                                    <span className="empty-icon">💬</span>
                                    <h3>Sin conversaciones aún</h3>
                                    <p>Contacta con alguien desde el tablón o el buscador de jugadores.</p>
                                </div>
                            ) : (
                                <div className="messages-conv-list">
                                    {conversations.map((conv) => {
                                        const isSelected = selectedUser?.id === conv.user.id;
                                        return (
                                            <div
                                                key={conv.user.id}
                                                className={`conv-row ${isSelected ? 'conv-row--selected' : ''}`}
                                                onClick={() => setSelectedUser(conv.user)}
                                            >
                                                <div className="conv-avatar-wrap">
                                                    <img
                                                        src={conv.user.avatar_url || `https://ui-avatars.com/api/?name=${conv.user.username}&background=random`}
                                                        alt={conv.user.username}
                                                        className="conv-avatar"
                                                    />
                                                </div>
                                                <div className="conv-info">
                                                    <div className="conv-name-row">
                                                        <span className="conv-username">{conv.user.username}</span>
                                                        {conv.is_friend && (
                                                            <span className="conv-friend-badge">Amigo</span>
                                                        )}
                                                    </div>
                                                    <span className="conv-preview">{formatLastMessage(conv)}</span>
                                                </div>
                                                <span className="conv-time">{formatTime(conv.last_message.created_at)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </aside>

                        {/* Columna derecha: chat inline */}
                        <section className="messages-chat-column">
                            {selectedUser ? (
                                <InlineChat key={selectedUser.id} friend={selectedUser} />
                            ) : (
                                <div className="messages-chat-placeholder">
                                    <span className="placeholder-icon">💬</span>
                                    <p>Selecciona una conversación para empezar</p>
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
};

export default MessagesPage;
