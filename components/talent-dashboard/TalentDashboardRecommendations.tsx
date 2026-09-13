import Link from "next/link";
import { BriefcaseBusiness, MapPin, MessageSquareText, Wallet, Zap } from "lucide-react";

import { getPublishedOpportunities } from "@/lib/supabase/opportunities";
import { evaluateTalentForBrief, type BriefTalent, type TalentBrief } from "@/lib/talent/supply";
import type { Opportunity } from "@/lib/types/opportunity";

type Props = {
  locale: "ar" | "en";
  talent: Record<string, unknown>;
  approvalStatus: string | null;
  unreadMessagesCount: number;
};

type DashboardOpportunity = Opportunity & {
  work_date?: string | null;
  work_time?: string | null;
  required_gender?: string | null;
  role_requirements?: Record<string, unknown> | null;
};

function isOpen(item: DashboardOpportunity) {
  const deadline = item.application_deadline || item.deadline || item.expires_at;
  if (!deadline) return true;
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return true;
  if (String(deadline).length <= 10) date.setHours(23, 59, 59, 999);
  return date.getTime() >= Date.now();
}

function normalizedGender(value: string | null | undefined) {
  const gender = String(value ?? "").trim().toLowerCase();
  return gender && gender !== "any" && gender !== "all" ? gender : null;
}

function opportunityBrief(item: DashboardOpportunity): TalentBrief {
  const hasCity = Boolean(item.city_slug || item.city_en || item.city_ar);
  const cityFlexible = item.role_requirements?.city_flexible === true;

  return {
    talent_type: item.opportunity_type,
    country_code: item.country_code ?? "SA",
    city: item.city_slug || item.city_en || item.city_ar || null,
    city_required: hasCity ? !cityFlexible : false,
    city_flexible: cityFlexible,
    required_gender: normalizedGender(item.required_gender),
    requirements: item.role_requirements ?? null,
  };
}

function formatCompensation(item: DashboardOpportunity, isRtl: boolean) {
  if (item.compensation_type === "unpaid") return isRtl ? "غير مدفوع" : "Unpaid";
  if (item.compensation_type === "negotiable") return isRtl ? "حسب الاتفاق" : "Negotiable";
  const amount = Number(item.budget);
  if (!Number.isFinite(amount) || amount <= 0) return isRtl ? "غير محدد" : "Not specified";
  return `${new Intl.NumberFormat("en-US").format(amount)} ${isRtl ? "ريال" : "SAR"}`;
}

function cityMatchRank(value: "local" | "travel" | "none") {
  if (value === "local") return 0;
  if (value === "travel") return 1;
  return 2;
}

