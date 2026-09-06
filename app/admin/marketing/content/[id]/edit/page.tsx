import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminBadge, AdminCard, AdminPageContainer, AdminPageHeader } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireMarketingAdminAccess } from "@/lib/auth/require-marketing-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateMarketingContentDraftAction } from "./actions";

export const dynamic = "force-dynamic";
type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string }> };

export default async function MarketingContentEditPage({ params, searchParams }: PageProps) {
  await requireMarketingAdminAccess("marketing.manage");
  const [{ id }, { lang }] = await Promise.all([params, searchParams]);
  const language = getAdminLanguage(lang);
  const ar = language === "ar";
  const contentId = Number(id);
  if (!Number.isInteger(contentId) || contentId <= 0) notFound();

  const db = createAdminClient();
  const { data: content } = await db.from("marketing_content")
    .select("id,title,hook,caption,body,cta,objective,content_type,channel,language,status,agent_id,created_at,updated_at")
    .eq("id", contentId)
    .maybeSingle();
  if (!content) notFound();

  const editable = ["idea", "draft", "review", "ready"].includes(content.status);

  return <AdminPageContainer>
    <AdminPageHeader
      eyebrow={ar ? "MLAMH · مراجعة المحتوى" : "MLAMH · CONTENT REVIEW"}
      title={ar ? `تحرير المحتوى #${content.id}` : `Edit content #${content.id}`}
      description={ar ? "عدّل النص والهوك وCTA والقناة والصيغة قبل إرسال القطعة للاعتماد أو النشر." : "Edit copy, hook, CTA, channel, and format before the item enters approval or publishing."}
    />

    <div className="mb-5 flex flex-wrap items-center gap-2">
      <AdminBadge variant={editable ? "gold" : "warning"}>{content.status}</AdminBadge>
      <AdminBadge variant="muted">{content.agent_id ?? "team"}</AdminBadge>
      <Link href={`/admin/marketing/content/review?lang=${language}`} className="ms-auto text-xs text-gold/70 hover:text-gold">{ar ? "← العودة لمساحة المراجعة" : "← Back to review workspace"}</Link>
    </div>

    {!editable ? <AdminCard className="p-5 text-sm leading-6 text-amber-100/70">{ar ? "هذه القطعة دخلت مرحلة الاعتماد بالفعل أو تم نشرها. استخدم صفحة الاعتماد الخاصة بها لتعديل النسخة المعلقة قبل الموافقة." : "This item has already entered approval or publishing. Use its approval workspace to edit the pending version before approval."}</AdminCard> : <form action={updateMarketingContentDraftAction} className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <input type="hidden" name="content_id" value={content.id}/>
      <input type="hidden" name="lang" value={language}/>
      <AdminCard className="p-5">
        <div className="grid gap-4">
          <Field label={ar ? "العنوان" : "Title"}><input name="title" defaultValue={content.title ?? ""} className={inputClass}/></Field>
          <Field label={ar ? "الهوك" : "Hook"}><input name="hook" defaultValue={content.hook ?? ""} className={inputClass}/></Field>
          <Field label={ar ? "الكابشن" : "Caption"}><textarea name="caption" defaultValue={content.caption ?? ""} rows={8} className={textareaClass}/></Field>
          <Field label={ar ? "النص الطويل / الملاحظات" : "Body / notes"}><textarea name="body" defaultValue={content.body ?? ""} rows={6} className={textareaClass}/></Field>
          <Field label="CTA"><input name="cta" defaultValue={content.cta ?? ""} className={inputClass}/></Field>
          <Field label={ar ? "الهدف" : "Objective"}><input name="objective" defaultValue={content.objective ?? ""} className={inputClass}/></Field>
        </div>
      </AdminCard>

      <div className="grid content-start gap-5">
        <AdminCard className="p-5">
          <p className="text-[10px] uppercase tracking-[.2em] text-gold/60">{ar ? "إعدادات القطعة" : "ITEM SETTINGS"}</p>
          <div className="mt-4 grid gap-4">
            <Field label={ar ? "القناة" : "Channel"}><select name="channel" defaultValue={content.channel ?? "instagram"} className={inputClass}><option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="buffer">Instagram + Facebook</option><option value="linkedin">LinkedIn</option><option value="email">Email</option></select></Field>
            <Field label={ar ? "الصيغة" : "Format"}><select name="content_type" defaultValue={content.content_type ?? "post"} className={inputClass}><option value="post">Post</option><option value="feed">Feed</option><option value="reel">Reel</option><option value="story">Story</option><option value="carousel">Carousel</option><option value="video">Video</option></select></Field>
            <Field label={ar ? "اللغة" : "Language"}><select name="language" defaultValue={content.language === "en" ? "en" : "ar"} className={inputClass}><option value="ar">العربية</option><option value="en">English</option></select></Field>
          </div>
        </AdminCard>

        <AdminCard className="p-5">
          <p className="text-[10px] uppercase tracking-[.2em] text-white/30">{ar ? "حفظ الحالة" : "SAVE STATE"}</p>
          <p className="mt-2 text-sm leading-6 text-white/40">{ar ? "احفظ كمسودة، أو انقلها للمراجعة، أو علّمها جاهزة قبل إرسالها لاحقًا للاعتماد." : "Save as draft, move to review, or mark ready before sending it to approval."}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
            <button name="mode" value="draft" className="rounded-xl border border-white/10 bg-white/[.035] px-3 py-2.5 text-xs font-medium text-white/65">{ar ? "حفظ مسودة" : "Save draft"}</button>
            <button name="mode" value="review" className="rounded-xl border border-gold/20 bg-gold/[.055] px-3 py-2.5 text-xs font-medium text-gold">{ar ? "إرسال للمراجعة" : "Move to review"}</button>
            <button name="mode" value="ready" className="rounded-xl border border-emerald-400/20 bg-emerald-400/[.055] px-3 py-2.5 text-xs font-medium text-emerald-100">{ar ? "جاهز للاعتماد" : "Mark ready"}</button>
          </div>
        </AdminCard>
      </div>
    </form>}
  </AdminPageContainer>;
}

const inputClass = "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-gold/35";
const textareaClass = `${inputClass} resize-y leading-6`;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2"><span className="text-[11px] font-medium text-white/45">{label}</span>{children}</label>;
}
