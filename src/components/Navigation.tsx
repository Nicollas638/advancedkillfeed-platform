'use client';

import React from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useAuth} from '@/context/AuthContext';

interface NavigationProps {
    className?: string;
}

const Navigation: React.FC<NavigationProps> = ({className = 'flex items-center space-x-8'}) => {
    const pathname = usePathname();
    const {isAdmin} = useAuth();

    // Helper function to determine if a link is active
    const isActive = (path: string) => {
        return pathname === path || pathname?.startsWith(`${path}/`);
    };

    return (
        <nav className={className}>
            <Link
                href="/"
                className="relative group"
            >
              <span className={`font-medium transition-colors ${
                  isActive('/')
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-700 dark:text-slate-300 group-hover:text-rose-500 dark:group-hover:text-rose-400'
              }`}>
                Home
              </span>
                {isActive('/') && (
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-rose-500 rounded-full"></span>
                )}
                <span
                    className="absolute -bottom-1 left-0 w-0 h-0.5 bg-rose-500 rounded-full transition-all duration-300 group-hover:w-full"></span>
            </Link>

            <Link
                href="/fonts"
                className="relative group"
            >
              <span className={`font-medium transition-colors ${
                  isActive('/fonts')
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-700 dark:text-slate-300 group-hover:text-rose-500 dark:group-hover:text-rose-400'
              }`}>
                Fonts
              </span>
                {isActive('/fonts') && (
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-rose-500 rounded-full"></span>
                )}
                <span
                    className="absolute -bottom-1 left-0 w-0 h-0.5 bg-rose-500 rounded-full transition-all duration-300 group-hover:w-full"></span>
            </Link>

            {isAdmin && (
                <Link
                    href="/admin"
                    className="relative group"
                >
                <span className={`font-medium transition-colors ${
                    isActive('/admin')
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-700 dark:text-slate-300 group-hover:text-rose-500 dark:group-hover:text-rose-400'
                }`}>
                  Admin
                </span>
                    {isActive('/admin') && (
                        <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-rose-500 rounded-full"></span>
                    )}
                    <span
                        className="absolute -bottom-1 left-0 w-0 h-0.5 bg-rose-500 rounded-full transition-all duration-300 group-hover:w-full"></span>
                </Link>
            )}
        </nav>
    );
};

export default Navigation;