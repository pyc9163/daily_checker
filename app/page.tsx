import { DashboardShell } from "@/app/components/DashboardShell";
import { getLatestBriefing } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function Page() {
  const briefing = await getLatestBriefing();
  return <DashboardShell initialBriefing={briefing} />;
}
