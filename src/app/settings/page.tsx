import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { listAgentClientsForUser, listRecentAgentAuditEventsForUser } from "@/lib/agents";
import { auth } from "@/lib/auth";
import { AgentSettingsPanel } from "@/features/settings/components/agent-settings-panel";

function resolveBaseUrl({
  headerHost,
  headerProtocol,
}: {
  headerHost: string | null;
  headerProtocol: string | null;
}) {
  const nextAuthUrl = process.env["NEXTAUTH_URL"];
  if (nextAuthUrl) {
    return nextAuthUrl;
  }

  if (headerHost) {
    return `${headerProtocol ?? "https"}://${headerHost}`;
  }

  const vercelUrl = process.env["VERCEL_URL"];
  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  return "https://rollorian-todo.vercel.app";
}

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const headersList = await headers();
  const baseUrl = resolveBaseUrl({
    headerHost: headersList.get("x-forwarded-host") ?? headersList.get("host"),
    headerProtocol: headersList.get("x-forwarded-proto"),
  });

  const [clients, recentEvents] = await Promise.all([
    listAgentClientsForUser(session.user.id),
    listRecentAgentAuditEventsForUser(session.user.id),
  ]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] px-5 pt-4 pb-6 gap-5">
      <header className="grid gap-1 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-surface-container-low/70 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant/60">
          Ajustes
        </p>
        <h1 className="text-3xl font-semibold text-on-surface">Agent connections</h1>
        <p className="max-w-3xl text-sm text-on-surface-variant">
          Gestiona tokens privados por usuario, rota credenciales y deja preparada la conexión para el onboarding MCP de la siguiente fase.
        </p>
      </header>

      <AgentSettingsPanel initialClients={clients} initialRecentEvents={recentEvents} baseUrl={baseUrl} />
    </div>
  );
}
