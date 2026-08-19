import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Inbox,
} from "lucide-react";

type Opportunity = {
  id?: string | number | null;
  slug?: string | null;
  title?: string | null;
  opportunity_type?: string | null;
};

type RecentApplication = {
  id: string | number;
  status?: string | null;
  created_at?: string | null;
  opportunities?: Opportunity | Opportunity[] | null;
  conversationId?: string | number | null;
};

type TalentApplicationsProps = {
  locale: string;
  isRtl: boolean;
  recentApplications: RecentApplication[];
  notificationItems: string[];
};

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  href: string;
  action: string;
  isRtl: boolean;
};

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  text: string;
  action?: string;
  href?: string;
};

function normalizeStatus(status?: string | null) {
  if (
    status === "reviewing" ||
    status === "shortlisted" ||
    status === "accepted" ||
    status === "rejected"
  ) {
    return status;
  }

  return "pending";
}

function statusLabel(status?: string | null, isRtl = false) {
  const normalized = normalizeStatus(status);

  if (normalized === "reviewing") {
    return isRtl ? "قيد المراجعة" : "Reviewing";
  }

  if (normalized === "shortlisted") {
    return isRtl ? "القائمة المختصرة" : "Shortlisted";
  }

  if (normalized === "accepted") {
    return isRtl ? "مقبول" : "Accepted";
  }

  if (normalized === "rejected") {
    return isRtl ? "مرفوض" : "Rejected";
  }

  return isRtl ? "جديد" : "Pending";
}

