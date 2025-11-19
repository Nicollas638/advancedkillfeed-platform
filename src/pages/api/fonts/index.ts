import {NextApiRequest, NextApiResponse} from 'next';
import {getServerSession} from 'next-auth/next';
import formidable, {Fields, Files} from 'formidable';
import fs from 'fs';
import {prisma} from '@/lib/prisma';
import {authOptions} from '@/config/next-auth';
import potrace from 'potrace';

// Disable Next.js default body parser
export const config = {
    api: {
        bodyParser: false,
        responseLimit: false,
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method === 'GET') return handleGet(req, res);
        if (req.method === 'POST') return handlePost(req, res);

        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end('Method Not Allowed');
    } catch (e) {
        console.error('Unexpected error in /api/fonts:', e);
        return res.status(500).json({error: 'Internal Server Error'});
    }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
    const fonts = await prisma.font.findMany({
        include: {
            owner: {select: {id: true, name: true}},
            _count: {select: {glyphs: true}},
        },
        orderBy: {createdAt: 'desc'},
    });

    const payload = fonts.map(f => ({
        id: f.id,
        name: f.name,
        createdAt: f.createdAt,
        owner: f.owner,
        glyphCount: f._count.glyphs,
        url: `/api/fonts/${f.id}/file`,
    }));

    return res.status(200).json(payload);
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {

    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
        return res.status(401).json({error: 'Not authenticated'});
    }


    const form = formidable({maxFileSize: 50 * 1024 * 1024, multiples: true});
    let fields: Fields, files: Files;
    try {
        [fields, files] = await form.parse(req);
    } catch (err) {
        console.error('Form parse error:', err);
        return res.status(400).json({error: 'Malformed form data'});
    }


    const rawName = fields.name;
    const rawMode = fields.mode;
    const fontName = Array.isArray(rawName) ? rawName[0] : rawName;
    const mode = Array.isArray(rawMode) ? rawMode[0] : rawMode;

    if (typeof fontName !== 'string' || !fontName.trim()) {
        return res.status(400).json({error: 'Font name is required'});
    }
    if (mode !== 'upload' && mode !== 'import') {
        return res.status(400).json({error: 'Invalid mode'});
    }


    const exists = await prisma.font.findFirst({
        where: {name: fontName, ownerId: session.user.id},
    });
    if (exists) {
        return res.status(400).json({error: 'You already have a font with this name'});
    }


    let initialFile = Buffer.alloc(0);
    if (mode === 'import') {
        // leer buffer de la subida antes de crear el registro
        const entry = files.fontFile;
        const ff = Array.isArray(entry) ? entry[0] : entry;
        if (!ff || !('filepath' in ff)) {
            return res.status(400).json({error: 'No font file uploaded'});
        }
        initialFile = fs.readFileSync(ff.filepath);
    }

    const font = await prisma.font.create({
        data: {
            name: fontName,
            ownerId: session.user.id,
            glyphCount: 0,
            file: initialFile,
        },
    });

    let glyphCount = 0;


    if (mode === 'upload') {
        const imageFiles = Object.entries(files)
            .filter(([k]) => k.startsWith('image_'))
            .flatMap(([, f]) => Array.isArray(f) ? f : [f])
            .filter((f): f is formidable.File => Boolean(f && 'filepath' in f));

        for (const img of imageFiles) {
            try {
                const buf = fs.readFileSync(img.filepath);
                const svg = await convertImageToSVG(buf, img.originalFilename || 'img');
                const code = String.fromCharCode(65 + glyphCount); // A, B, C…
                await prisma.glyph.create({
                    data: {unicode: code, svg, fontId: font.id},
                });
                glyphCount++;
            } catch (e) {
                console.error('Image processing error:', e);
            } finally {
                fs.unlinkSync(img.filepath);
            }
        }


        try {
            await compileAndStoreFont(font.id, font.name);
        } catch (e) {
            console.error('Font compilation error:', e);
        }


        await prisma.font.update({
            where: {id: font.id},
            data: {glyphCount},
        });
    } else {
        const entry = files.fontFile;
        const ff = Array.isArray(entry) ? entry[0] : entry!;
        try {
            // convertir Buffer → ArrayBuffer
            const nodeBuf = initialFile;
            const arrayBuf = nodeBuf.buffer.slice(nodeBuf.byteOffset, nodeBuf.byteOffset + nodeBuf.byteLength);


            const {parse} = await import('opentype.js');
            const fontObj = parse(arrayBuf);
            const raw = (fontObj as any).glyphs.glyphs;

            for (const g of Object.values(raw) as any[]) {
                if (typeof g.unicode === 'number') {
                    const d = g.getPath(0, 0, 72).toPathData();
                    await prisma.glyph.create({
                        data: {
                            unicode: g.unicode.toString(16),
                            svg: `<path d="${d}" />`,
                            fontId: font.id,
                        },
                    });
                    glyphCount++;
                }
            }

            await prisma.font.update({
                where: {id: font.id},
                data: {glyphCount},
            });
        } catch (e) {
            console.error('Font import error:', e);
            return res.status(500).json({error: 'Failed to process font file'});
        } finally {
            fs.unlinkSync(ff.filepath);
        }
    }


    const created = await prisma.font.findUnique({
        where: {id: font.id},
        include: {
            glyphs: true,
            owner: {select: {id: true, name: true}},
        },
    });

    return res.status(201).json(created);
}

