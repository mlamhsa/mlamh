import Link from "next/link";

import TalentSidebar from "@/components/talent/TalentSidebar";
import TalentHeader from "@/components/talent/TalentHeader";
import TalentProfileCard from "@/components/talent/TalentProfileCard";
import TalentApplications from "@/components/talent/TalentApplications";
import ApplicationCard from "@/components/talent/ApplicationCard";
import StatCard from "@/components/talent/StatCard";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TalentProfileService } from "@/lib/services/talent/TalentProfileService";

type PageProps = {
  params: Promise<{ locale: string }>;
};

const APPLICATION_STATUSES = [
  "pending",
  "reviewing",
  "shortlisted",
  "accepted",
  "rejected",
] as const;

function normalizeStatus(status?: string | null) {
  if (
    status === "reviewing" ||
    status === "shortlisted" ||
    status === "accepted" ||
    status === "rejected"
  ) {
    return status;
  }

  return "pending";
}

function profileStatusLabel(status?: string | null, isRtl = false) {
  if (status === "approved") {
    return isRtl ? "معتمد" : "Approved";
  }

  if (status === "pending") {
    return isRtl ? "بانتظار الاعتماد" : "Pending approval";
  }

  if (status === "rejected") {
    return isRtl ? "غير معتمد" : "Not approved";
  }

  if (status === "draft") {
    return isRtl ? "مسودة" : "Draft";
  }

  return status ? status.replaceAll("_", " ") : "-";
}

function availabilityLabel(status?: string | null, isRtl = false) {
  if (status === "available_now") {
    return isRtl ? "متاح حالياً" : "Available now";
  }

  if (status === "available") {
    return isRtl ? "متاح" : "Available";
  }

  if (status === "busy") {
    return isRtl ? "مشغول" : "Busy";
  }

  if (status === "unavailable") {
    return isRtl ? "غير متاح" : "Unavailable";
  }

  return status ? status.replaceAll("_", " ") : "-";
}

function hasAnsweredBoolean(value: unknown) {
  return value !== null && value !== undefined;
}

