"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Mail, Play, RefreshCw, Save, Send, ShieldCheck, Sparkles, X } from "lucide-react";

type Lead = {
  id: number;
  organization_name: string;
  organization_type: string;
  country_code: string | null;
  fit_score: number | null;
  fit_rationale: string | null;
  contact_name: string | null;
  contact_role: string | null;
  contact_email: string | null;
  status: string;
  last_researched_at: string | null;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;
  gmail_thread_id: string | null;
  created_at: string;
};

type Outreach = {
  id: number;
  investor_id: number;
  kind: string;
  status: string;
  to_email: string;
  subject: string;
  body_text: string;
  rationale: string | null;
  positioning_angle: string | null;
  attachment_plan: unknown;
  approval_requested_at: string | null;
  approved_at: string | null;
  sent_at: string | null;
  gmail_thread_id: string | null;
  created_at: string;
};

type Props = {
  isArabic: boolean;
  leads: Lead[];
  outreach: Outreach[];
  masterBrief: string;
  gmail: {
    status: string;
    emailAddress: string | null;
    connectedAt: string | null;
  };
};

type DraftEdit = {
  subject: string;
  bodyText: string;
};

function statusLabel(status: string, isArabic: boolean) {
  const labels: Record<string, [string, string]> = {
    discovered: ["مكتشف", "Discovered"],
    qualified: ["مؤهل", "Qualified"],
    awaiting_approval: ["بانتظار الموافقة", "Awaiting approval"],
    contacted: ["تم التواصل", "Contacted"],
    follow_up: ["متابعة", "Follow-up"],
    meeting: ["اجتماع", "Meeting"],
    interested: ["مهتم", "Interested"],
    due_diligence: ["فحص نافي للجهالة", "Due diligence"],
    passed: ["اعتذر", "Passed"],
    rejected: ["مرفوض", "Rejected"],
    archived: ["مؤرشف", "Archived"],
    pending_approval: ["بانتظار الموافقة", "Awaiting approval"],
    approved: ["معتمد للإرسال", "Approved to send"],
    sent: ["تم الإرسال", "Sent"],
    failed: ["فشل الإرسال", "Send failed"],
    cancelled: ["ملغي", "Cancelled"],
  };
  const label = labels[status];
  return label ? label[isArabic ? 0 : 1] : status;
}

