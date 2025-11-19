import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/config/next-auth';
import type { NextApiRequest, NextApiResponse } from 'next';

export async function requireRole(
    req: NextApiRequest,
    res: NextApiResponse,
    roles: string[]
) {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !roles.includes(session.user.role!)) {
        res.status(403).json({ message: 'Forbidden' });
        return null;
    }
    return session;
}