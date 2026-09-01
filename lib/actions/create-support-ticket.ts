"use server";

import { createHash } from "crypto";
import { after } from "next/server";
import { redirect } from "next/navigation";

import { processSupportCommercialIntake } from "@/lib/marketing/dana/support-adapter";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function supportUrl(locale: "ar" | "en", params: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  return `/${locale}/contact${query ? `?${query}` : ""}`;
}

export async function createSupportTicketAction(formData: FormData) {
  const locale: "ar" | "en" = field(formData, "locale") === "en" ? "en" : "ar";
  const senderName = field(formData, "sender_name");
  const senderEmail = field(formData, "sender_email").toLowerCase();
  const senderPhone = field(formData, "sender_phone") || null;
  const subject = field(formData, "subject");
  const message = field(formData, "message");
  const requestedCategory = field(formData, "category");
  const category = ALLOWED_CATEGORIES.has(requestedCategory)
    ? requestedCategory
    : "general_inquiry";

  if (
    senderName.length < 2 ||
    senderName.length > 120 ||
    senderEmail.length < 3 ||
    senderEmail.length > 320 ||
    subject.length < 3 ||
    subject.length > 200 ||
    message.length < 1 ||
    message.length > 10000 ||
    (senderPhone && (senderPhone.length < 5 || senderPhone.length > 40))
  ) {
    redirect(supportUrl(locale, { support_error: "invalid" }));
  }

  const adminClient = createAdminClient();
  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  let profileId: number | null = null;
  if (user) {
    const { data: profile } = await adminClient
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    profileId = profile?.id ? Number(profile.id) : null;
  }

  const rateKey = createHash("sha256")
    .update(`support:${user?.id ?? senderEmail}`)
    .digest("hex");

  const { data: rateRows, error: rateError } = await adminClient.rpc(
    "consume_support_rate_limit",
    {
      p_key_hash: rateKey,
      p_limit: 5,
      p_window_seconds: 900,
    },
  );

  if (rateError) {
    console.error("[createSupportTicketAction.rateLimit]", rateError);
  } else {
    const rate = Array.isArray(rateRows) ? rateRows[0] : rateRows;
    if (rate && rate.allowed === false) {
      redirect(supportUrl(locale, { support_error: "rate_limit" }));
    }
  }

  const { data, error } = await adminClient.rpc("create_support_ticket_with_message", {
    p_user_id: user?.id ?? null,
    p_profile_id: profileId,
    p_sender_name: senderName,
    p_sender_email: senderEmail,
    p_sender_phone: senderPhone,
    p_category: category,
    p_subject: subject,
    p_message: message,
    p_locale: locale,
    p_source: user ? "account" : "contact_page",
  });

  if (error) {
    console.error("[createSupportTicketAction.create]", error);
    redirect(supportUrl(locale, { support_error: "create_failed" }));
  }

  const result = Array.isArray(data) ? data[0] : data;
  const ticketNumber = result?.ticket_number ? String(result.ticket_number) : "";

  if (ticketNumber) {
    // Do not make the customer wait for the internal Marketing Hub pipeline.
    // The support ticket is already the source of truth at this point; Dana runs
    // after the response and remains independently idempotent/auditable.
    after(async () => {
      try {
        await processSupportCommercialIntake({
          ticketNumber,
          senderName,
          senderEmail,
          senderPhone,
          subject,
          message,
          category,
        });
      } catch (intakeError) {
        console.error("[createSupportTicketAction.commercialIntake]", intakeError);
      }
    });
  }

  redirect(
    supportUrl(locale, {
      support_sent: "1",
      ...(ticketNumber ? { ticket: ticketNumber } : {}),
    }),
  );
}
