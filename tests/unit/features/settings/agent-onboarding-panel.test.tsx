// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AgentOnboardingPanel } from '@/features/settings/components/agent-onboarding-panel';

describe('AgentOnboardingPanel', () => {
  it('renders the default Codex onboarding with detected values', () => {
    render(
      <AgentOnboardingPanel
        baseUrl="https://rollorian-todo.vercel.app"
        token="todo-secret-token"
        repoRootPlaceholder="/absolute/path/to/rollorian-todo"
        serverName="rollorian-todo"
      />,
    );

    expect(screen.getByText('Onboarding MCP')).toBeInTheDocument();
    expect(screen.getByText('https://rollorian-todo.vercel.app')).toBeInTheDocument();
    expect(screen.getByText('/absolute/path/to/rollorian-todo')).toBeInTheDocument();
    expect(screen.getByText(/codex mcp add rollorian-todo/)).toBeInTheDocument();
    expect(screen.getAllByText(/ROLLORIAN_TODO_AGENT_TOKEN=todo-secret-token/)).toHaveLength(2);
  });
});
