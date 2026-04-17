'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';

type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED';

interface Invitation {
  id: string;
  email: string;
  status: InvitationStatus;
  createdAt: string;
  expiresAt: string;
  invitedBy: { id: string; name: string | null };
}

interface InvitationListProps {
  invitations: Invitation[];
}

const STATUS_LABEL: Record<InvitationStatus, string> = {
  PENDING: 'Pendiente',
  ACCEPTED: 'Aceptada',
  EXPIRED: 'Expirada',
};

const STATUS_CLASSES: Record<InvitationStatus, string> = {
  PENDING: 'bg-secondary/10 text-secondary',
  ACCEPTED: 'bg-primary/10 text-primary',
  EXPIRED: 'bg-error/10 text-error',
};

export function InvitationList({ invitations }: InvitationListProps) {
  const router = useRouter();
  const [revoking, setRevoking] = useState<string | null>(null);

  async function handleRevoke(id: string) {
    setRevoking(id);
    try {
      await fetch(`/api/admin/invitations/${id}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setRevoking(null);
    }
  }

  if (invitations.length === 0) {
    return <p className="text-xs text-on-surface-variant/50 py-2">Sin invitaciones aún.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-outline-variant/10">
            <th className="text-left py-2 pr-4 text-on-surface-variant/60 font-medium">Email</th>
            <th className="text-left py-2 pr-4 text-on-surface-variant/60 font-medium">Estado</th>
            <th className="text-left py-2 pr-4 text-on-surface-variant/60 font-medium">Expira</th>
            <th className="text-right py-2 text-on-surface-variant/60 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {invitations.map((inv) => (
            <tr key={inv.id} className="border-b border-outline-variant/5 last:border-0">
              <td className="py-2.5 pr-4 text-on-surface">{inv.email}</td>
              <td className="py-2.5 pr-4">
                <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold', STATUS_CLASSES[inv.status])}>
                  {STATUS_LABEL[inv.status]}
                </span>
              </td>
              <td className="py-2.5 pr-4 text-on-surface-variant">
                {new Date(inv.expiresAt).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </td>
              <td className="py-2.5 text-right">
                {inv.status === 'PENDING' && (
                  <button
                    type="button"
                    onClick={() => handleRevoke(inv.id)}
                    disabled={revoking === inv.id}
                    className="text-error/70 hover:text-error text-[10px] font-medium transition-colors disabled:opacity-50"
                  >
                    {revoking === inv.id ? 'Revocando...' : 'Revocar'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
