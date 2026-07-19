import Link from "next/link";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

type ConversationRecord = {
  id: number;
  opportunity_id: number;
  publisher_id: number;
  talent_id: number;
  status: string | null;
  updated_at: string | null;
};

type MessageRecord = {
  id: number | string;
  conversation_id: number;
  sender_user_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

type OpportunityRecord = {
  id: number;
  title: string | null;
};

type TalentRecord = {
  id: number;
  name_ar: string | null;
  name_en: string | null;
  image_url: string | null;
  category_ar: string | null;
  category_en: string | null;
};

function formatConversationDate(value: string | null, locale: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isSameDay) {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export default async function PublisherMessagesPage({
  params,
}: PageProps) {
  const { locale } = await params;
  const isArabic = locale === "ar";

  const authClient = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    redirect(`/${locale}/publisher-login`);
  }

  const adminClient = createAdminClient();

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, account_type")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(
      `[PublisherMessagesPage profile] ${profileError.message}`,
    );
  }

  if (!profile || profile.account_type !== "publisher") {
    redirect(`/${locale}/publisher-login`);
  }

  const { data: publisher, error: publisherError } = await adminClient
    .from("publishers")
    .select("id, company_name, contact_name")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (publisherError) {
    throw new Error(
      `[PublisherMessagesPage publisher] ${publisherError.message}`,
    );
  }

  if (!publisher) {
    redirect(`/${locale}/join/publisher`);
  }

  const {
    data: conversationsData,
    error: conversationsError,
  } = await adminClient
    .from("conversations")
    .select(`
      id,
      opportunity_id,
      publisher_id,
      talent_id,
      status,
      updated_at
    `)
    .eq("publisher_id", publisher.id)
    .order("updated_at", { ascending: false });

  if (conversationsError) {
    throw new Error(
      `[PublisherMessagesPage conversations] ${conversationsError.message}`,
    );
  }

  const conversations =
    (conversationsData ?? []) as ConversationRecord[];

  const conversationIds = conversations.map(
    (conversation) => conversation.id,
  );

  const opportunityIds = [
    ...new Set(
      conversations.map(
        (conversation) => conversation.opportunity_id,
      ),
    ),
  ];

  const talentIds = [
    ...new Set(
      conversations.map(
        (conversation) => conversation.talent_id,
      ),
    ),
  ];

  const [
    messagesResult,
    opportunitiesResult,
    talentsResult,
  ] = await Promise.all([
    conversationIds.length > 0
      ? adminClient
          .from("messages")
          .select(`
            id,
            conversation_id,
            sender_user_id,
            body,
            read_at,
            created_at
          `)
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),

    opportunityIds.length > 0
      ? adminClient
          .from("opportunities")
          .select("id, title")
          .in("id", opportunityIds)
      : Promise.resolve({ data: [], error: null }),

    talentIds.length > 0
      ? adminClient
          .from("talents")
          .select(`
            id,
            name_ar,
            name_en,
            image_url,
            category_ar,
            category_en
          `)
          .in("id", talentIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (messagesResult.error) {
    throw new Error(
      `[PublisherMessagesPage messages] ${messagesResult.error.message}`,
    );
  }

  if (opportunitiesResult.error) {
    throw new Error(
      `[PublisherMessagesPage opportunities] ${opportunitiesResult.error.message}`,
    );
  }

  if (talentsResult.error) {
    throw new Error(
      `[PublisherMessagesPage talents] ${talentsResult.error.message}`,
    );
  }

  const messages =
    (messagesResult.data ?? []) as MessageRecord[];

  const opportunities =
    (opportunitiesResult.data ?? []) as OpportunityRecord[];

  const talents =
    (talentsResult.data ?? []) as TalentRecord[];

  const opportunityMap = new Map(
    opportunities.map((opportunity) => [
      opportunity.id,
      opportunity,
    ]),
  );

  const talentMap = new Map(
    talents.map((talent) => [talent.id, talent]),
  );

  const latestMessageMap = new Map<number, MessageRecord>();
  const unreadCountMap = new Map<number, number>();

  for (const message of messages) {
    if (!latestMessageMap.has(message.conversation_id)) {
      latestMessageMap.set(message.conversation_id, message);
    }

    if (
      message.sender_user_id !== user.id &&
      message.read_at === null
    ) {
      unreadCountMap.set(
        message.conversation_id,
        (unreadCountMap.get(message.conversation_id) ?? 0) + 1,
      );
    }
  }

  const totalUnread = Array.from(
    unreadCountMap.values(),
  ).reduce((total, count) => total + count, 0);

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-background px-4 pb-24 pt-36 text-white sm:px-6 sm:pt-40 lg:pt-32"
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.12),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-6 sm:p-8">
          <Link
            href={`/${locale}/publisher-dashboard`}
            className="text-sm text-gold underline underline-offset-4"
          >
            {isArabic
              ? "← العودة إلى لوحة التحكم"
              : "← Back to Dashboard"}
          </Link>

          <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gold">
                {isArabic ? "الرسائل" : "Messages"}
              </p>

              <h1 className="mt-3 text-4xl font-light sm:text-5xl">
                {isArabic ? "محادثات المواهب" : "Talent Conversations"}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">
                {isArabic
                  ? "تابع المحادثات مع المواهب المقبولة في فرصك."
                  : "Track conversations with talents accepted for your opportunities."}
              </p>
            </div>

            <div className="flex gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-center">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">
                  {isArabic ? "المحادثات" : "Conversations"}
                </p>
                <p className="mt-1 text-2xl font-light">
                  {conversations.length}
                </p>
              </div>

              <div className="rounded-2xl border border-gold/25 bg-gold/[0.08] px-4 py-3 text-center">
                <p className="text-[10px] uppercase tracking-[0.2em] text-gold">
                  {isArabic ? "غير مقروء" : "Unread"}
                </p>
                <p className="mt-1 text-2xl font-light text-gold">
                  {totalUnread}
                </p>
              </div>
            </div>
          </div>
        </header>

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025]">
          {conversations.length > 0 ? (
            <div className="divide-y divide-white/10">
              {conversations.map((conversation) => {
                const talent = talentMap.get(
                  conversation.talent_id,
                );

                const opportunity = opportunityMap.get(
                  conversation.opportunity_id,
                );

                const latestMessage = latestMessageMap.get(
                  conversation.id,
                );

                const unreadCount =
                  unreadCountMap.get(conversation.id) ?? 0;

                const talentName =
                  isArabic
                    ? talent?.name_ar ||
                      talent?.name_en ||
                      "الموهبة"
                    : talent?.name_en ||
                      talent?.name_ar ||
                      "Talent";

                const talentCategory =
                  isArabic
                    ? talent?.category_ar ||
                      talent?.category_en ||
                      ""
                    : talent?.category_en ||
                      talent?.category_ar ||
                      "";

                const lastActivity =
                  latestMessage?.created_at ||
                  conversation.updated_at;

                return (
                  <Link
                    key={conversation.id}
                    href={`/${locale}/publisher-dashboard/messages/${conversation.id}`}
                    className="group flex items-center gap-4 p-5 transition hover:bg-white/[0.035] sm:p-6"
                  >
                    {talent?.image_url ? (
                      <img
                        src={talent.image_url}
                        alt={talentName}
                        className="h-16 w-16 shrink-0 rounded-full border border-white/10 object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xl text-gold">
                        {talentName.slice(0, 1)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h2
                              className={`truncate text-lg ${
                                unreadCount > 0
                                  ? "font-medium text-white"
                                  : "font-light text-white/85"
                              }`}
                            >
                              {talentName}
                            </h2>

                            {conversation.status === "active" ? (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-300" />
                            ) : (
                              <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.15em] text-white/35">
                                {isArabic ? "موقوفة" : "Closed"}
                              </span>
                            )}
                          </div>

                          <p className="mt-1 truncate text-xs text-gold/75">
                            {opportunity?.title ??
                              (isArabic
                                ? "فرصة بدون عنوان"
                                : "Untitled Opportunity")}
                          </p>

                          {talentCategory ? (
                            <p className="mt-1 truncate text-[11px] text-white/30">
                              {talentCategory}
                            </p>
                          ) : null}
                        </div>

                        <div className="shrink-0 text-end">
                          <time className="text-[10px] text-white/30">
                            {formatConversationDate(
                              lastActivity,
                              locale,
                            )}
                          </time>

                          {unreadCount > 0 ? (
                            <span className="mt-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-gold px-2 text-[10px] font-medium text-black">
                              {unreadCount}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <p
                        className={`mt-3 truncate text-sm ${
                          unreadCount > 0
                            ? "text-white/70"
                            : "text-white/35"
                        }`}
                      >
                        {latestMessage?.body ||
                          (isArabic
                            ? "لا توجد رسائل بعد."
                            : "No messages yet.")}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[360px] items-center justify-center p-8 text-center">
              <div className="max-w-md">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold/25 bg-gold/[0.08] text-2xl text-gold">
                  ✉
                </div>

                <h2 className="mt-5 text-2xl font-light">
                  {isArabic
                    ? "لا توجد محادثات حتى الآن"
                    : "No conversations yet"}
                </h2>

                <p className="mt-3 text-sm leading-7 text-white/40">
                  {isArabic
                    ? "ستظهر المحادثات هنا تلقائيًا بعد قبول أحد المتقدمين."
                    : "Conversations will appear here automatically after an applicant is accepted."}
                </p>

                <Link
                  href={`/${locale}/publisher-dashboard/opportunities`}
                  className="mt-6 inline-flex rounded-full border border-gold/40 bg-gold/[0.06] px-6 py-3 text-sm text-gold transition hover:bg-gold hover:text-black"
                >
                  {isArabic
                    ? "عرض الفرص"
                    : "View Opportunities"}
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
