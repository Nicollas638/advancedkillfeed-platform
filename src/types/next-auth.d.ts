import NextAuth from 'next-auth';
import {Role} from './index';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            role: Role;
            name?: string | null;
            email?: string | null;
            image?: string | null;
        };
    }

    interface User {
        id: string;
        role: Role;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id?: string;
        role?: Role;
    }
}
