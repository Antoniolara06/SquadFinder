import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { playersApi, friendsApi } from '../utils/api';
import type { User } from '../types';
import './PlayerProfilePage.css';

const PLATFORM_ICONS: Record<string, string> = {
    PC: '💻', PlayStation: '🎮', Xbox: '🟩', Switch: '🎴', Mobile: '📱'
};

const FLAG_MAP: Record<string, string> = {
    España: '🇪🇸', USA: '🇺🇸', México: '🇲🇽', Argentina: '🇦🇷',
    Colombia: '🇨🇴', Chile: '🇨🇱', Perú: '🇵🇪', Venezuela: '🇻🇪',
    Francia: '🇫🇷', Alemania: '🇩🇪', Reino_Unido: '🇬🇧', Italia: '🇮🇹',
    Brasil: '🇧🇷', Portugal: '🇵🇹', Otro: '🌍'
};

const parse = (val: any): string[] => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
        try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; }
        catch { return val ? [val] : []; }
    }
    return [];
};

const PlayerProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<User & { usa_microfono?: boolean; horario_juego?: any } | null>(null);
    const [loading, setLoading] = useState(true);
    const [friendStatus, setFriendStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'accepted'>('none');

    useEffect(() => {
        Promise.all([
            playersApi.getAll(),
            friendsApi.getAll().catch(() => ({ friends: [], sent_requests: [], received_requests: [] }))
        ]).then(([users, friendsData]) => {
            const found = users.find(u => u.id === Number(id));
            setUser(found || null);

            if (found) {
                const fid = found.id;
                // Check if friend
                if (friendsData.friends.some((f: any) => f.id === fid)) {
                    setFriendStatus('accepted');
                } else if (friendsData.sent_requests.some((r: any) => r.receiver_id === fid)) {
                    setFriendStatus('pending_sent');
                } else if (friendsData.received_requests.some((r: any) => r.sender_id === fid)) {
                    setFriendStatus('pending_received');
                } else {
                    setFriendStatus('none');
                }
            }
        }).finally(() => setLoading(false));
    }, [id]);

    const handleAddFriend = async () => {
        if (!user) return;
        try {
            await friendsApi.sendRequest(user.id);
            setFriendStatus('pending_sent');
        } catch { }
    };

    if (loading) return (
        <div className="pp-loading">
            <div className="pp-spinner" />
            <p>Cargando perfil...</p>
        </div>
    );

    if (!user) return (
        <div className="pp-loading">
            <p>Jugador no encontrado.</p>
            <button onClick={() => navigate('/players')} className="pp-btn-back">← Volver</button>
        </div>
    );

    const juegos = parse(user.juegos);
    const idiomas = parse(user.idiomas);
    const plataformas = parse(user.plataformas);
    const horarios = parse((user as any).horario_juego);
    const usaMic = (user as any).usa_microfono;
    const avatarUrl = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=6d28d9&color=fff&size=200`;
    const flag = FLAG_MAP[user.pais || ''] || '';

    return (
        <div className="pp-page">
            {/* ── Banner ── */}
            <div className="pp-banner">
                <div className="pp-banner-overlay" />
                <div className="pp-banner-grid" />
                <button className="pp-btn-back-banner" onClick={() => navigate(-1)}>← Volver</button>
            </div>

            {/* ── Hero ── */}
            <div className="pp-hero">
                <div className="pp-hero-left">
                    <div className="pp-avatar-wrap">
                        <img src={avatarUrl} alt={user.username} className="pp-avatar" />
                    </div>
                    <div className="pp-hero-info">
                        <h1 className="pp-username">{user.username}</h1>
                        <p className="pp-sub">
                            {flag && <span>{flag} {user.pais}</span>}
                            {idiomas.length > 0 && <span className="pp-dot">·</span>}
                            {idiomas.length > 0 && <span>{idiomas.join(', ')}</span>}
                        </p>
                        {user.descripcion && <p className="pp-desc">{user.descripcion}</p>}
                    </div>
                </div>
                <div className="pp-hero-actions">
                    <button
                        className={`pp-btn-friend ${friendStatus !== 'none' ? 'sent' : ''}`}
                        onClick={handleAddFriend}
                        disabled={friendStatus !== 'none'}
                    >
                        {friendStatus === 'pending_sent' ? '✓ Solicitud enviada' :
                            friendStatus === 'accepted' ? 'Amigos' :
                                friendStatus === 'pending_received' ? 'Responder Solicitud' :
                                    '+ Añadir Amigo'}
                    </button>
                </div>
            </div>

            {/* ── Stats row ── */}
            <div className="pp-stats-row">
                <div className="pp-stat-card">
                    <span className="pp-stat-icon">🎮</span>
                    <div>
                        <p className="pp-stat-value">{juegos.length}</p>
                        <p className="pp-stat-label">Juegos</p>
                    </div>
                </div>
                <div className="pp-stat-card">
                    <span className="pp-stat-icon">🖥️</span>
                    <div>
                        <p className="pp-stat-value">{plataformas.length}</p>
                        <p className="pp-stat-label">Plataformas</p>
                    </div>
                </div>
                <div className="pp-stat-card">
                    <span className="pp-stat-icon">🕐</span>
                    <div>
                        <p className="pp-stat-value">{horarios.length}</p>
                        <p className="pp-stat-label">Franjas horarias</p>
                    </div>
                </div>
                <div className={`pp-stat-card ${usaMic ? 'mic-active' : ''}`}>
                    <span className="pp-stat-icon">{usaMic ? '🎙️' : '🔇'}</span>
                    <div>
                        <p className="pp-stat-value">{usaMic ? 'Sí' : 'No'}</p>
                        <p className="pp-stat-label">Micrófono</p>
                    </div>
                </div>
            </div>

            {/* ── Content grid ── */}
            <div className="pp-grid">
                {/* Juegos */}
                {juegos.length > 0 && (
                    <div className="pp-card pp-card--wide">
                        <h2 className="pp-card-title">🎮 Juegos</h2>
                        <div className="pp-games-list">
                            {juegos.map(j => (
                                <div key={j} className="pp-game-chip">{j}</div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Plataformas */}
                {plataformas.length > 0 && (
                    <div className="pp-card">
                        <h2 className="pp-card-title">🖥️ Plataformas</h2>
                        <div className="pp-platform-list">
                            {plataformas.map(p => (
                                <div key={p} className="pp-platform-chip">
                                    <span className="pp-platform-icon">{PLATFORM_ICONS[p] || '🖥️'}</span>
                                    {p}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Idiomas */}
                {idiomas.length > 0 && (
                    <div className="pp-card">
                        <h2 className="pp-card-title">🌐 Idiomas</h2>
                        <div className="pp-tag-list">
                            {idiomas.map(lang => (
                                <span key={lang} className="pp-tag">{lang}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Horarios */}
                {horarios.length > 0 && (
                    <div className="pp-card pp-card--wide">
                        <h2 className="pp-card-title">🕐 Horario de Juego</h2>
                        <div className="pp-horario-grid">
                            {Array.from({ length: 12 }, (_, i) => {
                                const h1 = String(i * 2).padStart(2, '0');
                                const h2 = String((i * 2 + 2) % 24).padStart(2, '0');
                                const slot = `${h1}:00 - ${h2 === '00' ? '00' : h2}:00`;
                                const active = horarios.includes(slot);
                                return (
                                    <div key={slot} className={`pp-slot ${active ? 'pp-slot--active' : ''}`}>
                                        {slot}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlayerProfilePage;
