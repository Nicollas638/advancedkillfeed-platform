import {NextAuthOptions} from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import {PrismaAdapter} from '@next-auth/prisma-adapter';
import {prisma} from '@/lib/prisma';
import {Role} from '@/types';

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID!,
            clientSecret: process.env.DISCORD_CLIENT_SECRET!,
            authorization: {params: {scope: 'identify email guilds'}},
        }),
    ],
    callbacks: {
        async jwt({token, user}) {
            if (user) {
                token.id = user.id;
                token.role = user.role as Role;
            }
            if (!token.role && token.sub) {
                const dbUser = await prisma.user.findUnique({
                    where: {id: token.sub},
                    select: {role: true},
                });
                token.role = dbUser?.role as Role;
            }
            return token;
        },
        async session({session, token}) {
            return {
                ...session,
                user: {
                    id: (token.id as string) || (token.sub as string),
                    name: session.user?.name || null,
                    email: session.user?.email || null,
                    image: session.user?.image || null,
                    role: (token.role as Role) || Role.USER,
                },
            };
        },
    },
    session: {strategy: 'jwt'},
    secret: process.env.NEXTAUTH_SECRET,
    debug: true,
};