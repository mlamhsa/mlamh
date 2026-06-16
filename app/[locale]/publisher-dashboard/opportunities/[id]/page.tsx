import Link from "next/link";
import PublisherShell from "@/components/publisher/PublisherShell";
import TalentPreviewModal from "@/components/publisher/TalentPreviewModal";
import {
  archiveOpportunityAction,
  closeOpportunityAction,
  restoreOpportunityAction,
} from "@/lib/actions/opportunity-status-actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

function statusLabel(status: string, isRtl: boolean) {
  switch (status) {
    case "draft":
      return isRtl ? "مسودة" : "Draft";
    case "open":
      return isRtl ? "مفتوحة" : "Open";
    case "published":
      return isRtl ? "منشورة" : "Published";
    case "closed":
      return isRtl ? "مغلقة" : "Closed";
    case "archived":
      return isRtl ? "مؤرشفة" : "Archived";
    default:
      return "-";
  }
}

function statusClass(status: string) {
  switch (status) {
    case "draft":
      return "border-white/15 bg-white/5 text-white/50";
    case "open":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
    case "published":
      return "border-blue-400/30 bg-blue-400/10 text-blue-300";
    case "closed":
      return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
    case "archived":
      return "border-red-400/30 bg-red-400/10 text-red-300";
    default:
      return "border-white/15 bg-white/5 text-white/50";
  }
}

/* ===========================
   V2 SMART SCORING
=========================== */
function calculateApplicantScore(talent: any) {
  let score = 0;

  score += (talent.profile_completion || 0) * 0.4;
  score += Math.min((talent.profile_views || 0) / 10, 20);
  score += (talent.experience_years || 0) * 3;

  if (talent.featured) score += 15;

  return score;
}

/* ===========================
   V2 STATUS UI
=========================== */
function applicantStatusClass(status: string) {
  switch (status) {
    case "pending":
      return "border-white/15 bg-white/5 text-white/50";
    case "shortlisted":
      return "border-gold/40 bg-gold/10 text-gold";
    case "accepted":
      return "border-emerald-400/40 bg-emerald-400/10 text-emerald-300";
    case "rejected":
      return "border-red-400/40 bg-red-400/10 text-red-300";
    default:
      return "border-white/15 bg-white/5 text-white/50";
  }
}

export default async function OpportunityDetailsPage({ params }: PageProps) {
  const { locale, id } = await params;
  const isRtl = locale === "ar";

  const authClient = await createServerSupabaseClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user)
    return <p>{isRtl ? "يرجى تسجيل الدخول أولاً" : "Please login first"}</p>;

  const { data: profile } = await adminClient
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile)
    return (
      <p>{isRtl ? "لم يتم العثور على الملف الشخصي" : "Profile not found"}</p>
    );

  const { data: publisher } = await adminClient
    .from("publishers")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!publisher)
    return (
      <p>
        {isRtl
          ? "لم يتم العثور على حساب الناشر"
          : "Publisher account not found"}
      </p>
    );

  const { data: opportunity } = await adminClient
    .from("opportunities")
    .select("*")
    .eq("id", id)
    .eq("publisher_id", publisher.id)
    .maybeSingle();

  if (!opportunity)
    return (
      <p>
        {isRtl
          ? "الفرصة غير موجودة أو لا تملك صلاحية الوصول"
          : "Opportunity not found or access denied"}
      </p>
    );

  /* ===========================
     GET APPLICATIONS + TALENT JOIN
  =========================== */
  const { data: applications } = await adminClient
    .from("opportunity_applications")
    .select(`
      id,
      status,
      created_at,
      talent_id,
      talents:talent_id (
        id,
        name_en,
        name_ar,
        image_url,
        category_en,
        city_en,
        profile_completion,
        profile_views,
        experience_years,
        featured,
        skills
      )
    `)
    .eq("opportunity_id", id)
    .order("created_at", { ascending: false });

  /* ===========================
     RANKING SYSTEM V2 + VISUAL BOOST
  =========================== */
  const rankedApplications = (applications || [])
    .map((app: any) => {
      const talent = app.talents || {};

      let score = calculateApplicantScore(talent);

      if (
        Array.isArray(talent.skills) &&
        Array.isArray(opportunity.skills)
      ) {
        const matchCount = talent.skills.filter((s: string) =>
          opportunity.skills.includes(s)
        ).length;

        const total = opportunity.skills.length || 1;

        score += (matchCount / total) * 20;
      }

      return {
        ...app,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);

  return (
    <PublisherShell locale={locale} isRtl={isRtl}>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div>
            <Link
              href={`/${locale}/publisher-dashboard/opportunities`}
              className="text-sm text-gold underline underline-offset-4"
            >
              {isRtl ? "← العودة إلى الفرص" : "← Back to Opportunities"}
            </Link>

            <p className="text-xs uppercase tracking-[0.35em] text-gold mt-6">
              {isRtl ? "تفاصيل الفرصة" : "Opportunity Details"}
            </p>

            <h1 className="mt-2 text-4xl font-light text-white">
              {opportunity.title}
            </h1>
          </div>
        </div>

        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${statusClass(
              opportunity.status
            )}`}
          >
            {statusLabel(opportunity.status, isRtl)}
          </span>
        </div>

        {/* ===========================
            APPLICANTS (V2 VISUALIZED)
        =========================== */}
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5">
          {rankedApplications.length > 0 ? (
            <div className="divide-y divide-white/10">
              {rankedApplications.map((app: any, index: number) => {
                const talent = app.talents;
                const isTop = index < 3;

                return (
                  <div
                    key={app.id}
                    className={`grid lg:grid-cols-[2fr_0.8fr] gap-5 p-5 hover:bg-white/[0.03] ${
                      isTop ? "border border-gold/20 bg-gold/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={talent?.image_url}
                        className="w-12 h-12 rounded-full object-cover"
                      />

                      <div>
                        <p className="text-white font-light flex items-center gap-2">
                          {talent?.name_en || talent?.name_ar || "Unknown"}

                          {isTop && (
                            <span className="text-xs text-gold">
                              ⭐ Top Match
                            </span>
                          )}
                        </p>

                        <TalentPreviewModal talent={talent} />

                        <p className="text-xs text-white/50">
                          {talent?.category_en} • {talent?.city_en}
                        </p>

                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-gold font-bold">
                            {app.score?.toFixed(0)}
                          </span>

                          <div className="h-1 w-20 bg-white/10 rounded">
                            <div
                              className="h-1 bg-gold rounded"
                              style={{
                                width: `${Math.min(app.score || 0, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${applicantStatusClass(
                          app.status ?? "pending"
                        )}`}
                      >
                        {statusLabel(app.status ?? "pending", isRtl)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-10 text-white/50 text-center">
              {isRtl ? "لا يوجد متقدمون بعد" : "No applicants yet"}
            </div>
          )}
        </section>
      </div>
    </PublisherShell>
  );
}