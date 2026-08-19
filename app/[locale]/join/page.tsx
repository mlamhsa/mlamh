import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Sparkles,
} from "lucide-react";
import {
  notFound,
  redirect,
} from "next/navigation";

import { QuickJoinForm } from "@/components/auth/QuickJoinForm";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import {
  getDictionary,
  isValidLocale,
  type Locale,
} from "@/lib/i18n";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type AccountType = "talent" | "publisher";

type JoinError =
  | "missing"
  | "invalid_name"
  | "invalid_phone"
  | "password_short"
  | "password_mismatch"
  | "terms"
  | "email_exists"
  | "rate_limit"
  | "signup"
  | "invalid_account_type";

type PageProps = {
  params: Promise<{
    locale: string;
  }>;

  searchParams?: Promise<{
    error?: string;
    type?: string;
  }>;
};

function isValidAccountType(
  value: string | undefined,
): value is AccountType {
  return (
    value === "talent" ||
    value === "publisher"
  );
}

function getJoinErrorMessage(
  error: string | undefined,
  isRtl: boolean,
) {
  if (error === "missing") {
    return isRtl
      ? "أكمل جميع الحقول المطلوبة."
      : "Please complete all required fields.";
  }

  if (error === "invalid_name") {
    return isRtl
      ? "أدخل اسمًا صحيحًا يتكون من حرفين على الأقل."
      : "Enter a valid name containing at least 2 characters.";
  }
  
  if (error === "invalid_phone") {
    return isRtl
      ? "أدخل رقم جوال صحيحًا مع مفتاح الدولة."
      : "Enter a valid mobile number including the country code.";
  }
  if (error === "password_short") {
    return isRtl
      ? "يجب أن تتكون كلمة المرور من ٨ أحرف على الأقل."
      : "Your password must contain at least 8 characters.";
  }

  if (error === "password_mismatch") {
    return isRtl
      ? "كلمتا المرور غير متطابقتين."
      : "The passwords do not match.";
  }

  if (error === "terms") {
    return isRtl
      ? "يجب الموافقة على الشروط وسياسة الخصوصية للمتابعة."
      : "You must accept the Terms and Privacy Policy to continue.";
  }

  if (error === "email_exists") {
    return isRtl
      ? "يوجد حساب مرتبط بهذا البريد الإلكتروني. جرّب تسجيل الدخول."
      : "An account already exists with this email. Try signing in.";
  }

  if (error === "rate_limit") {
    return isRtl
      ? "تم إجراء محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى."
      : "Too many attempts. Please wait a moment and try again.";
  }

  if (error === "invalid_account_type") {
    return isRtl
      ? "اختر نوع الحساب أولًا للمتابعة."
      : "Choose an account type first.";
  }

  if (error === "signup") {
    return isRtl
      ? "تعذر إنشاء الحساب حاليًا. تحقق من البيانات وحاول مرة أخرى."
      : "Could not create your account. Check your details and try again.";
  }

  return null;
}

function getSignupErrorCode(
  message: string | undefined,
): JoinError {
  const normalizedMessage = String(
    message ?? "",
  ).toLowerCase();

  if (
    normalizedMessage.includes(
      "already registered",
    ) ||
    normalizedMessage.includes(
      "already exists",
    ) ||
    normalizedMessage.includes(
      "user already",
    )
  ) {
    return "email_exists";
  }

  if (
    normalizedMessage.includes(
      "rate limit",
    ) ||
    normalizedMessage.includes(
      "too many requests",
    ) ||
    normalizedMessage.includes(
      "email rate",
    )
  ) {
    return "rate_limit";
  }

  return "signup";
}

function getOnboardingPath(
  locale: Locale,
  accountType: AccountType,
) {
  return accountType === "talent"
    ? `/${locale}/join/talent`
    : `/${locale}/join/publisher`;
}

function normalizePhoneNumber(
  value: string,
) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  const hasInternationalPrefix =
    trimmedValue.startsWith("+");

  const digits = trimmedValue.replace(
    /\D/g,
    "",
  );

  if (!digits) {
    return "";
  }

  return hasInternationalPrefix
    ? `+${digits}`
    : digits;
}

function isValidInternationalPhone(
  value: string,
) {
  return /^\+[1-9]\d{7,14}$/.test(value);
}

