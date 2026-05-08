import React, { createContext, useState, useEffect, type ReactNode, useContext } from 'react';
import type { User } from '../types';
import { authApi, tokenStorage } from '../utils/api';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    register: (userData: any) => Promise<void>;
    updateUser: (userData: Partial<User>) => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            // Solo intentamos recuperar la sesión si existe un token guardado
            const token = tokenStorage.get();
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const currentUser = await authApi.getCurrentUser();
                setUser(currentUser);
            } catch {
                // Token inválido o expirado → lo borramos
                tokenStorage.remove();
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    const login = async (email: string, password: string) => {
        const userData = await authApi.login(email, password);
        setUser(userData);
    };

    const logout = () => {
        authApi.logout(); // borra el token de localStorage
        setUser(null);
    };

    const register = async (userData: any) => {
        await authApi.register(userData);
    };

    const updateUser = (updatedData: Partial<User>) => {
        if (user) {
            setUser({ ...user, ...updatedData });
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            logout,
            register,
            updateUser,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
