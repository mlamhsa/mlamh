"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createMarketingTask } from "@/lib/marketing/tasks/service";

export async function createMarketingTaskAction(formData: FormData) {
  await requireAdminAccess();

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

  revalidatePath("/admin/marketing/tasks");
  revalidatePath("/admin/marketing/ai-team");
  revalidatePath("/admin/marketing/approvals");
}
