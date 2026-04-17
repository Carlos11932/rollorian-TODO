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

      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        (session.user as { role: string }).role = dbUser?.role ?? 'USER';
      } catch {
        (session.user as { role: string }).role = 'USER';
      }

      return session;
    },
    async signIn({ user }) {
      const email = user.email ?? '';
      if (!email) return false;

      const superadminEmail = process.env['SUPERADMIN_EMAIL']?.trim();
      if (superadminEmail && email === superadminEmail) return true;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return true;

      const invitation = await prisma.invitation.findFirst({
        where: {
          email,
          status: 'PENDING',
          expiresAt: { gt: new Date() },
        },
      });

      if (invitation) return true;

      const allowedEmails = process.env['ALLOWED_EMAILS']
        ?.split(',')
        .map((e) => e.trim())
        .filter(Boolean) ?? [];
      if (allowedEmails.includes(email)) return true;

      return '/login?error=not-invited';
    },
  },
  events: {
    async createUser({ user }) {
      const email = user.email ?? '';

      const superadminEmail = process.env['SUPERADMIN_EMAIL']?.trim();
      if (superadminEmail && email === superadminEmail) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'SUPERADMIN' },
        }).catch(() => {});
      }

      await prisma.invitation.updateMany({
        where: { email, status: 'PENDING' },
        data: { status: 'ACCEPTED' },
      }).catch(() => {});
    },
  },
});
