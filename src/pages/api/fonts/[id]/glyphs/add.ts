import type {NextApiRequest, NextApiResponse} from 'next';
import {getServerSession} from 'next-auth/next';
import {authOptions} from '@/config/next-auth';
import {prisma} from '@/lib/prisma';
import {potrace} from '@/lib/potrace';
import fs from 'fs';
import path from 'path';
import {IncomingMessage} from 'http';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({message: 'Method not allowed'});
    }

    const session = await getServerSession(req, res, authOptions);
    if (!session) {
        return res.status(401).json({message: 'Unauthorized'});
    }

    const {id: fontId} = req.query as { id: string };

    // Check font ownership
    const font = await prisma.font.findUnique({where: {id: fontId}});
    if (!font) {
        return res.status(404).json({message: 'Font not found'});
    }

    const isOwner = font.ownerId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
        return res.status(403).json({message: 'Forbidden'});
    }

    try {
        // Parse multipart form data without formidable
        const {fields, files} = await parseMultipartForm(req);

        let unicode = (fields.unicode || '').trim();
        const file = files.file;

        // Only file is required; unicode can be auto-generated
        if (!file) {
            return res.status(400).json({message: 'File is required'});
        }

        // Auto-generate a unique Unicode in the BMP Private Use Area if not provided
        if (!unicode) {
            // Collect existing unicodes for this font
            const existing = await prisma.glyph.findMany({
                where: {fontId},
                select: {unicode: true}
            });
            const used = new Set(existing.map(g => (g.unicode || '').toUpperCase()));

            const START = 0xE000; // PUA start
            const END = 0xF8FF;   // PUA end (inclusive)

            const maxAttempts = 10000;
            let chosen: string | null = null;
            for (let i = 0; i < maxAttempts; i++) {
                const cp = Math.floor(Math.random() * (END - START + 1)) + START;
                const hex = cp.toString(16).toUpperCase().padStart(4, '0');
                if (!used.has(hex)) {
                    chosen = hex;
                    break;
                }
            }
            if (!chosen) {
                for (let cp = START; cp <= END; cp++) {
                    const hex = cp.toString(16).toUpperCase().padStart(4, '0');
                    if (!used.has(hex)) {
                        chosen = hex;
                        break;
                    }
                }
            }
            if (!chosen) {
                return res.status(400).json({message: 'No available private-use code points left in BMP range'});
            }
            unicode = chosen;
        }

        // Normalize unicode to uppercase
        unicode = unicode.toUpperCase();

        let svgContent = '';
        const fileExtension = path.extname(file.filename || '').toLowerCase();

        // Sniff content to detect SVG reliably
        const head = file.data.slice(0, 2000).toString('utf8').trimStart();
        const looksLikeSvg = head.startsWith('<svg') || head.includes('<svg');

        if (fileExtension === '.svg' || looksLikeSvg) {
            // Treat as SVG, clean and store
            svgContent = cleanSVGForFont(file.data.toString('utf8'));
        } else if (fileExtension === '.png') {
            // Convert PNG to vectorized SVG using custom potrace implementation
            try {
                console.log('Converting PNG to vector SVG...');

                // Set a timeout to prevent hanging
                const conversionPromise = potrace(file.data);
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Conversion timeout')), 15000);
                });

                svgContent = await Promise.race([conversionPromise, timeoutPromise]) as string;
                console.log('PNG conversion successful, SVG length:', svgContent.length);
            } catch (error) {
                console.error('Error converting PNG to SVG:', error);
                return res.status(400).json({message: 'Error converting PNG to SVG: ' + (error as Error).message});
            }
        } else {
            return res.status(400).json({message: 'Only SVG and PNG files are supported'});
        }

        // Validate SVG content
        if (!svgContent || !svgContent.includes('<svg')) {
            return res.status(400).json({message: 'Invalid SVG content generated'});
        }
        // Strict policy: disallow embedded rasters
        if (/<(image|foreignObject)\b/i.test(svgContent) || /data:image\//i.test(svgContent)) {
            return res.status(400).json({message: 'SVG cannot contain embedded images. Only vector paths are allowed.'});
        }

        // Check if unicode already exists in this font
        const existingGlyph = await prisma.glyph.findFirst({
            where: {
                fontId: fontId,
                unicode: unicode
            }
        });

        if (existingGlyph) {
            return res.status(400).json({message: 'Glyph with this unicode already exists'});
        }

        // Create new glyph
        const newGlyph = await prisma.glyph.create({
            data: {
                unicode: unicode,
                svg: svgContent,
                fontId: fontId
            }
        });

        return res.status(201).json({
            message: 'Glyph added successfully',
            glyph: newGlyph
        });

    } catch (error) {
        console.error('Error adding glyph:', error);
        return res.status(500).json({message: 'Internal server error: ' + (error as Error).message});
    }
}

