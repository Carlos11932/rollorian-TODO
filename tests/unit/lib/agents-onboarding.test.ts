import { describe, expect, it } from 'vitest';
import { buildAgentOnboardingSnippets } from '@/lib/agents';

describe('buildAgentOnboardingSnippets', () => {
  it('builds provider-specific snippets with a live token', () => {
    const snippets = buildAgentOnboardingSnippets({
      baseUrl: 'https://rollorian-todo.vercel.app',
      token: 'todo-secret-token',
      repoRootPlaceholder: '/absolute/path/to/rollorian-todo',
      serverName: 'rollorian-todo',
    });

    expect(snippets).toHaveLength(4);
    expect(snippets[0]?.primarySnippet).toContain('codex mcp add rollorian-todo');
    expect(snippets[0]?.primarySnippet).toContain('ROLLORIAN_TODO_AGENT_TOKEN=todo-secret-token');
    expect(snippets[1]?.primarySnippet).toContain('claude mcp add --transport stdio');
    expect(snippets[2]?.primarySnippet).toContain('"type": "stdio"');
    expect(snippets[2]?.primarySnippet).toContain('"ROLLORIAN_TODO_BASE_URL": "https://rollorian-todo.vercel.app"');
    expect(snippets[3]?.secondarySnippet).toContain('curl -H "Authorization: Bearer todo-secret-token"');
  });

  it('falls back to the token placeholder when no live token exists', () => {
    const snippets = buildAgentOnboardingSnippets({
      baseUrl: 'https://rollorian-todo.vercel.app',
      token: null,
      repoRootPlaceholder: '/absolute/path/to/rollorian-todo',
      serverName: 'rollorian-todo',
    });

    for (const snippet of snippets) {
      expect(snippet.primarySnippet).toContain('<TOKEN>');
    }
  });
});
