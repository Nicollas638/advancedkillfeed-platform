import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true, role: true, createdAt: true }
    });
    res.status(200).json(users);
}
