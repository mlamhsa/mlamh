import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Clapperboard,
  Megaphone,
  Sparkles,
  Store,
  UserRound,
  Video,
} from "lucide-react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { createEvent, EVENT_TARGETS, EVENT_TYPES } from "@/lib/events";
import { isValidLocale, type Locale } from "@/lib/i18n";
import {
  MARKETING_ATTRIBUTION_COOKIE,
  hasMarketingAttribution,
  parseMarketingAttributionCookie,
} from "@/lib/marketing/attribution/context";
import { trackMarketingEvent } from "@/lib/marketing/events/track";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ locale: string }>;
};

const publisherTypes = [
  { value: "individual", ar: "فرد / مستقل", en: "Individual / Freelancer", icon: UserRound },
  { value: "production_company", ar: "شركة إنتاج", en: "Production Company", icon: Video },
  { value: "advertising_agency", ar: "وكالة إعلانية", en: "Advertising Agency", icon: Megaphone },
  { value: "casting_agency", ar: "وكالة كاستينغ", en: "Casting Agency", icon: Clapperboard },
  { value: "talent_agency", ar: "وكالة مواهب", en: "Talent Agency", icon: BadgeCheck },
  { value: "brand", ar: "علامة تجارية", en: "Brand", icon: Sparkles },
  { value: "content_company", ar: "شركة محتوى", en: "Content Company", icon: Building2 },
  { value: "other", ar: "أخرى", en: "Other", icon: Store },
] as const;

type PublisherType = (typeof publisherTypes)[number]["value"];
const allowedPublisherTypes = new Set<PublisherType>(publisherTypes.map((type) => type.value));

async function recordAccountTypeSelection({ userId, profileId, accountType, locale, publisherType }: { userId: string; profileId: string | number; accountType: "talent" | "publisher"; locale: Locale; publisherType?: PublisherType }) {
  await createEvent({
    type: EVENT_TYPES.account_type_selected,
    target: EVENT_TARGETS.AUTH_USER,
    targetId: userId,
    actorId: userId,
    metadata: {
      profile_id: String(profileId),
      account_type: accountType,
      locale,
      ...(publisherType ? { publisher_type: publisherType } : {}),
      source: "join_account_type",
    },
  });
}

async function recordAttributedRegistration({
  userId,
  profileId,
  accountType,
  locale,
  publisherType,
}: {
  userId: string;
  profileId: string | number;
  accountType: "talent" | "publisher";
  locale: Locale;
  publisherType?: PublisherType;
}) {
  try {
    const cookieStore = await cookies();
    const attribution = parseMarketingAttributionCookie(
      cookieStore.get(MARKETING_ATTRIBUTION_COOKIE)?.value,
    );

    await trackMarketingEvent({
      eventName: "registration_completed",
      userId,
      source: attribution.source,
      medium: attribution.medium,
      campaign: attribution.campaign,
      content: attribution.content,
      term: attribution.term,
      entityType: "profile",
      entityId: String(profileId),
      metadata: {
        account_type: accountType,
        locale,
        attribution_present: hasMarketingAttribution(attribution),
        ...(publisherType ? { publisher_type: publisherType } : {}),
      },
    });
  } catch (error) {
    console.error("[selectAccountTypeAction.registrationAttribution]", error);
  }
}

