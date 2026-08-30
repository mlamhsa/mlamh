"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

const commercialStatuses = new Set(["lead", "proposal", "won", "lost", "cancelled"]);
const paymentStatuses = new Set(["pending", "paid", "failed", "refunded", "cancelled"]);

function positiveInt(value: FormDataEntryValue | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}
function text(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}
function refresh(projectId?: number) {
  revalidatePath("/admin/casting");
  revalidatePath("/admin/casting/analytics");
  revalidatePath("/admin/casting/commercial");
  if (projectId) revalidatePath(`/admin/casting/${projectId}`);
}

export async function updateCastingCommercialStatusAction(formData: FormData) {
  const projectId = positiveInt(formData.get("project_id"));
  const status = text(formData.get("commercial_status"));
  if (!projectId || !commercialStatuses.has(status)) return;
  const adminClient = createAdminClient();
  const { error } = await adminClient.from("casting_projects").update({ commercial_status: status, updated_at: new Date().toISOString() }).eq("id", projectId);
  if (error) { console.error("[updateCastingCommercialStatusAction]", error); return; }
  refresh(projectId);
}

export async function createCastingPaymentAction(formData: FormData) {
  const projectId = positiveInt(formData.get("project_id"));
  const amount = Number(text(formData.get("amount")));
  const status = text(formData.get("status")) || "pending";
  if (!projectId || !Number.isFinite(amount) || amount <= 0 || !paymentStatuses.has(status)) return;
  const paidAt = status === "paid" ? (text(formData.get("paid_at")) || new Date().toISOString()) : null;
  const adminClient = createAdminClient();
  const { error } = await adminClient.from("casting_payments").insert({
    casting_project_id: projectId,
    amount,
    currency: "SAR",
    status,
    provider: text(formData.get("provider")) || "manual",
    provider_reference: text(formData.get("provider_reference")) || null,
    paid_at: paidAt,
    internal_notes: text(formData.get("internal_notes")).slice(0, 5000) || null,
  });
  if (error) { console.error("[createCastingPaymentAction]", error); return; }
  refresh(projectId);
}

export async function updateCastingPaymentStatusAction(formData: FormData) {
  const paymentId = positiveInt(formData.get("payment_id"));
  const projectId = positiveInt(formData.get("project_id"));
  const status = text(formData.get("status"));
  if (!paymentId || !projectId || !paymentStatuses.has(status)) return;
  const adminClient = createAdminClient();
  const { error } = await adminClient.from("casting_payments").update({
    status,
    paid_at: status === "paid" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq("id", paymentId).eq("casting_project_id", projectId);
  if (error) { console.error("[updateCastingPaymentStatusAction]", error); return; }
  refresh(projectId);
}
