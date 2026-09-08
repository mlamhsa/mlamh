import { createHash } from "crypto";
import { after, NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import { processSupportCommercialIntake } from "@/lib/marketing/dana/support-adapter";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_CATEGORIES = new Set([
  "general_inquiry",
  "complaint",
  "suggestion",
  "technical_issue",
  "partnership",
  "investment",
  "account_issue",
  "opportunity_issue",
  "report",
  "other",
]);

type SupportBody = {
  senderName?: unknown;
  senderEmail?: unknown;
  senderPhone?: unknown;
  category?: unknown;
  subject?: unknown;
  message?: unknown;
  locale?: unknown;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });

  let body: SupportBody;
  try { body = await request.json() as SupportBody; }
  catch { return NextResponse.json({ ok: false, code: "INVALID_BODY" }, { status: 400 }); }

  const locale = body.locale === "en" ? "en" as const : "ar" as const;
  const senderName = text(body.senderName);
  const senderEmail = text(body.senderEmail).toLowerCase();
  const senderPhone = text(body.senderPhone) || null;
  const subject = text(body.subject);
  const message = text(body.message);
  const requestedCategory = text(body.category);
  const category = ALLOWED_CATEGORIES.has(requestedCategory) ? requestedCategory : "general_inquiry";

  if (
    senderName.length < 2 || senderName.length > 120 ||
    senderEmail.length < 3 || senderEmail.length > 320 ||
    subject.length < 3 || subject.length > 200 ||
    message.length < 1 || message.length > 10000 ||
    (senderPhone && (senderPhone.length < 5 || senderPhone.length > 40))
  ) {
    return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  const rateKey = createHash("sha256").update(`support:${auth.user.id}`).digest("hex");
  const { data: rateRows, error: rateError } = await adminClient.rpc("consume_support_rate_limit", {
    p_key_hash: rateKey,
    p_limit: 5,
    p_window_seconds: 900,
  });

  if (!rateError) {
    const rate = Array.isArray(rateRows) ? rateRows[0] : rateRows;
    if (rate && rate.allowed === false) {
      return NextResponse.json({ ok: false, code: "RATE_LIMIT" }, { status: 429 });
    }
  } else {
    console.error("[api.support.rateLimit]", rateError);
  }

  const { data, error } = await adminClient.rpc("create_support_ticket_with_message", {
    p_user_id: auth.user.id,
    p_profile_id: profile?.id ? Number(profile.id) : null,
    p_sender_name: senderName,
    p_sender_email: senderEmail,
    p_sender_phone: senderPhone,
    p_category: category,
    p_subject: subject,
    p_message: message,
    p_locale: locale,
    p_source: "mobile_app",
  });

  if (error) {
    console.error("[api.support.create]", error);
    return NextResponse.json({ ok: false, code: "CREATE_FAILED" }, { status: 500 });
  }

  const result = Array.isArray(data) ? data[0] : data;
  const ticketNumber = result?.ticket_number ? String(result.ticket_number) : "";

  if (ticketNumber) {
    after(async () => {
      try {
        await processSupportCommercialIntake({ ticketNumber, senderName, senderEmail, senderPhone, subject, message, category });
      } catch (intakeError) {
        console.error("[api.support.commercialIntake]", intakeError);
      }
    });
  }

  return NextResponse.json({ ok: true, ticketNumber });
}
