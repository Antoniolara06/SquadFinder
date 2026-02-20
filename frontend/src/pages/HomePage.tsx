import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
    return (
        <div className='home-page'>
            <h1>Bienvenido a SquadFinder</h1>
            <p>Encuentra tu equipo perfecto para cualquier juego.</p>
            <Link to="/tablon" className="cta-button">Ver Tablón de Anuncios</Link>
        </div>
    );
};

export default HomePage;
