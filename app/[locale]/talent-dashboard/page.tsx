import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import TalentSidebar from "@/components/talent/TalentSidebar";
import TalentHeader from "@/components/talent/TalentHeader";
import TalentProfileCard from "@/components/talent/TalentProfileCard";
import TalentApplications from "@/components/talent/TalentApplications";
import ApplicationCard from "@/components/talent/ApplicationCard";
import StatCard from "@/components/talent/StatCard";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
  if (status === "approved") return isRtl ? "معتمد" : "Approved";
  if (status === "pending") return isRtl ? "بانتظار الاعتماد" : "Pending approval";
  if (status === "rejected") return isRtl ? "غير معتمد" : "Not approved";
  if (status === "draft") return isRtl ? "مسودة" : "Draft";

  return status ? status.replaceAll("_", " ") : "-";
}

function availabilityLabel(status?: string | null, isRtl = false) {
  if (status === "available_now") return isRtl ? "متاح حالياً" : "Available now";
  if (status === "available") return isRtl ? "متاح" : "Available";
  if (status === "busy") return isRtl ? "مشغول" : "Busy";
  if (status === "unavailable") return isRtl ? "غير متاح" : "Unavailable";

  return status ? status.replaceAll("_", " ") : "-";
}

export default async function TalentDashboardPage({ params }: PageProps) {
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
        <p>{isRtl ? "يرجى تسجيل الدخول أولاً" : "Please login first"}</p>
      </main>
    );
  }

  const { data: talent } = await adminClient
    .from("talents")
    .select("id, slug, name_ar, name_en, image_url, city_ar, city_en, user_id, status, availability_status, published, verified, featured, bio_ar, bio_en, instagram, tiktok, snapchat, portfolio_url, category_ar, category_en")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!talent) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-gold">
            {isRtl ? "لوحة الموهبة" : "Talent Dashboard"}
          </p>

          <h1 className="mt-5 text-4xl font-light">
            {isRtl ? "لم يتم العثور على بروفايل موهبة" : "Talent profile not found"}
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

  const { data: applications } = await adminClient
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

  const allApplications = applications ?? [];
  const totalApplications = allApplications.length;

  const counts = APPLICATION_STATUSES.reduce<Record<string, number>>(
    (acc, status) => {
      acc[status] = allApplications.filter(
        (item: any) => normalizeStatus(item.status) === status
      ).length;

      return acc;
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

  const completionItems = [
    talent.name_ar || talent.name_en,
    talent.city_ar || talent.city_en,
    talent.image_url,
    talent.bio_ar || talent.bio_en,
    talent.category_ar || talent.category_en,
    talent.instagram || talent.tiktok || talent.snapchat || talent.portfolio_url,
  ];

  const completionChecklist = [
    {
      label: isRtl ? "الاسم والمدينة" : "Name and city",
      done: Boolean((talent.name_ar || talent.name_en) && (talent.city_ar || talent.city_en)),
    },
    {
      label: isRtl ? "صورة شخصية احترافية" : "Professional profile photo",
      done: Boolean(talent.image_url),
    },
    {
      label: isRtl ? "نبذة تعريفية" : "Profile bio",
      done: Boolean(talent.bio_ar || talent.bio_en),
    },
    {
      label: isRtl ? "التصنيف أو المجال" : "Category or field",
      done: Boolean(talent.category_ar || talent.category_en),
    },
    {
      label: isRtl ? "روابط التواصل أو الأعمال" : "Social or portfolio links",
      done: Boolean(talent.instagram || talent.tiktok || talent.snapchat || talent.portfolio_url),
    },
  ];

  const profileCompletion = Math.round(
    (completionItems.filter(Boolean).length / completionItems.length) * 100
  );

  const talentCategory =
    locale === "ar"
      ? talent.category_ar ?? talent.category_en ?? "-"
      : talent.category_en ?? talent.category_ar ?? "-";

  const profileStatus = profileStatusLabel(talent.status, isRtl);
  const availabilityStatus = availabilityLabel(talent.availability_status, isRtl);
  const pendingCount = counts.pending ?? 0;
  const reviewingCount = counts.reviewing ?? 0;
  const acceptedCount = counts.accepted ?? 0;
  const shortlistedCount = counts.shortlisted ?? 0;
  const incompleteItems = completionChecklist.filter((item) => !item.done).length;

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
        ? `أكمل ${incompleteItems} عنصر لتحسين ظهور ملفك.`
        : `Complete ${incompleteItems} item(s) to improve your profile.`
      : null,
  ].filter(Boolean) as string[];
  const isComplete = profileCompletion >= 100;

  const userState =
    !isComplete
      ? "incomplete"
      : !talent.published
      ? "ready"
      : "active";
  
  const cta = {
    incomplete: {
      label: isRtl ? "أكمل ملفك الآن" : "Complete Your Profile",
      href: `/${locale}/talent-dashboard/profile`,
    },
    ready: {
      label: isRtl ? "نشر ملفك" : "Publish Your Profile",
      href: `/${locale}/talent-dashboard/profile`,
    },
    active: {
      label: isRtl ? "استعرض الفرص" : "Browse Opportunities",
      href: `/${locale}/opportunities`,
    },
  }[userState];
  
  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-black text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[290px_1fr]">
      <TalentSidebar
  locale={locale}
  totalApplications={totalApplications}
  notificationCount={notificationItems.length}
/>

        <div>
        <TalentHeader
  locale={locale}
  talentName={talentName}
  profileCompletion={profileCompletion}
  pendingCount={pendingCount}
  reviewingCount={reviewingCount}
/>

<TalentProfileCard
  locale={locale}
  talent={talent}
  profileCompletion={profileCompletion}
  talentName={talentName}
  talentCity={talentCity}
  profileStatus={profileStatus}
  availabilityStatus={availabilityStatus}
/>

          <section className="grid gap-4 md:grid-cols-4">
            <StatCard label={isRtl ? "حالة الملف" : "Profile Status"} value={profileStatus} />
            <StatCard label={isRtl ? "الجاهزية" : "Availability"} value={availabilityStatus} />
            <StatCard label={isRtl ? "الطلبات" : "Applications"} value={totalApplications} highlighted />
            <StatCard label={isRtl ? "المدينة" : "City"} value={talentCity} />
          </section>

          <section className="mt-12 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6">
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-gold">
                    {isRtl ? "تقديمات الفرص" : "Opportunity Applications"}
                  </p>

                  <h2 className="mt-3 text-3xl font-light">
                    {isRtl ? "تابع تقديماتك" : "Track your applications"}
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">
                    {isRtl
                      ? "تابع حالة الفرص التي قدمت عليها من المراجعة إلى القبول أو الرفض."
                      : "Track opportunities you applied to from review to acceptance or rejection."}
                  </p>
                </div>

                <Link
                  href={`/${locale}/talent-dashboard/requests`}
                  className="shrink-0 rounded-full border border-gold/40 bg-gold/[0.06] px-6 py-4 text-xs uppercase tracking-[0.22em] text-gold transition hover:bg-gold hover:text-black"
                >
                  {isRtl ? "عرض الطلبات" : "View Applications"}
                </Link>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                <ApplicationCard label={isRtl ? "الإجمالي" : "Total"} value={totalApplications} />
                <ApplicationCard label={isRtl ? "جديد" : "Pending"} value={counts.pending ?? 0} />
                <ApplicationCard label={isRtl ? "قيد المراجعة" : "Reviewing"} value={counts.reviewing ?? 0} />
                <ApplicationCard label={isRtl ? "مختصر" : "Shortlisted"} value={counts.shortlisted ?? 0} />
                <ApplicationCard label={isRtl ? "مقبول" : "Accepted"} value={counts.accepted ?? 0} highlighted />
                <ApplicationCard label={isRtl ? "مرفوض" : "Rejected"} value={counts.rejected ?? 0} />
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-gold">
                {isRtl ? "اكتمال الملف" : "Profile Checklist"}
              </p>

              <h2 className="mt-3 text-3xl font-light">
                {isRtl ? "خطوات تقوية ملفك" : "Strengthen your profile"}
              </h2>

              <div className="mt-6 space-y-3">
                {completionChecklist.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                  >
                    <span className="text-sm text-white/60">{item.label}</span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        item.done
                          ? "bg-emerald-400/10 text-emerald-300"
                          : "bg-white/10 text-white/40"
                      }`}
                    >
                      {item.done ? (isRtl ? "مكتمل" : "Done") : isRtl ? "ناقص" : "Missing"}
                    </span>
                  </div>
                ))}
              </div>
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