/**
 * Parse multipart form data without external dependencies
 */
async function parseMultipartForm(req: NextApiRequest): Promise<{
    fields: { [key: string]: string };
    files: { [key: string]: { filename: string; data: Buffer } };
}> {
    return new Promise((resolve, reject) => {
        let data = Buffer.alloc(0);

        req.on('data', (chunk: Buffer) => {
            data = Buffer.concat([data, chunk]);
        });

        req.on('end', () => {
            try {
                const contentType = req.headers['content-type'] || '';
                const boundary = contentType.split('boundary=')[1];

                if (!boundary) {
                    throw new Error('Invalid multipart form data');
                }

                const parts = data.toString('binary').split(`--${boundary}`);
                const fields: { [key: string]: string } = {};
                const files: { [key: string]: { filename: string; data: Buffer } } = {};

                for (const part of parts) {
                    if (!part.includes('Content-Disposition')) continue;

                    const [headers, ...bodyParts] = part.split('\r\n\r\n');
                    const body = bodyParts.join('\r\n\r\n').replace(/\r\n$/, '');

                    const nameMatch = headers.match(/name="([^"]+)"/);
                    const filenameMatch = headers.match(/filename="([^"]+)"/);

                    if (nameMatch) {
                        const name = nameMatch[1];

                        if (filenameMatch) {
                            // It's a file
                            files[name] = {
                                filename: filenameMatch[1],
                                data: Buffer.from(body, 'binary')
                            };
                        } else {
                            // It's a field
                            fields[name] = body;
                        }
                    }
                }

                resolve({fields, files});
            } catch (error) {
                reject(error);
            }
        });

        req.on('error', reject);
    });
}

/**
 * Clean SVG content to ensure it works properly in fonts and contains no embedded images
 */
function cleanSVGForFont(svgContent: string): string {
    // Remove any embedded images or base64 content - this is crucial!
    let cleaned = svgContent.replace(/<image[^>]*>/gi, '');
    cleaned = cleaned.replace(/href="data:image[^"]*"/gi, '');
    cleaned = cleaned.replace(/xlink:href="data:image[^"]*"/gi, '');

    // Ensure paths and shapes use currentColor instead of specific colors
    cleaned = cleaned.replace(/fill="(?!none)[^"]*"/gi, 'fill="currentColor"');
    cleaned = cleaned.replace(/stroke="(?!none)[^"]*"/gi, 'stroke="currentColor"');

    // Remove any style attributes that might contain colors or embedded content
    cleaned = cleaned.replace(/style="[^"]*"/gi, '');

    // Remove any foreign objects that might contain embedded content
    cleaned = cleaned.replace(/<foreignObject[^>]*>.*?<\/foreignObject>/gis, '');

    // Ensure proper SVG structure
    if (!cleaned.includes('xmlns="http://www.w3.org/2000/svg"')) {
        cleaned = cleaned.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    return cleaned;
}

/**
 * Create a fallback glyph SVG content based on the PNG data
 */
function createFallbackGlyph(pngData: Buffer): string {
    // For simplicity, we'll create a fallback square glyph
    return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <rect x="10" y="10" width="80" height="80" fill="currentColor" />
        </svg>
    `;
}
