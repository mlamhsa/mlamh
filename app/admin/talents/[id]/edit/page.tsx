import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ExternalLink,
  Mail,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { EditTalentGalleryManager } from "@/components/admin/EditTalentGalleryManager";
import {
  getAdminLanguage,
  withAdminLanguage,
} from "@/lib/admin/i18n";
import { updateTalentAction } from "@/lib/actions/update-talent";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { TalentService } from "@/lib/services/talents/TalentService";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string; lang?: string }>;
};

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
      <span className="text-xs font-medium text-white/55">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        dir={dir}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-gold/40 focus:ring-1 focus:ring-gold/20"
      />
      {hint ? <span className="mt-1.5 block text-[11px] leading-5 text-white/25">{hint}</span> : null}
    </label>
  );
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
      <span className="text-xs font-medium text-white/55">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue ?? ""}
        dir={dir}
        rows={rows}
        className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm leading-7 text-white outline-none transition focus:border-gold/40 focus:ring-1 focus:ring-gold/20"
      />
      {hint ? <span className="mt-1.5 block text-[11px] leading-5 text-white/25">{hint}</span> : null}
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
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.08] bg-black/20 p-4 transition hover:border-white/15">
      <input type="hidden" name={`${name}__present`} value="1" />
      <input
        type="checkbox"
        name={name}
        defaultChecked={Boolean(defaultChecked)}
        className="mt-0.5 h-4 w-4 accent-[#D4A017]"
      />
      <span>
        <span className="block text-sm text-white/70">{label}</span>
        {description ? <span className="mt-1 block text-[11px] leading-5 text-white/30">{description}</span> : null}
      </span>
    </label>
  );
}

