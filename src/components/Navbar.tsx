'use client';

import React, {useState} from "react";
import {useAuth} from "@/context/AuthContext";
import Logo from "./Logo";
import Navigation from "./Navigation";
import ThemeToggle from "./ThemeToggle";
import UserMenu from "./UserMenu";
import SignInButton from "./SignInButton";

function Navbar() {
    const {user} = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header
            id="page-header"
            className="sticky top-0 z-50 bg-white shadow-md dark:bg-gray-900 dark:border-b dark:border-gray-800"
        >
            <div className="container mx-auto px-4 lg:px-8 xl:max-w-7xl">
                {/* Header */}
                <div className="flex h-[var(--header-height)] items-center justify-between">
                    {/* Logo */}
                    <Logo/>

                    {/*  Desktop Navigation & controls */}
                    <div className="flex items-center gap-4">
                        {/* Desktop*/}
                        <div className="hidden md:block">
                            <Navigation/>
                        </div>

                        {/* Desktop separator only */}
                        <div
                            className="hidden h-8 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent md:block dark:via-gray-700"/>

                        {/* User controls */}
                        <div className="flex items-center gap-2">
                            <ThemeToggle/>
                            {user ? <UserMenu/> : <SignInButton/>}
                        </div>

                        {/* Phone menu */}
                        <button
                            className="ml-2 rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden dark:text-gray-400 dark:hover:bg-gray-800"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24"
                                 stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}/>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Phone Navigation */}
                {mobileMenuOpen && (
                    <div className="border-t border-gray-200 pb-3 pt-2 md:hidden dark:border-gray-700">
                        <Navigation className="flex flex-col space-y-2"/>
                    </div>
                )}
            </div>
        </header>
    );
}

export default Navbar;
