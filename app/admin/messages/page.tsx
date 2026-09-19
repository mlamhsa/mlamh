import Link from "next/link";

import {
  AdminBadge,
  AdminCard,
  AdminEmptyState,
  AdminGrid,
  AdminInfoGrid,
  AdminInfoItem,
  AdminPageContainer,
  AdminPageHeader,
  AdminStatCard,
} from "@/components/admin/ui";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Messages — MLAMH Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

type PageProps = {
    searchParams: Promise<{
      status?: string;
      q?: string;
      reported?: string;
      lang?: string;
    }>;
  };

  type ConversationRecord = {
    id: number;
    opportunity_id: number;
    publisher_id: number | null;
    talent_id: number;
    conversation_type: string | null;
    status: string | null;
    updated_at: string | null;
  };

type MessageRecord = {
    id: number | string;
    conversation_id: number;
    sender_user_id: string;
    body: string;
    reported_at: string | null;
    report_reviewed_at: string | null;
    created_at: string;
  };

type OpportunityRecord = {
  id: number;
  title: string | null;
  slug: string | null;
};

type TalentRecord = {
  id: number;
  name_ar: string | null;
  name_en: string | null;
  slug: string | null;
  image_url: string | null;
};

type PublisherRecord = {
  id: number;
  company_name: string | null;
  contact_name: string | null;
};

