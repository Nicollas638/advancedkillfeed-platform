'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../context/AuthContext';
import useFonts from '../hooks/useFonts';
import FontCard from '../components/FontCard';

export default function Home() {
  const { status, isAdmin, user } = useAuth();
  const { fonts, loading, error, refetch } = useFonts();
  const [searchQuery, setSearchQuery] = useState('');
  const [sampleText, setSampleText] = useState('Sample Text');

    const isAuthenticated = status === 'authenticated';

  // Filter fonts based on search query
  const filteredFonts = fonts.filter(font =>
    font.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-slate-900">
      {/* Hero section */}
      <div className="bg-grid border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              <span className="block">Custom Fonts for</span>
              <span className="block text-red-600 dark:text-rose-500">AdvancedKillFeed</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-xl text-slate-600 dark:text-slate-400">
              Create, manage, and share custom fonts for your Unturned killfeeds
            </p>
            <div className="mt-8 flex flex-col items-center gap-4">
              <input
                type="text"
                value={sampleText}
                onChange={e => setSampleText(e.target.value)}
                placeholder="Type to preview..."
                className="w-full max-w-xs px-4 py-2 rounded border border-slate-300 dark:bg-slate-800 dark:text-white"
              />
              <div className="flex justify-center gap-4">
                {isAuthenticated ? (
                  <Link
                    href="/fonts/new"
                    className="inline-flex items-center rounded-md bg-red-600 px-6 py-3 text-base font-medium text-white shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-rose-600 dark:hover:bg-rose-700"
                  >
                    <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Create New Font
                  </Link>
                ) : (
                  <Link
                    href="/api/auth/signin/discord"
                    className="inline-flex items-center rounded-md bg-red-600 px-6 py-3 text-base font-medium text-white shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-rose-600 dark:hover:bg-rose-700"
                  >
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 127.14 96.36" fill="currentColor">
                      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
                    </svg>
                    Sign in with Discord
                  </Link>
                )}
                <Link
                  href="/fonts"
                  className="inline-flex items-center rounded-md border border-transparent bg-slate-100 px-6 py-3 text-base font-medium text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Browse All Fonts
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Search and filters section */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isAuthenticated ? 'Available Fonts' : 'Community Fonts'}
          </h2>
          <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
            <div className="w-full max-w-xs">
              <label htmlFor="search" className="sr-only">Search fonts</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                </svg>
                </div>
                <input
                  id="search"
                  name="search"
                  type="search"
                  className="w-full rounded-md border-0 bg-white py-1.5 pl-10 pr-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-red-600 dark:bg-slate-800 dark:text-white dark:ring-slate-700 dark:focus:ring-rose-500 sm:text-sm sm:leading-6"
                  placeholder="Search fonts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {filteredFonts.length} {filteredFonts.length === 1 ? 'font' : 'fonts'} available
              </span>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center rounded-md bg-white p-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-700"
                title="Refresh fonts list"
              >
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content area */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-red-600 dark:border-t-rose-500"></div>
          </div>
        ) : error ? (
          <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error loading fonts</h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => refetch()}
                    className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-200 dark:hover:bg-red-900/40"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : filteredFonts.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
            <svg
              className="mx-auto h-12 w-12 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1"
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              ></path>
            </svg>
            <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">No fonts found</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {searchQuery
                ? 'Try searching with different keywords'
                : 'Get started by creating a new font'}
            </p>
            <div className="mt-6">
              {isAuthenticated ? (
                <Link
                  href="/fonts/new"
                  className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:bg-rose-600 dark:hover:bg-rose-500 dark:focus-visible:outline-rose-600"
                >
                  <svg className="-ml-0.5 mr-1.5 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  New Font
                </Link>
              ) : (
                <Link
                  href="/api/auth/signin/discord"
                  className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:bg-rose-600 dark:hover:bg-rose-500 dark:focus-visible:outline-rose-600"
                >
                  Sign in to create
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredFonts.map((font) => (
              <FontCard key={font.id} font={font} sampleText={sampleText} />
            ))}
          </div>
        )}
      </div>

      {/* Info section */}
      <section className="bg-slate-50 py-12 dark:bg-slate-800/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">How It Works</h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Create custom fonts for the AdvancedKillFeed Unturned plugin in three simple steps
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-rose-400">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">1. Upload Images</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Upload PNG images or draw icons directly in the editor
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-rose-400">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">2. Organize Glyphs</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Arrange and edit your glyphs with our intuitive editor
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-rose-400">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">3. Export Font</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Export your custom font for use with AdvancedKillFeed
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Admin section - only shown to admins */}
      {isAdmin && (
        <section className="border-t border-slate-200 py-8 dark:border-slate-700">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-lg bg-red-50 p-6 dark:bg-red-900/20">
              <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-medium text-red-800 dark:text-red-200">Admin Dashboard</h3>
                  <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                    Access administrative tools and user management
                  </p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <Link
                    href="/admin"
                    className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-rose-600 dark:hover:bg-rose-700"
                  >
                    Open Admin Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* User welcome - shown to logged in users */}
      {isAuthenticated && user && (
        <div className="border-t border-slate-200 py-6 dark:border-slate-700">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-lg bg-slate-50 shadow dark:bg-slate-800/50">
              <div className="px-4 py-5 sm:p-6">
                <div className="sm:flex sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      Welcome back, {user.name || 'User'}!
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      Continue working on your fonts or create a new one
                    </p>
                  </div>
                  <div className="mt-4 flex space-x-3 sm:mt-0">
                    <Link
                      href="/fonts/my"
                      className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-100 dark:ring-slate-600 dark:hover:bg-slate-600"
                    >
                      My Fonts
                    </Link>
                    <Link
                      href="/fonts/new"
                      className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-rose-600 dark:hover:bg-rose-700"
                    >
                      New Font
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
