import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { configApi } from '../utils/api';
import type { Game } from '../types';
import './HomePage.css';

const HomePage: React.FC = () => {
    const [topGames, setTopGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGames = async () => {
            try {
                const cfg = await configApi.getAll();
                // We show up to 15 relevant games in the carousel
                if (cfg && cfg.juegos) {
                    const desired = ['League of Legends', 'Valorant', 'Counter-Strike 2', 'Rocket League', 'Fortnite', 'Rainbow Six Siege'];
                    setTopGames(desired.map(n => cfg.juegos.find(g => g.nombre === n)).filter(Boolean) as Game[]);
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
                                    <img src={game.foto_portada} alt={game.nombre} className="carousel-card-img" />
                                ) : (
                                    <div className="carousel-card-img" style={{background: '#2a2d3e', display: 'grid', placeItems: 'center', color: '#64748b'}}>Sin foto</div>
                                )}
                                <div className="carousel-card-info">
                                    <div className="carousel-card-title" title={game.nombre}>{game.nombre}</div>
                                    <div className="carousel-card-genre">{game.genero || 'Multijugador'}</div>
                                </div>
                            </Link>
                        ))}
                        {/* Explorar más option at the end of carousel */}
                        <Link to="/players" className="carousel-card" style={{justifyContent: 'center', alignItems: 'center', background: 'rgba(139, 92, 246, 0.1)'}}>
                            <div style={{color: '#8b5cf6', fontWeight: 600, fontSize: '1.2rem', padding: '20px', textAlign: 'center'}}>
                                Ver otros +200 juegos...
                            </div>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomePage;
