import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin, UnauthorizedError, ForbiddenError } from '@/lib/auth/require-auth';

export async function GET() {
  try {
    await requireSuperAdmin();

    const invitations = await prisma.invitation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        invitedBy: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireSuperAdmin();

    const body = await request.json();
    const email: string = body?.email ?? '';

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 422 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User already registered' }, { status: 409 });
    }

    const pendingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    });
    if (pendingInvitation) {
      return NextResponse.json({ error: 'Invitation already pending' }, { status: 409 });
    }

    const invitation = await prisma.invitation.create({
      data: {
        email,
        invitedById: userId,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({ invitation }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
