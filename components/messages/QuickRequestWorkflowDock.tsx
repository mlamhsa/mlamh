import {
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  FileImage,
  Film,
  Phone,
  Ruler,
  UserCheck,
} from "lucide-react";

import {
  confirmQuickRequestSelectionAction,
  requestQuickRequestMaterialsAction,
  respondToQuickRequestSelectionAction,
  shareQuickRequestContactAction,
} from "@/lib/actions/quick-request-workflow-actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type Props = {
  conversationId: number;
  locale: string;
};

type WorkflowEvent = {
  event_type: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
};

type ViewerRole = "publisher" | "talent";

const MATERIAL_TYPES = [
  {
    key: "portfolio",
    ar: "معرض الأعمال",
    en: "Portfolio",
    icon: FileImage,
  },
  {
    key: "intro_video",
    ar: "فيديو تعريفي",
    en: "Intro video",
    icon: Film,
  },
  {
    key: "measurements",
    ar: "المقاسات / التفاصيل",
    en: "Measurements / details",
    icon: Ruler,
  },
  {
    key: "availability",
    ar: "التوفر للموعد",
    en: "Availability",
    icon: Clock3,
  },
] as const;

function hasEvent(events: WorkflowEvent[], eventType: string) {
  return events.some((event) => event.event_type === eventType);
}

function requestedMaterialKeys(events: WorkflowEvent[]) {
  return new Set(
    events
      .filter((event) => event.event_type === "quick_request_materials_requested")
      .map((event) => String(event.metadata?.requestType ?? ""))
      .filter(Boolean),
  );
}

function contactSharedBy(events: WorkflowEvent[], role: ViewerRole) {
  return events.some(
    (event) =>
      event.event_type === "quick_request_contact_shared" &&
      String(event.metadata?.sharedBy ?? "") === role,
  );
}

