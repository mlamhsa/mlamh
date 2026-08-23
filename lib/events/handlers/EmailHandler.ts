import { createAdminClient } from "@/lib/supabase/admin";

import type { EventTarget } from "../event-targets";
import type { EventType } from "../event-types";

type EmailContent = {
  subject: string;
  html: string;
};

function getMetadataString(
  metadata: Record<string, unknown>,
  key: string,
) {
  const value = metadata[key];

  return typeof value === "string"
    ? value.trim()
    : value === null || value === undefined
      ? ""
      : String(value).trim();
}

function buildEmailTemplate({
  locale,
  heading,
  message,
  buttonText,
  buttonUrl,
  eyebrow,
}: {
  locale: "ar" | "en";
  heading: string;
  message: string;
  buttonText?: string;
  buttonUrl?: string;
  eyebrow?: string;
}) {
  const isArabic = locale === "ar";
  const direction = isArabic ? "rtl" : "ltr";
  const align = isArabic ? "right" : "left";

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://mlamh.net";

  const logoUrl = `${siteUrl}/logo.ar.png`;

  const button =
    buttonText && buttonUrl
      ? `
        <tr>
          <td
            align="${isArabic ? "right" : "left"}"
            style="padding-top:32px;"
          >
            <a
              href="${buttonUrl}"
              target="_blank"
              style="
                display:inline-block;
                background:#d2ad5c;
                color:#080808;
                text-decoration:none;
                font-size:15px;
                line-height:20px;
                font-weight:700;
                padding:15px 26px;
                border-radius:10px;
              "
            >
              ${buttonText}
            </a>
          </td>
        </tr>
      `
      : "";

  return `
<!doctype html>
<html lang="${locale}" dir="${direction}">
<head>
  <meta charset="utf-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1"
  />
  <meta
    name="color-scheme"
    content="dark"
  />
  <meta
    name="supported-color-schemes"
    content="dark"
  />
  <title>MLAMH</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#050505;
    color:#ffffff;
    font-family:Arial,Helvetica,sans-serif;
  "
>
  <table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    border="0"
    style="
      width:100%;
      background:#050505;
      margin:0;
      padding:0;
    "
  >
    <tr>
      <td
        align="center"
        style="padding:40px 16px;"
      >

        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="
            width:100%;
            max-width:640px;
            background:#0a0a0a;
            border:1px solid #242016;
            border-radius:20px;
            overflow:hidden;
          "
        >

          <!-- HEADER -->
          <tr>
            <td
              align="center"
              style="
                padding:34px 32px 30px;
                background:#0a0a0a;
                border-bottom:1px solid #272117;
              "
            >
              <img
                src="${logoUrl}"
                alt="MLAMH"
                width="190"
                style="
                  display:block;
                  width:190px;
                  max-width:100%;
                  height:auto;
                  margin:0 auto;
                  border:0;
                  outline:none;
                  text-decoration:none;
                "
              />
            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td
              style="
                padding:42px 38px 44px;
                text-align:${align};
              "
            >

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
              >

                ${
                  eyebrow
                    ? `
                  <tr>
                    <td
                      style="
                        padding-bottom:12px;
                        font-size:12px;
                        line-height:18px;
                        font-weight:700;
                        color:#c9a962;
                        text-align:${align};
                      "
                    >
                      ${eyebrow}
                    </td>
                  </tr>
                `
                    : ""
                }

                <tr>
                  <td
                    style="
                      font-size:30px;
                      line-height:1.45;
                      font-weight:500;
                      color:#ffffff;
                      text-align:${align};
                    "
                  >
                    ${heading}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding-top:16px;
                      font-size:15px;
                      line-height:2;
                      font-weight:400;
                      color:#b9b9b4;
                      text-align:${align};
                    "
                  >
                    ${message}
                  </td>
                </tr>

                ${button}

              </table>
            </td>
          </tr>

          <!-- DIVIDER / BRAND LINE -->
          <tr>
            <td
              style="
                height:1px;
                background:#211d15;
                font-size:1px;
                line-height:1px;
              "
            >
              &nbsp;
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td
              style="
                padding:26px 38px 30px;
                background:#080808;
                text-align:${align};
              "
            >

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
              >
                <tr>
                  <td
                    style="
                      font-size:12px;
                      line-height:1.8;
                      color:#666661;
                      text-align:${align};
                    "
                  >
                    ${
                      isArabic
                        ? "هذه رسالة تلقائية من منصة ملامح."
                        : "This is an automated message from MLAMH."
                    }
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding-top:8px;
                      font-size:12px;
                      line-height:1.8;
                      text-align:${align};
                    "
                  >
                    <a
                      href="${siteUrl}"
                      target="_blank"
                      style="
                        color:#c9a962;
                        text-decoration:none;
                      "
                    >
                      mlamh.net
                    </a>
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding-top:14px;
                      font-size:11px;
                      line-height:1.7;
                      color:#454540;
                      text-align:${align};
                    "
                  >
                    © ${new Date().getFullYear()} MLAMH
                    ${
                      isArabic
                        ? " — جميع الحقوق محفوظة."
                        : " — All rights reserved."
                    }
                  </td>
                </tr>
              </table>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function buildEmail(
  type: EventType,
  metadata: Record<string, unknown>,
): EmailContent | null {
  const locale =
    getMetadataString(metadata, "locale") === "en"
      ? "en"
      : "ar";

  const isArabic = locale === "ar";

  const reason =
    getMetadataString(metadata, "reason");
    const recipientName =
    getMetadataString(metadata, "recipientName");
  
  const greeting = recipientName
    ? isArabic
      ? `مرحبًا ${recipientName}`
      : `Hello ${recipientName}`
    : isArabic
      ? "مرحبًا بك في ملامح"
      : "Welcome to MLAMH";

  switch (type) {
    case "talent_approved":
  return {
    subject: isArabic
      ? "تم اعتماد ملفك في ملامح"
      : "Your MLAMH profile has been approved",

    html: buildEmailTemplate({
      locale,

      eyebrow: isArabic
        ? "تم الاعتماد"
        : "Profile approved",

      heading: greeting,

      message: isArabic
        ? "تم اعتماد ملفك بنجاح. أصبح بإمكانك الآن استعراض الفرص المتاحة والتقديم على الفرص المناسبة لك."
        : "Your profile has been approved successfully. You can now browse available opportunities and apply to the ones that match you.",

      buttonText: isArabic
        ? "استعراض الفرص"
        : "Browse opportunities",

      buttonUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/${
        isArabic ? "ar" : "en"
      }/opportunities`,
    }),
  };

      case "talent_changes_requested":
        return {
          subject: isArabic
            ? "ملفك في ملامح بحاجة إلى تعديل"
            : "Your MLAMH profile needs changes",
      
          html: buildEmailTemplate({
            locale,
            eyebrow: isArabic
              ? "مراجعة الملف"
              : "Profile review",
      
              heading: recipientName
              ? isArabic
                ? `${recipientName}، ملفك بحاجة إلى تعديل`
                : `${recipientName}, your profile needs changes`
              : isArabic
                ? "ملفك بحاجة إلى تعديل"
                : "Your profile needs changes",
      
            message: reason
              ? isArabic
                ? `يرجى إجراء التعديلات التالية ثم إعادة إرسال الملف للمراجعة:<br><br><strong style="color:#ffffff;">${reason}</strong>`
                : `Please make the following changes and submit your profile again:<br><br><strong style="color:#ffffff;">${reason}</strong>`
              : isArabic
                ? "يرجى مراجعة ملفك وإجراء التعديلات المطلوبة ثم إعادة إرساله للمراجعة."
                : "Please review your profile, make the requested changes, and submit it again.",
      
            buttonText: isArabic
              ? "تعديل الملف"
              : "Edit profile",
      
            buttonUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/${
              isArabic ? "ar" : "en"
            }/talent-dashboard/profile`,
          }),
        };

        case "talent_rejected":
          return {
            subject: isArabic
              ? "تحديث بخصوص ملفك في ملامح"
              : "Update regarding your MLAMH profile",
        
            html: buildEmailTemplate({
              locale,
              eyebrow: isArabic
                ? "نتيجة المراجعة"
                : "Review result",
        
                heading: recipientName
                ? isArabic
                  ? `${recipientName}، لم يتم اعتماد ملفك`
                  : `${recipientName}, your profile was not approved`
                : isArabic
                  ? "لم يتم اعتماد ملفك"
                  : "Your profile was not approved",
        
              message: reason
                ? isArabic
                  ? `لم يتم اعتماد الملف في المراجعة الحالية.<br><br><strong style="color:#ffffff;">السبب:</strong><br>${reason}`
                  : `Your profile was not approved in the current review.<br><br><strong style="color:#ffffff;">Reason:</strong><br>${reason}`
                : isArabic
                  ? "لم يتم اعتماد ملفك في المراجعة الحالية."
                  : "Your profile was not approved in the current review.",
        
              buttonText: isArabic
                ? "مراجعة ملفي"
                : "Review my profile",
        
              buttonUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/${
                isArabic ? "ar" : "en"
              }/talent-dashboard/profile`,
            }),
          };

    default:
      return null;
  }
}

