import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin, UnauthorizedError, ForbiddenError } from '@/lib/auth/require-auth';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireSuperAdmin();
    const { id } = await params;

    if (id === userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 422 });
    }

    const memberships = await prisma.membership.findMany({
      where: { userId: id },
      select: { groupId: true },
    });

    for (const { groupId } of memberships) {
      const ownerCount = await prisma.membership.count({
        where: { groupId, role: 'owner' },
      });
      if (ownerCount === 1) {
        return NextResponse.json(
          { error: 'User is the sole owner of one or more groups' },
          { status: 422 }
        );
      }
    }

    await prisma.user.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
