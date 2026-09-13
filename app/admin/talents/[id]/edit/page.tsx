import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  Images,
  Link2,
  Lock,
  Mail,
  MapPin,
  Plane,
  Ruler,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRound,
} from "lucide-react";

import { EditTalentGalleryManager } from "@/components/admin/EditTalentGalleryManager";
import { SearchableNationalityField } from "@/components/admin/talents/SearchableNationalityField";
import { getAdminLanguage, withAdminLanguage } from "@/lib/admin/i18n";
import { updateTalentAction } from "@/lib/actions/update-talent";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { SAUDI_CITIES } from "@/lib/data/saudi-cities";
import {
  AVAILABILITY_OPTIONS,
  CLOTHING_SIZE_OPTIONS,
  EYE_COLOR_OPTIONS,
  GENDER_OPTIONS,
  HAIR_COLOR_OPTIONS,
  HAIR_TYPE_OPTIONS,
  PRIMARY_ROLE_OPTIONS,
  SKIN_COLOR_OPTIONS,
  type LocalizedTalentOption,
} from "@/lib/data/talent-profile-options";
import { COUNTRY_CODES, COUNTRY_REGISTRY } from "@/lib/markets/countries";
import { TalentService } from "@/lib/services/talents/TalentService";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCanonicalTalentRole } from "@/lib/talent/profile-review-readiness";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string; lang?: string }>;
};

type SectionKey =
  | "identity"
  | "location"
  | "professional"
  | "appearance"
  | "contact"
  | "mobility"
  | "gallery"
  | "publishing";

const CONTROL_CLASS =
  "mt-2 h-12 w-full rounded-2xl border border-white/[0.09] bg-white/[0.025] px-4 text-sm text-white outline-none transition duration-200 placeholder:text-white/20 hover:border-white/[0.14] focus:border-gold/45 focus:bg-gold/[0.025] focus:ring-4 focus:ring-gold/[0.06]";

function arrayToInput(value: unknown) {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  if (typeof value !== "string") return "";
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean).join(", ") : value;
  } catch {
    return value;
  }
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  dir,
  placeholder,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  dir?: "ltr" | "rtl";
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium text-white/55">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        dir={dir}
        placeholder={placeholder}
        className={CONTROL_CLASS}
      />
      {hint ? <span className="mt-1.5 block text-[11px] leading-5 text-white/28">{hint}</span> : null}
    </label>
  );
}

