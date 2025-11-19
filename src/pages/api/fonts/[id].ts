import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/config/next-auth';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Get session and requested font ID
    const session = await getServerSession(req, res, authOptions);
    const { id } = req.query as { id: string };

    // GET — fetch a single font by ID (public)
    if (req.method === 'GET') {
        const font = await prisma.font.findUnique({
            where: { id },
            include: {
                glyphs: true,
                owner: { select: { id: true, name: true, email: true } }
            },
        });
        if (!font) {
            return res.status(404).json({ message: 'Font not found' });
        }
        return res.status(200).json(font);
    }

    // From here on, only authenticated users may modify or delete
    if (!session) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    // Fetch font to check ownership or admin role
    const font = await prisma.font.findUnique({ where: { id } });
    if (!font) {
        return res.status(404).json({ message: 'Font not found' });
    }

    const isOwner = font.ownerId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    // PUT — update a font and its glyphs
    if (req.method === 'PUT') {
        const { name, glyphs } = req.body as {
            name: string;
            glyphs: { unicode: string; svg: string }[];
        };

        if (!name || !Array.isArray(glyphs)) {
            return res.status(400).json({ message: 'Name and glyphs are required' });
        }


        const glyphsNormalized = glyphs.map(g => ({
            unicode: String(g.unicode).toLowerCase(),
            svg: g.svg,
        }));

        const updated = await prisma.font.update({
            where: { id },
            data: {
                name,
                glyphCount: glyphsNormalized.length,
                glyphs: {
                    deleteMany: {},
                    create: glyphsNormalized,
                },
            },
            include: { glyphs: true, owner: { select: { id: true, name: true, email: true } } },
        });

        return res.status(200).json(updated);
    }

    // DELETE — remove a font
    if (req.method === 'DELETE') {
        await prisma.font.delete({ where: { id } });
        return res.status(204).end();
    }

    // Method not allowed
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
}
