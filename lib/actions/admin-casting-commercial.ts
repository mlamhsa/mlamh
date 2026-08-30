"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

const commercialStatuses = new Set(["lead", "proposal", "won", "lost", "cancelled"]);
const paymentStatuses = new Set(["pending", "paid", "failed", "refunded", "cancelled"]);
const mutablePaymentStatuses = new Set(["pending", "paid", "failed", "cancelled"]);
const currencyPattern = /^[A-Z]{3}$/;

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
  if (projectId) {
    revalidatePath(`/admin/casting/${projectId}`);
    revalidatePath(`/admin/casting/${projectId}/sales`);
  }
}

export async function updateCastingCommercialStatusAction(formData: FormData) {
  await requireAdminAccess();
  const projectId = positiveInt(formData.get("project_id"));
  const status = text(formData.get("commercial_status"));
  if (!projectId || !commercialStatuses.has(status)) return;

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("casting_projects")
    .update({ commercial_status: status, updated_at: new Date().toISOString() })
    .eq("id", projectId);

  if (error) {
    console.error("[updateCastingCommercialStatusAction]", error);
    return;
  }
  refresh(projectId);
}

export async function createCastingPaymentAction(formData: FormData) {
  await requireAdminAccess();
  const projectId = positiveInt(formData.get("project_id"));
  const amount = Number(text(formData.get("amount")));
  const status = text(formData.get("status")) || "pending";
  const requestedCurrency = (text(formData.get("currency")) || "SAR").toUpperCase();

  if (
    !projectId ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !paymentStatuses.has(status) ||
    !currencyPattern.test(requestedCurrency)
  ) {
    return;
  }

  const adminClient = createAdminClient();
  const { data: project } = await adminClient
    .from("casting_projects")
    .select("id,currency")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) return;

  const projectCurrency = String(project.currency || "SAR").trim().toUpperCase();
  if (!currencyPattern.test(projectCurrency) || requestedCurrency !== projectCurrency) return;

  const paidAt = status === "paid"
    ? text(formData.get("paid_at")) || new Date().toISOString()
    : null;

  const { error } = await adminClient.from("casting_payments").insert({
    casting_project_id: projectId,
    amount,
    currency: projectCurrency,
    status,
    provider: text(formData.get("provider")) || "manual",
    provider_reference: text(formData.get("provider_reference")).slice(0, 250) || null,
    paid_at: paidAt,
    internal_notes: text(formData.get("internal_notes")).slice(0, 5000) || null,
  });

  if (error) {
    console.error("[createCastingPaymentAction]", error);
    return;
  }
  refresh(projectId);
}

export async function updateCastingPaymentStatusAction(formData: FormData) {
  await requireAdminAccess();
  const paymentId = positiveInt(formData.get("payment_id"));
  const projectId = positiveInt(formData.get("project_id"));
  const status = text(formData.get("status"));
  if (!paymentId || !projectId || !paymentStatuses.has(status)) return;

  const adminClient = createAdminClient();
  const { data: payment } = await adminClient
    .from("casting_payments")
    .select("id,status,paid_at")
    .eq("id", paymentId)
    .eq("casting_project_id", projectId)
    .maybeSingle();
  if (!payment) return;

  // Refunded rows are separate refund ledger entries so that collected revenue
  // remains: paid entries minus refunded entries. Do not convert a payment row
  // into a refund row (or mutate an existing refund into another status).
  if (payment.status === "refunded") {
    if (status !== "refunded") return;
  } else if (status === "refunded" || !mutablePaymentStatuses.has(status)) {
    return;
  }

  const nextPaidAt = status === "paid"
    ? payment.paid_at || new Date().toISOString()
    : null;

  const { error } = await adminClient
    .from("casting_payments")
    .update({
      status,
      paid_at: nextPaidAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", paymentId)
    .eq("casting_project_id", projectId);

  if (error) {
    console.error("[updateCastingPaymentStatusAction]", error);
    return;
  }
  refresh(projectId);
}
