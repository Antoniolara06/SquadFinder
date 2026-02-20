import React, { useState } from 'react';
import { useAnuncios } from '../context/AnunciosContext';
import { useNavigate } from 'react-router-dom';

const AnuncioForm: React.FC = () => {
    const { createAnuncio } = useAnuncios();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        game_id: 1, // Default por ahora
        required_rank: '',
        mic_required: false,
        spots_available: 4,
        user_id: 1, // Mock user ID
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        // Handle checkbox separately
        if (type === 'checkbox') {
            // @ts-ignore
            setFormData(prev => ({ ...prev, [name]: e.target.checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createAnuncio(formData);
            navigate('/tablon');
        } catch (error) {
            alert("Error al crear el anuncio");
        }
    };

    return (
        <form className="anuncio-form" onSubmit={handleSubmit}>
            <h2>Crear Nuevo Anuncio</h2>

            <div className="form-group">
                <label>Título (ej: Rankeds Oro+)</label>
                <input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label>Descripción</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label>Rango Requerido</label>
                <input
                    name="required_rank"
                    value={formData.required_rank}
                    onChange={handleChange}
                />
            </div>

            <div className="form-check">
                <label>
                    <input
                        type="checkbox"
                        name="mic_required"
                        checked={formData.mic_required}
                        onChange={handleChange}
                    />
                    Micrófono Requerido
                </label>
            </div>

            <div className="form-group">
                <label>Espacios Disponibles</label>
                <input
                    type="number"
                    name="spots_available"
                    value={formData.spots_available}
                    onChange={handleChange}
                    min="1"
                    max="10"
                />
            </div>

            <button type="submit" className="btn-submit">Publicar</button>
        </form>
    );
};

export default AnuncioForm;
