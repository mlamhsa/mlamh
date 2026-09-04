import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  CircleOff,
  ExternalLink,
  Eye,
  Globe2,
  History,
  Languages,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  UserRound,
  Video,
} from "lucide-react";

import { AdminTalentManagementActions } from "@/components/admin/talents/AdminTalentManagementActions";
import { AdminTalentProfileChangeReview } from "@/components/admin/talents/AdminTalentProfileChangeReview";
import { AdminTalentReviewActions } from "@/components/admin/talents/AdminTalentReviewActions";
import {
  getAdminDictionary,
  getAdminLanguage,
  withAdminLanguage,
} from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { TalentProfileService } from "@/lib/services/talent/TalentProfileService";
import { TalentService } from "@/lib/services/talents/TalentService";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  translateTalentValue,
  translateTalentValues,
} from "@/lib/utils/talent-translations";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
};

function normalizeArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string => typeof item === "string" && item.trim().length > 0,
    );
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string")
        : [];
    } catch {
      return [];
    }
  }

  return [];
}

function formatDate(value: string | null | undefined, language: "ar" | "en") {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(language === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function InfoCard({
  icon: Icon,
  label,
  value,
  ltr = false,
}: {
  icon: typeof UserRound;
  label: string;
  value: React.ReactNode;
  ltr?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-white/35">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{label}</span>
      </div>
      <div
        dir={ltr ? "ltr" : "auto"}
        className="mt-3 break-words text-sm leading-7 text-white/75"
      >
        {value || "—"}
      </div>
    </div>
  );
}

function SectionCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
      <p className="text-[10px] uppercase tracking-[0.24em] text-gold">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-light text-white">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function TagGroup({
  title,
  values,
}: {
  title: string;
  values: string[];
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
      <p className="text-xs text-white/40">{title}</p>
      {values.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {values.map((value) => (
            <span
              key={value}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/60"
            >
              {value}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-white/25">—</p>
      )}
    </div>
  );
}

export default async function AdminTalentPage({ params, searchParams }: PageProps) {
  await requireAdminAccess();

  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const language = getAdminLanguage(resolvedSearchParams.lang);
  const dictionary = getAdminDictionary(language);
  const isArabic = language === "ar";
  const talentId = Number(id);

  if (!Number.isInteger(talentId) || talentId <= 0) notFound();

  const talent = await TalentService.getAdminTalentById(talentId);
  if (!talent) notFound();

  const adminClient = createAdminClient();

  const [profileChangeResult, reviewHistoryResult, authUserResult] = await Promise.all([
    adminClient
      .from("talent_profile_change_requests")
      .select(
        "id,user_id,talent_id,requested_name_ar,requested_name_en,requested_phone,requested_nationality_slug,status,created_at",
      )
      .eq("talent_id", talent.id)
      .eq("status", "pending")
      .maybeSingle(),
    adminClient
      .from("profile_review_history")
      .select("id,decision,reason,admin_note,previous_status,new_status,created_at")
      .eq("talent_id", talent.id)
      .order("created_at", { ascending: false }),
    talent.user_id
      ? adminClient.auth.admin.getUserById(talent.user_id)
      : Promise.resolve({ data: { user: null }, error: null }),
  ]);

  if (profileChangeResult.error) {
    console.error("[AdminTalentPage.profileChange]", profileChangeResult.error);
  }
  if (reviewHistoryResult.error) {
    console.error("[AdminTalentPage.reviewHistory]", reviewHistoryResult.error);
  }
  if (authUserResult.error) {
    console.error("[AdminTalentPage.authUser]", authUserResult.error);
  }

  const pendingProfileChange = profileChangeResult.data;
  const reviewHistory = reviewHistoryResult.data ?? [];
  const accountEmail = authUserResult.data?.user?.email ?? null;
  const profileCompletion = TalentProfileService.calculateCompletion(talent);

  const primaryName =
    (isArabic ? talent.name_ar || talent.name_en : talent.name_en || talent.name_ar)?.trim() ||
    (isArabic ? "موهبة بدون اسم" : "Unnamed talent");
  const secondaryName =
    (isArabic ? talent.name_en : talent.name_ar)?.trim() || null;
  const category =
    (isArabic ? talent.category_ar || talent.category_en : talent.category_en || talent.category_ar)?.trim() ||
    "—";
  const city =
    (isArabic ? talent.city_ar || talent.city_en : talent.city_en || talent.city_ar)?.trim() || "—";
  const bio =
    (isArabic ? talent.bio_ar || talent.bio_en : talent.bio_en || talent.bio_ar)?.trim() || null;

  const languages = translateTalentValues(language, "language", normalizeArray(talent.languages));
  const dialects = translateTalentValues(language, "dialect", normalizeArray(talent.dialects));
  const skills = translateTalentValues(language, "skill", normalizeArray(talent.skills));
  const galleryImages = normalizeArray(talent.gallery_images);

  return (
    <div dir={isArabic ? "rtl" : "ltr"} className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02]">
          <div className="border-b border-white/[0.07] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                href={withAdminLanguage("/admin/talents", language)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] px-4 py-2 text-xs text-white/50 transition hover:border-gold/25 hover:text-gold"
              >
                {isArabic ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                {isArabic ? "العودة إلى المواهب" : "Back to talents"}
              </Link>

              <div className="flex flex-wrap gap-2">
                {talent.slug ? (
                  <Link
                    href={`/${language}/talent/${talent.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] px-4 py-2 text-xs text-white/50 hover:border-white/20 hover:text-white"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {isArabic ? "عرض العام" : "Public view"}
                  </Link>
                ) : null}
                <Link
                  href={withAdminLanguage(`/admin/talents/${talent.id}/edit`, language)}
                  className="inline-flex items-center gap-2 rounded-xl border border-gold/25 bg-gold/[0.06] px-4 py-2 text-xs text-gold transition hover:bg-gold hover:text-black"
                >
                  <Pencil className="h-4 w-4" />
                  {isArabic ? "إدارة وتعديل الملف" : "Manage & edit profile"}
                </Link>
              </div>
            </div>

            <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-end">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-gold">
                  {isArabic ? "مساحة عمل الموهبة" : "Talent workspace"}
                </p>
                <h1 className="mt-3 text-3xl font-light text-white sm:text-4xl">{primaryName}</h1>
                {secondaryName ? <p className="mt-2 text-sm text-white/35">{secondaryName}</p> : null}

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className={`rounded-full border px-3 py-1.5 text-[11px] ${talent.status === "suspended" ? "border-red-400/20 bg-red-400/[0.08] text-red-300" : "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300"}`}>
                    {talent.status === "suspended" ? (isArabic ? "موقوف" : "Suspended") : isArabic ? "نشط" : "Active"}
                  </span>
                  <span className={`rounded-full border px-3 py-1.5 text-[11px] ${talent.published ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300" : "border-white/10 bg-white/[0.04] text-white/45"}`}>
                    {talent.published ? (isArabic ? "منشور" : "Published") : isArabic ? "غير منشور" : "Unpublished"}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] ${talent.verified ? "border-sky-400/20 bg-sky-400/[0.08] text-sky-300" : "border-white/10 bg-white/[0.04] text-white/45"}`}>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {talent.verified ? (isArabic ? "موثّق" : "Verified") : isArabic ? "غير موثّق" : "Not verified"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/50">
                    <Eye className="h-3.5 w-3.5" />
                    {Number(talent.views ?? 0).toLocaleString(isArabic ? "ar-SA" : "en-US")}
                    {isArabic ? " مشاهدة" : " views"}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/35">{isArabic ? "اكتمال الملف" : "Profile completion"}</span>
                  <span className="text-xl text-gold">{profileCompletion}%</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gold" style={{ width: `${Math.max(0, Math.min(100, profileCompletion))}%` }} />
                </div>
                <p className="mt-3 text-xs leading-6 text-white/35">
                  {isArabic ? "نظرة تشغيلية موحدة لبيانات الموهبة وحالة الحساب والمراجعة." : "Unified operational view of talent, account and review data."}
                </p>
              </div>
            </div>
          </div>
        </section>

        <AdminTalentManagementActions
          talentId={talent.id}
          status={talent.status}
          published={talent.published}
          language={language}
        />

        {talent.approval_status === "pending" ? (
          <AdminTalentReviewActions talentId={talent.id} status={talent.approval_status} language={language} />
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02]">
              <div className="relative aspect-[4/5] bg-black">
                {talent.image_url ? (
                  <Image src={talent.image_url} alt={primaryName} fill priority sizes="360px" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-white/15"><UserRound className="h-20 w-20" /></div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 p-4">
                <InfoCard icon={MapPin} label={dictionary.talents.city} value={city} />
                <InfoCard icon={BriefcaseBusiness} label={dictionary.talents.category} value={category} />
              </div>
            </section>

            <SectionCard eyebrow={isArabic ? "الحساب" : "Account"} title={isArabic ? "بيانات الحساب والتواصل" : "Account & contact"}>
              <div className="space-y-3">
                <InfoCard icon={Mail} label={isArabic ? "البريد الإلكتروني" : "Email"} value={accountEmail || "—"} ltr />
                <InfoCard icon={Phone} label={dictionary.talents.phone} value={talent.account_phone || talent.whatsapp || "—"} ltr />
                <InfoCard icon={CalendarDays} label={isArabic ? "إنشاء الحساب" : "Account created"} value={formatDate(talent.account_created_at || talent.created_at, language)} />
                <InfoCard icon={CalendarDays} label={dictionary.talents.lastUpdated} value={formatDate(talent.account_updated_at || talent.updated_at, language)} />
              </div>
            </SectionCard>
          </aside>

          <main className="space-y-6">
            <SectionCard eyebrow={isArabic ? "الملف الأساسي" : "Core profile"} title={isArabic ? "الهوية والجاهزية" : "Identity & readiness"}>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <InfoCard icon={UserRound} label={dictionary.talents.category} value={category} />
                <InfoCard icon={MapPin} label={dictionary.talents.city} value={city} />
                <InfoCard icon={Globe2} label={isArabic ? "الجنسية" : "Nationality"} value={translateTalentValue(language, "nationality", talent.nationality_slug || talent.nationality) || "—"} />
                <InfoCard icon={UserRound} label={isArabic ? "الجنس" : "Gender"} value={translateTalentValue(language, "gender", talent.gender) || "—"} />
                <InfoCard icon={CalendarDays} label={isArabic ? "تاريخ الميلاد" : "Date of birth"} value={formatDate(talent.date_of_birth, language)} />
                <InfoCard icon={CheckCircle2} label={dictionary.talents.availability} value={translateTalentValue(language, "availability", talent.availability_status) || "—"} />
              </div>
            </SectionCard>

            <SectionCard eyebrow={isArabic ? "المحتوى المهني" : "Professional profile"} title={isArabic ? "النبذة والخبرة" : "Biography & experience"}>
              <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-5">
                <p dir="auto" className="whitespace-pre-wrap text-sm leading-8 text-white/65">
                  {bio || (isArabic ? "لم تضف الموهبة نبذة مهنية بعد." : "No professional biography yet.")}
                </p>
              </div>
              {talent.previous_work ? (
                <div className="mt-4 rounded-2xl border border-white/[0.08] bg-black/20 p-5">
                  <p className="text-xs text-white/35">{isArabic ? "الأعمال السابقة" : "Previous work"}</p>
                  <p dir="auto" className="mt-3 whitespace-pre-wrap text-sm leading-8 text-white/60">{talent.previous_work}</p>
                </div>
              ) : null}
            </SectionCard>

            <section className="grid gap-4 lg:grid-cols-3">
              <TagGroup title={isArabic ? "اللغات" : "Languages"} values={languages} />
              <TagGroup title={isArabic ? "اللهجات" : "Dialects"} values={dialects} />
              <TagGroup title={isArabic ? "المهارات" : "Skills"} values={skills} />
            </section>

            <SectionCard eyebrow={isArabic ? "القياسات والمظهر" : "Measurements"} title={isArabic ? "البيانات الجسدية" : "Physical details"}>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <InfoCard icon={UserRound} label={isArabic ? "الطول" : "Height"} value={talent.height_cm ? `${talent.height_cm} cm` : talent.height || "—"} />
                <InfoCard icon={UserRound} label={isArabic ? "الوزن" : "Weight"} value={talent.weight_kg ? `${talent.weight_kg} kg` : "—"} />
                <InfoCard icon={Eye} label={isArabic ? "لون العين" : "Eye color"} value={talent.eye_color || "—"} />
                <InfoCard icon={UserRound} label={isArabic ? "لون الشعر" : "Hair color"} value={talent.hair_color || "—"} />
                <InfoCard icon={UserRound} label={isArabic ? "مقاس الملابس" : "Clothing size"} value={talent.clothing_size || "—"} />
                <InfoCard icon={UserRound} label={isArabic ? "مقاس الحذاء" : "Shoe size"} value={talent.shoe_size ?? "—"} />
                <InfoCard icon={UserRound} label={isArabic ? "الصدر" : "Chest"} value={talent.chest_size ?? "—"} />
                <InfoCard icon={UserRound} label={isArabic ? "الخصر / الورك" : "Waist / Hip"} value={`${talent.waist_size ?? "—"} / ${talent.hip_size ?? "—"}`} />
              </div>
            </SectionCard>

            <SectionCard eyebrow={isArabic ? "الوسائط والروابط" : "Media & links"} title={isArabic ? "المعرض والحضور الرقمي" : "Portfolio & digital presence"}>
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoCard icon={Globe2} label="Instagram" value={talent.instagram || "—"} ltr />
                <InfoCard icon={Globe2} label="TikTok" value={talent.tiktok || "—"} ltr />
                <InfoCard icon={Globe2} label="Snapchat" value={talent.snapchat || "—"} ltr />
                <InfoCard icon={ExternalLink} label={isArabic ? "البورتفوليو" : "Portfolio"} value={talent.portfolio_url || "—"} ltr />
                <InfoCard icon={Video} label={isArabic ? "الفيديو التعريفي" : "Intro video"} value={talent.video_intro || "—"} ltr />
                <InfoCard icon={Video} label={isArabic ? "شوريل" : "Showreel"} value={talent.showreel_url || "—"} ltr />
              </div>

              {galleryImages.length > 0 ? (
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {galleryImages.map((image, index) => (
                    <div key={`${image}-${index}`} className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/[0.08] bg-black">
                      <Image src={image} alt={`${primaryName} ${index + 1}`} fill sizes="240px" className="object-cover" />
                    </div>
                  ))}
                </div>
              ) : null}
            </SectionCard>

            <SectionCard eyebrow={isArabic ? "الإدارة" : "Administration"} title={isArabic ? "سجل المراجعة" : "Review history"}>
              {reviewHistory.length > 0 ? (
                <div className="space-y-3">
                  {reviewHistory.map((review) => (
                    <div key={review.id} className="rounded-2xl border border-white/[0.08] bg-black/20 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <History className="h-4 w-4 text-gold" />
                          <span className={`rounded-full border px-3 py-1 text-[11px] ${review.decision === "approved" ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300" : "border-amber-400/20 bg-amber-400/[0.08] text-amber-300"}`}>
                            {review.decision === "approved" ? (isArabic ? "اعتماد الملف" : "Approved") : isArabic ? "طلب تعديلات" : "Changes requested"}
                          </span>
                        </div>
                        <span className="text-xs text-white/30">{formatDate(review.created_at, language)}</span>
                      </div>
                      {review.reason ? <p dir="auto" className="mt-4 whitespace-pre-wrap text-sm leading-7 text-white/60">{review.reason}</p> : null}
                      {review.admin_note ? <p dir="auto" className="mt-3 rounded-xl border border-gold/10 bg-gold/[0.03] p-4 text-sm leading-7 text-white/50">{review.admin_note}</p> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/30">{isArabic ? "لا يوجد سجل مراجعات حتى الآن." : "No review history yet."}</p>
              )}
            </SectionCard>

            {pendingProfileChange ? (
              <AdminTalentProfileChangeReview
                requestId={pendingProfileChange.id}
                language={language}
                createdAt={pendingProfileChange.created_at}
                current={{
                  nameAr: talent.name_ar ?? null,
                  nameEn: talent.name_en ?? null,
                  phone: talent.account_phone ?? null,
                  nationality: talent.nationality_slug ?? talent.nationality ?? null,
                }}
                requested={{
                  nameAr: pendingProfileChange.requested_name_ar,
                  nameEn: pendingProfileChange.requested_name_en,
                  phone: pendingProfileChange.requested_phone,
                  nationality: pendingProfileChange.requested_nationality_slug,
                }}
              />
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
}