export class EmailHandler {
  static async handle({
    type,
    target,
    targetId,
    metadata,
  }: {
    type: EventType;
    target: EventTarget;
    targetId: string | number;
    metadata: Record<string, unknown>;
  }) {

    if (target !== "talent") {
      return;
    }

    const adminClient =
      createAdminClient();

    const {
      data: talent,
      error: talentError,
    } = await adminClient
      .from("talents")
      .select("user_id, name_ar, name_en")
      .eq("id", targetId)
      .maybeSingle();

    if (
      talentError ||
      !talent?.user_id
    ) {
      console.error(
        "[EmailHandler talent]",
        talentError?.message ??
          "Talent user_id not found",
      );
      return;
    }

    const locale =
  getMetadataString(
    metadata,
    "locale",
  ) === "en"
    ? "en"
    : "ar";

const recipientName =
  locale === "en"
    ? talent.name_en ||
      talent.name_ar ||
      ""
    : talent.name_ar ||
      talent.name_en ||
      "";

const emailMetadata = {
  ...metadata,
  recipientName,
};

const content = buildEmail(
  type,
  emailMetadata,
);

if (!content) {
  return;
}

    const {
      data: preferences,
      error: preferencesError,
    } = await adminClient
      .from("notification_preferences")
      .select(
        "email_enabled, review_email_enabled",
      )
      .eq(
        "user_id",
        talent.user_id,
      )
      .maybeSingle();

    if (preferencesError) {
      console.error(
        "[EmailHandler preferences]",
        preferencesError.message,
      );
      return;
    }

    if (
      preferences &&
      (
        !preferences.email_enabled ||
        !preferences.review_email_enabled
      )
    ) {
      return;
    }

    const {
      data: authUser,
      error: authUserError,
    } =
      await adminClient.auth.admin.getUserById(
        talent.user_id,
      );

    const email =
      authUser.user?.email?.trim();

    if (
      authUserError ||
      !email
    ) {
      console.error(
        "[EmailHandler auth]",
        authUserError?.message ??
          "User email not found",
      );
      return;
    }

    const apiKey =
      process.env.RESEND_API_KEY;

    const from =
      process.env.RESEND_FROM_EMAIL;

    if (!apiKey || !from) {
      console.error(
        "[EmailHandler] Missing RESEND_API_KEY or RESEND_FROM_EMAIL",
      );
      return;
    }

    const response = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          from,
          to: [email],
          subject: content.subject,
          html: content.html,
        }),
      },
    );

    if (!response.ok) {
      console.error(
        "[EmailHandler Resend]",
        await response.text(),
      );
    }
  }
}