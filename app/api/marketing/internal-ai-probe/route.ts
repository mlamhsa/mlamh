import { NextResponse } from "next/server";

import { runMarketingTaskById } from "@/lib/marketing/tasks/runner";
import { isSafeInternalMarketingTask } from "@/lib/marketing/tasks/safe-internal";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const PROBE_TASK_ID = 1304;

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ ok: false }, { status: 401 });

  const db = createAdminClient();
  const { data: task, error } = await db
    .from("marketing_tasks")
    .select("id,source,channel,metadata,status")
    .eq("id", PROBE_TASK_ID)
    .maybeSingle();

  if (error) {
    console.error("[marketing-ai-probe.read]", error.message);
    return NextResponse.json({ ok: false, error: "probe_read_failed" }, { status: 500 });
  }

  if (!task) return NextResponse.json({ ok: true, skipped: "task_missing" });
  if (!isSafeInternalMarketingTask(task)) {
    return NextResponse.json({ ok: true, skipped: "task_not_safe_internal" });
  }
  if (!["queued", "scheduled"].includes(task.status)) {
    return NextResponse.json({ ok: true, skipped: `task_${task.status}` });
  }

  const result = await runMarketingTaskById(
    PROBE_TASK_ID,
    "cron:marketing-ai-production-probe",
    "autonomous_orchestrator",
  );

  return NextResponse.json({ ok: true, taskId: PROBE_TASK_ID, result });
}
