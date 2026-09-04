import { createAdminClient } from "@/lib/supabase/admin";

export type TalentProfileRecoveryKind =
  | "incomplete_profile"
  | "ready_not_submitted"
  | "changes_requested";

type SendTalentProfileRecoveryReminderInput = {
  userId: string;
  locale?: "ar" | "en";
  kind: TalentProfileRecoveryKind;
  missingItems?: string[];
  changeReason?: string | null;
};

type SendTalentProfileRecoveryReminderResult =
  | {
      success: true;
      email: string;
      provider: string | null;
    }
  | {
      success: false;
      status:
        | "user_not_found"
        | "missing_email"
        | "missing_email_config"
        | "send_failed";
      message: string;
    };

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendTalentProfileRecoveryReminder({
  userId,
  locale = "ar",
  kind,
  missingItems = [],
  changeReason,
}: SendTalentProfileRecoveryReminderInput): Promise<SendTalentProfileRecoveryReminderResult> {
  const adminClient = createAdminClient();
  const { data, error } =
    await adminClient.auth.admin.getUserById(userId);

  if (error || !data.user) {
    console.error("[TalentProfileRecoveryReminder.authUser]", error);
    return {
      success: false,
      status: "user_not_found",
      message:
        locale === "ar"
          ? "تعذر العثور على المستخدم."
          : "Unable to find the user.",
    };
  }

  const user = data.user;
  const email = user.email?.trim();

  if (!email) {
    return {
      success: false,
      status: "missing_email",
      message:
        locale === "ar"
          ? "لا يوجد بريد إلكتروني للمستخدم."
          : "The user does not have an email address.",
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    console.error("[TalentProfileRecoveryReminder] Missing RESEND configuration");
    return {
      success: false,
      status: "missing_email_config",
      message:
        locale === "ar"
          ? "إعدادات البريد غير مكتملة."
          : "Email configuration is incomplete.",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mlamh.net";
  const profileUrl = `${baseUrl}/${locale}/talent-dashboard/profile`;
  const dashboardUrl = `${baseUrl}/${locale}/talent-dashboard`;
  const replyTo = process.env.RESEND_REPLY_TO_EMAIL ?? "hello@mlamh.net";

  const metadata = user.user_metadata ?? {};
  const rawName = String(
    metadata.full_name ?? metadata.name ?? metadata.display_name ?? "",
  ).trim();
  const greeting = rawName
    ? locale === "ar"
      ? `مرحبًا ${rawName}`
      : `Hello ${rawName}`
    : locale === "ar"
      ? "مرحبًا"
      : "Hello";

  let subject: string;
  let intro: string;
  let actionLabel: string;
  let actionUrl = profileUrl;
  let detailText = "";

  if (kind === "changes_requested") {
    subject =
      locale === "ar"
        ? "مطلوب تعديل ملفك في ملامح"
        : "Changes are required for your MLAMH profile";
    intro =
      locale === "ar"
        ? "راجع التعديلات المطلوبة على ملفك، ثم حدّث البيانات وأعد إرسال الملف للمراجعة."
        : "Review the requested changes, update your profile, then submit it again for review.";
    actionLabel =
      locale === "ar" ? "تعديل الملف" : "Update profile";
    detailText = String(changeReason ?? "").trim();
  } else if (kind === "ready_not_submitted") {
    subject =
      locale === "ar"
        ? "ملفك جاهز للمراجعة في ملامح"
        : "Your MLAMH profile is ready for review";
    intro =
      locale === "ar"
        ? "أكملت المتطلبات الأساسية لملفك. بقيت خطوة واحدة فقط: أرسل الملف للمراجعة ليتمكن فريق ملامح من اعتماده."
        : "You completed the required profile information. One step remains: submit your profile for review.";
    actionLabel =
      locale === "ar" ? "فتح لوحة الموهبة" : "Open talent dashboard";
    actionUrl = dashboardUrl;
  } else {
    subject =
      locale === "ar"
        ? "أكمل ملف موهبتك في ملامح"
        : "Complete your talent profile on MLAMH";
    intro =
      locale === "ar"
        ? "ملف موهبتك لم يكتمل بعد. أكمل المتطلبات الأساسية حتى تتمكن من إرساله للمراجعة والتقديم على الفرص."
        : "Your talent profile is not complete yet. Complete the required information so you can submit it for review and apply to opportunities.";
    actionLabel =
      locale === "ar" ? "إكمال الملف" : "Complete profile";
    detailText = missingItems.join("، ");
  }

  const safeGreeting = escapeHtml(greeting);
  const safeIntro = escapeHtml(intro);
  const safeDetail = escapeHtml(detailText);

  const detailHtml = safeDetail
    ? `<div style="margin:18px 0;padding:14px 16px;border-radius:10px;background:#F5F1E8;color:#2E2E2E"><strong>${
        locale === "ar"
          ? kind === "changes_requested"
            ? "التعديلات المطلوبة:"
            : "العناصر الناقصة:"
          : kind === "changes_requested"
            ? "Requested changes:"
            : "Missing items:"
      }</strong><div style="margin-top:6px">${safeDetail}</div></div>`
    : "";

  const text = [
    greeting,
    "",
    intro,
    detailText ? "" : null,
    detailText || null,
    "",
    `${actionLabel}: ${actionUrl}`,
    "",
    locale === "ar"
      ? "إذا احتجت مساعدة يمكنك الرد مباشرة على هذه الرسالة."
      : "If you need help, reply directly to this email.",
    "",
    "MLAMH | ملامح",
    "https://mlamh.net",
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  const html = `
    <div dir="${locale === "ar" ? "rtl" : "ltr"}" style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;line-height:1.8;color:#2E2E2E">
      <p style="font-size:18px;font-weight:700">${safeGreeting}</p>
      <p>${safeIntro}</p>
      ${detailHtml}
      <p style="margin:24px 0">
        <a href="${actionUrl}" style="display:inline-block;background:#D4A017;color:#2E2E2E;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:700">${escapeHtml(actionLabel)}</a>
      </p>
      <p>${locale === "ar" ? "إذا احتجت مساعدة يمكنك الرد مباشرة على هذه الرسالة." : "If you need help, reply directly to this email."}</p>
      <hr style="border:0;border-top:1px solid #e5e5e5;margin:24px 0" />
      <p style="color:#666;font-size:12px;margin:0">MLAMH | ملامح — ${locale === "ar" ? "منصة المواهب والفرص" : "Talent & Opportunities Platform"}</p>
      <p style="font-size:12px;margin:4px 0 0"><a href="https://mlamh.net" style="color:#666">mlamh.net</a></p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      reply_to: replyTo,
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    console.error(
      "[TalentProfileRecoveryReminder.resend]",
      await response.text(),
    );
    return {
      success: false,
      status: "send_failed",
      message:
        locale === "ar"
          ? "تعذر إرسال التذكير."
          : "Unable to send the reminder.",
    };
  }

  return {
    success: true,
    email,
    provider: user.app_metadata?.provider ?? null,
  };
}
