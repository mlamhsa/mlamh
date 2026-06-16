import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
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

function statusLabel(status?: string | null, isRtl = false) {
  const normalized = normalizeStatus(status);

  if (normalized === "reviewing") return isRtl ? "قيد المراجعة" : "Reviewing";
  if (normalized === "shortlisted") return isRtl ? "القائمة المختصرة" : "Shortlisted";
  if (normalized === "accepted") return isRtl ? "مقبول" : "Accepted";
  if (normalized === "rejected") return isRtl ? "مرفوض" : "Rejected";

  return isRtl ? "جديد" : "Pending";
}

function statusClass(status?: string | null) {
  const normalized = normalizeStatus(status);

  if (normalized === "reviewing") return "border-blue-400/30 bg-blue-400/10 text-blue-300";
  if (normalized === "shortlisted") return "border-gold/30 bg-gold/10 text-gold";
  if (normalized === "accepted") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  if (normalized === "rejected") return "border-red-400/30 bg-red-400/10 text-red-300";

  return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
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

function formatDate(value?: string | null, locale = "en") {
  if (!value) return "-";

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

async function signOutTalent(formData: FormData) {
  "use server";

  const locale = String(formData.get("locale") ?? "ar");
  const authClient = await createServerSupabaseClient();

  await authClient.auth.signOut();

  redirect(`/${locale}/talent-login`);
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

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-black text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[290px_1fr]">
        <aside className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
          <div className="border-b border-white/10 pb-6">
            <p className="text-3xl font-light text-gold">ملامح</p>
            <p className="mt-2 text-xs uppercase tracking-[0.3em] text-white/40">
              {isRtl ? "مركز الموهبة" : "Talent Center"}
            </p>
          </div>

          <nav className="mt-6 grid gap-2">
            <SidebarLink
              active
              icon="👤"
              href={`/${locale}/talent-dashboard`}
              label={isRtl ? "الملف الشخصي" : "Profile"}
            />

            <SidebarLink
              icon="📋"
              href={`/${locale}/talent-dashboard/requests`}
              label={isRtl ? "طلباتي" : "My Applications"}
              badge={totalApplications > 0 ? totalApplications : undefined}
            />

            <SidebarLink
              icon="🖼"
              href={`/${locale}/talent-dashboard/gallery`}
              label={isRtl ? "معرض الأعمال" : "Portfolio Gallery"}
            />

            <SidebarLink
              icon="📅"
              href={`/${locale}/talent-dashboard/profile`}
              label={isRtl ? "التوفر" : "Availability"}
            />

            <SidebarLink
              icon="🔔"
              href={`/${locale}/talent-dashboard/notifications`}
              label={isRtl ? "الإشعارات" : "Notifications"}
              badge={notificationItems.length > 0 ? notificationItems.length : undefined}
            />

            <SidebarLink
              icon="📊"
              href={`/${locale}/talent-dashboard/requests`}
              label={isRtl ? "الإحصائيات" : "Insights"}
            />

            <SidebarLink
              icon="⚙️"
              href={`/${locale}/talent-dashboard/profile`}
              label={isRtl ? "الإعدادات" : "Settings"}
            />

            <SidebarLink
              icon="🎭"
              href={`/${locale}/opportunities`}
              label={isRtl ? "استعراض الفرص" : "Browse Opportunities"}
            />
          </nav>

          <div className="mt-8 space-y-3 border-t border-white/10 pt-6">
            <Link
              href={`/${locale === "ar" ? "en" : "ar"}/talent-dashboard`}
              className="block rounded-2xl border border-white/10 px-4 py-3 text-center text-xs uppercase tracking-[0.22em] text-white/60 transition hover:border-gold/40 hover:text-gold"
            >
              {isRtl ? "English" : "العربية"}
            </Link>

            <form action={signOutTalent}>
              <input type="hidden" name="locale" value={locale} />
              <button
                type="submit"
                className="w-full rounded-2xl border border-red-400/20 bg-red-400/[0.04] px-4 py-3 text-sm text-red-200 transition hover:bg-red-400/10"
              >
                {isRtl ? "تسجيل الخروج" : "Sign Out"}
              </button>
            </form>
          </div>
        </aside>

        <div>
          <header className="mb-8 overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-gold/[0.06] p-7 md:p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-gold">
                  MLAMH TALENT
                </p>

                <h1 className="mt-4 text-4xl font-light leading-tight md:text-6xl">
                  {isRtl ? `مرحباً، ${talentName}` : `Welcome, ${talentName}`}
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/50">
                  {isRtl
                    ? "هذه مساحتك لإدارة ملفك، متابعة طلباتك، تحسين ظهورك، والاستعداد للفرص القادمة."
                    : "Your space to manage your profile, track applications, improve visibility, and get ready for upcoming opportunities."}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/${locale}/talent-dashboard/profile`}
                  className="rounded-full bg-gold px-6 py-4 text-xs font-medium uppercase tracking-[0.22em] text-black transition hover:bg-[#e0bd73]"
                >
                  {isRtl ? "إكمال الملف" : "Complete Profile"}
                </Link>

                <Link
                  href={`/${locale}/opportunities`}
                  className="rounded-full border border-white/15 px-6 py-4 text-xs uppercase tracking-[0.22em] text-white/70 transition hover:border-gold/40 hover:text-gold"
                >
                  {isRtl ? "استعراض الفرص" : "Browse Opportunities"}
                </Link>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <MiniSummary
                label={isRtl ? "طلبات جديدة" : "New applications"}
                value={pendingCount}
              />
              <MiniSummary
                label={isRtl ? "قيد المراجعة" : "Under review"}
                value={reviewingCount}
              />
              <MiniSummary
                label={isRtl ? "نسبة اكتمال الملف" : "Profile completion"}
                value={`${profileCompletion}%`}
                highlighted
              />
            </div>
          </header>

          <section className="mb-8 rounded-[2rem] border border-white/10 bg-white/[0.025] p-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-5 md:flex-row md:items-center">
                <div className="h-28 w-28 overflow-hidden rounded-full border border-gold/30 bg-white/5">
                  {talent.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={talent.image_url}
                      alt={talentName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl text-gold">
                      {talentName.charAt(0)}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-3xl font-light text-white">{talentName}</h2>

                    {talent.verified ? (
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-300">
                        {isRtl ? "موثق" : "Verified"}
                      </span>
                    ) : null}

                    {talent.featured ? (
                      <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-gold">
                        {isRtl ? "مميز" : "Featured"}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-2 text-sm text-white/45">
                    {talentCategory} · {talentCity}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Pill label={profileStatus} />
                    <Pill label={availabilityStatus} gold />
                    <Pill label={talent.published ? (isRtl ? "منشور" : "Published") : isRtl ? "غير منشور" : "Unpublished"} />
                  </div>
                </div>
              </div>

              <Link
                href={`/${locale}/talent-dashboard/profile`}
                className="rounded-full border border-gold/40 bg-gold/[0.06] px-6 py-4 text-xs uppercase tracking-[0.22em] text-gold transition hover:bg-gold hover:text-black"
              >
                {isRtl ? "تعديل الملف الشخصي" : "Edit Profile"}
              </Link>
            </div>

            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.22em] text-white/40">
                <span>{isRtl ? "اكتمال الملف" : "Profile completion"}</span>
                <span>{profileCompletion}%</span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gold transition-all"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-4">
            <StatCard label={isRtl ? "حالة الملف" : "Profile Status"} value={profileStatus} />
            <StatCard label={isRtl ? "الجاهزية" : "Availability"} value={availabilityStatus} />
            <StatCard label={isRtl ? "الطلبات" : "Applications"} value={totalApplications} highlighted />
            <StatCard label={isRtl ? "المدينة" : "City"} value={talentCity} />
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
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

          <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6">
              <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-gold">
                    {isRtl ? "آخر الطلبات" : "Recent Applications"}
                  </p>
                  <h2 className="mt-3 text-3xl font-light">
                    {isRtl ? "طلباتك الأخيرة" : "Your recent applications"}
                  </h2>
                </div>

                <Link
                  href={`/${locale}/talent-dashboard/requests`}
                  className="text-xs uppercase tracking-[0.22em] text-gold"
                >
                  {isRtl ? "عرض الكل" : "View All"}
                </Link>
              </div>

              {recentApplications.length > 0 ? (
                <div className="divide-y divide-white/10 overflow-hidden rounded-[1.5rem] border border-white/10">
                  {recentApplications.map((application: any) => {
                    const opportunity = Array.isArray(application.opportunities)
                      ? application.opportunities[0]
                      : application.opportunities;

                    return (
                      <article
                        key={application.id}
                        className="grid gap-5 bg-black/20 p-5 md:grid-cols-[1.4fr_0.7fr_0.7fr]"
                      >
                        <div>
                          <p className="text-xl font-light">{opportunity?.title ?? "-"}</p>
                          <p className="mt-2 text-sm text-white/40">
                            {opportunity?.opportunity_type
                              ? String(opportunity.opportunity_type).replaceAll("_", " ")
                              : "-"}
                          </p>
                        </div>

                        <div>
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${statusClass(
                              application.status
                            )}`}
                          >
                            {statusLabel(application.status, isRtl)}
                          </span>
                        </div>

                        <div className="text-sm text-white/45">
                          {formatDate(application.created_at, locale)}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 p-10 text-center text-white/40">
                  {isRtl ? "لم تقدم على أي فرصة حتى الآن." : "No applications yet."}
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-gold">
                    {isRtl ? "الإشعارات" : "Notifications"}
                  </p>
                  <h2 className="mt-3 text-3xl font-light">
                    {isRtl ? "آخر التنبيهات" : "Latest updates"}
                  </h2>
                </div>

                <Link
                  href={`/${locale}/talent-dashboard/notifications`}
                  className="text-xs uppercase tracking-[0.22em] text-gold"
                >
                  {isRtl ? "عرض" : "Open"}
                </Link>
              </div>

              {notificationItems.length > 0 ? (
                <div className="space-y-3">
                  {notificationItems.slice(0, 4).map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white/60"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 p-8 text-center text-white/40">
                  {isRtl ? "لا توجد إشعارات جديدة حالياً." : "No new notifications right now."}
                </div>
              )}
            </section>
          </section>
        </div>
      </div>
    </main>
  );
}

function SidebarLink({
  href,
  label,
  icon,
  badge,
  active = false,
}: {
  href: string;
  label: string;
  icon?: string;
  badge?: number;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-4 text-sm transition ${
        active
          ? "border-gold/40 bg-gold/[0.12] text-gold"
          : "border-transparent text-white/55 hover:border-white/10 hover:bg-white/[0.03] hover:text-white"
      }`}
    >
      <span className="flex items-center gap-3">
        {icon ? <span className="text-base">{icon}</span> : null}
        <span>{label}</span>
      </span>

      {badge ? (
        <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] text-black">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

function Pill({ label, gold = false }: { label: string; gold?: boolean }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs ${
        gold
          ? "border-gold/30 bg-gold/10 text-gold"
          : "border-white/10 bg-white/[0.04] text-white/55"
      }`}
    >
      {label}
    </span>
  );
}

function MiniSummary({
  label,
  value,
  highlighted = false,
}: {
  label: string;
  value: string | number;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.5rem] border p-5 ${
        highlighted
          ? "border-gold/30 bg-gold/[0.08]"
          : "border-white/10 bg-black/20"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.22em] text-white/35">
        {label}
      </p>
      <p className="mt-3 text-3xl font-light text-white">{value}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlighted = false,
}: {
  label: string;
  value: string | number;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.75rem] border p-5 ${
        highlighted
          ? "border-gold/20 bg-gold/[0.04]"
          : "border-white/10 bg-white/[0.025]"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.22em] text-white/40">
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
      className={`rounded-[1.5rem] border p-5 ${
        highlighted
          ? "border-gold/30 bg-gold/[0.06]"
          : "border-white/10 bg-black/20"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.22em] text-white/35">
        {label}
      </p>
      <p className="mt-3 text-4xl font-light">{value}</p>
    </div>
  );
}