export default async function TalentDashboardRecommendations({
  locale,
  talent,
  approvalStatus,
  unreadMessagesCount,
}: Props) {
  if (approvalStatus !== "approved") return null;

  const isRtl = locale === "ar";
  const candidate = {
    ...talent,
    profile_approval_status: approvalStatus,
    base_country_code: (talent.base_country_code as BriefTalent["base_country_code"]) ?? "SA",
    work_market_codes:
      (talent.work_market_codes as BriefTalent["work_market_codes"]) ?? ["SA"],
  } as BriefTalent;

  const opportunities = (await getPublishedOpportunities()) as DashboardOpportunity[];
  const allMatches = opportunities
    .filter(isOpen)
    .flatMap((item) => {
      try {
        const evaluation = evaluateTalentForBrief(candidate, opportunityBrief(item));
        return evaluation.sendable ? [{ item, evaluation }] : [];
      } catch (error) {
        console.warn("[TalentDashboardRecommendations.evaluate]", item.id, error);
        return [];
      }
    })
    .sort(
      (first, second) =>
        cityMatchRank(first.evaluation.cityMatch) -
        cityMatchRank(second.evaluation.cityMatch),
    );

  const visibleMatches = allMatches.slice(0, 3);

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[2rem] border border-gold/20 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.12),transparent_42%),rgba(255,255,255,0.02)] p-5 sm:p-7 lg:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/[0.08] px-3 py-1.5 text-xs text-gold">
              <Zap size={13} />
              {isRtl ? "مناسب لك اليوم" : "Matched for you today"}
            </div>
            <h2 className="mt-4 text-2xl font-light text-white sm:text-3xl">
              {allMatches.length > 0
                ? isRtl
                  ? `${allMatches.length} ${allMatches.length === 1 ? "فرصة مناسبة" : "فرص مناسبة"} لملفك الآن`
                  : `${allMatches.length} matched opportunit${allMatches.length === 1 ? "y" : "ies"} for you now`
                : isRtl
                  ? "ما فيه فرص مطابقة لملفك حاليًا"
                  : "No exact matches for your profile right now"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-white/45">
              {isRtl
                ? "نعرض هنا الفرص الأقرب لبيانات ملفك الحالية. كلما كان ملفك أكمل وأحدث، زادت فرص ظهور الفرص المناسبة لك."
                : "We surface opportunities closest to your current profile. A more complete and up-to-date profile improves the relevance of what appears here."}
            </p>
          </div>
          <Link
            href={`/${locale}/opportunities`}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-gold/[0.05] px-5 text-xs font-medium text-gold transition hover:bg-gold hover:text-black"
          >
            {isRtl ? "عرض كل الفرص" : "View all opportunities"}
          </Link>
        </div>

        {visibleMatches.length > 0 ? (
          <div className="mt-6 grid gap-3 lg:grid-cols-3">
            {visibleMatches.map(({ item, evaluation }) => {
              const quick = item.posting_mode === "quick";
              const city = isRtl ? item.city_ar || item.city_en || "—" : item.city_en || item.city_ar || "—";
              const requiresTravel = evaluation.cityMatch === "travel";

              return (
                <Link
                  key={item.id}
                  href={`/${locale}/opportunities/${encodeURIComponent(item.slug || String(item.id))}`}
                  className="group flex min-h-52 flex-col rounded-[1.5rem] border border-white/[0.08] bg-black/25 p-4 transition hover:-translate-y-0.5 hover:border-gold/30 sm:p-5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] ${quick ? "border-amber-300/25 bg-amber-300/[0.07] text-amber-200" : "border-gold/25 bg-gold/[0.06] text-gold"}`}>
                      {quick ? <Zap size={11} /> : <BriefcaseBusiness size={11} />}
                      {quick
                        ? isRtl ? "طلب الآن" : "Quick Request"
                        : isRtl ? "كاستينغ" : "Casting"}
                    </span>

                    {requiresTravel ? (
                      <span className="rounded-full border border-sky-300/20 bg-sky-300/[0.06] px-2.5 py-1 text-[10px] text-sky-200">
                        {isRtl ? `✈️ يتطلب السفر إلى ${city}` : `✈️ Travel to ${city}`}
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-4 line-clamp-2 text-lg font-medium leading-7 text-white transition group-hover:text-gold">{item.title}</h3>
                  <div className="mt-4 space-y-2 text-xs text-white/45">
                    <div className="flex items-center gap-2"><MapPin size={13} className="text-gold/70" /><span className="truncate">{city}</span></div>
                    <div className="flex items-center gap-2"><Wallet size={13} className="text-gold/70" /><span className="truncate">{formatCompensation(item, isRtl)}</span></div>
                  </div>
                  <span className="mt-auto pt-4 text-xs text-gold">{isRtl ? "عرض التفاصيل" : "View details"}</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 p-5 sm:flex sm:items-center sm:justify-between sm:gap-5">
            <p className="text-sm leading-7 text-white/45">
              {isRtl
                ? "يمكنك استعراض طلبات الآن وفرص الكاستينغ، أو تطوير ملفك لزيادة فرص المطابقة."
                : "Browse Quick Requests and Casting Opportunities, or strengthen your profile to improve matching."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 sm:mt-0">
              <Link href={`/${locale}/opportunities/quick`} className="rounded-full border border-white/10 px-4 py-2.5 text-xs text-white/60 transition hover:border-gold/30 hover:text-gold">
                {isRtl ? "طلبات الآن" : "Quick Requests"}
              </Link>
              <Link href={`/${locale}/opportunities/casting`} className="rounded-full border border-white/10 px-4 py-2.5 text-xs text-white/60 transition hover:border-gold/30 hover:text-gold">
                {isRtl ? "فرص الكاستينغ" : "Casting Opportunities"}
              </Link>
              <Link href={`/${locale}/talent-dashboard/profile/details`} className="rounded-full border border-white/10 px-4 py-2.5 text-xs text-white/60 transition hover:border-gold/30 hover:text-gold">
                {isRtl ? "طوّر ملفك" : "Improve profile"}
              </Link>
            </div>
          </div>
        )}
      </section>

      {unreadMessagesCount > 0 ? (
        <Link
          href={`/${locale}/talent-dashboard/messages`}
          className="flex items-center gap-4 rounded-[1.5rem] border border-gold/20 bg-gold/[0.035] p-4 transition hover:bg-gold/[0.055] sm:p-5"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold"><MessageSquareText size={19} /></span>
          <span className="min-w-0 flex-1">
            <strong className="block text-sm font-medium text-white">
              {isRtl ? `لديك ${unreadMessagesCount} رسالة غير مقروءة` : `${unreadMessagesCount} unread message${unreadMessagesCount === 1 ? "" : "s"}`}
            </strong>
            <span className="mt-1 block text-xs text-white/40">{isRtl ? "افتح الرسائل وشاهد ما يحتاج ردك." : "Open messages and see what needs your reply."}</span>
          </span>
        </Link>
      ) : null}
    </div>
  );
}
