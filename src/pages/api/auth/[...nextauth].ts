import NextAuth from 'next-auth';
import {authOptions} from '@/config/next-auth';


export default NextAuth(authOptions);
