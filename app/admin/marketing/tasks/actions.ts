"use server";

import { revalidatePath } from "next/cache";

import { requireMarketingAdminAccess } from "@/lib/auth/require-marketing-admin";
import { runMarketingTaskById, runNextMarketingTask } from "@/lib/marketing/tasks/runner";
import { createMarketingTask } from "@/lib/marketing/tasks/service";
import { createAdminClient } from "@/lib/supabase/admin";

function revalidateMarketingTaskViews() {
  revalidatePath("/admin/marketing/tasks");
  revalidatePath("/admin/marketing/ai-team");
  revalidatePath("/admin/marketing/approvals");
  revalidatePath("/admin/marketing/activity");
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
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
  await runNextMarketingTask(`admin:${user.id}`);
  revalidateMarketingTaskViews();
}

export async function runSafeInternalMarketingTaskAction(formData: FormData) {
  const user = await requireMarketingAdminAccess("marketing.manage");
  const taskId = Number(formData.get("task_id"));
  if (!Number.isSafeInteger(taskId) || taskId <= 0) throw new Error("A valid task ID is required.");

  const db = createAdminClient();
  const { data: task, error } = await db
    .from("marketing_tasks")
    .select("id,source,channel,metadata")
    .eq("id", taskId)
    .maybeSingle();
  if (error) throw new Error(`[marketing_task.safe_internal.read] ${error.message}`);
  if (!task) throw new Error("Marketing task was not found.");

  const metadata = asRecord(task.metadata);
  const isSafeInternal =
    task.source === "autonomous_orchestrator" &&
    task.channel === "internal" &&
    metadata.external_execution === false;
  if (!isSafeInternal) {
    throw new Error("Only autonomous internal tasks with external execution explicitly disabled can be run directly.");
  }

  await runMarketingTaskById(taskId, `admin:${user.id}:safe-internal`, "autonomous_orchestrator");
  revalidateMarketingTaskViews();
}
