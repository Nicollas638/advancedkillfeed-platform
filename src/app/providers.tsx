'use client';

import React from 'react';
import {SessionProvider} from 'next-auth/react';
import {AuthProvider} from '@/context/AuthContext';
import Header from '@/components/Navbar';
import Footer from '@/components/Footer';
import type {Session} from 'next-auth';

interface ProvidersProps {
    session: Session | null;
    children: React.ReactNode;
}

export default function Providers({session, children}: ProvidersProps) {
    return (
        <SessionProvider session={session}>
            <AuthProvider>
                <Header/>
                <main className="flex-grow container mx-auto p-4">{children}</main>
                <Footer/>
            </AuthProvider>
        </SessionProvider>
    );
}
