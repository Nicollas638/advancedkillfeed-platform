'use client';

import React, {useState, useRef, useEffect} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {useAuth} from '@/context/AuthContext';

const UserMenu: React.FC = () => {
    const {user, logout, isAdmin} = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Default avatar if user has no image
    const avatarUrl = user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0D8ABC&color=fff`;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center overflow-hidden rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <Image
                    src={avatarUrl}
                    alt={user?.name || 'User profile'}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                />
            </button>

            {isOpen && (
                <div
                    className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:ring-gray-700">
                    <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</div>
                        <div className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.email}</div>
                    </div>

                    <div className="py-1">
                        <Link
                            href="/profile"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                            onClick={() => setIsOpen(false)}
                        >
                            Your Profile
                        </Link>

                        <Link
                            href="/fonts/my"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                            onClick={() => setIsOpen(false)}
                        >
                            My Fonts
                        </Link>

                        {isAdmin && (
                            <Link
                                href="/admin"
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                                onClick={() => setIsOpen(false)}
                            >
                                Admin Dashboard
                            </Link>
                        )}
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-700">
                        <button
                            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                            onClick={() => {
                                logout();
                                setIsOpen(false);
                            }}
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
