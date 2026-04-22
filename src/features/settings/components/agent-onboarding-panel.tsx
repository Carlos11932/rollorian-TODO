'use client';

import { useState } from 'react';
import { AGENT_ONBOARDING_PROVIDERS, buildAgentOnboardingSnippets, type AgentOnboardingProvider } from '@/lib/agents';
import { cn } from '@/lib/cn';

interface AgentOnboardingPanelProps {
  baseUrl: string;
  token: string | null;
  repoRootPlaceholder: string;
  serverName: string;
}

interface CodeBlockProps {
  label: string;
  code: string;
  copyKey: string;
  copiedKey: string | null;
  onCopy: (key: string, value: string) => Promise<void>;
}

const PROVIDER_LABELS: Record<AgentOnboardingProvider, { title: string; description: string }> = {
  codex: {
    title: 'Codex',
    description: 'Registra el MCP desde tu CLI de Codex con el comando ya montado.',
  },
  claude: {
    title: 'Claude Code',
    description: 'Añade el MCP privado de TODO con transporte stdio.',
  },
  cursor: {
    title: 'Cursor',
    description: 'Pega este bloque JSON en la configuración MCP de Cursor.',
  },
  generic: {
    title: 'Cliente genérico',
    description: 'Usa una configuración stdio y un smoke test HTTP mínimo.',
  },
};

const SNIPPET_LABELS = {
  command: 'Comando listo para pegar',
  json: 'Configuración JSON',
  env: 'Variables compartidas',
  curl: 'Smoke test HTTP',
};

function secondaryButtonClasses(copied: boolean) {
  return cn(
    'inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm font-medium transition-colors',
    copied
      ? 'border-primary/50 bg-primary/10 text-on-surface'
      : 'border-outline-variant/70 text-on-surface hover:border-primary/50 hover:text-on-surface',
  );
}

function CodeBlock({
  label,
  code,
  copyKey,
  copiedKey,
  onCopy,
}: CodeBlockProps) {
  const copied = copiedKey === copyKey;

  return (
    <div className="grid gap-2 rounded-xl border border-outline-variant/50 bg-surface px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant/70">{label}</p>
        <button
          type="button"
          onClick={() => void onCopy(copyKey, code)}
          className={secondaryButtonClasses(copied)}
        >
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <pre className="overflow-x-auto rounded-xl bg-black/30 px-3 py-3 text-xs text-white">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function AgentOnboardingPanel({
  baseUrl,
  token,
  repoRootPlaceholder,
  serverName,
}: AgentOnboardingPanelProps) {
  const [selectedProvider, setSelectedProvider] = useState<AgentOnboardingProvider>('codex');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const snippets = buildAgentOnboardingSnippets({
    baseUrl,
    token,
    repoRootPlaceholder,
    serverName,
  });

  const currentSnippet = snippets.find((entry) => entry.provider === selectedProvider) ?? snippets[0];
  if (!currentSnippet) {
    return null;
  }

  const hasLiveToken = Boolean(token?.trim());

  async function handleCopy(key: string, value: string) {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey((current) => current === key ? null : current);
    }, 2000);
  }

  return (
    <div className="grid gap-4 rounded-2xl border border-outline-variant/50 bg-surface-container-low/70 p-5">
      <div className="grid gap-1">
        <h3 className="text-lg font-semibold text-on-surface">Onboarding MCP</h3>
        <p className="text-sm text-on-surface-variant">
          Copia el snippet exacto para tu cliente y sustituye la ruta local por la real en tu máquina.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-outline-variant/50 bg-surface px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant/70">
            Base URL detectada
          </p>
          <p className="mt-2 font-mono text-xs text-on-surface">{baseUrl}</p>
        </div>
        <div className="rounded-xl border border-outline-variant/50 bg-surface px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant/70">
            Ruta local a sustituir
          </p>
          <p className="mt-2 font-mono text-xs text-on-surface">{repoRootPlaceholder}</p>
        </div>
      </div>

      <p className={cn('text-xs font-medium', hasLiveToken ? 'text-emerald-300' : 'text-amber-300')}>
        {hasLiveToken
          ? 'El snippet ya incluye tu último token emitido.'
          : 'Aún no hay token visible; el snippet usa <TOKEN> como placeholder.'}
      </p>

      <div className="flex flex-wrap gap-2">
        {AGENT_ONBOARDING_PROVIDERS.map((provider) => {
          const isActive = provider === selectedProvider;

          return (
            <button
              key={provider}
              type="button"
              aria-pressed={isActive}
              onClick={() => setSelectedProvider(provider)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary/40 bg-primary/15 text-on-surface'
                  : 'border-outline-variant/60 bg-surface text-on-surface-variant hover:text-on-surface',
              )}
            >
              {PROVIDER_LABELS[provider].title}
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 rounded-xl border border-outline-variant/50 bg-surface px-4 py-4">
        <div className="grid gap-1">
          <p className="text-base font-semibold text-on-surface">{PROVIDER_LABELS[selectedProvider].title}</p>
          <p className="text-sm text-on-surface-variant">{PROVIDER_LABELS[selectedProvider].description}</p>
        </div>

        <CodeBlock
          label={SNIPPET_LABELS[currentSnippet.primaryLabel]}
          code={currentSnippet.primarySnippet}
          copyKey={`${selectedProvider}:primary`}
          copiedKey={copiedKey}
          onCopy={handleCopy}
        />

        {currentSnippet.secondarySnippet && currentSnippet.secondaryLabel ? (
          <CodeBlock
            label={SNIPPET_LABELS[currentSnippet.secondaryLabel]}
            code={currentSnippet.secondarySnippet}
            copyKey={`${selectedProvider}:secondary`}
            copiedKey={copiedKey}
            onCopy={handleCopy}
          />
        ) : null}
      </div>
    </div>
  );
}
