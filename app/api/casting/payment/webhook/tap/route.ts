import { NextResponse } from "next/server";

import { majorToMinorAmount } from "@/lib/payments/money";
import { tapPaymentProvider } from "@/lib/payments/providers/tap/tap-provider";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type TapPayload = { id?: unknown };

function providerObjectId(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const id = (payload as TapPayload).id;
  return typeof id === "string" && id.trim() ? id.trim() : null;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!rawBody) return NextResponse.json({ ok: false, error: "empty_body" }, { status: 400 });

  const verification = await tapPaymentProvider.verifyWebhook({ rawBody, headers: request.headers });
  if (!verification.valid) {
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  }

  const chargeId = providerObjectId(verification.rawPayload);
  if (!chargeId) return NextResponse.json({ ok: false, error: "missing_charge_id" }, { status: 400 });

  const admin = createAdminClient();
  const { data: ledger } = await admin
    .from("casting_payments")
    .select("id,casting_project_id,status,amount,currency,milestone_code,provider_payment_id")
    .eq("provider_payment_id", chargeId)
    .maybeSingle();

  if (!ledger) {
    return NextResponse.json({ ok: true, accepted: true, ignored: true }, { status: 200 });
  }

  try {
    const providerPayment = await tapPaymentProvider.retrievePayment({ providerPaymentId: chargeId });
    const expectedMinor = majorToMinorAmount(Number(ledger.amount), String(ledger.currency));
    if (providerPayment.amountMinor !== expectedMinor || providerPayment.currency !== String(ledger.currency).toUpperCase()) {
      console.error("[managed casting webhook] amount/currency mismatch", {
        castingPaymentId: ledger.id,
        expectedMinor,
        actualMinor: providerPayment.amountMinor,
        expectedCurrency: ledger.currency,
        actualCurrency: providerPayment.currency,
      });
      return NextResponse.json({ ok: false, error: "payment_mismatch" }, { status: 409 });
    }

    const now = new Date().toISOString();
    const nextStatus = providerPayment.status === "succeeded"
      ? "paid"
      : providerPayment.status === "failed"
        ? "failed"
        : providerPayment.status === "cancelled"
          ? "cancelled"
          : "pending";

    const { error: updateError } = await admin
      .from("casting_payments")
      .update({
        status: nextStatus,
        paid_at: nextStatus === "paid" ? now : null,
        provider_reference: chargeId,
        updated_at: now,
      })
      .eq("id", ledger.id)
      .eq("provider_payment_id", chargeId);
    if (updateError) throw new Error(updateError.message);

    if (nextStatus === "paid") {
      const { data: project } = await admin
        .from("casting_projects")
        .select("id,status,payment_plan,client_access_token")
        .eq("id", ledger.casting_project_id)
        .eq("service_mode", "managed")
        .maybeSingle();

      const activatesProject = ledger.milestone_code === "upfront" || ledger.milestone_code === "activation";
      if (project && activatesProject) {
        await admin
          .from("casting_projects")
          .update({
            status: ["new", "qualified", "proposal", "awaiting_client"].includes(project.status) ? "active" : project.status,
            commercial_status: "won",
            client_status_note: "تم استلام الدفعة وبدء تشغيل مشروع الكاستينغ بواسطة فريق ملامح.",
            updated_at: now,
          })
          .eq("id", project.id)
          .eq("service_mode", "managed");
      }
    }

    return NextResponse.json({ ok: true, accepted: true, status: nextStatus }, { status: 200 });
  } catch (error) {
    console.error("[managed casting webhook] processing failed", error);
    return NextResponse.json({ ok: false, error: "processing_failed" }, { status: 500 });
  }
}