async function quickJoinAction(
  accountType: AccountType,
  formData: FormData,
) {
  "use server";

  const rawLocale = String(
    formData.get("locale") ?? "ar",
  );

  const locale: Locale =
    isValidLocale(rawLocale)
      ? rawLocale
      : "ar";

  if (!isValidAccountType(accountType)) {
    redirect(
      `/${locale}/join?error=invalid_account_type`,
    );
  }

  const selectedTypeQuery =
    `type=${accountType}`;

  const fullName = String(
    formData.get("fullName") ?? "",
  )
    .trim()
    .replace(/\s+/g, " ");

  const email = String(
    formData.get("email") ?? "",
  )
    .trim()
    .toLowerCase();

  const rawPhone = String(
    formData.get("phone") ?? "",
  );

  const phone =
    normalizePhoneNumber(rawPhone);

  const countryIso = String(
    formData.get("countryIso") ?? "",
  )
    .trim()
    .toUpperCase();

  const countryCode = String(
    formData.get("countryCode") ?? "",
  ).trim();

  const password = String(
    formData.get("password") ?? "",
  );

  const passwordConfirmation = String(
    formData.get(
      "passwordConfirmation",
    ) ?? "",
  );

  const acceptTerms =
    String(
      formData.get("acceptTerms") ?? "",
    ) === "accepted";

  if (
    !fullName ||
    !email ||
    !phone ||
    !password ||
    !passwordConfirmation
  ) {
    redirect(
      `/${locale}/join?${selectedTypeQuery}&error=missing`,
    );
  }

  if (
    fullName.length < 2 ||
    fullName.length > 100
  ) {
    redirect(
      `/${locale}/join?${selectedTypeQuery}&error=invalid_name`,
    );
  }

  if (!isValidInternationalPhone(phone)) {
    redirect(
      `/${locale}/join?${selectedTypeQuery}&error=invalid_phone`,
    );
  }

  if (password.length < 8) {
    redirect(
      `/${locale}/join?${selectedTypeQuery}&error=password_short`,
    );
  }

  if (
    password !== passwordConfirmation
  ) {
    redirect(
      `/${locale}/join?${selectedTypeQuery}&error=password_mismatch`,
    );
  }

  if (!acceptTerms) {
    redirect(
      `/${locale}/join?${selectedTypeQuery}&error=terms`,
    );
  }

  const authClient =
    await createServerSupabaseClient();

  const { data, error } =
    await authClient.auth.signUp({
      email,
      password,

      options: {
        data: {
          full_name: fullName,
          display_name: fullName,

          phone,
          phone_country_iso:
            countryIso || null,
          phone_country_code:
            countryCode || null,
          phone_verified: false,

          account_type: accountType,

          onboarding_status:
            "email_verification_required",

          onboarding_step:
            "email_verification",

          approval_status:
            "not_submitted",

          preferred_locale: locale,

          terms_accepted: true,
          terms_accepted_at:
            new Date().toISOString(),
        },
      },
    });

  if (error) {
    const errorCode =
      getSignupErrorCode(
        error.message,
      );

    redirect(
      `/${locale}/join?${selectedTypeQuery}&error=${errorCode}`,
    );
  }

  if (!data.user) {
    redirect(
      `/${locale}/join?${selectedTypeQuery}&error=signup`,
    );
  }
  const { error: profileError } = await authClient
  .from("profiles")
  .insert({
    user_id: data.user.id,
    account_type: accountType,
    display_name: fullName,
    phone,

    status: "active",

    onboarding_status: "account_created",
    onboarding_step:
      accountType === "talent"
        ? "talent_profile"
        : "publisher_profile",

    approval_status: "not_submitted",
  });

if (profileError) {
  console.error(
    "Failed to create user profile:",
    profileError,
  );

  redirect(
    `/${locale}/join?${selectedTypeQuery}&error=signup`,
  );
}
  /*
   * عند تفعيل توثيق البريد في Supabase،
   * لن تُنشأ جلسة مباشرة وسيتم إرسال المستخدم
   * إلى صفحة تسجيل الدخول مع رسالة التحقق.
   */
  if (!data.session) {
    redirect(
      `/${locale}/login?message=verify_email`,
    );
  }

  redirect(
    getOnboardingPath(
      locale,
      accountType,
    ),
  );
}


export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale: localeParam } =
    await params;

  if (!isValidLocale(localeParam)) {
    return {};
  }

  const dict = getDictionary(
    localeParam as Locale,
  );

  return {
    title: `${dict.join.metadataTitle} | MLAMH`,
    description:
      dict.join.metadataDescription,
  };
}

