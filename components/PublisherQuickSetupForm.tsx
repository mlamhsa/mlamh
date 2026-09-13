"use client";
import Link from "next/link";
import {
  startTransition,
  useActionState,
  useEffect,
  useState,
} from "react";
import {
  BadgeCheck,
  Building2,
  BriefcaseBusiness,
  Clapperboard,
  Megaphone,
  Sparkles,
  Store,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  createPublisherDraftAction,
  type CreatePublisherDraftState,
} from "@/lib/actions/create-publisher-draft";
import { SAUDI_CITIES } from "@/lib/data/saudi-cities";
import type { Locale } from "@/lib/i18n";

const initialCreatePublisherDraftState: CreatePublisherDraftState = {
  success: false,
  message: null,
};

const publisherTypes = [
  {
    value: "production_company",
    ar: "شركة إنتاج",
    en: "Production Company",
    descriptionAr: "للإنتاج التلفزيوني والسينمائي والإعلاني وصناعة المحتوى.",
    descriptionEn: "For TV, film, commercial, and content production.",
    icon: Clapperboard,
  },
  {
    value: "advertising_agency",
    ar: "وكالة إعلانية",
    en: "Advertising Agency",
    descriptionAr: "للوكالات التي تدير الحملات والإعلانات وتبحث عن مواهب.",
    descriptionEn: "For agencies running campaigns and sourcing talent.",
    icon: Megaphone,
  },
  {
    value: "casting_agency",
    ar: "كاستينغ",
    en: "Casting",
    descriptionAr: "لمسؤولي وفرق الكاستينغ الباحثين عن ممثلين ومودلز.",
    descriptionEn: "For casting teams sourcing actors and models.",
    icon: UsersRound,
  },
  {
    value: "talent_agency",
    ar: "وكالة مواهب",
    en: "Talent Agency",
    descriptionAr: "للوكالات التي تمثل أو تدير المواهب وتعمل مع جهات الإنتاج.",
    descriptionEn: "For agencies representing and managing talent.",
    icon: BriefcaseBusiness,
  },
  {
    value: "brand",
    ar: "علامة تجارية",
    en: "Brand",
    descriptionAr: "للعلامات التجارية التي تبحث عن وجوه ومواهب لحملاتها.",
    descriptionEn: "For brands sourcing talent for campaigns and content.",
    icon: BadgeCheck,
  },
  {
    value: "content_company",
    ar: "شركة محتوى",
    en: "Content Company",
    descriptionAr: "لشركات وصناع المحتوى الذين يحتاجون مواهب لمشاريعهم.",
    descriptionEn: "For content companies sourcing talent for productions.",
    icon: Building2,
  },
  {
    value: "other",
    ar: "أخرى",
    en: "Other",
    descriptionAr: "إذا لم يكن نوع الجهة ضمن الخيارات السابقة.",
    descriptionEn: "If your organization type is not listed above.",
    icon: Sparkles,
  },
];

const individualRoles = [
  ["project_owner", "صاحب مشروع", "Project owner"],
  ["photographer", "مصور", "Photographer"],
  ["content_creator", "صانع محتوى", "Content creator"],
  ["event_organizer", "منظم فعالية", "Event organizer"],
  ["freelancer", "مستقل", "Freelancer"],
  ["student_project", "مشروع طلابي", "Student project"],
  ["other", "أخرى", "Other"],
] as const;

const useCases = [
  ["product_shoot", "تصوير منتجات", "Product shoot"],
  ["social_content", "محتوى سوشيال ميديا", "Social media content"],
  ["advertising", "إعلان أو حملة", "Advertising / campaign"],
  ["event", "فعالية", "Event"],
  ["commercial_shoot", "تصوير تجاري", "Commercial shoot"],
  ["other", "استخدام آخر", "Other"],
] as const;

const businessTypes = [
  ["fashion_store", "متجر أزياء", "Fashion store"],
  ["salon", "صالون / تجميل", "Salon / beauty"],
  ["restaurant", "مطعم / مقهى", "Restaurant / cafe"],
  ["ecommerce", "متجر إلكتروني", "E-commerce"],
  ["studio", "استوديو تصوير", "Photography studio"],
  ["events", "تنظيم فعاليات", "Events business"],
  ["other", "نشاط آخر", "Other business"],
] as const;

type PublisherMode = "individual" | "business" | "organization";

