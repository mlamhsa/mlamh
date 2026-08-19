import {
    Bell,
    BriefcaseBusiness,
    Building2,
    CheckCircle2,
    Clock3,
    FilePenLine,
    History,
    Send,
    UserRound,
    XCircle,
  } from "lucide-react";
  
  type AuditMetadata = Record<string, unknown>;
  
  export type AuditEvent = {
    id: number;
    event_type: string;
    target_type: string;
    target_id: string;
    actor_id: string | null;
    metadata: AuditMetadata | null;
    created_at: string | null;
  };
  
  type AuditCardProps = {
    event: AuditEvent;
    language?: "ar" | "en";
  };
  
  function getMetadataString(
    metadata: AuditMetadata | null,
    key: string,
  ) {
    if (!metadata) return "";
  
    const value = metadata[key];
  
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }
  
    return String(value).trim();
  }
  
  function formatDate(
    value: string | null,
    language: "ar" | "en",
  ) {
    if (!value) {
      return language === "ar"
        ? "غير محدد"
        : "Unknown";
    }
  
    try {
      return new Intl.DateTimeFormat(
        language === "ar"
          ? "ar-SA"
          : "en-US",
        {
          dateStyle: "medium",
          timeStyle: "short",
        },
      ).format(new Date(value));
    } catch {
      return value;
    }
  }
  
  function getEventPresentation(
    event: AuditEvent,
    language: "ar" | "en",
  ) {
    const isArabic =
      language === "ar";
  
    const metadata =
      event.metadata ?? {};
  
    const title =
      getMetadataString(
        metadata,
        "title",
      );
  
    const companyName =
      getMetadataString(
        metadata,
        "company_name",
      );
  
    const reason =
      getMetadataString(
        metadata,
        "reason",
      );
  
    switch (event.event_type) {
      case "talent_approved":
        return {
          title: isArabic
            ? "اعتماد ملف موهبة"
            : "Talent approved",
          description:
            isArabic
              ? "تم اعتماد ملف الموهبة."
              : "Talent profile was approved.",
          icon: CheckCircle2,
        };
  
      case "talent_changes_requested":
        return {
          title: isArabic
            ? "طلب تعديل ملف موهبة"
            : "Talent changes requested",
          description:
            reason ||
            (isArabic
              ? "تم طلب تعديلات على ملف الموهبة."
              : "Changes were requested for the talent profile."),
          icon: FilePenLine,
        };
  
      case "talent_rejected":
        return {
          title: isArabic
            ? "رفض ملف موهبة"
            : "Talent rejected",
          description:
            reason ||
            (isArabic
              ? "تم رفض ملف الموهبة."
              : "Talent profile was rejected."),
          icon: XCircle,
        };
  
      case "publisher_verified":
        return {
          title: isArabic
            ? "اعتماد حساب ناشر"
            : "Publisher approved",
          description:
            companyName
              ? isArabic
                ? `تم اعتماد حساب ${companyName}.`
                : `${companyName} was approved.`
              : isArabic
                ? "تم اعتماد حساب الناشر."
                : "Publisher account was approved.",
          icon: Building2,
        };
  
      case "publisher_changes_requested":
        return {
          title: isArabic
            ? "طلب تعديل حساب ناشر"
            : "Publisher changes requested",
          description:
            reason ||
            (isArabic
              ? "تم طلب تعديلات على حساب الناشر."
              : "Changes were requested for the publisher account."),
          icon: FilePenLine,
        };
  
        case "message_report_reviewed":
  return {
    title: isArabic
      ? "مراجعة بلاغ رسالة"
      : "Message report reviewed",

    description:
      reason ||
      (isArabic
        ? "تمت مراجعة بلاغ على إحدى رسائل المحادثة."
        : "A reported conversation message was reviewed."),

    icon: CheckCircle2,
  };
  
      case "publisher_rejected":
        return {
          title: isArabic
            ? "رفض حساب ناشر"
            : "Publisher rejected",
          description:
            reason ||
            (isArabic
              ? "تم رفض حساب الناشر."
              : "Publisher account was rejected."),
          icon: XCircle,
        };
  
      case "opportunity_pending_review":
        return {
          title: isArabic
            ? "فرصة بانتظار المراجعة"
            : "Opportunity pending review",
          description:
            title ||
            (isArabic
              ? "تم إرسال فرصة جديدة للمراجعة."
              : "A new opportunity was submitted for review."),
          icon: Clock3,
        };
  
      case "opportunity_published":
        return {
          title: isArabic
            ? "نشر فرصة"
            : "Opportunity published",
          description:
            title ||
            (isArabic
              ? "تم اعتماد ونشر الفرصة."
              : "The opportunity was approved and published."),
          icon: BriefcaseBusiness,
        };
  
      case "opportunity_rejected":
        return {
          title: isArabic
            ? "رفض فرصة"
            : "Opportunity rejected",
          description:
            reason ||
            title ||
            (isArabic
              ? "تم رفض الفرصة."
              : "The opportunity was rejected."),
          icon: XCircle,
        };
  
      case "opportunity_needs_changes":
        return {
          title: isArabic
            ? "طلب تعديل فرصة"
            : "Opportunity changes requested",
          description:
            reason ||
            title ||
            (isArabic
              ? "تم طلب تعديلات على الفرصة."
              : "Changes were requested for the opportunity."),
          icon: FilePenLine,
        };
  
      case "opportunity_invitation":
        return {
          title: isArabic
            ? "إرسال دعوة لموهبة"
            : "Talent invitation sent",
          description:
            title
              ? isArabic
                ? `تم إرسال دعوة للتقديم على "${title}".`
                : `An invitation was sent for "${title}".`
              : isArabic
                ? "تم إرسال دعوة للتقديم."
                : "An invitation to apply was sent.",
          icon: Send,
        };
  
      case "application_created":
        return {
          title: isArabic
            ? "طلب تقديم جديد"
            : "New application",
          description:
            title ||
            (isArabic
              ? "تم إنشاء طلب تقديم جديد."
              : "A new application was created."),
          icon: UserRound,
        };
  
      case "application_accepted":
        return {
          title: isArabic
            ? "قبول طلب تقديم"
            : "Application accepted",
          description:
            title ||
            (isArabic
              ? "تم قبول طلب التقديم."
              : "The application was accepted."),
          icon: CheckCircle2,
        };
  
      case "application_rejected":
        return {
          title: isArabic
            ? "رفض طلب تقديم"
            : "Application rejected",
          description:
            title ||
            (isArabic
              ? "تم رفض طلب التقديم."
              : "The application was rejected."),
          icon: XCircle,
        };
  
      default:
        return {
          title:
            event.event_type,
          description:
            isArabic
              ? "عملية مسجلة في النظام."
              : "Recorded system event.",
          icon: History,
        };
    }
  }
  
  function getTargetLabel(
    targetType: string,
    language: "ar" | "en",
  ) {
    const isArabic =
      language === "ar";
  
    switch (targetType) {
      case "talent":
        return isArabic
          ? "موهبة"
          : "Talent";
  
      case "publisher":
        return isArabic
          ? "ناشر"
          : "Publisher";
  
      case "admin":
        return isArabic
          ? "الإدارة"
          : "Admin";
  
      case "opportunity":
        return isArabic
          ? "فرصة"
          : "Opportunity";
  
      default:
        return targetType;
    }
  }
  
  export function AuditCard({
    event,
    language = "ar",
  }: AuditCardProps) {
    const isArabic =
      language === "ar";
  
    const presentation =
      getEventPresentation(
        event,
        language,
      );
  
    const Icon =
      presentation.icon;
  
    return (
      <article
        dir={isArabic ? "rtl" : "ltr"}
        className="group rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition hover:border-gold/20 hover:bg-white/[0.03]"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/15 bg-gold/[0.06] text-gold">
            <Icon className="h-5 w-5" />
          </div>
  
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/25">
                  EVENT #{event.id}
                </p>
  
                <h3 className="mt-1 text-base font-medium text-white/90">
                  {presentation.title}
                </h3>
  
                <p className="mt-2 text-sm leading-7 text-white/50">
                  {presentation.description}
                </p>
              </div>
  
              <span className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1 text-[11px] text-white/45">
                {formatDate(
                  event.created_at,
                  language,
                )}
              </span>
            </div>
  
            <div className="mt-5 grid gap-3 border-t border-white/[0.06] pt-4 sm:grid-cols-3">
              <div>
                <p className="text-[10px] text-white/25">
                  {isArabic
                    ? "المستهدف"
                    : "Target"}
                </p>
  
                <p className="mt-1 text-xs text-white/60">
                  {getTargetLabel(
                    event.target_type,
                    language,
                  )}{" "}
                  · {event.target_id}
                </p>
              </div>
  
              <div>
                <p className="text-[10px] text-white/25">
                  {isArabic
                    ? "منفذ العملية"
                    : "Actor"}
                </p>
  
                <p
                  dir="ltr"
                  className="mt-1 truncate text-xs text-white/60"
                  title={
                    event.actor_id ??
                    undefined
                  }
                >
                  {event.actor_id ||
                    (isArabic
                      ? "النظام"
                      : "System")}
                </p>
              </div>
  
              <div>
                <p className="text-[10px] text-white/25">
                  {isArabic
                    ? "نوع الحدث"
                    : "Event type"}
                </p>
  
                <p
                  dir="ltr"
                  className="mt-1 truncate text-xs text-white/60"
                >
                  {event.event_type}
                </p>
              </div>
            </div>
  
            {event.metadata &&
            Object.keys(event.metadata)
              .length > 0 ? (
              <details className="mt-4">
                <summary className="cursor-pointer text-xs text-gold/70 transition hover:text-gold">
                  {isArabic
                    ? "عرض البيانات التقنية"
                    : "View metadata"}
                </summary>
  
                <pre
                  dir="ltr"
                  className="mt-3 max-h-60 overflow-auto rounded-xl border border-white/[0.06] bg-black/30 p-4 text-left text-[11px] leading-6 text-white/40"
                >
                  {JSON.stringify(
                    event.metadata,
                    null,
                    2,
                  )}
                </pre>
              </details>
            ) : null}
          </div>
        </div>
      </article>
    );
  }