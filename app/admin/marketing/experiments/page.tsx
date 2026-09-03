import { AdminCard, AdminPageContainer, AdminPageHeader } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

function statusLabel(value: string | null, isArabic: boolean) {
  if (!value) return isArabic ? "غير محددة" : "Unknown";
  if (!isArabic) return value.replaceAll("_", " ");
  return ({ draft: "مسودة", planned: "مخططة", active: "جارية", running: "جارية", completed: "مكتملة", stopped: "متوقفة", cancelled: "ملغاة" } as Record<string, string>)[value.toLowerCase()] ?? value.replaceAll("_", " ");
}

function statusClass(value: string | null) {
  const normalized = (value ?? "").toLowerCase();
  if (["active", "running"].includes(normalized)) return "border-emerald-300/20 bg-emerald-300/10 text-emerald-200";
  if (["draft", "planned"].includes(normalized)) return "border-amber-300/20 bg-amber-300/10 text-amber-100";
  return "border-white/10 bg-white/[0.04] text-white/55";
}

export default async function ExperimentsPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const { data, error } = await db.from("marketing_experiments").select("id,name,hypothesis,metric,status,start_at,end_at,winner,result,created_at").order("created_at", { ascending: false }).limit(100);
  const rows = data ?? [];
  const running = rows.filter((item) => ["active", "running"].includes((item.status ?? "").toLowerCase())).length;
  const completed = rows.filter((item) => (item.status ?? "").toLowerCase() === "completed").length;
  const withWinner = rows.filter((item) => Boolean(item.winner)).length;

  return <AdminPageContainer>
    <AdminPageHeader title={isArabic ? "مختبر النمو" : "Growth Experiments"} description={isArabic ? "التجارب التي تختبر ماذا يحسن النمو فعليًا: الفرضية، المؤشر، النتيجة، وما الذي يستحق التعميم." : "Experiments that test what actually improves growth: hypothesis, metric, result, and what deserves to scale."} />
    {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "بيانات التجارب غير متاحة حاليًا." : "Experiment data is currently unavailable."}</AdminCard> : null}

    <div className="mb-5 grid gap-3 sm:grid-cols-3">
      <AdminCard className="p-4"><div className="text-xs text-white/40">{isArabic ? "تجارب جارية" : "Running"}</div><div className="mt-2 text-2xl font-semibold text-emerald-200">{running}</div></AdminCard>
      <AdminCard className="p-4"><div className="text-xs text-white/40">{isArabic ? "مكتملة" : "Completed"}</div><div className="mt-2 text-2xl font-semibold text-white">{completed}</div></AdminCard>
      <AdminCard className="p-4"><div className="text-xs text-white/40">{isArabic ? "لها نتيجة فائزة" : "With winner"}</div><div className="mt-2 text-2xl font-semibold text-gold">{withWinner}</div></AdminCard>
    </div>

    <div className="grid gap-4">{rows.length === 0 ? <AdminCard className="p-6"><div className="text-sm text-white/60">{isArabic ? "لا توجد تجارب حقيقية بعد." : "No real experiments yet."}</div><div className="mt-1 text-xs text-white/30">{isArabic ? "عند تشغيل أول اختبار Hook أو CTA أو قناة سيظهر هنا مع نتيجته القابلة للقرار." : "Your first hook, CTA, or channel test will appear here with a decision-ready result."}</div></AdminCard> : rows.map((item) => <AdminCard key={item.id} className="p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1"><div className="text-base font-medium text-white">{item.name}</div><div className="mt-2 text-sm leading-6 text-white/50">{item.hypothesis ?? (isArabic ? "لم تُسجل فرضية واضحة لهذه التجربة." : "No clear hypothesis was recorded for this experiment.")}</div></div>
        <span className={`w-fit rounded-full border px-2.5 py-1 text-xs ${statusClass(item.status)}`}>{statusLabel(item.status, isArabic)}</span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3"><div className="text-[10px] uppercase tracking-[0.14em] text-white/30">{isArabic ? "مؤشر النجاح" : "Success metric"}</div><div className="mt-1 text-sm text-white/70">{item.metric ?? "—"}</div></div>
        <div className="rounded-xl border border-gold/15 bg-gold/[0.035] p-3"><div className="text-[10px] uppercase tracking-[0.14em] text-gold/50">{isArabic ? "الفائز" : "Winner"}</div><div className="mt-1 text-sm text-white/80">{item.winner ?? (isArabic ? "لم يُحسم بعد" : "Not decided yet")}</div></div>
        <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3"><div className="text-[10px] uppercase tracking-[0.14em] text-white/30">{isArabic ? "الفترة" : "Window"}</div><div className="mt-1 text-xs leading-5 text-white/60">{item.start_at ? new Date(item.start_at).toLocaleDateString(isArabic ? "ar-SA" : "en-US") : "—"} → {item.end_at ? new Date(item.end_at).toLocaleDateString(isArabic ? "ar-SA" : "en-US") : "—"}</div></div>
      </div>
      {item.result ? <div className="mt-4 rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.035] p-4"><div className="text-[10px] uppercase tracking-[0.14em] text-emerald-200/50">{isArabic ? "النتيجة" : "Result"}</div><div className="mt-2 text-sm leading-6 text-white/70">{typeof item.result === "string" ? item.result : JSON.stringify(item.result)}</div></div> : null}
    </AdminCard>)}</div>
  </AdminPageContainer>;
}
