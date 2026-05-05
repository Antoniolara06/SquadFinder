import React from 'react';
import { useNavigate } from 'react-router-dom';

// Tipos para los jugadores
export interface Player {
    id: number;
    username: string;
    avatar: string;
    status: 'online' | 'in-game' | 'offline';
    gameStatus?: string;
    reputation: number;
    tags: string[];
    idiomas?: string[];
    pais?: string;
    juegos?: string[];
    plataformas?: string[];
    usa_microfono?: boolean;
    horario_juego?: string[];
    isPro?: boolean;
}

interface PlayerCardProps {
    player: Player;
    onAddFriend?: (playerId: number) => void;
    friendStatus?: 'none' | 'pending_sent' | 'pending_received' | 'accepted';
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, onAddFriend, friendStatus = 'none' }) => {
    const navigate = useNavigate();
    return (
        <div className="player-card">
            <div className="card-header">
                <div className="avatar-container">
                    <img src={player.avatar} alt={player.username} className="avatar-img" />
                </div>
            </div>

            <div className="card-body">
                <h3 className="username">
                    {player.username}
                    {player.isPro && <span className="pro-badge">PRO</span>}
                </h3>

                <div className="tags-container">
                    {player.idiomas && player.idiomas.length > 0 && (
                        <span className="tag tag-idioma">{player.idiomas.join(", ")}</span>
                    )}
                    {player.pais && (
                        <span className="tag tag-pais">{player.pais}</span>
                    )}
                    {player.juegos && player.juegos.map((game, index) => (
                        <span key={index} className="tag tag-juego">{game}</span>
                    ))}
                </div>

                <div className="card-actions">
                    <button
                        className="btn-invite"
                        onClick={() => onAddFriend && friendStatus === 'none' && onAddFriend(player.id)}
                        disabled={friendStatus !== 'none'}
                        style={friendStatus !== 'none' ? { opacity: 0.7, cursor: 'default', background: '#555' } : {}}
                    >
                        {friendStatus === 'pending_sent' ? 'Solicitud Enviada' :
                            friendStatus === 'accepted' ? 'Amigos' :
                                friendStatus === 'pending_received' ? 'Responder' :
                                    'Añadir Amigo'}
                    </button>
                    <button className="btn-profile" aria-label="Ver perfil" onClick={() => navigate(`/players/${player.id}`)}>
                        👤
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlayerCard;