const TH_AUTO = (potrace as any).THRESHOLD_AUTO;
type ConvertOptions = {
    /** 'mono' = monochrome tracing (fast, ideal for logos). 'color' = multicolor posterize. */
    mode?: 'mono' | 'color';
    /** Nº layers if mode='color'. Can be number or thresholds [0..255]. */
    steps?: number | number[];
    /** 0..255 o 'auto' (automatic). */
    threshold?: number | 'auto';
    /** Filter "specks" (small specks) (2 by default). */
    turdSize?: number;
    /** Adjust curves (true by default). */
    optCurve?: boolean;
    /** Tolerance for curve optimization (0.2 by default). */
    optTolerance?: number;
    /** Refill color (mono only). */
    color?: string;
    /** Background color (mono only). */
    background?: string;
    /** Side "black over white" */
    blackOnWhite?: boolean;
};


// ————————————————
// Helpers
// ————————————————

/** Convert an image Buffer to SVG string (placeholder)*/
export async function convertImageToSVG(
    imageBuffer: Buffer,
    filename: string,
    opts: ConvertOptions = {}
): Promise<string> {
    const {
        mode = 'mono',
        steps = 4,
        threshold = 'auto',
        turdSize = 2,
        optCurve = true,
        optTolerance = 0.2,
        color,
        background,
        blackOnWhite = true,
    } = opts;

    const baseParams: any = {
        turdSize,
        optCurve,
        optTolerance,
        blackOnWhite,
        threshold: threshold === 'auto' ? TH_AUTO : threshold,
    };
    if (color) baseParams.color = color;
    if (background) baseParams.background = background;

    if (mode === 'color') {
        const posterizer = new (potrace as any).Posterize({...baseParams, steps});
        await new Promise<void>((resolve, reject) =>
            posterizer.loadImage(imageBuffer, function (this: any, err: unknown) {
                if (err) return reject(err);
                resolve();
            })
        );
        return posterizer.getSVG(); // <svg> with <g><path> layers
    } else {
        const tracer = new (potrace as any).Potrace(baseParams);
        await new Promise<void>((resolve, reject) =>
            tracer.loadImage(imageBuffer, function (this: any, err: unknown) {
                if (err) return reject(err);
                resolve();
            })
        );
        return tracer.getSVG(); // <svg> monochrome (single <path>)
    }
}

/**
 * Recompile a font from its glyphs and store the TTF in the DB
 */
async function compileAndStoreFont(fontId: string, fontName: string) {
    const opentype = await import('opentype.js');
    const {Font, Path, Glyph} = opentype;

    const glyphs = await prisma.glyph.findMany({
        where: {fontId},
        orderBy: {unicode: 'asc'},
    });


    const otGlyphs = glyphs.map(g => {
        const path = Path.fromSVG(g.svg);
        return new Glyph({
            name: `uni${parseInt(g.unicode, 16).toString(16).toUpperCase()}`,
            unicode: parseInt(g.unicode, 16),
            advanceWidth: 600,
            path,
        });
    });


    const notdef = new Glyph({name: '.notdef', unicode: 0, advanceWidth: 600, path: new Path()});


    const fontObj = new Font({
        familyName: fontName,
        styleName: 'Regular',
        unitsPerEm: 1000,
        ascender: 800,
        descender: -200,
        glyphs: [notdef, ...otGlyphs],
    });


    const arrayBuf = fontObj.toArrayBuffer();
    const buf = Buffer.from(arrayBuf);

    await prisma.font.update({
        where: {id: fontId},
        data: {file: buf, glyphCount: glyphs.length},
    });
}
