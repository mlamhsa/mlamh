import { BriefcaseBusiness, Sparkles } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { notFound, redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ locale: string }>;
};

async function selectAccountTypeAction(formData: FormData) {
  "use server";

  const localeValue = String(formData.get("locale") ?? "ar");
  const locale: Locale = localeValue === "en" ? "en" : "ar";

  const accountType = String(formData.get("account_type") ?? "");

  if (accountType !== "talent" && accountType !== "publisher") {
    redirect(`/${locale}/join/account-type?error=invalid`);
  }

  const authClient = await createServerSupabaseClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    redirect(`/${locale}/join`);
  }

  /*
   * إنشاء أو تحديث سجل profiles المرتبط بالمستخدم.
   * لا ننشئ Talent أو Publisher فارغًا هنا؛
   * كل نوع لديه صفحة تسجيل تجمع الحقول المطلوبة.
   */
  const { data: existingProfile, error: profileLookupError } =
    await adminClient
      .from("profiles")
      .select("id, account_type")
      .eq("user_id", user.id)
      .maybeSingle();

  if (profileLookupError) {
    console.error(
      "[selectAccountTypeAction] Profile lookup error:",
      profileLookupError
    );

    redirect(`/${locale}/join/account-type?error=profile`);
  }

  if (existingProfile) {
    if (existingProfile.account_type === "admin") {
      redirect("/admin");
    }
    
    if (existingProfile.account_type === "publisher") {
      redirect("/publisher-dashboard");
    }
    
    if (existingProfile.account_type === "talent") {
      redirect(`/${locale}/talent-dashboard`);
    }
    
    const { error: updateError } = await adminClient
      .from("profiles")
      .update({
        account_type: accountType,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingProfile.id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error(
        "[selectAccountTypeAction] Profile update error:",
        updateError
      );

      redirect(`/${locale}/join/account-type?error=profile`);
    }
  } else {
    const { error: insertError } = await adminClient
      .from("profiles")
      .insert({
        user_id: user.id,
        account_type: accountType,
      });

    if (insertError) {
      console.error(
        "[selectAccountTypeAction] Profile insert error:",
        insertError
      );

      redirect(`/${locale}/join/account-type?error=profile`);
    }
  }

  if (accountType === "publisher") {
    redirect(`/${locale}/register-publisher`);
  }

  /*
   * مهم:
   * لا نرسله إلى talent-dashboard/profile لأنها صفحة تعديل
   * وتتوقع وجود سجل talents مسبقًا.
   *
   * هذا المسار يجب أن يكون صفحة إنشاء ملف الموهبة.
   */
  redirect(`/${locale}/join/talent`);
}

export default async function AccountTypePage({ params }: PageProps) {
  const { locale: localeParam } = await params;

  if (!isValidLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const isRtl = locale === "ar";

  const authClient = await createServerSupabaseClient();

  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    redirect(`/${locale}/join`);
  }

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-black px-6 py-20 text-white"
    >
      <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-5xl items-center justify-center">
        <div className="w-full">
          <div className="mb-12 text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-gold">
              {isRtl ? "اختر نوع الحساب" : "Choose Account Type"}
            </p>

            <h1 className="mt-4 text-4xl font-light md:text-6xl">
              {isRtl
                ? "كيف تريد استخدام ملامح؟"
                : "How will you use MLAMH?"}
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/45">
              {isRtl
                ? "اختر المسار المناسب لك حتى نجهز لك تجربة تسجيل بسيطة ومناسبة."
                : "Choose the path that fits you so we can prepare the right onboarding experience."}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <form action={selectAccountTypeAction}>
              <input type="hidden" name="locale" value={locale} />
              <input
                type="hidden"
                name="account_type"
                value="talent"
              />

              <button
                type="submit"
                className="group h-full w-full rounded-[2rem] border border-white/10 bg-white/[0.035] p-8 text-start transition hover:border-gold/40 hover:bg-gold/[0.05]"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-gold/20 bg-gold/[0.06] text-gold">
                  <Sparkles size={24} />
                </div>

                <h2 className="text-3xl font-light text-white">
                  {isRtl ? "أنا موهبة" : "I am Talent"}
                </h2>

                <p className="mt-4 text-sm leading-7 text-white/45">
                  {isRtl
                    ? "أنشئ ملفك، اعرض صورك وأعمالك، وتقدم على الفرص المناسبة."
                    : "Create your profile, showcase your work, and apply to the right opportunities."}
                </p>

                <p className="mt-8 text-xs uppercase tracking-[0.22em] text-gold">
                  {isRtl
                    ? "إكمال كموهبة"
                    : "Continue as Talent"}
                </p>
              </button>
            </form>

            <form action={selectAccountTypeAction}>
              <input type="hidden" name="locale" value={locale} />
              <input
                type="hidden"
                name="account_type"
                value="publisher"
              />

              <button
                type="submit"
                className="group h-full w-full rounded-[2rem] border border-white/10 bg-white/[0.035] p-8 text-start transition hover:border-gold/40 hover:bg-gold/[0.05]"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-gold/20 bg-gold/[0.06] text-gold">
                  <BriefcaseBusiness size={24} />
                </div>

                <h2 className="text-3xl font-light text-white">
                  {isRtl ? "أنا ناشر" : "I am Publisher"}
                </h2>

                <p className="mt-4 text-sm leading-7 text-white/45">
                  {isRtl
                    ? "أنشئ ملف شركتك، انشر الفرص، واستقبل طلبات المواهب."
                    : "Create your company profile, publish opportunities, and receive talent applications."}
                </p>

                <p className="mt-8 text-xs uppercase tracking-[0.22em] text-gold">
                  {isRtl
                    ? "إكمال كناشر"
                    : "Continue as Publisher"}
                </p>
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}