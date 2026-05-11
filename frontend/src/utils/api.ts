import axios from 'axios';
import type { User, Anuncio, Game } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://squadfinder-api.onrender.com';

// ── Gestión del token en localStorage ────────────────────────────────────────

const TOKEN_KEY = 'sf_auth_token';

export const tokenStorage = {
    get: (): string | null => localStorage.getItem(TOKEN_KEY),
    set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
    remove: () => localStorage.removeItem(TOKEN_KEY),
};

// ── Instancia Axios ──────────────────────────────────────────────────────────

export const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Interceptor: añade el token JWT a cada petición automáticamente
api.interceptors.request.use((config) => {
    const token = tokenStorage.get();
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

// ── Auth API ─────────────────────────────────────────────────────────────────

export const authApi = {
    login: async (email: string, password: string): Promise<User> => {
        const { data } = await api.post('/login', { email, password });
        // El backend devuelve el usuario + token; guardamos el token
        if (data.token) {
            tokenStorage.set(data.token);
        }
        return data;
    },
    register: async (userData: any): Promise<void> => {
        await api.post('/register', userData);
    },
    getCurrentUser: async (): Promise<User> => {
        const { data } = await api.get('/edit-profile');
        return data;
    },
    updateProfile: async (userData: Partial<User> | FormData): Promise<User> => {
        const config = userData instanceof FormData
            ? { headers: { 'Content-Type': undefined } }
            : {};
        const { data } = await api.put('/edit-profile/update', userData, config);
        return data;
    },
    logout: () => {
        tokenStorage.remove();
    },
};

// ── Anuncios API ─────────────────────────────────────────────────────────────

export const anunciosApi = {
    getAll: async (): Promise<Anuncio[]> => {
        const { data } = await api.get('/anuncios');
        return data;
    },
    create: async (anuncioData: Omit<Anuncio, 'id' | 'created_at'>): Promise<Anuncio> => {
        const { data } = await api.post('/anuncios', anuncioData);
        return data;
    },
    getById: async (id: number): Promise<Anuncio> => {
        const { data } = await api.get(`/anuncios/${id}`);
        return data;
    },
    delete: async (id: number): Promise<void> => {
        await api.delete(`/anuncios/${id}`);
    },
    getMine: async (): Promise<Anuncio[]> => {
        const { data } = await api.get('/edit-profile/anuncios');
        return data;
    }
};

// ── Games API ────────────────────────────────────────────────────────────────

export const gamesApi = {
    getAll: async (): Promise<Game[]> => {
        const { data } = await api.get('/games');
        return data;
    },
    getRangos: async (gameId: number): Promise<{ id: number; nombre: string; orden: number }[]> => {
        const { data } = await api.get(`/games/${gameId}/rangos`);
        return data;
    }
};

// ── Players API ──────────────────────────────────────────────────────────────

export const playersApi = {
    getAll: async (): Promise<User[]> => {
        const { data } = await api.get('/players');
        return data;
    }
};

// ── Config API ───────────────────────────────────────────────────────────────

export interface AppConfig {
    juegos: Game[];
    plataformas: string[];
    idiomas: string[];
    paises: string[];
    horarios: string[];
}

export const configApi = {
    getAll: async (): Promise<AppConfig> => {
        const { data } = await api.get('/config');
        return data;
    }
};

// ── Friends API ──────────────────────────────────────────────────────────────

export interface FriendshipData {
    friends: User[];
    received_requests: any[];
    sent_requests: any[];
}

export const friendsApi = {
    getAll: async (): Promise<FriendshipData> => {
        const { data } = await api.get('/friends');
        return data;
    },
    sendRequest: async (friendId: number) => {
        const { data } = await api.post('/friends/request', { friend_id: friendId });
        return data;
    },
    acceptRequest: async (requestId: number) => {
        const { data } = await api.post(`/friends/accept/${requestId}`);
        return data;
    },
    rejectRequest: async (requestId: number) => {
        const { data } = await api.post(`/friends/reject/${requestId}`);
        return data;
    },
    removeFriend: async (friendId: number) => {
        const { data } = await api.delete(`/friends/${friendId}`);
        return data;
    }
};

// ── Chat API ─────────────────────────────────────────────────────────────────

export interface ChatMessage {
    id: number;
    sender_id: number;
    receiver_id: number;
    content: string;
    created_at: string;
    sender_username: string | null;
    sender_avatar: string | null;
}

export const chatApi = {
    getConversations: async (): Promise<any[]> => {
        const { data } = await api.get('/chat/conversations');
        return data;
    },
    getMessages: async (friendId: number): Promise<ChatMessage[]> => {
        const { data } = await api.get(`/chat/${friendId}`);
        return data;
    },
    sendMessage: async (friendId: number, content: string): Promise<ChatMessage> => {
        const { data } = await api.post(`/chat/${friendId}`, { content });
        return data;
    }
};

// ── Suggestions API ──────────────────────────────────────────────────────────

export const suggestionsApi = {
    create: async (contenido: string): Promise<any> => {
        const { data } = await api.post('/sugerencias', { contenido });
        return data;
    }
};
