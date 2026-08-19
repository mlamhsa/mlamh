import Image from "next/image";
import Link from "next/link";
import { AdminTalentProfileChangeReview } from "@/components/admin/talents/AdminTalentProfileChangeReview";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleOff,
  Eye,
  Globe2,
  Languages,
  Pencil,
  Phone,
  ShieldCheck,
  UserRound,
  MapPin,
} from "lucide-react";

import {
  getAdminDictionary,
  getAdminLanguage,
  withAdminLanguage,
} from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { AdminTalentReviewActions } from "@/components/admin/talents/AdminTalentReviewActions";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminTalentManagementActions } from "@/components/admin/talents/AdminTalentManagementActions";
import { TalentService } from "@/lib/services/talents/TalentService";
import { TalentProfileService } from "@/lib/services/talent/TalentProfileService";
import {
  translateTalentValue,
  translateTalentValues,
} from "@/lib/utils/talent-translations";


type PageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    lang?: string;
  }>;
};

function normalizeArray(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string" &&
      item.trim().length > 0,
  );
}

function formatDate(
  value: string | null | undefined,
  language: "ar" | "en",
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    language === "ar"
      ? "ar-SA"
      : "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  ).format(date);
}


function InformationItem({
  icon: Icon,
  label,
  value,
  forceLtr = false,
}: {
  icon: typeof UserRound;
  label: string;
  value: React.ReactNode;
  forceLtr?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/[0.08] bg-black/20 p-4">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.17em] text-white/30">
        <Icon
          aria-hidden="true"
          className="h-3.5 w-3.5 shrink-0"
        />

        <span>{label}</span>
      </div>

      <div
        dir={forceLtr ? "ltr" : "auto"}
        className="mt-3 break-words text-sm leading-7 text-white/75"
      >
        {value || "—"}
      </div>
    </div>
  );
}

