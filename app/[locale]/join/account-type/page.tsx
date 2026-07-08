import Link from "next/link";
import { BriefcaseBusiness, Sparkles } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { notFound, redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ locale: string }>;
};

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
              {isRtl ? "كيف تريد استخدام ملامح؟" : "How will you use MLAMH?"}
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/45">
              {isRtl
                ? "اختر المسار المناسب لك حتى نجهز لك تجربة تسجيل بسيطة ومناسبة."
                : "Choose the path that fits you so we can prepare the right onboarding experience."}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Link
              href={`/${locale}/talent-dashboard/profile`}
              className="group rounded-[2rem] border border-white/10 bg-white/[0.035] p-8 transition hover:border-gold/40 hover:bg-gold/[0.05]"
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
                {isRtl ? "إكمال كموهبة" : "Continue as Talent"}
              </p>
            </Link>

            <Link
              href={`/${locale}/register-publisher`}
              className="group rounded-[2rem] border border-white/10 bg-white/[0.035] p-8 transition hover:border-gold/40 hover:bg-gold/[0.05]"
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
                {isRtl ? "إكمال كناشر" : "Continue as Publisher"}
              </p>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}