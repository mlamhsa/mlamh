import { NextResponse } from "next/server";
import { runAutonomousMarketingCycle } from "@/lib/marketing/orchestrator";
import { syncZohoRecentInboundEmails } from "@/lib/marketing/channels/zoho-inbound-recent";
import { processDanaInboundEmailTask } from "@/lib/marketing/inbound/dana-email";
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

function riyadhDayKey(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
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

    const inbound = await syncZohoRecentInboundEmails({ day: riyadhDayKey(), limit: 50 });
    const inboundProcessed: Array<{ taskId: number; status: string; approvalTaskId?: number | null; error?: string }> = [];
    for (const taskId of inbound.taskIds) {
      const result = await processDanaInboundEmailTask(taskId);
      inboundProcessed.push(result);
    }

    const result = await runAutonomousMarketingCycle({ maxTasks: 3 });
    return NextResponse.json({ ok: true, recovery, inbound, inboundProcessed, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Marketing orchestrator failed";
    console.error("[marketing-orchestrator]", message);
    return NextResponse.json({ ok: false, error: "orchestrator_failed" }, { status: 500 });
  }
}