export default async function JoinPage({
  params,
  searchParams,
}: PageProps) {
  const { locale: localeParam } =
    await params;

  const resolvedSearchParams =
    searchParams
      ? await searchParams
      : {};

  if (!isValidLocale(localeParam)) {
    notFound();
  }

  const locale =
    localeParam as Locale;

  const isRtl = locale === "ar";

  const selectedAccountType =
    isValidAccountType(
      resolvedSearchParams.type,
    )
      ? resolvedSearchParams.type
      : null;

  const authClient =
    await createServerSupabaseClient();

  const {
    data: { user },
  } = await authClient.auth.getUser();

  /*
   * المستخدم المسجل مسبقًا:
   * نقرأ نوع الحساب المحفوظ في user_metadata
   * ونرسله مباشرة إلى مسار استكمال ملفه.
   */
  if (user) {
    const storedAccountType =
      user.user_metadata
        ?.account_type;

    if (
      isValidAccountType(
        storedAccountType,
      )
    ) {
      redirect(
        getOnboardingPath(
          locale,
          storedAccountType,
        ),
      );
    }

    /*
     * دعم الحسابات التجريبية القديمة
     * التي لم يُحفظ نوعها داخل metadata.
     */
    redirect(
      `/${locale}/join/account-type`,
    );
  }

  const errorMessage =
    getJoinErrorMessage(
      resolvedSearchParams.error,
      isRtl,
    );

  const boundQuickJoinAction =
    selectedAccountType
      ? quickJoinAction.bind(
          null,
          selectedAccountType,
        )
      : null;

  return (
    <main className="relative z-[2] bg-black pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-0">
      <Navbar locale={locale} />

      <section
        dir={isRtl ? "rtl" : "ltr"}
        className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-28 text-white sm:px-6 sm:py-32"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(200,169,106,0.16),transparent_45%)]" />

        <div className="relative w-full max-w-5xl">
          {selectedAccountType ? (
            <div className="mx-auto w-full max-w-md rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 shadow-2xl backdrop-blur-xl sm:rounded-[2rem] sm:p-7">
              <div className="mb-7 sm:mb-8">
                <Link
                  href={`/${locale}/join`}
                  className="mb-6 inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-xs text-white/55 transition hover:border-gold/40 hover:text-gold"
                >
                  <ArrowLeft
                    size={15}
                    className={
                      isRtl
                        ? "rotate-180"
                        : ""
                    }
                  />

                  {isRtl
                    ? "تغيير نوع الحساب"
                    : "Change account type"}
                </Link>

                <div className="text-center">
                  <div className="mb-6 flex items-center justify-center gap-2">
                    <span className="h-1.5 w-8 rounded-full bg-gold" />
                    <span className="h-1.5 w-8 rounded-full bg-gold" />
                    <span className="h-1.5 w-8 rounded-full bg-white/10" />
                  </div>

                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-gold/25 bg-gold/[0.08] text-gold">
                    {selectedAccountType ===
                    "talent" ? (
                      <Sparkles
                        size={21}
                      />
                    ) : (
                      <BriefcaseBusiness
                        size={21}
                      />
                    )}
                  </div>

                  <p className="arabic-safe mt-5 text-xs uppercase tracking-[0.3em] text-gold">
                    {selectedAccountType ===
                    "talent"
                      ? isRtl
                        ? "حساب موهبة"
                        : "Talent account"
                      : isRtl
                        ? "حساب ناشر"
                        : "Publisher account"}
                  </p>

                  <h1 className="mt-4 text-3xl font-light leading-tight sm:text-4xl">
                    {isRtl
                      ? "أنشئ حسابك"
                      : "Create your account"}
                  </h1>

                  <p className="mt-3 text-sm leading-7 text-white/45">
                    {selectedAccountType ===
                    "talent"
                      ? isRtl
                        ? "أنشئ حسابك الأساسي، ثم أكمل ملفك المهني واعرض أعمالك للجهات الناشرة."
                        : "Create your account, then complete your professional talent profile."
                      : isRtl
                        ? "أنشئ حسابك الأساسي، ثم أكمل ملف الجهة وابدأ إدارة فرصك."
                        : "Create your account, then complete your publisher profile and manage opportunities."}
                  </p>
                </div>
              </div>

              {errorMessage ? (
                <div
                  role="alert"
                  aria-live="polite"
                  className="mb-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-center text-sm leading-6 text-red-300"
                >
                  {errorMessage}
                </div>
              ) : null}

              {boundQuickJoinAction ? (
                <QuickJoinForm
                  locale={locale}
                  action={
                    boundQuickJoinAction
                  }
                />
              ) : null}

              <div className="mt-8 border-t border-white/10 pt-6 text-center text-sm text-white/45">
                {isRtl
                  ? "لديك حساب؟"
                  : "Already have an account?"}{" "}

                <Link
                  href={`/${locale}/login`}
                  className="text-gold transition hover:text-gold-soft"
                >
                  {isRtl
                    ? "تسجيل الدخول"
                    : "Sign in"}
                </Link>
              </div>
            </div>
          ) : (
            <AccountTypeSelection
              locale={locale}
              isRtl={isRtl}
            />
          )}
        </div>
      </section>

      <Footer locale={locale} />
    </main>
  );
}

