import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor() {
    super('Forbidden');
    this.name = 'ForbiddenError';
  }
}

export async function requireAuth(): Promise<{ userId: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();
  return { userId: session.user.id };
}

export async function requireSuperAdmin(): Promise<{
  userId: string;
  role: 'SUPERADMIN';
}> {
  const { userId } = await requireAuth();

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!dbUser || dbUser.role !== 'SUPERADMIN') throw new ForbiddenError();

  return { userId, role: 'SUPERADMIN' };
}
