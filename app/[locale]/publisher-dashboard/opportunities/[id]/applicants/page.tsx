import Link from "next/link";
import PublisherShell from "@/components/publisher/PublisherShell";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePublisher } from "@/lib/auth/require-publisher";
import { updateApplicationStatusAction } from "@/lib/actions/application-status-actions";
import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{
    locale: string;
    id: string;
  }>;
};

export default async function ApplicantsPage({ params }: PageProps) {
  const { locale, id } = await params;
  const isRtl = locale === "ar";

  const { publisher } = await requirePublisher(locale);
  const adminClient = createAdminClient();

  const { data: opportunity } = await adminClient
    .from("opportunities")
    .select("id, title")
    .eq("id", id)
    .eq("publisher_id", publisher.id)
    .maybeSingle();

  if (!opportunity) {
    return (
      <main className="min-h-screen bg-black p-10 text-white">
        <p>{isRtl ? "الفرصة غير موجودة أو لا تملك صلاحية الوصول" : "Opportunity not found or access denied"}</p>
      </main>
    );
  }

  const { data: applications } = await adminClient
    .from("opportunity_applications")
    .select("id, status, talent_id, created_at")
    .eq("opportunity_id", id)
    .order("created_at", { ascending: false });

  const talentIds = Array.from(
    new Set((applications ?? []).map((app) => app.talent_id).filter(Boolean))
  );

  const { data: talents } =
    talentIds.length > 0
      ? await adminClient
          .from("profiles")
          .select("id, display_name, city, slug")
          .in("id", talentIds)
      : { data: [] };

  const getTalent = (talentId: string) => talents?.find((t) => t.id === talentId);

  return (
    <PublisherShell locale={locale} isRtl={isRtl}>
      <div className="space-y-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <Link
              href={`/${locale}/publisher-dashboard/opportunities`}
              className="text-sm text-gold underline underline-offset-4"
            >
              {isRtl ? "← العودة إلى الفرص" : "← Back to opportunities"}
            </Link>
            <p className="mt-8 text-xs uppercase tracking-[0.35em] text-gold">
              {isRtl ? "إدارة المتقدمين" : "Applicants Management"}
            </p>
            <h1 className="mt-4 text-4xl font-light text-white">{opportunity.title}</h1>
          </div>
        </div>

        {/* Stats */}
        <section className="grid gap-4 md:grid-cols-5">
          <StatCard label={isRtl ? "الإجمالي" : "Total"} value={applications?.length ?? 0} />
          <StatCard
            label={isRtl ? "قيد المراجعة" : "Pending"}
            value={(applications?.filter((a) => !a.status || a.status === "pending").length ?? 0)}
          />
          <StatCard
            label={isRtl ? "مختصر" : "Shortlisted"}
            value={(applications?.filter((a) => a.status === "shortlisted").length ?? 0)}
          />
          <StatCard
            label={isRtl ? "مقبول" : "Accepted"}
            value={(applications?.filter((a) => a.status === "accepted").length ?? 0)}
            highlighted
          />
          <StatCard
            label={isRtl ? "مرفوض" : "Rejected"}
            value={(applications?.filter((a) => a.status === "rejected").length ?? 0)}
          />
        </section>

        {/* Applicants Table */}
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 md:p-6">
          {applications && applications.length > 0 ? (
            <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
              <div className="hidden grid-cols-[1.4fr_0.8fr_0.8fr_1.4fr] border-b border-white/10 bg-white/[0.03] px-5 py-4 text-xs uppercase tracking-[0.22em] text-white/35 lg:grid">
                <div>{isRtl ? "الموهبة" : "Talent"}</div>
                <div>{isRtl ? "تاريخ التقديم" : "Applied"}</div>
                <div>{isRtl ? "الحالة" : "Status"}</div>
                <div>{isRtl ? "الإجراءات" : "Actions"}</div>
              </div>
              <div className="divide-y divide-white/10">
                {applications.map((application) => {
                  const talent = getTalent(application.talent_id);
                  const currentStatus = application.status ?? "pending";
                  return (
                    <article
                      key={application.id}
                      className="grid gap-5 bg-black/20 p-5 transition hover:bg-white/[0.03] lg:grid-cols-[1.4fr_0.8fr_0.8fr_1.4fr] lg:items-center"
                    >
                      <div>
                        <h2 className="text-2xl font-light text-white">{talent?.display_name ?? (isRtl ? "موهبة غير معروفة" : "Unknown Talent")}</h2>
                        <div className="mt-3 flex flex-wrap gap-3 text-sm text-white/45">
                          <span>{talent?.city ?? (isRtl ? "لا توجد مدينة" : "No city")}</span>
                        </div>
                        {talent?.slug && (
                          <Link href={`/${locale}/talent/${talent.slug}`} className="mt-3 inline-block text-sm text-gold underline underline-offset-4">
                            {isRtl ? "عرض البروفايل" : "View Profile"}
                          </Link>
                        )}
                      </div>

                      <div>
                        <p className="text-sm text-white/55">{new Date(application.created_at || "").toLocaleDateString(isRtl ? "ar-SA" : "en-US")}</p>
                      </div>

                      <div>
                        <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${statusClass(currentStatus)}`}>
                          {statusLabel(currentStatus, isRtl)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <StatusButton applicationId={application.id} opportunityId={id} locale={locale} status="shortlisted" label={isRtl ? "اختصار" : "Shortlist"} disabled={currentStatus === "shortlisted"} className="border-blue-400/40 text-blue-300 hover:bg-blue-400" />
                        <StatusButton applicationId={application.id} opportunityId={id} locale={locale} status="accepted" label={isRtl ? "قبول" : "Accept"} disabled={currentStatus === "accepted"} className="border-emerald-400/40 text-emerald-300 hover:bg-emerald-400" />
                        <StatusButton applicationId={application.id} opportunityId={id} locale={locale} status="rejected" label={isRtl ? "رفض" : "Reject"} disabled={currentStatus === "rejected"} className="border-red-400/40 text-red-300 hover:bg-red-400" />
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-10 text-white/50">{isRtl ? "لا يوجد متقدمون حتى الآن." : "No applicants yet."}</div>
          )}
        </section>
      </div>
    </PublisherShell>
  );
}

function StatusButton({ applicationId, opportunityId, locale, status, label, disabled, className }: { applicationId: string; opportunityId: string; locale: string; status: string; label: string; disabled: boolean; className: string; }) {
  return (
    <form
      action={async () => {
        "use server";
        await updateApplicationStatusAction(applicationId, status);
      }}
    >
      <input type="hidden" name="applicationId" value={applicationId} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="opportunityId" value={opportunityId} />

      <button type="submit" disabled={disabled} className={`border px-3 py-2 text-xs uppercase tracking-[0.18em] transition hover:text-black disabled:cursor-not-allowed disabled:opacity-40 ${className}`}>
        {label}
      </button>
    </form>
  );
}

function statusLabel(status?: string | null, isRtl = false) {
  switch (status) {
    case "shortlisted":
      return isRtl ? "مختصر" : "Shortlisted";
    case "accepted":
      return isRtl ? "مقبول" : "Accepted";
    case "rejected":
      return isRtl ? "مرفوض" : "Rejected";
    default:
      return isRtl ? "قيد المراجعة" : "Pending";
  }
}

function statusClass(status?: string | null) {
  switch (status) {
    case "shortlisted":
      return "border-blue-400/30 bg-blue-400/10 text-blue-300";
    case "accepted":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
    case "rejected":
      return "border-red-400/30 bg-red-400/10 text-red-300";
    default:
      return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  }
}

function StatCard({ label, value, highlighted = false }: { label: string; value: number; highlighted?: boolean; }) {
  return (
    <div className={`rounded-[1.75rem] border p-5 ${highlighted ? "border-gold/20 bg-gold/[0.04]" : "border-white/10 bg-white/[0.025]"}`}>
      <p className="text-xs uppercase tracking-[0.25em] text-white/40">{label}</p>
      <p className="mt-3 text-4xl font-light text-white">{value}</p>
    </div>
  );
}