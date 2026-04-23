'use client';

import { useState, useTransition } from 'react';
import {
  AGENT_CLIENT_KINDS,
  AGENT_SCOPE_LABELS,
  AGENT_SCOPES,
  type AgentScope,
} from '@/lib/agents/constants';
import type { AgentAuditEventSummary, AgentClientSummary } from '@/lib/agents/types';
import {
  createAgentConnection,
  issueAgentCredential,
  revokeAgentClient,
  revokeAgentCredential,
} from '@/lib/api/agents';
import { EmptyState } from '@/features/shared/components/empty-state';
import { cn } from '@/lib/cn';
import { AgentOnboardingPanel } from './agent-onboarding-panel';

interface AgentSettingsPanelProps {
  initialClients: AgentClientSummary[];
  initialRecentEvents: AgentAuditEventSummary[];
  baseUrl: string;
}

const DEFAULT_SCOPES: AgentScope[] = ['items:read', 'items:write', 'views:read', 'history:read'];

function formatDate(value: string | null, emptyLabel: string) {
  if (!value) {
    return emptyLabel;
  }

  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function statusClasses(status: 'ACTIVE' | 'REVOKED' | 'SUCCESS' | 'FAILURE' | 'REJECTED') {
  if (status === 'ACTIVE' || status === 'SUCCESS') {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
  }

  if (status === 'REVOKED' || status === 'REJECTED') {
    return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
  }

  return 'border-rose-500/30 bg-rose-500/10 text-rose-200';
}

function panelClasses() {
  return 'rounded-2xl border border-[rgba(255,255,255,0.06)] bg-surface-container-low/70 p-5 shadow-sm shadow-black/10';
}

function primaryButtonClasses(disabled?: boolean) {
  return cn(
    'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
    disabled
      ? 'cursor-not-allowed bg-primary/40 text-on-primary/60'
      : 'bg-primary text-on-primary hover:bg-primary/90'
  );
}

function secondaryButtonClasses(disabled?: boolean) {
  return cn(
    'inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm font-medium transition-colors',
    disabled
      ? 'cursor-not-allowed border-outline-variant/30 text-on-surface-variant/40'
      : 'border-outline-variant/70 text-on-surface hover:border-primary/50 hover:text-on-surface'
  );
}

export function AgentSettingsPanel({
  initialClients,
  initialRecentEvents,
  baseUrl,
}: AgentSettingsPanelProps) {
  const [clients, setClients] = useState(initialClients);
  const [recentEvents, setRecentEvents] = useState(initialRecentEvents);
  const [connectionName, setConnectionName] = useState('');
  const [connectionKind, setConnectionKind] = useState<(typeof AGENT_CLIENT_KINDS)[number]>('MCP_CLIENT');
  const [selectedScopes, setSelectedScopes] = useState<AgentScope[]>(DEFAULT_SCOPES);
  const [latestToken, setLatestToken] = useState<{ label: string; token: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [isCreating, startCreateTransition] = useTransition();

  function updateClient(nextClient: AgentClientSummary) {
    setClients((current) => {
      const exists = current.some((client) => client.id === nextClient.id);

      if (!exists) {
        return [nextClient, ...current];
      }

      return current.map((client) => client.id === nextClient.id ? nextClient : client);
    });
  }

  function toggleScope(scope: AgentScope) {
    setSelectedScopes((current) =>
      current.includes(scope)
        ? current.filter((value) => value !== scope)
        : [...current, scope],
    );
  }

  function resetCreateForm() {
    setConnectionName('');
    setConnectionKind('MCP_CLIENT');
    setSelectedScopes(DEFAULT_SCOPES);
  }

  function handleCreateConnection() {
    if (!connectionName.trim() || selectedScopes.length === 0) {
      return;
    }

    setError(null);

    startCreateTransition(async () => {
      try {
        const result = await createAgentConnection({
          name: connectionName.trim(),
          kind: connectionKind,
          scopes: selectedScopes,
        });

        updateClient(result.client);
        setRecentEvents(result.recentEvents);
        setLatestToken({
          label: result.client.name,
          token: result.plainToken ?? '',
        });
        resetCreateForm();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'No se pudo crear la conexión.');
      }
    });
  }

  async function handleIssueCredential(client: AgentClientSummary) {
    setBusyKey(`issue:${client.id}`);
    setError(null);

    try {
      const result = await issueAgentCredential(client.id, {
        scopes: client.credentials[0]?.scopes ?? ['items:read'],
      });

      updateClient(result.client);
      setRecentEvents(result.recentEvents);
      setLatestToken({
        label: client.name,
        token: result.plainToken ?? '',
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo rotar el token.');
    } finally {
      setBusyKey(null);
    }
  }

  async function handleRevokeClient(client: AgentClientSummary) {
    setBusyKey(`client:${client.id}`);
    setError(null);

    try {
      const result = await revokeAgentClient(client.id);
      updateClient(result.client);
      setRecentEvents(result.recentEvents);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo revocar la conexión.');
    } finally {
      setBusyKey(null);
    }
  }

  async function handleRevokeCredential(clientId: string, credentialId: string) {
    setBusyKey(`credential:${credentialId}`);
    setError(null);

    try {
      const result = await revokeAgentCredential(clientId, credentialId);
      updateClient(result.client);
      setRecentEvents(result.recentEvents);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo revocar el token.');
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className={panelClasses()}>
          <div className="grid gap-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant/60">
              Agent Platform
            </p>
            <h2 className="text-2xl font-semibold text-on-surface">Conexiones privadas</h2>
            <p className="text-sm text-on-surface-variant">
              Crea tokens por usuario para tus agentes de confianza sin tocar Vercel ni emitir secretos globales.
            </p>
          </div>

          <div className="mt-5 grid gap-4">
            <label className="grid gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-on-surface-variant/70">
                Nombre de la conexión
              </span>
              <input
                type="text"
                value={connectionName}
                onChange={(event) => setConnectionName(event.target.value)}
                placeholder="Ej. Donna en Codex"
                className="rounded-xl border border-outline-variant/60 bg-surface px-3 py-2.5 text-sm text-on-surface outline-none transition-colors focus:border-primary/50"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-on-surface-variant/70">
                Tipo
              </span>
              <select
                value={connectionKind}
                onChange={(event) => setConnectionKind(event.target.value as (typeof AGENT_CLIENT_KINDS)[number])}
                className="rounded-xl border border-outline-variant/60 bg-surface px-3 py-2.5 text-sm text-on-surface outline-none transition-colors focus:border-primary/50"
              >
                {AGENT_CLIENT_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-on-surface-variant/70">
                Scopes
              </p>

              <div className="grid gap-2 md:grid-cols-2">
                {AGENT_SCOPES.map((scope) => (
                  <label
                    key={scope}
                    className="flex gap-3 rounded-xl border border-outline-variant/50 bg-surface px-3 py-3"
                  >
                    <input
                      type="checkbox"
                      checked={selectedScopes.includes(scope)}
                      onChange={() => toggleScope(scope)}
                      className="mt-1"
                    />
                    <span className="grid gap-0.5">
                      <span className="text-sm font-medium text-on-surface">
                        {AGENT_SCOPE_LABELS[scope].title}
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        {AGENT_SCOPE_LABELS[scope].description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {error}
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleCreateConnection}
                disabled={isCreating || !connectionName.trim() || selectedScopes.length === 0}
                className={primaryButtonClasses(isCreating || !connectionName.trim() || selectedScopes.length === 0)}
              >
                {isCreating ? 'Creando…' : 'Crear conexión'}
              </button>
            </div>
          </div>
        </section>

        <section className={panelClasses()}>
          <div className="grid gap-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant/60">
              Token actual
            </p>
            <h2 className="text-xl font-semibold text-on-surface">Visible una sola vez</h2>
            <p className="text-sm text-on-surface-variant">
              Guarda este token en tu gestor de secretos y usa el bloque de onboarding para conectarlo desde tu cliente MCP.
            </p>
          </div>

          <div className="mt-5">
            {latestToken ? (
              <div className="grid gap-3 rounded-2xl border border-primary/25 bg-primary/10 p-4">
                <div>
                  <p className="text-sm font-semibold text-on-surface">{latestToken.label}</p>
                  <p className="text-xs text-on-surface-variant">
                    Copia el token ahora. Luego solo verás el prefijo.
                  </p>
                </div>
                <pre className="overflow-x-auto rounded-xl bg-black/30 px-3 py-3 text-sm text-white">
                  <code>{latestToken.token}</code>
                </pre>
              </div>
            ) : (
              <EmptyState
                icon="key"
                title="Todavía no has emitido ningún token"
                description="Crea o rota una conexión para ver aquí el secreto una sola vez."
                className="min-h-[220px]"
              />
            )}
          </div>

          <div className="mt-5">
            <AgentOnboardingPanel
              baseUrl={baseUrl}
              token={latestToken?.token ?? null}
              repoRootPlaceholder="/absolute/path/to/rollorian-todo"
              serverName="rollorian-todo"
            />
          </div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className={panelClasses()}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-on-surface">Conexiones</h2>
              <p className="text-sm text-on-surface-variant">
                Rota credenciales o revoca conexiones sin perder trazabilidad.
              </p>
            </div>
            <span className="rounded-full border border-outline-variant/60 px-3 py-1 text-xs font-medium text-on-surface-variant">
              {clients.length} activas
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            {clients.length === 0 ? (
              <EmptyState
                icon="hub"
                title="No hay conexiones todavía"
                description="Cuando crees la primera, aparecerá aquí con sus tokens y actividad reciente."
              />
            ) : (
              clients.map((client) => (
                <article
                  key={client.id}
                  className="rounded-2xl border border-outline-variant/50 bg-surface px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="grid gap-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-on-surface">{client.name}</h3>
                        <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-semibold', statusClasses(client.status))}>
                          {client.status}
                        </span>
                      </div>
                      <p className="text-xs uppercase tracking-wide text-on-surface-variant/70">
                        {client.kind} · Último uso {formatDate(client.lastUsedAt, 'sin uso todavía')}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleIssueCredential(client)}
                        disabled={busyKey !== null}
                        className={secondaryButtonClasses(busyKey !== null)}
                      >
                        {busyKey === `issue:${client.id}` ? 'Rotando…' : 'Rotar token'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRevokeClient(client)}
                        disabled={busyKey !== null || client.status === 'REVOKED'}
                        className={secondaryButtonClasses(busyKey !== null || client.status === 'REVOKED')}
                      >
                        {busyKey === `client:${client.id}` ? 'Revocando…' : 'Revocar conexión'}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2">
                    {client.credentials.map((credential) => (
                      <div
                        key={credential.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-3"
                      >
                        <div className="grid gap-1">
                          <p className="text-sm font-medium text-on-surface">
                            {credential.tokenPrefix}
                            <span className="ml-2 text-xs font-normal text-on-surface-variant">
                              {formatDate(credential.createdAt, 'fecha desconocida')}
                            </span>
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            {credential.scopes.join(', ')}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRevokeCredential(client.id, credential.id)}
                          disabled={busyKey !== null || credential.revokedAt !== null}
                          className={secondaryButtonClasses(busyKey !== null || credential.revokedAt !== null)}
                        >
                          {busyKey === `credential:${credential.id}` ? 'Revocando…' : credential.revokedAt ? 'Revocado' : 'Revocar token'}
                        </button>
                      </div>
                    ))}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className={panelClasses()}>
          <div className="grid gap-1">
            <h2 className="text-xl font-semibold text-on-surface">Actividad reciente</h2>
            <p className="text-sm text-on-surface-variant">
              Cada mutación refresca esta lista para que el panel no quede obsoleto.
            </p>
          </div>

          <div className="mt-5 grid gap-3">
            {recentEvents.length === 0 ? (
              <EmptyState
                icon="history"
                title="Sin actividad todavía"
                description="Cuando una conexión cree, rote o revoque tokens, verás aquí la auditoría."
              />
            ) : (
              recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-xl border border-outline-variant/50 bg-surface px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-on-surface">{event.action}</p>
                    <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-semibold', statusClasses(event.outcome))}>
                      {event.outcome}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {formatDate(event.createdAt, 'fecha desconocida')}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
