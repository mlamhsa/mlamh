import { AdminCard, AdminPageContainer, AdminPageHeader } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

export default async function SocialPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const { data, error } = await db
    .from("marketing_channel_jobs")
    .select("id,content_id,task_id,approval_id,channel,status,scheduled_at,published_at,external_post_id,retry_count,last_error,created_at")
    .order("scheduled_at", { ascending: true, nullsFirst: false })
    .limit(150);
  const rows = data ?? [];

  return <AdminPageContainer>
    <AdminPageHeader title={isArabic ? "Social Scheduler" : "Social Scheduler"} description={isArabic ? "Jobs مستقلة بحالات Draft → Approval → Scheduled → Publishing → Published/Failed مع Retry وIdempotency." : "Dedicated jobs with Draft → Approval → Scheduled → Publishing → Published/Failed states, retry, and idempotency."} />
    {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "Scheduler غير مفعّل بعد." : "Scheduler tables are not active yet."}</AdminCard> : null}
    <AdminCard className="overflow-hidden"><div className="divide-y divide-white/[0.07]">{rows.length === 0 ? <div className="p-6 text-sm text-white/40">{isArabic ? "لا توجد Channel Jobs حقيقية بعد." : "No real channel jobs yet."}</div> : rows.map((item) => <div key={item.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[1fr_.8fr_.8fr_.8fr_1fr]"><div><div className="text-sm text-white">Job #{item.id}</div><div className="mt-1 text-xs text-white/35">Content #{item.content_id ?? "—"}</div></div><div className="text-xs text-white/55">{item.channel}</div><div className="text-xs text-gold">{item.status}</div><div className="text-xs text-white/55">Retry {item.retry_count}</div><div className="text-xs text-white/35">{item.scheduled_at ?? item.published_at ?? "—"}<div className="mt-1 text-red-300/70">{item.last_error ?? ""}</div></div></div>)}</div></AdminCard>
  </AdminPageContainer>;
}
