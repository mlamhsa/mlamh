import Link from "next/link";
import { redirect } from "next/navigation";
import { signOutTalentAction } from "@/lib/actions/talent-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { calculateProfileCompletion } from "@/lib/utils/profile-completion";

export const metadata = {
  title: "Talent Dashboard — MLAMH",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    lang?: string;
  }>;
};

function getAvailabilityLabel(status?: string | null, isRtl = false) {
  switch (status) {
    case "available_now":
      return isRtl ? "متاح الآن" : "Available Now";
    case "available_this_week":
      return isRtl ? "متاح هذا الأسبوع" : "Available This Week";
    case "available_next_month":
      return isRtl ? "متاح الشهر القادم" : "Available Next Month";
    case "unavailable":
      return isRtl ? "غير متاح" : "Unavailable";
    default:
      return isRtl ? "غير محدد" : "Not set";
  }
}

function normalizeApplicationStatus(status?: string | null) {
  if (
    status === "shortlisted" ||
    status === "accepted" ||
    status === "rejected" ||
    status === "reviewing"
  ) {
    return status;
  }

  return "pending";
}

export default async function TalentDashboardPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const lang = resolvedSearchParams.lang === "en" ? "en" : "ar";
  const isRtl = lang === "ar";

  const authClient = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) {
    redirect("/ar/login");
  }

  const adminClient = createAdminClient();

  const { data: talentUser } = await adminClient
    .from("talent_users")
    .select("id, email, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!talentUser) {
    await adminClient.from("talent_users").upsert({
      id: user.id,
      email: user.email,
      role: "talent",
    });
  }

  const { data: talent } = await adminClient
    .from("talents")
    .select(
      `
      id,
      slug,
      name_en,
      name_ar,
      display_name_en,
      display_name_ar,
      image_url,
      gallery_images,
      category_en,
      category_ar,
      city_en,
      city_ar,
      bio_en,
      bio_ar,
      instagram,
      tiktok,
      snapchat,
      portfolio_url,
      availability_status,
      verified,
      featured,
      published,
      status
      `
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const { count: requestsCount } = talent
    ? await adminClient
        .from("talent_requests")
        .select("id", { count: "exact", head: true })
        .eq("talent_id", talent.id)
    : { count: 0 };

  const { data: applications } = talent
    ? await adminClient
        .from("opportunity_applications")
        .select("id, status, created_at")
        .eq("talent_id", talent.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  const allApplications = applications ?? [];

  const totalApplications = allApplications.length;
  const pendingApplications = allApplications.filter(
    (application) =>
      normalizeApplicationStatus(application.status) === "pending"
  ).length;
  const reviewingApplications = allApplications.filter(
    (application) =>
      normalizeApplicationStatus(application.status) === "reviewing"
  ).length;
  const shortlistedApplications = allApplications.filter(
    (application) =>
      normalizeApplicationStatus(application.status) === "shortlisted"
  ).length;
  const acceptedApplications = allApplications.filter(
    (application) =>
      normalizeApplicationStatus(application.status) === "accepted"
  ).length;
  const rejectedApplications = allApplications.filter(
    (application) =>
      normalizeApplicationStatus(application.status) === "rejected"
  ).length;

  const publicProfileHref = talent?.slug
    ? `/${lang}/talent/${talent.slug}`
    : talent?.id
      ? `/${lang}/talent/${talent.id}`
      : null;

  const profileCompletion = talent ? calculateProfileCompletion(talent) : 0;

  const talentName = isRtl
    ? talent?.display_name_ar || talent?.name_ar || talent?.display_name_en || talent?.name_en || "بدون اسم"
    : talent?.display_name_en || talent?.name_en || talent?.display_name_ar || talent?.name_ar || "Unnamed";

  const talentCategory = isRtl
    ? talent?.category_ar || talent?.category_en || "—"
    : talent?.category_en || talent?.category_ar || "—";

  const talentCity = isRtl
    ? talent?.city_ar || talent?.city_en || "—"
    : talent?.city_en || talent?.city_ar || "—";

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-background px-6 py-10 text-white"
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-col gap-6 border-b border-white/[0.08] pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-gold">
              {isRtl ? "MLAMH TALENT" : "MLAMH TALENT"}
            </p>

            <h1
              className="mt-3 text-4xl font-light tracking-tight text-white md:text-6xl"
              style={{ fontFamily: "var(--font-cormorant)" }}
            >
              {isRtl ? "لوحة الموهبة" : "Talent Dashboard"}
            </h1>

            <p className="mt-3 text-sm text-gray-muted">
              {isRtl
                ? "إدارة ملفك، جاهزيتك، طلباتك، ظهورك، وحالة التقديمات."
                : "Manage your profile, availability, applications, requests, and visibility."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/talent-dashboard?lang=ar"
              className={`rounded-full border px-4 py-3 text-[10px] uppercase tracking-[0.25em] transition ${
                isRtl
                  ? "border-gold/40 bg-gold/[0.06] text-gold"
                  : "border-white/10 text-white/60 hover:border-gold/40 hover:text-gold"
              }`}
            >
              العربية
            </Link>

            <Link
              href="/talent-dashboard?lang=en"
              className={`rounded-full border px-4 py-3 text-[10px] uppercase tracking-[0.25em] transition ${
                !isRtl
                  ? "border-gold/40 bg-gold/[0.06] text-gold"
                  : "border-white/10 text-white/60 hover:border-gold/40 hover:text-gold"
              }`}
            >
              English
            </Link>

            <form action={signOutTalentAction}>
              <button
                type="submit"
                className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-white/60 transition hover:border-gold/40 hover:text-gold"
              >
                {isRtl ? "تسجيل الخروج" : "Sign out"}
              </button>
            </form>
          </div>
        </header>

        {!talent ? (
          <section className="rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-8">
            <p className="text-[10px] uppercase tracking-[0.35em] text-gold">
              {isRtl ? "إعداد الملف" : "Profile Setup"}
            </p>

            <h2 className="mt-3 text-3xl font-light text-white">
              {isRtl ? "اربط ملف الموهبة" : "Connect your talent profile"}
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-muted">
              {isRtl
                ? "حسابك جاهز، لكن لا يوجد ملف موهبة مرتبط به حتى الآن. أنشئ ملفًا جديدًا أو طالب بملف موجود."
                : "Your account is ready, but no talent profile is linked to it yet. Create a new profile or claim an existing MLAMH profile."}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/talent-dashboard/profile"
                className="inline-flex rounded-full border border-white/10 px-7 py-4 text-[10px] uppercase tracking-[0.35em] text-white/60 transition hover:border-gold/40 hover:text-gold"
              >
                {isRtl ? "إنشاء ملف جديد" : "Create New Profile"}
              </Link>

              <Link
                href="/talent-dashboard/claim"
                className="inline-flex rounded-full border border-gold/40 bg-gold/[0.06] px-7 py-4 text-[10px] uppercase tracking-[0.35em] text-gold transition hover:bg-gold/10"
              >
                {isRtl ? "المطالبة بملف موجود" : "Claim Existing Profile"}
              </Link>
            </div>
          </section>
        ) : (
          <>
            <section className="grid gap-5 md:grid-cols-4">
              <DashboardCard
                label={isRtl ? "حالة الملف" : "Profile Status"}
                value={talent.status || "pending"}
              />

              <DashboardCard
                label={isRtl ? "الجاهزية" : "Availability"}
                value={getAvailabilityLabel(talent.availability_status, isRtl)}
              />

              <DashboardCard
                label={isRtl ? "الطلبات" : "Requests"}
                value={String(requestsCount ?? 0)}
              />

              <DashboardCard
                label={isRtl ? "الاكتمال" : "Completion"}
                value={`${profileCompletion}%`}
              />
            </section>

            <section className="mt-8 rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-gold">
                    {isRtl ? "تقديمات الفرص" : "Opportunity Applications"}
                  </p>

                  <h2 className="mt-3 text-3xl font-light text-white">
                    {isRtl ? "تابع تقديماتك" : "Track your applications"}
                  </h2>

                  <p className="mt-3 max-w-xl text-sm leading-7 text-gray-muted">
                    {isRtl
                      ? "تابع حالة الفرص التي قدمت عليها من المراجعة إلى القائمة المختصرة أو القبول أو الرفض."
                      : "Follow the status of the opportunities you applied to, from review to shortlist, acceptance, or rejection."}
                  </p>
                </div>

                <Link
                  href="/ar/talent-dashboard/requests"
                  className="rounded-full border border-gold/40 bg-gold/[0.06] px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-gold transition hover:bg-gold/10"
                >
                  {isRtl ? "عرض الطلبات" : "View Requests"}
                </Link>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-6">
                <ApplicationCard label={isRtl ? "الإجمالي" : "Total"} value={totalApplications} />
                <ApplicationCard label={isRtl ? "جديد" : "Pending"} value={pendingApplications} />
                <ApplicationCard label={isRtl ? "قيد المراجعة" : "Reviewing"} value={reviewingApplications} />
                <ApplicationCard label={isRtl ? "مختصر" : "Shortlisted"} value={shortlistedApplications} />
                <ApplicationCard label={isRtl ? "مقبول" : "Accepted"} value={acceptedApplications} highlighted />
                <ApplicationCard label={isRtl ? "مرفوض" : "Rejected"} value={rejectedApplications} />
              </div>
            </section>

            <section className="mt-8 rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-gold">
                    {isRtl ? "قوة الملف" : "Profile Strength"}
                  </p>

                  <h2 className="mt-3 text-3xl font-light text-white">
                    {isRtl
                      ? `مكتمل بنسبة ${profileCompletion}%`
                      : `${profileCompletion}% Complete`}
                  </h2>

                  <p className="mt-3 max-w-xl text-sm leading-7 text-gray-muted">
                    {isRtl
                      ? "أكمل ملفك لزيادة ظهورك وتحسين فرص استقبال طلبات الكاستينغ."
                      : "Complete your profile to improve visibility and increase the chances of receiving casting requests."}
                  </p>
                </div>

                <Link
                  href="/talent-dashboard/profile"
                  className="rounded-full border border-gold/40 bg-gold/[0.06] px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-gold transition hover:bg-gold/10"
                >
                  {isRtl ? "إكمال الملف" : "Complete Profile"}
                </Link>
              </div>

              <div className="mt-8">
                <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-white/45">
                  <span>{isRtl ? "اكتمال الملف" : "Profile Completion"}</span>
                  <span>{profileCompletion}%</span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gold transition-all duration-700"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
              </div>
            </section>

            <section className="mt-8 rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-gold">
                    {isRtl ? "ملفي" : "My Profile"}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <h2 className="text-3xl font-light text-white">
                      {talentName}
                    </h2>

                    {talent.verified ? (
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[9px] uppercase tracking-[0.2em] text-emerald-300">
                        {isRtl ? "موثق" : "Verified"}
                      </span>
                    ) : null}

                    {talent.featured ? (
                      <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[9px] uppercase tracking-[0.2em] text-gold">
                        {isRtl ? "مميز" : "Featured"}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-2 text-sm text-gray-muted">
                    {talentCategory} · {talentCity}
                  </p>

                  <p className="mt-2 text-sm text-gray-muted">
                    {isRtl ? "منشور:" : "Published:"}{" "}
                    {talent.published ? (isRtl ? "نعم" : "Yes") : (isRtl ? "لا" : "No")}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/talent-dashboard/profile"
                    className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-white/60 transition hover:border-gold/40 hover:text-gold"
                  >
                    {isRtl ? "تعديل الملف" : "Edit Profile"}
                  </Link>

                  <Link
                    href="/talent-dashboard/gallery"
                    className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-white/60 transition hover:border-gold/40 hover:text-gold"
                  >
                    {isRtl ? "إدارة المعرض" : "Manage Gallery"}
                  </Link>

                  <Link
                    href="/ar/talent-dashboard/requests"
                    className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-white/60 transition hover:border-gold/40 hover:text-gold"
                  >
                    {isRtl ? "طلباتي" : "My Requests"}
                  </Link>

                  <Link
                    href={`/${lang}/opportunities`}
                    className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-white/60 transition hover:border-gold/40 hover:text-gold"
                  >
                    {isRtl ? "الفرص المتاحة" : "View Opportunities"}
                  </Link>

                  {publicProfileHref ? (
                    <Link
                      href={publicProfileHref}
                      className="rounded-full border border-gold/40 bg-gold/[0.06] px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-gold transition hover:bg-gold/10"
                    >
                      {isRtl ? "عرض الملف العام" : "View Public Profile"}
                    </Link>
                  ) : null}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function DashboardCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-6">
      <p className="text-[10px] uppercase tracking-[0.3em] text-gray-muted">
        {label}
      </p>

      <p className="mt-3 text-2xl font-light text-white">{value}</p>
    </div>
  );
}

function ApplicationCard({
  label,
  value,
  highlighted = false,
}: {
  label: string;
  value: number;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border p-5 ${
        highlighted
          ? "border-gold/30 bg-gold/[0.06]"
          : "border-white/[0.08] bg-black/20"
      }`}
    >
      <p className="text-[10px] uppercase tracking-[0.25em] text-gray-muted">
        {label}
      </p>

      <p className="mt-3 text-3xl font-light text-white">{value}</p>
    </div>
  );
}