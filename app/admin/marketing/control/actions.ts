"use server";

import { revalidatePath } from "next/cache";

import { requireMarketingAdminAccess } from "@/lib/auth/require-marketing-admin";
import { createAdminClient } from "@/lib/supabase/admin";

function boolFromForm(value: FormDataEntryValue | null) {
  return String(value ?? "") === "true";
}

function safeDailyLimit(value: FormDataEntryValue | null) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 10;
  return Math.max(1, Math.min(Math.trunc(parsed), 100));
}

async function auditControlChange(reason: string, result: Record<string, unknown>) {
  const db = createAdminClient();
  await db.from("marketing_agent_activity").insert({
    agent_id: null,
    task_id: null,
    action: "control_center_changed",
    reason,
    channel: "internal",
    result,
  });
}

async function upsertSetting(key: string, value: Record<string, unknown>) {
  const db = createAdminClient();
  const { error } = await db.from("marketing_settings").upsert({
    key,
    value,
    updated_at: new Date().toISOString(),
  }, { onConflict: "key" });
  if (error) throw new Error(`[marketing control:${key}] ${error.message}`);
}

function revalidateControl() {
  revalidatePath("/admin/marketing/control");
  revalidatePath("/admin/marketing");
  revalidatePath("/admin/marketing/settings");
  revalidatePath("/admin/marketing/ai-team");
}

export async function setMarketingTeamPausedAction(formData: FormData) {
  await requireMarketingAdminAccess("marketing.manage");
  const paused = boolFromForm(formData.get("paused"));
  await upsertSetting("marketing_team_paused", { paused });
  await auditControlChange(paused ? "Marketing team paused by admin." : "Marketing team resumed by admin.", { paused });
  revalidateControl();
}

export async function setExternalExecutionPolicyAction(formData: FormData) {
  await requireMarketingAdminAccess("marketing.manage");
  const enabled = boolFromForm(formData.get("enabled"));
  const channels = [...new Set(formData.getAll("channels").map(String).filter((value) => value === "email" || value === "buffer"))];
  const dailyEmailLimit = safeDailyLimit(formData.get("daily_email_limit"));

  if (enabled && channels.length === 0) {
    throw new Error("Select at least one external execution channel before enabling production execution.");
  }

  await upsertSetting("external_execution_channels", { channels });
  await upsertSetting("external_execution_email_daily_limit", { limit: dailyEmailLimit });
  await upsertSetting("external_execution_enabled", { enabled });
  await auditControlChange("External execution policy updated by admin.", {
    enabled,
    channels,
    daily_email_limit: dailyEmailLimit,
  });
  revalidateControl();
}

export async function emergencyStopMarketingAction() {
  await requireMarketingAdminAccess("marketing.manage");
  await upsertSetting("external_execution_enabled", { enabled: false });
  await upsertSetting("marketing_team_paused", { paused: true });
  await auditControlChange("Emergency stop activated by admin.", {
    marketing_team_paused: true,
    external_execution_enabled: false,
  });
  revalidateControl();
}

export async function setMarketingAgentActiveAction(formData: FormData) {
  await requireMarketingAdminAccess("marketing.manage");
  const agentId = String(formData.get("agent_id") ?? "").trim();
  const active = boolFromForm(formData.get("active"));
  if (!agentId) throw new Error("Agent id is required.");

  const db = createAdminClient();
  const { data: current, error: readError } = await db.from("marketing_agents")
    .select("id,name,status,current_task_id,is_active")
    .eq("id", agentId)
    .maybeSingle();
  if (readError || !current) throw new Error("Marketing agent not found.");

  const nextStatus = active
    ? (current.status === "paused" ? "idle" : current.status)
    : (current.status === "working" ? current.status : "paused");

  const { error } = await db.from("marketing_agents").update({
    is_active: active,
    status: nextStatus,
    updated_at: new Date().toISOString(),
  }).eq("id", agentId);
  if (error) throw new Error(`[marketing agent control] ${error.message}`);

  await auditControlChange(active ? `Agent resumed: ${current.name}` : `Agent paused for new work: ${current.name}`, {
    agent_id: agentId,
    active,
    previous_status: current.status,
    current_task_id: current.current_task_id,
  });
  revalidateControl();
}
