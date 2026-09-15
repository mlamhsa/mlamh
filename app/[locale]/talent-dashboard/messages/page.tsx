import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import LocalDateTime from "@/components/messages/LocalDateTime";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ locale: string }>;
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
  read_at: string | null;
  created_at: string;
};

type AttachmentRecord = {
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

function attachmentPreview(attachment: AttachmentRecord | undefined, isArabic: boolean) {
  if (!attachment) return "";
  if (attachment.mime_type.startsWith("audio/")) return isArabic ? "🎙️ رسالة صوتية" : "🎙️ Voice message";
  if (attachment.mime_type.startsWith("image/")) return isArabic ? "📷 صورة" : "📷 Photo";
  if (attachment.mime_type === "application/pdf") return isArabic ? "📄 ملف PDF" : "📄 PDF file";
  return isArabic ? "📎 مرفق" : "📎 Attachment";
}

export default async function TalentMessagesPage({ params }: PageProps) {
  const { locale } = await params;
  const isArabic = locale === "ar";

  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) redirect(`/${locale}/login`);

  const adminClient = createAdminClient();
  const { data: talent, error: talentError } = await adminClient
    .from("talents")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (talentError) throw new Error(`[TalentMessagesPage talent] ${talentError.message}`);
  if (!talent) redirect(`/${locale}/join/talent`);

  const { data: conversationsData, error: conversationsError } = await adminClient
    .from("conversations")
    .select(`
      id,
      opportunity_id,
      publisher_id,
      talent_id,
      conversation_type,
      status,
      updated_at
    `)
    .eq("talent_id", talent.id)
    .order("updated_at", { ascending: false });

  if (conversationsError) {
    throw new Error(`[TalentMessagesPage conversations] ${conversationsError.message}`);
  }

  const conversations = (conversationsData ?? []) as ConversationRecord[];
  const conversationIds = conversations.map((item) => item.id);
  const opportunityIds = [...new Set(conversations.map((item) => item.opportunity_id))];
  const publisherIds = [
    ...new Set(
      conversations
        .map((item) => item.publisher_id)
        .filter((id): id is number => id !== null),
    ),
  ];

  const [messagesResult, attachmentsResult, opportunitiesResult, publishersResult] =
    await Promise.all([
      conversationIds.length > 0
        ? adminClient
            .from("messages")
            .select("id, conversation_id, sender_user_id, body, read_at, created_at")
            .in("conversation_id", conversationIds)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      conversationIds.length > 0
        ? adminClient
            .from("message_attachments")
            .select("message_id, conversation_id, file_name, mime_type")
            .in("conversation_id", conversationIds)
        : Promise.resolve({ data: [], error: null }),
      opportunityIds.length > 0
        ? adminClient.from("opportunities").select("id, title").in("id", opportunityIds)
        : Promise.resolve({ data: [], error: null }),
      publisherIds.length > 0
        ? adminClient
            .from("publishers")
            .select("id, company_name, contact_name, profile_image_url")
            .in("id", publisherIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (messagesResult.error) throw new Error(`[TalentMessagesPage messages] ${messagesResult.error.message}`);
  if (attachmentsResult.error) throw new Error(`[TalentMessagesPage attachments] ${attachmentsResult.error.message}`);
  if (opportunitiesResult.error) throw new Error(`[TalentMessagesPage opportunities] ${opportunitiesResult.error.message}`);
  if (publishersResult.error) throw new Error(`[TalentMessagesPage publishers] ${publishersResult.error.message}`);

  const messages = (messagesResult.data ?? []) as MessageRecord[];
  const attachments = (attachmentsResult.data ?? []) as AttachmentRecord[];
  const opportunities = (opportunitiesResult.data ?? []) as OpportunityRecord[];
  const publishers = (publishersResult.data ?? []) as PublisherRecord[];

  const opportunityMap = new Map(opportunities.map((item) => [item.id, item]));
  const publisherMap = new Map(publishers.map((item) => [item.id, item]));
  const attachmentByMessageId = new Map(attachments.map((item) => [String(item.message_id), item]));
  const latestMessageMap = new Map<number, MessageRecord>();
  const unreadCountMap = new Map<number, number>();

  for (const message of messages) {
    if (!latestMessageMap.has(message.conversation_id)) {
      latestMessageMap.set(message.conversation_id, message);
    }
    if (message.sender_user_id !== user.id && message.read_at === null) {
      unreadCountMap.set(
        message.conversation_id,
        (unreadCountMap.get(message.conversation_id) ?? 0) + 1,
      );
    }
  }

  const totalUnread = [...unreadCountMap.values()].reduce((sum, count) => sum + count, 0);

  return (
    <main dir={isArabic ? "rtl" : "ltr"} className="min-h-screen bg-background px-3 pb-24 pt-28 text-white sm:px-6 sm:pt-36 lg:pt-32">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.12),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-5 sm:rounded-[2rem] sm:p-8">
          <Link href={`/${locale}/talent-dashboard`} className="text-xs text-white/45 transition hover:text-gold">
            {isArabic ? "العودة إلى لوحة الموهبة" : "Back to dashboard"}
          </Link>

          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
                {isArabic ? "التواصل" : "MESSAGES"}
              </p>
              <h1 className="mt-2 text-3xl font-light sm:text-5xl">
                {isArabic ? "محادثاتك" : "Your Conversations"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">
                {isArabic
                  ? "تظهر المحادثة عندما يفتح مسار الفرصة التواصل بينك وبين الناشر أو فريق ملامح."
                  : "A conversation appears when the opportunity workflow opens communication with the publisher or MLAMH team."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Metric label={isArabic ? "المحادثات" : "Conversations"} value={conversations.length} />
              <Metric label={isArabic ? "غير مقروء" : "Unread"} value={totalUnread} highlighted />
            </div>
          </div>
        </header>

        <section className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.025] sm:rounded-[2rem]">
          {conversations.length > 0 ? (
            <div className="divide-y divide-white/10">
              {conversations.map((conversation) => {
                const isMlamhConversation = conversation.conversation_type === "mlamh_talent";
                const publisher = conversation.publisher_id !== null
                  ? publisherMap.get(conversation.publisher_id)
                  : undefined;
                const opportunity = opportunityMap.get(conversation.opportunity_id);
                const latestMessage = latestMessageMap.get(conversation.id);
                const latestAttachment = latestMessage
                  ? attachmentByMessageId.get(String(latestMessage.id))
                  : undefined;
                const preview =
                  latestMessage?.body?.trim() ||
                  attachmentPreview(latestAttachment, isArabic) ||
                  (isArabic ? "لا توجد رسائل بعد." : "No messages yet.");
                const unreadCount = unreadCountMap.get(conversation.id) ?? 0;
                const partyName = isMlamhConversation
                  ? isArabic ? "ملامح" : "MLAMH"
                  : publisher?.company_name ||
                    publisher?.contact_name ||
                    (isArabic ? "الناشر" : "Publisher");
                const lastActivity = latestMessage?.created_at || conversation.updated_at;
                const isActive = (conversation.status ?? "active") === "active";

                return (
                  <Link
                    key={conversation.id}
                    href={`/${locale}/talent-dashboard/messages/${conversation.id}`}
                    className="group flex items-center gap-3 p-4 transition hover:bg-white/[0.035] sm:gap-4 sm:p-6"
                  >
                    {publisher?.profile_image_url && !isMlamhConversation ? (
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/10 sm:h-16 sm:w-16">
                        <Image src={publisher.profile_image_url} alt={partyName} fill sizes="64px" className="object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-base text-gold sm:h-16 sm:w-16 sm:text-xl">
                        {partyName.slice(0, 1)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h2 className={`truncate text-base sm:text-lg ${unreadCount > 0 ? "font-medium text-white" : "font-light text-white/85"}`}>
                              {partyName}
                            </h2>
                            {isActive ? (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-300" />
                            ) : (
                              <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] text-white/35">
                                {isArabic ? "مغلقة" : "Closed"}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 truncate text-xs text-gold/75">
                            {opportunity?.title ?? (isArabic ? "فرصة بدون عنوان" : "Untitled Opportunity")}
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
                            <span className="mt-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[9px] font-medium text-black sm:h-6 sm:min-w-6 sm:text-[10px]">
                              {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <p className={`mt-2 truncate text-xs sm:text-sm ${unreadCount > 0 ? "text-white/65" : "text-white/35"}`}>
                        {preview}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-16 text-center sm:py-20">
              <h2 className="text-2xl font-light">
                {isArabic ? "لا توجد محادثات بعد" : "No conversations yet"}
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/45">
                {isArabic
                  ? "عندما يصل أحد طلباتك إلى مرحلة تسمح بالتواصل، ستظهر المحادثة هنا تلقائيًا."
                  : "When one of your applications reaches a stage that enables communication, the conversation will appear here automatically."}
              </p>
              <Link
                href={`/${locale}/opportunities`}
                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-gold px-6 text-sm font-semibold text-black"
              >
                {isArabic ? "استعراض الفرص" : "Browse opportunities"}
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, highlighted = false }: { label: string; value: number; highlighted?: boolean }) {
  return (
    <div className={`rounded-xl border px-4 py-3 text-center ${highlighted ? "border-gold/25 bg-gold/[0.08]" : "border-white/10 bg-black/20"}`}>
      <p className={`text-[10px] ${highlighted ? "text-gold" : "text-white/35"}`}>{label}</p>
      <p className={`mt-1 text-2xl font-light ${highlighted ? "text-gold" : "text-white"}`}>{value}</p>
    </div>
  );
}
