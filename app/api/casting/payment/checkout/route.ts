import { NextResponse } from "next/server";

import { majorToMinorAmount } from "@/lib/payments/money";
import { tapPaymentProvider } from "@/lib/payments/providers/tap/tap-provider";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function siteUrl(request: Request) {
  return (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
}

function livePaymentsReady() {
  const key = process.env.TAP_SECRET_KEY?.trim() || "";
  return process.env.PAYMENTS_LIVE_ENABLED === "true" && key.startsWith("sk_live_");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = (url.searchParams.get("token") || "").trim();
  const paymentId = Number(url.searchParams.get("payment"));
  const locale = url.searchParams.get("locale") === "en" ? "en" : "ar";

  if (!token || token.length > 100 || !Number.isInteger(paymentId) || paymentId <= 0) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  if (!livePaymentsReady()) {
    return NextResponse.json(
      { error: locale === "ar" ? "الدفع الإلكتروني غير متاح مؤقتًا." : "Online payment is temporarily unavailable." },
      { status: 503 },
    );
  }

  const admin = createAdminClient();
  const { data: project } = await admin
    .from("casting_projects")
    .select("id,service_mode,client_name,contact_email,contact_phone,country_code,client_access_token,payment_plan")
    .eq("client_access_token", token)
    .eq("service_mode", "managed")
    .maybeSingle();

  if (!project) return NextResponse.json({ error: "project_not_found" }, { status: 404 });
  if (project.payment_plan === "launch_free") {
    return NextResponse.redirect(`${siteUrl(request)}/${locale}/casting/status/${token}`, 303);
  }

  const { data: payment } = await admin
    .from("casting_payments")
    .select("id,public_id,status,amount,currency,provider,provider_payment_id,checkout_url,milestone_code")
    .eq("id", paymentId)
    .eq("casting_project_id", project.id)
    .maybeSingle();

  if (!payment) return NextResponse.json({ error: "payment_not_found" }, { status: 404 });
  if (payment.status === "paid") {
    return NextResponse.redirect(`${siteUrl(request)}/${locale}/casting/status/${token}?payment=paid`, 303);
  }
  if (payment.provider && payment.provider !== "tap") {
    return NextResponse.json({ error: "unsupported_provider" }, { status: 400 });
  }
  if (payment.checkout_url && payment.provider_payment_id) {
    return NextResponse.redirect(payment.checkout_url, 303);
  }

  const currency = String(payment.currency || "SAR").toUpperCase();
  const amountMinor = majorToMinorAmount(Number(payment.amount), currency);
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
    return NextResponse.json({ error: "invalid_payment_amount" }, { status: 400 });
  }

  const baseUrl = siteUrl(request);
  const returnParams = new URLSearchParams({ token, payment: String(payment.id), locale });
  const checkout = await tapPaymentProvider.createCheckout({
    paymentPublicId: String(payment.public_id),
    idempotencyKey: `managed-casting-${payment.public_id}`,
    amountMinor,
    currency,
    marketCountry: project.country_code || "SA",
    customer: {
      userId: `managed-casting-client-${project.id}`,
      email: project.contact_email,
      firstName: project.client_name || "MLAMH",
      lastName: "Casting Client",
      phone: project.contact_phone,
    },
    references: {
      order: String(payment.public_id),
      transaction: String(payment.public_id),
    },
    redirectUrl: `${baseUrl}/api/casting/payment/return?${returnParams.toString()}`,
    webhookUrl: `${baseUrl}/api/casting/payment/webhook/tap`,
    metadata: {
      casting_project_id: String(project.id),
      casting_payment_id: String(payment.id),
      milestone_code: String(payment.milestone_code || "payment"),
    },
  });

  const { error: updateError } = await admin
    .from("casting_payments")
    .update({
      provider: "tap",
      provider_payment_id: checkout.providerPaymentId,
      provider_reference: checkout.providerPaymentId,
      checkout_url: checkout.checkoutUrl,
      checkout_created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment.id)
    .eq("casting_project_id", project.id)
    .eq("status", "pending");

  if (updateError) {
    console.error("[managed casting checkout] unable to persist provider checkout", updateError);
    return NextResponse.json({ error: "checkout_persist_failed" }, { status: 500 });
  }

  return NextResponse.redirect(checkout.checkoutUrl, 303);
}
