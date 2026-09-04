import { notFound } from "next/navigation";

import { AdminCard, AdminPageContainer, AdminPageHeader } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  approveMarketingApproval,
  rejectMarketingApproval,
  scheduleMarketingApproval,
} from "../../actions";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
};

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim())
    : [];
}

function targetLabel(target: string, isArabic: boolean) {
  if (target === "instagram") return isArabic ? "إنستغرام" : "Instagram";
  if (target === "facebook") return isArabic ? "فيسبوك" : "Facebook";
  return target || (isArabic ? "غير محدد" : "Not set");
}

function visualRequired(target: string, contentType: string | null | undefined) {
  if (target === "instagram") return true;
  if (target === "facebook") return ["reel", "story", "carousel", "video"].includes((contentType ?? "").toLowerCase());
  return false;
}

export default async function SocialApprovalReviewPage({ params, searchParams }: PageProps) {
  await requireAdminAccess();
  const [{ id: idParam }, { lang }] = await Promise.all([params, searchParams]);
  const isArabic = getAdminLanguage(lang) === "ar";
  const approvalId = Number(idParam);
  if (!Number.isInteger(approvalId) || approvalId <= 0) notFound();

  const db = createAdminClient();
  const { data: approval, error } = await db
    .from("marketing_approvals")
    .select("id,task_id,status,reason,proposed_action,channel,risk_level,created_at")
    .eq("id", approvalId)
    .maybeSingle();

  if (error || !approval) notFound();

  const action = asRecord(approval.proposed_action);
  const target = stringValue(action.target).toLowerCase();
  const provider = stringValue(action.provider) || approval.channel || "buffer";
  const caption = stringValue(action.text) || stringValue(action.caption) || stringValue(action.content);
  const cta = stringValue(action.cta);
  const actionAssetUrls = stringArray(action.asset_urls);
  const testMode = action.test_mode === true;
  const contentId = Number(action.content_id);

  const { data: content } = Number.isInteger(contentId) && contentId > 0
    ? await db
        .from("marketing_content")
        .select("title,hook,caption,body,cta,content_type,channel,status,asset_references")
        .eq("id", contentId)
        .maybeSingle()
    : { data: null };

  const contentAssetUrls = stringArray(content?.asset_references);
  const assetUrls = [...new Set([...actionAssetUrls, ...contentAssetUrls])];
  const { data: creatives } = Number.isInteger(contentId) && contentId > 0
    ? await db.from("marketing_creatives").select("id,platform,status,storage_path,preview_path,aspect_ratio,type").eq("content_id", contentId).order("created_at", { ascending: false })
    : { data: [] };
  const relevantCreatives = (creatives ?? []).filter((creative) => {
    const platform = (creative.platform ?? "").toLowerCase();
    return !platform || platform === target || platform === "buffer" || platform === "social";
  });
  const readyCreative = relevantCreatives.find((creative) => ["ready", "approved", "published"].includes((creative.status ?? "").toLowerCase()) && Boolean(creative.storage_path?.trim() || creative.preview_path?.trim()));
  const needsVisual = visualRequired(target, content?.content_type);
  const publishableVisualAttached = assetUrls.length > 0;
  const blockedByCreative = needsVisual && !publishableVisualAttached;

  const displayCaption = caption || content?.caption || content?.body || "";
  const displayCta = cta || content?.cta || "";
  const displayTitle = content?.title || (isArabic ? "منشور اجتماعي جاهز للمراجعة" : "Social post ready for review");

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title={isArabic ? "مراجعة المنشور قبل الاعتماد" : "Review post before approval"}
        description={isArabic
          ? "هذه المعاينة تعرض نفس المحتوى والأصول التي ستُرسل إلى القناة عند اعتمادك. لا يمكن اعتماد قناة بصرية بدون أصل صالح للنشر."
          : "This preview shows the same content and assets that will be sent to the channel. Visual channels cannot be approved without a publishable asset."}
      />

      <div className="mb-5 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-gold/25 bg-gold/[0.06] px-3 py-1.5 text-gold">
          {targetLabel(target, isArabic)}
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-white/60">
          {provider}
        </span>
        {testMode ? (
          <span className="rounded-full border border-amber-300/25 bg-amber-300/[0.06] px-3 py-1.5 text-amber-200">
            TEST MODE
          </span>
        ) : null}
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-white/60">
          {isArabic ? "الحالة" : "Status"}: {approval.status}
        </span>
        {blockedByCreative ? <span className="rounded-full border border-amber-300/25 bg-amber-300/[0.08] px-3 py-1.5 text-amber-100">{isArabic ? "محظور · بانتظار التصميم" : "Blocked · Waiting for creative"}</span> : null}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)]">
        <AdminCard className="overflow-hidden p-0">
          <div className="border-b border-white/[0.06] px-5 py-4">
            <p className="text-[11px] text-white/35">{isArabic ? "المعاينة البصرية" : "Visual preview"}</p>
            <h2 className="mt-1 text-base font-medium text-white/90">{displayTitle}</h2>
          </div>

          <div className="space-y-4 p-5">
            {assetUrls.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {assetUrls.map((url, index) => (
                  <a
                    key={`${url}-${index}`}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-black/30"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={isArabic ? `صورة المنشور ${index + 1}` : `Post asset ${index + 1}`}
                      className="aspect-square w-full object-contain transition group-hover:scale-[1.01]"
                    />
                  </a>
                ))}
              </div>
            ) : (
              <div className={`rounded-2xl border p-5 text-sm ${needsVisual ? "border-amber-300/20 bg-amber-300/[0.05] text-amber-100" : "border-white/[0.08] bg-white/[0.025] text-white/50"}`}>
                <p className="font-medium">{needsVisual ? (isArabic ? "لا يمكن اعتماد هذا المنشور بدون تصميم" : "This post cannot be approved without a creative") : (isArabic ? "لا توجد صورة مرتبطة، وهذه القناة/الصيغة لا تفرض أصلًا بصريًا." : "No image is attached; this channel/format does not require one.")}</p>
                {needsVisual ? <p className="mt-2 text-xs leading-6 opacity-70">{readyCreative ? (isArabic ? "يوجد Creative في المكتبة لكنه لم يُرفق بعد كأصل قابل للنشر. يجب ربطه بالمحتوى قبل الاعتماد." : "A creative exists in the library but is not attached as a publishable asset yet. Attach it to the content before approval.") : (isArabic ? "يجب أن تنجز Sarah التصميم المناسب للقناة ثم يتم إرفاقه بالمحتوى قبل أن يظهر زر الاعتماد." : "Sarah must complete the channel-ready creative and attach it to the content before approval becomes available.")}</p> : null}
              </div>
            )}

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
              <p className="text-[10px] uppercase tracking-[.16em] text-white/30">
                {isArabic ? "النص الذي سيُنشر" : "Caption to publish"}
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/75">
                {displayCaption || (isArabic ? "لا يوجد نص." : "No caption.")}
              </p>
            </div>

            {displayCta ? (
              <div className="rounded-2xl border border-gold/15 bg-gold/[0.025] p-4">
                <p className="text-[10px] uppercase tracking-[.16em] text-gold/55">CTA</p>
                <p className="mt-2 text-sm text-gold/90">{displayCta}</p>
              </div>
            ) : null}
          </div>
        </AdminCard>

        <div className="space-y-4">
          <AdminCard className="p-5">
            <p className="text-xs font-medium text-white/75">{isArabic ? "قبل أن تعتمد" : "Before you approve"}</p>
            <p className="mt-3 text-sm leading-7 text-white/50">
              {blockedByCreative
                ? isArabic
                  ? "القرار مقفل لأن هذه القناة تحتاج أصلًا بصريًا صالحًا للنشر. أكمل التصميم واربطه بالمحتوى ثم ارجع للاعتماد."
                  : "This decision is locked because the channel requires a publishable visual. Complete and attach the creative, then return to approval."
                : testMode
                  ? isArabic
                    ? "هذا اختبار على قناة MLAMH المملوكة لنا. التشغيل الخارجي العام يبقى معطلاً، لكن الضغط على اعتماد سيشغّل هذا الـSandbox Job فورًا."
                    : "This is a test on an MLAMH-owned channel. General external execution remains disabled, but approving will immediately run this sandbox job."
                  : isArabic
                    ? "اعتماد هذا القرار يسمح للنظام بإنشاء مهمة النشر المحكومة للقناة المحددة."
                    : "Approving this decision allows the system to create the governed publishing job for the selected channel."}
            </p>
            <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/20 p-3 text-xs leading-6 text-white/40">
              <p>{isArabic ? "السبب الداخلي" : "Internal reason"}: {approval.reason || "—"}</p>
              <p>{isArabic ? "المخاطر" : "Risk"}: {approval.risk_level || "—"}</p>
              <p>Approval #{approval.id} · Task #{approval.task_id}</p>
            </div>
          </AdminCard>

          {approval.status === "pending" ? (
            <AdminCard className="space-y-3 p-5">
              {blockedByCreative ? <div className="rounded-xl border border-amber-300/20 bg-amber-300/[0.05] px-4 py-3 text-sm text-amber-100/80">{isArabic ? "بانتظار Creative صالح للنشر — الاعتماد والجدولة غير متاحين الآن." : "Waiting for a publishable creative — approval and scheduling are unavailable."}</div> : <>
                <form action={approveMarketingApproval}>
                  <input type="hidden" name="approval_id" value={approval.id} />
                  <button className="w-full rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm font-medium text-gold transition hover:bg-gold/15">
                    {testMode ? (isArabic ? "اعتماد ونشر الاختبار" : "Approve & run test") : (isArabic ? "اعتماد" : "Approve")}
                  </button>
                </form>

                <form action={scheduleMarketingApproval} className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <input type="hidden" name="approval_id" value={approval.id} />
                  <input
                    type="datetime-local"
                    name="execute_after"
                    required
                    className="min-w-0 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white/70 outline-none focus:border-gold/30"
                  />
                  <button className="rounded-xl border border-white/10 px-4 py-2.5 text-xs text-white/65">
                    {isArabic ? "اعتماد وجدولة" : "Approve & schedule"}
                  </button>
                </form>
              </>}

              <form action={rejectMarketingApproval}>
                <input type="hidden" name="approval_id" value={approval.id} />
                <button className="w-full rounded-xl border border-red-400/20 bg-red-400/[0.04] px-4 py-3 text-sm text-red-200/80 transition hover:bg-red-400/[0.08]">
                  {isArabic ? "رفض" : "Reject"}
                </button>
              </form>
            </AdminCard>
          ) : (
            <AdminCard className="p-5 text-sm text-white/50">
              {isArabic ? "تم اتخاذ قرار على هذا الاعتماد بالفعل." : "A decision has already been made on this approval."}
            </AdminCard>
          )}
        </div>
      </div>
    </AdminPageContainer>
  );
}
