// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AgentSettingsPanel } from '@/features/settings/components/agent-settings-panel';
import type { AgentClientMutationResponse, AgentClientSummary } from '@/lib/agents';

const mocks = vi.hoisted(() => ({
  createAgentConnectionMock: vi.fn(),
  issueAgentCredentialMock: vi.fn(),
  revokeAgentClientMock: vi.fn(),
  revokeAgentCredentialMock: vi.fn(),
}));

vi.mock('@/lib/api/agents', () => ({
  createAgentConnection: mocks.createAgentConnectionMock,
  issueAgentCredential: mocks.issueAgentCredentialMock,
  revokeAgentClient: mocks.revokeAgentClientMock,
  revokeAgentCredential: mocks.revokeAgentCredentialMock,
}));

function makeClient(overrides: Partial<AgentClientSummary> = {}): AgentClientSummary {
  return {
    id: 'agent-1',
    name: 'Donna',
    kind: 'MCP_CLIENT',
    status: 'ACTIVE',
    createdAt: '2026-04-22T18:00:00.000Z',
    updatedAt: '2026-04-22T18:00:00.000Z',
    lastUsedAt: null,
    credentials: [
      {
        id: 'credential-1',
        tokenPrefix: 'rta_test',
        scopes: ['items:read', 'views:read'],
        createdAt: '2026-04-22T18:00:00.000Z',
        expiresAt: null,
        revokedAt: null,
        lastUsedAt: null,
      },
    ],
    recentEvents: [],
    ...overrides,
  };
}

describe('AgentSettingsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the latest token and refreshes recent events after creating a connection', async () => {
    mocks.createAgentConnectionMock.mockResolvedValue({
      client: makeClient({ id: 'agent-2', name: 'Nueva conexión' }),
      plainToken: 'todo-secret-token',
      recentEvents: [{ id: 'event-1', action: 'agent.created', outcome: 'SUCCESS', createdAt: '2026-04-22T18:05:00.000Z', resourceType: null, resourceId: null, idempotencyKey: null }],
    });

    render(
      <AgentSettingsPanel
        initialClients={[]}
        initialRecentEvents={[]}
      />,
    );

    fireEvent.change(screen.getByLabelText(/nombre de la conexión/i), {
      target: { value: 'Nueva conexión' },
    });

    fireEvent.click(screen.getByRole('button', { name: /crear conexión/i }));

    await waitFor(() => {
      expect(mocks.createAgentConnectionMock).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Nueva conexión',
      }));
    });

    expect(await screen.findByText('todo-secret-token')).toBeInTheDocument();
    expect(screen.getByText('agent.created')).toBeInTheDocument();
  });

  it('disables the rotate button while the credential request is pending', async () => {
    let resolveRequest!: (value: AgentClientMutationResponse) => void;
    mocks.issueAgentCredentialMock.mockReturnValue(new Promise<AgentClientMutationResponse>((resolve) => {
      resolveRequest = resolve;
    }));

    render(
      <AgentSettingsPanel
        initialClients={[makeClient()]}
        initialRecentEvents={[]}
      />,
    );

    const rotateButton = screen.getByRole('button', { name: /rotar token/i });
    fireEvent.click(rotateButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /rotando…/i })).toBeDisabled();
    });

    resolveRequest({
      client: makeClient(),
      plainToken: 'rotated-token',
      recentEvents: [],
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /rotar token/i })).not.toBeDisabled();
    });
  });
});
