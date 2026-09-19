"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { recordAdminAction } from "@/lib/events/admin-audit";
import { EVENT_TARGETS } from "@/lib/events/event-targets";
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

async function getManagedProject(projectId: number) {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("casting_projects")
    .select("id,currency,service_mode")
    .eq("id", projectId)
    .eq("service_mode", "managed")
    .maybeSingle();

  if (error) console.error("[getManagedProject]", error);
  return data ?? null;
}

export async function updateCastingCommercialStatusAction(formData: FormData) {
  const adminUser =
    await requireAdminAccess();
  const projectId = positiveInt(formData.get("project_id"));
  const status = text(formData.get("commercial_status"));

  if (!projectId || !commercialStatuses.has(status)) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "update_casting_commercial_status",
      outcome: "blocked",
      target: EVENT_TARGETS.CASTING_PROJECT,
      targetId:
        projectId ?? "invalid-input",
      reason: !projectId
        ? "invalid_casting_project_id"
        : "invalid_commercial_status",
      metadata: {
        requested_status:
          status || null,
      },
    });

    return;
  }

  const project = await getManagedProject(projectId);

  if (!project) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "update_casting_commercial_status",
      outcome: "blocked",
      target: EVENT_TARGETS.CASTING_PROJECT,
      targetId: projectId,
      reason: "managed_casting_project_not_found",
    });

    return;
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("casting_projects")
    .update({ commercial_status: status, updated_at: new Date().toISOString() })
    .eq("id", projectId)
    .eq("service_mode", "managed");

  if (error) {
    console.error("[updateCastingCommercialStatusAction]", error);

    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "update_casting_commercial_status",
      outcome: "failed",
      target: EVENT_TARGETS.CASTING_PROJECT,
      targetId: projectId,
      reason: "commercial_status_update_failed",
      metadata: {
        requested_status:
          status,
      },
    });

    return;
  }

  await recordAdminAction({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    action: "update_casting_commercial_status",
    outcome: "success",
    target: EVENT_TARGETS.CASTING_PROJECT,
    targetId: projectId,
    metadata: {
      new_status: status,
    },
  });

  refresh(projectId);
}

export async function createCastingPaymentAction(formData: FormData) {
  const adminUser =
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
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "create_casting_payment",
      outcome: "blocked",
      target: EVENT_TARGETS.PAYMENT,
      targetId: "invalid-input",
      reason: "invalid_payment_input",
      metadata: {
        casting_project_id:
          projectId,
        amount:
          Number.isFinite(amount)
            ? amount
            : null,
        status:
          status || null,
        currency:
          requestedCurrency || null,
      },
    });

    return;
  }

  const project = await getManagedProject(projectId);

  if (!project) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "create_casting_payment",
      outcome: "blocked",
      target: EVENT_TARGETS.CASTING_PROJECT,
      targetId: projectId,
      reason: "managed_casting_project_not_found",
    });

    return;
  }

  const projectCurrency = String(project.currency || "SAR").trim().toUpperCase();

  if (!currencyPattern.test(projectCurrency) || requestedCurrency !== projectCurrency) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "create_casting_payment",
      outcome: "blocked",
      target: EVENT_TARGETS.PAYMENT,
      targetId: "invalid-input",
      reason: "payment_currency_mismatch",
      metadata: {
        casting_project_id:
          projectId,
        requested_currency:
          requestedCurrency,
        project_currency:
          projectCurrency,
        amount,
      },
    });

    return;
  }

  const paidAt = status === "paid" ? text(formData.get("paid_at")) || new Date().toISOString() : null;
  const adminClient = createAdminClient();
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

    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "create_casting_payment",
      outcome: "failed",
      target: EVENT_TARGETS.PAYMENT,
      targetId: "creation-failed",
      reason: "payment_insert_failed",
      metadata: {
        casting_project_id:
          projectId,
        amount,
        currency:
          projectCurrency,
        status,
        provider:
          text(formData.get("provider")) ||
          "manual",
      },
    });

    return;
  }

  await recordAdminAction({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    action: "create_casting_payment",
    outcome: "success",
    target: EVENT_TARGETS.CASTING_PROJECT,
    targetId: projectId,
    metadata: {
      amount,
      currency:
        projectCurrency,
      status,
      provider:
        text(formData.get("provider")) ||
        "manual",
      paid_at:
        paidAt,
    },
  });

  refresh(projectId);
}

