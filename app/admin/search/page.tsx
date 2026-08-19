import Link from "next/link";
import {
  BriefcaseBusiness,
  Building2,
  MessageSquare,
  Search,
  UserRound,
} from "lucide-react";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminSearchPageProps = {
  searchParams: Promise<{
    q?: string;
    lang?: string;
  }>;
};

type ProfileResult = {
  id: number;
  user_id: string | null;
  account_type: string | null;
  display_name: string | null;
  phone: string | null;
  status: string | null;
  approval_status: string | null;
};

type OpportunityResult = {
  id: number;
  title: string | null;
  company_name: string | null;
  city_ar: string | null;
  city_en: string | null;
  status: string | null;
  slug: string | null;
};

type ConversationResult = {
  id: number;
  opportunity_id: number | null;
  publisher_id: number | null;
  talent_id: number | null;
  status: string | null;
  updated_at: string | null;
};

function escapeSearchValue(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_")
    .replace(/,/g, "");
}

function statusLabel(
  status: string | null,
  isArabic: boolean,
) {
  if (!status) {
    return isArabic ? "غير محدد" : "Unknown";
  }

  const labels: Record<
    string,
    { ar: string; en: string }
  > = {
    pending: {
      ar: "قيد الانتظار",
      en: "Pending",
    },
    pending_review: {
      ar: "بانتظار المراجعة",
      en: "Pending review",
    },
    approved: {
      ar: "معتمد",
      en: "Approved",
    },
    rejected: {
      ar: "مرفوض",
      en: "Rejected",
    },
    changes_requested: {
      ar: "مطلوب تعديل",
      en: "Changes requested",
    },
    published: {
      ar: "منشور",
      en: "Published",
    },
    active: {
      ar: "نشط",
      en: "Active",
    },
    closed: {
      ar: "مغلق",
      en: "Closed",
    },
    restricted: {
      ar: "مقيّد",
      en: "Restricted",
    },
  };

  const item = labels[status];

  if (!item) {
    return status;
  }

  return isArabic
    ? item.ar
    : item.en;
}

