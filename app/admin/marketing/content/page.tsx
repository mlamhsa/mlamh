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
    db.from("marketing_campaigns").select("id,name,status").in("status", ["draft","active","paused"]).order("created_at", { ascending: false }).limit(100),
  ]);
  const items = data ?? [];
  const campaigns = campaignsResult.data ?? [];
  const drafts = items.filter((item) => ["idea","draft","review","ready"].includes(item.status)).length;
  const waiting = items.filter((item) => item.status === "approval").length;
  const scheduled = items.filter((item) => item.status === "scheduled").length;
  const published = items.filter((item) => ["published","measured"].includes(item.status)).length;
  const aiDrafts = items.filter((item) => isAiGenerated(item.metadata) && ["draft","review","ready"].includes(item.status)).length;

  return <AdminPageContainer>
    <AdminPageHeader
      eyebrow="MLAMH CONTENT OPS"
      title={isArabic ? "استوديو المحتوى" : "Content Studio"}
      description={isArabic ? "خط إنتاج المحتوى من فكرة AI إلى المسودة والاعتماد والجدولة والنشر. Instagram وFacebook يتم التعامل معهما كقنوات مستقلة عبر Buffer." : "The content operating pipeline from AI idea to draft, approval, scheduling and publishing. Instagram and Facebook remain independent Buffer targets."}
    />

    <AdminGrid className="mb-6 md:grid-cols-4">
      <AdminStatCard label={isArabic ? "تحت الإعداد" : "In progress"} value={drafts} />
      <AdminStatCard label={isArabic ? "بانتظار اعتماد" : "Waiting approval"} value={waiting} />
      <AdminStatCard label={isArabic ? "مجدول" : "Scheduled"} value={scheduled} />
      <AdminStatCard label={isArabic ? "منشور" : "Published"} value={published} />
    </AdminGrid>

    <AdminCard className="mb-5 overflow-hidden border-gold/15 bg-gradient-to-br from-gold/[0.055] via-white/[0.02] to-transparent">
      <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <AdminBadge variant="gold">AI CONTENT PIPELINE</AdminBadge>
            <AdminBadge variant={aiDrafts > 0 ? "success" : "muted"}>{aiDrafts} {isArabic ? "مسودة AI" : "AI drafts"}</AdminBadge>
          </div>
          <h2 className="mt-3 text-lg font-medium text-white">{isArabic ? "المحتوى الذي أنتجه الفريق يظهر هنا تلقائيًا" : "Team-produced content lands here automatically"}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-white/40">{isArabic ? "Reem تبني المسودات من إشارات MLAMH الحقيقية. يبقى النشر الخارجي خاضعًا لمسار الاعتماد والتنفيذ الآمن." : "Reem builds drafts from live MLAMH signals. External publishing remains governed by approval and safe execution controls."}</p>
        </div>
        <details className="group shrink-0">
          <summary className="cursor-pointer select-none rounded-xl border border-white/[0.1] bg-white/[0.035] px-4 py-2.5 text-xs text-white/60 outline-none transition-all hover:-translate-y-0.5 hover:border-gold/30 hover:text-gold active:translate-y-[1px]">
            {isArabic ? "+ مسودة يدوية" : "+ Manual draft"}
          </summary>
          <div className="mt-3 md:absolute md:end-8 md:z-20 md:w-[min(760px,calc(100vw-4rem))]">
            <AdminCard className="p-5 shadow-2xl">
              <form action={createMarketingContentAction} className="grid gap-3 lg:grid-cols-3">
                <input name="title" placeholder={isArabic ? "عنوان المحتوى" : "Content title"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/35"/>
                <input name="hook" placeholder="Hook" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/35"/>
                <select name="content_type" defaultValue="post" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/35"><option value="post">Post</option><option value="reel">Reel</option><option value="story">Story</option><option value="carousel">Carousel</option></select>
                <select name="channel" defaultValue="buffer" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/35"><option value="buffer">Buffer · Instagram + Facebook</option><option value="instagram">Instagram only</option><option value="facebook">Facebook only</option></select>
                <input name="objective" placeholder={isArabic ? "الهدف" : "Objective"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/35"/>
                <select name="language" defaultValue="ar" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/35"><option value="ar">العربية</option><option value="en">English</option></select>
                <select name="campaign_id" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/35"><option value="">{isArabic ? "بدون حملة" : "No campaign"}</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select>
                <select name="agent_id" defaultValue="reem" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/35"><option value="reem">Reem</option><option value="sarah">Sarah</option><option value="faisal">Faisal</option><option value="nora">Nora</option></select>
                <input name="cta" placeholder="CTA" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/35"/>
                <input name="caption" placeholder="Caption" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/35 lg:col-span-2"/>
                <input name="body" placeholder={isArabic ? "النص" : "Body"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/35"/>
                <button className="group relative overflow-hidden rounded-xl border border-gold/30 bg-gold px-4 py-2.5 text-sm font-medium text-black transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(212,175,55,0.18)] active:translate-y-[1px] active:scale-[0.99] lg:col-span-3">{isArabic ? "إنشاء المسودة" : "Create draft"}</button>
              </form>
            </AdminCard>
          </div>
        </details>
      </div>
    </AdminCard>

    {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "تعذر قراءة Content Studio." : "Could not read Content Studio."}</AdminCard> : null}

    <AdminCard className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-gold/60">CONTENT QUEUE</p>
          <h2 className="mt-1 text-lg text-white">{isArabic ? "مسار الإنتاج" : "Production pipeline"}</h2>
        </div>
        <p className="text-xs tabular-nums text-white/30">{items.length} {isArabic ? "عنصر" : "items"}</p>
      </div>
      <div className="divide-y divide-white/[0.06]">
        {items.length === 0 ? <div className="p-8 text-center text-sm text-white/40">{isArabic ? "لا يوجد محتوى حقيقي بعد." : "No real content records yet."}</div> : items.map((item) => {
          const ai = isAiGenerated(item.metadata);
          return <div key={item.id} className="group grid gap-4 px-5 py-4 transition-colors hover:bg-white/[0.018] lg:grid-cols-[minmax(0,1.7fr)_.65fr_.65fr_minmax(220px,1fr)] lg:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-medium text-white/85">{item.title ?? item.hook ?? `#${item.id}`}</p>
                {ai ? <AdminBadge variant="gold" className="px-2 py-0.5 tracking-[0.12em]">AI</AdminBadge> : null}
                <AdminBadge variant={statusVariant(item.status)} className="px-2 py-0.5 tracking-[0.12em]">{item.status}</AdminBadge>
              </div>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/40">{item.caption ?? item.hook ?? item.objective ?? "—"}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-white/25"><span>#{item.id}</span><span>{item.agent_id ?? "—"}</span><span>{item.language}</span>{item.cta ? <span>CTA · {item.cta}</span> : null}</div>
            </div>
            <div><p className="text-[9px] uppercase tracking-[0.16em] text-white/25">{isArabic ? "الصيغة" : "Format"}</p><p className="mt-1 text-xs text-white/60">{item.content_type}</p></div>
            <div><p className="text-[9px] uppercase tracking-[0.16em] text-white/25">{isArabic ? "القناة" : "Channel"}</p><p className="mt-1 text-xs text-white/60">{item.channel ?? "—"}</p></div>
            <div>
              {["draft","review","ready"].includes(item.status) ? <form action={requestContentPublishingApprovalAction} className="rounded-xl border border-white/[0.07] bg-black/20 p-3 transition group-hover:border-white/[0.11]">
                <input type="hidden" name="content_id" value={item.id}/>
                <div className="mb-2 flex gap-3 text-[11px] text-white/50"><label className="flex cursor-pointer items-center gap-1.5"><input type="checkbox" name="targets" value="instagram" defaultChecked={item.channel !== "facebook"} className="accent-[#d4af37]"/>Instagram</label><label className="flex cursor-pointer items-center gap-1.5"><input type="checkbox" name="targets" value="facebook" defaultChecked={item.channel !== "instagram"} className="accent-[#d4af37]"/>Facebook</label></div>
                <button className="w-full rounded-lg border border-gold/25 bg-gold/[0.08] px-3 py-2 text-xs font-medium text-gold transition-all hover:-translate-y-0.5 hover:border-gold/45 hover:bg-gold/[0.14] active:translate-y-[1px] active:scale-[0.99]">{isArabic ? "إرسال لمسار اعتماد النشر" : "Send to publishing approval"}</button>
              </form> : <div className="rounded-xl border border-white/[0.06] bg-black/15 px-3 py-3 text-xs text-white/35">{item.status === "approval" ? (isArabic ? "بانتظار قرار الاعتماد" : "Awaiting approval decision") : item.status === "scheduled" ? (isArabic ? "تمت الجدولة" : "Scheduled") : (isArabic ? "تمت معالجة مرحلة النشر" : "Publishing stage processed")}</div>}
            </div>
          </div>;
        })}
      </div>
    </AdminCard>
  </AdminPageContainer>;
}