function formatDate(
  value: string | null | undefined,
  isArabic: boolean,
) {
  if (!value) {
    return "—";
  }

  const date = new Date(
    value,
  );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    isArabic ? "ar-SA-u-ca-gregory-nu-latn" : "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

function buildHref({
    status,
    q,
    reported,
  }: {
    status?: string;
    q?: string;
    reported?: boolean;
    language?: "ar" | "en";
  }) {
    const params =
      new URLSearchParams();

    params.set("lang", language ?? "ar");
  
    if (status) {
      params.set(
        "status",
        status,
      );
    }
  
    if (q) {
      params.set(
        "q",
        q,
      );
    }
  
    if (reported) {
      params.set(
        "reported",
        "1",
      );
    }
  
    const query =
      params.toString();
  
    return query
      ? `/admin/messages?${query}`
      : "/admin/messages";
  }

export default async function AdminMessagesPage({
  searchParams,
}: PageProps) {
  await requireAdminAccess();

  const {
    status,
    q,
    reported,
    lang,
  } = await searchParams;

  const language: "ar" | "en" = lang === "en" ? "en" : "ar";
  const isArabic = language === "ar";
  
  const reportedOnly =
    reported === "1";

  const adminClient =
    createAdminClient();

  let conversationsQuery =
    adminClient
      .from(
        "conversations",
      )
      .select(`
        id,
        opportunity_id,
        publisher_id,
        talent_id,
        conversation_type,
        status,
        updated_at
      `)
      .order(
        "updated_at",
        {
          ascending: false,
        },
      );

  if (status) {
    conversationsQuery =
      conversationsQuery.eq(
        "status",
        status,
      );
  }

  const {
    data:
      conversationsData,
    error:
      conversationsError,
  } =
    await conversationsQuery;

  if (conversationsError) {
    throw new Error(
      `[AdminMessagesPage conversations] ${conversationsError.message}`,
    );
  }

  const conversations =
    (conversationsData ??
      []) as ConversationRecord[];

  const conversationIds =
    conversations.map(
      (conversation) =>
        conversation.id,
    );

  const opportunityIds = [
    ...new Set(
      conversations.map(
        (conversation) =>
          conversation.opportunity_id,
      ),
    ),
  ];

  const talentIds = [
    ...new Set(
      conversations.map(
        (conversation) =>
          conversation.talent_id,
      ),
    ),
  ];

  const publisherIds = [
    ...new Set(
      conversations
        .map(
          (conversation) =>
            conversation.publisher_id,
        )
        .filter(
          (publisherId): publisherId is number =>
            publisherId !== null,
        ),
    ),
  ];

  const [
    messagesResult,
    opportunitiesResult,
    talentsResult,
    publishersResult,
  ] = await Promise.all([
    conversationIds.length >
    0
      ? adminClient
          .from("messages")
          .select(`
            id,
            conversation_id,
            sender_user_id,
            body,
            reported_at,
            report_reviewed_at,
            created_at
          `)
          .in(
            "conversation_id",
            conversationIds,
          )
          .order(
            "created_at",
            {
              ascending: false,
            },
          )
      : Promise.resolve({
          data: [],
          error: null,
        }),

    opportunityIds.length >
    0
      ? adminClient
          .from(
            "opportunities",
          )
          .select(
            "id, title, slug",
          )
          .in(
            "id",
            opportunityIds,
          )
      : Promise.resolve({
          data: [],
          error: null,
        }),

    talentIds.length > 0
      ? adminClient
          .from("talents")
          .select(`
            id,
            name_ar,
            name_en,
            slug,
            image_url
          `)
          .in(
            "id",
            talentIds,
          )
      : Promise.resolve({
          data: [],
          error: null,
        }),

    publisherIds.length > 0
      ? adminClient
          .from(
            "publishers",
          )
          .select(`
            id,
            company_name,
            contact_name
          `)
          .in(
            "id",
            publisherIds,
          )
      : Promise.resolve({
          data: [],
          error: null,
        }),
  ]);

  if (
    messagesResult.error
  ) {
    throw new Error(
      `[AdminMessagesPage messages] ${messagesResult.error.message}`,
    );
  }

  if (
    opportunitiesResult.error
  ) {
    throw new Error(
      `[AdminMessagesPage opportunities] ${opportunitiesResult.error.message}`,
    );
  }

  if (
    talentsResult.error
  ) {
    throw new Error(
      `[AdminMessagesPage talents] ${talentsResult.error.message}`,
    );
  }

  if (
    publishersResult.error
  ) {
    throw new Error(
      `[AdminMessagesPage publishers] ${publishersResult.error.message}`,
    );
  }

  const messages =
    (messagesResult.data ??
      []) as MessageRecord[];

  const opportunities =
    (opportunitiesResult.data ??
      []) as OpportunityRecord[];

  const talents =
    (talentsResult.data ??
      []) as TalentRecord[];

  const publishers =
    (publishersResult.data ??
      []) as PublisherRecord[];

  const opportunityMap =
    new Map(
      opportunities.map(
        (opportunity) => [
          opportunity.id,
          opportunity,
        ],
      ),
    );

  const talentMap =
    new Map(
      talents.map(
        (talent) => [
          talent.id,
          talent,
        ],
      ),
    );

  const publisherMap =
    new Map(
      publishers.map(
        (publisher) => [
          publisher.id,
          publisher,
        ],
      ),
    );

  const latestMessageMap =
    new Map<
      number,
      MessageRecord
    >();

  const messageCountMap =
    new Map<
      number,
      number
    >();
    const reportedCountMap =
    new Map<
      number,
      number
    >();
    for (
        const message of messages
      ) {
        if (
          !latestMessageMap.has(
            message.conversation_id,
          )
        ) {
          latestMessageMap.set(
            message.conversation_id,
            message,
          );
        }
      
        messageCountMap.set(
          message.conversation_id,
          (messageCountMap.get(
            message.conversation_id,
          ) ?? 0) + 1,
        );
      
        if (
          message.reported_at &&
          !message.report_reviewed_at
        ) {
          reportedCountMap.set(
            message.conversation_id,
            (reportedCountMap.get(
              message.conversation_id,
            ) ?? 0) + 1,
          );
        }
      }
      
      const cleanSearch =
        q?.trim().toLowerCase() ?? "";
    q?.trim().toLowerCase() ??
    "";

    const filteredConversations =
    conversations.filter(
      (conversation) => {
        const isMlamhConversation =
  conversation.conversation_type ===
  "mlamh_talent";

        const reportedCount =
          reportedCountMap.get(
            conversation.id,
          ) ?? 0;
  
        if (
          reportedOnly &&
          reportedCount === 0
        ) {
          return false;
        }
  
        if (!cleanSearch) {
          return true;
        }
  
        const talent =
          talentMap.get(
            conversation.talent_id,
          );
  
          const publisher =
          conversation.publisher_id !== null
            ? publisherMap.get(
                conversation.publisher_id,
              )
            : undefined;
  
        const opportunity =
          opportunityMap.get(
            conversation.opportunity_id,
          );
  
        const latestMessage =
          latestMessageMap.get(
            conversation.id,
          );
  
          const haystack = [
            talent?.name_ar,
            talent?.name_en,
            isMlamhConversation
              ? "ملامح MLAMH"
              : null,
            publisher?.company_name,
            publisher?.contact_name,
            opportunity?.title,
            latestMessage?.body,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
  
        return haystack.includes(
          cleanSearch,
        );
      },
    );

  const total =
    conversations.length;

  const active =
    conversations.filter(
      (conversation) =>
        conversation.status ===
        "active",
    ).length;

  const closed =
    conversations.filter(
      (conversation) =>
        conversation.status !==
        "active",
    ).length;
    const reportedMessages =
  messages.filter(
    (message) =>
      Boolean(
        message.reported_at,
      ) &&
      !message.report_reviewed_at,
  ).length;

  return (
    <div dir={isArabic ? "rtl" : "ltr"}>
      <AdminPageContainer>
        <AdminPageHeader
          eyebrow={isArabic ? "التواصل" : "COMMUNICATIONS"}
          title={isArabic ? "المحادثات والبلاغات" : "Conversations & Reports"}
          description={
            isArabic
              ? "متابعة المحادثات بين الناشرين والمواهب والإشراف على النشاط والبلاغات."
              : "Monitor publisher-talent conversations, activity, and reported messages."
          }
        />

      <AdminGrid className="mb-8 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label={isArabic ? "إجمالي المحادثات" : "Total conversations"}
          value={total}
          active={!status}
          href={buildHref({
            language,
            q,
          })}
        />

        <AdminStatCard
          label={isArabic ? "نشطة" : "Active"}
          value={active}
          active={
            status ===
            "active"
          }
          href={buildHref({
            language,
            status:
              "active",
            q,
          })}
        />

<AdminStatCard
  label={isArabic ? "البلاغات" : "Reports"}
  value={reportedMessages}
  active={reportedOnly}
  href={buildHref({
            language,
    reported: true,
    q,
  })}
/>

        <AdminStatCard
          label={isArabic ? "مغلقة" : "Closed"}
          value={closed}
          active={
            status ===
            "closed"
          }
          href={buildHref({
            language,
            status:
              "closed",
            q,
          })}
        />
      </AdminGrid>

      <form
  method="GET"
  className="mb-8 rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-5"
>
  <input type="hidden" name="lang" value={language} />
  {reportedOnly ? (
    <input
      type="hidden"
      name="reported"
      value="1"
    />
  ) : null}

  <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
    <input
      name="q"
      defaultValue={q}
      placeholder={isArabic ? "ابحث باسم الناشر أو الموهبة أو الفرصة..." : "Search publisher, talent, or opportunity..."}
      className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white outline-none placeholder:text-white/30"
    />

    <select
      name="status"
      defaultValue={
        status ?? ""
      }
      className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white outline-none"
    >
      <option value="">
        {isArabic ? "جميع الحالات" : "All statuses"}
      </option>

      <option value="active">
        {isArabic ? "نشطة" : "Active"}
      </option>

      <option value="closed">
        {isArabic ? "مغلقة" : "Closed"}
      </option>
    </select>

    <button
      type="submit"
      className="rounded-2xl border border-gold/40 px-8 py-4 text-sm text-gold transition hover:bg-gold hover:text-black"
    >
      {isArabic ? "بحث" : "Search"}
    </button>
  </div>
</form>

      {filteredConversations.length ===
      0 ? (
        <AdminEmptyState message={isArabic ? "لا توجد محادثات مطابقة." : "No matching conversations."} />
      ) : (
        <AdminGrid>
          {filteredConversations.map(
            (
              conversation,
            ) => {
              const talent =
                talentMap.get(
                  conversation.talent_id,
                );

                const publisher =
                conversation.publisher_id !== null
                  ? publisherMap.get(
                      conversation.publisher_id,
                    )
                  : undefined;

              const opportunity =
                opportunityMap.get(
                  conversation.opportunity_id,
                );

              const latestMessage =
                latestMessageMap.get(
                  conversation.id,
                );

              const messageCount =
                messageCountMap.get(
                  conversation.id,
                ) ?? 0;

                const reportedCount =
  reportedCountMap.get(
    conversation.id,
  ) ?? 0;

              const lastActivity =
                latestMessage?.created_at ??
                conversation.updated_at;

              const talentName =
                (isArabic
                  ? talent?.name_ar || talent?.name_en
                  : talent?.name_en || talent?.name_ar) ||
                (isArabic ? "موهبة غير معروفة" : "Unknown talent");

                const isMlamhConversation =
                conversation.conversation_type ===
                "mlamh_talent";
              
              const publisherName =
                isMlamhConversation
                  ? "MLAMH"
                  : publisher?.company_name ||
                    publisher?.contact_name ||
                    (isArabic ? "ناشر غير معروف" : "Unknown publisher");

              const isActive =
                conversation.status ===
                "active";

              return (
                <AdminCard
                  key={
                    conversation.id
                  }
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="mb-3 flex flex-wrap items-center gap-3">
                        <AdminBadge
                          variant={
                            isActive
                              ? "success"
                              : "gold"
                          }
                        >
                          {isActive
                            ? isArabic ? "نشطة" : "Active"
                            : isArabic ? "مغلقة" : "Closed"}
                        </AdminBadge>
{reportedCount > 0 ? (
  <span className="rounded-full border border-red-400/25 bg-red-400/[0.08] px-3 py-1 text-[10px] text-red-300">
    {isArabic
      ? reportedCount === 1
        ? "بلاغ واحد"
        : `${reportedCount} بلاغات`
      : reportedCount === 1
        ? "1 report"
        : `${reportedCount} reports`}
  </span>
) : null}
                        <span className="text-[10px] uppercase tracking-[0.25em] text-white/35">
                          Conversation #
                          {
                            conversation.id
                          }
                        </span>
                      </div>

                      <h2 className="text-2xl font-light text-white">
                        {
                          publisherName
                        }
                      </h2>

                      <p className="mt-2 text-sm text-white/50">
                        {isArabic ? "مع" : "with"}{" "}
                        <span className="text-white/75">
                          {
                            talentName
                          }
                        </span>
                      </p>

                      <p className="mt-2 text-sm text-gold/70">
                        {opportunity?.title ??
                          (isArabic ? "فرصة بدون عنوان" : "Untitled opportunity")}
                      </p>
                    </div>

                    <div className="text-left lg:text-right">
                      <p className="text-[10px] uppercase tracking-[0.25em] text-white/35">
                        {isArabic ? "آخر نشاط" : "Last activity"}
                      </p>

                      <p className="mt-1 text-sm text-gray-muted">
                        {formatDate(
                          lastActivity,
                          isArabic,
                        )}
                      </p>
                    </div>
                  </div>

                  <AdminInfoGrid>
                    <AdminInfoItem
  label={
    isMlamhConversation
      ? isArabic ? "مدير الفرصة" : "Opportunity manager"
      : isArabic ? "الناشر" : "Publisher"
  }
  value={publisherName}
/>

                    <AdminInfoItem
                      label={isArabic ? "الموهبة" : "Talent"}
                      value={
                        talentName
                      }
                    />

                    <AdminInfoItem
                      label={isArabic ? "الفرصة" : "Opportunity"}
                      value={
                        opportunity?.title
                      }
                    />

                    <AdminInfoItem
                      label={isArabic ? "عدد الرسائل" : "Messages"}
                      value={String(
                        messageCount,
                      )}
                    />
                  </AdminInfoGrid>

                  <div className="mt-5 rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">
                      {isArabic ? "آخر رسالة" : "Latest message"}
                    </p>

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/55">
                      {latestMessage?.body ||
                        (isArabic ? "لا توجد رسائل حتى الآن." : "No messages yet.")}
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href={`/admin/messages/${conversation.id}?lang=${language}`}
                      className="rounded-full border border-gold/30 bg-gold/[0.04] px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-gold transition hover:bg-gold/10"
                    >
                      {isArabic ? "عرض المحادثة" : "Open conversation"}
                    </Link>

                    {opportunity?.slug ? (
                      <Link
                        href={`/${language}/opportunities/${opportunity.slug}`}
                        target="_blank"
                        className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-white/60 transition hover:border-gold/40 hover:text-gold"
                      >
                        {isArabic ? "عرض الفرصة" : "View opportunity"}
                      </Link>
                    ) : null}

                    {talent?.slug ? (
                      <Link
                        href={`/${language}/talent/${talent.slug}`}
                        target="_blank"
                        className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-white/60 transition hover:border-gold/40 hover:text-gold"
                      >
                        {isArabic ? "عرض الموهبة" : "View talent"}
                      </Link>
                    ) : null}
                  </div>
                </AdminCard>
              );
            },
          )}
        </AdminGrid>
      )}
      </AdminPageContainer>
    </div>
  );
}
