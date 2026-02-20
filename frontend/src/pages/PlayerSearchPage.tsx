import React, { useState, useEffect } from 'react';
import PlayerCard, { type Player } from '../components/PlayerCard';
import { playersApi, friendsApi, configApi } from '../utils/api';
import type { AppConfig } from '../utils/api';
import type { User } from '../types';
import './PlayerSearchPage.css';

const mapUserToPlayer = (user: User): Player => {
    // Basic mapping ensuring status matches Player type expected union
    let status: "online" | "offline" | "in-game" = "offline";
    if (user.disponibilidad === "online" || user.disponibilidad === "in-game") {
        status = user.disponibilidad;
    }

    let parsedIdiomas: string[] = [];
    if (Array.isArray(user.idiomas)) {
        parsedIdiomas = user.idiomas;
    } else if (typeof user.idiomas === 'string') {
        try {
            // Handle potential double JSON encoding or single string
            parsedIdiomas = JSON.parse(user.idiomas);
            if (typeof parsedIdiomas === 'string') {
                parsedIdiomas = [parsedIdiomas]; // Single string case
            } else if (!Array.isArray(parsedIdiomas)) {
                parsedIdiomas = []; // Invalid format
            }
        } catch (e) {
            // If parse fails, treat as single string if not empty
            if (user.idiomas) parsedIdiomas = [user.idiomas];
        }
    }

    let parsedJuegos: string[] = [];
    if (Array.isArray(user.juegos)) {
        parsedJuegos = user.juegos;
    } else if (typeof user.juegos === 'string') {
        try {
            parsedJuegos = JSON.parse(user.juegos);
            if (typeof parsedJuegos === 'string') {
                parsedJuegos = [parsedJuegos];
            } else if (!Array.isArray(parsedJuegos)) {
                parsedJuegos = [];
            }
        } catch (e) {
            if (user.juegos) parsedJuegos = [user.juegos];
        }
    }

    // Construct tags array
    const tags = [];
    if (parsedIdiomas.length > 0) tags.push(parsedIdiomas.join(", "));
    if (user.pais) tags.push(user.pais);
    tags.push(...parsedJuegos);

    let parsedPlataformas: string[] = [];
    if (Array.isArray((user as any).plataformas)) {
        parsedPlataformas = (user as any).plataformas;
    } else if (typeof (user as any).plataformas === 'string') {
        try {
            const p = JSON.parse((user as any).plataformas);
            parsedPlataformas = Array.isArray(p) ? p : [];
        } catch { parsedPlataformas = []; }
    }

    let parsedHorario: string[] = [];
    const horarioRaw = (user as any).horario_juego;
    if (Array.isArray(horarioRaw)) {
        parsedHorario = horarioRaw;
    } else if (typeof horarioRaw === 'string') {
        try {
            const p = JSON.parse(horarioRaw);
            parsedHorario = Array.isArray(p) ? p : [];
        } catch { parsedHorario = []; }
    }

    return {
        id: user.id,
        username: user.username,
        avatar: user.avatar_url || `https://ui-avatars.com/api/?name=${user.username}&background=random`,
        status: status,
        reputation: 50,
        tags: tags.length > 0 ? tags : ["Unknown"],
        idiomas: parsedIdiomas,
        plataformas: parsedPlataformas,
        usa_microfono: (user as any).usa_microfono ?? false,
        horario_juego: parsedHorario,
        isPro: false,
        gameStatus: user.pais ? `Playing from ${user.pais}` : undefined
    };
};

