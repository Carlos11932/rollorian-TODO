import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin, UnauthorizedError, ForbiddenError } from '@/lib/auth/require-auth';

export async function GET() {
  try {
    await requireSuperAdmin();

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        _count: {
          select: { ownedItems: true },
        },
      },
    });

    return NextResponse.json({
      users: users.map(({ _count, ...user }) => ({
        ...user,
        itemCount: _count.ownedItems,
      })),
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