export default async function TalentDashboardPage({
  params,
}: PageProps) {
  const { locale } = await params;
  const isRtl = locale === "ar";

  const authClient = await createServerSupabaseClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p>
          {isRtl
            ? "يرجى تسجيل الدخول أولاً"
            : "Please login first"}
        </p>
      </main>
    );
  }

  const { data: talent, error: talentError } = await adminClient
    .from("talents")
    .select(`
      id,
      slug,
      user_id,

      name_ar,
      name_en,
      image_url,

      city_ar,
      city_en,
      city_slug,

      category_ar,
      category_en,
      category_slug,

      gender,
      status,
      availability_status,

      published,
      verified,
      featured,

      bio_ar,
      bio_en,

      instagram,
      tiktok,
      snapchat,
      portfolio_url,

      height_cm,
      weight_kg,
      eye_color,
      hair_color,
      hair_type,
      skin_color,
      clothing_size,
      shoe_size,

      experience_years,
      ready_to_travel,
      has_passport,
      has_car,
      work_outside_city,
      work_outside_country,

      video_intro,
      showreel_url
    `)
    .eq("user_id", user.id)
    .maybeSingle();

  if (talentError) {
    console.error("Talent dashboard profile error:", talentError);
  }

  if (!talent) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-gold">
            {isRtl ? "لوحة الموهبة" : "Talent Dashboard"}
          </p>

          <h1 className="mt-5 text-4xl font-light">
            {isRtl
              ? "لم يتم العثور على بروفايل موهبة"
              : "Talent profile not found"}
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-7 text-white/45">
            {isRtl
              ? "لا يوجد سجل موهبة مرتبط بالحساب الحالي."
              : "No talent profile is linked to the current account."}
          </p>
        </div>
      </main>
    );
  }

  const { data: applications, error: applicationsError } =
    await adminClient
      .from("opportunity_applications")
      .select(`
        id,
        status,
        created_at,
        opportunity_id,
        opportunities (
          id,
          title,
          city_ar,
          city_en,
          opportunity_type,
          status,
          created_at
        )
      `)
      .eq("talent_id", talent.id)
      .order("created_at", { ascending: false });

  if (applicationsError) {
    console.error(
      "Talent dashboard applications error:",
      applicationsError
    );
  }

  const allApplications = applications ?? [];
  const totalApplications = allApplications.length;

  const counts = APPLICATION_STATUSES.reduce<Record<string, number>>(
    (accumulator, status) => {
      accumulator[status] = allApplications.filter(
        (application: any) =>
          normalizeStatus(application.status) === status
      ).length;

      return accumulator;
    },
    {}
  );

  const recentApplications = allApplications.slice(0, 5);

  const talentName =
    locale === "ar"
      ? talent.name_ar ?? talent.name_en ?? "موهبة"
      : talent.name_en ?? talent.name_ar ?? "Talent";

  const talentCity =
    locale === "ar"
      ? talent.city_ar ?? talent.city_en ?? "-"
      : talent.city_en ?? talent.city_ar ?? "-";

  /*
   * مصدر واحد لحساب اكتمال الملف.
   * نفس TalentProfileService يمكن استخدامه في جميع صفحات المشروع.
   */
  const profileCompletion =
    TalentProfileService.calculateCompletion(talent);

  const identityComplete = Boolean(
    (talent.name_ar || talent.name_en) &&
      talent.image_url &&
      talent.category_slug &&
      talent.gender &&
      talent.city_slug
  );

  const measurementsComplete = Boolean(
    talent.height_cm &&
      talent.weight_kg &&
      talent.eye_color &&
      talent.hair_color &&
      talent.hair_type &&
      talent.skin_color &&
      talent.clothing_size &&
      talent.shoe_size
  );

  const experienceComplete = Boolean(
    talent.experience_years !== null &&
      talent.experience_years !== undefined &&
      hasAnsweredBoolean(talent.ready_to_travel) &&
      hasAnsweredBoolean(talent.has_passport) &&
      hasAnsweredBoolean(talent.has_car) &&
      hasAnsweredBoolean(talent.work_outside_city) &&
      hasAnsweredBoolean(talent.work_outside_country)
  );

  const mediaComplete = Boolean(
    talent.video_intro &&
      talent.showreel_url &&
      talent.portfolio_url
  );

  const completionChecklist = [
    {
      label: isRtl
        ? "الهوية والمعلومات الأساسية"
        : "Identity and basic information",
      done: identityComplete,
    },
    {
      label: isRtl
        ? "المقاسات والمظهر"
        : "Measurements and appearance",
      done: measurementsComplete,
    },
    {
      label: isRtl
        ? "الخبرة والجاهزية للعمل"
        : "Experience and work readiness",
      done: experienceComplete,
    },
    {
      label: isRtl
        ? "الفيديو والأعمال السابقة"
        : "Media and portfolio",
      done: mediaComplete,
    },
  ];

  const profileStatus = profileStatusLabel(
    talent.status,
    isRtl
  );

  const availabilityStatus = availabilityLabel(
    talent.availability_status,
    isRtl
  );

  const pendingCount = counts.pending ?? 0;
  const reviewingCount = counts.reviewing ?? 0;
  const acceptedCount = counts.accepted ?? 0;
  const shortlistedCount = counts.shortlisted ?? 0;

  const incompleteItems = completionChecklist.filter(
    (item) => !item.done
  ).length;

  const notificationItems = [
    acceptedCount > 0
      ? isRtl
        ? `لديك ${acceptedCount} طلب مقبول.`
        : `You have ${acceptedCount} accepted application(s).`
      : null,

    shortlistedCount > 0
      ? isRtl
        ? `تمت إضافة ${shortlistedCount} طلب إلى القائمة المختصرة.`
        : `${shortlistedCount} application(s) were shortlisted.`
      : null,

    reviewingCount > 0
      ? isRtl
        ? `${reviewingCount} طلب قيد المراجعة حالياً.`
        : `${reviewingCount} application(s) are currently under review.`
      : null,

    incompleteItems > 0
      ? isRtl
        ? `أكمل ${incompleteItems} قسم لتحسين ظهور ملفك.`
        : `Complete ${incompleteItems} section(s) to improve your profile.`
      : null,
  ].filter(Boolean) as string[];

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-black text-white"
    >
      <div className="mx-auto grid max-w-7xl gap-6 px-4 pb-24 pt-4 sm:px-6 lg:grid-cols-[290px_minmax(0,1fr)] lg:gap-10 lg:py-10">
        <TalentSidebar
          locale={locale}
          totalApplications={totalApplications}
          notificationCount={notificationItems.length}
        />

        <div className="min-w-0 space-y-6">
          <TalentHeader
            locale={locale}
            talentName={talentName}
            profileCompletion={profileCompletion}
            pendingCount={pendingCount}
            reviewingCount={reviewingCount}
          />

          <section className="overflow-hidden rounded-[1.75rem] border border-gold/20 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.16),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.055),rgba(255,255,255,0.018))] p-5 sm:p-7">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-gold/25 bg-gold/[0.08] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-gold">
                    {profileStatus}
                  </span>

                  <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/55">
                    {availabilityStatus}
                  </span>
                </div>

                <h1 className="mt-5 text-3xl font-light leading-tight text-white sm:text-4xl">
                  {isRtl
                    ? `مرحباً، ${talentName}`
                    : `Welcome, ${talentName}`}
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/50">
                  {talent.status === "pending"
                    ? isRtl
                      ? "ملفك قيد المراجعة حالياً. أكمل البيانات الناقصة لزيادة جاهزية ملفك قبل الاعتماد."
                      : "Your profile is currently under review. Complete the missing details to improve its readiness before approval."
                    : isRtl
                      ? "تابع ملفك وطلباتك والفرص المناسبة لك من مكان واحد."
                      : "Manage your profile, applications, and matching opportunities from one place."}
                </p>
              </div>

              <div className="w-full shrink-0 rounded-2xl border border-white/10 bg-black/25 p-4 xl:w-[320px]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">
                      {isRtl ? "اكتمال الملف" : "Profile Completion"}
                    </p>
                    <p className="mt-1 text-3xl font-light text-gold">
                      {profileCompletion}%
                    </p>
                  </div>

                  <Link
                    href={`/${locale}/talent-dashboard/profile`}
                    className="rounded-full border border-gold/35 bg-gold/[0.08] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-gold transition hover:bg-gold hover:text-black"
                  >
                    {isRtl ? "إكمال الملف" : "Complete Profile"}
                  </Link>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gold transition-all duration-500"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
              </div>
            </div>
          </section>

          <TalentProfileCard
            locale={locale}
            talent={talent}
            profileCompletion={profileCompletion}
            talentName={talentName}
            talentCity={talentCity}
            profileStatus={profileStatus}
            availabilityStatus={availabilityStatus}
          />

          <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard
              label={isRtl ? "حالة الملف" : "Profile Status"}
              value={profileStatus}
            />

            <StatCard
              label={isRtl ? "الجاهزية" : "Availability"}
              value={availabilityStatus}
            />

            <StatCard
              label={isRtl ? "الطلبات" : "Applications"}
              value={totalApplications}
              highlighted
            />

            <StatCard
              label={isRtl ? "المدينة" : "City"}
              value={talentCity}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-gold">
                    {isRtl
                      ? "تقديمات الفرص"
                      : "Opportunity Applications"}
                  </p>

                  <h2 className="mt-3 text-2xl font-light sm:text-3xl">
                    {isRtl
                      ? "تابع تقديماتك"
                      : "Track your applications"}
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">
                    {isRtl
                      ? "تابع حالة الفرص التي قدمت عليها من المراجعة إلى القبول أو الرفض."
                      : "Track opportunities you applied to from review to acceptance or rejection."}
                  </p>
                </div>

                <Link
                  href={`/${locale}/talent-dashboard/requests`}
                  className="shrink-0 rounded-full border border-gold/40 bg-gold/[0.06] px-5 py-3 text-center text-[10px] uppercase tracking-[0.2em] text-gold transition hover:bg-gold hover:text-black"
                >
                  {isRtl ? "عرض الطلبات" : "View Applications"}
                </Link>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                <ApplicationCard
                  label={isRtl ? "الإجمالي" : "Total"}
                  value={totalApplications}
                />

                <ApplicationCard
                  label={isRtl ? "جديد" : "Pending"}
                  value={counts.pending ?? 0}
                />

                <ApplicationCard
                  label={isRtl ? "قيد المراجعة" : "Reviewing"}
                  value={counts.reviewing ?? 0}
                />

                <ApplicationCard
                  label={isRtl ? "مختصر" : "Shortlisted"}
                  value={counts.shortlisted ?? 0}
                />

                <ApplicationCard
                  label={isRtl ? "مقبول" : "Accepted"}
                  value={counts.accepted ?? 0}
                  highlighted
                />

                <ApplicationCard
                  label={isRtl ? "مرفوض" : "Rejected"}
                  value={counts.rejected ?? 0}
                />
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-gold">
                    {isRtl ? "جاهزية الملف" : "Profile Readiness"}
                  </p>

                  <h2 className="mt-3 text-2xl font-light">
                    {isRtl
                      ? "ما الذي ينقص ملفك؟"
                      : "What is still missing?"}
                  </h2>
                </div>

                <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs text-white/45">
                  {incompleteItems}
                </span>
              </div>

              <div className="mt-6 space-y-3">
                {completionChecklist.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                  >
                    <span className="text-sm leading-6 text-white/60">
                      {item.label}
                    </span>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-[11px] ${
                        item.done
                          ? "bg-emerald-400/10 text-emerald-300"
                          : "bg-gold/10 text-gold"
                      }`}
                    >
                      {item.done
                        ? isRtl
                          ? "مكتمل"
                          : "Done"
                        : isRtl
                          ? "ناقص"
                          : "Missing"}
                    </span>
                  </div>
                ))}
              </div>

              {incompleteItems > 0 ? (
                <Link
                  href={`/${locale}/talent-dashboard/profile`}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-full border border-gold/35 bg-gold/[0.06] px-5 py-3 text-[10px] uppercase tracking-[0.2em] text-gold transition hover:bg-gold hover:text-black"
                >
                  {isRtl ? "إكمال البيانات الناقصة" : "Complete Missing Details"}
                </Link>
              ) : null}
            </section>
          </section>

          <TalentApplications
            locale={locale}
            isRtl={isRtl}
            recentApplications={recentApplications}
            notificationItems={notificationItems}
          />
        </div>
      </div>
    </main>
  );
}
