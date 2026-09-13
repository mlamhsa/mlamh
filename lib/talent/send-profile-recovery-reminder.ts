import { createAdminClient } from "@/lib/supabase/admin";
import {
  formatRecoveryItems,
  resolveTalentCommunicationLocale,
  type LocalizedRecoveryItem,
  type TalentCommunicationLocale,
} from "@/lib/talent/recovery-communication";

export type TalentProfileRecoveryKind =
  | "incomplete_profile"
  | "ready_not_submitted"
  | "changes_requested";

type OperatorLocale = "ar" | "en";
type MessageLocale = "ar" | "en";

type SendTalentProfileRecoveryReminderInput = {
  userId: string;
  kind: TalentProfileRecoveryKind;
  missingItems?: LocalizedRecoveryItem[];
  changeReason?: string | null;
  operatorLocale?: OperatorLocale;
};

type SendTalentProfileRecoveryReminderResult =
  | {
      success: true;
      email: string;
      provider: string | null;
      communicationLocale: TalentCommunicationLocale;
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

type RecoveryCopy = {
  subject: string;
  intro: string;
  actionLabel: string;
  detailLabel: string;
  helpText: string;
  footerText: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function operatorMessage(
  locale: OperatorLocale,
  ar: string,
  en: string,
) {
  return locale === "ar" ? ar : en;
}

function getRecoveryCopy(
  kind: TalentProfileRecoveryKind,
  locale: MessageLocale,
): RecoveryCopy {
  const ar = locale === "ar";

  if (kind === "changes_requested") {
    return {
      subject: ar
        ? "مطلوب تعديل ملفك في ملامح"
        : "Changes are required for your MLAMH profile",
      intro: ar
        ? "راجع التعديلات المطلوبة على ملفك، ثم حدّث البيانات وأعد إرسال الملف للمراجعة."
        : "Review the requested changes, update your profile, then submit it again for review.",
      actionLabel: ar ? "تعديل الملف" : "Update profile",
      detailLabel: ar ? "التعديلات المطلوبة:" : "Requested changes:",
      helpText: ar
        ? "إذا احتجت مساعدة يمكنك الرد مباشرة على هذه الرسالة."
        : "If you need help, reply directly to this email.",
      footerText: ar ? "منصة المواهب والفرص" : "Talent & Opportunities Platform",
    };
  }

  if (kind === "ready_not_submitted") {
    return {
      subject: ar
        ? "ملفك جاهز للمراجعة في ملامح"
        : "Your MLAMH profile is ready for review",
      intro: ar
        ? "أكملت المتطلبات الأساسية لملفك. بقيت خطوة واحدة فقط: أرسل الملف للمراجعة ليتمكن فريق ملامح من اعتماده."
        : "You completed the required profile information. One step remains: submit your profile for review.",
      actionLabel: ar ? "فتح لوحة الموهبة" : "Open talent dashboard",
      detailLabel: ar ? "العناصر الناقصة:" : "Missing items:",
      helpText: ar
        ? "إذا احتجت مساعدة يمكنك الرد مباشرة على هذه الرسالة."
        : "If you need help, reply directly to this email.",
      footerText: ar ? "منصة المواهب والفرص" : "Talent & Opportunities Platform",
    };
  }

  return {
    subject: ar
      ? "أكمل ملف موهبتك في ملامح"
      : "Complete your talent profile on MLAMH",
    intro: ar
      ? "ملف موهبتك لم يكتمل بعد. أكمل المتطلبات الأساسية حتى تتمكن من إرساله للمراجعة والتقديم على الفرص."
      : "Your talent profile is not complete yet. Complete the required information so you can submit it for review and apply to opportunities.",
    actionLabel: ar ? "إكمال الملف" : "Complete profile",
    detailLabel: ar ? "العناصر الناقصة:" : "Missing items:",
    helpText: ar
      ? "إذا احتجت مساعدة يمكنك الرد مباشرة على هذه الرسالة."
      : "If you need help, reply directly to this email.",
    footerText: ar ? "منصة المواهب والفرص" : "Talent & Opportunities Platform",
  };
}

function buildMessageSection({
  locale,
  kind,
  name,
  missingItems,
  changeReason,
  baseUrl,
}: {
  locale: MessageLocale;
  kind: TalentProfileRecoveryKind;
  name: string;
  missingItems: LocalizedRecoveryItem[];
  changeReason?: string | null;
  baseUrl: string;
}) {
  const copy = getRecoveryCopy(kind, locale);
  const greeting = name
    ? locale === "ar"
      ? `مرحبًا ${name}`
      : `Hello ${name}`
    : locale === "ar"
      ? "مرحبًا"
      : "Hello";
  const actionPath =
    kind === "ready_not_submitted"
      ? "talent-dashboard"
      : "talent-dashboard/profile";
  const actionUrl = `${baseUrl}/${locale}/${actionPath}`;
  const detailText =
    kind === "changes_requested"
      ? String(changeReason ?? "").trim()
      : formatRecoveryItems(missingItems, locale).join(
          locale === "ar" ? "، " : ", ",
        );

  return {
    ...copy,
    locale,
    greeting,
    actionUrl,
    detailText,
  };
}

function renderTextSection(
  section: ReturnType<typeof buildMessageSection>,
) {
  return [
    section.greeting,
    "",
    section.intro,
    section.detailText ? "" : null,
    section.detailText
      ? `${section.detailLabel} ${section.detailText}`
      : null,
    "",
    `${section.actionLabel}: ${section.actionUrl}`,
    "",
    section.helpText,
    "",
    `MLAMH | ملامح — ${section.footerText}`,
    "https://mlamh.net",
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

function renderHtmlSection(
  section: ReturnType<typeof buildMessageSection>,
) {
  const detailHtml = section.detailText
    ? `<div style="margin:18px 0;padding:14px 16px;border-radius:10px;background:#F5F1E8;color:#2E2E2E"><strong>${escapeHtml(section.detailLabel)}</strong><div style="margin-top:6px">${escapeHtml(section.detailText)}</div></div>`
    : "";

  return `
    <div dir="${section.locale === "ar" ? "rtl" : "ltr"}" lang="${section.locale}" style="line-height:1.8">
      <p style="font-size:18px;font-weight:700">${escapeHtml(section.greeting)}</p>
      <p>${escapeHtml(section.intro)}</p>
      ${detailHtml}
      <p style="margin:24px 0">
        <a href="${section.actionUrl}" style="display:inline-block;background:#D4A017;color:#2E2E2E;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:700">${escapeHtml(section.actionLabel)}</a>
      </p>
      <p>${escapeHtml(section.helpText)}</p>
      <p style="color:#666;font-size:12px;margin:18px 0 0">MLAMH | ملامح — ${escapeHtml(section.footerText)}</p>
    </div>
  `;
}

export async function sendTalentProfileRecoveryReminder({
  userId,
  kind,
  missingItems = [],
  changeReason,
  operatorLocale = "en",
}: SendTalentProfileRecoveryReminderInput): Promise<SendTalentProfileRecoveryReminderResult> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient.auth.admin.getUserById(userId);

  if (error || !data.user) {
    console.error("[TalentProfileRecoveryReminder.authUser]", error);
    return {
      success: false,
      status: "user_not_found",
      message: operatorMessage(
        operatorLocale,
        "تعذر العثور على المستخدم.",
        "Unable to find the user.",
      ),
    };
  }

  const user = data.user;
  const email = user.email?.trim();

  if (!email) {
    return {
      success: false,
      status: "missing_email",
      message: operatorMessage(
        operatorLocale,
        "لا يوجد بريد إلكتروني للمستخدم.",
        "The user does not have an email address.",
      ),
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    console.error("[TalentProfileRecoveryReminder] Missing RESEND configuration");
    return {
      success: false,
      status: "missing_email_config",
      message: operatorMessage(
        operatorLocale,
        "إعدادات البريد غير مكتملة.",
        "Email configuration is incomplete.",
      ),
    };
  }

  const metadata = user.user_metadata ?? {};
  const communicationLocale = resolveTalentCommunicationLocale(metadata);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mlamh.net";
  const replyTo = process.env.RESEND_REPLY_TO_EMAIL ?? "hello@mlamh.net";
  const rawName = String(
    metadata.full_name ?? metadata.name ?? metadata.display_name ?? "",
  ).trim();

  const messageLocales: MessageLocale[] =
    communicationLocale === "bilingual"
      ? ["en", "ar"]
      : [communicationLocale];
  const sections = messageLocales.map((locale) =>
    buildMessageSection({
      locale,
      kind,
      name: rawName,
      missingItems,
      changeReason,
      baseUrl,
    }),
  );
  const subject = sections.map((section) => section.subject).join(" | ");
  const text = sections.map(renderTextSection).join("\n\n---\n\n");
  const html = `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#2E2E2E">
      ${sections
        .map((section, index) =>
          `${index > 0 ? '<hr style="border:0;border-top:1px solid #e5e5e5;margin:28px 0" />' : ""}${renderHtmlSection(section)}`,
        )
        .join("")}
      <p style="font-size:12px;margin:6px 0 0"><a href="https://mlamh.net" style="color:#666">mlamh.net</a></p>
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
      message: operatorMessage(
        operatorLocale,
        "تعذر إرسال التذكير.",
        "Unable to send the reminder.",
      ),
    };
  }

  return {
    success: true,
    email,
    provider: user.app_metadata?.provider ?? null,
    communicationLocale,
  };
}