function WorkspaceSection({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
      <p className="text-[10px] uppercase tracking-[0.24em] text-gold">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-light text-white">{title}</h2>
      {description ? <p className="mt-2 max-w-3xl text-xs leading-6 text-white/30">{description}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
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

  const sections = [
    ["identity", isArabic ? "الهوية" : "Identity"],
    ["location", isArabic ? "الموقع والأسواق" : "Location & markets"],
    ["professional", isArabic ? "المهني" : "Professional"],
    ["appearance", isArabic ? "القياسات والمظهر" : "Measurements"],
    ["contact", isArabic ? "التواصل والروابط" : "Contact & links"],
    ["mobility", isArabic ? "التنقل والجاهزية" : "Mobility"],
    ["gallery", isArabic ? "المعرض" : "Gallery"],
    ["publishing", isArabic ? "الإدارة والنشر" : "Publishing"],
  ] as const;

  return (
    <div dir={isArabic ? "rtl" : "ltr"} className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href={withAdminLanguage(`/admin/talents/${talent.id}`, language)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] px-4 py-2 text-xs text-white/50 transition hover:border-gold/25 hover:text-gold"
            >
              {isArabic ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
              {isArabic ? "العودة لملف الموهبة" : "Back to talent profile"}
            </Link>
            {talent.slug ? (
              <Link
                href={`/${language}/talent/${talent.slug}`}
                target="_blank"
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] px-4 py-2 text-xs text-white/45 hover:border-white/20 hover:text-white"
              >
                <ExternalLink className="h-4 w-4" />
                {isArabic ? "عرض الملف العام" : "Public profile"}
              </Link>
            ) : null}
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-[80px_minmax(0,1fr)_minmax(260px,360px)] lg:items-center">
            <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
              {talent.image_url ? (
                <Image src={talent.image_url} alt={primaryName} fill sizes="80px" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-white/20"><UserRound className="h-8 w-8" /></div>
              )}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.26em] text-gold">{isArabic ? "محرر ملف الموهبة" : "Talent profile editor"}</p>
              <h1 className="mt-2 text-3xl font-light text-white">{primaryName}</h1>
              <p className="mt-2 text-xs text-white/35">#{talent.id} · {talent.slug || "—"}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
              <div className="flex items-center gap-2 text-xs text-white/35"><Mail className="h-4 w-4" />{isArabic ? "البريد المسجل" : "Account email"}</div>
              <p dir="ltr" className="mt-2 break-all text-sm text-white/70">{accountEmail || "—"}</p>
              <p className="mt-2 text-[11px] leading-5 text-white/25">{isArabic ? "البريد مرتبط بحساب الدخول ولا يتم تعديله من هذه الصفحة." : "Login email is account-level and read-only here."}</p>
            </div>
          </div>
        </header>

        {resolvedSearchParams.updated === "1" ? (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] px-5 py-4 text-sm text-emerald-300">
            <Check className="h-4 w-4" />
            {isArabic ? "تم حفظ التعديلات بنجاح." : "Changes saved successfully."}
          </div>
        ) : null}

        <form action={updateTalentAction} className="mt-6 grid gap-6 xl:grid-cols-[230px_minmax(0,1fr)]">
          <input type="hidden" name="id" value={talent.id} />
          <input type="hidden" name="return_lang" value={language} />
          <input type="hidden" name="current_verified_at" value={talent.verified_at ?? ""} />

          <aside className="xl:sticky xl:top-6 xl:self-start">
            <nav className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-3">
              <p className="px-3 pb-2 pt-1 text-[10px] uppercase tracking-[0.22em] text-gold">{isArabic ? "أقسام الملف" : "Profile sections"}</p>
              {sections.map(([target, label]) => (
                <a key={target} href={`#${target}`} className="flex items-center justify-between rounded-xl px-3 py-2.5 text-xs text-white/45 transition hover:bg-white/[0.04] hover:text-white">
                  <span>{label}</span>
                  <ChevronLeft className={`h-3.5 w-3.5 ${isArabic ? "" : "rotate-180"}`} />
                </a>
              ))}
            </nav>

            <div className="mt-4 rounded-3xl border border-gold/15 bg-gold/[0.04] p-4">
              <div className="flex items-center gap-2 text-xs text-gold"><ShieldCheck className="h-4 w-4" />{isArabic ? "تعديل إداري" : "Admin edit"}</div>
              <p className="mt-2 text-[11px] leading-6 text-white/30">{isArabic ? "أي تعديل هنا يغيّر بيانات الموهبة مباشرة. راجع البيانات قبل الحفظ." : "Changes here update talent data directly. Review before saving."}</p>
            </div>
          </aside>

          <main className="space-y-6">
            <WorkspaceSection id="identity" eyebrow={isArabic ? "الأساس" : "Core"} title={isArabic ? "الهوية والتصنيف" : "Identity & classification"}>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label={isArabic ? "الاسم بالعربية" : "Name AR"} name="name_ar" defaultValue={talent.name_ar} dir="rtl" />
                <Field label={isArabic ? "الاسم بالإنجليزية" : "Name EN"} name="name_en" defaultValue={talent.name_en} dir="ltr" />
                <Field label={isArabic ? "اسم العرض بالعربية" : "Display Name AR"} name="display_name_ar" defaultValue={talent.display_name_ar} dir="rtl" />
                <Field label={isArabic ? "اسم العرض بالإنجليزية" : "Display Name EN"} name="display_name_en" defaultValue={talent.display_name_en} dir="ltr" />
                <Field label={isArabic ? "التصنيف بالعربية" : "Category AR"} name="category_ar" defaultValue={talent.category_ar} dir="rtl" />
                <Field label={isArabic ? "التصنيف بالإنجليزية" : "Category EN"} name="category_en" defaultValue={talent.category_en} dir="ltr" />
                <Field label={isArabic ? "الجنس" : "Gender"} name="gender" defaultValue={talent.gender} dir="ltr" placeholder="male / female" />
                <Field label={isArabic ? "تاريخ الميلاد" : "Date of birth"} name="date_of_birth" type="date" defaultValue={talent.date_of_birth} dir="ltr" />
              </div>
            </WorkspaceSection>

            <WorkspaceSection id="location" eyebrow={isArabic ? "الأسواق" : "Markets"} title={isArabic ? "الموقع والجنسية وأسواق العمل" : "Location, nationality & work markets"}>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label={isArabic ? "المدينة بالعربية" : "City AR"} name="city_ar" defaultValue={talent.city_ar} dir="rtl" />
                <Field label={isArabic ? "المدينة بالإنجليزية" : "City EN"} name="city_en" defaultValue={talent.city_en} dir="ltr" />
                <Field label="City Slug" name="city_slug" defaultValue={talent.city_slug} dir="ltr" />
                <Field label={isArabic ? "الدولة الأساسية" : "Base country"} name="base_country_code" defaultValue={talent.base_country_code} dir="ltr" placeholder="SA" />
                <Field label={isArabic ? "الجنسية" : "Nationality"} name="nationality" defaultValue={talent.nationality} />
                <Field label="Nationality Slug" name="nationality_slug" defaultValue={talent.nationality_slug} dir="ltr" />
                <div className="md:col-span-2">
                  <Field label={isArabic ? "أسواق العمل" : "Work markets"} name="work_market_codes" defaultValue={arrayToInput(talent.work_market_codes)} dir="ltr" placeholder="SA, AE, QA" hint={isArabic ? "افصل القيم بفاصلة." : "Comma-separated market codes."} />
                </div>
              </div>
            </WorkspaceSection>

            <WorkspaceSection id="professional" eyebrow={isArabic ? "المهني" : "Professional"} title={isArabic ? "النبذة والخبرة والمهارات" : "Bio, experience & skills"}>
              <div className="grid gap-5">
                <TextArea label={isArabic ? "النبذة العربية" : "Bio AR"} name="bio_ar" defaultValue={talent.bio_ar} dir="rtl" />
                <TextArea label={isArabic ? "النبذة الإنجليزية" : "Bio EN"} name="bio_en" defaultValue={talent.bio_en} dir="ltr" />
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label={isArabic ? "اللغات" : "Languages"} name="languages" defaultValue={arrayToInput(talent.languages)} hint={isArabic ? "افصل اللغات بفاصلة." : "Comma-separated."} />
                  <Field label={isArabic ? "مستويات اللغة" : "Language levels"} name="language_level" defaultValue={arrayToInput(talent.language_level)} />
                  <Field label={isArabic ? "اللهجات" : "Dialects"} name="dialects" defaultValue={arrayToInput(talent.dialects)} />
                  <Field label={isArabic ? "المهارات" : "Skills"} name="skills" defaultValue={arrayToInput(talent.skills)} />
                  <Field label={isArabic ? "سنوات الخبرة" : "Experience years"} name="experience_years" type="number" defaultValue={talent.experience_years} dir="ltr" />
                  <Field label={isArabic ? "العمر الظاهر" : "Display age"} name="age" type="number" defaultValue={talent.age} dir="ltr" />
                </div>
                <TextArea label={isArabic ? "الأعمال السابقة" : "Previous work"} name="previous_work" defaultValue={talent.previous_work} rows={4} />
              </div>
            </WorkspaceSection>

            <WorkspaceSection id="appearance" eyebrow={isArabic ? "الكاستينغ" : "Casting"} title={isArabic ? "القياسات والمظهر" : "Measurements & appearance"}>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <Field label={isArabic ? "الطول (سم)" : "Height (cm)"} name="height_cm" type="number" defaultValue={talent.height_cm} dir="ltr" />
                <Field label={isArabic ? "الطول النصي" : "Height legacy"} name="height" defaultValue={talent.height} dir="ltr" />
                <Field label={isArabic ? "الوزن (كجم)" : "Weight (kg)"} name="weight_kg" type="number" defaultValue={talent.weight_kg} dir="ltr" />
                <Field label={isArabic ? "لون العين" : "Eye color"} name="eye_color" defaultValue={talent.eye_color} />
                <Field label={isArabic ? "لون الشعر" : "Hair color"} name="hair_color" defaultValue={talent.hair_color} />
                <Field label={isArabic ? "نوع الشعر" : "Hair type"} name="hair_type" defaultValue={talent.hair_type} />
                <Field label={isArabic ? "لون البشرة" : "Skin tone"} name="skin_color" defaultValue={talent.skin_color} />
                <Field label={isArabic ? "مقاس الملابس" : "Clothing size"} name="clothing_size" defaultValue={talent.clothing_size} dir="ltr" />
                <Field label={isArabic ? "مقاس الحذاء" : "Shoe size"} name="shoe_size" type="number" defaultValue={talent.shoe_size} dir="ltr" />
                <Field label={isArabic ? "الصدر" : "Chest"} name="chest_size" type="number" defaultValue={talent.chest_size} dir="ltr" />
                <Field label={isArabic ? "الخصر" : "Waist"} name="waist_size" type="number" defaultValue={talent.waist_size} dir="ltr" />
                <Field label={isArabic ? "الورك" : "Hip"} name="hip_size" type="number" defaultValue={talent.hip_size} dir="ltr" />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <Toggle label={isArabic ? "لحية" : "Beard"} name="beard" defaultChecked={talent.beard} />
                <Toggle label={isArabic ? "شارب" : "Mustache"} name="mustache" defaultChecked={talent.mustache} />
                <Toggle label={isArabic ? "حجاب" : "Hijab"} name="hijab" defaultChecked={talent.hijab} />
                <Toggle label={isArabic ? "وشوم" : "Tattoos"} name="tattoos" defaultChecked={talent.tattoos} />
                <Toggle label={isArabic ? "ندوب" : "Scars"} name="scars" defaultChecked={talent.scars} />
                <Toggle label={isArabic ? "نظارات" : "Glasses"} name="glasses" defaultChecked={talent.glasses} />
              </div>
            </WorkspaceSection>

            <WorkspaceSection id="contact" eyebrow={isArabic ? "خاص بالإدارة" : "Admin-only"} title={isArabic ? "التواصل والروابط والوسائط" : "Contact, links & media"} description={isArabic ? "هذه البيانات ليست كلها عامة، وتخضع لقواعد الخصوصية الحالية في المنصة." : "These fields remain subject to the platform's current privacy rules."}>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="WhatsApp" name="whatsapp" defaultValue={talent.whatsapp} dir="ltr" />
                <Field label="Instagram" name="instagram" defaultValue={talent.instagram} dir="ltr" />
                <Field label="TikTok" name="tiktok" defaultValue={talent.tiktok} dir="ltr" />
                <Field label="Snapchat" name="snapchat" defaultValue={talent.snapchat} dir="ltr" />
                <div className="md:col-span-2"><Field label="Portfolio URL" name="portfolio_url" defaultValue={talent.portfolio_url} dir="ltr" /></div>
                <div className="md:col-span-2"><Field label={isArabic ? "روابط أعمال إضافية" : "Additional portfolio links"} name="portfolio_links" defaultValue={arrayToInput(talent.portfolio_links)} dir="ltr" /></div>
                <div className="md:col-span-2"><Field label={isArabic ? "الفيديو التعريفي" : "Intro video URL"} name="video_intro" defaultValue={talent.video_intro} dir="ltr" /></div>
                <div className="md:col-span-2"><Field label="Showreel URL" name="showreel_url" defaultValue={talent.showreel_url} dir="ltr" /></div>
              </div>
            </WorkspaceSection>

            <WorkspaceSection id="mobility" eyebrow={isArabic ? "الجاهزية" : "Readiness"} title={isArabic ? "التنقل والعمل" : "Mobility & work readiness"}>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <Toggle label={isArabic ? "جاهز للسفر" : "Ready to travel"} name="ready_to_travel" defaultChecked={talent.ready_to_travel} />
                <Toggle label={isArabic ? "لديه جواز سفر" : "Has passport"} name="has_passport" defaultChecked={talent.has_passport} />
                <Toggle label={isArabic ? "لديه سيارة" : "Has car"} name="has_car" defaultChecked={talent.has_car} />
                <Toggle label={isArabic ? "يعمل خارج المدينة" : "Works outside city"} name="work_outside_city" defaultChecked={talent.work_outside_city} />
                <Toggle label={isArabic ? "يعمل خارج الدولة" : "Works outside country"} name="work_outside_country" defaultChecked={talent.work_outside_country} />
              </div>
            </WorkspaceSection>

            <WorkspaceSection id="gallery" eyebrow={isArabic ? "الوسائط" : "Media"} title={isArabic ? "الصورة الرئيسية والمعرض" : "Main image & gallery"}>
              <EditTalentGalleryManager
                talentId={talent.id}
                imageUrl={talent.image_url}
                galleryImages={talent.gallery_images}
                alt={primaryName}
              />
            </WorkspaceSection>

            <WorkspaceSection id="publishing" eyebrow={isArabic ? "الإدارة" : "Administration"} title={isArabic ? "التوفر والتوثيق والترتيب" : "Availability, verification & ordering"}>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-medium text-white/55">{isArabic ? "حالة التوفر" : "Availability"}</span>
                  <select name="availability_status" defaultValue={talent.availability_status ?? "available_now"} className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-gold/40">
                    <option value="available_now">Available Now</option>
                    <option value="available_this_week">Available This Week</option>
                    <option value="available_next_month">Available Next Month</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </label>
                <Field label={isArabic ? "ترتيب الظهور" : "Sort order"} name="sort_order" type="number" defaultValue={talent.sort_order} dir="ltr" />
              </div>
              <div className="mt-5">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-sky-400/15 bg-sky-400/[0.04] p-4">
                  <input type="checkbox" name="verified" defaultChecked={Boolean(talent.verified)} className="h-4 w-4 accent-[#D4A017]" />
                  <ShieldCheck className="h-4 w-4 text-sky-300" />
                  <span className="text-sm text-white/70">{isArabic ? "موثّق" : "Verified"}</span>
                </label>
              </div>
            </WorkspaceSection>

            <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.1] bg-[#111]/95 p-4 shadow-2xl backdrop-blur">
              <p className="text-xs text-white/30">{isArabic ? "راجع التعديلات قبل الحفظ." : "Review changes before saving."}</p>
              <div className="flex gap-2">
                <Link href={withAdminLanguage(`/admin/talents/${talent.id}`, language)} className="rounded-xl border border-white/10 px-4 py-2.5 text-xs text-white/45 hover:text-white">
                  {isArabic ? "إلغاء" : "Cancel"}
                </Link>
                <button type="submit" className="inline-flex items-center gap-2 rounded-xl border border-gold/30 bg-gold px-5 py-2.5 text-xs font-medium text-black transition hover:brightness-110">
                  <Save className="h-4 w-4" />
                  {isArabic ? "حفظ التعديلات" : "Save changes"}
                </button>
              </div>
            </div>
          </main>
        </form>
      </div>
    </div>
  );
}
