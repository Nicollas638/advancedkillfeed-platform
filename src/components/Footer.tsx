'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white py-8 dark:border-gray-800 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">AdvancedKillFeed</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Create custom fonts for your Unturned killfeeds with our easy-to-use platform.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Quick Links</h3>
            <ul className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link href="/fonts" className="hover:text-red-600 dark:hover:text-red-400">
                  Browse Fonts
                </Link>
              </li>
              <li>
                <Link href="/fonts/new" className="hover:text-red-600 dark:hover:text-red-400">
                  Create Font
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-red-600 dark:hover:text-red-400">
                  About
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Support</h3>
            <ul className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link href="/help" className="hover:text-red-600 dark:hover:text-red-400">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-red-600 dark:hover:text-red-400">
                  Contact
                </Link>
              </li>
              <li>
                <a
                  href="https://discord.gg/unturned"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-red-600 dark:hover:text-red-400"
                >
                  Discord
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} AdvancedKillFeed Font Manager. Built for the Unturned community.
          </p>
        </div>
      </div>
    </footer>
  );
}
