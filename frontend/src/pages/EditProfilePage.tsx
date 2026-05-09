import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi, gamesApi, anunciosApi } from '../utils/api';
import type { Game, Anuncio } from '../types';
import GameSearchSelect from '../components/GameSearchSelect';
import { getGameImageUrl, resolveAvatarUrl } from '../utils/imageUtils';
import './EditProfilePage.css';




const PLATFORM_ICONS: Record<string, string> = {
    PC: '💻', PlayStation: '🎮', Xbox: '🟩', Switch: '🎴', Mobile: '📱'
};
const PLATFORMS = ['PC', 'PlayStation', 'Xbox', 'Switch', 'Mobile'];
const LANGUAGES = ['Español', 'Inglés', 'Portugués', 'Francés', 'Alemán', 'Italiano', 'Ruso', 'Chino', 'Japonés', 'Coreano', 'Otro'];
const HORARIOS = Array.from({ length: 12 }, (_, i) => {
    const h1 = String(i * 2).padStart(2, '0');
    const h2 = String((i * 2 + 2) % 24).padStart(2, '0');
    return `${h1}:00 - ${h2 === '00' ? '00' : h2}:00`;
});

const EditProfilePage: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        descripcion: '',
        pais: '',
        idiomas: [] as string[],
        juegos: [] as string[],
        plataformas: [] as string[],
        horario_juego: [] as string[],
        fecha_nacimiento: '',
        usa_microfono: false
    });

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>('');
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [availableGames, setAvailableGames] = useState<Game[]>([]);
    const [myAnuncios, setMyAnuncios] = useState<Anuncio[]>([]);
    const [loadingAnuncios, setLoadingAnuncios] = useState(true);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => { 
        gamesApi.getAll().then(setAvailableGames).catch(console.error); 
        anunciosApi.getMine().then(setMyAnuncios).catch(console.error).finally(() => setLoadingAnuncios(false));
    }, []);

    // Añadir juego desde el buscador al perfil
    const handleGameAdd = (_gameId: string, game: Game | null) => {
        if (!game) return;
        setFormData(prev => {
            if (prev.juegos.includes(game.nombre)) return prev; // ya está
            return { ...prev, juegos: [...prev.juegos, game.nombre] };
        });
    };


    useEffect(() => {
        if (!user) return;
        const parse = (val: any): string[] => {
            if (Array.isArray(val)) {
                if (val.length > 0 && typeof val[0] === 'string' && val[0].startsWith('[')) {
                    try { const p = JSON.parse(val[0]); if (Array.isArray(p)) return p; } catch { }
                }
                return val;
            }
            if (typeof val === 'string') {
                try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; }
            }
            return [];
        };
        setFormData({
            descripcion: user.descripcion || '',
            pais: user.pais || '',
            idiomas: parse(user.idiomas),
            juegos: parse(user.juegos),
            plataformas: parse(user.plataformas),
            horario_juego: parse((user as any).horario_juego),
            fecha_nacimiento: user.fecha_nacimiento || '',
            usa_microfono: (user as any).usa_microfono ?? false
        });
        if (user.avatar_url) {
            setAvatarPreview(resolveAvatarUrl(user.avatar_url, user.username) || '');
        }
    }, [user]);

    const toggleItem = (field: 'idiomas' | 'juegos' | 'plataformas' | 'horario_juego', value: string) => {
        const arr = formData[field] as string[];
        const updated = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
        setFormData({ ...formData, [field]: updated });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus(null);
        if (!formData.pais) { setStatus({ type: 'error', message: 'Debes seleccionar un país.' }); return; }
        if (formData.idiomas.length === 0) { setStatus({ type: 'error', message: 'Debes seleccionar al menos un idioma.' }); return; }
        try {
            const data = new FormData();
            data.append('descripcion', formData.descripcion);
            data.append('pais', formData.pais);
            data.append('idiomas', JSON.stringify(formData.idiomas));
            data.append('juegos', JSON.stringify(formData.juegos));
            data.append('plataformas', JSON.stringify(formData.plataformas));
            data.append('horario_juego', JSON.stringify(formData.horario_juego));
            data.append('fecha_nacimiento', formData.fecha_nacimiento);
            data.append('usa_microfono', formData.usa_microfono ? 'true' : 'false');
            if (avatarFile) data.append('avatar_file', avatarFile);
            await authApi.updateProfile(data);
            setStatus({ type: 'success', message: '✓ Perfil guardado correctamente' });
            setTimeout(() => window.location.reload(), 1500);
        } catch {
            setStatus({ type: 'error', message: 'Error al actualizar el perfil' });
        }
    };

    if (!user) return <div className="ep-loading"><div className="ep-spinner" /></div>;

    const avatarUrl = avatarPreview || resolveAvatarUrl(undefined, user.username);

    // Juegos a mostrar como chips: los seleccionados + hasta 10 sugerencias populares
    const selectedGamesList = availableGames.filter(g => formData.juegos.includes(g.nombre));
    const suggestedGames = availableGames.filter(g => !formData.juegos.includes(g.nombre)).slice(0, 10);
    const displayedGames = [...selectedGamesList, ...suggestedGames];

    return (
        <div className="ep-page">

            {/* ── Hero / Avatar ── */}
            <form onSubmit={handleSubmit}>
                <div className="ep-hero">
                    <div className="ep-hero-left">
                        {/* Avatar clickeable */}
                        <div className="ep-avatar-wrap" onClick={() => fileInputRef.current?.click()} title="Cambiar foto">
                            <img src={avatarUrl} alt={user.username} className="ep-avatar" />
                            <div className="ep-avatar-overlay">📷<br /><span>Cambiar</span></div>
                        </div>
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />

                        <div className="ep-hero-info">
                            <h1 className="ep-username">{user.username}</h1>
                            {/* Descripción inline */}
                            <textarea
                                name="descripcion"
                                value={formData.descripcion}
                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                placeholder="Escribe una descripción sobre ti..."
                                className="ep-desc-input"
                                rows={2}
                            />
                        </div>
                    </div>


                </div>

                {/* ── Stats-like row ── */}
                <div className="ep-stats-row">
                    {/* País */}
                    <div className="ep-stat-card">
                        <span className="ep-stat-icon">🌍</span>
                        <div className="ep-stat-content">
                            <p className="ep-stat-label">País</p>
                            <select
                                name="pais"
                                value={formData.pais}
                                onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                                className="ep-inline-select"
                            >
                                <option value="">Selecciona...</option>
                                {['Alemania', 'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Costa Rica', 'Ecuador', 'España', 'Francia', 'Italia', 'México', 'Paraguay', 'Perú', 'Reino Unido', 'Uruguay', 'USA', 'Venezuela', 'Otro'].map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Fecha nacimiento */}
                    <div className="ep-stat-card">
                        <span className="ep-stat-icon">🎂</span>
                        <div className="ep-stat-content">
                            <p className="ep-stat-label">Fecha de nacimiento</p>
                            <input
                                type="date"
                                name="fecha_nacimiento"
                                value={formData.fecha_nacimiento}
                                onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                                className="ep-inline-input"
                            />
                        </div>
                    </div>

                    {/* Micrófono */}
                    <div
                        className={`ep-stat-card ep-mic-card ${formData.usa_microfono ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, usa_microfono: !formData.usa_microfono })}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                        <span className="ep-stat-icon">{formData.usa_microfono ? '🎙️' : '🔇'}</span>
                        <div className="ep-stat-content">
                            <p className="ep-stat-label">Micrófono</p>
                            <p className="ep-stat-value">{formData.usa_microfono ? 'Activado' : 'Desactivado'}</p>
                        </div>
                    </div>
                </div>

                {/* ── Content grid ── */}
                <div className="ep-grid">

                    {/* Juegos */}
                    <div className="ep-card ep-card--wide">
                        <h2 className="ep-card-title">🎮 Juegos</h2>

                        {/* Buscador local (filtra los 200+ juegos de la BD) */}
                        <div style={{ marginBottom: '14px' }}>
                            <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '8px' }}>
                                Busca y añade juegos a tu perfil (filtra los {availableGames.length} juegos de la BD):
                            </p>
                            <GameSearchSelect
                                games={availableGames}
                                value=""
                                onChange={handleGameAdd}
                                placeholder={`Busca entre los ${availableGames.length} juegos...`}
                            />
                        </div>

                        {/* Chips de juegos seleccionados y sugerencias */}
                        <div className="ep-chip-selector">
                            {displayedGames.map(game => (
                                <button
                                    key={game.id}
                                    type="button"
                                    className={`ep-chip ${formData.juegos.includes(game.nombre) ? 'selected' : ''}`}
                                    onClick={() => toggleItem('juegos', game.nombre)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    {game.foto_portada && (
                                        <img
                                            src={getGameImageUrl(game.foto_portada)!}
                                            alt={game.nombre}
                                            style={{ width: '18px', height: '24px', borderRadius: '2px', objectFit: 'cover', flexShrink: 0 }}
                                        />
                                    )}
                                    {game.nombre}
                                </button>
                            ))}
                        </div>
                    </div>


                    {/* Plataformas */}
                    <div className="ep-card">
                        <h2 className="ep-card-title">🖥️ Plataformas</h2>
                        <div className="ep-platform-list">
                            {PLATFORMS.map(p => (
                                <div
                                    key={p}
                                    className={`ep-platform-row ${formData.plataformas.includes(p) ? 'selected' : ''}`}
                                    onClick={() => toggleItem('plataformas', p)}
                                >
                                    <span>{PLATFORM_ICONS[p]}</span>
                                    {p}
                                    {formData.plataformas.includes(p) && <span className="ep-check">✓</span>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Idiomas */}
                    <div className="ep-card">
                        <h2 className="ep-card-title">🌐 Idiomas</h2>
                        <div className="ep-chip-selector">
                            {LANGUAGES.map(lang => (
                                <button
                                    key={lang}
                                    type="button"
                                    className={`ep-chip ep-chip--sm ${formData.idiomas.includes(lang) ? 'selected' : ''}`}
                                    onClick={() => toggleItem('idiomas', lang)}
                                >
                                    {lang}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Horario */}
                    <div className="ep-card ep-card--wide">
                        <h2 className="ep-card-title">🕐 Horario de Juego</h2>
                        <div className="ep-horario-grid">
                            {HORARIOS.map(slot => (
                                <div
                                    key={slot}
                                    className={`ep-slot ${formData.horario_juego.includes(slot) ? 'active' : ''}`}
                                    onClick={() => toggleItem('horario_juego', slot)}
                                >
                                    {slot}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Mis Anuncios */}
                    <div className="ep-card ep-card--wide">
                        <h2 className="ep-card-title">📢 Mis Anuncios Publicados</h2>
                        {loadingAnuncios ? (
                            <p className="ep-empty-text">Cargando tus anuncios...</p>
                        ) : myAnuncios.length > 0 ? (
                            <div className="ep-my-anuncios-list">
                                {myAnuncios.map(anuncio => (
                                    <div key={anuncio.id} className="ep-anuncio-item">
                                        <div className="ep-anuncio-item-left">
                                            <span className="ep-anuncio-game-tag">{anuncio.game?.nombre}</span>
                                            <span className="ep-anuncio-title">{anuncio.title}</span>
                                        </div>
                                        <div className="ep-anuncio-item-right">
                                            <span className="ep-anuncio-date">{new Date(anuncio.created_at).toLocaleDateString()}</span>
                                            <button 
                                                type="button"
                                                className="ep-btn-delete-small"
                                                onClick={async () => {
                                                    if(window.confirm('¿Eliminar este anuncio?')) {
                                                        try {
                                                            await anunciosApi.delete(anuncio.id);
                                                            setMyAnuncios(prev => prev.filter(a => a.id !== anuncio.id));
                                                        } catch(e) {
                                                            alert('Error al eliminar');
                                                        }
                                                    }
                                                }}
                                                title="Eliminar anuncio"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="ep-empty-state">
                                <p>No has publicado ningún anuncio todavía.</p>
                                <button type="button" onClick={() => navigate('/tablon')} className="ep-btn-link">Ir al tablón para publicar uno</button>
                            </div>
                        )}
                    </div>

                </div>

                {/* ── Footer Actions ── */}
                <div className="ep-footer-actions">
                    {status && (
                        <div className={`ep-status ${status.type}`}>{status.message}</div>
                    )}
                    <div className="ep-footer-buttons">
                        <button type="submit" className="ep-btn-save">💾 Guardar Cambios</button>
                        <button type="button" onClick={() => { logout(); navigate('/login'); }} className="ep-btn-logout">Cerrar Sesión</button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default EditProfilePage;
