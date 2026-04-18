export const AGENT_CLIENT_KINDS = [
  "PRIVATE_COMPANION",
  "MCP_CLIENT",
  "CUSTOM",
] as const;

export type AgentClientKind = (typeof AGENT_CLIENT_KINDS)[number];

export const AGENT_SCOPES = [
  "items:read",
  "items:write",
  "views:read",
  "history:read",
] as const;

export type AgentScope = (typeof AGENT_SCOPES)[number];

export const AGENT_SCOPE_LABELS: Record<AgentScope, { title: string; description: string }> = {
  "items:read": {
    title: "Read items",
    description: "Read item resources, including list and detail endpoints.",
  },
  "items:write": {
    title: "Write items",
    description: "Create and update items through the agent API.",
  },
  "views:read": {
    title: "Read views",
    description: "Read personal, attention, calendar, undated, and group views.",
  },
  "history:read": {
    title: "Read history",
    description: "Read persisted group item history entries.",
  },
};

export function isAgentScope(value: string): value is AgentScope {
  return AGENT_SCOPES.includes(value as AgentScope);
}
