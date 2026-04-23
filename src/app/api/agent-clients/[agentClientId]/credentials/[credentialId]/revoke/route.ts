import { listRecentAgentAuditEventsForUser, revokeAgentCredentialForUser } from "@/lib/agents";
import { getErrorStatus, getPublicErrorMessage } from "@/lib/agents/errors";
import { requireAuth, UnauthorizedError } from "@/lib/auth/require-auth";

export async function POST(
  _request: Request,
  context: { params: Promise<{ agentClientId: string; credentialId: string }> },
): Promise<Response> {
  try {
    const { userId } = await requireAuth();
    const { agentClientId, credentialId } = await context.params;
    const client = await revokeAgentCredentialForUser(userId, agentClientId, credentialId);
    const recentEvents = await listRecentAgentAuditEventsForUser(userId);

    return Response.json({ client, recentEvents });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = getErrorStatus(error);
    if (status >= 500) {
      console.error("[POST /api/agent-clients/[agentClientId]/credentials/[credentialId]/revoke]", error);
    }

    return Response.json({ error: getPublicErrorMessage(error) }, { status });
  }
}
