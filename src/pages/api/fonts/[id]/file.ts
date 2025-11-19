import { NextApiRequest, NextApiResponse } from 'next';
import { prisma }                         from '@/lib/prisma';

// No response size limit, in case your font is large
export const config = {
    api: { responseLimit: false },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query as { id: string };
    const record = await prisma.font.findUnique({
        where: { id },
        select: { file: true },
    });

    if (!record?.file) {
        return res.status(404).end();
    }

    const buf = record.file; // Node.js Buffer

    // Peek at first 4 bytes to detect format
    const sig = buf.subarray(0, 4);
    const magic = String.fromCharCode(...sig);
    let mime: string, formatHint: string;

    if (magic === '\0\u0001\0\0') {     // 00 01 00 00
        mime       = 'font/ttf';
        formatHint = 'truetype';
    } else if (magic === 'OTTO') {      // OTF
        mime       = 'font/otf';
        formatHint = 'opentype';
    } else if (magic === 'wOFF') {      // WOFF
        mime       = 'font/woff';
        formatHint = 'woff';
    } else if (magic === 'wOF2') {      // WOFF2
        mime       = 'font/woff2';
        formatHint = 'woff2';
    } else {
        // fallback → assume TTF
        mime       = 'font/ttf';
        formatHint = 'truetype';
    }

    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.end(buf);
}
