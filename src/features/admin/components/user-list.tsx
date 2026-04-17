'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';

type UserRole = string;

interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: UserRole;
  itemCount: number;
}

interface UserListProps {
  users: AdminUser[];
  currentUserId: string;
}

function UserAvatar({ image, name }: { image: string | null; name: string | null }) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt={name ?? ''} className="w-7 h-7 rounded-full object-cover shrink-0" />;
  }
  const initials =
    name
      ?.split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() ?? '?';
  return (
    <div className="w-7 h-7 rounded-full bg-primary-container flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
      {initials}
    </div>
  );
}

export function UserList({ users, currentUserId }: UserListProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  if (users.length === 0) {
    return <p className="text-xs text-on-surface-variant/50 py-2">Sin usuarios.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-outline-variant/10">
            <th className="text-left py-2 pr-4 text-on-surface-variant/60 font-medium">Usuario</th>
            <th className="text-left py-2 pr-4 text-on-surface-variant/60 font-medium">Email</th>
            <th className="text-left py-2 pr-4 text-on-surface-variant/60 font-medium">Rol</th>
            <th className="text-left py-2 pr-4 text-on-surface-variant/60 font-medium">Items</th>
            <th className="text-right py-2 text-on-surface-variant/60 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const canDelete = user.role !== 'SUPERADMIN' && user.id !== currentUserId;
            return (
              <tr key={user.id} className="border-b border-outline-variant/5 last:border-0">
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-2">
                    <UserAvatar image={user.image} name={user.name} />
                    <span className="text-on-surface truncate max-w-[120px]">{user.name ?? '—'}</span>
                  </div>
                </td>
                <td className="py-2.5 pr-4 text-on-surface-variant truncate max-w-[160px]">
                  {user.email ?? '—'}
                </td>
                <td className="py-2.5 pr-4">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-semibold',
                      user.role === 'SUPERADMIN'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-surface-container-high text-on-surface-variant'
                    )}
                  >
                    {user.role === 'SUPERADMIN' ? 'Admin' : 'Usuario'}
                  </span>
                </td>
                <td className="py-2.5 pr-4 text-on-surface-variant">{user.itemCount}</td>
                <td className="py-2.5 text-right">
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(user.id)}
                      disabled={deleting === user.id}
                      className="text-error/70 hover:text-error text-[10px] font-medium transition-colors disabled:opacity-50"
                    >
                      {deleting === user.id ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
