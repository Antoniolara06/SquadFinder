import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { friendsApi } from '../utils/api';
import type { FriendshipData } from '../utils/api';
import type { User } from '../types';
import { resolveAvatarUrl } from '../utils/imageUtils';
import './FriendsPage.css';

type TabType = 'friends' | 'received' | 'sent';

const FriendsPage: React.FC = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<FriendshipData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('friends');
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const fetchAll = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const friendsResult = await friendsApi.getAll();
            setData(friendsResult);
        } catch (err: any) {
            setError('No se pudieron cargar los datos. ¿Estás conectado?');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const handleAccept = async (requestId: number) => {
        setActionLoading(requestId);
        try {
            await friendsApi.acceptRequest(requestId);
            await fetchAll();
        } catch (err) {
            console.error('Error aceptando solicitud', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (requestId: number) => {
        setActionLoading(requestId);
        try {
            await friendsApi.rejectRequest(requestId);
            await fetchAll();
        } catch (err) {
            console.error('Error rechazando solicitud', err);
        } finally {
            setActionLoading(null);
        }
    };

    const receivedCount = data?.received_requests?.length ?? 0;
    const sentCount = data?.sent_requests?.length ?? 0;
    const friendsCount = data?.friends?.length ?? 0;

    return (
        <div className="friends-page">
            {/* Header */}
            <header className="friends-header">
                <div className="friends-header-content">
                    <h1 className="friends-title">🎮 Amigos</h1>
                    <p className="friends-subtitle">Gestiona tus amigos y solicitudes de amistad</p>
                </div>
                <div className="friends-stats">
                    <div className="stat-chip">
                        <span className="stat-num">{friendsCount}</span>
                        <span className="stat-label">Amigos</span>
                    </div>
                    {receivedCount > 0 && (
                        <div className="stat-chip stat-chip--alert">
                            <span className="stat-num">{receivedCount}</span>
                            <span className="stat-label">Pendientes</span>
                        </div>
                    )}
                </div>
            </header>

            {/* Tabs */}
            <nav className="friends-tabs">
                <button
                    className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
                    onClick={() => setActiveTab('friends')}
                >
                    🎮 Amigos
                    <span className="tab-count">{friendsCount}</span>
                </button>
                <button
                    className={`tab-btn ${activeTab === 'received' ? 'active' : ''}`}
                    onClick={() => setActiveTab('received')}
                >
                    📨 Recibidas
                    {receivedCount > 0 && (
                        <span className="tab-count tab-count--alert">{receivedCount}</span>
                    )}
                </button>
                <button
                    className={`tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sent')}
                >
                    📤 Enviadas
                    <span className="tab-count">{sentCount}</span>
                </button>
            </nav>

            {/* Content */}
            <main className="friends-content">
                {loading ? (
                    <div className="friends-loading">
                        <div className="spinner" />
                        <p>Cargando...</p>
                    </div>
                ) : error ? (
                    <div className="friends-error">
                        <span>⚠️</span>
                        <p>{error}</p>
                        <button className="btn-retry" onClick={fetchAll}>Reintentar</button>
                    </div>
                ) : (
                    <>
                        {/* --- TAB: AMIGOS --- */}
                        {activeTab === 'friends' && (
                            <div className="friends-grid">
                                {friendsCount === 0 ? (
                                    <div className="empty-state">
                                        <span className="empty-icon">🎮</span>
                                        <h3>Aún no tienes amigos</h3>
                                        <p>Busca jugadores y envía solicitudes de amistad para empezar.</p>
                                    </div>
                                ) : (
                                    data!.friends.map((friend: User) => (
                                        <div key={friend.id} className="friend-card" onClick={() => navigate(`/players/${friend.id}`)} style={{ cursor: 'pointer' }}>
                                            <div className="friend-avatar-wrap">
                                                <img
                                                    src={resolveAvatarUrl(friend.avatar_url) || `https://ui-avatars.com/api/?name=${friend.username}&background=random`}
                                                    alt={friend.username}
                                                    className="friend-avatar"
                                                />
                                            </div>
                                            <div className="friend-info" style={{ flex: 1 }}>
                                                <h3 className="friend-name" style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>{friend.username}</h3>
                                                <span className="badge-friend">Amigo</span>
                                            </div>
                                            <div className="friend-actions">
                                                <button
                                                    className="btn-message"
                                                    onClick={(e) => { e.stopPropagation(); navigate('/messages', { state: { openFriend: friend } }); }}
                                                    title="Chatear"
                                                >
                                                    💬
                                                </button>
                                                <button
                                                    className="btn-view-profile"
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/players/${friend.id}`); }}
                                                    title="Ver perfil"
                                                >
                                                    👤
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* --- TAB: SOLICITUDES RECIBIDAS --- */}
                        {activeTab === 'received' && (
                            <div className="requests-list">
                                {receivedCount === 0 ? (
                                    <div className="empty-state">
                                        <span className="empty-icon">📭</span>
                                        <h3>No tienes solicitudes pendientes</h3>
                                        <p>Cuando alguien te envíe una solicitud aparecerá aquí.</p>
                                    </div>
                                ) : (
                                    data!.received_requests.map((req: any) => (
                                        <div key={req.id} className="request-card">
                                            <div
                                                className="request-avatar-wrap"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => navigate(`/players/${req.sender?.id}`)}
                                            >
                                                <img
                                                    src={resolveAvatarUrl(req.sender?.avatar_url) || `https://ui-avatars.com/api/?name=${req.sender?.username ?? 'U'}&background=random`}
                                                    alt={req.sender?.username}
                                                    className="friend-avatar"
                                                />
                                            </div>
                                            <div className="request-info">
                                                <h3
                                                    className="friend-name"
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => navigate(`/players/${req.sender?.id}`)}
                                                >
                                                    {req.sender?.username ?? 'Usuario'}
                                                </h3>
                                                <span className="request-time">
                                                    🕒 {new Date(req.created_at).toLocaleDateString('es-ES', {
                                                        day: 'numeric', month: 'short', year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                            <div className="request-actions">
                                                <button
                                                    className="btn-accept"
                                                    onClick={() => handleAccept(req.id)}
                                                    disabled={actionLoading === req.id}
                                                >
                                                    {actionLoading === req.id ? '...' : '✔ Aceptar'}
                                                </button>
                                                <button
                                                    className="btn-reject"
                                                    onClick={() => handleReject(req.id)}
                                                    disabled={actionLoading === req.id}
                                                >
                                                    {actionLoading === req.id ? '...' : '✖ Rechazar'}
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* --- TAB: SOLICITUDES ENVIADAS --- */}
                        {activeTab === 'sent' && (
                            <div className="requests-list">
                                {sentCount === 0 ? (
                                    <div className="empty-state">
                                        <span className="empty-icon">📤</span>
                                        <h3>No has enviado solicitudes</h3>
                                        <p>Las solicitudes que envíes aparecerán aquí mientras están pendientes.</p>
                                    </div>
                                ) : (
                                    data!.sent_requests.map((req: any) => (
                                        <div key={req.id} className="request-card">
                                            <div
                                                className="request-avatar-wrap"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => navigate(`/players/${req.receiver?.id}`)}
                                            >
                                                <img
                                                    src={resolveAvatarUrl(req.receiver?.avatar_url) || `https://ui-avatars.com/api/?name=${req.receiver?.username ?? 'U'}&background=random`}
                                                    alt={req.receiver?.username}
                                                    className="friend-avatar"
                                                />
                                            </div>
                                            <div className="request-info">
                                                <h3
                                                    className="friend-name"
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => navigate(`/players/${req.receiver?.id}`)}
                                                >
                                                    {req.receiver?.username ?? 'Usuario'}
                                                </h3>
                                                <span className="request-time">
                                                    🕒 Enviada el {new Date(req.created_at).toLocaleDateString('es-ES', {
                                                        day: 'numeric', month: 'short', year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                            <div className="request-actions">
                                                <span className="badge-pending">⏳ Pendiente</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default FriendsPage;
