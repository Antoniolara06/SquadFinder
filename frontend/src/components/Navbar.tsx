import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar: React.FC = () => {
    const { user } = useAuth();

    return (
        <nav className="navbar">
            <div className="navbar-logo">
                <NavLink to="/">SquadFinder</NavLink>
            </div>
            <div className="navbar-links">
                <NavLink to="/tablon">Tablón de anuncios</NavLink>
                <NavLink to="/players">Buscar Jugador</NavLink>
                {user ? (
                    <>
                        <NavLink to="/friends">Amigos</NavLink>
                        <NavLink to="/messages">Mensajes</NavLink>
                        <NavLink to="/edit-profile" className="navbar-user">
                            {user.avatar_url && (
                                <img src={user.avatar_url} alt="User Avatar" className="navbar-avatar" />
                            )}
                            <span>Hola, {user.username}</span>
                        </NavLink>
                    </>
                ) : (
                    <NavLink to="/login">Login</NavLink>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