async function selectAccountTypeAction(formData: FormData) {
  "use server";

  const locale: Locale = formData.get("locale") === "en" ? "en" : "ar";
  const accountType = String(formData.get("account_type") ?? "");

  if (accountType !== "talent" && accountType !== "publisher") {
    redirect(`/${locale}/join/account-type?error=invalid`);
  }

  if (
    accountType === "publisher" &&
    String(formData.get("publisher_intent_confirmed") ?? "") !== "yes"
  ) {
    redirect(`/${locale}/join/account-type?error=publisher_confirmation`);
  }

  const authClient = await createServerSupabaseClient();
  const adminClient = createAdminClient();
  const { data: { user }, error: userError } = await authClient.auth.getUser();

  if (userError || !user) {
    redirect(`/${locale}/join`);
  }

  const { data: existingProfile, error: profileLookupError } = await adminClient
    .from("profiles")
    .select("id,account_type,display_name,phone")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileLookupError) {
    console.error("[selectAccountTypeAction] Profile lookup error:", profileLookupError);
    redirect(`/${locale}/join/account-type?error=profile`);
  }

  if (existingProfile?.account_type === "admin") redirect("/admin");
  if (existingProfile?.account_type === "talent") redirect(`/${locale}/talent-dashboard`);

  if (existingProfile?.account_type === "publisher") {
    const { data: existingPublisher, error: publisherLookupError } = await adminClient
      .from("publishers")
      .select("id")
      .eq("profile_id", existingProfile.id)
      .maybeSingle();

    if (publisherLookupError) {
      console.error("[selectAccountTypeAction] Publisher lookup error:", publisherLookupError);
    }

    if (existingPublisher) redirect(`/${locale}/publisher-dashboard`);
  }

  let profileId = existingProfile?.id;

  if (existingProfile) {
    const { error: updateError } = await adminClient
      .from("profiles")
      .update({ account_type: accountType })
      .eq("id", existingProfile.id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("[selectAccountTypeAction] Profile update error:", updateError);
      redirect(`/${locale}/join/account-type?error=profile`);
    }
  } else {
    const { data: insertedProfile, error: insertError } = await adminClient
      .from("profiles")
      .insert({
        user_id: user.id,
        account_type: accountType,
        display_name:
          user.user_metadata?.display_name ??
          user.user_metadata?.name ??
          user.email ??
          null,
      })
      .select("id")
      .single();

    if (insertError || !insertedProfile) {
      console.error("[selectAccountTypeAction] Profile insert error:", insertError);
      redirect(`/${locale}/join/account-type?error=profile`);
    }

    profileId = insertedProfile.id;
  }

  if (!profileId) {
    redirect(`/${locale}/join/account-type?error=profile`);
  }

  if (accountType === "talent") {
    await recordAccountTypeSelection({ userId: user.id, profileId, accountType: "talent", locale });
    await recordAttributedRegistration({ userId: user.id, profileId, accountType: "talent", locale });
    redirect(`/${locale}/join/talent`);
  }

  const publisherType = String(formData.get("publisher_type") ?? "") as PublisherType;
  if (!allowedPublisherTypes.has(publisherType)) {
    redirect(`/${locale}/join/account-type?error=publisher_type`);
  }

  const contactName =
    existingProfile?.display_name?.trim() ||
    String(
      user.user_metadata?.display_name ??
      user.user_metadata?.name ??
      user.email ??
      "",
    ).trim() ||
    (locale === "ar" ? "مستخدم ملامح" : "MLAMH User");

  const { data: existingPublisher, error: existingPublisherError } = await adminClient
    .from("publishers")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (existingPublisherError) {
    console.error("[selectAccountTypeAction] Existing publisher lookup error:", existingPublisherError);
    redirect(`/${locale}/join/account-type?error=publisher`);
  }

  if (!existingPublisher) {
    const { error: publisherInsertError } = await adminClient
      .from("publishers")
      .insert({
        profile_id: profileId,
        publisher_type: publisherType,
        contact_name: contactName,
      });

    if (publisherInsertError) {
      console.error("[selectAccountTypeAction] Publisher insert error:", publisherInsertError);
      redirect(`/${locale}/join/account-type?error=publisher`);
    }
  }

  await recordAccountTypeSelection({ userId: user.id, profileId, accountType: "publisher", locale, publisherType });
  await recordAttributedRegistration({ userId: user.id, profileId, accountType: "publisher", locale, publisherType });
  redirect(`/${locale}/publisher-dashboard`);
}

