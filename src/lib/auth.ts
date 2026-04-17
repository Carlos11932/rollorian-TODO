import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  trustHost: true,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
    async signIn({ user }) {
      const allowedEmails = process.env['ALLOWED_EMAILS']
        ?.split(',')
        .map((e) => e.trim())
        .filter(Boolean) ?? [];

      // If no allowlist configured, allow any Google user
      if (allowedEmails.length === 0) return true;

      return allowedEmails.includes(user.email ?? '');
    },
  },
});
