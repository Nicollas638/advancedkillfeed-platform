'use client';

import {useEffect, useState} from 'react';
import {useParams} from 'next/navigation';
import {useSession} from 'next-auth/react';
import Link from 'next/link';
import GlyphManager from '../../../../components/GlyphManager';

type Glyph = {
    id: string;
    unicode: string;
    svg?: string;
};

type Font = {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    ownerId: string;
    owner: {
        name: string;
    };
    glyphs: Glyph[];
};

export default function ViewFont() {
    const params = useParams();
    const fontId = params.id as string;
    const {data: session} = useSession();

    const [font, setFont] = useState<Font | null>(null);
    const [loaded, setLoaded] = useState(false);
    const [previewText, setPreviewText] = useState('Hello World');
    const [fontSize, setFontSize] = useState(48);
    const [isOwner, setIsOwner] = useState(false);

    // Edit mode states
    const [editMode, setEditMode] = useState(false);
    const [editingGlyph, setEditingGlyph] = useState<Glyph | null>(null);
    const [glyphIndex, setGlyphIndex] = useState(-1);
    const [unicodeInput, setUnicodeInput] = useState('');
    const [saving, setSaving] = useState(false);

    // Zoom modal states
    const [zoomedGlyph, setZoomedGlyph] = useState<Glyph | null>(null);
    const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);

    const handleGlyphClick = (glyph: Glyph, index: number) => {
        if (editMode && isOwner) {
            setEditingGlyph(glyph);
            setGlyphIndex(index);
            setUnicodeInput(glyph.unicode);
        } else {
            // Open zoom modal
            setZoomedGlyph(glyph);
            setIsZoomModalOpen(true);
        }
    };

    const closeZoomModal = () => {
        setIsZoomModalOpen(false);
        setZoomedGlyph(null);
    };

    // Reload font data when a new glyph is added
    const handleGlyphAdded = async () => {
        try {
            const response = await fetch(`/api/fonts/${fontId}`);
            if (response.ok) {
                const data = await response.json();
                setFont(data);
                // Reload the font in the browser
                if (data.name) {
                    const fontFace = new FontFace(data.name, `url('/api/fonts/${fontId}/file')`);
                    const loadedFont = await fontFace.load();
                    document.fonts.add(loadedFont);
                }
            }
        } catch (error) {
            console.error('Error reloading font:', error);
        }
    };

    // Handle escape key to close modal
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isZoomModalOpen) {
                closeZoomModal();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isZoomModalOpen]);

    useEffect(() => {
        async function loadFont() {
            try {
                const response = await fetch(`/api/fonts/${fontId}`);
                if (response.ok) {
                    const data = await response.json();
                    setFont(data);
                    setIsOwner(session?.user?.id === data.ownerId);

                    // Load font
                    if (data.name) {
                        const fontFace = new FontFace(data.name, `url('/api/fonts/${fontId}/file')`);
                        const loadedFont = await fontFace.load();
                        document.fonts.add(loadedFont);
                        setLoaded(true);
                    }
                }
            } catch (error) {
                console.error('Error loading font:', error);
            }
        }

        if (fontId) {
            loadFont();
        }
    }, [fontId, session]);

    const saveGlyph = async () => {
        if (!editingGlyph || glyphIndex === -1) return;

        setSaving(true);
        try {
            const response = await fetch(`/api/fonts/${fontId}/glyphs/${glyphIndex}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    unicode: unicodeInput,
                }),
            });

            if (response.ok) {
                // Update the font state
                setFont(prev => {
                    if (!prev) return prev;
                    const updatedGlyphs = [...prev.glyphs];
                    updatedGlyphs[glyphIndex] = {...updatedGlyphs[glyphIndex], unicode: unicodeInput};
                    return {...prev, glyphs: updatedGlyphs};
                });
                setEditingGlyph(null);
                setGlyphIndex(-1);
                setUnicodeInput('');
            }
        } catch (error) {
            console.error('Error saving glyph:', error);
        } finally {
            setSaving(false);
        }
    };

    if (!font) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-center">
                    <div
                        className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <Link href="/fonts" className="text-rose-500 hover:text-rose-600 flex items-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2"
                                  strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="ml-1">Back to Fonts</span>
                    </Link>
                </div>

                <div className="flex flex-col md:flex-row items-start gap-8">
                    <div className="w-full md:w-3/4">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">{font.name}</h1>
                            <p className="text-slate-500 dark:text-slate-400">
                                Created
                                by {font.owner?.name || 'Unknown'} on {new Date(font.createdAt).toLocaleDateString()}
                            </p>
                            <p className="mt-4 text-slate-700 dark:text-slate-300">{font.description}</p>
                        </div>

                        {/* Font Preview Section */}
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center">
                                <span className="w-1.5 h-5 bg-rose-500 rounded-full mr-2"/>
                                Font Preview
                            </h2>
                            <div
                                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={previewText}
                                            onChange={(e) => setPreviewText(e.target.value)}
                                            placeholder="Type something to preview"
                                            className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                        />
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setFontSize(Math.max(12, fontSize - 4))}
                                                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                                                disabled={fontSize <= 12}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                                     xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M5 12H19" stroke="currentColor" strokeWidth="2"
                                                          strokeLinecap="round"/>
                                                </svg>
                                            </button>
                                            <span
                                                className="text-sm text-slate-600 dark:text-slate-400">{fontSize}px</span>
                                            <button
                                                onClick={() => setFontSize(Math.min(96, fontSize + 4))}
                                                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                                                disabled={fontSize >= 96}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                                     xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2"
                                                          strokeLinecap="round"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    <div
                                        className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg min-h-[100px] flex items-center justify-center">
                                        {loaded ? (
                                            <div
                                                style={{
                                                    fontFamily: font.name,
                                                    fontSize: `${fontSize}px`,
                                                    color: '#c81e78',
                                                }}
                                            >
                                                {previewText || 'Type something to preview'}
                                            </div>
                                        ) : (
                                            <div
                                                className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* All Glyphs Section */}
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center justify-between">
                                <span className="flex items-center">
                                    <span className="w-1.5 h-5 bg-rose-500 rounded-full mr-2"/>
                                    All Glyphs
                                </span>
                                {isOwner && (
                                    <button
                                        onClick={() => setEditMode(!editMode)}
                                        className="px-3 py-1 text-xs rounded-full bg-rose-100 text-rose-600 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-300"
                                    >
                                        {editMode ? 'Finish Editing' : 'Edit Glyphs'}
                                    </button>
                                )}
                            </h2>
                            <div
                                className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 bg-slate-50 dark:bg-slate-700 p-4 rounded-xl">
                                {font.glyphs.map((g, idx) => {
                                    const cp = parseInt(g.unicode, 16);
                                    const char = isNaN(cp) ? '?' : String.fromCodePoint(cp);

                                    return (
                                        <div
                                            key={idx}
                                            className={`flex flex-col items-center p-3 bg-white dark:bg-slate-800 rounded-lg cursor-pointer transition-all hover:scale-105 ${
                                                editMode && isOwner
                                                    ? 'hover:bg-rose-50 dark:hover:bg-rose-900/20'
                                                    : 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                            }`}
                                            onClick={() => handleGlyphClick(g, idx)}
                                            title={editMode && isOwner ? "Click to edit" : "Click to zoom"}
                                        >
                                            {loaded ? (
                                                <span
                                                    style={{
                                                        fontFamily: font.name,
                                                        fontSize: fontSize * 0.6,
                                                        color: '#c81e78',
                                                    }}
                                                >
                                                    {char}
                                                </span>
                                            ) : (
                                                <div
                                                    className="w-6 h-6 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                                            )}
                                            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                U+{g.unicode.toUpperCase()}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-1/4">
                        <div
                            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 sticky top-8">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Font
                                Information</h3>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-sm text-slate-500 dark:text-slate-400">Glyphs:</span>
                                    <span className="ml-2 text-slate-800 dark:text-white">{font.glyphs.length}</span>
                                </div>
                                <div>
                                    <span className="text-sm text-slate-500 dark:text-slate-400">Owner:</span>
                                    <span
                                        className="ml-2 text-slate-800 dark:text-white">{font.owner?.name || 'Unknown'}</span>
                                </div>
                                <div>
                                    <span className="text-sm text-slate-500 dark:text-slate-400">Created:</span>
                                    <span className="ml-2 text-slate-800 dark:text-white">
                                        {new Date(font.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            {/* Glyph Manager - Only for owners */}
                            {isOwner && (
                                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-600">
                                    <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">
                                        Manage Glyphs
                                    </h4>
                                    <GlyphManager fontId={fontId} onGlyphAdded={handleGlyphAdded}/>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Edit Modal */}
                {editingGlyph && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-96">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Edit Glyph</h3>
                            <div className="space-y-4">
                                <div>
                                    <label
                                        className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Unicode (hex)
                                    </label>
                                    <input
                                        type="text"
                                        value={unicodeInput}
                                        onChange={(e) => setUnicodeInput(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                        placeholder="e.g., 0041"
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => {
                                            setEditingGlyph(null);
                                            setGlyphIndex(-1);
                                            setUnicodeInput('');
                                        }}
                                        className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={saveGlyph}
                                        className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-50"
                                        disabled={saving}
                                    >
                                        {saving ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Zoom Modal */}
            {isZoomModalOpen && zoomedGlyph && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
                    onClick={closeZoomModal}
                >
                    <div
                        className="bg-white dark:bg-slate-800 rounded-xl p-8 max-w-lg w-full mx-4 transform transition-all"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-semibold text-slate-800 dark:text-white">
                                    Glyph Details
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                                    Unicode: U+{zoomedGlyph.unicode.toUpperCase()}
                                </p>
                            </div>
                            <button
                                onClick={closeZoomModal}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                                     xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2"
                                          strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        </div>

                        <div className="flex flex-col items-center space-y-6">
                            <div
                                className="w-48 h-48 bg-slate-50 dark:bg-slate-700 rounded-xl flex items-center justify-center border-2 border-slate-200 dark:border-slate-600">
                                {loaded ? (
                                    <span
                                        style={{
                                            fontFamily: font?.name,
                                            fontSize: '120px',
                                            color: '#c81e78',
                                            lineHeight: 1,
                                        }}
                                    >
                                        {(() => {
                                            const cp = parseInt(zoomedGlyph.unicode, 16);
                                            return isNaN(cp) ? '?' : String.fromCodePoint(cp);
                                        })()}
                                    </span>
                                ) : (
                                    <div
                                        className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                                )}
                            </div>

                            <div className="text-center space-y-2">
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Character Code: <span
                                    className="font-mono">{parseInt(zoomedGlyph.unicode, 16)}</span>
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-500">
                                    Press Esc to close or click outside
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}