type PublisherQuickSetupFormProps = {
  locale: Locale;
  initialName?: string;
  initialPhone?: string;
};

export function PublisherQuickSetupForm({
  locale,
  initialName = "",
  initialPhone = "",
}: PublisherQuickSetupFormProps) {
  const isRtl = locale === "ar";
  const [publisherMode, setPublisherMode] = useState<PublisherMode | null>(null);
  const [publisherRoleChoice, setPublisherRoleChoice] = useState("");
  const [publisherRoleOther, setPublisherRoleOther] = useState("");
  const [useCaseChoice, setUseCaseChoice] = useState("");
  const [useCaseOther, setUseCaseOther] = useState("");
  const [businessTypeChoice, setBusinessTypeChoice] = useState("");
  const [businessTypeOther, setBusinessTypeOther] = useState("");
  const [state, formAction, isPending] = useActionState(
    createPublisherDraftAction,
    initialCreatePublisherDraftState,
  );

  useEffect(() => {
    if (state.success) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [state.success]);

  if (state.success) {
    const isFastTrack = publisherMode === "individual" || publisherMode === "business";
    return (
      <section className="rounded-[2rem] border border-gold/25 bg-gold/[0.04] px-6 py-10 text-center sm:px-10 sm:py-14">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
          <BriefcaseBusiness size={24} />
        </div>
        <p className="mt-6 text-[10px] uppercase tracking-[0.3em] text-gold">
          {isRtl ? "أهلًا بك في ملامح" : "Welcome to MLAMH"}
        </p>
        <h2 className="mt-4 text-3xl font-light text-white sm:text-4xl">
          {isRtl ? "حسابك أصبح جاهزًا" : "Your account is ready"}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/55">
          {isFastTrack
            ? isRtl
              ? "تم حفظ بياناتك الأساسية. يمكنك مراجعة ملفك أو الانتقال إلى لوحة الناشر."
              : "Your essential details are saved. You can review your profile or continue to the publisher dashboard."
            : isRtl
              ? "تم إنشاء حساب الجهة بنجاح. أكمل ملف الجهة لتجهيز حسابك للنشر."
              : "Your organization account has been created. Complete the organization profile to prepare it for publishing."}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={`/${locale}/publisher-dashboard/profile`} className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-7 text-sm font-medium text-black transition hover:bg-gold-soft">
            {isRtl ? "مراجعة البيانات" : "Review details"}
          </Link>
          <Link href={`/${locale}/publisher-dashboard`} className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/10 px-7 text-sm text-white/65 transition hover:border-gold/40 hover:text-gold">
            {isRtl ? "الذهاب إلى لوحة الناشر" : "Go to Publisher Dashboard"}
          </Link>
        </div>
      </section>
    );
  }

  const publisherRoleValue = publisherRoleChoice === "other" ? publisherRoleOther.trim() : publisherRoleChoice;
  const useCaseValue = useCaseChoice === "other" ? useCaseOther.trim() : useCaseChoice;
  const businessTypeValue = businessTypeChoice === "other" ? businessTypeOther.trim() : businessTypeChoice;

  return (
    <form
      action={(formData) => startTransition(() => formAction(formData))}
      className="space-y-6"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="publisher_mode" value={publisherMode ?? ""} />
      <input type="hidden" name="publisher_role" value={publisherRoleValue} />
      <input type="hidden" name="use_case" value={useCaseValue} />
      <input type="hidden" name="business_type" value={businessTypeValue} />

      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
          {isRtl ? "صفة الناشر" : "Publisher type"}
        </p>
        <h2 className="mt-3 text-2xl font-light text-white sm:text-3xl">
          {isRtl ? "من ينشر الطلب؟" : "Who is publishing?"}
        </h2>
        <p className="mt-3 text-sm leading-7 text-white/45">
          {isRtl
            ? "اختر الصفة الأقرب لك. البيانات تساعدنا على حماية المواهب ورفع موثوقية الطلبات."
            : "Choose the option that best fits you. These details help protect talent and improve request trust."}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ModeCard
          selected={publisherMode === "individual"}
          onClick={() => setPublisherMode("individual")}
          icon={<UserRound size={22} />}
          title={isRtl ? "فرد / صاحب مشروع" : "Individual / Project owner"}
          description={isRtl ? "لمشروع شخصي أو عمل مستقل أو تصوير أو محتوى أو فعالية." : "For personal projects, freelance work, shoots, content, or events."}
        />
        <ModeCard
          selected={publisherMode === "business"}
          onClick={() => setPublisherMode("business")}
          icon={<Store size={22} />}
          title={isRtl ? "متجر / نشاط تجاري" : "Store / Business"}
          description={isRtl ? "للمتاجر والصالونات والمطاعم والاستوديوهات والأنشطة الصغيرة." : "For stores, salons, restaurants, studios, and small businesses."}
        />
        <ModeCard
          selected={publisherMode === "organization"}
          onClick={() => setPublisherMode("organization")}
          icon={<Building2 size={22} />}
          title={isRtl ? "شركة / مؤسسة / جهة" : "Company / Organization"}
          description={isRtl ? "للشركات والوكالات والعلامات التجارية والجهات الاحترافية." : "For companies, agencies, brands, and professional organizations."}
        />
      </div>

      {publisherMode === "individual" || publisherMode === "business" ? (
        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label={isRtl ? "الاسم الكامل" : "Full name"} name="contact_name" required dir={isRtl ? "rtl" : "ltr"} defaultValue={initialName} />
            <Field label={isRtl ? "رقم الجوال" : "Mobile number"} name="phone" type="tel" required dir="ltr" placeholder="+9665XXXXXXXX" defaultValue={initialPhone} />
            <div>
              <FieldLabel text={isRtl ? "المدينة" : "City"} required />
              <select name="city" required className="h-12 w-full rounded-xl border border-white/10 bg-black px-4 text-sm text-white outline-none focus:border-gold/45">
                <option value="">{isRtl ? "اختر المدينة" : "Select city"}</option>
                {SAUDI_CITIES.map((city) => (
                  <option key={city.slug} value={city.slug}>{isRtl ? city.ar : city.en}</option>
                ))}
              </select>
            </div>

            {publisherMode === "individual" ? (
              <>
                <SelectField
                  label={isRtl ? "صفتك" : "Your role"}
                  options={individualRoles}
                  isRtl={isRtl}
                  value={publisherRoleChoice}
                  onChange={setPublisherRoleChoice}
                />
                {publisherRoleChoice === "other" ? (
                  <OtherTextField
                    label={isRtl ? "اكتب صفتك" : "Describe your role"}
                    value={publisherRoleOther}
                    onChange={setPublisherRoleOther}
                    isRtl={isRtl}
                  />
                ) : null}
                <SelectField
                  label={isRtl ? "ما الذي تستخدم ملامح من أجله؟" : "What will you use MLAMH for?"}
                  options={useCases}
                  isRtl={isRtl}
                  value={useCaseChoice}
                  onChange={setUseCaseChoice}
                />
                {useCaseChoice === "other" ? (
                  <OtherTextField
                    label={isRtl ? "اكتب استخدامك" : "Describe how you will use MLAMH"}
                    value={useCaseOther}
                    onChange={setUseCaseOther}
                    isRtl={isRtl}
                  />
                ) : null}
                <Field label={isRtl ? "اسم المشروع أو النشاط (إن وجد)" : "Project or business name (optional)"} name="company_name" dir={isRtl ? "rtl" : "ltr"} />
              </>
            ) : (
              <>
                <Field label={isRtl ? "اسم النشاط" : "Business name"} name="company_name" required dir={isRtl ? "rtl" : "ltr"} />
                <SelectField
                  label={isRtl ? "نوع النشاط" : "Business type"}
                  options={businessTypes}
                  isRtl={isRtl}
                  value={businessTypeChoice}
                  onChange={setBusinessTypeChoice}
                />
                {businessTypeChoice === "other" ? (
                  <OtherTextField
                    label={isRtl ? "اكتب نوع النشاط" : "Describe your business type"}
                    value={businessTypeOther}
                    onChange={setBusinessTypeOther}
                    isRtl={isRtl}
                  />
                ) : null}
              </>
            )}

            <Field
              label={isRtl ? "رابط تعريفي أو حساب اجتماعي (اختياري)" : "Website or social profile (optional)"}
              name="social_link"
              type="url"
              dir="ltr"
              placeholder="https://instagram.com/..."
            />
          </div>
          <p className="mt-5 text-xs leading-6 text-white/35">
            {isRtl
              ? "رقم الجوال مطلوب حاليًا لكنه لا يظهر للمواهب ولا يُعرض كرقم موثق حتى يتم تفعيل التحقق لاحقًا."
              : "A mobile number is required but is not shown to talent and is not marked verified until verification is enabled later."}
          </p>
        </section>
      ) : null}

      {publisherMode === "organization" ? (
        <>
          <div className="pt-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold">{isRtl ? "نوع الجهة" : "Organization type"}</p>
            <h3 className="mt-3 text-xl font-light text-white">{isRtl ? "اختر نوع الجهة التي تمثلها" : "Choose your organization type"}</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {publisherTypes.map((type) => {
              const Icon = type.icon;
              return (
                <label key={type.value} className="group cursor-pointer">
                  <input type="radio" name="publisher_type" value={type.value} required className="peer sr-only" />
                  <div className="min-h-44 rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-6 transition group-hover:border-gold/35 peer-checked:border-gold peer-checked:bg-gold/[0.08]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/20 bg-gold/[0.06] text-gold"><Icon size={22} /></div>
                    <h3 className="mt-5 text-xl font-light text-white">{isRtl ? type.ar : type.en}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/45">{isRtl ? type.descriptionAr : type.descriptionEn}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </>
      ) : null}

      {state.message ? (
        <div role="alert" className="rounded-2xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm text-red-300">{state.message}</div>
      ) : null}

      <button type="submit" disabled={isPending || !publisherMode} className="inline-flex min-h-13 w-full items-center justify-center rounded-full bg-gold px-8 py-4 text-sm font-medium text-black transition hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
        {isPending
          ? isRtl ? "جارٍ حفظ البيانات..." : "Saving details..."
          : publisherMode === "organization"
            ? isRtl ? "المتابعة كجهة" : "Continue as organization"
            : isRtl ? "حفظ والمتابعة" : "Save and continue"}
      </button>
    </form>
  );
}

function ModeCard({ selected, onClick, icon, title, description }: { selected: boolean; onClick: () => void; icon: React.ReactNode; title: string; description: string }) {
  return (
    <button type="button" onClick={onClick} className={`min-h-40 rounded-[1.75rem] border p-6 text-start transition ${selected ? "border-gold bg-gold/[0.08]" : "border-white/10 bg-white/[0.025] hover:border-gold/35"}`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/20 bg-gold/[0.06] text-gold">{icon}</div>
      <h3 className="mt-5 text-xl font-light text-white">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-white/45">{description}</p>
    </button>
  );
}

function FieldLabel({ text, required = false }: { text: string; required?: boolean }) {
  return <label className="mb-2.5 block text-sm font-medium text-white/65">{text}{required ? <span className="ms-1 text-gold">*</span> : null}</label>;
}

function Field({ label, name, type = "text", required = false, dir, placeholder, defaultValue }: { label: string; name: string; type?: string; required?: boolean; dir?: "rtl" | "ltr"; placeholder?: string; defaultValue?: string }) {
  return (
    <div>
      <FieldLabel text={label} required={required} />
      <input name={name} type={type} required={required} dir={dir} placeholder={placeholder} defaultValue={defaultValue} className="h-12 w-full rounded-xl border border-white/10 bg-black px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-gold/45" />
    </div>
  );
}

function SelectField({ label, options, isRtl, value, onChange }: { label: string; options: readonly (readonly [string, string, string])[]; isRtl: boolean; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <FieldLabel text={label} required />
      <select value={value} onChange={(event) => onChange(event.target.value)} required className="h-12 w-full rounded-xl border border-white/10 bg-black px-4 text-sm text-white outline-none focus:border-gold/45">
        <option value="">{isRtl ? "اختر" : "Select"}</option>
        {options.map(([optionValue, ar, en]) => <option key={optionValue} value={optionValue}>{isRtl ? ar : en}</option>)}
      </select>
    </div>
  );
}

function OtherTextField({ label, value, onChange, isRtl }: { label: string; value: string; onChange: (value: string) => void; isRtl: boolean }) {
  return (
    <div>
      <FieldLabel text={label} required />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        minLength={2}
        maxLength={120}
        dir={isRtl ? "rtl" : "ltr"}
        placeholder={isRtl ? "اكتب التفاصيل" : "Enter details"}
        className="h-12 w-full rounded-xl border border-white/10 bg-black px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-gold/45"
      />
    </div>
  );
}
