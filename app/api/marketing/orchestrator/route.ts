import { NextResponse } from "next/server";
import { runAutonomousMarketingCycle } from "@/lib/marketing/orchestrator";
import { recoverStaleAutonomousRunningTasks } from "@/lib/marketing/tasks/recover-stale";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function marketingTeamPaused() {
  const db = createAdminClient();
  const { data, error } = await db.from("marketing_settings")
    .select("value")
    .eq("key", "marketing_team_paused")
    .maybeSingle();
  if (error) return true;
  const value = data?.value;
  return Boolean(value && typeof value === "object" && !Array.isArray(value) && (value as Record<string, unknown>).paused === true);
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    const recovery = await recoverStaleAutonomousRunningTasks();
    if (await marketingTeamPaused()) {
      return NextResponse.json({
        ok: true,
        recovery,
        result: { paused: true, executed: [], channels: { enabled: false, mode: "team_paused", executed: [], skipped: [] } },
      });
    }
    const result = await runAutonomousMarketingCycle({ maxTasks: 3 });
    return NextResponse.json({ ok: true, recovery, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Marketing orchestrator failed";
    console.error("[marketing-orchestrator]", message);
    return NextResponse.json({ ok: false, error: "orchestrator_failed" }, { status: 500 });
  }
}