function formatDate(value: string | null, isArabic: boolean) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat(isArabic ? "ar-SA" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Riyadh",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function InvestorRelationsWorkspace({ isArabic, leads, outreach, masterBrief, gmail }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [brief, setBrief] = useState(masterBrief);
  const [draftEdits, setDraftEdits] = useState<Record<number, DraftEdit>>({});

  async function action(key: string, url: string, init: RequestInit = { method: "POST" }) {
    setBusy(key);
    setMessage(null);
    try {
      const response = await fetch(url, {
        ...init,
        headers: { "Content-Type": "application/json" },
      });
      const payload = await response.json().catch(() => ({})) as { ok?: boolean; error?: string };
      if (!response.ok || payload.ok === false) throw new Error(payload.error || `HTTP ${response.status}`);
      setMessage(isArabic ? "تم تنفيذ الإجراء." : "Action completed.");
      router.refresh();
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : (isArabic ? "تعذر تنفيذ الإجراء." : "Action failed."));
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function saveBrief() {
    await action("brief", "/api/admin/investors/master-brief", {
      method: "POST",
      body: JSON.stringify({ masterBrief: brief }),
    });
  }

  function currentDraft(item: Outreach): DraftEdit {
    return draftEdits[item.id] ?? { subject: item.subject, bodyText: item.body_text };
  }

  function updateDraft(item: Outreach, patch: Partial<DraftEdit>) {
    setDraftEdits((current) => ({
      ...current,
      [item.id]: {
        ...currentDraft(item),
        ...patch,
      },
    }));
  }

  async function saveDraft(item: Outreach) {
    const draft = currentDraft(item);
    const saved = await action(`edit-${item.id}`, `/api/admin/investors/outreach/${item.id}/edit`, {
      method: "POST",
      body: JSON.stringify({ subject: draft.subject, bodyText: draft.bodyText }),
    });
    if (saved) {
      setDraftEdits((current) => {
        const next = { ...current };
        delete next[item.id];
        return next;
      });
    }
  }

  const queue = outreach.filter((item) => ["pending_approval", "approved", "failed"].includes(item.status));

  return (
    <div className="space-y-8" dir={isArabic ? "rtl" : "ltr"}>
      <section className="rounded-2xl border border-gold/20 bg-[radial-gradient(circle_at_top_right,rgba(212,160,23,0.09),transparent_42%),rgba(255,255,255,0.025)] p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-gold/70">AGENT CONTROL</p>
            <h2 className="mt-2 text-xl font-light text-white">
              {isArabic ? "تشغيل مدير علاقات المستثمرين" : "Run Investor Relations AI"}
            </h2>
            <p className="mt-2 max-w-2xl text-xs leading-6 text-white/40">
              {isArabic
                ? "يفحص الردود أولًا، يجهز المتابعات المستحقة، ثم يبحث عن مستثمرين جدد. لا يرسل أي بريد في هذا التشغيل."
                : "Checks replies first, prepares due follow-ups, then discovers new investors. This run never sends email."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => action("run", "/api/admin/investors/run")}
              disabled={busy !== null}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-gold/30 bg-gold/[0.11] px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold/[0.16] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === "run" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {isArabic ? "شغّل الوكيل الآن" : "Run agent now"}
            </button>
            <button
              type="button"
              onClick={() => router.refresh()}
              disabled={busy !== null}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-2 text-sm text-white/65 transition hover:border-white/[0.16] hover:text-white"
            >
              <RefreshCw className="h-4 w-4" />
              {isArabic ? "تحديث" : "Refresh"}
            </button>
          </div>
        </div>
        {message ? (
          <div className="mt-4 rounded-xl border border-white/[0.08] bg-black/25 px-4 py-3 text-xs text-white/60">{message}</div>
        ) : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-gold/70">GMAIL</p>
              <h2 className="mt-2 text-lg font-light text-white">{isArabic ? "البريد التشغيلي" : "Investor mailbox"}</h2>
            </div>
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${gmail.status === "connected" ? "border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-200" : "border-amber-300/20 bg-amber-300/[0.07] text-amber-100/80"}`}>
              {gmail.status === "connected" ? (isArabic ? "متصل" : "Connected") : (isArabic ? "غير متصل" : "Not connected")}
            </span>
          </div>
          <div className="mt-5 rounded-xl border border-white/[0.07] bg-black/20 p-4">
            <p className="text-xs text-white/35">{isArabic ? "الحساب" : "Account"}</p>
            <p className="mt-1 break-all text-sm text-white/75" dir="ltr">{gmail.emailAddress || "—"}</p>
            <p className="mt-3 text-[11px] text-white/30">
              {isArabic ? "الإرسال وقراءة الردود فقط لعلاقات المستثمرين." : "Used only for investor outreach sending and reply monitoring."}
            </p>
          </div>
          <a
            href="/api/admin/investors/integrations/gmail/connect"
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.035] px-4 py-2 text-sm text-white/70 transition hover:border-gold/25 hover:text-gold"
          >
            <Mail className="h-4 w-4" />
            {gmail.status === "connected" ? (isArabic ? "إعادة ربط Gmail" : "Reconnect Gmail") : (isArabic ? "ربط Gmail" : "Connect Gmail")}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-gold/70">MASTER INVESTOR BRIEF</p>
              <h2 className="mt-2 text-lg font-light text-white">{isArabic ? "مصدر الحقيقة للوكيل" : "Agent source of truth"}</h2>
            </div>
            <button
              type="button"
              onClick={saveBrief}
              disabled={busy !== null || brief.trim() === masterBrief.trim()}
              className="rounded-xl border border-gold/25 px-4 py-2 text-xs font-medium text-gold transition hover:bg-gold/[0.08] disabled:cursor-not-allowed disabled:opacity-35"
            >
              {busy === "brief" ? (isArabic ? "جارٍ الحفظ..." : "Saving...") : (isArabic ? "حفظ" : "Save")}
            </button>
          </div>
          <textarea
            value={brief}
            onChange={(event) => setBrief(event.target.value)}
            rows={10}
            className="mt-4 w-full resize-y rounded-xl border border-white/[0.09] bg-black/25 p-4 text-sm leading-7 text-white/75 outline-none transition focus:border-gold/30"
            placeholder={isArabic ? "تعريف ملامح، السوق، نموذج العمل، المرحلة الحالية وما نبحث عنه من المستثمر..." : "MLAMH overview, market, business model, current stage and what we seek from investors..."}
          />
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-gold/70">INVESTOR PIPELINE</p>
            <h2 className="mt-1 text-xl font-light text-white">{isArabic ? "المستثمرون المكتشفون" : "Discovered investors"}</h2>
          </div>
          <span className="text-xs text-white/30">{leads.length}</span>
        </div>
        {leads.length ? (
          <div className="grid gap-3 xl:grid-cols-2">
            {leads.map((lead) => (
              <article key={lead.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.022] p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-medium text-white/85">{lead.organization_name}</h3>
                      {typeof lead.fit_score === "number" ? (
                        <span className="rounded-full border border-gold/20 bg-gold/[0.06] px-2 py-0.5 text-[10px] font-semibold text-gold">{lead.fit_score}%</span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-white/35">{lead.organization_type} {lead.country_code ? `· ${lead.country_code}` : ""}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] text-white/50">{statusLabel(lead.status, isArabic)}</span>
                </div>
                {lead.fit_rationale ? <p className="mt-4 text-xs leading-6 text-white/45">{lead.fit_rationale}</p> : null}
                <div className="mt-4 grid gap-2 rounded-xl border border-white/[0.06] bg-black/20 p-3 text-xs sm:grid-cols-2">
                  <div>
                    <p className="text-white/25">{isArabic ? "جهة الاتصال" : "Contact"}</p>
                    <p className="mt-1 text-white/65">{lead.contact_name || "—"}</p>
                    <p className="text-[11px] text-white/35">{lead.contact_role || ""}</p>
                  </div>
                  <div>
                    <p className="text-white/25">{isArabic ? "البريد" : "Email"}</p>
                    <p className="mt-1 break-all text-white/65" dir="ltr">{lead.contact_email || "—"}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[10px] text-white/25">{isArabic ? "آخر تواصل:" : "Last contact:"} {formatDate(lead.last_contacted_at, isArabic)}</p>
                  <button
                    type="button"
                    onClick={() => action(`draft-${lead.id}`, `/api/admin/investors/${lead.id}/draft`)}
                    disabled={busy !== null || !lead.contact_email || ["awaiting_approval", "contacted", "meeting", "interested", "due_diligence", "passed"].includes(lead.status)}
                    className="inline-flex items-center gap-2 rounded-xl border border-gold/20 px-3 py-2 text-xs text-gold transition hover:bg-gold/[0.07] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    {busy === `draft-${lead.id}` ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {isArabic ? "جهز رسالة التواصل" : "Prepare outreach"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.015] p-8 text-center text-sm text-white/40">
            {isArabic ? "لا توجد بيانات بعد. شغّل الوكيل لبدء البحث." : "No investor records yet. Run the agent to start discovery."}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-gold/70">APPROVAL QUEUE</p>
            <h2 className="mt-1 text-xl font-light text-white">{isArabic ? "الرسائل التي تحتاج قرارك" : "Messages requiring your decision"}</h2>
          </div>
          <span className="text-xs text-white/30">{queue.length}</span>
        </div>
        {queue.length ? (
          <div className="space-y-4">
            {queue.map((item) => {
              const lead = leads.find((candidate) => candidate.id === item.investor_id);
              const draft = currentDraft(item);
              const dirty = Boolean(draftEdits[item.id]);
              return (
                <article key={item.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.022] p-5 sm:p-6">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-medium text-white/85">{lead?.organization_name || `#${item.investor_id}`}</h3>
                        <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] text-white/45">{item.kind}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] ${item.status === "approved" ? "border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-200" : item.status === "failed" ? "border-red-400/20 bg-red-400/[0.06] text-red-200" : "border-amber-300/20 bg-amber-300/[0.07] text-amber-100"}`}>{statusLabel(item.status, isArabic)}</span>
                      </div>
                      <p className="mt-2 text-xs text-white/35" dir="ltr">{item.to_email}</p>
                    </div>
                    <p className="text-[10px] text-white/25">{formatDate(item.created_at, isArabic)}</p>
                  </div>

                  {item.rationale ? (
                    <div className="mt-4 rounded-xl border border-gold/10 bg-gold/[0.025] p-3 text-xs leading-6 text-white/45">
                      <span className="font-medium text-gold/75">{isArabic ? "سبب الصياغة: " : "Rationale: "}</span>{item.rationale}
                    </div>
                  ) : null}

                  <div className="mt-4 rounded-xl border border-white/[0.07] bg-black/25 p-4">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-white/25">SUBJECT</p>
                    {item.status === "pending_approval" ? (
                      <input
                        value={draft.subject}
                        onChange={(event) => updateDraft(item, { subject: event.target.value })}
                        dir="auto"
                        className="mt-2 w-full rounded-lg border border-white/[0.08] bg-black/25 px-3 py-2 text-sm font-medium text-white/80 outline-none transition focus:border-gold/30"
                      />
                    ) : (
                      <p className="mt-2 text-sm font-medium text-white/80" dir="auto">{item.subject}</p>
                    )}
                    <div className="my-4 h-px bg-white/[0.06]" />
                    {item.status === "pending_approval" ? (
                      <textarea
                        value={draft.bodyText}
                        onChange={(event) => updateDraft(item, { bodyText: event.target.value })}
                        rows={9}
                        dir="auto"
                        className="w-full resize-y rounded-lg border border-white/[0.08] bg-black/20 px-3 py-3 text-sm leading-7 text-white/65 outline-none transition focus:border-gold/30"
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-white/60" dir="auto">{item.body_text}</pre>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    {item.status === "pending_approval" ? (
                      <>
                        {dirty ? (
                          <button
                            type="button"
                            onClick={() => saveDraft(item)}
                            disabled={busy !== null || !draft.subject.trim() || draft.bodyText.trim().length < 20}
                            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-gold/25 bg-gold/[0.05] px-3 py-2 text-xs font-medium text-gold transition hover:bg-gold/[0.09] disabled:opacity-35"
                          >
                            {busy === `edit-${item.id}` ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                            {isArabic ? "حفظ التعديلات" : "Save edits"}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => action(`reject-${item.id}`, `/api/admin/investors/outreach/${item.id}/reject`, { method: "POST", body: JSON.stringify({}) })}
                          disabled={busy !== null}
                          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/[0.09] px-3 py-2 text-xs text-white/50 transition hover:border-red-400/20 hover:text-red-200 disabled:opacity-40"
                        >
                          <X className="h-3.5 w-3.5" />{isArabic ? "رفض" : "Reject"}
                        </button>
                        <button
                          type="button"
                          onClick={() => action(`approve-${item.id}`, `/api/admin/investors/outreach/${item.id}/approve`)}
                          disabled={busy !== null || dirty}
                          title={dirty ? (isArabic ? "احفظ التعديلات قبل الموافقة" : "Save your edits before approving") : undefined}
                          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] px-3 py-2 text-xs font-medium text-emerald-200 transition hover:bg-emerald-400/[0.11] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />{isArabic ? "أوافق" : "Approve"}
                        </button>
                      </>
                    ) : null}
                    {item.status === "approved" ? (
                      <button
                        type="button"
                        onClick={() => action(`send-${item.id}`, `/api/admin/investors/outreach/${item.id}/send`)}
                        disabled={busy !== null || gmail.status !== "connected"}
                        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-gold/30 bg-gold/[0.1] px-4 py-2 text-xs font-medium text-gold transition hover:bg-gold/[0.15] disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        {busy === `send-${item.id}` ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        {isArabic ? "إرسال عبر Gmail" : "Send via Gmail"}
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.015] p-8 text-center text-sm text-white/40">
            {isArabic ? "لا توجد رسائل بانتظار قرارك." : "No outreach messages are awaiting your decision."}
          </div>
        )}
      </section>
    </div>
  );
}
