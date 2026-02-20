import React from 'react';
import type { Anuncio } from '../types';

interface AnuncioCardProps {
    anuncio: Anuncio;
}

const AnuncioCard: React.FC<AnuncioCardProps> = ({ anuncio }) => {
    return (
        <div className="anuncio-card">
            <div className="anuncio-header">
                <h3>{anuncio.title}</h3>
                <span className={`status ${anuncio.mic_required ? 'mic-on' : 'mic-off'}`}>
                    {anuncio.mic_required ? '🎤 Mic' : '🔇 No Mic'}
                </span>
            </div>
            <div className="anuncio-details">
                <p className="description">{anuncio.description}</p>
                <p className="requirements">
                    <strong>Rango requerido:</strong> {anuncio.required_rank}
                </p>
                <p className="game-info">
                    Juego ID: {anuncio.game_id}
                </p>
                <p className="spots">
                    Espacios: {anuncio.spots_available}
                </p>
            </div>
            <div className="anuncio-actions">
                <button className="btn-join">Unirse</button>
            </div>
        </div>
    );
};

export default AnuncioCard;
