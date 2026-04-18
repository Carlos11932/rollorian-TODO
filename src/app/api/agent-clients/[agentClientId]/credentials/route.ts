import type { NextRequest } from "next/server";
import { issueAgentCredentialForUser, issueAgentCredentialSchema } from "@/lib/agents";
import { AgentInputError, getErrorStatus, getPublicErrorMessage } from "@/lib/agents/errors";
import { requireAuth, UnauthorizedError } from "@/lib/auth/require-auth";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ agentClientId: string }> },
): Promise<Response> {
  try {
    const { userId } = await requireAuth();
    const { agentClientId } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = issueAgentCredentialSchema.safeParse(body);

    if (!parsed.success) {
      throw new AgentInputError(parsed.error.issues.map((issue) => issue.message).join(", "));
    }

    const result = await issueAgentCredentialForUser(userId, agentClientId, parsed.data);
    return Response.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = getErrorStatus(error);
    if (status >= 500) {
      console.error("[POST /api/agent-clients/[agentClientId]/credentials]", error);
    }

    return Response.json({ error: getPublicErrorMessage(error) }, { status });
  }
}
