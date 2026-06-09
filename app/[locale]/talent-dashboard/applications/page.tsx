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

function getOpportunityCity(opportunity: any, locale: string) {
  return locale === "ar"
    ? opportunity?.city_ar ?? opportunity?.city_en ?? "-"
    : opportunity?.city_en ?? opportunity?.city_ar ?? "-";
}

export default async function TalentRequestsPage({ params }: PageProps) {
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

  console.log("USER ID:", user.id);

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

  console.log("PROFILE ID:", profile.id);

  const { data: talent } = await adminClient
    .from("talents")
    .select("id, slug, name_ar, name_en, profile_id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  console.log("TALENT:", talent);

  if (!talent) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-gold">
            {isRtl ? "طلباتي" : "My Applications"}
          </p>

          <h1 className="mt-5 text-4xl font-light">
            {isRtl
              ? "لم يتم العثور على بروفايل موهبة"
              : "Talent profile not found"}
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-7 text-white/45">
            {isRtl
              ? "يجب إنشاء بروفايل موهبة قبل متابعة الطلبات."
              : "You need to create a talent profile before tracking applications."}
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

  console.log("TALENT ID USED:", talent.id);

  const { data: allAppsDebug } = await adminClient
    .from("opportunity_applications")
    .select("id, talent_id, status, opportunity_id, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  console.log("ALL APPLICATIONS DEBUG:", allAppsDebug);

  const { data: applications } = await adminClient
    .from("opportunity_applications")
    .select(
      `
      id,
      status,
      created_at,
      opportunity_id,
      talent_id,
      opportunities (
        id,
        title,
        slug,
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

  console.log("APPLICATIONS:", applications);

  const allApplications = applications ?? [];

  const totalApplications = allApplications.length;

  const pendingCount = allApplications.filter(
    (item: any) => normalizeStatus(item.status) === "pending"
  ).length;

  const reviewingCount = allApplications.filter(
    (item: any) => normalizeStatus(item.status) === "reviewing"
  ).length;

  const shortlistedCount = allApplications.filter(
    (item: any) => normalizeStatus(item.status) === "shortlisted"
  ).length;

  const acceptedCount = allApplications.filter(
    (item: any) => normalizeStatus(item.status) === "accepted"
  ).length;

  const rejectedCount = allApplications.filter(
    (item: any) => normalizeStatus(item.status) === "rejected"
  ).length;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 md:py-14">
        <div className="mb-8 flex flex-col justify-between gap-5 border-b border-white/10 pb-8 md:flex-row md:items-end">
          <div>
            <Link
              href={`/${locale}/talent-dashboard`}
              className="text-sm text-gold underline underline-offset-4"
            >
              {isRtl ? "← العودة للوحة الموهبة" : "← Back to dashboard"}
            </Link>

            <p className="mt-8 text-xs uppercase tracking-[0.35em] text-gold">
              {isRtl ? "طلباتي" : "My Applications"}
            </p>

            <h1 className="mt-3 text-4xl font-light text-white">
              {isRtl ? "متابعة الطلبات" : "Track Applications"}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">
              {isRtl
                ? "تابع حالة كل فرصة قدمت عليها، من المراجعة وحتى القبول أو الرفض."
                : "Track every opportunity you applied to, from review to acceptance or rejection."}
            </p>
          </div>

          <Link
            href={`/${locale}/opportunities`}
            className="border border-gold bg-gold/10 px-5 py-3 text-xs uppercase tracking-[0.2em] text-gold transition hover:bg-gold hover:text-black"
          >
            {isRtl ? "استعراض الفرص" : "Browse Opportunities"}
          </Link>
        </div>

        <section className="grid gap-4 md:grid-cols-6">
          <StatCard label={isRtl ? "الإجمالي" : "Total"} value={totalApplications} highlighted />
          <StatCard label={isRtl ? "جديد" : "Pending"} value={pendingCount} />
          <StatCard label={isRtl ? "قيد المراجعة" : "Reviewing"} value={reviewingCount} />
          <StatCard label={isRtl ? "مختصر" : "Shortlisted"} value={shortlistedCount} />
          <StatCard label={isRtl ? "مقبول" : "Accepted"} value={acceptedCount} />
          <StatCard label={isRtl ? "مرفوض" : "Rejected"} value={rejectedCount} />
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 md:p-6">
          {allApplications.length > 0 ? (
            <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
              <div className="hidden grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr] border-b border-white/10 bg-white/[0.03] px-5 py-4 text-xs uppercase tracking-[0.22em] text-white/35 lg:grid">
                <div>{isRtl ? "الفرصة" : "Opportunity"}</div>
                <div>{isRtl ? "المدينة" : "City"}</div>
                <div>{isRtl ? "الحالة" : "Status"}</div>
                <div>{isRtl ? "تاريخ التقديم" : "Applied"}</div>
              </div>

              <div className="divide-y divide-white/10">
                {allApplications.map((application: any) => {
                  const opportunity = Array.isArray(application.opportunities)
                    ? application.opportunities[0]
                    : application.opportunities;

                  return (
                    <article
                      key={application.id}
                      className="grid gap-5 bg-black/20 p-5 transition hover:bg-white/[0.03] lg:grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr] lg:items-center"
                    >
                      <div>
                        <p className="text-xl font-light text-white">
                          {opportunity?.title ?? "-"}
                        </p>

                        <p className="mt-2 text-sm text-white/40">
                          {opportunity?.opportunity_type
                            ? String(opportunity.opportunity_type).replaceAll("_", " ")
                            : "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-white/55">
                          {getOpportunityCity(opportunity, locale)}
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

                      <div>
                        <p className="text-sm text-white/55">
                          {formatDate(application.created_at, locale)}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 p-10 text-center text-white/40">
              {isRtl
                ? "لم تقدم على أي فرصة حتى الآن."
                : "You have not applied to any opportunity yet."}
            </div>
          )}
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
      className={`rounded-[1.5rem] border p-5 ${
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