function Select({
  label,
  name,
  defaultValue,
  options,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium text-white/55">{label}</span>
      <select name={name} defaultValue={defaultValue ?? ""} className={CONTROL_CLASS}>
        <option value="">{placeholder ?? "—"}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function localize(options: LocalizedTalentOption[], isArabic: boolean) {
  return options.map((option) => ({
    value: option.value,
    label: isArabic ? option.ar : option.en,
  }));
}

function TextArea({
  label,
  name,
  defaultValue,
  dir,
  rows = 5,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  dir?: "ltr" | "rtl";
  rows?: number;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium text-white/55">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue ?? ""}
        dir={dir}
        rows={rows}
        className="mt-2 w-full resize-y rounded-2xl border border-white/[0.09] bg-white/[0.025] px-4 py-3 text-sm leading-7 text-white outline-none transition duration-200 placeholder:text-white/20 hover:border-white/[0.14] focus:border-gold/45 focus:bg-gold/[0.025] focus:ring-4 focus:ring-gold/[0.06]"
      />
      {hint ? <span className="mt-1.5 block text-[11px] leading-5 text-white/28">{hint}</span> : null}
    </label>
  );
}

function Toggle({
  label,
  name,
  defaultChecked,
  description,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean | null;
  description?: string;
}) {
  return (
    <label className="group flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3.5 transition hover:border-white/[0.14] hover:bg-white/[0.035]">
      <input type="hidden" name={`${name}__present`} value="1" />
      <span className="min-w-0">
        <span className="block text-sm text-white/72">{label}</span>
        {description ? <span className="mt-0.5 block text-[10px] leading-5 text-white/28">{description}</span> : null}
      </span>
      <span className="relative shrink-0">
        <input type="checkbox" name={name} defaultChecked={Boolean(defaultChecked)} className="peer sr-only" />
        <span className="block h-6 w-11 rounded-full border border-white/10 bg-white/[0.07] transition peer-checked:border-gold/30 peer-checked:bg-gold/65" />
        <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white/65 shadow-sm transition-transform peer-checked:translate-x-5 peer-checked:bg-black" />
      </span>
    </label>
  );
}

function MiniStatus({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "green" | "gold" | "blue";
}) {
  const valueClass =
    tone === "green"
      ? "text-emerald-300"
      : tone === "gold"
        ? "text-gold"
        : tone === "blue"
          ? "text-sky-300"
          : "text-white/72";

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-black/20 px-4 py-3">
      <p className="text-[10px] text-white/30">{label}</p>
      <p className={`mt-1 text-sm ${valueClass}`}>{value}</p>
    </div>
  );
}

function SectionCard({
  id,
  index,
  eyebrow,
  title,
  description,
  icon,
  children,
}: {
  id: SectionKey;
  index: string;
  eyebrow: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-28 overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.018] shadow-[0_24px_80px_rgba(0,0,0,0.12)]"
    >
      <div className="border-b border-white/[0.065] px-5 py-5 sm:px-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-gold/20 bg-gold/[0.07] text-gold">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.22em] text-gold/80">{eyebrow}</span>
              <span className="text-[10px] text-white/18">{index}</span>
            </div>
            <h2 className="mt-1.5 text-xl font-light text-white sm:text-[22px]">{title}</h2>
            {description ? <p className="mt-2 max-w-3xl text-xs leading-6 text-white/32">{description}</p> : null}
          </div>
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function FieldGroup({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.065] bg-black/15 p-4 sm:p-5">
      {title ? <p className="text-xs font-medium text-white/62">{title}</p> : null}
      {description ? <p className="mt-1 text-[11px] leading-5 text-white/28">{description}</p> : null}
      <div className={title || description ? "mt-4" : ""}>{children}</div>
    </div>
  );
}

