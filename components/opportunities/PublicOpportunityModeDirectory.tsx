import Link from "next/link";
import { BriefcaseBusiness, Clock3, MapPin, Sparkles, Wallet, Zap } from "lucide-react";

import type { Locale } from "@/lib/i18n";
import { getPublishedOpportunities } from "@/lib/supabase/opportunities";
import type { Opportunity } from "@/lib/types/opportunity";

type Mode = "quick" | "project";

type PublicOpportunity = Opportunity & {
  required_count?: number | null;
  work_date?: string | null;
  work_duration?: string | null;
};

function formatCompensation(item: PublicOpportunity, isRtl: boolean) {
  if (item.compensation_type === "unpaid") return isRtl ? "غير مدفوع" : "Unpaid";
  if (item.compensation_type === "negotiable") return isRtl ? "حسب الاتفاق" : "Negotiable";

  const amount = Number(item.budget);
  if (!Number.isFinite(amount) || amount <= 0) return isRtl ? "غير محدد" : "Not specified";

  return `${new Intl.NumberFormat(isRtl ? "ar-SA-u-nu-latn" : "en-US").format(amount)} ${
    isRtl ? "ريال" : "SAR"
  }`;
}

function formatRelativeDate(value: string, isRtl: boolean) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const hours = Math.max(0, Math.floor((Date.now() - date.getTime()) / 3_600_000));
  if (hours < 1) return isRtl ? "الآن" : "Just now";
  if (hours < 24) return isRtl ? `منذ ${hours} ساعة` : `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return isRtl ? `منذ ${days} يوم` : `${days}d ago`;

  return new Intl.DateTimeFormat(isRtl ? "ar-SA-u-nu-latn" : "en-US", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function isOpen(item: PublicOpportunity) {
  const deadline = item.application_deadline || item.deadline || item.expires_at;
  if (!deadline) return true;
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return true;
  if (String(deadline).length <= 10) date.setHours(23, 59, 59, 999);
  return date.getTime() >= Date.now();
}

export default async function PublicOpportunityModeDirectory({
  locale,
  mode,
}: {
  locale: Locale;
  mode: Mode;
}) {
  const isRtl = locale === "ar";
  const all = (await getPublishedOpportunities()) as PublicOpportunity[];

  // Legacy opportunities may predate posting_mode. Treat every non-quick record
  // as casting/project so existing public inventory never disappears.
  const items = all.filter((item) =>
    mode === "quick" ? item.posting_mode === "quick" : item.posting_mode !== "quick",
  );

  const openItems = items.filter(isOpen);
  const closedItems = items.filter((item) => !isOpen(item));
  const ordered = [...openItems, ...closedItems];

  const copy =
    mode === "quick"
      ? {
          eyebrow: isRtl ? "طلبات الآن" : "QUICK REQUESTS",
          title: isRtl ? "طلبات تحتاج مواهب الآن" : "Talent requests happening now",
          description: isRtl
            ? "احتياجات سريعة من ناشرين يبحثون عن ممثلين ومودلز لمشاريع وتصوير ومحتوى وفعاليات."
            : "Fast-moving needs from publishers looking for actors and models for shoots, content, projects and events.",
          empty: isRtl ? "لا توجد طلبات سريعة منشورة حاليًا" : "No quick requests are published right now",
          Icon: Zap,
        }
      : {
          eyebrow: isRtl ? "فرص الكاستينغ" : "CASTING OPPORTUNITIES",
          title: isRtl ? "مشاريع وكاستينغ احترافية" : "Professional casting opportunities",
          description: isRtl
            ? "فرص كاستينغ ومشاريع من شركات إنتاج ووكالات وعلامات تجارية وجهات تبحث عن المواهب المناسبة."
            : "Casting calls and projects from production companies, agencies, brands and professional organizations.",
          empty: isRtl ? "لا توجد فرص كاستينغ منشورة حاليًا" : "No casting opportunities are published right now",
          Icon: BriefcaseBusiness,
        };

  const HeaderIcon = copy.Icon;

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-background px-4 pb-28 pt-6 text-white sm:px-6 lg:pb-24 lg:pt-10">
      <div className="mx-auto max-w-7xl">
        <header className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.15),transparent_42%),rgba(255,255,255,0.025)] p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/[0.08] px-3 py-1.5 text-xs text-gold">
                <HeaderIcon size={14} />
                {copy.eyebrow}
              </div>
              <h1 className="mt-5 text-3xl font-light leading-tight sm:text-5xl lg:text-6xl">{copy.title}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/50 sm:text-base">{copy.description}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 px-5 py-4 text-center lg:min-w-44">
              <strong className="block text-3xl font-light text-white">{openItems.length}</strong>
              <span className="mt-1 block text-xs text-white/40">{isRtl ? "متاح الآن" : "Open now"}</span>
            </div>
          </div>
        </header>

        <section className="mt-5 rounded-[1.5rem] border border-gold/20 bg-gold/[0.035] p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
          <div>
            <div className="flex items-center gap-2 text-gold">
              <Sparkles size={16} />
              <p className="text-sm font-medium">{isRtl ? "شفت فرصة تناسبك؟" : "Found something that fits you?"}</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-white/45">
              {isRtl
                ? "أنشئ ملف موهبة في ملامح، ثم قدّم على الفرص المناسبة من داخل المنصة."
                : "Create your talent profile on MLAMH, then apply to relevant opportunities directly on the platform."}
            </p>
          </div>
          <Link
            href={`/${locale}/join?type=talent`}
            className="mt-4 inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-full bg-gold px-6 text-sm font-semibold text-black transition hover:bg-gold-soft sm:mt-0 sm:w-auto"
          >
            {isRtl ? "انضم كموهبة" : "Join as talent"}
          </Link>
        </section>

        {ordered.length === 0 ? (
          <section className="mt-6 rounded-[2rem] border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
            <HeaderIcon size={28} className="mx-auto text-gold/70" />
            <h2 className="mt-5 text-xl font-light">{copy.empty}</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/40">
              {isRtl ? "تظهر الطلبات والفرص الجديدة هنا فور نشرها." : "New requests and opportunities will appear here as soon as they are published."}
            </p>
          </section>
        ) : (
          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ordered.map((item) => {
              const open = isOpen(item);
              const city = isRtl ? item.city_ar || item.city_en || "—" : item.city_en || item.city_ar || "—";
              const href = `/${locale}/opportunities/${encodeURIComponent(item.slug || String(item.id))}`;
              const typeLabel = item.opportunity_type === "model"
                ? isRtl ? "مودل" : "Model"
                : isRtl ? "ممثل / ممثلة" : "Actor";

              return (
                <Link
                  key={item.id}
                  href={href}
                  className={`group flex min-h-[310px] flex-col rounded-[1.75rem] border bg-white/[0.025] p-5 transition sm:p-6 ${
                    open
                      ? "border-white/10 hover:-translate-y-1 hover:border-gold/35"
                      : "border-white/[0.06] opacity-55"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full border border-gold/25 bg-gold/[0.07] px-3 py-1 text-[10px] text-gold">
                      {typeLabel}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-[10px] ${open ? "border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-200" : "border-red-300/20 bg-red-300/[0.05] text-red-200"}`}>
                      {open ? (isRtl ? "متاح" : "Open") : (isRtl ? "انتهى" : "Closed")}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-xs text-white/35">
                    <Clock3 size={13} className="text-gold/70" />
                    {formatRelativeDate(item.created_at, isRtl)}
                  </div>

                  <h2 className="mt-4 line-clamp-2 text-xl font-light leading-8 text-white transition group-hover:text-gold sm:text-2xl">
                    {item.title}
                  </h2>

                  {item.company_name ? (
                    <p className="mt-2 truncate text-sm text-white/40">{item.company_name}</p>
                  ) : null}

                  <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
                      <span className="flex items-center gap-1.5 text-white/30"><MapPin size={12} />{isRtl ? "المدينة" : "City"}</span>
                      <strong className="mt-1.5 block truncate font-medium text-white/70">{city}</strong>
                    </div>
                    <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
                      <span className="flex items-center gap-1.5 text-white/30"><Wallet size={12} />{isRtl ? "المقابل" : "Compensation"}</span>
                      <strong className="mt-1.5 block truncate font-medium text-white/70">{formatCompensation(item, isRtl)}</strong>
                    </div>
                  </div>

                  <div className="mt-auto border-t border-white/[0.07] pt-4 text-sm text-gold">
                    {isRtl
                      ? mode === "quick" ? "عرض الطلب" : "عرض تفاصيل الفرصة"
                      : mode === "quick" ? "View request" : "View opportunity"}
                  </div>
                </Link>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
