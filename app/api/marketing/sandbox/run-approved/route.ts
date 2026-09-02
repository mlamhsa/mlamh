import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { getExternalExecutionSettings } from "@/lib/marketing/channels/controlled-execution";
import { runApprovedSandboxJobsForApproval } from "@/lib/marketing/channels/run-approved-sandbox";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const CONTROLLED_APPROVAL_ID = 7;
const RUN_TOKEN_SHA256 = "60124844b4aba7848f53fb42a3b3bbd08ef5b3fefebdac74bf85bf4b38cb2fd0";

function validRunToken(value: string | null) {
  if (!value) return false;
  const actual = Buffer.from(createHash("sha256").update(value).digest("hex"));
  const expected = Buffer.from(RUN_TOKEN_SHA256);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function GET(request: NextRequest) {
  const approvalId = Number(request.nextUrl.searchParams.get("approval_id"));
  const token = request.nextUrl.searchParams.get("run_token");
  if (approvalId !== CONTROLLED_APPROVAL_ID || !validRunToken(token)) {
    return NextResponse.json({ ok: false }, { status: 404 });
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
