import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            await login(email, password);
            navigate('/');
        } catch (error) {
            setError("Usuario o contraseña incorrecta");
            setTimeout(() => {
                setError(null);
            }, 3000);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Bienvenido</h2>
                <p className="auth-subtitle">Ingresa tus credenciales para continuar</p>
                {error && <div className="blinking-text">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Contraseña</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="********"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="auth-btn">Iniciar Sesión</button>
                </form>

                <p className="auth-footer">
                    ¿No tienes cuenta?
                    <Link to="/register" className="auth-link">Regístrate</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
