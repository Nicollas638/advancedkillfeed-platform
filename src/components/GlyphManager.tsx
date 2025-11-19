'use client';

import {useState, useRef} from 'react';

interface GlyphManagerProps {
    fontId: string;
    onGlyphAdded: () => void;
}

export default function GlyphManager({fontId, onGlyphAdded}: GlyphManagerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [unicode, setUnicode] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (selectedFile: File) => {
        const validTypes = ['image/svg+xml', 'image/png'];
        if (!validTypes.includes(selectedFile.type)) {
            alert('Please select an SVG or PNG file');
            return;
        }
        setFile(selectedFile);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const generateUnicodeFromChar = (char: string) => {
        if (char.length === 1) {
            const codePoint = char.codePointAt(0);
            if (codePoint) {
                setUnicode(codePoint.toString(16).toUpperCase().padStart(4, '0'));
            }
        }
        // Clear the input after generating unicode
        setTimeout(() => {
            const charInput = document.querySelector('input[maxLength="1"]') as HTMLInputElement;
            if (charInput) charInput.value = '';
        }, 100);
    };

    const convertPNGToSVGInBrowser = async (pngFile: File): Promise<File> => {
        return new Promise((resolve) => {
            const img = new Image();

            img.onload = () => {
                try {
                    console.log(`Processing PNG: ${img.width}x${img.height}`);

                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) throw new Error('Could not get canvas context');

                    // Resize if too large
                    const maxSize = 100;
                    const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
                    canvas.width = Math.floor(img.width * scale);
                    canvas.height = Math.floor(img.height * scale);

                    // Draw image on canvas
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    // Get pixel data
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                    // Create SVG from image data
                    const svg = createSVGFromImageData(imageData);

                    const svgBlob = new Blob([svg], {type: 'image/svg+xml'});
                    const svgFile = new File([svgBlob], pngFile.name.replace('.png', '.svg'), {
                        type: 'image/svg+xml'
                    });

                    console.log('PNG converted to SVG successfully');
                    resolve(svgFile);

                } catch (error) {
                    console.error('Error converting PNG:', error);
                    resolve(pngFile);
                }
            };

            img.onerror = () => {
                console.error('Failed to load image');
                resolve(pngFile);
            };

            img.src = URL.createObjectURL(pngFile);
        });
    };

    const createSVGFromImageData = (imageData: ImageData): string => {
        const {data, width, height} = imageData;
        console.log(`Creating SVG from ${width}x${height} image`);

        // 1) Threshold automático (Otsu simplificado)
        const histogram = new Array(256).fill(0);
        for (let i = 0; i < width * height; i++) {
            const idx = i * 4;
            const a = data[idx + 3];
            if (a < 128) continue;
            const gray = ((data[idx] + data[idx + 1] + data[idx + 2]) / 3) | 0;
            histogram[gray]++;
        }
        let total = 0, sum = 0;
        for (let t = 0; t < 256; t++) {
            total += histogram[t];
            sum += t * histogram[t];
        }
        let sumB = 0, wB = 0, maxVar = 0, threshold = 128;
        for (let t = 0; t < 256; t++) {
            wB += histogram[t];
            if (wB === 0) continue;
            const wF = total - wB;
            if (wF === 0) break;
            sumB += t * histogram[t];
            const mB = sumB / wB;
            const mF = (sum - sumB) / wF;
            const between = wB * wF * (mB - mF) * (mB - mF);
            if (between > maxVar) {
                maxVar = between;
                threshold = t;
            }
        }

        // 2) Binarizar
        const bin = new Uint8Array(width * height);
        let blacks = 0;
        for (let i = 0; i < width * height; i++) {
            const idx = i * 4;
            const a = data[idx + 3] / 255;
            const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            const v = a > 0.5 && gray < threshold ? 1 : 0;
            bin[i] = v;
            blacks += v;
        }
        console.log(`Black pixels: ${blacks}/${width * height} (${((blacks / (width * height)) * 100).toFixed(1)}%) @thr=${threshold}`);

        // 3) Extraer contornos (Marching Squares básico)
        const contours: { x: number, y: number }[][] = [];
        const visited = new Set<string>(); // Marca de vértices visitados
        const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]]; // E,S,O,N
        const isEdge = (x: number, y: number) => {
            if (x <= 0 || x >= width - 1 || y <= 0 || y >= height - 1) return false;
            if (!bin[y * width + x]) return false;
            // Tiene algún vecino blanco
            return (
                bin[y * width + (x - 1)] === 0 || bin[y * width + (x + 1)] === 0 ||
                bin[(y - 1) * width + x] === 0 || bin[(y + 1) * width + x] === 0
            );
        };

        const trace = (sx: number, sy: number) => {
            const path: { x: number, y: number }[] = [];
            let x = sx, y = sy, d = 0; // dirección inicial Este
            let guard = 0;
            while (guard++ < width * height) {
                const key = `${x},${y}`;
                path.push({x, y});
                visited.add(key);
                // gira hasta encontrar siguiente borde
                let found = false;
                for (let i = 0; i < 4; i++) {
                    const nd = (d + i) % 4;
                    const nx = x + dirs[nd][0];
                    const ny = y + dirs[nd][1];
                    if (nx > 0 && nx < width && ny > 0 && ny < height && isEdge(nx, ny) && !visited.has(`${nx},${ny}`)) {
                        x = nx;
                        y = ny;
                        d = nd;
                        found = true;
                        break;
                    }
                }
                if (!found) break;
                if (x === sx && y === sy) break; // cerrado
                if (path.length > 2000) break; // límite de seguridad
            }
            return path;
        };

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                if (isEdge(x, y) && !visited.has(`${x},${y}`)) {
                    const c = trace(x, y);
                    if (c.length > 8) contours.push(c);
                    if (contours.length > 32) break;
                }
            }
            if (contours.length > 32) break;
        }
        console.log(`Contours found: ${contours.length}`);

        if (contours.length === 0) {
            // fallback mínimo si no hay bordes útiles
            const size = Math.min(width, height) * 0.5;
            const cx = width / 2, cy = height / 2;
            return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><rect x="${cx - size / 2}" y="${cy - size / 2}" width="${size}" height="${size}" fill="currentColor"/></svg>`;
        }

        // 4) Simplificar (Douglas-Peucker)
        const dp = (pts: { x: number, y: number }[], eps: number): { x: number, y: number }[] => {
            if (pts.length < 3) return pts;
            let dmax = 0, idx = 0;
            const p0 = pts[0], p1 = pts[pts.length - 1];
            const dist = (p: { x: number, y: number }) => {
                const A = p1.x - p0.x, B = p1.y - p0.y;
                const t = ((p.x - p0.x) * A + (p.y - p0.y) * B) / (A * A + B * B || 1);
                const xx = p0.x + A * t, yy = p0.y + B * t;
                const dx = p.x - xx, dy = p.y - yy;
                return Math.hypot(dx, dy);
            };
            for (let i = 1; i < pts.length - 1; i++) {
                const d = dist(pts[i]);
                if (d > dmax) {
                    dmax = d;
                    idx = i;
                }
            }
            if (dmax > eps) {
                const a = dp(pts.slice(0, idx + 1), eps);
                const b = dp(pts.slice(idx), eps);
                return a.slice(0, -1).concat(b);
            }
            return [p0, p1];
        };

        const paths: string[] = [];
        const maxContours = 12; // limitar salida
        for (let i = 0; i < Math.min(contours.length, maxContours); i++) {
            const c = contours[i];
            const simp = dp(c, 1.8);
            if (simp.length < 3) continue;
            // to path
            let d = `M ${simp[0].x} ${simp[0].y}`;
            for (let j = 1; j < simp.length; j++) d += ` L ${simp[j].x} ${simp[j].y}`;
            d += ' Z';
            paths.push(`<path d="${d}" fill="currentColor"/>`);
        }

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${paths.join('')}</svg>`;
        console.log(`Generated SVG paths: ${paths.length}, size: ${svg.length} chars`);
        return svg;
    };

    const cleanSVGFile = async (svgFile: File): Promise<File> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    let svgContent = e.target?.result as string;

                    // Remove embedded images
                    svgContent = svgContent.replace(/<image[^>]*>/gi, '');
                    svgContent = svgContent.replace(/href="data:image[^"]*"/gi, '');
                    svgContent = svgContent.replace(/xlink:href="data:image[^"]*"/gi, '');

                    // Ensure currentColor is used
                    svgContent = svgContent.replace(/fill="(?!none|currentColor)[^"]*"/gi, 'fill="currentColor"');

                    const cleanedBlob = new Blob([svgContent], {type: 'image/svg+xml'});
                    const cleanedFile = new File([cleanedBlob], svgFile.name, {type: 'image/svg+xml'});

                    console.log('SVG cleaned successfully');
                    resolve(cleanedFile);
                } catch (error) {
                    console.error('Error cleaning SVG:', error);
                    resolve(svgFile);
                }
            };
            reader.readAsText(svgFile);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) {
            alert('Please select a file');
            return;
        }

        console.log('=== GLYPH UPLOAD STARTED ===');
        console.log('Original file:', {
            name: file.name,
            type: file.type,
            size: file.size
        });

        setUploading(true);

        try {
            let processedFile = file;

            if (file.type === 'image/png') {
                // No convertir en el navegador: enviar PNG crudo al backend para vectorizar
                console.log('🔄 File is PNG, sending RAW to server for server-side vectorization...');

                // processedFile = file (ya es el original)
            } else if (file.type === 'image/svg+xml') {
                console.log('🧹 File is SVG, cleaning...');
                processedFile = await cleanSVGFile(file);
            } else {
                console.log('❌ File type not supported:', file.type);
            }

            const formData = new FormData();
            if (unicode.trim()) {
                formData.append('unicode', unicode.trim());
            }
            formData.append('file', processedFile);

            console.log('📤 Sending to server:', {
                unicode: unicode.trim() || '(auto-generate)',
                fileName: processedFile.name,
                fileType: processedFile.type,
                fileSize: processedFile.size
            });

            const response = await fetch(`/api/fonts/${fontId}/glyphs/add`, {
                method: 'POST',
                body: formData,
            });

            console.log('📥 Server response:', response.status, response.statusText);

            if (response.ok) {
                console.log('✅ Glyph upload successful!');
                alert('Glyph added successfully!');
                setUnicode('');
                setFile(null);
                setIsOpen(false);
                onGlyphAdded();
            } else {
                const error = await response.json();
                console.error('❌ Server error:', error);
                alert(`Error: ${error.message}`);
            }
        } catch (error) {
            console.error('💥 Upload error:', error);
            alert('Error uploading glyph: ' + (error as Error).message);
        } finally {
            setUploading(false);
            console.log('=== GLYPH UPLOAD FINISHED ===');
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors flex items-center gap-2"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                          strokeLinejoin="round"/>
                </svg>
                Add Glyph
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-semibold text-slate-800 dark:text-white">
                                    Add New Glyph
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                                    Upload an SVG or PNG file
                                </p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                                     xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2"
                                          strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Unicode Value (Hex)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={unicode}
                                        onChange={(e) => setUnicode(e.target.value.toUpperCase())}
                                        placeholder="0041"
                                        className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                    />
                                    <input
                                        type="text"
                                        placeholder="A"
                                        maxLength={1}
                                        onChange={(e) => generateUnicodeFromChar(e.target.value)}
                                        className="w-12 px-2 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-center"
                                        title="Enter a character to auto-generate unicode"
                                    />
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Optional: leave empty to auto-generate a free Private Use Area codepoint
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Glyph File (SVG or PNG)
                                </label>
                                <div
                                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                                        dragActive
                                            ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
                                            : 'border-slate-300 dark:border-slate-600'
                                    }`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                >
                                    {file ? (
                                        <div className="space-y-2">
                                            <div className="text-green-600 dark:text-green-400">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                                                     xmlns="http://www.w3.org/2000/svg" className="mx-auto">
                                                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2"
                                                          strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </div>
                                            <p className="text-sm text-slate-800 dark:text-white font-medium">
                                                {file.name}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => setFile(null)}
                                                className="text-xs text-rose-500 hover:text-rose-600"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="text-slate-400 dark:text-slate-500">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                                                     xmlns="http://www.w3.org/2000/svg" className="mx-auto">
                                                    <path
                                                        d="M21 15V19A2 2 0 0119 21H5A2 2 0 013 19V15M17 8L12 3L7 8M12 3V15"
                                                        stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                                        strokeLinejoin="round"/>
                                                </svg>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                Drag and drop your file here, or{' '}
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="text-rose-500 hover:text-rose-600 font-medium"
                                                >
                                                    browse
                                                </button>
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                SVG or PNG files only, max 5MB
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".svg,.png"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                            handleFileSelect(e.target.files[0]);
                                        }
                                    }}
                                    className="hidden"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                                    disabled={uploading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    disabled={uploading || !file}
                                >
                                    {uploading ? (
                                        <>
                                            <div
                                                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Uploading...
                                        </>
                                    ) : (
                                        'Add Glyph'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
