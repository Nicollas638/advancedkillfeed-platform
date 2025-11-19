'use client';

import React, {createContext, useContext, useMemo} from 'react';
import {useSession, signIn, signOut} from 'next-auth/react';
import {Role} from '@/types';

export interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: Role;
}

export interface AuthContextType {
    user: User | null;
    status: 'loading' | 'authenticated' | 'unauthenticated';
    isAdmin: boolean;
    login: () => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({children}: { children: React.ReactNode }) => {
    const {data: session, status} = useSession();

    // Memoize so we only rebuild when session changes
    const user = useMemo<User | null>(() => {
        if (!session?.user) return null;
        return {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
            role: session.user.role,
        };
    }, [session]);

    const isAdmin = user?.role === Role.ADMIN;

    const login = () => signIn('discord');
    const logout = () => signOut({callbackUrl: '/'});

    return (
        <AuthContext.Provider value={{user, status, isAdmin, login, logout}}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be inside AuthProvider');
    return ctx;
};