export async function updateCastingPaymentStatusAction(formData: FormData) {
  const adminUser =
    await requireAdminAccess();
  const paymentId = positiveInt(formData.get("payment_id"));
  const projectId = positiveInt(formData.get("project_id"));
  const status = text(formData.get("status"));
  if (!paymentId || !projectId || !paymentStatuses.has(status)) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "update_casting_payment_status",
      outcome: "blocked",
      target: EVENT_TARGETS.PAYMENT,
      targetId:
        paymentId ?? "invalid-input",
      reason: "invalid_payment_status_input",
      metadata: {
        casting_project_id:
          projectId,
        requested_status:
          status || null,
      },
    });

    return;
  }

  const project = await getManagedProject(projectId);

  if (!project) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "update_casting_payment_status",
      outcome: "blocked",
      target: EVENT_TARGETS.CASTING_PROJECT,
      targetId: projectId,
      reason: "managed_casting_project_not_found",
    });

    return;
  }

  const adminClient = createAdminClient();
  const { data: payment } = await adminClient
    .from("casting_payments")
    .select("id,status,paid_at")
    .eq("id", paymentId)
    .eq("casting_project_id", projectId)
    .maybeSingle();
  if (!payment) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "update_casting_payment_status",
      outcome: "failed",
      target: EVENT_TARGETS.PAYMENT,
      targetId: paymentId,
      reason: "payment_not_found",
      metadata: {
        casting_project_id:
          projectId,
      },
    });

    return;
  }

  if (payment.status === "refunded") {
    if (status !== "refunded") {
      await recordAdminAction({
        actorId: adminUser.id,
        actorEmail: adminUser.email,
        action: "update_casting_payment_status",
        outcome: "blocked",
        target: EVENT_TARGETS.PAYMENT,
        targetId: paymentId,
        reason: "refunded_payment_is_final",
        metadata: {
          current_status:
            payment.status,
          requested_status:
            status,
        },
      });

      return;
    }
  } else if (status === "refunded" || !mutablePaymentStatuses.has(status)) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "update_casting_payment_status",
      outcome: "blocked",
      target: EVENT_TARGETS.PAYMENT,
      targetId: paymentId,
      reason: "payment_status_transition_not_allowed",
      metadata: {
        current_status:
          payment.status,
        requested_status:
          status,
      },
    });

    return;
  }

  if (payment.status === status) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "update_casting_payment_status",
      outcome: "noop",
      target: EVENT_TARGETS.PAYMENT,
      targetId: paymentId,
      reason: "payment_status_already_set",
      metadata: {
        current_status:
          payment.status,
      },
    });

    return;
  }

  const nextPaidAt = status === "paid" ? payment.paid_at || new Date().toISOString() : null;
  const { error } = await adminClient
    .from("casting_payments")
    .update({ status, paid_at: nextPaidAt, updated_at: new Date().toISOString() })
    .eq("id", paymentId)
    .eq("casting_project_id", projectId);

  if (error) {
    console.error("[updateCastingPaymentStatusAction]", error);

    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "update_casting_payment_status",
      outcome: "failed",
      target: EVENT_TARGETS.PAYMENT,
      targetId: paymentId,
      reason: "payment_status_update_failed",
      metadata: {
        casting_project_id:
          projectId,
        previous_status:
          payment.status,
        requested_status:
          status,
      },
    });

    return;
  }

  await recordAdminAction({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    action: "update_casting_payment_status",
    outcome: "success",
    target: EVENT_TARGETS.PAYMENT,
    targetId: paymentId,
    metadata: {
      casting_project_id:
        projectId,
      previous_status:
        payment.status,
      new_status:
        status,
      previous_paid_at:
        payment.paid_at,
      new_paid_at:
        nextPaidAt,
    },
  });

  refresh(projectId);
}
