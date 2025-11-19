'use client';

import {SessionProvider} from 'next-auth/react';
import {AuthProvider, useAuth} from '@/context/AuthContext';
import Header from './Navbar';
import Footer from './Footer';

interface ClientLayoutProps {
    children: React.ReactNode;
    session: any;
}

export default function ClientLayout({children, session}: ClientLayoutProps) {
    return (
        <SessionProvider session={session}>
            <AuthProvider>
                <Header/>
                <main className="flex-grow">
                    {children}
                </main>
                <Footer/>
            </AuthProvider>
        </SessionProvider>
    );
}
