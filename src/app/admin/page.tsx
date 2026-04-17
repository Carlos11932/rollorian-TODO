import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth/require-auth';
import { UserList } from '@/features/admin/components/user-list';
import { InviteForm } from '@/features/admin/components/invite-form';
import { InvitationList } from '@/features/admin/components/invitation-list';

export default async function AdminPage() {
  const { userId } = await requireSuperAdmin();

  const [users, invitations] = await Promise.all([
    prisma.user.findMany({
      include: { _count: { select: { ownedItems: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.invitation.findMany({
      include: { invitedBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const mappedUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image,
    role: u.role,
    itemCount: u._count.ownedItems,
  }));

  const mappedInvitations = invitations.map((inv) => ({
    id: inv.id,
    email: inv.email,
    status: inv.status as 'PENDING' | 'ACCEPTED' | 'EXPIRED',
    createdAt: inv.createdAt.toISOString(),
    expiresAt: inv.expiresAt.toISOString(),
    invitedBy: inv.invitedBy,
  }));

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] px-5 pt-4 pb-4 gap-6 overflow-y-auto">
      <div>
        <h1 className="text-base font-bold text-on-surface font-headline">Panel de Administración</h1>
        <p className="text-xs text-on-surface-variant/60 mt-1">Gestiona usuarios e invitaciones</p>
      </div>

      <section className="bg-surface-container-low rounded-xl p-4">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
          Invitar usuario
        </h2>
        <InviteForm />
      </section>

      <section className="bg-surface-container-low rounded-xl p-4">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
          Invitaciones
        </h2>
        <InvitationList invitations={mappedInvitations} />
      </section>

      <section className="bg-surface-container-low rounded-xl p-4">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
          Usuarios
        </h2>
        <UserList users={mappedUsers} currentUserId={userId} />
      </section>
    </div>
  );
}
