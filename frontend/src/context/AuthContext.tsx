import React, { createContext, useState, useEffect, type ReactNode, useContext } from 'react';
import type { User } from '../types';
import { authApi } from '../utils/api';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    register: (userData: any) => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const user = await authApi.getCurrentUser();
                setUser(user);
            } catch (error) {
                // No session
                console.log("No active session found");
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    const login = async (email: string, password: string) => {
        const user = await authApi.login(email, password);
        setUser(user);
    };

    const logout = () => {
        setUser(null);
        // Lógica adicional para limpiar token/cookies si fuera necesario
    };

    const register = async (userData: any) => {
        await authApi.register(userData);
        // Despues del registro, el usuario deberá hacer login manualmente
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            logout,
            register,
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
