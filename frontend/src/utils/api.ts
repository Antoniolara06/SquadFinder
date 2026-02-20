import axios from 'axios';
import type { User, Anuncio, Game } from '../types';

// Instance to connect to backend
export const api = axios.create({
    baseURL: 'http://localhost:5000', // Asumido por app.py
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const authApi = {
    login: async (email: string, password: string): Promise<User> => {
        // Endpoint no definido, suponemos /login
        const { data } = await api.post('/login', { email, password });
        return data;
    },
    register: async (userData: any): Promise<User> => {
        // Endpoint no definido
        const { data } = await api.post('/register', userData);
        return data;
    },
    getCurrentUser: async (): Promise<User> => {
        // Endpoint para checkear sesion
        const { data } = await api.get('/me');
        return data;
    },
    updateProfile: async (userData: Partial<User> | FormData): Promise<User> => {
        const config = userData instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
        const { data } = await api.put('/me/update', userData, config);
        return data;
    }
};

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
    }
};

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

export const playersApi = {
    getAll: async (): Promise<User[]> => {
        const { data } = await api.get('/players');
        return data;
    }
};

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
    }
};

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

