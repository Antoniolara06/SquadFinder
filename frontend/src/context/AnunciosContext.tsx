import React, { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import type { Anuncio } from '../types';
import { anunciosApi } from '../utils/api';

interface AnunciosContextType {
    anuncios: Anuncio[];
    loading: boolean;
    refreshAnuncios: () => Promise<void>;
    createAnuncio: (anuncioData: Omit<Anuncio, 'id' | 'created_at'>) => Promise<void>;
}

const AnunciosContext = createContext<AnunciosContextType | undefined>(undefined);

export const AnunciosProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshAnuncios = async () => {
        setLoading(true);
        try {
            const data = await anunciosApi.getAll();
            setAnuncios(data);
        } catch (error) {
            console.error("Error fetching anuncios:", error);
        } finally {
            setLoading(false);
        }
    };

    const createAnuncio = async (anuncioData: Omit<Anuncio, 'id' | 'created_at'>) => {
        try {
            const newAnuncio = await anunciosApi.create(anuncioData);
            setAnuncios(prev => [...prev, newAnuncio]);
        } catch (error) {
            console.error("Error creating anuncio:", error);
            throw error;
        }
    };

    useEffect(() => {
        refreshAnuncios();
    }, []);

    return (
        <AnunciosContext.Provider value={{ anuncios, loading, refreshAnuncios, createAnuncio }}>
            {children}
        </AnunciosContext.Provider>
    );
};

export const useAnuncios = () => {
    const context = useContext(AnunciosContext);
    if (context === undefined) {
        throw new Error('useAnuncios must be used within an AnunciosProvider');
    }
    return context;
};
