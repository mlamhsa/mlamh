import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  AdminCard,
  AdminEmptyState,
  AdminPageContainer,
  AdminPageHeader,
  AdminStatCard,
} from "@/components/admin/ui";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
};

type InvitationRow = {
  id: number;
  status: string | null;
  created_at: string | null;
  read_at: string | null;
  applied_at: string | null;
  talents:
    | {
        id: number;
        slug: string | null;
        image_url: string | null;
        name_ar: string | null;
        name_en: string | null;
        city_ar: string | null;
        gender: string | null;
      }
    | {
        id: number;
        slug: string | null;
        image_url: string | null;
        name_ar: string | null;
        name_en: string | null;
        city_ar: string | null;
        gender: string | null;
      }[]
    | null;
};

function formatDate(value: string | null, isArabic: boolean) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(
    isArabic ? "ar-SA-u-ca-gregory-nu-latn" : "en-US",
    { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" },
  ).format(date);
}

function statusLabel(status: string | null, isArabic: boolean) {
  const labels: Record<string, { ar: string; en: string }> = {
    pending: { ar: "مرسلة", en: "Sent" },
    sent: { ar: "مرسلة", en: "Sent" },
    read: { ar: "مقروءة", en: "Read" },
    viewed: { ar: "مقروءة", en: "Read" },
    applied: { ar: "تم التقديم", en: "Applied" },
    declined: { ar: "مرفوضة من الموهبة", en: "Declined" },
    expired: { ar: "منتهية", en: "Expired" },
    cancelled: { ar: "ملغاة", en: "Cancelled" },
  };
  const key = String(status ?? "pending").toLowerCase();
  return labels[key] ? (isArabic ? labels[key].ar : labels[key].en) : key;
}

function statusClass(status: string | null) {
  const key = String(status ?? "pending").toLowerCase();
  if (key === "applied") return "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300";
  if (key === "declined" || key === "cancelled" || key === "expired") {
    return "border-red-400/20 bg-red-400/[0.06] text-red-300";
  }
  if (key === "read" || key === "viewed") return "border-blue-400/20 bg-blue-400/[0.06] text-blue-300";
  return "border-gold/20 bg-gold/[0.06] text-gold";
}

