import { AdminCard, AdminPageContainer, AdminPageHeader } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

function statusLabel(value: string | null, isArabic: boolean) {
  if (!value) return isArabic ? "غير محددة" : "Unknown";
  if (!isArabic) return value.replaceAll("_", " ");
  return ({ active: "معتمدة", approved: "معتمدة", draft: "مسودة", review: "تحت المراجعة", archived: "مؤرشفة", deprecated: "متوقفة" } as Record<string, string>)[value.toLowerCase()] ?? value.replaceAll("_", " ");
}

function statusClass(value: string | null) {
  const normalized = (value ?? "").toLowerCase();
  if (["active", "approved"].includes(normalized)) return "border-emerald-300/20 bg-emerald-300/10 text-emerald-200";
  if (["draft", "review"].includes(normalized)) return "border-amber-300/20 bg-amber-300/10 text-amber-100";
  return "border-white/10 bg-white/[0.04] text-white/50";
}

export default async function KnowledgePage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const { data, error } = await db.from("marketing_playbooks").select("id,key,title,category,status,version,updated_at").order("category").order("title");
  const rows = data ?? [];
  const active = rows.filter((item) => ["active", "approved"].includes((item.status ?? "").toLowerCase())).length;
  const review = rows.filter((item) => ["draft", "review"].includes((item.status ?? "").toLowerCase())).length;
  const categories = new Set(rows.map((item) => item.category).filter(Boolean)).size;

  return <AdminPageContainer>
    <AdminPageHeader title={isArabic ? "دليل تشغيل التسويق" : "Marketing Playbooks"} description={isArabic ? "القواعد المعتمدة التي توجه فريق التسويق والـAI: نبرة العلامة، التواصل، التأهيل، الاعتماد والتصعيد." : "The approved operating rules that guide the marketing team and AI: brand voice, outreach, qualification, approval, and escalation."} />
    {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "بيانات دليل التشغيل غير متاحة حاليًا." : "Playbook data is currently unavailable."}</AdminCard> : null}

    <div className="mb-5 grid gap-3 sm:grid-cols-3">
      <AdminCard className="p-4"><div className="text-xs text-white/40">{isArabic ? "قواعد معتمدة" : "Approved rules"}</div><div className="mt-2 text-2xl font-semibold text-emerald-200">{active}</div></AdminCard>
      <AdminCard className="p-4"><div className="text-xs text-white/40">{isArabic ? "تحت المراجعة" : "Needs review"}</div><div className={`mt-2 text-2xl font-semibold ${review > 0 ? "text-amber-200" : "text-white"}`}>{review}</div></AdminCard>
      <AdminCard className="p-4"><div className="text-xs text-white/40">{isArabic ? "مجالات تشغيل" : "Operating areas"}</div><div className="mt-2 text-2xl font-semibold text-gold">{categories}</div></AdminCard>
    </div>

    <div className="grid gap-3 md:grid-cols-2">{rows.length === 0 ? <AdminCard className="p-6 md:col-span-2"><div className="text-sm text-white/60">{isArabic ? "لا توجد قواعد تشغيل مخزنة بعد." : "No stored playbooks yet."}</div><div className="mt-1 text-xs text-white/30">{isArabic ? "سنخزن فقط المعرفة التي يحتاجها الفريق فعليًا، بدل نسخ مستودعات كاملة بلا فائدة تشغيلية." : "Only knowledge the team actually needs will be stored, rather than copying entire workspaces without operational value."}</div></AdminCard> : rows.map((item) => <AdminCard key={item.id} className="p-5">
      <div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="text-base font-medium text-white">{item.title}</div><div className="mt-2 text-xs text-white/40">{item.category || (isArabic ? "عام" : "General")}</div></div><span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] ${statusClass(item.status)}`}>{statusLabel(item.status, isArabic)}</span></div>
      <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4 text-[11px] text-white/35"><span>{isArabic ? "الإصدار" : "Version"} {item.version ?? "—"}</span><span>{item.updated_at ? new Date(item.updated_at).toLocaleDateString(isArabic ? "ar-SA" : "en-US") : "—"}</span></div>
      <details className="mt-3 rounded-xl border border-white/[0.06] bg-black/10 px-4 py-3 text-xs text-white/40"><summary className="cursor-pointer select-none">{isArabic ? "عرض المفتاح التقني" : "Show technical key"}</summary><div className="mt-2 font-mono text-[11px] text-white/45">{item.key}</div></details>
    </AdminCard>)}</div>
  </AdminPageContainer>;
}
