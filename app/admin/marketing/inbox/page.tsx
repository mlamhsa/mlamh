import { AdminCard, AdminPageContainer, AdminPageHeader } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

function label(value: string | null, map: Record<string, string>, isArabic: boolean, fallback: string) {
  if (!value) return fallback;
  if (!isArabic) return value.replaceAll("_", " ");
  return map[value.toLowerCase()] ?? value.replaceAll("_", " ");
}

const channelAr: Record<string, string> = { facebook: "فيسبوك", instagram: "إنستغرام", email: "البريد", whatsapp: "واتساب", buffer: "Buffer", internal: "داخلي" };
const priorityAr: Record<string, string> = { low: "منخفضة", normal: "عادية", medium: "متوسطة", high: "عالية", urgent: "عاجلة" };
const statusAr: Record<string, string> = { open: "مفتوحة", active: "نشطة", pending: "معلّقة", resolved: "محسومة", closed: "مغلقة", archived: "مؤرشفة" };
const stageAr: Record<string, string> = {
  new: "جديدة",
  discovery: "استكشاف",
  qualified: "مؤهلة",
  outreach: "تواصل",
  follow_up: "متابعة",
  negotiation: "تفاوض",
  won: "مكتسبة",
  lost: "مغلقة دون تحويل",
};

function priorityClass(value: string | null) {
  const normalized = (value ?? "").toLowerCase();
  if (["urgent", "high"].includes(normalized)) return "border-red-300/20 bg-red-300/10 text-red-200";
  if (["medium", "normal"].includes(normalized)) return "border-amber-300/20 bg-amber-300/10 text-amber-100";
  return "border-white/10 bg-white/[0.04] text-white/50";
}

export default async function MarketingInboxPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const [conversationsResult, agentsResult] = await Promise.all([
    db.from("marketing_conversations").select("id,channel,assigned_agent_id,status,stage,last_message_at,unread_count,priority,tags,lead_id,publisher_id,talent_id").order("last_message_at", { ascending: false, nullsFirst: false }).limit(150),
    db.from("marketing_agents").select("id,name").eq("is_active", true),
  ]);
  const { data, error } = conversationsResult;
  const conversations = data ?? [];
  const agentNames = new Map((agentsResult.data ?? []).map((agent) => [agent.id, agent.name]));
  const unreadTotal = conversations.reduce((sum, item) => sum + Number(item.unread_count ?? 0), 0);
  const urgentCount = conversations.filter((item) => ["urgent", "high"].includes((item.priority ?? "").toLowerCase())).length;
  const unassignedCount = conversations.filter((item) => !item.assigned_agent_id).length;

  return <AdminPageContainer>
    <AdminPageHeader title={isArabic ? "صندوق الوارد التسويقي" : "Marketing Inbox"} description={isArabic ? "كل محادثة تسويقية في مكان واحد، مع إبراز ما لم يُقرأ، الأولوية، ومن يتولى المتابعة باسم واضح." : "All marketing conversations in one place, highlighting unread items, priority, and clear ownership."} />
    {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "بنية Inbox جاهزة ولكن جداول Marketing Hub غير مفعلة بعد." : "Inbox architecture is ready, but Marketing Hub tables are not active yet."}</AdminCard> : null}

    <div className="mb-5 grid gap-3 sm:grid-cols-3">
      <AdminCard className="p-4"><div className="text-xs text-white/40">{isArabic ? "رسائل غير مقروءة" : "Unread messages"}</div><div className="mt-2 text-2xl font-semibold text-white">{unreadTotal}</div></AdminCard>
      <AdminCard className="p-4"><div className="text-xs text-white/40">{isArabic ? "أولوية عالية" : "High priority"}</div><div className={`mt-2 text-2xl font-semibold ${urgentCount > 0 ? "text-red-200" : "text-emerald-200"}`}>{urgentCount}</div></AdminCard>
      <AdminCard className="p-4"><div className="text-xs text-white/40">{isArabic ? "بدون مسؤول" : "Unassigned"}</div><div className={`mt-2 text-2xl font-semibold ${unassignedCount > 0 ? "text-amber-200" : "text-emerald-200"}`}>{unassignedCount}</div></AdminCard>
    </div>

    <div className="grid gap-3">{conversations.length === 0 ? <AdminCard className="p-6 text-sm text-white/40">{isArabic ? "لا توجد محادثات تسويقية حقيقية بعد." : "No real marketing conversations yet."}</AdminCard> : conversations.map((item) => {
      const unread = Number(item.unread_count ?? 0);
      const owner = item.assigned_agent_id ? agentNames.get(item.assigned_agent_id) ?? (isArabic ? "عضو فريق AI" : "AI team member") : (isArabic ? "لم يُعيّن بعد" : "Unassigned");
      return <AdminCard key={item.id} className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-medium text-white">{label(item.stage, stageAr, isArabic, isArabic ? "محادثة تسويقية" : "Marketing conversation")}</span>
              <span className="rounded-full border border-gold/15 bg-gold/[0.05] px-2.5 py-1 text-xs text-gold">{label(item.channel, channelAr, isArabic, isArabic ? "غير محدد" : "Unknown")}</span>
              {unread > 0 ? <span className="rounded-full border border-white/10 bg-white/[0.07] px-2.5 py-1 text-xs text-white">{isArabic ? `${unread} غير مقروء` : `${unread} unread`}</span> : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/45">
              <span>{isArabic ? "المسؤول" : "Owner"}: <span className="text-white/70">{owner}</span></span>
              <span>·</span>
              <span>{isArabic ? "الحالة" : "Status"}: <span className="text-white/70">{label(item.status, statusAr, isArabic, isArabic ? "غير محددة" : "Unknown")}</span></span>
            </div>
          </div>
          <div className="shrink-0 text-start lg:text-end">
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${priorityClass(item.priority)}`}>{isArabic ? "الأولوية: " : "Priority: "}{label(item.priority, priorityAr, isArabic, isArabic ? "عادية" : "Normal")}</span>
            <div className="mt-2 text-[11px] text-white/30">{item.last_message_at ? new Date(item.last_message_at).toLocaleString(isArabic ? "ar-SA" : "en-US") : (isArabic ? "لا يوجد نشاط حديث" : "No recent activity")}</div>
          </div>
        </div>

        {(item.lead_id || item.publisher_id || item.talent_id || item.assigned_agent_id || (Array.isArray(item.tags) && item.tags.length > 0)) ? <details className="mt-4 rounded-xl border border-white/[0.06] bg-black/10 px-4 py-3 text-xs text-white/40">
          <summary className="cursor-pointer select-none text-white/45">{isArabic ? "عرض تفاصيل الربط التقنية" : "Show linked technical details"}</summary>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-white/45">
            {item.assigned_agent_id ? <span>agent: {item.assigned_agent_id}</span> : null}
            {item.lead_id ? <span>lead #{item.lead_id}</span> : null}
            {item.publisher_id ? <span>publisher #{item.publisher_id}</span> : null}
            {item.talent_id ? <span>talent #{item.talent_id}</span> : null}
            {Array.isArray(item.tags) && item.tags.length > 0 ? <span>tags: {item.tags.join(", ")}</span> : null}
          </div>
        </details> : null}
      </AdminCard>;
    })}</div>
  </AdminPageContainer>;
}
