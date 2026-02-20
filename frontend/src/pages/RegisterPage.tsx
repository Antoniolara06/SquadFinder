import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { configApi } from '../utils/api';
import './Auth.css';

const RegisterPage: React.FC = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        pais: '',
        idiomas: [] as string[]
    });
    const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
    const [paises, setPaises] = useState<string[]>([]);
    const [idiomas, setIdiomas] = useState<string[]>([]);

    const { register } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        configApi.getAll()
            .then(cfg => {
                setPaises(cfg.paises);
                setIdiomas(cfg.idiomas);
            })
            .catch(() => {
                setPaises(['España', 'México', 'Argentina', 'Colombia', 'USA', 'Otro']);
                setIdiomas(['Español', 'Inglés', 'Portugués', 'Francés', 'Otro']);
            });
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLanguageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        let updated = [...formData.idiomas];
        if (checked) updated.push(value);
        else updated = updated.filter(item => item !== value);
        setFormData({ ...formData, idiomas: updated });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert("Las contraseñas no coinciden");
            return;
        }
        if (!formData.pais) {
            alert("Selecciona un país");
            return;
        }
        if (formData.idiomas.length === 0) {
            alert("Selecciona al menos un idioma");
            return;
        }

        try {
            await register({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                pais: formData.pais,
                idiomas: formData.idiomas
            });
            navigate('/login');
        } catch (error) {
            console.error("Error en el registro", error);
            alert("Error en el registro");
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Crear Cuenta</h2>
                <p className="auth-subtitle">Únete a la mejor comunidad de gamers</p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="username">Usuario</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            placeholder="GamerTag123"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="tu@email.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="pais">País</label>
                        <select
                            id="pais"
                            name="pais"
                            value={formData.pais}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Selecciona un país</option>
                            {paises.map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group" style={{ position: 'relative' }}>
                        <label>Idiomas</label>
                        <div
                            className="auth-multiselect-trigger"
                            onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                        >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                                {formData.idiomas.length > 0 ? formData.idiomas.join(', ') : "Selecciona idiomas"}
                            </span>
                        </div>
                        {isLangDropdownOpen && (
                            <div className="auth-multiselect-dropdown">
                                {idiomas.map(lang => (
                                    <div key={lang}
                                        className={`auth-multiselect-option ${formData.idiomas.includes(lang) ? 'selected' : ''}`}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <label style={{ margin: 0, width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                            <input type="checkbox" value={lang} checked={formData.idiomas.includes(lang)} onChange={handleLanguageChange} />
                                            {lang}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Contraseña</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Minimum 8 characters"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            placeholder="Repeated password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" className="auth-btn">Registrarse</button>
                </form>

                <p className="auth-footer">
                    ¿Ya tienes cuenta?
                    <Link to="/login" className="auth-link">Inicia Sesión</Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
