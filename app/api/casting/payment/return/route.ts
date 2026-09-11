import { NextResponse } from "next/server";

import { reconcileManagedCastingTapCharge } from "@/lib/casting/managed-payment-reconciliation";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function siteUrl(request: Request) {
  return (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
}

function workspaceUrl(request: Request, locale: string, token: string, state: string) {
  const base = siteUrl(request);
  return `${base}/${locale}/casting/status/${encodeURIComponent(token)}?payment=${encodeURIComponent(state)}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = (url.searchParams.get("token") || "").trim();
  const locale = url.searchParams.get("locale") === "en" ? "en" : "ar";
  const paymentId = Number(url.searchParams.get("payment"));
  const tapId = (url.searchParams.get("tap_id") || "").trim();

  if (!token || token.length > 100 || !Number.isInteger(paymentId) || paymentId <= 0) {
    return NextResponse.redirect(workspaceUrl(request, locale, token, "invalid"), 303);
  }

  const admin = createAdminClient();
  const { data: project } = await admin
    .from("casting_projects")
    .select("id,service_mode,client_access_token")
    .eq("client_access_token", token)
    .eq("service_mode", "managed")
    .maybeSingle();

  if (!project) return NextResponse.redirect(`${siteUrl(request)}/${locale}/casting`, 303);

  const { data: ledger } = await admin
    .from("casting_payments")
    .select("id,status,provider_payment_id")
    .eq("id", paymentId)
    .eq("casting_project_id", project.id)
    .maybeSingle();

  if (!ledger) return NextResponse.redirect(workspaceUrl(request, locale, token, "not_found"), 303);
  if (ledger.status === "paid") return NextResponse.redirect(workspaceUrl(request, locale, token, "paid"), 303);

  const providerPaymentId = tapId || String(ledger.provider_payment_id || "").trim();
  if (!providerPaymentId) return NextResponse.redirect(workspaceUrl(request, locale, token, "pending"), 303);
  if (ledger.provider_payment_id && String(ledger.provider_payment_id) !== providerPaymentId) {
    console.error("[managed casting return] Tap charge mismatch", { paymentId, expected: ledger.provider_payment_id, actual: providerPaymentId });
    return NextResponse.redirect(workspaceUrl(request, locale, token, "invalid"), 303);
  }

  try {
    const result = await reconcileManagedCastingTapCharge(providerPaymentId);
    if (!result.found || result.paymentId !== paymentId || result.projectId !== Number(project.id)) {
      return NextResponse.redirect(workspaceUrl(request, locale, token, "invalid"), 303);
    }
    return NextResponse.redirect(workspaceUrl(request, locale, token, result.status), 303);
  } catch (error) {
    console.error("[managed casting return] reconciliation failed", error);
    return NextResponse.redirect(workspaceUrl(request, locale, token, "pending"), 303);
  }
}
