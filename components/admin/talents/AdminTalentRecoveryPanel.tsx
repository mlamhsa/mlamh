"use client";

import { AlertTriangle, CheckCircle2, Clock3, Mail, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { sendTalentRecoveryReminderAction } from "@/lib/actions/send-talent-recovery-reminder";
import type { TalentProfileRecoveryKind } from "@/lib/talent/send-profile-recovery-reminder";

type MissingRequirement = { key: string; label: string };

type Props = {
  talentId: number;
  language: "ar" | "en";
  approvalStatus: string;
  profileCompletion: number;
  isReady: boolean;
  missingRequirements: MissingRequirement[];
  reminderCount: number;
  lastReminderAt: string | null;
  lastReminderKind: string | null;
  automaticReminderState:
    | "scheduled"
    | "due"
    | "completed"
    | "not_applicable"
    | "unavailable";
  nextAutomaticReminderAt: string | null;
  currentRecoveryKind: TalentProfileRecoveryKind | null;
  providerAvatarDetected: boolean;
};

function kindLabel(kind: string | null, ar: boolean) {
  if (kind === "incomplete_profile") return ar ? "استكمال ملف ناقص" : "Incomplete profile";
  if (kind === "ready_not_submitted") return ar ? "جاهز ولم يُرسل" : "Ready, not submitted";
  if (kind === "changes_requested") return ar ? "تعديلات مطلوبة" : "Changes requested";
  return ar ? "لا يوجد" : "None";
}

function formatDate(value: string | null, ar: boolean) {
  if (!value) return null;

  return new Intl.DateTimeFormat(ar ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function AdminTalentRecoveryPanel(props: Props) {
  const router = useRouter();
  const ar = props.language === "ar";
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const canRemind = ["not_submitted", "changes_requested"].includes(props.approvalStatus);

  const lastReminder = formatDate(props.lastReminderAt, ar) ?? (ar ? "لم يُرسل بعد" : "Not sent yet");
  const nextAutomaticReminder = formatDate(props.nextAutomaticReminderAt, ar);

  const automaticStatus = (() => {
    switch (props.automaticReminderState) {
      case "scheduled":
        return {
          label: nextAutomaticReminder ?? (ar ? "مجدول" : "Scheduled"),
          helper: kindLabel(props.currentRecoveryKind, ar),
          className: "text-sky-300",
        };
      case "due":
        return {
          label: ar ? "مستحق الآن" : "Due now",
          helper: nextAutomaticReminder
            ? ar
              ? `كان موعده ${nextAutomaticReminder}`
              : `Scheduled for ${nextAutomaticReminder}`
            : kindLabel(props.currentRecoveryKind, ar),
          className: "text-amber-200",
        };
      case "completed":
        return {
          label: ar ? "اكتملت دورة التذكيرات" : "Reminder cycle complete",
          helper: kindLabel(props.currentRecoveryKind, ar),
          className: "text-emerald-300",
        };
      case "not_applicable":
        return {
          label: ar ? "غير مطلوب حاليًا" : "Not currently needed",
          helper: ar ? "حالة الملف لا تحتاج استعادة" : "Profile state does not need recovery",
          className: "text-white/55",
        };
      default:
        return {
          label: ar ? "تعذر تحديد الموعد" : "Schedule unavailable",
          helper: kindLabel(props.currentRecoveryKind, ar),
          className: "text-white/45",
        };
    }
  })();

  function sendReminder() {
    const formData = new FormData();
    formData.set("talent_id", String(props.talentId));
    formData.set("locale", props.language);
    setMessage(null);
    setError(false);
    startTransition(async () => {
      const result = await sendTalentRecoveryReminderAction(formData);
      setMessage(result.message);
      setError(!result.success);
      if (result.success) router.refresh();
    });
  }

  return (
    <section className="rounded-3xl border border-gold/15 bg-gold/[0.025] p-5 sm:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-gold">
            {ar ? "تشغيل واستعادة الملف" : "Profile recovery operations"}
          </p>
          <h2 className="mt-2 text-xl font-light text-white">
            {ar ? "حالة الاستكمال والتواصل" : "Completion & communication"}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/40">
            {ar
              ? "التذكيرات الآلية هي المسار الأساسي: بعد 24 ساعة، ثم 72 ساعة، ثم 7 أيام إذا بقي الملف في حالة تحتاج استعادة. زر الإرسال اليدوي أدناه مخصص فقط للتدخل الاستثنائي."
              : "Automatic reminders are the primary path: after 24 hours, then 72 hours, then 7 days while the profile still needs recovery. The manual button below is only for exceptional intervention."}
          </p>
        </div>
        {canRemind ? (
          <button
            type="button"
            disabled={pending}
            onClick={sendReminder}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gold/25 bg-gold/[0.07] px-5 text-sm text-gold transition hover:bg-gold hover:text-black disabled:cursor-wait disabled:opacity-50"
          >
            <Mail className="h-4 w-4" />
            {pending ? (ar ? "جارٍ الإرسال..." : "Sending...") : ar ? "إرسال يدوي الآن" : "Send manually now"}
          </button>
        ) : null}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
          <p className="text-xs text-white/35">{ar ? "اكتمال الملف" : "Profile completion"}</p>
          <p className="mt-2 text-2xl text-gold">{props.profileCompletion}%</p>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
          <p className="text-xs text-white/35">{ar ? "جاهزية المراجعة" : "Review readiness"}</p>
          <p className={`mt-2 flex items-center gap-2 text-sm ${props.isReady ? "text-emerald-300" : "text-amber-200"}`}>
            {props.isReady ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {props.isReady ? (ar ? "المتطلبات الأساسية مكتملة" : "Core requirements complete") : (ar ? "يحتاج استكمال" : "Needs completion")}
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
          <p className="text-xs text-white/35">{ar ? "التذكيرات المرسلة" : "Reminders sent"}</p>
          <p className="mt-2 text-2xl text-white/75">{props.reminderCount}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
          <p className="text-xs text-white/35">{ar ? "آخر تذكير" : "Last reminder"}</p>
          <p className="mt-2 text-sm text-white/70">{lastReminder}</p>
          <p className="mt-1 text-[11px] text-white/30">{kindLabel(props.lastReminderKind, ar)}</p>
        </div>
        <div className="rounded-2xl border border-sky-400/10 bg-sky-400/[0.025] p-4">
          <p className="flex items-center gap-1.5 text-xs text-white/35">
            <Clock3 className="h-3.5 w-3.5" />
            {ar ? "التذكير الآلي القادم" : "Next automatic reminder"}
          </p>
          <p className={`mt-2 text-sm ${automaticStatus.className}`}>{automaticStatus.label}</p>
          <p className="mt-1 text-[11px] text-white/30">{automaticStatus.helper}</p>
        </div>
      </div>

      {props.providerAvatarDetected ? (
        <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-4">
          <div className="flex items-start gap-3 text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="text-sm font-medium">
                {ar ? "تم اكتشاف صورة حساب Google" : "Google account avatar detected"}
              </p>
              <p className="mt-1 text-xs leading-6 text-amber-100/65">
                {ar
                  ? "هذه الصورة جاءت من بيانات تسجيل الدخول القديمة وليست بالضرورة صورة مهنية رفعها المستخدم داخل ملامح. راجع جودتها، وإذا كانت غير مناسبة استخدم «طلب تعديل» واختر سبب جودة الصورة الرئيسية."
                  : "This image came from legacy sign-in metadata and may not be a professional photo uploaded in MLAMH. Review its quality; if unsuitable, use Request changes and choose the main photo quality reason."}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {!props.isReady && props.missingRequirements.length > 0 ? (
        <div className="mt-5 rounded-2xl border border-amber-400/15 bg-amber-400/[0.04] p-4">
          <div className="flex items-center gap-2 text-sm text-amber-200">
            <AlertTriangle className="h-4 w-4" />
            <span>{ar ? "العناصر المطلوبة قبل إرسال الملف للمراجعة" : "Required before review submission"}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {props.missingRequirements.map((item) => (
              <span key={item.key} className="rounded-full border border-amber-300/15 bg-black/15 px-3 py-1.5 text-xs text-amber-100/75">
                {item.label}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {message ? (
        <div role="status" className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${error ? "border-red-400/20 bg-red-400/[0.06] text-red-300" : "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300"}`}>
          {message}
        </div>
      ) : null}

      <div className="mt-4 flex items-center gap-2 text-[11px] text-white/25">
        <RefreshCcw className="h-3.5 w-3.5" />
        {ar ? "الآلي هو المسار الافتراضي، وأي تذكير يدوي يُسجل في نفس سجل الأحداث لمنع تكرار المتابعة بدون أثر." : "Automatic recovery is the default path, and any manual reminder is recorded in the same event history."}
      </div>
    </section>
  );
}
