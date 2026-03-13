import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import api from '../lib/api';

interface User {
    _id: string;
    username: string;
    role: 'ADMIN' | 'MANAGER' | 'STORE_MANAGER' | 'SUPERVISOR' | 'HR_MANAGER' | 'CUSTOMER' | 'SUPPLIER';
    token: string;
}

interface AuthContextType {
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        sessionStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        sessionStorage.removeItem('user');
        // window.location.href = '/login'; // Optional: Force redirect
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};
