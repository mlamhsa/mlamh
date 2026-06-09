import Link from "next/link";
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
  if (normalized === "shortlisted") return isRtl ? "مختصر" : "Shortlisted";
  if (normalized === "accepted") return isRtl ? "مقبول" : "Accepted";
  if (normalized === "rejected") return isRtl ? "مرفوض" : "Rejected";

  return isRtl ? "جديد" : "Pending";
}

function statusClass(status?: string | null) {
  const normalized = normalizeStatus(status);

  if (normalized === "reviewing") {
    return "border-blue-400/30 bg-blue-400/10 text-blue-300";
  }

  if (normalized === "shortlisted") {
    return "border-gold/30 bg-gold/10 text-gold";
  }

  if (normalized === "accepted") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  if (normalized === "rejected") {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
}

function formatDate(value?: string | null, locale = "en") {
  if (!value) return "-";

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
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

  const { data: profile } = await adminClient
    .from("profiles")
    .select("id, display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    return (
      <main className="min-h-screen bg-black p-10 text-white">
        <p>{isRtl ? "لم يتم العثور على الملف الشخصي" : "Profile not found"}</p>
      </main>
    );
  }

  const { data: talent } = await adminClient
    .from("talents")
    .select("id, slug, name_ar, name_en, image_url, city_ar, city_en")
    .eq("profile_id", profile.id)
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
              ? "يجب إنشاء بروفايل موهبة قبل استخدام لوحة التحكم ومتابعة الطلبات."
              : "You need to create a talent profile before using the dashboard and tracking applications."}
          </p>

          <Link
            href={`/${locale}/talent/register`}
            className="mt-8 border border-gold bg-gold/10 px-6 py-4 text-xs uppercase tracking-[0.22em] text-gold transition hover:bg-gold hover:text-black"
          >
            {isRtl ? "إنشاء بروفايل موهبة" : "Create Talent Profile"}
          </Link>
        </div>
      </main>
    );
  }

  const { data: applications } = await adminClient
    .from("opportunity_applications")
    .select(
      `
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
    `
    )
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
      ? talent.name_ar ?? talent.name_en ?? profile.display_name ?? "موهبة"
      : talent.name_en ?? talent.name_ar ?? profile.display_name ?? "Talent";

  const talentCity =
    locale === "ar"
      ? talent.city_ar ?? talent.city_en ?? "-"
      : talent.city_en ?? talent.city_ar ?? "-";
      const { data: latestOpportunities } = await adminClient
      .from("opportunities")
      .select("id, slug, title, city_ar, city_en, opportunity_type, created_at")
      .order("created_at", { ascending: false })
      .limit(5);
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 md:py-14">
        <div className="mb-8 flex flex-col justify-between gap-5 border-b border-white/10 pb-8 md:flex-row md:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-gold">
              {isRtl ? "لوحة الموهبة" : "Talent Dashboard"}
            </p>

            <h1 className="mt-3 text-4xl font-light text-white">
              {isRtl ? "مرحباً" : "Welcome"}, {talentName}
            </h1>

            <p className="mt-3 text-sm text-white/45">
              {talentCity}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/${locale}/opportunities`}
              className="border border-gold bg-gold/10 px-5 py-3 text-xs uppercase tracking-[0.2em] text-gold transition hover:bg-gold hover:text-black"
            >
              {isRtl ? "استعراض الفرص" : "Browse Opportunities"}
            </Link>

            <Link
              href={`/${locale}/talent/${talent.slug ?? talent.id}`}
              className="border border-white/15 px-5 py-3 text-xs uppercase tracking-[0.2em] text-white/60 transition hover:border-white hover:text-white"
            >
              {isRtl ? "عرض البروفايل" : "View Profile"}
            </Link>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-5">
          <StatCard
            label={isRtl ? "إجمالي الطلبات" : "Total"}
            value={totalApplications}
            highlighted
          />
          <StatCard label={isRtl ? "جديد" : "Pending"} value={counts.pending ?? 0} />
          <StatCard
            label={isRtl ? "قيد المراجعة" : "Reviewing"}
            value={counts.reviewing ?? 0}
          />
          <StatCard
            label={isRtl ? "مختصر" : "Shortlisted"}
            value={counts.shortlisted ?? 0}
          />
          <StatCard
            label={isRtl ? "مقبول" : "Accepted"}
            value={counts.accepted ?? 0}
          />
        </section>
        <section className="mt-8 rounded-[2rem] border border-gold/20 bg-gold/[0.04] p-6">
  <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
    <div>
      <p className="text-xs uppercase tracking-[0.35em] text-gold">
        {isRtl ? "الفرص المتاحة" : "Available Opportunities"}
      </p>

      <h2 className="mt-3 text-3xl font-light text-white">
        {isRtl ? "استعرض الفرص المناسبة لك" : "Browse opportunities made for you"}
      </h2>

      <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">
        {isRtl
          ? "اطلع على الفرص المنشورة من الناشرين وقدّم على المناسب منها."
          : "Explore published opportunities from publishers and apply to suitable ones."}
      </p>
    </div>

    <Link
      href={`/${locale}/opportunities`}
      className="shrink-0 border border-gold bg-gold/10 px-6 py-4 text-xs uppercase tracking-[0.22em] text-gold transition hover:bg-gold hover:text-black"
    >
      {isRtl ? "استعراض الفرص" : "Browse Opportunities"}
    </Link>
  </div>
</section>
<section className="mt-8 rounded-[2rem] border border-gold/20 bg-gold/[0.04] p-6">
  <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
    <div>
      <p className="text-xs uppercase tracking-[0.35em] text-gold">
        {isRtl ? "الفرص المتاحة" : "Available Opportunities"}
      </p>

      <h2 className="mt-3 text-3xl font-light text-white">
        {isRtl ? "آخر الفرص" : "Latest Opportunities"}
      </h2>
    </div>

    <Link
      href={`/${locale}/opportunities`}
      className="border border-gold bg-gold/10 px-5 py-3 text-xs uppercase tracking-[0.2em] text-gold transition hover:bg-gold hover:text-black"
    >
      {isRtl ? "عرض الكل" : "View All"}
    </Link>
  </div>

  {latestOpportunities && latestOpportunities.length > 0 ? (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {latestOpportunities.map((opportunity: any) => {
        const city =
          locale === "ar"
            ? opportunity.city_ar ?? opportunity.city_en ?? "-"
            : opportunity.city_en ?? opportunity.city_ar ?? "-";

        return (
          <Link
            key={opportunity.id}
            href={`/${locale}/opportunities/${opportunity.slug ?? opportunity.id}`}
            className="block rounded-[1.5rem] border border-white/10 bg-black/20 p-5 transition hover:border-gold/40 hover:bg-gold/[0.04]"
          >
            <p className="text-lg font-light text-white">
              {opportunity.title ?? "-"}
            </p>

            <p className="mt-3 text-sm text-white/45">
              {city} ·{" "}
              {opportunity.opportunity_type
                ? String(opportunity.opportunity_type).replaceAll("_", " ")
                : "-"}
            </p>

            <p className="mt-5 text-xs uppercase tracking-[0.2em] text-gold">
              {isRtl ? "عرض الفرصة" : "View Opportunity"}
            </p>
          </Link>
        );
      })}
    </div>
  ) : (
    <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 p-8 text-center text-white/40">
      {isRtl ? "لا توجد فرص متاحة حالياً." : "No opportunities available currently."}
    </div>
  )}
</section>
        <section className="mt-8 grid gap-8 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 md:p-6">
            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-gold">
                  {isRtl ? "آخر الطلبات" : "Recent Applications"}
                </p>

                <h2 className="mt-3 text-3xl font-light">
                  {isRtl ? "طلباتك الأخيرة" : "Your Recent Applications"}
                </h2>
              </div>

              <Link
                href={`/${locale}/talent-dashboard/applications`}
                className="border border-white/15 px-5 py-3 text-xs uppercase tracking-[0.2em] text-white/60 transition hover:border-gold/50 hover:text-gold"
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

                  const opportunityCity =
                    locale === "ar"
                      ? opportunity?.city_ar ?? opportunity?.city_en ?? "-"
                      : opportunity?.city_en ?? opportunity?.city_ar ?? "-";

                  return (
                    <article
                      key={application.id}
                      className="grid gap-5 bg-black/20 p-5 transition hover:bg-white/[0.03] md:grid-cols-[1.4fr_0.7fr_0.7fr]"
                    >
                      <div>
                        <p className="text-xl font-light text-white">
                          {opportunity?.title ?? "-"}
                        </p>

                        <p className="mt-2 text-sm text-white/40">
                          {opportunityCity} ·{" "}
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
                {isRtl
                  ? "لم تقدم على أي فرصة حتى الآن."
                  : "You have not applied to any opportunity yet."}
              </div>
            )}
          </div>

          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 md:p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-gold">
              {isRtl ? "إجراءات سريعة" : "Quick Actions"}
            </p>

            <div className="mt-6 grid gap-3">
              <QuickAction
                href={`/${locale}/opportunities`}
                title={isRtl ? "استعراض الفرص" : "Browse Opportunities"}
                description={
                  isRtl
                    ? "ابحث عن فرص مناسبة وقدّم عليها."
                    : "Find suitable opportunities and apply."
                }
              />

              <QuickAction
                href={`/${locale}/talent-dashboard/applications`}
                title={isRtl ? "طلباتي" : "My Applications"}
                description={
                  isRtl
                    ? "تابع حالة جميع طلباتك."
                    : "Track all your application statuses."
                }
              />

              <QuickAction
                href={`/${locale}/talent/${talent.slug ?? talent.id}`}
                title={isRtl ? "بروفايلي العام" : "Public Profile"}
                description={
                  isRtl
                    ? "راجع كيف يظهر بروفايلك للناشرين."
                    : "Review how publishers see your profile."
                }
              />
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function StatCard({
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
      className={`rounded-[1.75rem] border p-5 ${
        highlighted
          ? "border-gold/20 bg-gold/[0.04]"
          : "border-white/10 bg-white/[0.025]"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.22em] text-white/40">
        {label}
      </p>
      <p className="mt-3 text-4xl font-light text-white">{value}</p>
    </div>
  );
}

function QuickAction({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-[1.25rem] border border-white/10 bg-black/20 p-4 transition hover:border-gold/40 hover:bg-gold/[0.04]"
    >
      <p className="text-sm text-white">{title}</p>
      <p className="mt-2 text-xs leading-6 text-white/40">{description}</p>
    </Link>
  );
}