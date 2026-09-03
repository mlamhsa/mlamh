import {
  AdminBadge,
  AdminCard,
  AdminGrid,
  AdminPageContainer,
  AdminPageHeader,
  AdminStatCard,
} from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMarketingContentAction, requestContentPublishingApprovalAction } from "./actions";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

function statusVariant(status: string) {
  if (status === "published" || status === "measured") return "success" as const;
  if (status === "approval") return "warning" as const;
  if (status === "scheduled") return "info" as const;
  if (status === "ready") return "gold" as const;
  return "muted" as const;
}

const statusLabels: Record<string, { ar: string; en: string }> = {
  idea: { ar: "فكرة", en: "Idea" },
  draft: { ar: "مسودة", en: "Draft" },
  review: { ar: "مراجعة", en: "Review" },
  ready: { ar: "جاهز للاعتماد", en: "Ready" },
  approval: { ar: "بانتظار قرار", en: "Waiting approval" },
  scheduled: { ar: "مجدول", en: "Scheduled" },
  published: { ar: "منشور", en: "Published" },
  measured: { ar: "تم القياس", en: "Measured" },
};

const formatLabels: Record<string, { ar: string; en: string }> = {
  post: { ar: "منشور", en: "Post" },
  reel: { ar: "ريل", en: "Reel" },
  story: { ar: "ستوري", en: "Story" },
  carousel: { ar: "كاروسيل", en: "Carousel" },
};

const channelLabels: Record<string, { ar: string; en: string }> = {
  buffer: { ar: "Instagram + Facebook", en: "Instagram + Facebook" },
  instagram: { ar: "Instagram", en: "Instagram" },
  facebook: { ar: "Facebook", en: "Facebook" },
};

function label(map: Record<string, { ar: string; en: string }>, value: string | null | undefined, ar: boolean) {
  if (!value) return "—";
  const item = map[value];
  return item ? (ar ? item.ar : item.en) : value;
}

function isAiGenerated(metadata: unknown) {
  return Boolean(metadata && typeof metadata === "object" && !Array.isArray(metadata) && (metadata as Record<string, unknown>).source === "marketing_ai");
}

