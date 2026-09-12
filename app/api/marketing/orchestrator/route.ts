import { NextResponse } from "next/server";
import { runAutonomousMarketingCycle } from "@/lib/marketing/orchestrator";
import { getEmailFeedbackSnapshot } from "@/lib/marketing/analytics/email-feedback";
import { prepareDueEmailFollowUps } from "@/lib/marketing/automation/email-followups";
import { syncZohoRecentInboundEmails } from "@/lib/marketing/channels/zoho-inbound-recent";
import { processDanaInboundEmailTask } from "@/lib/marketing/inbound/dana-email";
import { materializeAutoVerifiedLeadResearch } from "@/lib/marketing/leads/auto-materialize";
import { recoverFreeCapacityOutreachDrafts } from "@/lib/marketing/outreach/deterministic-recovery";
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

async function recoverStaleSafely() {
  try {
    return await recoverStaleAutonomousRunningTasks();
  } catch (error) {
    console.error("[marketing-orchestrator.recovery]", error instanceof Error ? error.message : "recovery_failed");
    return { recovered: 0, requeued: 0, failed: 0, error: "recovery_failed" };
  }
}

async function syncRecentInboundSafely(day: string) {
  try {
    return await syncZohoRecentInboundEmails({ day, limit: 50 });
  } catch (error) {
    console.error("[marketing-orchestrator.inbound]", error instanceof Error ? error.message : "zoho_recent_inbound_failed");
    return {
      enabled: false,
      reason: "zoho_recent_inbound_failed",
      ingested: 0,
      duplicates: 0,
      ignored: 0,
      unmatched: 0,
      bounces: 0,
      autoReplies: 0,
      bulk: 0,
      taskIds: [] as number[],
    };
  }
}

async function prepareFollowUpsSafely() {
  try {
    return await prepareDueEmailFollowUps({ limit: 20 });
  } catch (error) {
    console.error("[marketing-orchestrator.followups]", error instanceof Error ? error.message : "followups_failed");
    return { error: "followups_failed" };
  }
}

async function emailFeedbackSafely() {
  try {
    return await getEmailFeedbackSnapshot({ days: 30 });
  } catch (error) {
    console.error("[marketing-orchestrator.email-feedback]", error instanceof Error ? error.message : "email_feedback_failed");
    return { error: "email_feedback_failed" };
  }
}

async function autoVerifyResearchSafely() {
  try {
    return await materializeAutoVerifiedLeadResearch({ limit: 12 });
  } catch (error) {
    console.error("[marketing-orchestrator.contact-auto-verification]", error instanceof Error ? error.message : "contact_auto_verification_failed");
    return { error: "contact_auto_verification_failed" };
  }
}

async function recoverOutreachDraftsSafely() {
  try {
    return await recoverFreeCapacityOutreachDrafts({ limit: 6 });
  } catch (error) {
    console.error("[marketing-orchestrator.outreach-recovery]", error instanceof Error ? error.message : "outreach_recovery_failed");
    return { error: "outreach_recovery_failed" };
  }
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    const recovery = await recoverStaleSafely();
    if (await marketingTeamPaused()) {
      return NextResponse.json({
        ok: true,
        recovery,
        result: { paused: true, executed: [], channels: { enabled: false, mode: "team_paused", executed: [], skipped: [] } },
      });
    }

    const inbound = await syncRecentInboundSafely(riyadhDayKey());
    const inboundProcessed: Array<{ taskId: number; status: string; approvalTaskId?: number | null; error?: string }> = [];
    for (const taskId of inbound.taskIds) {
      try {
        const result = await processDanaInboundEmailTask(taskId);
        inboundProcessed.push(result);
      } catch (error) {
        inboundProcessed.push({
          taskId,
          status: "failed",
          error: error instanceof Error ? error.message.slice(0, 160) : "inbound_processing_failed",
        });
      }
    }

    const followUps = await prepareFollowUpsSafely();
    const emailFeedback = await emailFeedbackSafely();
    const result = await runAutonomousMarketingCycle({ maxTasks: 3 });
    const contactAutoVerification = await autoVerifyResearchSafely();
    const deterministicOutreachRecovery = await recoverOutreachDraftsSafely();
    return NextResponse.json({ ok: true, recovery, inbound, inboundProcessed, followUps, emailFeedback, contactAutoVerification, deterministicOutreachRecovery, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Marketing orchestrator failed";
    console.error("[marketing-orchestrator]", message);
    return NextResponse.json({ ok: false, error: "orchestrator_failed" }, { status: 500 });
  }
}
