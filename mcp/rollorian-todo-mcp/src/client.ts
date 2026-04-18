type TodoViewFilters = {
  assigneeId?: string;
  datedState?: "dated" | "undated";
  includeCompletedEvents?: boolean;
  itemType?: "task" | "event";
  label?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  status?: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function appendDefined(searchParams: URLSearchParams, value: Record<string, unknown>) {
  for (const [key, entry] of Object.entries(value)) {
    if (entry === undefined || entry === null) {
      continue;
    }

    searchParams.set(key, typeof entry === "boolean" ? String(entry) : String(entry));
  }
}

export class RollorianTodoAgentClient {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(options?: { baseUrl?: string; token?: string }) {
    this.baseUrl = (options?.baseUrl ?? requireEnv("ROLLORIAN_TODO_BASE_URL")).replace(/\/$/, "");
    this.token = options?.token ?? requireEnv("ROLLORIAN_TODO_AGENT_TOKEN");
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.token}`,
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const message = typeof body === "object" && body && "error" in body ? String(body.error) : `HTTP ${response.status}`;
      throw new Error(message);
    }

    return response.json() as Promise<T>;
  }

  listItems(filters: Record<string, unknown> = {}) {
    const searchParams = new URLSearchParams();
    appendDefined(searchParams, filters);
    return this.request(`/api/agent/v1/items${searchParams.size > 0 ? `?${searchParams.toString()}` : ""}`);
  }

  getItem(itemId: string, scope: Record<string, unknown>) {
    const searchParams = new URLSearchParams();
    appendDefined(searchParams, scope);
    return this.request(`/api/agent/v1/items/${encodeURIComponent(itemId)}?${searchParams.toString()}`);
  }

  createItem(body: Record<string, unknown>) {
    return this.request("/api/agent/v1/items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  }

  updateItem(itemId: string, body: Record<string, unknown>) {
    return this.request(`/api/agent/v1/items/${encodeURIComponent(itemId)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  }

  getItemHistory(itemId: string, query: Record<string, unknown>) {
    const searchParams = new URLSearchParams();
    appendDefined(searchParams, query);
    return this.request(`/api/agent/v1/items/${encodeURIComponent(itemId)}/history?${searchParams.toString()}`);
  }

  getMyView(filters?: TodoViewFilters) {
    const searchParams = new URLSearchParams();
    appendDefined(searchParams, filters ?? {});
    return this.request(`/api/agent/v1/views/my${searchParams.size > 0 ? `?${searchParams.toString()}` : ""}`);
  }

  getAttentionView(input: { spaceFilter: "both" | "personal" | "group"; filters?: TodoViewFilters }) {
    const searchParams = new URLSearchParams();
    searchParams.set("spaceFilter", input.spaceFilter);
    appendDefined(searchParams, input.filters ?? {});
    return this.request(`/api/agent/v1/views/attention?${searchParams.toString()}`);
  }

  getCalendarView(input: {
    spaceFilter: "both" | "personal" | "group";
    startAt: string;
    endAt: string;
    filters?: TodoViewFilters;
  }) {
    const searchParams = new URLSearchParams();
    searchParams.set("spaceFilter", input.spaceFilter);
    searchParams.set("startAt", input.startAt);
    searchParams.set("endAt", input.endAt);
    appendDefined(searchParams, input.filters ?? {});
    return this.request(`/api/agent/v1/views/calendar?${searchParams.toString()}`);
  }

  getUndatedView(input: { spaceFilter: "both" | "personal" | "group"; filters?: TodoViewFilters }) {
    const searchParams = new URLSearchParams();
    searchParams.set("spaceFilter", input.spaceFilter);
    appendDefined(searchParams, input.filters ?? {});
    return this.request(`/api/agent/v1/views/undated?${searchParams.toString()}`);
  }

  getGroupView(groupId: string, filters?: TodoViewFilters) {
    const searchParams = new URLSearchParams();
    appendDefined(searchParams, filters ?? {});
    return this.request(`/api/agent/v1/views/groups/${encodeURIComponent(groupId)}${searchParams.size > 0 ? `?${searchParams.toString()}` : ""}`);
  }
}