function statusClass(status?: string | null) {
  const normalized = normalizeStatus(status);

  if (normalized === "reviewing") {
    return "border-blue-400/30 bg-blue-400/10 text-blue-300";
  }

  if (normalized === "shortlisted") {
    return "border-gold/30 bg-gold/10 text-gold";
  }

  if (normalized === "accepted") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  if (normalized === "rejected") {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
}

function formatDate(value?: string | null, locale = "en") {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const dateLocale = locale.toLowerCase().startsWith("ar")
    ? "ar-SA"
    : "en-GB";

  return new Intl.DateTimeFormat(dateLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function opportunityTypeLabel(
  value?: string | null,
  isRtl = false,
) {
  if (!value) {
    return "-";
  }

  const normalized = value.toLowerCase();

  const labels: Record<string, { ar: string; en: string }> = {
    acting: { ar: "تمثيل", en: "Acting" },
    modeling: { ar: "عرض أزياء", en: "Modeling" },
    voice_over: { ar: "تعليق صوتي", en: "Voice-over" },
    content_creation: { ar: "صناعة محتوى", en: "Content creation" },
    commercial: { ar: "إعلان تجاري", en: "Commercial" },
    event: { ar: "فعالية", en: "Event" },
  };

  const translated = labels[normalized];

  if (translated) {
    return isRtl ? translated.ar : translated.en;
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function TalentApplications({
  locale,
  isRtl,
  recentApplications,
  notificationItems,
}: TalentApplicationsProps) {
  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.85fr)]">
      <section className="min-w-0 rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
        <SectionHeader
          eyebrow={isRtl ? "آخر الطلبات" : "Recent Applications"}
          title={isRtl ? "طلباتك الأخيرة" : "Your recent applications"}
          href={`/${locale}/talent-dashboard/applications`}
          action={isRtl ? "عرض الكل" : "View all"}
          isRtl={isRtl}
        />

        {recentApplications.length > 0 ? (
          <div className="space-y-3">
            {recentApplications.map((application) => {
  const opportunity = Array.isArray(
    application.opportunities,
  )
    ? application.opportunities[0]
    : application.opportunities;

    const opportunityHref =
    opportunity?.slug || opportunity?.id
      ? `/${locale}/opportunities/${opportunity.slug ?? opportunity.id}`
      : null;

  const normalizedStatus = normalizeStatus(
    application.status,
  );

  const canMessagePublisher =
    normalizedStatus === "accepted" &&
    Boolean(application.conversationId);

  return (
                <article
                  key={application.id}
                  className="rounded-[1.35rem] border border-white/10 bg-black/25 p-4 transition hover:border-gold/30 sm:rounded-[1.5rem] sm:p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="inline-flex shrink-0 rounded-full border border-white/10 bg-white/[0.03] p-2.5 text-gold">
                        <BriefcaseBusiness
                          size={17}
                          aria-hidden="true"
                        />
                      </div>

                      <div className="min-w-0">
                        <h3 className="break-words text-base font-light text-white sm:text-lg">
                          {opportunity?.title ??
                            (isRtl
                              ? "فرصة بدون عنوان"
                              : "Untitled opportunity")}
                        </h3>

                        <p className="mt-1.5 text-xs text-white/40 sm:text-sm">
                          {opportunityTypeLabel(
                            opportunity?.opportunity_type,
                            isRtl,
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                      <span
                        className={`arabic-safe inline-flex rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] sm:text-[11px] sm:tracking-[0.18em] ${statusClass(
                          application.status,
                        )}`}
                      >
                        {statusLabel(application.status, isRtl)}
                      </span>

                      <time
                        dateTime={application.created_at ?? undefined}
                        className="inline-flex items-center gap-2 text-xs text-white/40"
                      >
                        <CalendarDays
                          size={14}
                          aria-hidden="true"
                        />
                        {formatDate(application.created_at, locale)}
                      </time>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-4">
                  {opportunityHref ? (
  <Link
    href={opportunityHref}
    className="arabic-safe inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-white/10 px-4 text-[11px] text-white/55 transition hover:border-gold/40 hover:text-gold"
  >
    {isRtl ? "عرض الفرصة" : "View Opportunity"}
    <ArrowUpRight
      size={14}
      aria-hidden="true"
      className={isRtl ? "-scale-x-100" : undefined}
    />
  </Link>
) : null}

  {canMessagePublisher && application.conversationId ? (
    <Link
      href={`/${locale}/talent-dashboard/messages/${application.conversationId}`}
      className="arabic-safe inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-gold/40 bg-gold/[0.08] px-4 text-[11px] text-gold transition hover:bg-gold hover:text-black"
    >
      {isRtl ? "مراسلة الناشر" : "Message Publisher"}
      <ArrowUpRight
        size={14}
        aria-hidden="true"
        className={isRtl ? "-scale-x-100" : undefined}
      />
    </Link>
  ) : null}
</div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Inbox size={22} aria-hidden="true" />}
            title={
              isRtl ? "لا توجد طلبات بعد" : "No applications yet"
            }
            text={
              isRtl
                ? "ابدأ باستعراض الفرص وقدّم على الفرصة المناسبة لك."
                : "Browse opportunities and apply to the ones that fit you."
            }
            action={
              isRtl ? "استعراض الفرص" : "Browse opportunities"
            }
            href={`/${locale}/opportunities`}
          />
        )}
      </section>

      <section className="min-w-0 rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
        <SectionHeader
          eyebrow={isRtl ? "الإشعارات" : "Notifications"}
          title={isRtl ? "آخر التنبيهات" : "Latest updates"}
          href={`/${locale}/talent-dashboard/notifications`}
          action={isRtl ? "فتح" : "Open"}
          isRtl={isRtl}
        />

        {notificationItems.length > 0 ? (
          <div className="space-y-3">
            {notificationItems.slice(0, 4).map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/25 p-4"
              >
                <div className="inline-flex shrink-0 rounded-full border border-gold/20 bg-gold/[0.06] p-2 text-gold">
                  <Bell size={15} aria-hidden="true" />
                </div>

                <p className="min-w-0 text-sm leading-7 text-white/60">
                  {item}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Bell size={22} aria-hidden="true" />}
            title={
              isRtl ? "لا توجد إشعارات" : "No notifications"
            }
            text={
              isRtl
                ? "سنخبرك هنا عند وجود تحديثات مهمة."
                : "Important updates will appear here."
            }
          />
        )}
      </section>
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  href,
  action,
  isRtl,
}: SectionHeaderProps) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
      <div className="min-w-0">
        <p className="arabic-safe text-[10px] uppercase tracking-[0.26em] text-gold sm:text-xs sm:tracking-[0.35em]">
          {eyebrow}
        </p>

        <h2 className="mt-2 break-words text-2xl font-light text-white sm:mt-3 sm:text-3xl">
          {title}
        </h2>
      </div>

      <Link
        href={href}
        className="arabic-safe inline-flex shrink-0 items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-gold transition hover:text-gold-soft sm:gap-2 sm:text-xs sm:tracking-[0.22em]"
      >
        {action}
        <ArrowUpRight
          size={14}
          aria-hidden="true"
          className={isRtl ? "-scale-x-100" : undefined}
        />
      </Link>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  text,
  action,
  href,
}: EmptyStateProps) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 px-5 py-8 text-center sm:p-8">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-gold/20 bg-gold/[0.06] text-gold">
        {icon}
      </div>

      <h3 className="text-lg font-light text-white sm:text-xl">
        {title}
      </h3>

      <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-white/40">
        {text}
      </p>

      {action && href ? (
        <Link
          href={href}
          className="arabic-safe mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-gold/40 bg-gold/[0.06] px-5 py-3 text-[11px] uppercase tracking-[0.18em] text-gold transition hover:bg-gold hover:text-black sm:text-xs sm:tracking-[0.22em]"
        >
          {action}
        </Link>
      ) : null}
    </div>
  );
}
