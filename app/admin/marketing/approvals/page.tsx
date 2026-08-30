import { AdminCard, AdminPageContainer, AdminPageHeader, AdminStatCard, AdminGrid } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ lang?: string }> };

export default async function MarketingApprovalsPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const { data, error } = await db
    .from("marketing_approvals")
    .select("id,task_id,requested_by_agent_id,approval_level,status,reason,channel,risk_level,expires_at,execute_after,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const approvals = data ?? [];
  const pending = approvals.filter((item) => item.status === "pending").length;
  const ceoOnly = approvals.filter((item) => item.status === "pending" && item.approval_level === "ceo_only").length;
  const highRisk = approvals.filter((item) => item.status === "pending" && ["high", "critical"].includes(item.risk_level)).length;

  return (
    <AdminPageContainer>
      <AdminPageHeader title={isArabic ? "مركز الاعتمادات" : "Approvals Center"} description={isArabic ? "بوابة الحوكمة قبل تنفيذ إجراءات التسويق الحساسة." : "Governance gate for sensitive marketing actions before execution."} />
      {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "جداول Marketing Hub غير مفعلة بعد. لن يتم عرض بيانات افتراضية." : "Marketing Hub tables are not active yet. No mock data will be shown."}</AdminCard> : null}
      <AdminGrid className="mb-6 md:grid-cols-3">
        <AdminStatCard label={isArabic ? "بانتظار الاعتماد" : "Pending"} value={pending} />
        <AdminStatCard label={isArabic ? "CEO فقط" : "CEO Only"} value={ceoOnly} />
        <AdminStatCard label={isArabic ? "مخاطر مرتفعة" : "High Risk"} value={highRisk} />
      </AdminGrid>
      <AdminCard className="overflow-hidden">
        <div className="border-b border-white/10 px-5 py-4 text-sm text-white/60">{isArabic ? "طلبات الاعتماد الأخيرة" : "Recent approval requests"}</div>
        <div className="divide-y divide-white/[0.07]">
          {approvals.length === 0 ? <div className="p-6 text-sm text-white/40">{isArabic ? "لا توجد طلبات اعتماد حقيقية حاليًا." : "No real approval requests yet."}</div> : approvals.map((item) => (
            <div key={item.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[1.2fr_.8fr_.8fr_.8fr]">
              <div><div className="text-sm text-white">#{item.id} · {item.requested_by_agent_id ?? "system"}</div><div className="mt-1 text-xs text-white/40">{item.reason ?? (isArabic ? "بدون سبب مسجل" : "No reason recorded")}</div></div>
              <div className="text-xs text-white/55">{item.approval_level}</div>
              <div className="text-xs text-white/55">{item.risk_level} · {item.channel ?? "internal"}</div>
              <div className="text-xs text-gold/80">{item.status}</div>
            </div>
          ))}
        </div>
      </AdminCard>
    </AdminPageContainer>
  );
}
