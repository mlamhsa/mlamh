import { AdminCard, AdminPageContainer, AdminPageHeader } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

export default async function KnowledgePage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const { data, error } = await db.from("marketing_playbooks").select("id,key,title,category,status,version,updated_at").order("category").order("title");
  const rows = data ?? [];
  return <AdminPageContainer>
    <AdminPageHeader title={isArabic ? "المعرفة وقواعد التشغيل" : "Knowledge / Playbooks"} description={isArabic ? "Brand Voice وOutreach وQualification وApproval وEscalation كمعرفة تشغيلية قابلة للاستخدام لاحقًا كـAgent Context." : "Brand voice, outreach, qualification, approval, and escalation rules as operational knowledge that can later feed agent context."} />
    {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "جداول Playbooks غير مفعلة بعد." : "Playbook tables are not active yet."}</AdminCard> : null}
    <AdminCard className="overflow-hidden"><div className="divide-y divide-white/[0.07]">{rows.length === 0 ? <div className="p-6 text-sm text-white/40">{isArabic ? "لا توجد Playbooks مخزنة بعد؛ ولن ننسخ Notion بالكامل دون حاجة." : "No stored playbooks yet; Notion will not be copied wholesale without need."}</div> : rows.map((item) => <div key={item.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[1.3fr_.8fr_.7fr_.5fr]"><div><div className="text-sm text-white">{item.title}</div><div className="mt-1 text-xs text-white/35">{item.key}</div></div><div className="text-xs text-white/55">{item.category}</div><div className="text-xs text-gold">{item.status}</div><div className="text-xs text-white/45">v{item.version}</div></div>)}</div></AdminCard>
  </AdminPageContainer>;
}
