import { NextRequest, NextResponse } from "next/server";

import { getExternalExecutionSettings } from "@/lib/marketing/channels/controlled-execution";
import { runApprovedSandboxJobsForApproval } from "@/lib/marketing/channels/run-approved-sandbox";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // This diagnostic trigger is intentionally preview-only. Production must use
  // the governed approval/worker path and can never execute through this route.
  if (process.env.VERCEL_ENV !== "preview") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const approvalId = Number(request.nextUrl.searchParams.get("approval_id"));
  if (!Number.isInteger(approvalId) || approvalId <= 0) {
    return NextResponse.json({ ok: false, error: "invalid_approval_id" }, { status: 400 });
  }

  const settings = await getExternalExecutionSettings();
  if (settings.productionEnabled || !settings.testMode.enabled) {
    return NextResponse.json({ ok: false, error: "sandbox_gate_closed" }, { status: 403 });
  }

  const db = createAdminClient();
  const { data: approval, error: approvalError } = await db
    .from("marketing_approvals")
    .select("id,status,task_id")
    .eq("id", approvalId)
    .maybeSingle();

  if (approvalError || !approval || approval.status !== "approved") {
    return NextResponse.json({ ok: false, error: "approval_not_approved" }, { status: 409 });
  }

  const { data: task, error: taskError } = await db
    .from("marketing_tasks")
    .select("id,input")
    .eq("id", approval.task_id)
    .maybeSingle();

  const input = task?.input && typeof task.input === "object" && !Array.isArray(task.input)
    ? task.input as Record<string, unknown>
    : {};

  if (taskError || !task || input.test_mode !== true) {
    return NextResponse.json({ ok: false, error: "task_not_sandbox" }, { status: 403 });
  }

  const executed = await runApprovedSandboxJobsForApproval(approvalId);
  return NextResponse.json({ ok: true, approval_id: approvalId, executed });
}
