import { createAdminClient } from "@/lib/supabase/admin";

type ReminderLocale = "ar" | "en";

type SendIncompleteRegistrationReminderInput = {
  userId: string;
  locale?: ReminderLocale;
};

type SendIncompleteRegistrationReminderResult =
  | {
      success: true;
      status: "sent";
      email: string;
      provider: string | null;
      registrationCreatedAt: string | null;
    }
  | {
      success: false;
      status:
        | "user_not_found"
        | "registration_completed"
        | "missing_email"
        | "missing_email_config"
        | "profile_check_failed"
        | "send_failed";
      message: string;
    };

export async function sendIncompleteRegistrationReminder({
  userId,
  locale = "ar",
}: SendIncompleteRegistrationReminderInput): Promise<SendIncompleteRegistrationReminderResult> {
  const adminClient = createAdminClient();

  const { data: authUserData, error: authUserError } =
    await adminClient.auth.admin.getUserById(userId);

  if (authUserError || !authUserData.user) {
    console.error("[IncompleteRegistrationReminder.authUser]", authUserError);

    return {
      success: false,
      status: "user_not_found",
      message:
        locale === "ar"
          ? "تعذر العثور على المستخدم."
          : "Unable to find the user.",
    };
  }

  const user = authUserData.user;

  /*
   * أهم حماية:
   * نتحقق قبل كل إرسال مباشرة
   * أن المستخدم ما زال بدون Profile.
   */
  const { data: existingProfile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, account_type")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[IncompleteRegistrationReminder.profile]", profileError);

    return {
      success: false,
      status: "profile_check_failed",
      message:
        locale === "ar"
          ? "تعذر التحقق من حالة التسجيل."
          : "Unable to verify registration status.",
    };
  }

  if (existingProfile) {
    return {
      success: false,
      status: "registration_completed",
      message:
        locale === "ar"
          ? "هذا المستخدم أكمل التسجيل بالفعل."
          : "This user has already completed registration.",
    };
  }

  const email = user.email?.trim();

  if (!email) {
    return {
      success: false,
      status: "missing_email",
      message:
        locale === "ar"
          ? "لا يوجد بريد إلكتروني لهذا المستخدم."
          : "This user does not have an email address.",
    };
  }

  const metadata = user.user_metadata ?? {};
  const name = String(
    metadata.full_name ?? metadata.name ?? metadata.display_name ?? "",
  ).trim();

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    console.error("[IncompleteRegistrationReminder] Missing RESEND configuration");

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
  const continueUrl = `${baseUrl}/${locale}/join/account-type`;
  const replyTo = process.env.RESEND_REPLY_TO_EMAIL ?? "hello@mlamh.net";

  const greeting = name
    ? locale === "ar"
      ? `مرحبًا ${name}`
      : `Hello ${name}`
    : locale === "ar"
      ? "مرحبًا"
      : "Hello";

  const subject =
    locale === "ar"
      ? "أكمل إنشاء حسابك في ملامح"
      : "Complete your MLAMH account setup";

  const text =
    locale === "ar"
      ? `${greeting}\n\nبدأت إنشاء حساب في ملامح، لكن التسجيل لم يكتمل بعد.\n\nيمكنك إكمال إنشاء حسابك واختيار نوع الحساب من هنا:\n${continueUrl}\n\nإذا واجهتك مشكلة أثناء التسجيل، يمكنك الرد مباشرة على هذه الرسالة وسنساعدك.\n\nإذا لم تكن أنت من بدأ التسجيل أو لم تعد ترغب في إكماله، يمكنك تجاهل هذه الرسالة.\n\nMLAMH | ملامح\nhttps://mlamh.net`
      : `${greeting}\n\nYou started creating an account on MLAMH, but the registration is not complete yet.\n\nContinue your account setup and choose your account type here:\n${continueUrl}\n\nIf you need help with registration, reply directly to this email and we'll help you.\n\nIf you did not start this registration or no longer wish to complete it, you can ignore this email.\n\nMLAMH\nhttps://mlamh.net`;

  const html =
    locale === "ar"
      ? `
        <div dir="rtl" style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;line-height:1.8;color:#2E2E2E">
          <p style="font-size:18px;font-weight:700">${greeting}</p>
          <p>بدأت إنشاء حساب في ملامح، لكن التسجيل لم يكتمل بعد.</p>
          <p>يمكنك إكمال إنشاء حسابك واختيار نوع الحساب من الزر التالي:</p>
          <p style="margin:24px 0">
            <a href="${continueUrl}" style="display:inline-block;background:#D4A017;color:#2E2E2E;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:700">إكمال إنشاء الحساب</a>
          </p>
          <p>إذا واجهتك مشكلة أثناء التسجيل، يمكنك الرد مباشرة على هذه الرسالة وسنساعدك.</p>
          <p style="color:#666;font-size:13px">إذا لم تكن أنت من بدأ التسجيل أو لم تعد ترغب في إكماله، يمكنك تجاهل هذه الرسالة.</p>
          <hr style="border:0;border-top:1px solid #e5e5e5;margin:24px 0" />
          <p style="color:#666;font-size:12px;margin:0">MLAMH | ملامح — منصة المواهب والفرص</p>
          <p style="font-size:12px;margin:4px 0 0"><a href="https://mlamh.net" style="color:#666">mlamh.net</a></p>
        </div>
      `
      : `
        <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;line-height:1.8;color:#2E2E2E">
          <p style="font-size:18px;font-weight:700">${greeting}</p>
          <p>You started creating an account on MLAMH, but the registration is not complete yet.</p>
          <p>Continue your account setup and choose your account type using the button below:</p>
          <p style="margin:24px 0">
            <a href="${continueUrl}" style="display:inline-block;background:#D4A017;color:#2E2E2E;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:700">Complete account setup</a>
          </p>
          <p>If you need help with registration, reply directly to this email and we'll help you.</p>
          <p style="color:#666;font-size:13px">If you did not start this registration or no longer wish to complete it, you can ignore this email.</p>
          <hr style="border:0;border-top:1px solid #e5e5e5;margin:24px 0" />
          <p style="color:#666;font-size:12px;margin:0">MLAMH — Talent & Opportunities Platform</p>
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
      "[IncompleteRegistrationReminder.resend]",
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
    status: "sent",
    email,
    provider: user.app_metadata?.provider ?? null,
    registrationCreatedAt: user.created_at ?? null,
  };
}
