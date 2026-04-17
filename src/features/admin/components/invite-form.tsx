'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function InviteForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Error al enviar la invitación.');
        return;
      }

      setEmail('');
      router.refresh();
    } catch {
      setError('Error de red. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@ejemplo.com"
          required
          disabled={loading}
          className="flex-1 bg-surface-container-highest border border-outline-variant/20 rounded-lg text-sm text-on-surface px-3 py-2 placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !email}
          className="bg-primary text-on-primary rounded-lg px-4 py-2 text-xs font-bold disabled:opacity-50 transition-opacity"
        >
          {loading ? 'Enviando...' : 'Enviar invitación'}
        </button>
      </div>
      {error && (
        <p className="text-xs text-error bg-error/10 border border-error/30 rounded-lg px-3 py-2">{error}</p>
      )}
    </form>
  );
}
