import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { configApi } from '../utils/api';
import type { Game } from '../types';
import { getGameImageUrl } from '../utils/imageUtils';
import './HomePage.css';

const HomePage: React.FC = () => {
    const [topGames, setTopGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGames = async () => {
            try {
                const cfg = await configApi.getAll();
                if (cfg && cfg.juegos) {
                    setTopGames(cfg.juegos);
                }
            } catch (error) {
                console.error("Error fetching games for carousel:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchGames();
    }, []);

    return (
        <div className='home-page'>
            <h1>Bienvenido a SquadFinder</h1>
            <p>Encuentra tu equipo perfecto para cualquier juego competitivo multijugador.</p>
            <Link to="/tablon" className="cta-button">Ver Tablón de Anuncios</Link>

            <div className="home-carousel-section">
                <h2>Juegos más relevantes</h2>
                
                {loading ? (
                    <div style={{color: '#94a3b8'}}>Cargando juegos...</div>
                ) : (
                    <div className="carousel-container">
                        {topGames.map(game => (
                            <Link 
                                key={game.id} 
                                to={`/players?game=${encodeURIComponent(game.nombre)}`}
                                className="carousel-card"
                            >
                                {game.foto_portada ? (
                                    <img src={getGameImageUrl(game.foto_portada)!} alt={game.nombre} className="carousel-card-img" />
                                ) : (
                                    <div className="carousel-card-img" style={{background: '#2a2d3e', display: 'grid', placeItems: 'center', color: '#64748b'}}>Sin foto</div>
                                )}
                                <div className="carousel-card-info">
                                    <div className="carousel-card-title" title={game.nombre}>{game.nombre}</div>
                                    <div className="carousel-card-genre">{game.genero || 'Multijugador'}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomePage;