export default async function AdminTalentPage({
  params,
  searchParams,
}: PageProps) {
  await requireAdminAccess();

  const [
    resolvedParams,
    resolvedSearchParams,
  ] = await Promise.all([
    params,
    searchParams,
  ]);

  const language = getAdminLanguage(
    resolvedSearchParams.lang,
  );

  const dictionary =
    getAdminDictionary(language);

  const isArabic = language === "ar";

  const talentId = Number(
    resolvedParams.id,
  );

  if (
    !Number.isInteger(talentId) ||
    talentId <= 0
  ) {
    notFound();
  }

  const talent =
    await TalentService.getAdminTalentById(
      talentId,
    );

  if (!talent) {
    notFound();
  }

  const adminClient = createAdminClient();

  const {
    data: pendingProfileChange,
    error: pendingProfileChangeError,
  } = await adminClient
    .from("talent_profile_change_requests")
    .select(`
      id,
      user_id,
      talent_id,
      requested_name_ar,
      requested_name_en,
      requested_phone,
      requested_nationality_slug,
      status,
      created_at
    `)
    .eq("talent_id", talent.id)
    .eq("status", "pending")
    .maybeSingle();

  if (pendingProfileChangeError) {
    console.error(
      "[AdminTalentReviewPage pendingProfileChange]",
      pendingProfileChangeError,
    );
  }

  const profileCompletion =
  TalentProfileService.calculateCompletion(
    talent,
  );

  const primaryName =
    (
      isArabic
        ? talent.name_ar ||
          talent.name_en
        : talent.name_en ||
          talent.name_ar
    )?.trim() ||
    (isArabic
      ? "موهبة بدون اسم"
      : "Unnamed talent");

  const secondaryName =
    (
      isArabic
        ? talent.name_en
        : talent.name_ar
    )?.trim() || null;

  const category =
    (
      isArabic
        ? talent.category_ar ||
          talent.category_en
        : talent.category_en ||
          talent.category_ar
    )?.trim() || "—";

  const city =
    (
      isArabic
        ? talent.city_ar ||
          talent.city_en
        : talent.city_en ||
          talent.city_ar
    )?.trim() || "—";

  const bio =
    (
      isArabic
        ? talent.bio_ar ||
          talent.bio_en
        : talent.bio_en ||
          talent.bio_ar
    )?.trim() || null;

    const languages = translateTalentValues(
      language,
      "language",
      normalizeArray(talent.languages),
    );
    
    const dialects = translateTalentValues(
      language,
      "dialect",
      normalizeArray(talent.dialects),
    );
    
    const skills = translateTalentValues(
      language,
      "skill",
      normalizeArray(talent.skills),
    );

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                href={withAdminLanguage(
                  "/admin/talents",
                  language,
                )}
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] px-4 py-2 text-xs text-white/50 transition hover:border-gold/25 hover:text-gold"
              >
                {isArabic ? (
                  <ArrowRight
                    aria-hidden="true"
                    className="h-4 w-4"
                  />
                ) : (
                  <ArrowLeft
                    aria-hidden="true"
                    className="h-4 w-4"
                  />
                )}

                {isArabic
                  ? "العودة إلى المواهب"
                  : "Back to talents"}
              </Link>

              <Link
                href={withAdminLanguage(
                  `/admin/talents/${talent.id}/edit`,
                  language,
                )}
                className="inline-flex items-center gap-2 rounded-xl border border-gold/25 bg-gold/[0.06] px-4 py-2 text-xs text-gold transition hover:bg-gold hover:text-black"
              >
                <Pencil
                  aria-hidden="true"
                  className="h-4 w-4"
                />

                {isArabic
                  ? "تعديل الملف"
                  : "Edit profile"}
              </Link>
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-end">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.25em] text-gold">
                  {isArabic
                    ? "ملف الموهبة"
                    : "Talent Profile"}
                </p>

                <h1 className="mt-3 break-words text-3xl font-light text-white sm:text-4xl">
                  {primaryName}
                </h1>

                {secondaryName ? (
                  <p
                    dir={isArabic ? "ltr" : "rtl"}
                    className="mt-2 text-sm text-white/40"
                  >
                    {secondaryName}
                  </p>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] ${
                      talent.status === "suspended"
                        ? "border-red-400/20 bg-red-400/[0.08] text-red-300"
                        : "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300"
                    }`}
                  >
                    {talent.status === "suspended" ? (
                      <CircleOff
                        aria-hidden="true"
                        className="h-3.5 w-3.5"
                      />
                    ) : (
                      <CheckCircle2
                        aria-hidden="true"
                        className="h-3.5 w-3.5"
                      />
                    )}

                    {talent.status === "suspended"
                      ? isArabic
                        ? "موقوف"
                        : "Suspended"
                      : isArabic
                        ? "نشط"
                        : "Active"}
                  </span>

                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] ${
                      talent.published
                        ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300"
                        : "border-white/10 bg-white/[0.04] text-white/45"
                    }`}
                  >
                    {talent.published
                      ? isArabic
                        ? "منشور"
                        : "Published"
                      : isArabic
                        ? "غير منشور"
                        : "Unpublished"}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] ${
                      talent.verified
                        ? "border-sky-400/20 bg-sky-400/[0.08] text-sky-300"
                        : "border-white/10 bg-white/[0.04] text-white/45"
                    }`}
                  >
                    <ShieldCheck
                      aria-hidden="true"
                      className="h-3.5 w-3.5"
                    />

                    {talent.verified
                      ? isArabic
                        ? "موثّق"
                        : "Verified"
                      : isArabic
                        ? "غير موثّق"
                        : "Not verified"}
                  </span>

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/50">
                    <Eye
                      aria-hidden="true"
                      className="h-3.5 w-3.5"
                    />

                    {Number(
                      talent.views ?? 0,
                    ).toLocaleString(
                      isArabic
                        ? "ar-SA"
                        : "en-US",
                    )}

                    {isArabic
                      ? " مشاهدة"
                      : " views"}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-white/35">
                    {isArabic
                      ? "اكتمال الملف"
                      : "Profile completion"}
                  </span>

                  <span className="text-lg text-gold">
                    {profileCompletion}%
                  </span>
                </div>

                <div
                  role="progressbar"
                  aria-label={
                    isArabic
                      ? "نسبة اكتمال الملف"
                      : "Profile completion percentage"
                  }
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={profileCompletion}
                  className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"
                >
                  <div
                    className="h-full rounded-full bg-gold"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          profileCompletion,
                        ),
                      )}%`,
                    }}
                  />
                </div>

                <p className="mt-3 text-xs leading-6 text-white/35">
                  {profileCompletion >= 100
                    ? isArabic
                      ? "الملف مكتمل."
                      : "The profile is complete."
                    : isArabic
                      ? "لا يمنع نقص البيانات استخدام الموهبة للمنصة، ويمكن استكمال الملف لاحقًا."
                      : "Missing optional details do not prevent platform use and can be completed later."}
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
  <div className="mt-6">
    <AdminTalentReviewActions
      talentId={talent.id}
      status={talent.approval_status}
      language={language}
    />
  </div>
) : null}

        <div className="mt-7 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02]">
              <div className="relative aspect-[4/5] bg-black">
                {talent.image_url ? (
                  <Image
                    src={talent.image_url}
                    alt={
                      isArabic
                        ? `صورة ${primaryName}`
                        : `${primaryName} profile image`
                    }
                    fill
                    priority
                    sizes="(max-width: 1280px) 100vw, 360px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-white/20">
                    <UserRound
                      aria-hidden="true"
                      className="h-16 w-16"
                    />
                  </div>
                )}
              </div>

              <div className="p-5">
                <div className="grid grid-cols-2 gap-3">
                  <InformationItem
                    icon={MapPin}
                    label={
                      dictionary.talents.city
                    }
                    value={city}
                  />

                  <InformationItem
                    icon={Eye}
                    label={
                      isArabic
                        ? "المشاهدات"
                        : "Views"
                    }
                    value={Number(
                      talent.views ?? 0,
                    ).toLocaleString(
                      isArabic
                        ? "ar-SA"
                        : "en-US",
                    )}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5">
              <p className="text-[10px] uppercase tracking-[0.25em] text-gold">
                {isArabic
                  ? "بيانات الحساب"
                  : "Account Information"}
              </p>

              <div className="mt-4 space-y-3">
                <InformationItem
                  icon={Phone}
                  label={
                    dictionary.talents.phone
                  }
                  value={
                    talent.account_phone ||
                    "—"
                  }
                  forceLtr
                />

                <InformationItem
                  icon={CalendarDays}
                  label={
                    dictionary.talents
                      .lastUpdated
                  }
                  value={formatDate(
                    talent.account_updated_at ||
                      talent.updated_at,
                    language,
                  )}
                />
              </div>
            </section>
          </aside>

          <main className="min-w-0 space-y-6">
            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-gold">
                    {isArabic
                      ? "الملف الأساسي"
                      : "Core Profile"}
                  </p>

                  <h2 className="mt-2 text-xl font-light text-white">
                    {isArabic
                      ? "الهوية والتصنيف"
                      : "Identity and classification"}
                  </h2>
                </div>

                <Link
                  href={withAdminLanguage(
                    `/admin/talents/${talent.id}/edit`,
                    language,
                  )}
                  className="rounded-xl border border-white/[0.08] px-4 py-2 text-xs text-white/50 transition hover:border-gold/25 hover:text-gold"
                >
                  {dictionary.common.edit}
                </Link>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <InformationItem
                  icon={UserRound}
                  label={
                    dictionary.talents.category
                  }
                  value={category}
                />

                <InformationItem
                  icon={MapPin}
                  label={
                    dictionary.talents.city
                  }
                  value={city}
                />

                <InformationItem
                  icon={Globe2}
                  label={
                    isArabic
                      ? "الجنسية"
                      : "Nationality"
                  }
                  value={
                    translateTalentValue(
                      language,
                      "nationality",
                      talent.nationality_slug ||
                        talent.nationality,
                    ) || "—"
                  }
                />

                <InformationItem
                  icon={UserRound}
                  label={
                    isArabic
                      ? "الجنس"
                      : "Gender"
                  }
                  value={
                    translateTalentValue(
                      language,
                      "gender",
                      talent.gender,
                    ) || "—"
                  }
                />

                <InformationItem
                  icon={CalendarDays}
                  label={
                    isArabic
                      ? "تاريخ الميلاد"
                      : "Date of birth"
                  }
                  value={formatDate(
                    talent.date_of_birth,
                    language,
                  )}
                />

                <InformationItem
                  icon={Eye}
                  label={
                    dictionary.talents
                      .availability
                  }
                  value={
                    translateTalentValue(
                      language,
                      "availability",
                      talent.availability_status,
                    ) || "—"
                  }
                />
              </div>
            </section>

            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
              <p className="text-[10px] uppercase tracking-[0.25em] text-gold">
                {isArabic
                  ? "نبذة الموهبة"
                  : "Talent Biography"}
              </p>

              <h2 className="mt-2 text-xl font-light text-white">
                {isArabic
                  ? "التعريف المهني"
                  : "Professional overview"}
              </h2>

              <div className="mt-5 rounded-2xl border border-white/[0.08] bg-black/20 p-5">
                <p
                  dir="auto"
                  className="whitespace-pre-wrap text-sm leading-8 text-white/60"
                >
                  {bio ||
                    (isArabic
                      ? "لم تضف الموهبة نبذة مهنية بعد."
                      : "The talent has not added a professional biography yet.")}
                </p>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
              <TagSection
                title={
                  isArabic
                    ? "اللغات"
                    : "Languages"
                }
                icon={Languages}
                values={languages}
                emptyMessage={
                  isArabic
                    ? "لا توجد لغات"
                    : "No languages"
                }
              />

              <TagSection
                title={
                  isArabic
                    ? "اللهجات"
                    : "Dialects"
                }
                icon={Globe2}
                values={dialects}
                emptyMessage={
                  isArabic
                    ? "لا توجد لهجات"
                    : "No dialects"
                }
              />

              <TagSection
                title={
                  isArabic
                    ? "المهارات"
                    : "Skills"
                }
                icon={UserRound}
                values={skills}
                emptyMessage={
                  isArabic
                    ? "لا توجد مهارات"
                    : "No skills"
                }
              />
            </section>

            {pendingProfileChange ? (
              <AdminTalentProfileChangeReview
                requestId={pendingProfileChange.id}
                language={language}
                createdAt={pendingProfileChange.created_at}
                current={{
                  nameAr: talent.name_ar ?? null,
                  nameEn: talent.name_en ?? null,
                  phone: talent.account_phone ?? null,
                  nationality:
                    talent.nationality_slug ??
                    talent.nationality ??
                    null,
                }}
                requested={{
                  nameAr: pendingProfileChange.requested_name_ar,
                  nameEn: pendingProfileChange.requested_name_en,
                  phone: pendingProfileChange.requested_phone,
                  nationality:
                    pendingProfileChange.requested_nationality_slug,
                }}
              />
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
}

function TagSection({
  title,
  icon: Icon,
  values,
  emptyMessage,
}: {
  title: string;
  icon: typeof UserRound;
  values: string[];
  emptyMessage: string;
}) {
  return (
    <section className="min-w-0 rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5">
      <div className="flex items-center gap-2">
        <Icon
          aria-hidden="true"
          className="h-4 w-4 text-gold"
        />

        <h2 className="text-sm font-medium text-white/80">
          {title}
        </h2>
      </div>

      {values.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {values.map((value) => (
            <span
              key={value}
              dir="auto"
              className="rounded-full border border-white/[0.08] bg-black/20 px-3 py-1.5 text-xs text-white/55"
            >
              {value}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-white/30">
          {emptyMessage}
        </p>
      )}
    </section>
  );
}