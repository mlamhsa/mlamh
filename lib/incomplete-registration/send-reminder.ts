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
  const adminClient =
    createAdminClient();

  const {
    data: authUserData,
    error: authUserError,
  } =
    await adminClient.auth.admin.getUserById(
      userId,
    );

  if (
    authUserError ||
    !authUserData.user
  ) {
    console.error(
      "[IncompleteRegistrationReminder.authUser]",
      authUserError,
    );

    return {
      success: false,
      status: "user_not_found",
      message:
        locale === "ar"
          ? "تعذر العثور على المستخدم."
          : "Unable to find the user.",
    };
  }

  const user =
    authUserData.user;

  /*
   * أهم حماية:
   * نتحقق قبل كل إرسال مباشرة
   * أن المستخدم ما زال بدون Profile.
   */
  const {
    data: existingProfile,
    error: profileError,
  } = await adminClient
    .from("profiles")
    .select("id, account_type")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error(
      "[IncompleteRegistrationReminder.profile]",
      profileError,
    );

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

  const email =
    user.email?.trim();

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

  const metadata =
    user.user_metadata ?? {};

  const name =
    String(
      metadata.full_name ??
        metadata.name ??
        metadata.display_name ??
        "",
    ).trim();

  const apiKey =
    process.env.RESEND_API_KEY;

  const from =
    process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    console.error(
      "[IncompleteRegistrationReminder] Missing RESEND configuration",
    );

    return {
      success: false,
      status: "missing_email_config",
      message:
        locale === "ar"
          ? "إعدادات البريد غير مكتملة."
          : "Email configuration is incomplete.",
    };
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://mlamh.net";

  const continueUrl =
    `${baseUrl}/${locale}/join/account-type`;

  const greeting =
    name
      ? locale === "ar"
        ? `مرحبًا ${name}`
        : `Hello ${name}`
      : locale === "ar"
        ? "مرحبًا"
        : "Hello";

  const subject =
    locale === "ar"
      ? "هل واجهتك مشكلة في إكمال التسجيل في ملامح؟"
      : "Having trouble completing your MLAMH registration?";

  const html =
    locale === "ar"
      ? `
        <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8;color:#111">
          <h2>${greeting}</h2>

          <p>
            لاحظنا أنك بدأت التسجيل في ملامح،
            لكن لم يكتمل إنشاء حسابك بعد.
          </p>

          <p>
            إذا واجهتك أي مشكلة أثناء التسجيل،
            يسعدنا مساعدتك.
          </p>

          <p>
            يمكنك متابعة التسجيل واختيار نوع حسابك من الرابط التالي:
          </p>

          <p>
            <a
              href="${continueUrl}"
              style="display:inline-block;background:#c8a96a;color:#000;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600"
            >
              إكمال التسجيل
            </a>
          </p>

          <p style="color:#666;font-size:13px">
            إذا لم تعد ترغب في إنشاء حساب في ملامح،
            يمكنك تجاهل هذه الرسالة.
          </p>
        </div>
      `
      : `
        <div style="font-family:Arial,sans-serif;line-height:1.8;color:#111">
          <h2>${greeting}</h2>

          <p>
            We noticed that you started registering on MLAMH,
            but your account setup has not been completed yet.
          </p>

          <p>
            If you experienced any difficulty during registration,
            we're happy to help.
          </p>

          <p>
            You can continue your registration and choose your account type here:
          </p>

          <p>
            <a
              href="${continueUrl}"
              style="display:inline-block;background:#c8a96a;color:#000;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600"
            >
              Complete registration
            </a>
          </p>

          <p style="color:#666;font-size:13px">
            If you no longer wish to create an MLAMH account,
            you can ignore this email.
          </p>
        </div>
      `;

  const response =
    await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${apiKey}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          from,
          to: [email],
          subject,
          html,
        }),
      },
    );

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
    provider:
      user.app_metadata?.provider ??
      null,
    registrationCreatedAt:
      user.created_at ?? null,
  };
}