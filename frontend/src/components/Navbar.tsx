import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar: React.FC = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = React.useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);

    return (
        <nav className="navbar">
            <div className="navbar-logo">
                <NavLink to="/" onClick={closeMenu}>SquadFinder</NavLink>
            </div>

            <button className={`navbar-toggle ${isOpen ? 'active' : ''}`} onClick={toggleMenu} aria-label="Abrir menú">
                <span className="hamburger"></span>
            </button>

            <div className={`navbar-links ${isOpen ? 'open' : ''}`}>
                <NavLink to="/tablon" onClick={closeMenu}>Tablón de anuncios</NavLink>
                <NavLink to="/players" onClick={closeMenu}>Buscar Jugador</NavLink>
                {user ? (
                    <>
                        <NavLink to="/friends" onClick={closeMenu}>Amigos</NavLink>
                        <NavLink to="/messages" onClick={closeMenu}>Mensajes</NavLink>
                        <NavLink to="/edit-profile" className="navbar-user" onClick={closeMenu}>
                            {user.avatar_url && (
                                <img src={user.avatar_url} alt="User Avatar" className="navbar-avatar" />
                            )}
                            <span>Hola, {user.username}</span>
                        </NavLink>
                    </>
                ) : (
                    <NavLink to="/login" onClick={closeMenu}>Login</NavLink>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
