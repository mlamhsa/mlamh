import { AdminCard, AdminPageContainer, AdminPageHeader } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { approvedMarketingPlaybooks, marketingPlaybookCatalog, nextMarketingPlaybooks } from "@/lib/marketing/knowledge/playbook-catalog";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

function statusLabel(value: string | null, isArabic: boolean) {
  if (!value) return isArabic ? "غير محددة" : "Unknown";
  if (!isArabic) return value.replaceAll("_", " ");
  return ({ active: "معتمدة", approved: "معتمدة", draft: "مسودة", review: "تحت المراجعة", next: "التالي", later: "لاحقًا", archived: "مؤرشفة", deprecated: "متوقفة" } as Record<string, string>)[value.toLowerCase()] ?? value.replaceAll("_", " ");
}

function statusClass(value: string | null) {
  const normalized = (value ?? "").toLowerCase();
  if (["active", "approved"].includes(normalized)) return "border-emerald-300/20 bg-emerald-300/10 text-emerald-200";
  if (["draft", "review", "next"].includes(normalized)) return "border-amber-300/20 bg-amber-300/10 text-amber-100";
  return "border-white/10 bg-white/[0.04] text-white/50";
}

export default async function KnowledgePage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const { data, error } = await db.from("marketing_playbooks").select("id,key,title,category,status,version,updated_at").order("category").order("title");
  const rows = data ?? [];
  const storedKeys = new Set(rows.map((item) => item.key));
  const nativeOnly = marketingPlaybookCatalog.filter((item) => !storedKeys.has(item.key));
  const activeStored = rows.filter((item) => ["active", "approved"].includes((item.status ?? "").toLowerCase())).length;
  const reviewStored = rows.filter((item) => ["draft", "review"].includes((item.status ?? "").toLowerCase())).length;
  const active = activeStored + approvedMarketingPlaybooks.filter((item) => !storedKeys.has(item.key)).length;
  const review = reviewStored + nextMarketingPlaybooks.filter((item) => !storedKeys.has(item.key)).length;
  const categories = new Set([...rows.map((item) => item.category).filter(Boolean), ...marketingPlaybookCatalog.map((item) => item.category)]).size;

  return <AdminPageContainer>
    <AdminPageHeader title={isArabic ? "دليل تشغيل التسويق" : "Marketing Playbooks"} description={isArabic ? "القواعد المعتمدة التي توجه فريق التسويق والـAI: نبرة العلامة، التواصل، التأهيل، الاعتماد والتصعيد — مع كتالوج MLAMH الأصلي كمرجع ثابت حتى دون أي كتابة على قاعدة الإنتاج." : "The approved operating rules that guide the marketing team and AI: brand voice, outreach, qualification, approval, and escalation — with an MLAMH-native catalog available without requiring Production writes."} />
    {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "تعذر تحميل القواعد المخزنة من قاعدة البيانات؛ يظهر كتالوج MLAMH الأصلي أدناه كمرجع آمن للقراءة فقط." : "Stored database playbooks are unavailable; the MLAMH-native read-only catalog is shown below as the safe fallback."}</AdminCard> : null}

    <div className="mb-5 grid gap-3 sm:grid-cols-3">
      <AdminCard className="p-4"><div className="text-xs text-white/40">{isArabic ? "قواعد معتمدة" : "Approved rules"}</div><div className="mt-2 text-2xl font-semibold text-emerald-200">{active}</div></AdminCard>
      <AdminCard className="p-4"><div className="text-xs text-white/40">{isArabic ? "التالي / تحت المراجعة" : "Next / Needs review"}</div><div className={`mt-2 text-2xl font-semibold ${review > 0 ? "text-amber-200" : "text-white"}`}>{review}</div></AdminCard>
      <AdminCard className="p-4"><div className="text-xs text-white/40">{isArabic ? "مجالات تشغيل" : "Operating areas"}</div><div className="mt-2 text-2xl font-semibold text-gold">{categories}</div></AdminCard>
    </div>

    {rows.length > 0 ? <section className="mb-7"><div className="mb-3"><div className="text-xs uppercase tracking-[.18em] text-gold/60">{isArabic ? "قواعد قاعدة البيانات" : "DATABASE PLAYBOOKS"}</div><div className="mt-1 text-sm text-white/45">{isArabic ? "القواعد المخزنة تبقى المصدر التشغيلي الأعلى عندما يكون لها نفس المفتاح." : "Stored playbooks remain operationally authoritative when they share the same key."}</div></div><div className="grid gap-3 md:grid-cols-2">{rows.map((item) => <AdminCard key={item.id} className="p-5">
      <div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="text-base font-medium text-white">{item.title}</div><div className="mt-2 text-xs text-white/40">{item.category || (isArabic ? "عام" : "General")}</div></div><span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] ${statusClass(item.status)}`}>{statusLabel(item.status, isArabic)}</span></div>
      <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4 text-[11px] text-white/35"><span>{isArabic ? "الإصدار" : "Version"} {item.version ?? "—"}</span><span>{item.updated_at ? new Date(item.updated_at).toLocaleDateString(isArabic ? "ar-SA" : "en-US") : "—"}</span></div>
      <details className="mt-3 rounded-xl border border-white/[0.06] bg-black/10 px-4 py-3 text-xs text-white/40"><summary className="cursor-pointer select-none">{isArabic ? "عرض المفتاح التقني" : "Show technical key"}</summary><div className="mt-2 font-mono text-[11px] text-white/45">{item.key}</div></details>
    </AdminCard>)}</div></section> : null}

    <section><div className="mb-3"><div className="text-xs uppercase tracking-[.18em] text-gold/60">{isArabic ? "كتالوج MLAMH الأصلي" : "MLAMH NATIVE CATALOG"}</div><div className="mt-1 text-sm text-white/45">{isArabic ? "تحويل انتقائي للـMarketing Skills إلى Playbooks محلية بدون تثبيت مستودع خارجي أو إنشاء مسار تنفيذ موازٍ." : "Selected Marketing Skills translated into native playbooks without installing an external repository or creating a parallel execution path."}</div></div><div className="grid gap-3 md:grid-cols-2">{nativeOnly.map((item) => <AdminCard key={item.key} className="p-5">
      <div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="text-base font-medium text-white">{isArabic ? item.titleAr : item.titleEn}</div><div className="mt-2 text-xs text-white/40">{item.category.replaceAll("_", " ")} · {item.sourceSkill}</div></div><span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] ${statusClass(item.status)}`}>{statusLabel(item.status, isArabic)}</span></div>
      <p className="mt-4 text-sm leading-6 text-white/55">{item.purpose}</p>
      <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/10 p-3"><div className="text-[10px] uppercase tracking-[.14em] text-white/30">{isArabic ? "النتيجة المقاسة" : "MEASURABLE OUTCOME"}</div><div className="mt-1 text-xs leading-5 text-white/50">{item.outcome}</div></div>
      <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-4 text-[11px] text-white/35"><span>{isArabic ? "الإصدار" : "Version"} {item.version}</span><span>{isArabic ? "الاعتماد" : "Approval"}: {item.approval.replaceAll("_", " ")}</span></div>
      <details className="mt-3 rounded-xl border border-white/[0.06] bg-black/10 px-4 py-3 text-xs text-white/40"><summary className="cursor-pointer select-none">{isArabic ? "عرض المفتاح التقني" : "Show technical key"}</summary><div className="mt-2 font-mono text-[11px] text-white/45">{item.key}</div></details>
    </AdminCard>)}</div></section>
  </AdminPageContainer>;
}
