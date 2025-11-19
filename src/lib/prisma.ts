import {PrismaClient} from '@prisma/client';

// Ebable multiple instances of Prisma Client in development
// due to Hot Reloading
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

// Debug: confirming Prisma client initialization
console.log('Prisma client initialized:', !!prisma);

export default prisma;