export default async function EditTalentPage({ params, searchParams }: PageProps) {
  await requireAdminAccess();

  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const language = getAdminLanguage(resolvedSearchParams.lang);
  const isArabic = language === "ar";
  const talentId = Number(id);

  if (!Number.isInteger(talentId) || talentId <= 0) notFound();

  const talent = await TalentService.getAdminTalentById(talentId);
  if (!talent) notFound();

  const adminClient = createAdminClient();
  const authUserResult = talent.user_id
    ? await adminClient.auth.admin.getUserById(talent.user_id)
    : { data: { user: null }, error: null };
  const accountEmail = authUserResult.data?.user?.email ?? null;

  const primaryName =
    (isArabic ? talent.name_ar || talent.name_en : talent.name_en || talent.name_ar)?.trim() ||
    (isArabic ? "موهبة بدون اسم" : "Unnamed talent");
  const primaryRole = getCanonicalTalentRole(talent) ?? "";

  const roleLabel = primaryRole
    ? localize(PRIMARY_ROLE_OPTIONS, isArabic).find((option) => option.value === primaryRole)?.label ?? primaryRole
    : isArabic
      ? "غير محدد"
      : "Not set";
  const cityLabel =
    (isArabic ? talent.city_ar || talent.city_en : talent.city_en || talent.city_ar)?.trim() ||
    (isArabic ? "مدينة غير محددة" : "City not set");
  const visibility = String(talent.profile_visibility ?? "public").toLowerCase();
  const isPrivate = visibility !== "public";
  const isPublished = talent.published === true;
  const isVerified = talent.verified === true;

  const sections: Array<{ id: SectionKey; label: string }> = [
    { id: "identity", label: isArabic ? "الهوية" : "Identity" },
    { id: "location", label: isArabic ? "الموقع والجنسية" : "Location & nationality" },
    { id: "professional", label: isArabic ? "الخبرة والمهارات" : "Experience & skills" },
    { id: "appearance", label: isArabic ? "القياسات والمظهر" : "Measurements & appearance" },
    { id: "contact", label: isArabic ? "التواصل والروابط" : "Contact & links" },
    { id: "mobility", label: isArabic ? "التنقل والجاهزية" : "Mobility & readiness" },
    { id: "gallery", label: isArabic ? "الصور والمعرض" : "Photos & gallery" },
    { id: "publishing", label: isArabic ? "الإدارة والتوثيق" : "Administration" },
  ];

  const cityOptions = SAUDI_CITIES.map((city) => ({
    value: city.slug,
    label: isArabic ? city.ar : city.en,
  }));
  const countryOptions = COUNTRY_CODES.map((code) => ({
    value: code,
    label: isArabic ? COUNTRY_REGISTRY[code].nameAr : COUNTRY_REGISTRY[code].nameEn,
  }));
  const workMarkets = new Set(Array.isArray(talent.work_market_codes) ? talent.work_market_codes : []);

  return (
    <div dir={isArabic ? "rtl" : "ltr"} className="min-h-screen px-4 pb-12 pt-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1380px]">
        <header className="overflow-hidden rounded-[30px] border border-white/[0.08] bg-[radial-gradient(circle_at_top_right,rgba(212,160,23,0.08),transparent_34%),rgba(255,255,255,0.018)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.065] px-5 py-4 sm:px-6">
            <Link
              href={withAdminLanguage(`/admin/talents/${talent.id}`, language)}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-black/15 px-4 text-xs text-white/52 transition hover:border-gold/25 hover:text-gold"
            >
              {isArabic ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
              {isArabic ? "العودة إلى ملف الموهبة" : "Back to talent profile"}
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              {talent.slug && !isPrivate ? (
                <Link
                  href={`/${language}/talent/${talent.slug}`}
                  target="_blank"
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/[0.08] px-4 text-xs text-white/48 transition hover:border-white/20 hover:text-white"
                >
                  <ExternalLink className="h-4 w-4" />
                  {isArabic ? "معاينة الملف العام" : "Preview public profile"}
                </Link>
              ) : null}
              <span className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-gold/18 bg-gold/[0.055] px-4 text-xs text-gold">
                <ShieldCheck className="h-4 w-4" />
                {isArabic ? "وضع التعديل الإداري" : "Admin edit mode"}
              </span>
            </div>
          </div>

          <div className="grid gap-6 px-5 py-6 sm:px-6 lg:grid-cols-[112px_minmax(0,1fr)_minmax(360px,480px)] lg:items-center">
            <div className="relative h-28 w-28 overflow-hidden rounded-[24px] border border-white/10 bg-black/30 shadow-2xl">
              {talent.image_url ? (
                <Image src={talent.image_url} alt={primaryName} fill priority sizes="112px" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-white/18">
                  <UserRound className="h-10 w-10" />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold">{isArabic ? "محرر ملف الموهبة" : "TALENT PROFILE EDITOR"}</p>
              <h1 className="mt-2 truncate text-3xl font-light text-white sm:text-4xl">{primaryName}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/38">
                <span className="inline-flex items-center gap-1.5"><BriefcaseBusiness className="h-3.5 w-3.5" />{roleLabel}</span>
                <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{cityLabel}</span>
                <span>#{talent.id}</span>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <MiniStatus label={isArabic ? "حالة النشر" : "Publishing"} value={isPublished ? (isArabic ? "منشور" : "Published") : (isArabic ? "غير منشور" : "Unpublished")} tone={isPublished ? "green" : "neutral"} />
              <MiniStatus label={isArabic ? "ظهور الملف" : "Visibility"} value={isPrivate ? (isArabic ? "خاص" : "Private") : (isArabic ? "عام" : "Public")} tone={isPrivate ? "blue" : "gold"} />
              <MiniStatus label={isArabic ? "التوثيق" : "Verification"} value={isVerified ? (isArabic ? "موثّق" : "Verified") : (isArabic ? "غير موثّق" : "Not verified")} tone={isVerified ? "blue" : "neutral"} />
              <div className="rounded-2xl border border-white/[0.07] bg-black/20 px-4 py-3">
                <div className="flex items-center gap-1.5 text-[10px] text-white/30"><Mail className="h-3 w-3" />{isArabic ? "البريد" : "Email"}</div>
                <p dir="ltr" className="mt-1 truncate text-sm text-white/72">{accountEmail || "—"}</p>
              </div>
            </div>
          </div>
        </header>

        {resolvedSearchParams.updated === "1" ? (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.065] px-5 py-3.5 text-sm text-emerald-300">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400/10"><Check className="h-4 w-4" /></span>
            <span>{isArabic ? "تم حفظ التعديلات وتحديث ملف الموهبة بنجاح." : "Changes were saved and the talent profile was updated."}</span>
          </div>
        ) : null}

        <form action={updateTalentAction} className="mt-5">
          <input type="hidden" name="id" value={talent.id} />
          <input type="hidden" name="return_lang" value={language} />
          <input type="hidden" name="current_verified_at" value={talent.verified_at ?? ""} />

          <div className="sticky top-3 z-40 mb-5 rounded-2xl border border-white/[0.09] bg-[#0b0b0b]/92 p-2.5 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-3 px-2">
                <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-gold/20 bg-gold/[0.06] text-gold sm:flex">
                  <SlidersHorizontal className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm text-white/72">{isArabic ? `تعديل: ${primaryName}` : `Editing: ${primaryName}`}</p>
                  <p className="mt-0.5 text-[10px] text-white/28">{isArabic ? "التغييرات لا تُطبق حتى الضغط على حفظ" : "Changes are applied only after saving"}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href={withAdminLanguage(`/admin/talents/${talent.id}`, language)}
                  className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl border border-white/10 px-4 text-xs text-white/50 transition hover:border-white/20 hover:text-white lg:flex-none"
                >
                  {isArabic ? "إلغاء" : "Cancel"}
                </Link>
                <button
                  type="submit"
                  className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-gold/30 bg-gold px-5 text-xs font-medium text-black transition hover:bg-[#e2b12b] lg:flex-none"
                >
                  <Save className="h-4 w-4" />
                  {isArabic ? "حفظ التعديلات" : "Save changes"}
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="xl:sticky xl:top-[90px] xl:self-start">
              <nav className="overflow-hidden rounded-[26px] border border-white/[0.08] bg-white/[0.018]">
                <div className="border-b border-white/[0.06] px-4 py-4">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-gold">{isArabic ? "أقسام الملف" : "Profile sections"}</p>
                  <p className="mt-1 text-[11px] leading-5 text-white/28">{isArabic ? "انتقل مباشرة إلى الجزء المطلوب" : "Jump directly to the section you need"}</p>
                </div>
                <div className="p-2">
                  {sections.map((section, index) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="group flex items-center gap-3 rounded-2xl px-3 py-3 text-xs text-white/48 transition hover:bg-white/[0.04] hover:text-white"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-[10px] text-white/30 transition group-hover:border-gold/20 group-hover:text-gold">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{section.label}</span>
                      {isArabic ? <ChevronLeft className="h-3.5 w-3.5 text-white/18" /> : <ChevronRight className="h-3.5 w-3.5 text-white/18" />}
                    </a>
                  ))}
                </div>
              </nav>

              <div className="mt-4 rounded-[26px] border border-gold/14 bg-gold/[0.035] p-4">
                <div className="flex items-center gap-2 text-xs text-gold"><ShieldCheck className="h-4 w-4" />{isArabic ? "تحرير إداري" : "Administrative edit"}</div>
                <p className="mt-2 text-[11px] leading-6 text-white/30">
                  {isArabic
                    ? "استخدم هذه الصفحة لتصحيح بيانات الموهبة. الاعتماد والنشر يبقيان ضمن إجراءات الإدارة المنفصلة."
                    : "Use this editor to correct talent data. Approval and publishing remain separate admin controls."}
                </p>
              </div>
            </aside>

            <main className="min-w-0 space-y-5">
              <SectionCard id="identity" index="01" eyebrow={isArabic ? "الأساس" : "CORE"} title={isArabic ? "الهوية والتصنيف" : "Identity & classification"} icon={<UserRound className="h-4.5 w-4.5" />}>
                <div className="grid gap-4 xl:grid-cols-2">
                  <FieldGroup title={isArabic ? "الأسماء" : "Names"} description={isArabic ? "الاسم القانوني واسم العرض المستخدم في الواجهة." : "Legal and display names used across the platform."}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label={isArabic ? "الاسم بالعربية" : "Name AR"} name="name_ar" defaultValue={talent.name_ar} dir="rtl" />
                      <Field label={isArabic ? "الاسم بالإنجليزية" : "Name EN"} name="name_en" defaultValue={talent.name_en} dir="ltr" />
                      <Field label={isArabic ? "اسم العرض بالعربية" : "Display Name AR"} name="display_name_ar" defaultValue={talent.display_name_ar} dir="rtl" />
                      <Field label={isArabic ? "اسم العرض بالإنجليزية" : "Display Name EN"} name="display_name_en" defaultValue={talent.display_name_en} dir="ltr" />
                    </div>
                  </FieldGroup>

                  <FieldGroup title={isArabic ? "التصنيف الأساسي" : "Core classification"} description={isArabic ? "بيانات تؤثر على البحث والمطابقة والظهور." : "These fields affect search, matching and discovery."}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Select label={isArabic ? "نوع الموهبة" : "Talent type"} name="primary_role" defaultValue={primaryRole} options={localize(PRIMARY_ROLE_OPTIONS, isArabic)} placeholder={isArabic ? "اختر نوع الموهبة" : "Choose talent type"} />
                      <Select label={isArabic ? "الجنس" : "Gender"} name="gender" defaultValue={talent.gender} options={localize(GENDER_OPTIONS, isArabic)} placeholder={isArabic ? "اختر الجنس" : "Choose gender"} />
                      <div className="md:col-span-2"><Field label={isArabic ? "تاريخ الميلاد" : "Date of birth"} name="date_of_birth" type="date" defaultValue={talent.date_of_birth} dir="ltr" /></div>
                    </div>
                  </FieldGroup>
                </div>
              </SectionCard>

              <SectionCard id="location" index="02" eyebrow={isArabic ? "الموقع" : "LOCATION"} title={isArabic ? "الموقع والجنسية وأسواق العمل" : "Location, nationality & work markets"} description={isArabic ? "استخدم القوائم المعتمدة حتى تبقى البيانات موحدة في البحث والمطابقة." : "Use canonical lists so search and matching data remains consistent."} icon={<MapPin className="h-4.5 w-4.5" />}>
                <div className="grid gap-4 xl:grid-cols-2">
                  <FieldGroup title={isArabic ? "الإقامة" : "Residence"}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Select label={isArabic ? "المدينة" : "City"} name="city_slug" defaultValue={talent.city_slug} options={cityOptions} placeholder={isArabic ? "اختر المدينة" : "Choose city"} />
                      <Select label={isArabic ? "الدولة الأساسية" : "Base country"} name="base_country_code" defaultValue={talent.base_country_code} options={countryOptions} placeholder={isArabic ? "اختر الدولة" : "Choose country"} />
                    </div>
                  </FieldGroup>

                  <FieldGroup title={isArabic ? "الجنسية" : "Nationality"}>
                    <SearchableNationalityField language={language} defaultNationality={talent.nationality} defaultSlug={talent.nationality_slug} />
                  </FieldGroup>
                </div>

                <div className="mt-4">
                  <FieldGroup title={isArabic ? "أسواق العمل" : "Work markets"} description={isArabic ? "حدد الأسواق التي يمكن للموهبة العمل فيها عند تفعيلها تشغيليًا." : "Select markets where this talent can work when operationally enabled."}>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {COUNTRY_CODES.map((code) => (
                        <label key={code} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3 text-sm text-white/62 transition hover:border-gold/18 hover:bg-gold/[0.025]">
                          <input type="checkbox" name="work_market_codes" value={code} defaultChecked={workMarkets.has(code)} className="h-4 w-4 accent-[#D4A017]" />
                          <span>{isArabic ? COUNTRY_REGISTRY[code].nameAr : COUNTRY_REGISTRY[code].nameEn}</span>
                        </label>
                      ))}
                    </div>
                  </FieldGroup>
                </div>
              </SectionCard>

              <SectionCard id="professional" index="03" eyebrow={isArabic ? "المهني" : "PROFESSIONAL"} title={isArabic ? "النبذة والخبرة والمهارات" : "Bio, experience & skills"} icon={<Sparkles className="h-4.5 w-4.5" />}>
                <div className="grid gap-4 xl:grid-cols-2">
                  <FieldGroup title={isArabic ? "النبذة المهنية" : "Professional bio"}>
                    <div className="grid gap-4">
                      <TextArea label={isArabic ? "النبذة العربية" : "Bio AR"} name="bio_ar" defaultValue={talent.bio_ar} dir="rtl" rows={6} />
                      <TextArea label={isArabic ? "النبذة الإنجليزية" : "Bio EN"} name="bio_en" defaultValue={talent.bio_en} dir="ltr" rows={6} />
                    </div>
                  </FieldGroup>

                  <FieldGroup title={isArabic ? "المهارات والخبرة" : "Skills & experience"}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label={isArabic ? "اللغات" : "Languages"} name="languages" defaultValue={arrayToInput(talent.languages)} hint={isArabic ? "افصل بين القيم بفاصلة." : "Separate values with commas."} />
                      <Field label={isArabic ? "مستويات اللغة" : "Language levels"} name="language_level" defaultValue={arrayToInput(talent.language_level)} />
                      <Field label={isArabic ? "اللهجات" : "Dialects"} name="dialects" defaultValue={arrayToInput(talent.dialects)} />
                      <Field label={isArabic ? "المهارات" : "Skills"} name="skills" defaultValue={arrayToInput(talent.skills)} />
                      <Field label={isArabic ? "سنوات الخبرة" : "Experience years"} name="experience_years" type="number" defaultValue={talent.experience_years} dir="ltr" />
                      <Field label={isArabic ? "العمر الظاهر" : "Display age"} name="age" type="number" defaultValue={talent.age} dir="ltr" />
                    </div>
                  </FieldGroup>
                </div>
                <div className="mt-4"><FieldGroup title={isArabic ? "الأعمال السابقة" : "Previous work"}><TextArea label={isArabic ? "الخبرات والمشاريع السابقة" : "Previous projects and experience"} name="previous_work" defaultValue={talent.previous_work} rows={4} /></FieldGroup></div>
              </SectionCard>

              <SectionCard id="appearance" index="04" eyebrow={isArabic ? "الكاستينغ" : "CASTING"} title={isArabic ? "القياسات والمظهر" : "Measurements & appearance"} description={isArabic ? "بيانات تساعد على المطابقة. الحقول الاختيارية لا تمنع الاعتماد إذا كانت فارغة." : "Matching data. Optional fields do not block approval when left empty."} icon={<Ruler className="h-4.5 w-4.5" />}>
                <div className="grid gap-4 xl:grid-cols-2">
                  <FieldGroup title={isArabic ? "القياسات" : "Measurements"}>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <Field label={isArabic ? "الطول (سم)" : "Height (cm)"} name="height_cm" type="number" defaultValue={talent.height_cm} dir="ltr" />
                      <Field label={isArabic ? "الطول النصي" : "Legacy height"} name="height" defaultValue={talent.height} dir="ltr" />
                      <Field label={isArabic ? "الوزن (كجم)" : "Weight (kg)"} name="weight_kg" type="number" defaultValue={talent.weight_kg} dir="ltr" />
                      <Field label={isArabic ? "مقاس الحذاء" : "Shoe size"} name="shoe_size" type="number" defaultValue={talent.shoe_size} dir="ltr" />
                      <Field label={isArabic ? "الصدر" : "Chest"} name="chest_size" type="number" defaultValue={talent.chest_size} dir="ltr" />
                      <Field label={isArabic ? "الخصر" : "Waist"} name="waist_size" type="number" defaultValue={talent.waist_size} dir="ltr" />
                      <Field label={isArabic ? "الورك" : "Hip"} name="hip_size" type="number" defaultValue={talent.hip_size} dir="ltr" />
                      <Select label={isArabic ? "مقاس الملابس" : "Clothing size"} name="clothing_size" defaultValue={talent.clothing_size} options={CLOTHING_SIZE_OPTIONS.map((value) => ({ value, label: value }))} />
                    </div>
                  </FieldGroup>

                  <FieldGroup title={isArabic ? "المظهر" : "Appearance"}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Select label={isArabic ? "لون العين" : "Eye color"} name="eye_color" defaultValue={talent.eye_color} options={localize(EYE_COLOR_OPTIONS, isArabic)} />
                      <Select label={isArabic ? "لون الشعر" : "Hair color"} name="hair_color" defaultValue={talent.hair_color} options={localize(HAIR_COLOR_OPTIONS, isArabic)} />
                      <Select label={isArabic ? "نوع الشعر" : "Hair type"} name="hair_type" defaultValue={talent.hair_type} options={localize(HAIR_TYPE_OPTIONS, isArabic)} />
                      <Select label={isArabic ? "لون البشرة" : "Skin tone"} name="skin_color" defaultValue={talent.skin_color} options={localize(SKIN_COLOR_OPTIONS, isArabic)} />
                    </div>
                  </FieldGroup>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <Toggle label={isArabic ? "لحية" : "Beard"} name="beard" defaultChecked={talent.beard} />
                  <Toggle label={isArabic ? "شارب" : "Mustache"} name="mustache" defaultChecked={talent.mustache} />
                  <Toggle label={isArabic ? "حجاب" : "Hijab"} name="hijab" defaultChecked={talent.hijab} />
                  <Toggle label={isArabic ? "وشوم" : "Tattoos"} name="tattoos" defaultChecked={talent.tattoos} />
                  <Toggle label={isArabic ? "ندوب" : "Scars"} name="scars" defaultChecked={talent.scars} />
                  <Toggle label={isArabic ? "نظارات" : "Glasses"} name="glasses" defaultChecked={talent.glasses} />
                </div>
              </SectionCard>

              <SectionCard id="contact" index="05" eyebrow={isArabic ? "خاص بالإدارة" : "ADMIN ONLY"} title={isArabic ? "التواصل والروابط" : "Contact & links"} description={isArabic ? "هذه البيانات مخصصة للتشغيل والإدارة ولا تُعرض كلها للعامة." : "These details are for operations and administration and are not all public."} icon={<Link2 className="h-4.5 w-4.5" />}>
                <div className="grid gap-4 xl:grid-cols-2">
                  <FieldGroup title={isArabic ? "قنوات التواصل" : "Contact channels"}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="WhatsApp" name="whatsapp" defaultValue={talent.whatsapp} dir="ltr" />
                      <Field label="Instagram" name="instagram" defaultValue={talent.instagram} dir="ltr" />
                      <Field label="TikTok" name="tiktok" defaultValue={talent.tiktok} dir="ltr" />
                      <Field label="Snapchat" name="snapchat" defaultValue={talent.snapchat} dir="ltr" />
                    </div>
                  </FieldGroup>

                  <FieldGroup title={isArabic ? "الملف المهني والفيديو" : "Portfolio & video"}>
                    <div className="grid gap-4">
                      <Field label="Portfolio URL" name="portfolio_url" defaultValue={talent.portfolio_url} dir="ltr" />
                      <Field label={isArabic ? "روابط أعمال إضافية" : "Additional portfolio links"} name="portfolio_links" defaultValue={arrayToInput(talent.portfolio_links)} dir="ltr" />
                      <Field label={isArabic ? "الفيديو التعريفي" : "Intro video URL"} name="video_intro" defaultValue={talent.video_intro} dir="ltr" />
                      <Field label="Showreel URL" name="showreel_url" defaultValue={talent.showreel_url} dir="ltr" />
                    </div>
                  </FieldGroup>
                </div>
              </SectionCard>

              <SectionCard id="mobility" index="06" eyebrow={isArabic ? "الجاهزية" : "READINESS"} title={isArabic ? "التنقل والعمل" : "Mobility & work readiness"} icon={<Plane className="h-4.5 w-4.5" />}>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  <Toggle label={isArabic ? "جاهز للسفر" : "Ready to travel"} name="ready_to_travel" defaultChecked={talent.ready_to_travel} />
                  <Toggle label={isArabic ? "لديه جواز سفر" : "Has passport"} name="has_passport" defaultChecked={talent.has_passport} />
                  <Toggle label={isArabic ? "لديه سيارة" : "Has car"} name="has_car" defaultChecked={talent.has_car} />
                  <Toggle label={isArabic ? "يعمل خارج المدينة" : "Works outside city"} name="work_outside_city" defaultChecked={talent.work_outside_city} />
                  <Toggle label={isArabic ? "يعمل خارج الدولة" : "Works outside country"} name="work_outside_country" defaultChecked={talent.work_outside_country} />
                </div>
              </SectionCard>

              <SectionCard id="gallery" index="07" eyebrow={isArabic ? "الوسائط" : "MEDIA"} title={isArabic ? "الصورة الرئيسية والمعرض" : "Main image & gallery"} description={isArabic ? "راجع الصورة الرئيسية وصور المعرض من نفس مساحة التحرير." : "Manage the main profile image and gallery from the same workspace."} icon={<Images className="h-4.5 w-4.5" />}>
                <EditTalentGalleryManager talentId={talent.id} imageUrl={talent.image_url} galleryImages={talent.gallery_images} alt={primaryName} />
              </SectionCard>

              <SectionCard id="publishing" index="08" eyebrow={isArabic ? "الإدارة" : "ADMINISTRATION"} title={isArabic ? "التوفر والتوثيق والترتيب" : "Availability, verification & ordering"} description={isArabic ? "إعدادات تشغيلية متقدمة. حالة النشر نفسها تُدار من صفحة الموهبة الرئيسية." : "Advanced operational settings. Publishing itself is managed from the main talent page."} icon={<BadgeCheck className="h-4.5 w-4.5" />}>
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                  <FieldGroup title={isArabic ? "التوفر والترتيب" : "Availability & ordering"}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Select label={isArabic ? "حالة التوفر" : "Availability"} name="availability_status" defaultValue={talent.availability_status ?? "available_now"} options={localize(AVAILABILITY_OPTIONS, isArabic)} />
                      <Field label={isArabic ? "ترتيب الظهور" : "Sort order"} name="sort_order" type="number" defaultValue={talent.sort_order} dir="ltr" />
                    </div>
                  </FieldGroup>

                  <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-sky-400/15 bg-sky-400/[0.035] p-5 transition hover:border-sky-400/25">
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 text-sm text-sky-300"><ShieldCheck className="h-4 w-4" />{isArabic ? "توثيق الموهبة" : "Talent verification"}</span>
                      <span className="mt-1.5 block text-[11px] leading-5 text-white/30">{isArabic ? "فعّلها فقط بعد إتمام التحقق المطلوب." : "Enable only after the required verification is complete."}</span>
                    </span>
                    <input type="checkbox" name="verified" defaultChecked={Boolean(talent.verified)} className="h-5 w-5 shrink-0 accent-[#D4A017]" />
                  </label>
                </div>
              </SectionCard>

              <div className="rounded-[26px] border border-white/[0.08] bg-white/[0.018] p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gold/18 bg-gold/[0.05] text-gold"><Save className="h-4 w-4" /></div>
                    <div>
                      <p className="text-sm text-white/70">{isArabic ? "جاهز لحفظ التعديلات؟" : "Ready to save changes?"}</p>
                      <p className="mt-1 text-[11px] leading-5 text-white/28">{isArabic ? "راجع الحقول المهمة، ثم احفظ. يمكنك العودة للملف دون تغيير حالة الاعتماد." : "Review the important fields, then save. Approval status is not changed here."}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={withAdminLanguage(`/admin/talents/${talent.id}`, language)} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 px-5 text-sm text-white/50 transition hover:border-white/20 hover:text-white">{isArabic ? "إلغاء" : "Cancel"}</Link>
                    <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gold/30 bg-gold px-6 text-sm font-medium text-black transition hover:bg-[#e2b12b]"><Save className="h-4 w-4" />{isArabic ? "حفظ التعديلات" : "Save changes"}</button>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </form>
      </div>
    </div>
  );
}
