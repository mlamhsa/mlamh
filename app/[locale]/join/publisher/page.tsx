import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { PublisherQuickSetupForm } from "@/components/PublisherQuickSetupForm";
import {
  isValidLocale,
  type Locale,
} from "@/lib/i18n";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ locale: string }>;
};

type ProfileRow = {
  id: number;
  account_type: string | null;
  display_name: string | null;
  phone: string | null;
  onboarding_status: string | null;
  onboarding_step: string | null;
};

export default async function JoinPublisherPage({
  params,
}: PageProps) {
  const { locale: localeParam } = await params;

  if (!isValidLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const isRtl = locale === "ar";

  const authClient =
    await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    redirect(`/${locale}/join?type=publisher`);
  }

  // auth.getUser() above is the trusted identity check. Database lookups use
  // the server-only admin client, explicitly scoped to that verified user, so
  // PostgREST does not re-validate the session JWT and fail on transient clock skew.
  const adminClient = createAdminClient();
  const {
    data: profile,
    error: profileError,
  } = await adminClient
    .from("profiles")
    .select(
      "id, account_type, display_name, phone, onboarding_status, onboarding_step"
    )
    .eq("user_id", user.id)
    .maybeSingle<ProfileRow>();
  let hasPublisherRecord = false;

  if (profile?.account_type === "publisher") {
    const {
      data: publisherRecord,
      error: publisherRecordError,
    } = await adminClient
      .from("publishers")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (publisherRecordError) {
      console.error(
        "[JoinPublisherPage publisherLookup]",
        publisherRecordError
      );
    }

    hasPublisherRecord = Boolean(publisherRecord);
  }

  if (profileError) {
    console.error(
      "[JoinPublisherPage profileLookup]",
      profileError
    );
  }

  if (
    profile?.account_type === "publisher" &&
    profile.onboarding_status === "completed" &&
    hasPublisherRecord
  ) {
    redirect(`/${locale}/publisher-dashboard`);
  }

  if (profile?.account_type === "talent") {
    redirect(`/${locale}/talent-dashboard`);
  }

  const displayFont = isRtl
    ? "var(--font-noto-arabic)"
    : "var(--font-cormorant)";

  const bodyFont = isRtl
    ? "var(--font-noto-arabic)"
    : "var(--font-dm-sans)";

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="relative z-[2] bg-background pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-0"
    >
      <Navbar locale={locale} />

      <div className="relative overflow-hidden pb-20 pt-28 md:pb-28 md:pt-32">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-gold/[0.04] blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-10">
          <header
            className={`mb-10 sm:mb-14 md:mb-16 ${
              isRtl ? "text-right" : "text-left"
            }`}
          >
            <div
              className={`mb-6 flex items-center gap-4 ${
                isRtl ? "flex-row-reverse" : ""
              }`}
            >
              <span className="gold-line max-w-[80px] flex-1" />

              <p className="arabic-safe text-[10px] uppercase tracking-[0.4em] text-gold">
                {isRtl
                  ? "إعداد ملف الجهة"
                  : "Organization Setup"}
              </p>
            </div>

            <h1
              className="text-[clamp(2.5rem,8vw,4.5rem)] font-light leading-[1.05] text-white sm:leading-[0.95]"
              style={{
                fontFamily: displayFont,
              }}
            >
              {isRtl
                ? "إعداد حساب الناشر"
                : "Publisher Setup"}
            </h1>

            <p
              className="mt-6 max-w-2xl text-sm leading-7 text-gray-muted md:text-base"
              style={{
                fontFamily: bodyFont,
              }}
            >
              {isRtl
                ? "حدد الصفة الأقرب لك لإكمال إعداد حساب الناشر على ملامح."
                : "Choose the publisher path that best fits you to complete your MLAMH setup."}
            </p>
          </header>

          <PublisherQuickSetupForm
            locale={locale}
            initialName={profile?.display_name ?? ""}
            initialPhone={profile?.phone ?? ""}
          />
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent"
          aria-hidden="true"
        />
      </div>

      <Footer locale={locale} />
    </main>
  );
}
