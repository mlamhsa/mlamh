import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ error?: string; success?: string }>;
};

function getText(isRtl: boolean) {
  return {
    eyebrow: isRtl ? "دخول الناشر" : "Publisher Login",
    title: isRtl ? "لوحة تحكم الناشر" : "Publisher Dashboard",
    subtitle: isRtl
      ? "سجّل الدخول بحساب الناشر لإدارة الفرص والمتقدمين وملف الشركة."
      : "Sign in with your publisher account to manage opportunities, applicants, and company profile.",
    email: isRtl ? "البريد الإلكتروني" : "Email",
    password: isRtl ? "كلمة المرور" : "Password",
    signIn: isRtl ? "تسجيل الدخول" : "Sign In",
    forgotPassword: isRtl ? "نسيت كلمة المرور؟" : "Forgot Password?",
    invalid: isRtl ? "بيانات الدخول غير صحيحة." : "Invalid login credentials.",
    missing: isRtl
      ? "يرجى إدخال البريد الإلكتروني وكلمة المرور."
      : "Please enter email and password.",
    noProfile: isRtl
      ? "لم يتم العثور على ملف حساب مرتبط بهذا المستخدم."
      : "No profile was found for this user.",
    notPublisher: isRtl
      ? "هذا الحساب ليس حساب ناشر."
      : "This account is not a publisher account.",
    resetMissing: isRtl
      ? "يرجى إدخال البريد الإلكتروني أولاً."
      : "Please enter your email first.",
    resetSent: isRtl
      ? "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك."
      : "Password reset link has been sent to your email.",
  };
}

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
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/${locale}/publisher-login`,
  });

  redirect(`/${locale}/publisher-login?success=reset_sent`);
}

export default async function PublisherLoginPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const query = searchParams ? await searchParams : {};
  const isRtl = locale === "ar";
  const text = getText(isRtl);

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

  const successMessage = query.success === "reset_sent" ? text.resetSent : "";

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className={`flex min-h-screen items-center justify-center bg-black px-6 text-white ${
        isRtl ? "text-right" : "text-left"
      }`}
    >
      <div className="w-full max-w-md">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.35em] text-gold">
            {text.eyebrow}
          </p>

          <h1 className="mt-4 text-4xl font-light">{text.title}</h1>

          <p className="mt-4 text-sm leading-7 text-white/45">
            {text.subtitle}
          </p>
        </div>

        <form
          action={publisherLoginAction}
          className="space-y-5 rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-8"
        >
          <input type="hidden" name="locale" value={locale} />

          {errorMessage ? (
            <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
              {successMessage}
            </div>
          ) : null}

          <div>
            <label className="mb-2 block text-sm text-white/50">
              {text.email}
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-4 text-white outline-none transition placeholder:text-white/25 focus:border-gold/50"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/50">
              {text.password}
            </label>
            <input
              type="password"
              name="password"
              required
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-4 text-white outline-none transition placeholder:text-white/25 focus:border-gold/50"
            />
          </div>

          <button
            type="submit"
            className="w-full border border-gold bg-gold/10 px-6 py-4 text-xs uppercase tracking-[0.22em] text-gold transition hover:bg-gold hover:text-black"
          >
            {text.signIn}
          </button>

          <button
            formAction={forgotPasswordAction}
            className="w-full text-center text-sm text-white/50 underline underline-offset-4 transition hover:text-gold"
          >
            {text.forgotPassword}
          </button>
        </form>
      </div>
    </main>
  );
}