export default async function AdminSearchPage({
  searchParams,
}: AdminSearchPageProps) {
  await requireAdminAccess();

  const params = await searchParams;

  const language =
    params.lang === "en" ? "en" : "ar";

  const isArabic = language === "ar";

  const query = String(
    params.q ?? "",
  ).trim();

  let profiles: ProfileResult[] = [];
  let opportunities: OpportunityResult[] = [];
  let conversations: ConversationResult[] = [];

  if (query) {
    const adminClient =
      createAdminClient();

    const safeQuery =
      escapeSearchValue(query);

    const numericQuery =
      Number(query);

    const isNumeric =
      Number.isInteger(numericQuery) &&
      numericQuery > 0;

    const profileSearch = adminClient
      .from("profiles")
      .select(
        `
          id,
          user_id,
          account_type,
          display_name,
          phone,
          status,
          approval_status
        `,
      )
      .or(
        [
          `display_name.ilike.%${safeQuery}%`,
          `phone.ilike.%${safeQuery}%`,
        ].join(","),
      )
      .order("id", {
        ascending: false,
      })
      .limit(20);

    const opportunitySearch =
      adminClient
        .from("opportunities")
        .select(
          `
            id,
            title,
            company_name,
            city_ar,
            city_en,
            status,
            slug
          `,
        )
        .or(
          [
            `title.ilike.%${safeQuery}%`,
            `company_name.ilike.%${safeQuery}%`,
            `city_ar.ilike.%${safeQuery}%`,
            `city_en.ilike.%${safeQuery}%`,
          ].join(","),
        )
        .order("id", {
          ascending: false,
        })
        .limit(20);

    const conversationSearch =
      isNumeric
        ? adminClient
            .from("conversations")
            .select(
              `
                id,
                opportunity_id,
                publisher_id,
                talent_id,
                status,
                updated_at
              `,
            )
            .or(
              [
                `id.eq.${numericQuery}`,
                `opportunity_id.eq.${numericQuery}`,
                `publisher_id.eq.${numericQuery}`,
                `talent_id.eq.${numericQuery}`,
              ].join(","),
            )
            .order("updated_at", {
              ascending: false,
            })
            .limit(20)
        : Promise.resolve({
            data: [],
            error: null,
          });

    const [
      profileResult,
      opportunityResult,
      conversationResult,
    ] = await Promise.all([
      profileSearch,
      opportunitySearch,
      conversationSearch,
    ]);

    if (profileResult.error) {
      console.error(
        "[AdminSearch profiles]",
        profileResult.error,
      );
    } else {
      profiles =
        (profileResult.data ??
          []) as ProfileResult[];
    }

    if (opportunityResult.error) {
      console.error(
        "[AdminSearch opportunities]",
        opportunityResult.error,
      );
    } else {
      opportunities =
        (opportunityResult.data ??
          []) as OpportunityResult[];
    }

    if (conversationResult.error) {
      console.error(
        "[AdminSearch conversations]",
        conversationResult.error,
      );
    } else {
      conversations =
        (conversationResult.data ??
          []) as ConversationResult[];
    }
  }

  const talents = profiles.filter(
    (profile) =>
      profile.account_type === "talent",
  );

  const publishers = profiles.filter(
    (profile) =>
      profile.account_type === "publisher",
  );

  const totalResults =
    talents.length +
    publishers.length +
    opportunities.length +
    conversations.length;

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-gold">
            MLAMH ADMIN
          </span>

          <h1 className="mt-3 text-3xl font-light text-white sm:text-4xl">
            {isArabic
              ? "البحث في لوحة الإدارة"
              : "Admin Search"}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/40">
            {isArabic
              ? "ابحث عن المواهب والناشرين والفرص والمحادثات من مكان واحد."
              : "Search talents, publishers, opportunities and conversations from one place."}
          </p>
        </div>

        <form
          action="/admin/search"
          method="GET"
          className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3"
        >
          <input
            type="hidden"
            name="lang"
            value={language}
          />

          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Search
                className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-white/30 ${
                  isArabic
                    ? "right-4"
                    : "left-4"
                }`}
              />

              <input
                type="search"
                name="q"
                defaultValue={query}
                autoFocus
                placeholder={
                  isArabic
                    ? "اسم موهبة، ناشر، فرصة، رقم محادثة..."
                    : "Talent, publisher, opportunity, conversation ID..."
                }
                className={`h-12 w-full rounded-xl border border-white/[0.08] bg-[#090909] text-sm text-white outline-none transition placeholder:text-white/25 focus:border-gold/35 ${
                  isArabic
                    ? "pr-11 pl-4"
                    : "pl-11 pr-4"
                }`}
              />
            </div>

            <button
              type="submit"
              className="h-12 shrink-0 rounded-xl border border-gold/30 bg-gold/10 px-5 text-sm text-gold transition hover:bg-gold/15"
            >
              {isArabic
                ? "بحث"
                : "Search"}
            </button>
          </div>
        </form>

        {!query ? (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-16 text-center">
            <Search className="mx-auto h-7 w-7 text-white/20" />

            <h2 className="mt-5 text-lg text-white/75">
              {isArabic
                ? "ابدأ بكتابة كلمة البحث"
                : "Start typing a search term"}
            </h2>

            <p className="mt-2 text-sm text-white/35">
              {isArabic
                ? "يمكنك البحث بالاسم، رقم الهاتف، اسم الفرصة، الشركة، المدينة أو رقم المحادثة."
                : "Search by name, phone, opportunity, company, city, or conversation ID."}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-white/35">
                  {isArabic
                    ? "نتائج البحث عن"
                    : "Search results for"}
                </p>

                <p className="mt-1 text-sm text-white/80">
                  “{query}”
                </p>
              </div>

              <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-white/45">
                {totalResults}{" "}
                {isArabic
                  ? "نتيجة"
                  : "results"}
              </span>
            </div>

            {totalResults === 0 ? (
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-16 text-center">
                <Search className="mx-auto h-7 w-7 text-white/20" />

                <h2 className="mt-5 text-lg text-white/70">
                  {isArabic
                    ? "لا توجد نتائج"
                    : "No results found"}
                </h2>

                <p className="mt-2 text-sm text-white/35">
                  {isArabic
                    ? "جرّب البحث باسم آخر أو رقم هاتف أو رقم معرّف."
                    : "Try another name, phone number, or ID."}
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {talents.length > 0 ? (
                  <section>
                    <SectionTitle
                      icon={UserRound}
                      title={
                        isArabic
                          ? "المواهب"
                          : "Talents"
                      }
                      count={talents.length}
                    />

                    <div className="grid gap-3 md:grid-cols-2">
                      {talents.map(
                        (profile) => (
                          <Link
                            key={profile.id}
                            href={`/admin/talents/${profile.id}?lang=${language}`}
                            className="group rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition hover:border-gold/25 hover:bg-white/[0.035]"
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/20 bg-gold/5 text-gold">
                                <UserRound className="h-5 w-5" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-white/85 group-hover:text-gold">
                                  {profile.display_name ||
                                    (isArabic
                                      ? "موهبة بدون اسم"
                                      : "Unnamed talent")}
                                </p>

                                <p
                                  dir="ltr"
                                  className="mt-1 truncate text-xs text-white/35"
                                >
                                  {profile.phone ||
                                    `ID ${profile.id}`}
                                </p>

                                <p className="mt-3 text-[11px] text-white/30">
                                  {statusLabel(
                                    profile.approval_status ??
                                      profile.status,
                                    isArabic,
                                  )}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ),
                      )}
                    </div>
                  </section>
                ) : null}

                {publishers.length > 0 ? (
                  <section>
                    <SectionTitle
                      icon={Building2}
                      title={
                        isArabic
                          ? "الناشرون"
                          : "Publishers"
                      }
                      count={publishers.length}
                    />

                    <div className="grid gap-3 md:grid-cols-2">
                      {publishers.map(
                        (profile) => (
                          <Link
                            key={profile.id}
                            href={`/admin/publishers/${profile.id}?lang=${language}`}
                            className="group rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition hover:border-gold/25 hover:bg-white/[0.035]"
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/20 bg-gold/5 text-gold">
                                <Building2 className="h-5 w-5" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-white/85 group-hover:text-gold">
                                  {profile.display_name ||
                                    (isArabic
                                      ? "ناشر بدون اسم"
                                      : "Unnamed publisher")}
                                </p>

                                <p
                                  dir="ltr"
                                  className="mt-1 truncate text-xs text-white/35"
                                >
                                  {profile.phone ||
                                    `ID ${profile.id}`}
                                </p>

                                <p className="mt-3 text-[11px] text-white/30">
                                  {statusLabel(
                                    profile.approval_status ??
                                      profile.status,
                                    isArabic,
                                  )}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ),
                      )}
                    </div>
                  </section>
                ) : null}

                {opportunities.length > 0 ? (
                  <section>
                    <SectionTitle
                      icon={BriefcaseBusiness}
                      title={
                        isArabic
                          ? "الفرص"
                          : "Opportunities"
                      }
                      count={
                        opportunities.length
                      }
                    />

                    <div className="grid gap-3 md:grid-cols-2">
                      {opportunities.map(
                        (opportunity) => (
                          <Link
                            key={opportunity.id}
                            href={`/admin/opportunities/${opportunity.id}?lang=${language}`}
                            className="group rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition hover:border-gold/25 hover:bg-white/[0.035]"
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/20 bg-gold/5 text-gold">
                                <BriefcaseBusiness className="h-5 w-5" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-white/85 group-hover:text-gold">
                                  {opportunity.title ||
                                    (isArabic
                                      ? "فرصة بدون عنوان"
                                      : "Untitled opportunity")}
                                </p>

                                <p className="mt-1 truncate text-xs text-white/35">
                                  {opportunity.company_name ||
                                    (isArabic
                                      ? "بدون جهة"
                                      : "No company")}
                                </p>

                                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/30">
                                  <span>
                                    {isArabic
                                      ? opportunity.city_ar ||
                                        opportunity.city_en
                                      : opportunity.city_en ||
                                        opportunity.city_ar}
                                  </span>

                                  <span>
                                    {statusLabel(
                                      opportunity.status,
                                      isArabic,
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ),
                      )}
                    </div>
                  </section>
                ) : null}

                {conversations.length > 0 ? (
                  <section>
                    <SectionTitle
                      icon={MessageSquare}
                      title={
                        isArabic
                          ? "المحادثات"
                          : "Conversations"
                      }
                      count={
                        conversations.length
                      }
                    />

                    <div className="grid gap-3 md:grid-cols-2">
                      {conversations.map(
                        (conversation) => (
                          <Link
                            key={conversation.id}
                            href={`/admin/messages/${conversation.id}?lang=${language}`}
                            className="group rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition hover:border-gold/25 hover:bg-white/[0.035]"
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/20 bg-gold/5 text-gold">
                                <MessageSquare className="h-5 w-5" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-white/85 group-hover:text-gold">
                                  {isArabic
                                    ? `محادثة #${conversation.id}`
                                    : `Conversation #${conversation.id}`}
                                </p>

                                <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-white/35">
                                  {conversation.opportunity_id ? (
                                    <span>
                                      {isArabic
                                        ? "فرصة"
                                        : "Opportunity"}{" "}
                                      #{conversation.opportunity_id}
                                    </span>
                                  ) : null}

                                  {conversation.talent_id ? (
                                    <span>
                                      {isArabic
                                        ? "موهبة"
                                        : "Talent"}{" "}
                                      #{conversation.talent_id}
                                    </span>
                                  ) : null}

                                  {conversation.publisher_id ? (
                                    <span>
                                      {isArabic
                                        ? "ناشر"
                                        : "Publisher"}{" "}
                                      #{conversation.publisher_id}
                                    </span>
                                  ) : null}
                                </div>

                                <p className="mt-3 text-[11px] text-white/30">
                                  {statusLabel(
                                    conversation.status,
                                    isArabic,
                                  )}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ),
                      )}
                    </div>
                  </section>
                ) : null}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  count,
}: {
  icon: typeof UserRound;
  title: string;
  count: number;
}) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <Icon className="h-4 w-4 text-gold" />

      <h2 className="text-sm font-medium text-white/75">
        {title}
      </h2>

      <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] text-white/35">
        {count}
      </span>
    </div>
  );
}