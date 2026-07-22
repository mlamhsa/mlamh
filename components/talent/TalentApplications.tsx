"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Inbox,
} from "lucide-react";

type Opportunity = {
  title?: string | null;
  opportunity_type?: string | null;
};

type RecentApplication = {
  id: string;
  status?: string | null;
  created_at?: string | null;
  opportunities?: Opportunity | Opportunity[] | null;
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
  icon: React.ReactNode;
  title: string;
  text: string;
  action?: string;
  href?: string;
  isRtl: boolean;
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

  if (normalized === "reviewing")
    return isRtl ? "قيد المراجعة" : "Reviewing";

  if (normalized === "shortlisted")
    return isRtl ? "القائمة المختصرة" : "Shortlisted";

  if (normalized === "accepted")
    return isRtl ? "مقبول" : "Accepted";

  if (normalized === "rejected")
    return isRtl ? "مرفوض" : "Rejected";

  return isRtl ? "جديد" : "Pending";
}

function statusClass(status?: string | null) {
  const normalized = normalizeStatus(status);

  if (normalized === "reviewing")
    return "border-blue-400/30 bg-blue-400/10 text-blue-300";

  if (normalized === "shortlisted")
    return "border-gold/30 bg-gold/10 text-gold";

  if (normalized === "accepted")
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";

  if (normalized === "rejected")
    return "border-red-400/30 bg-red-400/10 text-red-300";

  return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
}

function formatDate(value?: string | null, locale = "en") {
  if (!value) return "-";

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export default function TalentApplications({
  locale,
  isRtl,
  recentApplications,
  notificationItems,
}: TalentApplicationsProps) {
  return (
    <section className="mt-12 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
        <SectionHeader
          eyebrow={isRtl ? "آخر الطلبات" : "Recent Applications"}
          title={isRtl ? "طلباتك الأخيرة" : "Your recent applications"}
          href={`/${locale}/talent-dashboard/requests`}
          action={isRtl ? "عرض الكل" : "View All"}
          isRtl={isRtl}
        />

        {recentApplications.length > 0 ? (
          <div className="space-y-3">
            {recentApplications.map((application) => {
              const opportunity = Array.isArray(application.opportunities)
                ? application.opportunities[0]
                : application.opportunities;

              return (
                <article
                  key={application.id}
                  className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5 transition hover:border-gold/30"
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="mb-3 inline-flex rounded-full border border-white/10 bg-white/[0.03] p-2 text-gold">
                        <BriefcaseBusiness size={17} />
                      </div>

                      <p className="text-xl font-light text-white">
                        {opportunity?.title ?? "-"}
                      </p>

                      <p className="mt-2 text-sm text-white/40">
                        {opportunity?.opportunity_type
                          ? String(opportunity.opportunity_type).replaceAll(
                              "_",
                              " "
                            )
                          : "-"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`arabic-safe inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${statusClass(
                          application.status
                        )}`}
                      >
                        {statusLabel(application.status, isRtl)}
                      </span>

                      <span className="inline-flex items-center gap-2 text-sm text-white/45">
                        <CalendarDays size={15} />
                        {formatDate(application.created_at, locale)}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Inbox size={22} />}
            title={isRtl ? "لا توجد طلبات بعد" : "No applications yet"}
            text={
              isRtl
                ? "ابدأ باستعراض الفرص وقدّم على الفرصة المناسبة لك."
                : "Browse opportunities and apply to the ones that fit you."
            }
            action={isRtl ? "استعراض الفرص" : "Browse Opportunities"}
            href={`/${locale}/opportunities`}
            isRtl={isRtl}
          />
        )}
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
        <SectionHeader
          eyebrow={isRtl ? "الإشعارات" : "Notifications"}
          title={isRtl ? "آخر التنبيهات" : "Latest updates"}
          href={`/${locale}/talent-dashboard/notifications`}
          action={isRtl ? "فتح" : "Open"}
          isRtl={isRtl}
        />

        {notificationItems.length > 0 ? (
          <div className="space-y-3">
            {notificationItems.slice(0, 4).map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm leading-7 text-white/60"
              >
                <div className="mb-3 inline-flex rounded-full border border-gold/20 bg-gold/[0.06] p-2 text-gold">
                  <Bell size={15} />
                </div>

                <p>{item}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Bell size={22} />}
            title={isRtl ? "لا توجد إشعارات" : "No notifications"}
            text={
              isRtl
                ? "سنخبرك هنا عند وجود تحديثات مهمة."
                : "Important updates will appear here."
            }
            isRtl={isRtl}
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
    <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <p className="arabic-safe text-xs uppercase tracking-[0.35em] text-gold">
          {eyebrow}
        </p>

        <h2 className="mt-3 text-3xl font-light text-white">{title}</h2>
      </div>

      <Link
        href={href}
        className="arabic-safe inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-gold transition hover:text-gold-soft"
      >
        {action}
        <ArrowUpRight size={14} />
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
    <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-gold/20 bg-gold/[0.06] text-gold">
        {icon}
      </div>

      <h3 className="text-xl font-light text-white">{title}</h3>

      <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-white/40">
        {text}
      </p>

      {action && href ? (
        <Link
          href={href}
          className="arabic-safe mt-6 inline-flex rounded-full border border-gold/40 bg-gold/[0.06] px-5 py-3 text-xs uppercase tracking-[0.22em] text-gold transition hover:bg-gold hover:text-black"
        >
          {action}
        </Link>
      ) : null}
    </div>
  );
}