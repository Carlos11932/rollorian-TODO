import { revokeAgentClientForUser } from "@/lib/agents";
import { getErrorStatus, getPublicErrorMessage } from "@/lib/agents/errors";
import { requireAuth, UnauthorizedError } from "@/lib/auth/require-auth";

export async function POST(
  _request: Request,
  context: { params: Promise<{ agentClientId: string }> },
): Promise<Response> {
  try {
    const { userId } = await requireAuth();
    const { agentClientId } = await context.params;
    const client = await revokeAgentClientForUser(userId, agentClientId);

    return Response.json({ client });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = getErrorStatus(error);
    if (status >= 500) {
      console.error("[POST /api/agent-clients/[agentClientId]/revoke]", error);
    }

    return Response.json({ error: getPublicErrorMessage(error) }, { status });
  }
}