function AccountTypeSelection({
  locale,
  isRtl,
}: {
  locale: Locale;
  isRtl: boolean;
}) {
  return (
    <div>
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-7 flex items-center justify-center gap-2">
          <span className="h-1.5 w-8 rounded-full bg-gold" />
          <span className="h-1.5 w-8 rounded-full bg-white/10" />
          <span className="h-1.5 w-8 rounded-full bg-white/10" />
        </div>

        <p className="arabic-safe text-xs uppercase tracking-[0.35em] text-gold">
          {isRtl
            ? "ابدأ مع ملامح"
            : "Get started with MLAMH"}
        </p>

        <h1 className="mt-5 text-4xl font-light leading-tight sm:text-5xl lg:text-6xl">
          {isRtl
            ? "كيف تريد استخدام ملامح؟"
            : "How will you use MLAMH?"}
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/45 sm:text-base">
          {isRtl
            ? "اختر المسار المناسب لك. يمكنك إنشاء حسابك خلال لحظات ثم استكمال ملفك."
            : "Choose the path that fits you. Create your account in moments, then complete your profile."}
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
        <AccountTypeCard
          href={`/${locale}/join?type=talent`}
          icon={<Sparkles size={24} />}
          title={
            isRtl
              ? "أنا موهبة"
              : "I am talent"
          }
          description={
            isRtl
              ? "أنشئ ملفك، اعرض صورك وأعمالك، وتقدم إلى الفرص المناسبة."
              : "Build your profile, showcase your work, and apply to suitable opportunities."
          }
          actionLabel={
            isRtl
              ? "التسجيل كموهبة"
              : "Continue as talent"
          }
        />

        <AccountTypeCard
          href={`/${locale}/join?type=publisher`}
          icon={
            <BriefcaseBusiness
              size={24}
            />
          }
          title={
            isRtl
              ? "أنا ناشر"
              : "I am a publisher"
          }
          description={
            isRtl
              ? "أنشئ ملف جهتك، انشر الفرص، واستقبل طلبات المواهب وأدرها."
              : "Create your company profile, publish opportunities, and manage talent applications."
          }
          actionLabel={
            isRtl
              ? "التسجيل كناشر"
              : "Continue as publisher"
          }
        />
      </div>

      <div className="mt-10 text-center text-sm text-white/40">
        {isRtl
          ? "لديك حساب بالفعل؟"
          : "Already have an account?"}{" "}

        <Link
          href={`/${locale}/login`}
          className="text-gold transition hover:text-gold-soft"
        >
          {isRtl
            ? "تسجيل الدخول"
            : "Sign in"}
        </Link>
      </div>
    </div>
  );
}

function AccountTypeCard({
  href,
  icon,
  title,
  description,
  actionLabel,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[270px] flex-col rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-6 transition duration-300 hover:-translate-y-1 hover:border-gold/45 hover:bg-gold/[0.045] sm:p-8"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/25 bg-gold/[0.08] text-gold transition group-hover:bg-gold group-hover:text-black">
        {icon}
      </div>

      <h2 className="mt-8 text-3xl font-light">
        {title}
      </h2>

      <p className="mt-4 max-w-sm text-sm leading-7 text-white/45">
        {description}
      </p>

      <div className="mt-auto flex items-center justify-between gap-4 pt-8 text-sm text-gold">
        <span>{actionLabel}</span>

        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/25 transition group-hover:bg-gold group-hover:text-black">
          <ArrowLeft
            size={17}
            className="rotate-180 rtl:rotate-0"
          />
        </span>
      </div>
    </Link>
  );
}