import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import LocalDateTime from "@/components/messages/LocalDateTime";

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

type MessageAttachmentRecord = {
  message_id: number | string;
  conversation_id: number;
  file_name: string;
  mime_type: string;
};

type OpportunityRecord = {
  id: number;
  title: string | null;
};

type PublisherRecord = {
  id: number;
  company_name: string | null;
  contact_name: string | null;
  profile_image_url: string | null;
};

export default async function TalentMessagesPage({
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
    redirect(`/${locale}/login`);
  }

  const adminClient = createAdminClient();

  const { data: talent, error: talentError } = await adminClient
    .from("talents")
    .select("id, name_ar, name_en")
    .eq("user_id", user.id)
    .maybeSingle();

  if (talentError) {
    throw new Error(
      `[TalentMessagesPage talent] ${talentError.message}`,
    );
  }

  if (!talent) {
    redirect(`/${locale}/join/talent`);
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
    .eq("talent_id", talent.id)
    .order("updated_at", { ascending: false });

  if (conversationsError) {
    throw new Error(
      `[TalentMessagesPage conversations] ${conversationsError.message}`,
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

  const publisherIds = [
    ...new Set(
      conversations.map(
        (conversation) => conversation.publisher_id,
      ),
    ),
  ];

  const [
    messagesResult,
    attachmentsResult,
    opportunitiesResult,
    publishersResult,
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

    conversationIds.length > 0
      ? adminClient
          .from("message_attachments")
          .select(`
            message_id,
            conversation_id,
            file_name,
            mime_type
          `)
          .in("conversation_id", conversationIds)
      : Promise.resolve({ data: [], error: null }),

    opportunityIds.length > 0
      ? adminClient
          .from("opportunities")
          .select("id, title")
          .in("id", opportunityIds)
      : Promise.resolve({ data: [], error: null }),

    publisherIds.length > 0
      ? adminClient
          .from("publishers")
          .select(`
            id,
            company_name,
            contact_name,
            profile_image_url
          `)
          .in("id", publisherIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (messagesResult.error) {
    throw new Error(
      `[TalentMessagesPage messages] ${messagesResult.error.message}`,
    );
  }

  if (attachmentsResult.error) {
    throw new Error(
      `[TalentMessagesPage attachments] ${attachmentsResult.error.message}`,
    );
  }

  if (opportunitiesResult.error) {
    throw new Error(
      `[TalentMessagesPage opportunities] ${opportunitiesResult.error.message}`,
    );
  }

  if (publishersResult.error) {
    throw new Error(
      `[TalentMessagesPage publishers] ${publishersResult.error.message}`,
    );
  }

  const messages =
    (messagesResult.data ?? []) as MessageRecord[];

  const attachments =
    (attachmentsResult.data ?? []) as MessageAttachmentRecord[];

  const attachmentByMessageId = new Map<
    string,
    MessageAttachmentRecord
  >();

  for (const attachment of attachments) {
    attachmentByMessageId.set(
      String(attachment.message_id),
      attachment,
    );
  }

  const opportunities =
    (opportunitiesResult.data ?? []) as OpportunityRecord[];

  const publishers =
    (publishersResult.data ?? []) as PublisherRecord[];

  const opportunityMap = new Map(
    opportunities.map((opportunity) => [
      opportunity.id,
      opportunity,
    ]),
  );

  const publisherMap = new Map(
    publishers.map((publisher) => [
      publisher.id,
      publisher,
    ]),
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
      className="min-h-screen bg-background px-3 pb-24 pt-28 text-white sm:px-6 sm:pt-36 lg:pt-32"
    >
      <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">
        <header className="rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.12),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-5 sm:rounded-[2rem] sm:p-8">
          <Link
            href={`/${locale}/talent-dashboard`}
            className="text-sm text-gold underline underline-offset-4"
          >
            {isArabic
              ? "← العودة إلى لوحة التحكم"
              : "← Back to Dashboard"}
          </Link>

          <div className="mt-5 flex flex-col gap-4 sm:mt-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gold">
                {isArabic ? "الرسائل" : "Messages"}
              </p>

              <h1 className="mt-2 text-3xl font-light sm:mt-3 sm:text-5xl">
                {isArabic ? "محادثاتك" : "Your Conversations"}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45 sm:mt-3 sm:leading-7">
                {isArabic
                  ? "تواصل مع الناشرين بعد قبول طلبك في الفرص."
                  : "Communicate with publishers after your application is accepted."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-center sm:rounded-2xl sm:px-4 sm:py-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">
                  {isArabic ? "المحادثات" : "Conversations"}
                </p>
                <p className="mt-1 text-2xl font-light">
                  {conversations.length}
                </p>
              </div>

              <div className="rounded-xl border border-gold/25 bg-gold/[0.08] px-3 py-2.5 text-center sm:rounded-2xl sm:px-4 sm:py-3">
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

        <section className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.025] sm:rounded-[2rem]">
          {conversations.length > 0 ? (
            <div className="divide-y divide-white/10">
              {conversations.map((conversation) => {
                const publisher = publisherMap.get(
                  conversation.publisher_id,
                );

                const opportunity = opportunityMap.get(
                  conversation.opportunity_id,
                );

                const latestMessage = latestMessageMap.get(
                  conversation.id,
                );

                const latestAttachment = latestMessage
                  ? attachmentByMessageId.get(
                      String(latestMessage.id),
                    )
                  : undefined;

                let latestMessagePreview =
                  latestMessage?.body?.trim() ?? "";

                if (!latestMessagePreview && latestAttachment) {
                  const mimeType = latestAttachment.mime_type;

                  if (mimeType.startsWith("audio/")) {
                    latestMessagePreview = isArabic
                      ? "🎙️ رسالة صوتية"
                      : "🎙️ Voice message";
                  } else if (mimeType.startsWith("image/")) {
                    latestMessagePreview = isArabic
                      ? "📷 صورة"
                      : "📷 Photo";
                  } else if (mimeType === "application/pdf") {
                    latestMessagePreview = isArabic
                      ? "📄 ملف PDF"
                      : "📄 PDF file";
                  } else if (
                    mimeType === "application/msword" ||
                    mimeType ===
                      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  ) {
                    latestMessagePreview = isArabic
                      ? "📄 ملف Word"
                      : "📄 Word file";
                  } else {
                    latestMessagePreview = isArabic
                      ? "📎 مرفق"
                      : "📎 Attachment";
                  }
                }

                if (!latestMessagePreview) {
                  latestMessagePreview = isArabic
                    ? "لا توجد رسائل بعد."
                    : "No messages yet.";
                }

                const unreadCount =
                  unreadCountMap.get(conversation.id) ?? 0;

                const publisherName =
                  publisher?.company_name ||
                  publisher?.contact_name ||
                  (isArabic ? "الناشر" : "Publisher");

                const lastActivity =
                  latestMessage?.created_at ||
                  conversation.updated_at;

                return (
                  <Link
                    key={conversation.id}
                    href={`/${locale}/talent-dashboard/messages/${conversation.id}`}
                    className="group flex items-center gap-3 p-4 transition hover:bg-white/[0.035] sm:gap-4 sm:p-6"
                  >
                    {publisher?.profile_image_url ? (
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/10 sm:h-16 sm:w-16">
                      <Image
                        src={publisher.profile_image_url}
                        alt={publisherName}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-base text-gold sm:h-16 sm:w-16 sm:text-xl">
                        {publisherName.slice(0, 1)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h2
                              className={`truncate text-base sm:text-lg ${
                                unreadCount > 0
                                  ? "font-medium text-white"
                                  : "font-light text-white/85"
                              }`}
                            >
                              {publisherName}
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
                        </div>

                        <div className="shrink-0 text-end">
                          <LocalDateTime
                            value={lastActivity}
                            locale={locale}
                            mode="conversation"
                            className="text-[9px] text-white/30 sm:text-[10px]"
                          />

                          {unreadCount > 0 ? (
                            <span className="mt-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[9px] font-medium text-black sm:mt-2 sm:h-6 sm:min-w-6 sm:px-2 sm:text-[10px]">
                              {unreadCount}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <p
                        className={`mt-2 truncate text-xs sm:mt-3 sm:text-sm ${
                          unreadCount > 0
                            ? "text-white/70"
                            : "text-white/35"
                        }`}
                      >
                        {latestMessagePreview}
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
                    ? "ستظهر محادثاتك هنا تلقائيًا بعد قبول طلبك في إحدى الفرص."
                    : "Your conversations will appear here automatically after one of your applications is accepted."}
                </p>

                <Link
                  href={`/${locale}/talent-dashboard/applications`}
                  className="mt-6 inline-flex rounded-full border border-gold/40 bg-gold/[0.06] px-6 py-3 text-sm text-gold transition hover:bg-gold hover:text-black"
                >
                  {isArabic ? "عرض طلباتي" : "View Applications"}
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
