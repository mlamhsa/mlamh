import {
  approveTalentClaimAction,
  rejectTalentClaimAction,
} from "@/lib/actions/admin-claim-requests";
import {
  AdminActionButton,
  AdminBadge,
  AdminCard,
  AdminEmptyState,
  AdminInfoGrid,
  AdminInfoItem,
  AdminPageContainer,
  AdminPageHeader,
} from "@/components/admin/ui";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { ClaimService } from "@/lib/services/claims/ClaimService";

export const metadata = {
  title: "MLAMH Admin — Claim Requests",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function normalizeTalent(
  value:
    | {
        id: number;
        name_en: string | null;
        name_ar: string | null;
        image_url: string | null;
      }
    | {
        id: number;
        name_en: string | null;
        name_ar: string | null;
        image_url: string | null;
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

function getBadgeVariant(status: string) {
  switch (status) {
    case "approved":
      return "success";
    case "rejected":
      return "danger";
    default:
      return "gold";
  }
}

export default async function AdminClaimRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  await requireAdminAccess();
  const params = await searchParams;
  const language: "ar" | "en" = params.lang === "en" ? "en" : "ar";
  const isArabic = language === "ar";

  const requests = await ClaimService.getAll();

  return (
    <div dir={isArabic ? "rtl" : "ltr"}>
      <AdminPageContainer>
        <AdminPageHeader
          eyebrow={isArabic ? "طلبات قديمة" : "LEGACY REQUESTS"}
          title={isArabic ? "طلبات ملكية الملفات" : "Talent Claim Requests"}
          description={
            isArabic
              ? "مراجعة طلبات ربط الحسابات بملفات المواهب الموجودة واتخاذ قرار الاعتماد."
              : "Review requests to connect user accounts with existing talent profiles."
          }
        />

      {!requests || requests.length === 0 ? (
        <AdminEmptyState message={isArabic ? "لا توجد طلبات ملكية ملفات حاليًا." : "No claim requests yet."} />
      ) : (
        <section className="grid gap-5">
          {requests.map((request) => {
            const talent = normalizeTalent(request.talents);

            return (
              <AdminCard key={request.id}>
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
                        {isArabic ? "طلب" : "Claim"} #{request.id}
                      </p>

                      <AdminBadge variant={getBadgeVariant(request.status)}>
                        {request.status}
                      </AdminBadge>
                    </div>

                    <h2 className="mt-2 text-2xl font-light text-white">
                      {(isArabic ? talent?.name_ar || talent?.name_en : talent?.name_en || talent?.name_ar) || (isArabic ? "موهبة غير معروفة" : "Unknown Talent")}
                    </h2>

                    <p
                      className="mt-1 text-lg text-white/50"
                      dir="rtl"
                      style={{ fontFamily: "var(--font-noto-arabic)" }}
                    >
                      {talent?.name_ar || "—"}
                    </p>
                  </div>

                  <p className="text-sm text-gray-muted">
                    {formatDate(request.created_at, isArabic)}
                  </p>
                </div>

                <AdminInfoGrid columns={2}>
                  <AdminInfoItem label={isArabic ? "معرّف الموهبة" : "Talent ID"} value={request.talent_id} />
                  <AdminInfoItem label={isArabic ? "معرّف المستخدم" : "User ID"} value={request.user_id} />
                </AdminInfoGrid>

                {request.status === "pending" ? (
                  <div className="mt-6 flex flex-wrap gap-3">
                    <form action={approveTalentClaimAction}>
                      <input type="hidden" name="id" value={request.id} />

                      <AdminActionButton type="submit" variant="success">
                        {isArabic ? "اعتماد" : "Approve"}
                      </AdminActionButton>
                    </form>

                    <form action={rejectTalentClaimAction}>
                      <input type="hidden" name="id" value={request.id} />

                      <AdminActionButton type="submit" variant="danger">
                        {isArabic ? "رفض" : "Reject"}
                      </AdminActionButton>
                    </form>
                  </div>
                ) : null}
              </AdminCard>
            );
          })}
        </section>
      )}
      </AdminPageContainer>
    </div>
  );
}