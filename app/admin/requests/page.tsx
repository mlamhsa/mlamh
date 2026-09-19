import Link from "next/link";
import {
  AdminActionButton,
  AdminBadge,
  AdminCard,
  AdminEmptyState,
  AdminGrid,
  AdminInfoGrid,
  AdminInfoItem,
  AdminPageContainer,
  AdminPageHeader,
} from "@/components/admin/ui";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { updateTalentRequestStatusAction } from "@/lib/actions/update-talent-request-status";
import { TalentRequestService } from "@/lib/services/requests/TalentRequestService";

export const metadata = {
  title: "MLAMH Admin — Requests",
  robots: { index: false, follow: false },
};

function normalizeTalent(
  value:
    | {
        id: number;
        name_en: string | null;
        name_ar: string | null;
        slug: string | null;
      }
    | {
        id: number;
        name_en: string | null;
        name_ar: string | null;
        slug: string | null;
      }[]
    | null
) {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function formatDate(value: string, isArabic: boolean) {
  return new Date(value).toLocaleString(isArabic ? "ar-SA-u-ca-gregory-nu-latn" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusVariant(status: string) {
  switch (status) {
    case "closed":
      return "success";
    case "contacted":
      return "gold";
    default:
      return "info";
  }
}

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  await requireAdminAccess();
  const params = await searchParams;
  const language: "ar" | "en" = params.lang === "en" ? "en" : "ar";
  const isArabic = language === "ar";

  const requests = await TalentRequestService.getAll();

  return (
    <div dir={isArabic ? "rtl" : "ltr"}>
      <AdminPageContainer>
        <AdminPageHeader
          eyebrow={isArabic ? "طلبات قديمة" : "LEGACY REQUESTS"}
          title={isArabic ? "طلبات العملاء" : "Client Requests"}
          description={
            isArabic
              ? "مراجعة طلبات العملاء القديمة ومتابعة حالتها وربطها بالمواهب عند توفر ملف مرتبط."
              : "Review legacy client requests, track their status, and open linked talent profiles when available."
          }
        />

      {requests.length === 0 ? (
        <AdminEmptyState message={isArabic ? "لا توجد طلبات عملاء حاليًا." : "No client requests yet."} />
      ) : (
        <AdminGrid>
          {requests.map((request) => {
            const talent = normalizeTalent(request.talents);

            return (
              <AdminCard key={request.id}>
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
                        {isArabic ? "طلب" : "Request"} #{request.id}
                      </p>

                      <AdminBadge variant={getStatusVariant(request.status)}>
                        {request.status}
                      </AdminBadge>
                    </div>

                    <h2 className="mt-2 text-2xl font-light text-white">
                      {request.full_name}
                    </h2>

                    <p className="mt-1 text-sm text-white/50">
                      {request.company || (isArabic ? "بدون جهة" : "No company")}
                    </p>
                  </div>

                  <p className="text-sm text-gray-muted">
                    {formatDate(request.created_at, isArabic)}
                  </p>
                </div>

                <AdminInfoGrid columns={2}>
                  <AdminInfoItem
                    label={isArabic ? "الموهبة" : "Talent"}
                    value={
                      talent
                        ? `${talent.name_en || "Unnamed"} / ${
                            talent.name_ar || "—"
                          }`
                        : "—"
                    }
                  />

                  <AdminInfoItem label={isArabic ? "البريد الإلكتروني" : "Email"} value={request.email} />

                  <AdminInfoItem label={isArabic ? "الجوال" : "Phone"} value={request.phone || "—"} />

                  <AdminInfoItem
                    label={isArabic ? "نوع المشروع" : "Project Type"}
                    value={request.project_type || "—"}
                  />

                  <AdminInfoItem label={isArabic ? "الميزانية" : "Budget"} value={request.budget || "—"} />

                  <AdminInfoItem
                    label={isArabic ? "تاريخ المشروع" : "Project Date"}
                    value={request.project_date || "—"}
                  />

                  <div className="md:col-span-2">
                    <p className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
                      {isArabic ? "التفاصيل" : "Details"}
                    </p>

                    <p className="mt-1 whitespace-pre-line text-white/80">
                      {request.project_details || "—"}
                    </p>
                  </div>
                </AdminInfoGrid>

                <div className="mt-6 flex flex-wrap gap-3">
                  <form action={updateTalentRequestStatusAction}>
                    <input type="hidden" name="id" value={request.id} />
                    <input type="hidden" name="status" value="new" />

                    <AdminActionButton type="submit" variant="info">
                      {isArabic ? "جديد" : "New"}
                    </AdminActionButton>
                  </form>

                  <form action={updateTalentRequestStatusAction}>
                    <input type="hidden" name="id" value={request.id} />
                    <input type="hidden" name="status" value="contacted" />

                    <AdminActionButton type="submit" variant="gold">
                      {isArabic ? "تم التواصل" : "Contacted"}
                    </AdminActionButton>
                  </form>

                  <form action={updateTalentRequestStatusAction}>
                    <input type="hidden" name="id" value={request.id} />
                    <input type="hidden" name="status" value="closed" />

                    <AdminActionButton type="submit" variant="success">
                      {isArabic ? "مغلق" : "Closed"}
                    </AdminActionButton>
                  </form>

                  {talent?.slug ? (
                    <Link
                      href={`/${language}/talent/${talent.slug}`}
                      target="_blank"
                      className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-white/60 transition hover:border-gold/40 hover:text-gold"
                    >
                      {isArabic ? "عرض الموهبة" : "View Talent"}
                    </Link>
                  ) : null}
                </div>
              </AdminCard>
            );
          })}
        </AdminGrid>
      )}
      </AdminPageContainer>
    </div>
  );
}