export default async function AccountTypePage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  if (!isValidLocale(localeParam)) notFound();

  const locale = localeParam as Locale;
  const isRtl = locale === "ar";
  const authClient = await createServerSupabaseClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) redirect(`/${locale}/join`);

  const adminClient = createAdminClient();
  const { data: currentProfile, error: currentProfileError } = await adminClient
    .from("profiles")
    .select("id,account_type")
    .eq("user_id", user.id)
    .maybeSingle();

  if (currentProfileError) {
    console.error("[AccountTypePage profile lookup]", currentProfileError);
  }

  if (currentProfile?.account_type === "admin") redirect("/admin");
  if (currentProfile?.account_type === "talent") redirect(`/${locale}/talent-dashboard`);

  if (currentProfile?.account_type === "publisher") {
    const { data: currentPublisher } = await adminClient
      .from("publishers")
      .select("id")
      .eq("profile_id", currentProfile.id)
      .maybeSingle();

    if (currentPublisher) redirect(`/${locale}/publisher-dashboard`);
  }

  return (
    <main className="min-h-screen bg-[#101010] px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <p className="text-xs uppercase tracking-[0.22em] text-gold/70">MLAMH</p>
          <h1 className="mt-3 text-3xl font-light sm:text-4xl">
            {isRtl ? "كيف تريد استخدام ملامح؟" : "How do you want to use MLAMH?"}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/45">
            {isRtl
              ? "اختر المسار الذي يطابق هدفك. يمكنك التقديم على الفرص كموهبة، أو نشر الفرص والبحث عن المواهب كناشر."
              : "Choose the path that matches your goal. Apply to opportunities as Talent, or publish opportunities and find talent as a Publisher."}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <form action={selectAccountTypeAction} className="rounded-[2rem] border border-gold/20 bg-gold/[0.04] p-8">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="account_type" value="talent" />

            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-gold/25 bg-gold/[0.06] text-gold">
              <UserRound size={24} />
            </div>
            <p className="mb-3 text-xs uppercase tracking-[0.18em] text-gold/60">
              {isRtl ? "للممثلين والمودلز" : "For actors and models"}
            </p>
            <h2 className="text-3xl font-light text-white">
              {isRtl ? "أنا موهبة وأريد التقديم على الفرص" : "I am Talent and want to apply"}
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/45">
              {isRtl
                ? "أنشئ ملف موهبة مهنيًا، أرسله للمراجعة، وبعد الاعتماد يمكنك التقديم على الفرص المناسبة."
                : "Create your professional talent profile, submit it for review, and once approved you can apply to suitable opportunities."}
            </p>
            <button
              type="submit"
              className="mt-8 w-full rounded-2xl bg-gold px-5 py-4 text-sm font-medium text-black transition hover:bg-gold-soft"
            >
              {isRtl ? "متابعة كموهبة" : "Continue as Talent"}
            </button>
          </form>

          <form action={selectAccountTypeAction} className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-8">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="account_type" value="publisher" />

            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/70">
              <BriefcaseBusiness size={24} />
            </div>
            <p className="mb-3 text-xs uppercase tracking-[0.18em] text-white/40">
              {isRtl ? "للجهات وأصحاب المشاريع" : "For organizations and project owners"}
            </p>
            <h2 className="text-3xl font-light text-white">
              {isRtl ? "أريد نشر فرص والبحث عن مواهب" : "I want to publish opportunities"}
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/45">
              {isRtl
                ? "هذا المسار مخصص لمن لديه مشروع أو تصوير أو حملة ويريد نشر فرصة واستقبال طلبات المواهب. إذا كنت تريد التقدم للفرص، اختر «أنا موهبة» بدلًا من ذلك."
                : "This path is for people or organizations with a project, production or campaign who want to publish an opportunity and receive talent applications. If you want to apply to opportunities, choose Talent instead."}
            </p>

            <p className="mt-7 text-xs uppercase tracking-[0.2em] text-gold">
              {isRtl ? "1. اختر صفتك كناشر" : "1. Select publisher type"}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {publisherTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <label
                    key={type.value}
                    className="flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-start transition has-[:checked]:border-gold/50 has-[:checked]:bg-gold/[0.08] hover:border-gold/30"
                  >
                    <input type="radio" name="publisher_type" value={type.value} required className="sr-only" />
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gold/20 bg-gold/[0.05] text-gold">
                      <Icon size={17} />
                    </span>
                    <span className="text-sm text-white/75">{isRtl ? type.ar : type.en}</span>
                  </label>
                );
              })}
            </div>

            <div className="mt-7 rounded-2xl border border-amber-300/15 bg-amber-300/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-amber-100/60">
                {isRtl ? "2. تأكيد قبل إنشاء حساب الناشر" : "2. Confirm before creating a publisher account"}
              </p>
              <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm leading-6 text-white/65">
                <input
                  type="checkbox"
                  name="publisher_intent_confirmed"
                  value="yes"
                  required
                  className="mt-1 h-4 w-4 shrink-0 accent-[#D4A017]"
                />
                <span>
                  {isRtl
                    ? "أؤكد أنني أريد نشر فرص أو البحث عن مواهب لمشروع، ولست هنا للتقديم على فرص كممثل أو مودل."
                    : "I confirm that I want to publish opportunities or find talent for a project, and I am not here to apply to opportunities as an actor or model."}
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="mt-6 w-full rounded-2xl border border-gold/35 bg-gold/[0.1] px-5 py-4 text-sm font-medium text-gold transition hover:border-gold/60 hover:bg-gold/[0.14]"
            >
              {isRtl ? "تأكيد وإنشاء حساب ناشر" : "Confirm and create Publisher account"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
