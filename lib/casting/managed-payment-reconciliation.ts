import "server-only";

import { majorToMinorAmount } from "@/lib/payments/money";
import { tapPaymentProvider } from "@/lib/payments/providers/tap/tap-provider";
import { createAdminClient } from "@/lib/supabase/admin";

export type ManagedCastingPaymentStatus = "paid" | "failed" | "cancelled" | "pending";

function toLedgerStatus(status: string): ManagedCastingPaymentStatus {
  if (status === "succeeded") return "paid";
  if (status === "failed") return "failed";
  if (status === "cancelled") return "cancelled";
  return "pending";
}

export async function reconcileManagedCastingTapCharge(chargeId: string) {
  const cleanChargeId = chargeId.trim();
  if (!cleanChargeId) throw new Error("Missing Tap charge ID.");

  const admin = createAdminClient();
  const { data: ledger, error: ledgerError } = await admin
    .from("casting_payments")
    .select("id,casting_project_id,status,amount,currency,milestone_code,provider_payment_id")
    .eq("provider_payment_id", cleanChargeId)
    .maybeSingle();

  if (ledgerError) throw new Error(ledgerError.message);
  if (!ledger) return { found: false as const, status: null };

  const providerPayment = await tapPaymentProvider.retrievePayment({ providerPaymentId: cleanChargeId });
  const currency = String(ledger.currency || "SAR").toUpperCase();
  const expectedMinor = majorToMinorAmount(Number(ledger.amount), currency);

  if (providerPayment.amountMinor !== expectedMinor || providerPayment.currency !== currency) {
    console.error("[managed casting payment] amount/currency mismatch", {
      castingPaymentId: ledger.id,
      expectedMinor,
      actualMinor: providerPayment.amountMinor,
      expectedCurrency: currency,
      actualCurrency: providerPayment.currency,
    });
    throw new Error("Managed casting payment amount or currency mismatch.");
  }

  const now = new Date().toISOString();
  const nextStatus = toLedgerStatus(providerPayment.status);

  const { error: updateError } = await admin
    .from("casting_payments")
    .update({
      status: nextStatus,
      paid_at: nextStatus === "paid" ? now : null,
      provider_reference: cleanChargeId,
      updated_at: now,
    })
    .eq("id", ledger.id)
    .eq("provider_payment_id", cleanChargeId);
  if (updateError) throw new Error(updateError.message);

  if (nextStatus === "paid") {
    const { data: project, error: projectError } = await admin
      .from("casting_projects")
      .select("id,status,payment_plan,client_access_token")
      .eq("id", ledger.casting_project_id)
      .eq("service_mode", "managed")
      .maybeSingle();
    if (projectError) throw new Error(projectError.message);

    const activatesProject = ledger.milestone_code === "upfront" || ledger.milestone_code === "activation";
    if (project && activatesProject) {
      const { error: projectUpdateError } = await admin
        .from("casting_projects")
        .update({
          status: ["new", "qualified", "proposal", "awaiting_client"].includes(project.status) ? "active" : project.status,
          commercial_status: "won",
          client_status_note: "تم استلام الدفعة وبدء تشغيل مشروع الكاستينغ بواسطة فريق ملامح.",
          updated_at: now,
        })
        .eq("id", project.id)
        .eq("service_mode", "managed");
      if (projectUpdateError) throw new Error(projectUpdateError.message);
    }
  }

  return {
    found: true as const,
    status: nextStatus,
    paymentId: Number(ledger.id),
    projectId: Number(ledger.casting_project_id),
    milestoneCode: ledger.milestone_code ? String(ledger.milestone_code) : null,
  };
}