export default async function AdminOpportunityInvitationsPage({
  params,
  searchParams,
}: PageProps) {
  await requireAdminAccess();

  const [{ id }, query] = await Promise.all([params, searchParams]);
  const opportunityId = Number(id);
  const language: "ar" | "en" = query.lang === "en" ? "en" : "ar";
  const isArabic = language === "ar";

  if (!Number.isInteger(opportunityId) || opportunityId <= 0) notFound();

  const adminClient = createAdminClient();

  const { data: opportunity, error: opportunityError } = await adminClient
    .from("opportunities")
    .select("id,title,status,published")
    .eq("id", opportunityId)
    .maybeSingle();

  if (opportunityError) {
    throw new Error(`[AdminOpportunityInvitationsPage opportunity] ${opportunityError.message}`);
  }
  if (!opportunity) notFound();

  const { data: invitations, error: invitationsError } = await adminClient
    .from("opportunity_invitations")
    .select(`
      id,
      status,
      created_at,
      read_at,
      applied_at,
      talents (
        id,
        slug,
        image_url,
        name_ar,
        name_en,
        city_ar,
        gender
      )
    `)
    .eq("opportunity_id", opportunityId)
    .order("created_at", { ascending: false });

  if (invitationsError) {
    throw new Error(`[AdminOpportunityInvitationsPage invitations] ${invitationsError.message}`);
  }

  const invitationList = (invitations ?? []) as InvitationRow[];
  const readCount = invitationList.filter((item) => Boolean(item.read_at)).length;
  const appliedCount = invitationList.filter(
    (item) => Boolean(item.applied_at) || String(item.status).toLowerCase() === "applied",
  ).length;

  return (
    <div dir={isArabic ? "rtl" : "ltr"}>
      <AdminPageContainer>
        <AdminPageHeader
          eyebrow={isArabic ? "الفرص" : "OPPORTUNITIES"}
          title={isArabic ? "دعوات الفرصة" : "Opportunity invitations"}
          description={
            isArabic
              ? `${opportunity.title || "فرصة بدون عنوان"} — متابعة الدعوات وحالة القراءة والتقديم لكل موهبة.`
              : `${opportunity.title || "Untitled opportunity"} — Track invitation delivery, reads, and applications by talent.`
          }
          actions={
            <Link
              href={`/admin/opportunities/${opportunity.id}?lang=${language}`}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-white/[0.08] px-4 text-xs font-medium text-white/55 transition hover:border-gold/20 hover:text-gold"
            >
              {isArabic ? "العودة إلى الفرصة" : "Back to opportunity"}
            </Link>
          }
        />

        <section className="mb-5 grid gap-3 sm:grid-cols-3">
          <AdminStatCard
            label={isArabic ? "إجمالي الدعوات" : "Total invitations"}
            value={invitationList.length}
          />
          <AdminStatCard
            label={isArabic ? "تمت قراءتها" : "Read"}
            value={readCount}
            active={readCount > 0}
          />
          <AdminStatCard
            label={isArabic ? "تحولت إلى تقديم" : "Applied"}
            value={appliedCount}
            active={appliedCount > 0}
          />
        </section>

        {invitationList.length === 0 ? (
          <AdminEmptyState
            message={
              isArabic
                ? "لم يتم إرسال دعوات لمواهب لهذه الفرصة حتى الآن."
                : "No talent invitations have been sent for this opportunity yet."
            }
          />
        ) : (
          <AdminCard className="overflow-hidden">
            <div className="divide-y divide-white/[0.055]">
              {invitationList.map((invitation) => {
                const talent = Array.isArray(invitation.talents)
                  ? invitation.talents[0]
                  : invitation.talents;
                const talentName =
                  (isArabic
                    ? talent?.name_ar || talent?.name_en
                    : talent?.name_en || talent?.name_ar) ||
                  (isArabic ? "موهبة غير معروفة" : "Unknown talent");

                return (
                  <div
                    key={invitation.id}
                    className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/[0.08] bg-black/20">
                        {talent?.image_url ? (
                          <Image
                            src={talent.image_url}
                            alt={talentName}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium text-white/80">{talentName}</p>
                          <span className={`rounded-lg border px-2 py-1 text-[9px] font-medium ${statusClass(invitation.status)}`}>
                            {statusLabel(invitation.status, isArabic)}
                          </span>
                        </div>
                        <p className="mt-1 text-[10px] text-white/30">
                          {talent?.city_ar || "—"} · {talent?.gender || "—"} · #{invitation.id}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-2 text-[10px] text-white/38 sm:grid-cols-3 sm:text-end">
                      <div>
                        <p className="text-white/22">{isArabic ? "أرسلت" : "Sent"}</p>
                        <p className="mt-1">{formatDate(invitation.created_at, isArabic)}</p>
                      </div>
                      <div>
                        <p className="text-white/22">{isArabic ? "قُرئت" : "Read"}</p>
                        <p className="mt-1">{formatDate(invitation.read_at, isArabic)}</p>
                      </div>
                      <div>
                        <p className="text-white/22">{isArabic ? "تم التقديم" : "Applied"}</p>
                        <p className="mt-1">{formatDate(invitation.applied_at, isArabic)}</p>
                      </div>
                    </div>

                    {talent?.id ? (
                      <Link
                        href={`/admin/talents/${talent.id}?lang=${language}`}
                        className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] px-3 text-[10px] font-medium text-white/50 transition hover:border-gold/20 hover:text-gold"
                      >
                        {isArabic ? "مراجعة الموهبة" : "Review talent"}
                      </Link>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </AdminCard>
        )}
      </AdminPageContainer>
    </div>
  );
}
