import {
  AdminCard,
  AdminGrid,
  AdminPageContainer,
  AdminPageHeader,
  AdminStatCard,
} from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  approveMarketingApproval,
  cancelMarketingApproval,
  editMarketingApproval,
  rejectMarketingApproval,
  scheduleMarketingApproval,
} from "./actions";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ lang?: string }> };

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isExternalReply(value: unknown) {
  return asRecord(value).kind === "external_reply";
}

function ExternalReplyPreview({ action, isArabic }: { action: unknown; isArabic: boolean }) {
  const proposed = asRecord(action);
  const recipient = asRecord(proposed.recipient);
  const shortlist = asRecord(proposed.shortlist);
  const gap = asRecord(shortlist.supplyGap ?? proposed.talent_supply_gap);
  const matches = Array.isArray(shortlist.matches) ? shortlist.matches : [];
  const sourceReference = text(proposed.source_reference);

  return (
    <div className="mt-5 space-y-4 rounded-2xl border border-gold/15 bg-black/20 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-gold">
            {isArabic ? "رد خارجي جاهز للمراجعة" : "External reply ready for review"}
          </p>
          <p className="mt-1 text-[11px] text-white/35">
            {sourceReference || (isArabic ? "بدون مرجع مصدر" : "No source reference")}
          </p>
        </div>
        <span className="rounded-full border border-amber-300/20 bg-amber-300/[0.06] px-3 py-1 text-[10px] text-amber-200">
          {isArabic ? "لن يُرسل قبل الاعتماد والتنفيذ" : "Not sent before approval and execution"}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
          <p className="text-[10px] text-white/35">{isArabic ? "المستلم" : "Recipient"}</p>
          <p className="mt-1 text-sm text-white/75">{text(recipient.name) || "—"}</p>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
          <p className="text-[10px] text-white/35">{isArabic ? "البريد" : "Email"}</p>
          <p dir="ltr" className="mt-1 break-all text-sm text-white/75">{text(recipient.email) || "—"}</p>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
          <p className="text-[10px] text-white/35">{isArabic ? "الجوال" : "Phone"}</p>
          <p dir="ltr" className="mt-1 text-sm text-white/75">{text(recipient.phone) || "—"}</p>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
        <p className="text-[10px] text-white/35">{isArabic ? "نص الرد المقترح" : "Proposed reply"}</p>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/75">
          {text(proposed.content) || "—"}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
          <p className="text-[10px] text-white/35">{isArabic ? "المواهب المطابقة" : "Matched talents"}</p>
          <p className="mt-1 text-lg text-white/80">{matches.length}</p>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
          <p className="text-[10px] text-white/35">{isArabic ? "المطلوب" : "Needed"}</p>
          <p className="mt-1 text-lg text-white/80">{numberValue(gap.needed) ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
          <p className="text-[10px] text-white/35">{isArabic ? "العجز" : "Supply gap"}</p>
          <p className="mt-1 text-lg text-white/80">{numberValue(gap.missing) ?? "—"}</p>
        </div>
      </div>

      {matches.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] text-white/35">{isArabic ? "الترشيحات" : "Shortlist"}</p>
          {matches.map((match, index) => {
            const row = asRecord(match);
            const reasons = Array.isArray(row.reasons) ? row.reasons.filter((v) => typeof v === "string") : [];
            return (
              <div key={`${text(row.talentName)}-${index}`} className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.035] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-emerald-100">{text(row.talentName) || `#${numberValue(row.talentId) ?? index + 1}`}</p>
                  <p className="text-xs text-emerald-200/70">{isArabic ? "التطابق" : "Score"}: {numberValue(row.score) ?? "—"}</p>
                </div>
                {reasons.length > 0 ? <p className="mt-2 text-[11px] text-white/35">{reasons.join(" · ")}</p> : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default async function MarketingApprovalsPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();

  const { data, error } = await db
    .from("marketing_approvals")
    .select("id,task_id,requested_by_agent_id,approval_level,status,reason,proposed_action,preview,channel,risk_level,expires_at,execute_after,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const approvals = data ?? [];
  const pending = approvals.filter((item) => item.status === "pending").length;
  const ceoOnly = approvals.filter(
    (item) => item.status === "pending" && item.approval_level === "ceo_only",
  ).length;
  const highRisk = approvals.filter(
    (item) => item.status === "pending" && ["high", "critical"].includes(item.risk_level),
  ).length;

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title={isArabic ? "مركز الاعتمادات" : "Approvals Center"}
        description={
          isArabic
            ? "راجع المخرج الخارجي الفعلي قبل اعتماده. الاعتماد يجهز مهمة تنفيذ فقط ولا يرسل أو ينشر تلقائيًا."
            : "Review the actual external deliverable before approval. Approval only prepares an execution job; it does not send or publish automatically."
        }
      />

      {error ? (
        <AdminCard className="mb-5 p-5 text-sm text-amber-200">
          {isArabic
            ? "جداول Marketing Hub غير مفعلة بعد. لن يتم عرض بيانات افتراضية."
            : "Marketing Hub tables are not active yet. No mock data will be shown."}
        </AdminCard>
      ) : null}

      <AdminGrid className="mb-6 md:grid-cols-3">
        <AdminStatCard label={isArabic ? "بانتظار الاعتماد" : "Pending"} value={pending} />
        <AdminStatCard label={isArabic ? "CEO فقط" : "CEO Only"} value={ceoOnly} />
        <AdminStatCard label={isArabic ? "مخاطر مرتفعة" : "High Risk"} value={highRisk} />
      </AdminGrid>

      <div className="space-y-4">
        {approvals.length === 0 ? (
          <AdminCard className="p-6 text-sm text-white/40">
            {isArabic ? "لا توجد طلبات اعتماد حقيقية حاليًا." : "No real approval requests yet."}
          </AdminCard>
        ) : (
          approvals.map((item) => {
            const externalReply = isExternalReply(item.proposed_action);
            return (
              <AdminCard key={item.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-sm text-white">
                      #{item.id} · Task #{item.task_id} · {item.requested_by_agent_id ?? "system"}
                    </div>
                    <div className="mt-1 text-xs text-white/40">
                      {item.reason ?? (isArabic ? "بدون سبب مسجل" : "No reason recorded")}
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="text-xs text-gold">{item.status}</div>
                    <div className="mt-1 text-[11px] text-white/35">
                      {item.approval_level} · {item.risk_level} · {item.channel ?? "internal"}
                    </div>
                  </div>
                </div>

                {externalReply ? (
                  <ExternalReplyPreview action={item.proposed_action} isArabic={isArabic} />
                ) : null}

                {item.status === "pending" ? (
                  <div className="mt-5 space-y-3">
                    {!externalReply ? (
                      <form action={editMarketingApproval} className="grid gap-2 lg:grid-cols-[1fr_1fr_auto]">
                        <input type="hidden" name="approval_id" value={item.id} />
                        <input
                          name="reason"
                          defaultValue={item.reason ?? ""}
                          placeholder={isArabic ? "سبب/ملاحظة" : "Reason/note"}
                          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white"
                        />
                        <input
                          name="preview_json"
                          defaultValue={JSON.stringify(item.preview ?? {})}
                          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white"
                        />
                        <button className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/65">
                          {isArabic ? "تعديل" : "Edit"}
                        </button>
                      </form>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      <form action={approveMarketingApproval}>
                        <input type="hidden" name="approval_id" value={item.id} />
                        <button className="rounded-xl border border-gold/30 bg-gold/10 px-4 py-2 text-xs text-gold">
                          {externalReply
                            ? isArabic
                              ? "اعتماد الرد وتجهيزه للتنفيذ"
                              : "Approve reply & make execution-ready"
                            : isArabic
                              ? "اعتماد وتجهيز للنشر"
                              : "Approve & Make Ready"}
                        </button>
                      </form>
                      <form action={rejectMarketingApproval}>
                        <input type="hidden" name="approval_id" value={item.id} />
                        <button className="rounded-xl border border-red-400/20 px-4 py-2 text-xs text-red-300">
                          {externalReply ? (isArabic ? "رفض الرد" : "Reject reply") : isArabic ? "رفض" : "Reject"}
                        </button>
                      </form>
                      <form action={cancelMarketingApproval}>
                        <input type="hidden" name="approval_id" value={item.id} />
                        <button className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/50">
                          {isArabic ? "إلغاء" : "Cancel"}
                        </button>
                      </form>
                    </div>

                    {!externalReply ? (
                      <form action={scheduleMarketingApproval} className="flex flex-wrap gap-2">
                        <input type="hidden" name="approval_id" value={item.id} />
                        <input
                          type="datetime-local"
                          name="execute_after"
                          required
                          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white"
                        />
                        <button className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/60">
                          {isArabic ? "اعتماد مع وقت جدولة" : "Approve with Schedule"}
                        </button>
                      </form>
                    ) : null}
                  </div>
                ) : null}
              </AdminCard>
            );
          })
        )}
      </div>
    </AdminPageContainer>
  );
}
