'use client';

import React, {useState, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {useAuth} from '@/context/AuthContext';
import Image from 'next/image';
import {
    Upload,
    FileText,
    Sparkles,
    ArrowLeft,
    X,
    Check,
    AlertCircle,
} from 'lucide-react';

// Only keep the minimal fields we need for each glyph
type GlyphData = {
    unicode: number;
    d: string;
};

type CreationMode = 'upload' | 'import';

export default function NewFontPage() {
    const {status} = useAuth();
    const isLoading = status === 'loading';
    const isAuthenticated = status === 'authenticated';
    const router = useRouter();

    // Redirect to Discord if not signed in
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/api/auth/signin/discord');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading || !isAuthenticated) {
        return (
            <div
                className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-b-2 border-red-600 rounded-full mx-auto mb-4"></div>
                    <span className="text-lg font-medium text-slate-700 dark:text-slate-300">
            Loading session…
          </span>
                </div>
            </div>
        );
    }

    // Form state
    const [mode, setMode] = useState<CreationMode>('upload');
    const [fontName, setFontName] = useState('');
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [fontFile, setFontFile] = useState<File | null>(null);
    const [glyphs, setGlyphs] = useState<GlyphData[]>([]);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    // State for adding glyphs manually
    const [addingGlyph, setAddingGlyph] = useState(false);
    const [newGlyphFile, setNewGlyphFile] = useState<File | null>(null);
    const [newGlyphPreview, setNewGlyphPreview] = useState<string>('');
    const [newGlyphUnicode, setNewGlyphUnicode] = useState<string>('');
    const [addingError, setAddingError] = useState('');

    // Extract glyphs whenever a new fontFile arrives in Import mode
    useEffect(() => {
        if (mode !== 'import' || !fontFile) {
            setGlyphs([]);
            return;
        }
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const buffer = reader.result as ArrayBuffer;
                const opentype = await import('opentype.js');
                const font = opentype.parse(buffer);

                // `font.glyphs.glyphs` is an object keyed by index
                const raw = (font as any).glyphs.glyphs;
                const arr = Object.values(raw) as any[];

                const extracted: GlyphData[] = arr
                    .filter(g => typeof g.unicode === 'number')
                    .map(g => ({
                        unicode: g.unicode as number,
                        d: g.getPath(0, 0, 72).toPathData(),
                    }));

                setGlyphs(extracted);
                setError('');
            } catch (e) {
                console.error('Error parsing font:', e);
                setError('Failed to process the font file.');
                setGlyphs([]);
            }
        };
        reader.onerror = () => {
            setError('Failed to read font file.');
            setGlyphs([]);
        };
        reader.readAsArrayBuffer(fontFile);
    }, [mode, fontFile]);

    // Processor for new glyph file (SVG or PNG)
    useEffect(() => {
        if (!newGlyphFile) return;
        const ext = newGlyphFile.name.toLowerCase().split('.').pop();
        if (ext === 'svg') {
            // Read SVG file directly
            const reader = new FileReader();
            reader.onload = () => {
                setNewGlyphPreview(reader.result as string);
            };
            reader.readAsText(newGlyphFile);
        } else if (ext === 'png') {
            // Convert PNG to SVG
            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    const {pngToSvg} = await import('@/lib/potrace');
                    const svg = await pngToSvg(reader.result as ArrayBuffer);
                    setNewGlyphPreview(svg);
                } catch (e) {
                    setAddingError('Error converting PNG to SVG');
                }
            };
            reader.readAsArrayBuffer(newGlyphFile);
        } else {
            setAddingError('Only SVG or PNG files are allowed');
        }
    }, [newGlyphFile]);

    // Handlers for images vs. font file
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const imgs = Array.from(files).filter(f => f.type.startsWith('image/'));
        setSelectedImages(prev => [...prev, ...imgs]);
    };

    const handleFontFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] ?? null;
        if (!f) return;
        const name = f.name.toLowerCase();
        const ok = ['.ttf', '.otf', '.woff', '.woff2'].some(ext => name.endsWith(ext));
        if (!ok) {
            setError('Please select a valid font file (.ttf, .otf, .woff, .woff2)');
            return;
        }
        setFontFile(f);
        setError('');
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };
    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
    };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (mode === 'upload') {
            const imgs = files.filter(f => f.type.startsWith('image/'));
            setSelectedImages(prev => [...prev, ...imgs]);
        } else {
            const fontF = files.find(f =>
                ['.ttf', '.otf', '.woff', '.woff2'].some(ext => f.name.toLowerCase().endsWith(ext))
            );
            if (fontF) {
                setFontFile(fontF);
                setError('');
            }
        }
    };

    const removeImage = (idx: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== idx));
    };


    const handleAddGlyph = () => {
        setAddingError('');
        if (!newGlyphPreview || !newGlyphUnicode) {
            setAddingError('Please provide a unicode and a valid SVG.');
            return;
        }
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(newGlyphPreview, 'image/svg+xml');
            const path = doc.querySelector('path');
            if (!path) throw new Error('No path found in SVG');
            setGlyphs(prev => [
                ...prev,
                {unicode: parseInt(newGlyphUnicode, 16), d: path.getAttribute('d') || ''}
            ]);
            setNewGlyphFile(null);
            setNewGlyphPreview('');
            setNewGlyphUnicode('');
            setAddingGlyph(false);
        } catch (e) {
            setAddingError('Invalid SVG format');
        }
    };

    // Submit form
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!fontName.trim()) {
            setError('Font name is required');
            return;
        }
        if (mode === 'upload' && selectedImages.length === 0) {
            setError('Please select at least one image');
            return;
        }
        if (mode === 'import' && !fontFile) {
            setError('Please select a font file');
            return;
        }

        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('name', fontName);
            fd.append('mode', mode);
            if (mode === 'upload') {
                selectedImages.forEach((file, i) => fd.append(`image_${i}`, file));
            } else {
                fd.append('fontFile', fontFile!);
            }

            const res = await fetch('/api/fonts', {method: 'POST', body: fd});
            if (!res.ok) throw new Error('Error creating font');
            router.push('/');
        } catch (err) {
            console.error(err);
            setError('Error creating font. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
            <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-xl shadow-lg p-8">
                <h1 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">New Font</h1>

                {/* Mode cards */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {[{m: 'upload', icon: Upload, title: 'Upload Images', desc: 'Convert images to glyphs'},
                        {m: 'import', icon: FileText, title: 'Import Font File', desc: 'Upload TTF/OTF/WOFF'}
                    ].map(({m, icon: Icon, title, desc}) => (
                        <div
                            key={m}
                            onClick={() => setMode(m as CreationMode)}
                            className={`relative rounded-2xl border-2 cursor-pointer p-6 transition-transform ${
                                mode === m
                                    ? 'border-red-500 bg-red-50 dark:bg-red-950/20 shadow-lg shadow-red-500/20'
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:scale-105'
                            }`}
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`p-3 rounded-xl ${
                                    mode === m ? 'bg-red-100 dark:bg-red-900/30' : 'bg-slate-100 dark:bg-slate-700'
                                }`}>
                                    <Icon className={`w-6 h-6 ${
                                        mode === m ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'
                                    }`}/>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        {title}
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        {desc}
                                    </p>
                                </div>
                            </div>
                            {mode === m && (
                                <div className="absolute top-4 right-4">
                                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                        <Check className="w-4 h-4 text-white"/>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}
                      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-xl">
                    {/* Font Name */}
                    <div className="mb-8">
                        <label htmlFor="fontName"
                               className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                            Font Name
                        </label>
                        <input
                            id="fontName"
                            type="text"
                            value={fontName}
                            onChange={e => setFontName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                            placeholder="e.g. My Awesome Font"
                            required
                        />
                    </div>

                    {/* Upload section */}
                    {mode === 'upload' && (
                        <div className="mb-8">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                Character Images
                            </label>
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                                    dragOver ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-slate-300 dark:border-slate-600 hover:border-red-400'
                                }`}
                            >
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4"/>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                    Drop images here or click to browse
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400">
                                    PNG, JPG, GIF up to 10MB each
                                </p>
                            </div>
                            {selectedImages.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                                        Selected Images ({selectedImages.length})
                                    </h4>
                                    <div
                                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        {selectedImages.map((file, i) => (
                                            <div key={i} className="relative group">
                                                <div
                                                    className="aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                                                    <Image
                                                        src={URL.createObjectURL(file)}
                                                        alt={file.name}
                                                        width={100}
                                                        height={100}
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(i)}
                                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center"
                                                >
                                                    <X size={16}/>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Import section */}
                    {mode === 'import' && (
                        <div className="mb-8">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                Font File
                            </label>
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                                    dragOver ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-slate-300 dark:border-slate-600 hover:border-red-400'
                                }`}
                            >
                                <input
                                    type="file"
                                    accept=".ttf,.otf,.woff,.woff2"
                                    onChange={handleFontFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4"/>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                    Drop font file here or click to browse
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400">
                                    TTF, OTF, WOFF, WOFF2 up to 50MB
                                </p>
                            </div>

                            {fontFile && (
                                <div className="mt-6 space-y-6">
                                    {/* File info */}
                                    <div
                                        className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-8 h-8 text-red-500"/>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">{fontFile.name}</p>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                                    {(fontFile.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFontFile(null);
                                                setGlyphs([]);
                                            }}
                                            className="p-1 text-slate-400 hover:text-red-500"
                                        >
                                            <X size={20}/>
                                        </button>
                                    </div>

                                    {/* Glyph preview */}
                                    {glyphs.length > 0 ? (
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                                                Font Glyphs ({glyphs.length})
                                            </h4>
                                            <div
                                                className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-3 max-h-80 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600">
                                                {glyphs.map((g, i) => (
                                                    <div
                                                        key={i}
                                                        className="aspect-square bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                                                        title={`U+${g.unicode.toString(16).toUpperCase().padStart(4, '0')}`}
                                                    >
                                                        <svg width={24} height={24} viewBox="0 0 600 600">
                                                            <path d={g.d} fill="currentColor"/>
                                                        </svg>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        // Show spinner while extracting
                                        fontFile && !error && (
                                            <div
                                                className="p-6 text-center bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600">
                                                <div
                                                    className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-3"></div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                                    Extracting glyphs…
                                                </p>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div
                            className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-red-500"/>
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 py-3 px-6 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={
                                submitting ||
                                !fontName.trim() ||
                                (mode === 'upload' && selectedImages.length === 0) ||
                                (mode === 'import' && !fontFile)
                            }
                            className="flex-1 py-3 px-6 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 disabled:opacity-50"
                        >
                            {submitting
                                ? 'Creating…'
                                : 'Create Font'}
                        </button>
                    </div>
                </form>

                {/* Galería de glyphs */}
                {glyphs.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold mb-2 text-slate-700 dark:text-slate-200">Glyphs</h2>
                        <div className="grid grid-cols-6 gap-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                            {glyphs.map((g, i) => (
                                <div key={i}
                                     className="flex flex-col items-center p-2 bg-white dark:bg-slate-900 rounded shadow">
                                    <svg width="36" height="36" viewBox="0 0 72 72">
                                        <path d={g.d} fill="currentColor"/>
                                    </svg>
                                    <span
                                        className="text-xs mt-1 text-slate-500">U+{g.unicode.toString(16).toUpperCase()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Glyph add form */}
                <div className="mb-8">
                    <button
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        onClick={() => setAddingGlyph(v => !v)}
                        type="button"
                    >
                        {addingGlyph ? 'Cancel' : 'Add Glyph'}
                    </button>
                    {addingGlyph && (
                        <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg flex flex-col gap-4">
                            <input
                                type="file"
                                accept=".svg,.png"
                                onChange={e => setNewGlyphFile(e.target.files?.[0] || null)}
                                className="file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-600 file:text-white"
                            />
                            <input
                                type="text"
                                placeholder="Unicode (hex, e.g. 41 for 'A')"
                                value={newGlyphUnicode}
                                onChange={e => setNewGlyphUnicode(e.target.value)}
                                className="px-2 py-1 rounded border border-slate-300 dark:bg-slate-900 dark:text-white"
                            />
                            {newGlyphPreview && (
                                <div className="flex items-center gap-4">
                                    <span className="text-xs text-slate-500">Preview:</span>
                                    <span
                                        className="inline-block w-12 h-12 bg-white dark:bg-slate-900 rounded flex items-center justify-center border">
                                        <span dangerouslySetInnerHTML={{__html: newGlyphPreview}}/>
                                    </span>
                                </div>
                            )}
                            {addingError && <div className="text-red-600 text-sm">{addingError}</div>}
                            <button
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                                onClick={handleAddGlyph}
                                type="button"
                            >
                                Add Glyph
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