export default async function ContentStudioPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const language = getAdminLanguage(lang);
  const isArabic = language === "ar";
  const db = createAdminClient();
  const [{ data, error }, campaignsResult] = await Promise.all([
    db.from("marketing_content").select("id,title,hook,caption,cta,content_type,channel,objective,language,status,scheduled_at,published_at,agent_id,metadata,created_at").order("created_at", { ascending: false }).limit(150),
    db.from("marketing_campaigns").select("id,name,status").in("status", ["draft", "active", "paused"]).order("created_at", { ascending: false }).limit(100),
  ]);

  const items = data ?? [];
  const campaigns = campaignsResult.data ?? [];
  const drafts = items.filter((item) => ["idea", "draft", "review", "ready"].includes(item.status)).length;
  const waiting = items.filter((item) => item.status === "approval").length;
  const scheduled = items.filter((item) => item.status === "scheduled").length;
  const published = items.filter((item) => ["published", "measured"].includes(item.status)).length;
  const aiDrafts = items.filter((item) => isAiGenerated(item.metadata) && ["draft", "review", "ready"].includes(item.status)).length;
  const nextDecision = items.find((item) => item.status === "approval");
  const nextReady = items.find((item) => ["draft", "review", "ready"].includes(item.status));

  return <AdminPageContainer>
    <AdminPageHeader
      eyebrow={isArabic ? "MLAMH · غرفة المحتوى" : "MLAMH · CONTENT ROOM"}
      title={isArabic ? "استوديو المحتوى" : "Content Studio"}
      description={isArabic ? "شاهد ما يصنعه الفريق، ما ينتظر قرارك، وما أصبح جاهزًا للجدولة والنشر — من شاشة واحدة." : "See what the team is creating, what needs your decision, and what is ready to schedule or publish from one view."}
    />

    <AdminGrid className="mb-6 md:grid-cols-4">
      <AdminStatCard label={isArabic ? "قيد الإعداد" : "In progress"} value={drafts} />
      <AdminStatCard label={isArabic ? "تحتاج قرارك" : "Needs your decision"} value={waiting} />
      <AdminStatCard label={isArabic ? "جاهز للنشر" : "Scheduled"} value={scheduled} />
      <AdminStatCard label={isArabic ? "تم نشره" : "Published"} value={published} />
    </AdminGrid>

    <AdminGrid className="mb-6 lg:grid-cols-2">
      <AdminCard className="border-gold/15 bg-gradient-to-br from-gold/[0.055] via-white/[0.02] to-transparent p-5">
        <div className="flex items-center gap-2">
          <AdminBadge variant="gold">{isArabic ? "إنتاج الفريق" : "TEAM OUTPUT"}</AdminBadge>
          <AdminBadge variant={aiDrafts > 0 ? "success" : "muted"}>{aiDrafts} {isArabic ? "مسودات AI" : "AI drafts"}</AdminBadge>
        </div>
        <h2 className="mt-4 text-xl font-medium text-white">{isArabic ? "ما الذي يتحرك الآن؟" : "What is moving now?"}</h2>
        <p className="mt-2 text-sm leading-6 text-white/45">{nextDecision ? (isArabic ? `يوجد محتوى ينتظر قرارك الآن: ${nextDecision.title ?? nextDecision.hook ?? `#${nextDecision.id}`}.` : `Content is waiting for your decision: ${nextDecision.title ?? nextDecision.hook ?? `#${nextDecision.id}`}.`) : nextReady ? (isArabic ? `أقرب محتوى جاهز للانتقال للاعتماد: ${nextReady.title ?? nextReady.hook ?? `#${nextReady.id}`}.` : `Next content ready for approval: ${nextReady.title ?? nextReady.hook ?? `#${nextReady.id}`}.`) : (isArabic ? "لا توجد مسودة نشطة تحتاج تدخلًا الآن." : "No active draft needs intervention right now.")}</p>
      </AdminCard>

      <AdminCard className="p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-200/60">{isArabic ? "سياسة النشر" : "PUBLISHING POLICY"}</p>
        <h2 className="mt-2 text-lg font-medium text-white">{isArabic ? "لا يوجد نشر خارجي بدون مسار اعتماد" : "No external publish without approval"}</h2>
        <p className="mt-2 text-sm leading-6 text-white/40">{isArabic ? "Instagram وFacebook قناتان مستقلتان. اختيار القناة هنا يجهز طلب الاعتماد فقط، ولا يتجاوز بوابات التنفيذ الخارجي." : "Instagram and Facebook are independent targets. Choosing a channel here prepares approval only and does not bypass external-execution gates."}</p>
      </AdminCard>
    </AdminGrid>

    {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "تعذر تحميل محتوى الفريق الآن." : "Could not load team content."}</AdminCard> : null}

    <AdminCard className="mb-6 overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-gold/60">{isArabic ? "خط الإنتاج" : "CONTENT PIPELINE"}</p>
          <h2 className="mt-1 text-lg text-white">{isArabic ? "المحتوى الجاري" : "Active content"}</h2>
        </div>
        <p className="text-xs tabular-nums text-white/30">{items.length} {isArabic ? "عنصر" : "items"}</p>
      </div>
      <div className="divide-y divide-white/[0.06]">
        {items.length === 0 ? <div className="p-8 text-center text-sm text-white/40">{isArabic ? "لا يوجد محتوى بعد." : "No content yet."}</div> : items.map((item) => {
          const ai = isAiGenerated(item.metadata);
          return <div key={item.id} className="group grid gap-4 px-5 py-4 transition-colors hover:bg-white/[0.018] lg:grid-cols-[minmax(0,1.7fr)_.65fr_.65fr_minmax(220px,1fr)] lg:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-medium text-white/85">{item.title ?? item.hook ?? `#${item.id}`}</p>
                {ai ? <AdminBadge variant="gold" className="px-2 py-0.5 tracking-[0.12em]">AI</AdminBadge> : null}
                <AdminBadge variant={statusVariant(item.status)} className="px-2 py-0.5 tracking-[0.12em]">{label(statusLabels, item.status, isArabic)}</AdminBadge>
              </div>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/40">{item.caption ?? item.hook ?? item.objective ?? "—"}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-white/25"><span>#{item.id}</span><span>{item.agent_id ?? "—"}</span><span>{item.language === "ar" ? "العربية" : "English"}</span>{item.cta ? <span>CTA · {item.cta}</span> : null}</div>
            </div>
            <div><p className="text-[9px] uppercase tracking-[0.16em] text-white/25">{isArabic ? "الصيغة" : "Format"}</p><p className="mt-1 text-xs text-white/60">{label(formatLabels, item.content_type, isArabic)}</p></div>
            <div><p className="text-[9px] uppercase tracking-[0.16em] text-white/25">{isArabic ? "القناة" : "Channel"}</p><p className="mt-1 text-xs text-white/60">{label(channelLabels, item.channel, isArabic)}</p></div>
            <div>
              {["draft", "review", "ready"].includes(item.status) ? <form action={requestContentPublishingApprovalAction} className="rounded-xl border border-white/[0.07] bg-black/20 p-3 transition group-hover:border-white/[0.11]">
                <input type="hidden" name="content_id" value={item.id}/>
                <p className="mb-2 text-[10px] text-white/35">{isArabic ? "أين تريد مراجعته للنشر؟" : "Approval targets"}</p>
                <div className="mb-2 flex gap-3 text-[11px] text-white/50"><label className="flex cursor-pointer items-center gap-1.5"><input type="checkbox" name="targets" value="instagram" defaultChecked={item.channel !== "facebook"} className="accent-[#d4af37]"/>Instagram</label><label className="flex cursor-pointer items-center gap-1.5"><input type="checkbox" name="targets" value="facebook" defaultChecked={item.channel !== "instagram"} className="accent-[#d4af37]"/>Facebook</label></div>
                <button className="w-full rounded-lg border border-gold/25 bg-gold/[0.08] px-3 py-2 text-xs font-medium text-gold transition-all hover:-translate-y-0.5 hover:border-gold/45 hover:bg-gold/[0.14] active:translate-y-[1px] active:scale-[0.99]">{isArabic ? "إرسال لقراري" : "Send for my decision"}</button>
              </form> : <div className="rounded-xl border border-white/[0.06] bg-black/15 px-3 py-3 text-xs text-white/35">{item.status === "approval" ? (isArabic ? "ينتظر قرارك" : "Awaiting your decision") : item.status === "scheduled" ? (isArabic ? "مجدول للنشر" : "Scheduled") : (isArabic ? "اكتملت مرحلة النشر" : "Publishing stage complete")}</div>}
            </div>
          </div>;
        })}
      </div>
    </AdminCard>

    <AdminCard className="p-5">
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">{isArabic ? "إضافة يدوية" : "MANUAL DRAFT"}</p>
        <h2 className="mt-1 text-lg font-medium text-white">{isArabic ? "إنشاء مسودة عند الحاجة" : "Create a manual draft when needed"}</h2>
        <p className="mt-1 text-xs text-white/35">{isArabic ? "أبقينا الإنشاء اليدوي واضحًا ومباشرًا بدل قائمة منسدلة قد تبقى مفتوحة." : "Manual creation stays visible and predictable instead of using a sticky dropdown."}</p>
      </div>
      <form action={createMarketingContentAction} className="grid gap-3 lg:grid-cols-3">
        <input name="title" placeholder={isArabic ? "عنوان المحتوى" : "Content title"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/35"/>
        <input name="hook" placeholder={isArabic ? "الهوك" : "Hook"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/35"/>
        <select name="content_type" defaultValue="post" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/35"><option value="post">{isArabic ? "منشور" : "Post"}</option><option value="reel">{isArabic ? "ريل" : "Reel"}</option><option value="story">{isArabic ? "ستوري" : "Story"}</option><option value="carousel">{isArabic ? "كاروسيل" : "Carousel"}</option></select>
        <select name="channel" defaultValue="buffer" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/35"><option value="buffer">Instagram + Facebook</option><option value="instagram">Instagram</option><option value="facebook">Facebook</option></select>
        <input name="objective" placeholder={isArabic ? "الهدف" : "Objective"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/35"/>
        <select name="language" defaultValue="ar" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/35"><option value="ar">العربية</option><option value="en">English</option></select>
        <select name="campaign_id" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/35"><option value="">{isArabic ? "بدون حملة" : "No campaign"}</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select>
        <select name="agent_id" defaultValue="reem" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/35"><option value="reem">Reem</option><option value="sarah">Sarah</option><option value="faisal">Faisal</option><option value="nora">Nora</option></select>
        <input name="cta" placeholder="CTA" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/35"/>
        <input name="caption" placeholder={isArabic ? "الوصف" : "Caption"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/35 lg:col-span-2"/>
        <input name="body" placeholder={isArabic ? "النص" : "Body"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/35"/>
        <button className="group relative overflow-hidden rounded-xl border border-gold/30 bg-gold px-4 py-2.5 text-sm font-medium text-black transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(212,175,55,0.18)] active:translate-y-[1px] active:scale-[0.99] lg:col-span-3">{isArabic ? "إنشاء المسودة" : "Create draft"}</button>
      </form>
    </AdminCard>
  </AdminPageContainer>;
}