export default async function QuickRequestWorkflowDock({
  conversationId,
  locale,
}: Props) {
  if (!Number.isInteger(conversationId) || conversationId <= 0) return null;

  const isArabic = locale === "ar";
  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) return null;

  const adminClient = createAdminClient();

  const { data: conversation } = await adminClient
    .from("conversations")
    .select("id,application_id,opportunity_id,publisher_id,talent_id,status")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conversation || !conversation.application_id) return null;

  const [{ data: opportunity }, { data: application }, { data: profile }] =
    await Promise.all([
      adminClient
        .from("opportunities")
        .select("id,title,posting_mode")
        .eq("id", conversation.opportunity_id)
        .maybeSingle(),
      adminClient
        .from("opportunity_applications")
        .select("id,status")
        .eq("id", conversation.application_id)
        .maybeSingle(),
      adminClient
        .from("profiles")
        .select("id,account_type,phone")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  if (
    !opportunity ||
    opportunity.posting_mode !== "quick" ||
    !application ||
    application.status !== "accepted" ||
    !profile
  ) {
    return null;
  }

  let viewerRole: ViewerRole | null = null;
  let hasPhone = Boolean(profile.phone && String(profile.phone).trim());

  if (profile.account_type === "publisher") {
    const { data: publisher } = await adminClient
      .from("publishers")
      .select("id,phone")
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (!publisher || Number(publisher.id) !== Number(conversation.publisher_id)) {
      return null;
    }

    viewerRole = "publisher";
    hasPhone =
      hasPhone || Boolean(publisher.phone && String(publisher.phone).trim());
  } else if (profile.account_type === "talent") {
    const { data: talent } = await adminClient
      .from("talents")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!talent || Number(talent.id) !== Number(conversation.talent_id)) {
      return null;
    }

    viewerRole = "talent";
  }

  if (!viewerRole) return null;

  const { data: rawEvents, error: eventsError } = await adminClient
    .from("events")
    .select("event_type,metadata,created_at")
    .eq("target_type", "conversation")
    .eq("target_id", String(conversationId))
    .in("event_type", [
      "quick_request_materials_requested",
      "quick_request_selection_confirmed",
      "quick_request_talent_confirmed",
      "quick_request_talent_declined",
      "quick_request_contact_shared",
    ])
    .order("created_at", { ascending: true });

  if (eventsError) {
    console.error("Quick Request workflow events error:", eventsError);
    return null;
  }

  const events = (rawEvents ?? []) as WorkflowEvent[];
  const materialsRequested = requestedMaterialKeys(events);
  const selectionConfirmed = hasEvent(
    events,
    "quick_request_selection_confirmed",
  );
  const talentConfirmed = hasEvent(events, "quick_request_talent_confirmed");
  const talentDeclined = hasEvent(events, "quick_request_talent_declined");
  const viewerSharedContact = contactSharedBy(events, viewerRole);
  const counterpartSharedContact = contactSharedBy(
    events,
    viewerRole === "publisher" ? "talent" : "publisher",
  );

  let stageLabel = isArabic ? "اختيار مبدئي" : "Preliminary selection";
  let stageTone = "border-amber-300/30 bg-amber-300/[0.08] text-amber-100";

  if (talentDeclined) {
    stageLabel = isArabic ? "تم الاعتذار" : "Declined";
    stageTone = "border-red-300/30 bg-red-300/[0.08] text-red-100";
  } else if (talentConfirmed) {
    stageLabel = isArabic ? "تم تأكيد التعاون" : "Collaboration confirmed";
    stageTone = "border-emerald-300/30 bg-emerald-300/[0.08] text-emerald-100";
  } else if (selectionConfirmed) {
    stageLabel =
      viewerRole === "publisher"
        ? isArabic
          ? "بانتظار تأكيد الموهبة"
          : "Waiting for talent confirmation"
        : isArabic
          ? "بانتظار تأكيدك"
          : "Your confirmation is required";
    stageTone = "border-gold/35 bg-gold/[0.09] text-gold";
  }

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className={`fixed z-[95] bottom-[calc(6rem+env(safe-area-inset-bottom))] ${
        isArabic ? "left-3 sm:left-5" : "right-3 sm:right-5"
      } lg:bottom-6`}
    >
      <details className="group w-[min(92vw,25rem)] overflow-hidden rounded-2xl border border-white/12 bg-black/95 shadow-2xl shadow-black/60 backdrop-blur-2xl">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 select-none">
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-gold">
              {isArabic ? "الخطوة التالية" : "Next step"}
            </p>
            <p className="mt-0.5 truncate text-sm font-medium text-white">
              {stageLabel}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`hidden rounded-full border px-2.5 py-1 text-[10px] sm:inline-flex ${stageTone}`}
            >
              {stageLabel}
            </span>
            <ChevronDown
              size={17}
              className="text-white/50 transition group-open:rotate-180"
            />
          </div>
        </summary>

        <div className="max-h-[68vh] overflow-y-auto border-t border-white/10 p-4">
          {talentDeclined ? (
            <div className="rounded-xl border border-red-300/20 bg-red-300/[0.05] p-4">
              <div className="flex items-start gap-3">
                <CircleAlert size={18} className="mt-0.5 shrink-0 text-red-200" />
                <div>
                  <p className="text-sm font-medium text-white">
                    {isArabic ? "الموهبة اعتذرت" : "Talent declined"}
                  </p>
                  <p className="mt-1 text-xs leading-6 text-white/50">
                    {isArabic
                      ? "يمكن للطرفين الاحتفاظ بسجل المحادثة، ولا تُفتح بيانات التواصل."
                      : "The conversation history remains available and contact details stay private."}
                  </p>
                </div>
              </div>
            </div>
          ) : talentConfirmed ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/[0.05] p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0 text-emerald-200"
                  />
                  <div>
                    <p className="text-sm font-medium text-white">
                      {isArabic ? "تم تأكيد التعاون من الطرفين" : "Both sides confirmed"}
                    </p>
                    <p className="mt-1 text-xs leading-6 text-white/50">
                      {isArabic
                        ? "يمكنكم الاستمرار داخل ملامح أو مشاركة رقم التواصل بشكل اختياري."
                        : "You can continue inside MLAMH or optionally share a contact number."}
                    </p>
                  </div>
                </div>
              </div>

              {counterpartSharedContact ? (
                <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs text-white/60">
                  {isArabic
                    ? "شارك الطرف الآخر بيانات التواصل داخل المحادثة."
                    : "The other party shared contact details in the conversation."}
                </p>
              ) : null}

              {viewerSharedContact ? (
                <div className="inline-flex items-center gap-2 rounded-xl border border-gold/20 bg-gold/[0.06] px-3 py-2.5 text-xs text-gold">
                  <Phone size={14} />
                  {isArabic ? "تمت مشاركة رقمك داخل المحادثة" : "Your number was shared in the chat"}
                </div>
              ) : hasPhone ? (
                <form action={shareQuickRequestContactAction}>
                  <input type="hidden" name="conversationId" value={conversationId} />
                  <input type="hidden" name="locale" value={locale} />
                  <button
                    type="submit"
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 text-sm font-semibold text-black transition hover:bg-gold-soft"
                  >
                    <Phone size={16} />
                    {isArabic ? "مشاركة رقم الجوال" : "Share mobile number"}
                  </button>
                </form>
              ) : (
                <p className="rounded-xl border border-amber-300/20 bg-amber-300/[0.05] px-3 py-2.5 text-xs leading-6 text-amber-100/80">
                  {isArabic
                    ? "لا يوجد رقم جوال محفوظ في حسابك. يمكنك الاستمرار داخل ملامح."
                    : "No mobile number is saved on your account. You can continue inside MLAMH."}
                </p>
              )}
            </div>
          ) : viewerRole === "publisher" ? (
            selectionConfirmed ? (
              <div className="rounded-xl border border-gold/20 bg-gold/[0.05] p-4">
                <div className="flex items-start gap-3">
                  <UserCheck size={18} className="mt-0.5 shrink-0 text-gold" />
                  <div>
                    <p className="text-sm font-medium text-white">
                      {isArabic ? "تم إرسال التأكيد للموهبة" : "Confirmation sent to talent"}
                    </p>
                    <p className="mt-1 text-xs leading-6 text-white/50">
                      {isArabic
                        ? "لن تظهر بيانات التواصل حتى تؤكد الموهبة قبولها."
                        : "Contact details stay private until the talent confirms acceptance."}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-white">
                    {isArabic ? "اختيار مبدئي" : "Preliminary selection"}
                  </p>
                  <p className="mt-1 text-xs leading-6 text-white/45">
                    {isArabic
                      ? "راجع أعمال الموهبة أو اطلب معلومات إضافية قبل التأكيد النهائي."
                      : "Review the talent's work or request more information before final confirmation."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {MATERIAL_TYPES.map((item) => {
                    const Icon = item.icon;
                    const alreadyRequested = materialsRequested.has(item.key);
                    return (
                      <form key={item.key} action={requestQuickRequestMaterialsAction}>
                        <input type="hidden" name="conversationId" value={conversationId} />
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="requestType" value={item.key} />
                        <button
                          type="submit"
                          disabled={alreadyRequested}
                          className="flex min-h-[4.25rem] w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.025] px-2 text-center text-[11px] text-white/70 transition hover:border-gold/35 hover:text-gold disabled:cursor-default disabled:border-emerald-300/15 disabled:text-emerald-200/65"
                        >
                          <Icon size={16} />
                          {alreadyRequested
                            ? isArabic
                              ? "تم الطلب"
                              : "Requested"
                            : isArabic
                              ? item.ar
                              : item.en}
                        </button>
                      </form>
                    );
                  })}
                </div>

                <form action={confirmQuickRequestSelectionAction}>
                  <input type="hidden" name="conversationId" value={conversationId} />
                  <input type="hidden" name="locale" value={locale} />
                  <button
                    type="submit"
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 text-sm font-semibold text-black transition hover:bg-gold-soft"
                  >
                    <UserCheck size={17} />
                    {isArabic ? "تأكيد الاختيار" : "Confirm selection"}
                  </button>
                </form>

                <p className="text-[10px] leading-5 text-white/30">
                  {isArabic
                    ? "تأكيد الاختيار لا يكشف أرقام التواصل. الموهبة يجب أن تؤكد قبولها أولًا."
                    : "Confirming selection does not reveal contact details. The talent must accept first."}
                </p>
              </div>
            )
          ) : selectionConfirmed ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-gold/20 bg-gold/[0.05] p-4">
                <p className="text-sm font-medium text-white">
                  {isArabic ? "الناشر أكد اختياره لك" : "The publisher confirmed your selection"}
                </p>
                <p className="mt-1 text-xs leading-6 text-white/50">
                  {isArabic
                    ? "أكد قبولك للطلب أو اعتذر. لن تتم مشاركة رقمك تلقائيًا."
                    : "Accept or decline the request. Your number will not be shared automatically."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <form action={respondToQuickRequestSelectionAction}>
                  <input type="hidden" name="conversationId" value={conversationId} />
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="decision" value="accept" />
                  <button
                    type="submit"
                    className="min-h-11 w-full rounded-xl bg-gold px-3 text-sm font-semibold text-black transition hover:bg-gold-soft"
                  >
                    {isArabic ? "تأكيد القبول" : "Confirm"}
                  </button>
                </form>

                <form action={respondToQuickRequestSelectionAction}>
                  <input type="hidden" name="conversationId" value={conversationId} />
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="decision" value="decline" />
                  <button
                    type="submit"
                    className="min-h-11 w-full rounded-xl border border-white/15 px-3 text-sm text-white/65 transition hover:border-red-300/30 hover:text-red-100"
                  >
                    {isArabic ? "اعتذار" : "Decline"}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-white">
                  {isArabic ? "تم اختيارك مبدئيًا" : "You were preliminarily selected"}
                </p>
                <p className="mt-1 text-xs leading-6 text-white/45">
                  {isArabic
                    ? "قد يطلب الناشر أعمالًا أو معلومات إضافية قبل التأكيد النهائي."
                    : "The publisher may request work samples or more information before final confirmation."}
                </p>
              </div>

              {materialsRequested.size > 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                  <p className="text-xs font-medium text-gold">
                    {isArabic ? "المطلوب منك" : "Requested from you"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {MATERIAL_TYPES.filter((item) =>
                      materialsRequested.has(item.key),
                    ).map((item) => (
                      <span
                        key={item.key}
                        className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-white/60"
                      >
                        {isArabic ? item.ar : item.en}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-[11px] leading-5 text-white/40">
                    {isArabic
                      ? "أرسل المطلوب من زر المرفقات في أسفل المحادثة، أو اكتب ردك مباشرة."
                      : "Use the attachment button below the chat to send the requested items, or reply directly."}
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
