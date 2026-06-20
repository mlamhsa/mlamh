import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ error?: string; success?: string; mode?: string }>;
};

/* =========================
   TEXTS (IMPROVED UX COPY)
========================= */

function getText(isRtl: boolean) {
  return {
    eyebrow: isRtl ? "تسجيل الدخول" : "Access Portal",

    title: isRtl
      ? "إدارة الفرص والمواهب"
      : "Manage Opportunities & Talent",

    subtitle: isRtl
      ? "سجّل الدخول أو أنشئ حسابًا لبدء إدارة المواهب والفرص داخل المنصة."
      : "Sign in or create an account to manage talents and opportunities.",

    createTitle: isRtl ? "إنشاء حساب ناشر" : "Create Publisher Account",
    createSubtitle: isRtl
      ? "أنشئ حساب شركة أو وكالة لنشر الفرص واستقبال المواهب."
      : "Create a company or agency account to post opportunities and receive talent.",

    createButton: isRtl ? "إنشاء حساب" : "Create Account",

    loginTitle: isRtl ? "تسجيل الدخول" : "Sign In",

    email: isRtl ? "البريد الإلكتروني" : "Email",
    password: isRtl ? "كلمة المرور" : "Password",

    signIn: isRtl ? "دخول" : "Sign In",

    switchToLogin: isRtl ? "تسجيل الدخول" : "Login",
    switchToRegister: isRtl ? "إنشاء حساب" : "Register",

    forgotPassword: isRtl ? "نسيت كلمة المرور؟" : "Forgot Password?",

    invalid: isRtl ? "بيانات غير صحيحة" : "Invalid credentials",
    missing: isRtl ? "الرجاء إدخال البيانات" : "Please fill all fields",
    noProfile: isRtl
      ? "لا يوجد ملف مرتبط"
      : "No profile found",
    notPublisher: isRtl
      ? "الحساب ليس ناشر"
      : "Not a publisher account",

    resetMissing: isRtl
      ? "أدخل البريد أولاً"
      : "Enter email first",
    resetSent: isRtl
      ? "تم إرسال رابط إعادة التعيين"
      : "Reset link sent",
  };
}

/* =========================
   SERVER ACTIONS (UNCHANGED)
========================= */

async function publisherLoginAction(formData: FormData) {
  "use server";

  const locale = String(formData.get("locale") ?? "ar");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(`/${locale}/publisher-login?error=missing`);
  }

  const authClient = await createServerSupabaseClient();
  const adminClient = createAdminClient();

  const { data, error } = await authClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    redirect(`/${locale}/publisher-login?error=invalid`);
  }

  const { data: profile } = await adminClient
    .from("profiles")
    .select("id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!profile) {
    await authClient.auth.signOut();
    redirect(`/${locale}/publisher-login?error=no_profile`);
  }

  const { data: publisher } = await adminClient
    .from("publishers")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!publisher) {
    await authClient.auth.signOut();
    redirect(`/${locale}/publisher-login?error=not_publisher`);
  }

  redirect(`/${locale}/publisher-dashboard`);
}

async function forgotPasswordAction(formData: FormData) {
  "use server";

  const locale = String(formData.get("locale") ?? "ar");
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirect(`/${locale}/publisher-login?error=reset_missing`);
  }

  const authClient = await createServerSupabaseClient();

  await authClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
    }/${locale}/publisher-login`,
  });

  redirect(`/${locale}/publisher-login?success=reset_sent`);
}

/* =========================
   PAGE
========================= */

export default async function PublisherLoginPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const query = (await searchParams) ?? {};

  const isRtl = locale === "ar";
  const text = getText(isRtl);

  const mode = (query.mode as string) ?? "login";
  const isLogin = mode !== "register";
  const isRegister = mode === "register";

  const errorMessage =
    query.error === "missing"
      ? text.missing
      : query.error === "invalid"
      ? text.invalid
      : query.error === "no_profile"
      ? text.noProfile
      : query.error === "not_publisher"
      ? text.notPublisher
      : query.error === "reset_missing"
      ? text.resetMissing
      : "";

  const successMessage =
    query.success === "reset_sent" ? text.resetSent : "";

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="flex min-h-screen items-center justify-center bg-black px-6 py-28 text-white"
    >
      <div className="w-full max-w-6xl">

        {/* HEADER */}
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-gold">
            {text.eyebrow}
          </p>

          <h1 className="mt-4 text-4xl font-light md:text-6xl">
            {text.title}
          </h1>

          <p className="mt-4 text-sm text-white/50">
            {text.subtitle}
          </p>
        </div>

        {/* SWITCH */}
        <div className="mx-auto mb-8 flex max-w-md gap-2 rounded-xl border border-white/10 p-1">
          <Link
            href={`/${locale}/publisher-login?mode=login`}
            className={`flex-1 rounded-lg py-2 text-center text-sm ${
              isLogin ? "bg-gold text-black" : "text-white/60"
            }`}
          >
            {text.switchToLogin}
          </Link>

          <Link
            href={`/${locale}/publisher-login?mode=register`}
            className={`flex-1 rounded-lg py-2 text-center text-sm ${
              isRegister ? "bg-gold text-black" : "text-white/60"
            }`}
          >
            {text.switchToRegister}
          </Link>
        </div>

        {/* CONTENT */}
        <div className="mx-auto max-w-md">

          {/* LOGIN */}
          {isLogin && (
            <form
              action={publisherLoginAction}
              className="space-y-5 rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-8"
            >
              <input type="hidden" name="locale" value={locale} />

              <h2 className="text-2xl font-light">
                {text.loginTitle}
              </h2>

              {errorMessage && (
                <div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="rounded-xl bg-green-500/10 p-3 text-sm text-green-300">
                  {successMessage}
                </div>
              )}

              <input
                name="email"
                type="email"
                placeholder={text.email}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-4"
              />

              <input
                name="password"
                type="password"
                placeholder={text.password}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-4"
              />

              <button className="w-full rounded-xl border border-gold bg-gold/10 py-4 text-gold">
                {text.signIn}
              </button>
            </form>
          )}

          {/* REGISTER */}
          {isRegister && (
            <div className="space-y-5 rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-8">
              <h2 className="text-2xl font-light">
                {text.createTitle}
              </h2>

              <p className="text-sm text-white/50">
                {text.createSubtitle}
              </p>

              <Link
                href={`/${locale}/register-publisher`}
                className="block w-full rounded-xl border border-gold py-4 text-center text-gold"
              >
                {text.createButton}
              </Link>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}