const PlayerSearchPage: React.FC = () => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [config, setConfig] = useState<AppConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'reputation' | 'recent'>('reputation');
    const [sentRequests, setSentRequests] = useState<Set<number>>(new Set());
    const [friendsSet, setFriendsSet] = useState<Set<number>>(new Set());
    const [receivedRequests, setReceivedRequests] = useState<Set<number>>(new Set());
    const [filters, setFilters] = useState({
        game: '',
        micRequired: false,
        platform: '',
        horario: '',
        minRank: '',
        language: ''
    });

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [users, friendsData, cfg] = await Promise.all([
                    playersApi.getAll(),
                    friendsApi.getAll().catch(() => ({ friends: [], sent_requests: [], received_requests: [] })),
                    configApi.getAll()
                ]);

                setPlayers(users.map(mapUserToPlayer));
                setConfig(cfg);
                setFriendsSet(new Set(friendsData.friends.map((f: any) => f.id)));
                setSentRequests(new Set(friendsData.sent_requests.map((r: any) => r.receiver_id)));
                setReceivedRequests(new Set(friendsData.received_requests.map((r: any) => r.sender_id)));
            } catch (error) {
                console.error('Failed to fetch', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const filteredPlayers = players.filter(player => {
        // Filtrar por Juego: comparación exacta con el nombre del juego
        if (filters.game && !player.tags.includes(filters.game)) return false;

        // Filter by Language
        if (filters.language && player.idiomas) {
            if (!player.idiomas.some(lang => lang.includes(filters.language))) return false;
        }

        // Filter by Microphone
        if (filters.micRequired && !(player as any).usa_microfono) return false;

        // Filter by Platform
        if (filters.platform) {
            const plats: string[] = (player as any).plataformas || [];
            if (!plats.includes(filters.platform)) return false;
        }

        // Filter by Horario
        if (filters.horario) {
            const horario: string[] = (player as any).horario_juego || [];
            if (!horario.includes(filters.horario)) return false;
        }

        return true;
    }).sort((a, b) => {
        if (sortBy === 'reputation') return b.reputation - a.reputation;
        return b.id - a.id;
    });

    const handleAddFriend = async (playerId: number) => {
        try {
            await friendsApi.sendRequest(playerId);
            setSentRequests(prev => new Set(prev).add(playerId));
        } catch (error: any) {
            console.error("Error sending friend request", error);
            alert(error.response?.data?.message || "Error al enviar solicitud");
        }
    };

    if (loading) {
        return <div className="loading-container">Cargando jugadores...</div>;
    }


    return (
        <div className="player-search-layout">
            {/* Sidebar de Filtros */}
            <aside className="filters-sidebar">
                <h3 className="section-title">Filtros de Jugador</h3>

                <div className="filter-group">
                    <label>Juego Objetivo</label>
                    <select
                        value={filters.game}
                        onChange={(e) => setFilters({ ...filters, game: e.target.value, minRank: '' })}
                        className="filter-select"
                    >
                        <option value="">Cualquier Juego</option>
                        {(config?.juegos ?? []).map(g => (
                            <option key={g.id} value={g.nombre}>{g.nombre}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label>Idioma</label>
                    <select
                        value={filters.language}
                        onChange={(e) => setFilters({ ...filters, language: e.target.value })}
                        className="filter-select"
                    >
                        <option value="">Cualquier idioma</option>
                        {(config?.idiomas ?? []).map(lang => (
                            <option key={lang} value={lang}>{lang}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            cursor: 'pointer',
                            padding: '10px 12px',
                            background: filters.micRequired ? 'rgba(139,92,246,0.15)' : 'var(--bg-dark, #12141f)',
                            border: `1px solid ${filters.micRequired ? 'var(--primary, #8b5cf6)' : 'var(--border-color, #2a2d3e)'}`,
                            borderRadius: '8px',
                            transition: 'all 0.2s',
                            userSelect: 'none',
                            fontWeight: 500
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={filters.micRequired}
                            onChange={(e) => setFilters({ ...filters, micRequired: e.target.checked })}
                            style={{ width: '16px', height: '16px', accentColor: 'var(--primary, #8b5cf6)', cursor: 'pointer', flexShrink: 0 }}
                        />
                        🎙️ Con Micrófono
                    </label>
                </div>

                <div className="filter-group">
                    <label>🎮 Plataforma</label>
                    <select
                        value={filters.platform}
                        onChange={(e) => setFilters({ ...filters, platform: e.target.value })}
                        className="filter-select"
                    >
                        <option value="">Cualquier plataforma</option>
                        {(config?.plataformas ?? []).map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label>🕐 Horario de Juego</label>
                    <select
                        value={filters.horario}
                        onChange={(e) => setFilters({ ...filters, horario: e.target.value })}
                        className="filter-select"
                    >
                        <option value="">Cualquier horario</option>
                        {(config?.horarios ?? []).map(h => (
                            <option key={h} value={h}>{h}</option>
                        ))}
                    </select>
                </div>


                <button className="btn-reset-filters" onClick={() => setFilters({ game: '', micRequired: false, platform: '', horario: '', minRank: '', language: '' })}>Reset Filtros</button>
            </aside>

            {/* Main Content */}
            <main className="main-search-area">
                <header className="page-header">
                    <div className="header-left">
                        <h1>Búsqueda de Jugadores</h1>
                        <p className="subtitle">Descubre <strong>{filteredPlayers.length}</strong> jugadores que coinciden con tus criterios.</p>
                    </div>
                </header>

                {/* Active Filters Tags */}
                <div className="active-filters">
                    {filters.game && (
                        <span className="filter-tag" onClick={() => setFilters({ ...filters, game: '' })}>
                            Juego: {filters.game} ✕
                        </span>
                    )}
                    {filters.language && (
                        <span className="filter-tag" onClick={() => setFilters({ ...filters, language: '' })}>
                            Idioma: {filters.language} ✕
                        </span>
                    )}
                    {filters.micRequired && (
                        <span className="filter-tag" onClick={() => setFilters({ ...filters, micRequired: false })}>
                            🎙️ Con micrófono ✕
                        </span>
                    )}
                    {filters.platform && (
                        <span className="filter-tag" onClick={() => setFilters({ ...filters, platform: '' })}>
                            🎮 {filters.platform} ✕
                        </span>
                    )}
                    {filters.horario && (
                        <span className="filter-tag" onClick={() => setFilters({ ...filters, horario: '' })}>
                            🕐 {filters.horario} ✕
                        </span>
                    )}
                    {filters.minRank && (
                        <span className="filter-tag" onClick={() => setFilters({ ...filters, minRank: '' })}>
                            Rango: {filters.minRank}+ ✕
                        </span>
                    )}
                </div>

                {/* Players Grid */}
                <div className="players-grid">
                    {filteredPlayers.length > 0 ? (
                        filteredPlayers.map(player => {
                            let status: 'none' | 'pending_sent' | 'pending_received' | 'accepted' = 'none';
                            if (friendsSet.has(player.id)) status = 'accepted';
                            else if (sentRequests.has(player.id)) status = 'pending_sent';
                            else if (receivedRequests.has(player.id)) status = 'pending_received';

                            return (
                                <PlayerCard
                                    key={player.id}
                                    player={player}
                                    onAddFriend={handleAddFriend}
                                    friendStatus={status}
                                />
                            );
                        })
                    ) : (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#888' }}>
                            No se encontraron jugadores con ese criterio.
                        </div>
                    )}
                </div>

                <div className="load-more-container">
                    <button className="btn-load-more">Cargar Más Resultados ▼</button>
                </div>
            </main>

            {/* Right Activity Bar (Optional, simplified) */}

        </div>
    );
};

export default PlayerSearchPage;
