import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { anunciosApi, gamesApi, suggestionsApi } from '../utils/api';
import type { Anuncio, Game } from '../types';
import GameSearchSelect from '../components/GameSearchSelect';
import { getGameImageUrl, resolveAvatarUrl } from '../utils/imageUtils';
import './TablonPage.css';



const formatHoraJuego = (iso: string) => {
    if (!iso) return 'Sin hora';
    try {
        return new Date(iso).toLocaleString('es-ES', {
            weekday: 'short', day: 'numeric', month: 'short',
            hour: '2-digit', minute: '2-digit'
        });
    } catch {
        return iso;
    }
};

const TablonPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterGame, setFilterGame] = useState<string>('');

    // Form state
    const [newAnuncio, setNewAnuncio] = useState({
        game_id: '',
        title: '',
        description: '',
        hora_juego: '',
        required_rank: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState('');
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [rangosDisponibles, setRangosDisponibles] = useState<string[]>([]);
    const [_loadingRangos, setLoadingRangos] = useState(false);
    
    // Sugerencia de juego
    const [sugerencia, setSugerencia] = useState('');
    const [sugerenciaStatus, setSugerenciaStatus] = useState('');

    // Al cambiar juego → cargar sus rangos
    const handleGameChange = async (gameId: string) => {
        setNewAnuncio(prev => ({ ...prev, game_id: gameId, required_rank: '' }));
        if (!gameId) { setRangosDisponibles([]); return; }
        setLoadingRangos(true);
        try {
            const rangos = await gamesApi.getRangos(Number(gameId));
            setRangosDisponibles(rangos.map(r => r.nombre));
        } catch {
            setRangosDisponibles([]);
        } finally {
            setLoadingRangos(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [anunciosData, gamesData] = await Promise.all([
                    anunciosApi.getAll(),
                    gamesApi.getAll()
                ]);
                setAnuncios(anunciosData);
                setGames(gamesData);
            } catch (error) {
                console.error('Error loading data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handlePublish = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            setMsg('Debes iniciar sesión para publicar un anuncio.');
            return;
        }
        if (!newAnuncio.game_id || !newAnuncio.title || !newAnuncio.hora_juego || !newAnuncio.description) {
            setMsg('Por favor completa todos los campos.');
            return;
        }

        setSubmitting(true);
        try {
            await anunciosApi.create({
                game_id: Number(newAnuncio.game_id),
                title: newAnuncio.title,
                description: newAnuncio.description,
                hora_juego: newAnuncio.hora_juego,
                required_rank: newAnuncio.required_rank || undefined,
                spots_available: 1,
                mic_required: false,
                user_id: user?.id || 0
            } as any);

            const updated = await anunciosApi.getAll();
            setAnuncios(updated);
            setNewAnuncio({ game_id: '', title: '', description: '', hora_juego: '', required_rank: '' });
            setMsg('¡Anuncio publicado!');
            setTimeout(() => setMsg(''), 3000);
        } catch (error) {
            setMsg('Error al publicar anuncio.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Evitar que el click propague al card
        if (!window.confirm('¿Seguro que quieres eliminar este anuncio?')) return;
        setDeletingId(id);
        try {
            await anunciosApi.delete(id);
            setAnuncios(prev => prev.filter(a => a.id !== id));
        } catch (error) {
            alert('Error al eliminar el anuncio.');
        } finally {
            setDeletingId(null);
        }
    };

    const handleCardClick = (anuncio: Anuncio) => {
        // Solo si el usuario es diferente al autor
        if (!user) {
            navigate('/login');
            return;
        }
        if (anuncio.user_id === user.id) return; // Es el propio autor, no hace nada
        navigate(`/chat/user/${anuncio.user_id}`);
    };

    const handleSugerenciaSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            setSugerenciaStatus('Inicia sesión para sugerir un juego.');
            return;
        }
        if (!sugerencia.trim()) return;

        try {
            await suggestionsApi.create(sugerencia);
            setSugerencia('');
            setSugerenciaStatus('¡Sugerencia enviada! Revisaremos tu juego pronto.');
            setTimeout(() => setSugerenciaStatus(''), 5000);
        } catch {
            setSugerenciaStatus('Error al enviar sugerencia.');
        }
    };

    const filteredAnuncios = filterGame
        ? anuncios.filter(s => s.game?.nombre === filterGame)
        : anuncios;

    if (loading) return <div className="tablon-loading"><div className="spinner"></div></div>;

    return (
        <div className="tablon-container">
            {/* ── Left Side: Form ── */}
            <aside className="tablon-sidebar">
                <div className="publish-card">
                    <h2>📢 Publicar Anuncio</h2>
                    {!user && (
                        <p className="form-msg error" style={{ marginBottom: '16px' }}>
                            Debes iniciar sesión para publicar.
                        </p>
                    )}
                    <form onSubmit={handlePublish}>
                        <div className="form-group">
                            <label>🎮 Juego</label>
                            <GameSearchSelect
                                games={games}
                                value={newAnuncio.game_id}
                                disabled={!user}
                                placeholder={`Busca entre los ${games.length} juegos...`}
                                onChange={(gameId, _game) => handleGameChange(gameId)}
                            />
                        </div>


                        {/* Rango: solo aparece si hay un juego seleccionado */}
                        {newAnuncio.game_id && rangosDisponibles.length > 0 && (
                            <div className="form-group">
                                <label>Tu rango en {games.find(g => String(g.id) === newAnuncio.game_id)?.nombre}</label>
                                <select
                                    value={newAnuncio.required_rank}
                                    onChange={(e) => setNewAnuncio({ ...newAnuncio, required_rank: e.target.value })}
                                    disabled={!user}
                                >
                                    <option value="">Sin rango / Cualquiera</option>
                                    {rangosDisponibles.map(r => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="form-group">
                            <label>Título del anuncio</label>
                            <input
                                type="text"
                                placeholder="Ej: Busco duo para rankeds"
                                value={newAnuncio.title}
                                onChange={(e) => setNewAnuncio({ ...newAnuncio, title: e.target.value })}
                                maxLength={60}
                                required
                                disabled={!user}
                            />
                        </div>

                        <div className="form-group">
                            <label>Fecha y hora de juego</label>
                            <input
                                type="datetime-local"
                                value={newAnuncio.hora_juego}
                                onChange={(e) => setNewAnuncio({ ...newAnuncio, hora_juego: e.target.value })}
                                required
                                disabled={!user}
                            />
                        </div>

                        <div className="form-group">
                            <label>Descripción</label>
                            <textarea
                                placeholder="Describe qué buscas o qué ofreces..."
                                value={newAnuncio.description}
                                onChange={(e) => setNewAnuncio({ ...newAnuncio, description: e.target.value })}
                                rows={4}
                                required
                                disabled={!user}
                            />
                        </div>

                        {msg && <p className={`form-msg ${msg.includes('Error') || msg.includes('sesión') ? 'error' : 'success'}`}>{msg}</p>}

                        <button type="submit" className="btn-publish" disabled={submitting || !user}>
                            {submitting ? 'Publicando...' : 'Publicar Anuncio'}
                        </button>
                    </form>
                </div>
            </aside>

            {/* ── Right Side: Board ── */}
            <main className="tablon-board">
                <header className="board-header">
                    <h1>Tablón de Anuncios</h1>
                    {/* ── Filtro de juegos mediante buscador ── */}
                    <div className="board-filters" style={{ minWidth: '280px', maxWidth: '350px' }}>
                        <span>Filtrar tablón por juego:</span>
                        <GameSearchSelect
                            games={games}
                            value={games.find(g => g.nombre === filterGame)?.id.toString() || ''}
                            onChange={(_gameId, game) => setFilterGame(game ? game.nombre : '')}
                            placeholder="Buscar juego (Ej: Valorant)..."
                        />
                    </div>

                </header>

                <div className="anuncios-grid">
                    {filteredAnuncios.length > 0 ? (
                        filteredAnuncios.map(anuncio => {
                            const isOwner = user && anuncio.user_id === user.id;
                            const isClickable = user && !isOwner;
                            return (
                                <div
                                    key={anuncio.id}
                                    className={`anuncio-card ${isClickable ? 'anuncio-card--clickable' : ''}`}
                                    onClick={() => handleCardClick(anuncio)}
                                    title={isClickable ? `Iniciar chat con ${anuncio.user?.username}` : undefined}
                                >
                                    <div className="anuncio-header">
                                        {anuncio.game?.foto_portada && (
                                            <img
                                                src={getGameImageUrl(anuncio.game.foto_portada)!}
                                                alt={anuncio.game.nombre}
                                                className="anuncio-game-cover"
                                            />
                                        )}
                                        <span className="anuncio-game">{anuncio.game?.nombre || 'Juego'}</span>
                                        <span className="anuncio-time">🕒 {formatHoraJuego(anuncio.hora_juego || '')}</span>
                                    </div>

                                    <div className="anuncio-body">
                                        <h3 className="anuncio-title">{anuncio.title}</h3>
                                        <p className="anuncio-desc">{anuncio.description}</p>
                                        {anuncio.required_rank && (
                                            <span className="anuncio-rank">🏅 {anuncio.required_rank}</span>
                                        )}
                                    </div>
                                    <div className="anuncio-footer">
                                        <div className="anuncio-author">
                                            <img
                                                src={resolveAvatarUrl(anuncio.user?.avatar_url) || `https://ui-avatars.com/api/?name=${anuncio.user?.username || 'User'}`}
                                                alt="Avatar"
                                                className="anuncio-avatar"
                                            />
                                            <span className="anuncio-username">{anuncio.user?.username || 'Usuario'}</span>
                                        </div>
                                        <div className="anuncio-footer-right">
                                            {isClickable && (
                                                <span className="anuncio-chat-hint">💬 Contactar</span>
                                            )}
                                            <span className="anuncio-date">
                                                {new Date(anuncio.created_at).toLocaleDateString()}
                                            </span>
                                            {isOwner && (
                                                <button
                                                    className="btn-delete-anuncio"
                                                    onClick={(e) => handleDelete(anuncio.id, e)}
                                                    disabled={deletingId === anuncio.id}
                                                    title="Eliminar anuncio"
                                                >
                                                    {deletingId === anuncio.id ? '⏳' : '🗑️'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="empty-board">
                            <p>No hay anuncios disponibles en esta categoría.</p>
                        </div>
                    )}
                </div>

                {/* ── Seccion Sugerencia ── */}
                <div className="tablon-suggestion-section">
                    <div className="suggestion-card">
                        <h3>¿Falta algún juego?</h3>
                        <p>Dinos qué juego echas de menos y lo añadiremos pronto.</p>
                        <form onSubmit={handleSugerenciaSubmit} className="suggestion-form">
                            <input 
                                type="text" 
                                placeholder="Escribe el nombre del juego..."
                                value={sugerencia}
                                onChange={(e) => setSugerencia(e.target.value)}
                                disabled={!user}
                            />
                            <button type="submit" disabled={!user || !sugerencia.trim()}>Enviar</button>
                        </form>
                        {sugerenciaStatus && (
                            <p className={`suggestion-msg ${sugerenciaStatus.includes('Error') || sugerenciaStatus.includes('Inicia') ? 'error' : 'success'}`}>
                                {sugerenciaStatus}
                            </p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TablonPage;
