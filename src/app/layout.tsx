import './globals.css';
import {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import {getServerSession} from 'next-auth/next';
import {authOptions} from '@/config/next-auth';
import Providers from './providers';

const geistSans = Geist({variable: '--font-geist-sans', subsets: ['latin']});
const geistMono = Geist_Mono({variable: '--font-geist-mono', subsets: ['latin']});

export const metadata: Metadata = {
    title: 'AdvancedKillFeed Font Manager',
    description: 'Create and manage custom fonts for your Unturned killfeeds',
};

export default async function RootLayout({children}: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions);        // ← pass authOptions!

    return (
        <html lang="en" className="h-full">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        <Providers session={session}>
            {children}
        </Providers>
        </body>
        </html>
    );
}
