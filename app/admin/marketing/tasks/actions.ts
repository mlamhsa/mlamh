"use server";

import { revalidatePath } from "next/cache";

import { requireMarketingAdminAccess } from "@/lib/auth/require-marketing-admin";
import { runMarketingTaskById } from "@/lib/marketing/tasks/runner";
import { isSafeInternalMarketingTask } from "@/lib/marketing/tasks/safe-internal";
import { createMarketingTask } from "@/lib/marketing/tasks/service";
import { createAdminClient } from "@/lib/supabase/admin";

function revalidateMarketingTaskViews() {
  revalidatePath("/admin/marketing/tasks");
  revalidatePath("/admin/marketing/ai-team");
  revalidatePath("/admin/marketing/approvals");
  revalidatePath("/admin/marketing/activity");
}

export async function createMarketingTaskAction(formData: FormData) {
  await requireMarketingAdminAccess("marketing.manage");

  const taskType = String(formData.get("task_type") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  if (!taskType || !title) throw new Error("Task type and title are required.");

  const priority = String(formData.get("priority") ?? "normal");
  const approvalLevel = String(formData.get("approval_level") ?? "");
  const scheduledAtRaw = String(formData.get("scheduled_at") ?? "").trim();

  await createMarketingTask({
    agentId: String(formData.get("agent_id") ?? "").trim() || null,
    taskType,
    title,
    objective: String(formData.get("objective") ?? "").trim() || null,
    priority: ["low", "normal", "high", "urgent"].includes(priority) ? priority as "low" | "normal" | "high" | "urgent" : "normal",
    channel: String(formData.get("channel") ?? "").trim() || null,
    source: "admin",
    approvalLevel: ["auto", "approval_required", "ceo_only"].includes(approvalLevel) ? approvalLevel as "auto" | "approval_required" | "ceo_only" : undefined,
    scheduledAt: scheduledAtRaw ? new Date(scheduledAtRaw).toISOString() : null,
  });

  revalidateMarketingTaskViews();
}

export async function runNextMarketingTaskAction() {
  const user = await requireMarketingAdminAccess("marketing.manage");
  const db = createAdminClient();
  const { data: candidates, error } = await db
    .from("marketing_tasks")
    .select("id,source,channel,metadata")
    .eq("source", "autonomous_orchestrator")
    .eq("channel", "internal")
    .in("status", ["queued", "scheduled"])
    .order("created_at", { ascending: true })
    .limit(25);
  if (error) throw new Error(`[marketing_task.safe_internal_queue] ${error.message}`);

  for (const candidate of candidates ?? []) {
    if (!isSafeInternalMarketingTask(candidate)) continue;
    const result = await runMarketingTaskById(
      candidate.id,
      `admin:${user.id}:safe-internal`,
      "autonomous_orchestrator",
    );
    if (result) break;
  }

  revalidateMarketingTaskViews();
}
