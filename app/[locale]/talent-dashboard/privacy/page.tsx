import { redirect } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, UsersRound } from "lucide-react";

import { isValidLocale, type Locale } from "@/lib/i18n";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getTalentPrivacySettings,
  updateTalentPrivacySettings,
  type TalentVisibility,
} from "@/lib/talents/privacy";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ onboarding?: string }>;
};

const OPTIONS: Array<{
  value: TalentVisibility;
  Icon: typeof Eye;
  ar: string;
  en: string;
  bodyAr: string;
  bodyEn: string;
  recommended?: boolean;
}> = [
  {
    value: "verified_publishers",
    Icon: UsersRound,
    ar: "للناشرين الموثقين فقط",
    en: "Verified publishers only",
    bodyAr: "لا تظهر صورك للعامة، وتكون متاحة للجهات الموثقة داخل ملامح.",
    bodyEn: "Your photos stay off public pages and are available to verified organizations inside MLAMH.",
    recommended: true,
  },
  {
    value: "private",
    Icon: EyeOff,
    ar: "ملف خاص",
    en: "Private profile",
    bodyAr: "لا يظهر ملفك في الدليل العام، وتتم المشاركة حسب إعداداتك وتفاعلك مع الفرص.",
    bodyEn: "Your profile stays out of the public directory and is shared according to your settings and opportunity activity.",
  },
  {
    value: "public",
    Icon: Eye,
    ar: "عام",
    en: "Public",
    bodyAr: "يمكن أن يظهر ملفك وصورك في دليل المواهب والبحث العام.",
    bodyEn: "Your profile and photos may appear in the talent directory and public search.",
  },
];

export default async function TalentPrivacyPage({ params, searchParams }: PageProps) {
  const { locale: localeParam } = await params;
  const query = searchParams ? await searchParams : {};
  if (!isValidLocale(localeParam)) redirect("/ar");

  const locale = localeParam as Locale;
  const isArabic = locale === "ar";
  const isOnboarding = query.onboarding === "1";
  const auth = await createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/talent-dashboard/privacy`);

  const { data: talent } = await auth
    .from("talents")
    .select("gender")
    .eq("user_id", user.id)
    .maybeSingle<{ gender: string | null }>();
  if (!talent) redirect(`/${locale}/join/talent`);

  const privacy = await getTalentPrivacySettings(user.id);
  const current = privacy.ok ? privacy.item.profileVisibility : "verified_publishers";
  const female = talent.gender === "female";

  async function savePrivacy(formData: FormData) {
    "use server";
    const auth = await createServerSupabaseClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) redirect(`/${locale}/login?next=/${locale}/talent-dashboard/privacy`);

    const raw = formData.get("visibility");
    const visibility: TalentVisibility = raw === "public" || raw === "private" ? raw : "verified_publishers";
    const result = await updateTalentPrivacySettings(user.id, {
      profileVisibility: visibility,
      photoVisibility: visibility,
      allowSearchIndexing: visibility === "public",
      allowMlamhShare: true,
      requirePrivateShareApproval: visibility === "private",
    }, "web");

    if (!result.ok) {
      redirect(`/${locale}/talent-dashboard/privacy?error=save`);
    }
    redirect(`/${locale}/talent-dashboard/profile`);
  }

  return (
    <main dir={isArabic ? "rtl" : "ltr"} className="min-h-screen bg-background px-4 py-10 text-white sm:px-6">
      <div className="mx-auto w-full max-w-2xl">
        {isOnboarding ? (
          <div className="mb-6 flex items-center gap-2 text-xs font-medium text-gold">
            <ShieldCheck className="h-4 w-4" />
            <span>{isArabic ? "خطوة الخصوصية قبل الصور" : "Privacy step before photos"}</span>
          </div>
        ) : null}

        <header className={isArabic ? "text-right" : "text-left"}>
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-gold/35 bg-gold/[0.08]">
            <ShieldCheck className="h-7 w-7 text-gold" />
          </div>
          <p className="text-xs font-semibold text-gold">{isArabic ? "خصوصيتك أولًا" : "PRIVACY FIRST"}</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
            {female && isArabic ? "أنتِ تتحكمين في ظهور ملفك" : isArabic ? "تحكم في ظهور ملفك" : "You control who sees your profile"}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-gray-muted">
            {isArabic
              ? "يمكن رفع الصور واستكمال جاهزية الملف بدون جعلها متاحة للعامة. اختر مستوى الظهور المناسب قبل المتابعة."
              : "You can upload photos and complete profile readiness without making them public. Choose the visibility level that fits you before continuing."}
          </p>
        </header>

        <form action={savePrivacy} className="mt-8 space-y-3">
          {OPTIONS.map(({ value, Icon, ar, en, bodyAr, bodyEn, recommended }) => (
            <label key={value} className="block cursor-pointer rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-gold/35 has-[:checked]:border-gold has-[:checked]:bg-gold/[0.06]">
              <div className={`flex items-start gap-4 ${isArabic ? "flex-row-reverse text-right" : ""}`}>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.05]">
                  <Icon className="h-5 w-5 text-gold" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`flex flex-wrap items-center gap-2 ${isArabic ? "justify-end" : ""}`}>
                    <span className="font-semibold">{isArabic ? ar : en}</span>
                    {recommended ? <span className="rounded-full border border-gold/35 px-2 py-0.5 text-[10px] font-semibold text-gold">{isArabic ? "موصى به" : "Recommended"}</span> : null}
                  </div>
                  <p className="mt-1 text-xs leading-6 text-gray-muted">{isArabic ? bodyAr : bodyEn}</p>
                </div>
                <input type="radio" name="visibility" value={value} defaultChecked={current === value} className="mt-2 h-4 w-4 accent-[#C9A962]" />
              </div>
            </label>
          ))}

          <div className="mt-5 rounded-2xl border border-gold/20 bg-gold/[0.04] p-4 text-xs leading-6 text-gray-muted">
            {isArabic
              ? "الملف الخاص لا يعني ملفًا ناقصًا. الصور المحمية تستمر في الاحتساب ضمن جاهزية ملفك، بينما يظل الوصول إليها محكومًا بإعداد الخصوصية."
              : "A private profile is not an incomplete profile. Protected photos still count toward readiness while access remains governed by your privacy setting."}
          </div>

          <button type="submit" className="mt-6 min-h-12 w-full rounded-xl bg-gold px-5 py-3 text-sm font-bold text-black transition hover:opacity-90">
            {isArabic ? "حفظ الخصوصية والمتابعة" : "Save privacy and continue"}
          </button>
        </form>
      </div>
    </main>
  );
}
