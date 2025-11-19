'use client';

import React, {useEffect, useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {Font} from '../types';

interface FontCardProps {
    font: Font;
    sampleText?: string;
}

export default function FontCard({
                                     font,
                                     sampleText = 'Sample Text',
                                 }: FontCardProps) {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let objectUrl: string;

        async function loadFont() {
            const res = await fetch(`/api/fonts/${font.id}/file`);
            if (!res.ok) throw new Error('Font file failed to load');
            const arrayBuffer = await res.arrayBuffer();

            const headerBytes = new Uint8Array(arrayBuffer.slice(0, 4));
            const header = String.fromCharCode(...headerBytes);
            let mime: string, format: string;

            if (header === '\0\x01\0\0') {
                mime = 'font/ttf';
                format = 'truetype';
            } else if (header === 'OTTO') {
                mime = 'font/otf';
                format = 'opentype';
            } else if (header === 'wOFF') {
                mime = 'font/woff';
                format = 'woff';
            } else if (header === 'wOF2') {
                mime = 'font/woff2';
                format = 'woff2';
            } else {
                mime = 'font/ttf';
                format = 'truetype';
            }

            const blob = new Blob([arrayBuffer], {type: mime});
            objectUrl = URL.createObjectURL(blob);

            const face = new FontFace(font.name, `url(${objectUrl}) format('${format}')`);
            await face.load();
            document.fonts.add(face);

            setLoaded(true);
        }

        loadFont().catch(console.error);

        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [font.id, font.name]);

    return (
        <Link
            href={`/fonts/${font.id}/view`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:border-slate-700 dark:bg-slate-800"
        >
            {/* Área de previsualización */}
            <div className="relative flex h-48 items-center justify-center bg-slate-50 dark:bg-slate-900/50 p-4">
                {/* Elemento decorativo */}
                <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>

                <div
                    className="text-3xl font-medium text-slate-800 dark:text-white transition-all duration-300 group-hover:text-rose-600 dark:group-hover:text-rose-400"
                    style={{
                        fontFamily: font.name,
                        opacity: loaded ? 1 : 0.2,
                    }}
                >
                    {sampleText}
                </div>
                {!loaded && (
                    <svg
                        className="absolute animate-spin text-rose-500 w-6 h-6"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8z"
                        />
                    </svg>
                )}
                <span
                    className="absolute top-3 right-3 rounded-full bg-rose-500 px-3 py-1 text-xs font-medium text-white">
                                    {font.glyphCount} glyphs
                                </span>
            </div>

            {/* Metadatos */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-700">
                <h3 className="font-semibold text-lg text-slate-800 dark:text-white mb-1 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    {font.name}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                    {new Date(font.createdAt).toLocaleDateString()}
                </p>
                {font.owner && (
                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <div
                            className="h-7 w-7 overflow-hidden rounded-full bg-rose-100 dark:bg-slate-700 ring-2 ring-rose-500/20 dark:ring-rose-500/30">
                            {font.owner.name && (
                                <Image
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                        font.owner.name
                                    )}&background=c81e78&color=fff`}
                                    alt={font.owner.name}
                                    width={28}
                                    height={28}
                                />
                            )}
                        </div>
                        <span>{font.owner.name || 'Unknown creator'}</span>
                    </div>
                )}
            </div>
        </Link>
    );
}