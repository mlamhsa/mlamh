import Image from "next/image";
import Link from "next/link";
import type {
  MessageAttachmentRecord,
} from "@/components/messages/MessageBubble";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  MessageCircle,
  UserRound,
  XCircle,
} from "lucide-react";

import {
  closeConversationAction,
  markConversationReadAction,
} from "@/lib/actions/message-actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import MessageComposer from "./message-composer";
import RealtimeMessageList from "./RealtimeMessageList";

type PageProps = {
  params: Promise<{
    locale: string;
    conversationId: string;
  }>;
};

type ConversationRecord = {
  id: number;
  application_id: number | null;
  opportunity_id: number;
  publisher_id: number;
  talent_id: number;
  status: string | null;
  closed_at: string | null;
  updated_at: string | null;
};

type MessageRecord = {
  id: number | string;
  conversation_id: number;
  sender_user_id: string;
  body: string;
  read_at: string | null;
  reported_at: string | null;
  report_reason: string | null;
  created_at: string;
  attachments: MessageAttachmentRecord[];
};

type OpportunityRecord = {
  id: number;
  title: string | null;
};

type TalentRecord = {
  id: number;
  slug: string | null;
  name_ar: string | null;
  name_en: string | null;
  image_url: string | null;
  category_ar: string | null;
  category_en: string | null;
  city_ar: string | null;
  city_en: string | null;
};

function formatMessageDate(value: string, locale: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(
    locale === "ar" ? "ar-SA" : "en-US",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

export default async function PublisherConversationPage({
  params,
}: PageProps) {
  const { locale, conversationId: rawConversationId } =
    await params;
  const isArabic = locale === "ar";
  const conversationId = Number(rawConversationId);

  if (!Number.isInteger(conversationId) || conversationId <= 0) {
    redirect(`/${locale}/publisher-dashboard/messages`);
  }

  const authClient = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    redirect(`/${locale}/login`);
  }

  const adminClient = createAdminClient();

  const { data: profile, error: profileError } =
    await adminClient
      .from("profiles")
      .select("id, account_type")
      .eq("user_id", user.id)
      .maybeSingle();

  if (profileError) {
    throw new Error(
      `[PublisherConversationPage profile] ${profileError.message}`,
    );
  }

  if (!profile || profile.account_type !== "publisher") {
    redirect(`/${locale}/login`);
  }

  const { data: publisher, error: publisherError } =
    await adminClient
      .from("publishers")
      .select("id, company_name, contact_name")
      .eq("profile_id", profile.id)
      .maybeSingle();

  if (publisherError) {
    throw new Error(
      `[PublisherConversationPage publisher] ${publisherError.message}`,
    );
  }

  if (!publisher) {
    redirect(`/${locale}/join/publisher`);
  }

  const {
    data: conversationData,
    error: conversationError,
  } = await adminClient
    .from("conversations")
    .select(`
      id,
      application_id,
      opportunity_id,
      publisher_id,
      talent_id,
      status,
      closed_at,
      updated_at
    `)
    .eq("id", conversationId)
    .eq("publisher_id", publisher.id)
    .maybeSingle();

  if (conversationError) {
    throw new Error(
      `[PublisherConversationPage conversation] ${conversationError.message}`,
    );
  }

  if (!conversationData) {
    redirect(`/${locale}/publisher-dashboard/messages`);
  }

  const conversation =
    conversationData as ConversationRecord;
    if (!conversation.application_id) {
      redirect(
        `/${locale}/publisher-dashboard/messages`,
      );
    }
    
    const {
      data: application,
      error: applicationError,
    } = await adminClient
      .from("opportunity_applications")
      .select("id, status, opportunity_id, talent_id")
      .eq("id", conversation.application_id)
      .eq(
        "opportunity_id",
        conversation.opportunity_id,
      )
      .eq(
        "talent_id",
        conversation.talent_id,
      )
      .maybeSingle();
    
    if (applicationError) {
      throw new Error(
        `[PublisherConversationPage application] ${applicationError.message}`,
      );
    }
    
    if (
      !application ||
      application.status !== "accepted"
    ) {
      redirect(
        `/${locale}/publisher-dashboard/messages`,
      );
    }
    
  const [messagesResult, opportunityResult, talentResult] =
    await Promise.all([
      adminClient
        .from("messages")
        .select(`
          id,
          conversation_id,
          sender_user_id,
          body,
          read_at,
          reported_at,
          report_reason,
          created_at
        `)
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true }),

      adminClient
        .from("opportunities")
        .select("id, title")
        .eq("id", conversation.opportunity_id)
        .maybeSingle(),

      adminClient
        .from("talents")
        .select(`
          id,
          slug,
          name_ar,
          name_en,
          image_url,
          category_ar,
          category_en,
          city_ar,
          city_en
        `)
        .eq("id", conversation.talent_id)
        .maybeSingle(),
    ]);

  if (messagesResult.error) {
    throw new Error(
      `[PublisherConversationPage messages] ${messagesResult.error.message}`,
    );
  }

  if (opportunityResult.error) {
    throw new Error(
      `[PublisherConversationPage opportunity] ${opportunityResult.error.message}`,
    );
  }

  if (talentResult.error) {
    throw new Error(
      `[PublisherConversationPage talent] ${talentResult.error.message}`,
    );
  }

  const rawMessages =
  messagesResult.data ?? [];

const messageIds =
  rawMessages.map(
    (message) => Number(message.id),
  );

const attachmentsResult =
  messageIds.length > 0
    ? await adminClient
        .from("message_attachments")
        .select(`
          id,
          message_id,
          conversation_id,
          uploader_user_id,
          storage_path,
          file_name,
          mime_type,
          size_bytes,
          created_at
        `)
        .in(
          "message_id",
          messageIds,
        )
        .order(
          "created_at",
          {
            ascending: true,
          },
        )
    : {
        data: [],
        error: null,
      };

if (
  attachmentsResult.error
) {
  throw new Error(
    `[PublisherConversationPage attachments] ${attachmentsResult.error.message}`,
  );
}

const rawAttachments =
  attachmentsResult.data ?? [];

const attachmentsWithSignedUrls =
  await Promise.all(
    rawAttachments.map(
      async (attachment) => {
        const {
          data: signedData,
          error: signedError,
        } =
          await adminClient.storage
            .from("message-attachments")
            .createSignedUrl(
              attachment.storage_path,
              60 * 60,
            );

        if (signedError) {
          console.error(
            "[PublisherConversationPage signed attachment]",
            signedError,
          );
        }

        return {
          id:
            attachment.id,

          message_id:
            attachment.message_id,

          conversation_id:
            attachment.conversation_id,

          uploader_user_id:
            attachment.uploader_user_id,

          storage_path:
            attachment.storage_path,

          file_name:
            attachment.file_name,

          mime_type:
            attachment.mime_type,

          size_bytes:
            Number(
              attachment.size_bytes,
            ),

          created_at:
            attachment.created_at,

          signed_url:
            signedError
              ? null
              : signedData?.signedUrl ??
                null,
        };
      },
    ),
  );

const attachmentsByMessage =
  new Map<
    number,
    typeof attachmentsWithSignedUrls
  >();

for (
  const attachment
  of attachmentsWithSignedUrls
) {
  const messageId =
    Number(
      attachment.message_id,
    );

  const existing =
    attachmentsByMessage.get(
      messageId,
    ) ?? [];

  existing.push(
    attachment,
  );

  attachmentsByMessage.set(
    messageId,
    existing,
  );
}

const messages: MessageRecord[] =
  rawMessages.map(
    (message) => ({
      ...message,

      attachments:
        attachmentsByMessage.get(
          Number(message.id),
        ) ?? [],
    }),
  );
  const opportunity =
    opportunityResult.data as OpportunityRecord | null;
  const talent = talentResult.data as TalentRecord | null;

  await markConversationReadAction(conversation.id);

  const talentName = isArabic
    ? talent?.name_ar || talent?.name_en || "الموهبة"
    : talent?.name_en || talent?.name_ar || "Talent";

  const talentCategory = isArabic
    ? talent?.category_ar || talent?.category_en || ""
    : talent?.category_en || talent?.category_ar || "";

  const talentCity = isArabic
    ? talent?.city_ar || talent?.city_en || ""
    : talent?.city_en || talent?.city_ar || "";

  const opportunityTitle =
    opportunity?.title ??
    (isArabic ? "فرصة بدون عنوان" : "Untitled Opportunity");

  const isActive =
    (conversation.status ?? "active") === "active";

  const closedAtLabel = conversation.closed_at
    ? formatMessageDate(conversation.closed_at, locale)
    : null;

  const talentHref = talent?.slug || talent?.id
    ? `/${locale}/talent/${talent.slug ?? talent.id}`
    : null;

  const opportunityHref = opportunity?.id
    ? `/${locale}/publisher-dashboard/opportunities/${opportunity.id}`
    : null;

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-background px-3 pb-24 pt-28 text-white sm:px-6 sm:pt-32 lg:pb-8"
    >
      <div className="mx-auto max-w-7xl">
        <section className="flex h-[calc(100dvh-8rem)] min-h-[620px] overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.025] shadow-2xl shadow-black/30 lg:h-[calc(100dvh-9rem)]">
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="shrink-0 border-b border-white/10 bg-black/35 px-4 py-3 backdrop-blur-xl sm:px-5">
              <div className="flex items-center gap-3">
                <Link
                  href={`/${locale}/publisher-dashboard/messages`}
                  aria-label={
                    isArabic
                      ? "العودة إلى المحادثات"
                      : "Back to conversations"
                  }
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/65 transition hover:border-gold/40 hover:text-gold"
                >
                  <ArrowLeft
                    size={18}
                    className={isArabic ? "rotate-180" : ""}
                  />
                </Link>

                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-gold/25 bg-gold/10">
                  {talent?.image_url ? (
                    <Image
                      src={talent.image_url}
                      alt={talentName}
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-medium text-gold">
                      {talentName.slice(0, 1)}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h1 className="truncate text-base font-medium sm:text-lg">
                      {talentName}
                    </h1>
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        isActive
                          ? "bg-emerald-300"
                          : "bg-amber-300"
                      }`}
                    />
                  </div>

                  <p className="truncate text-xs text-gold/75">
                    {opportunityTitle}
                  </p>
                </div>

                <div className="hidden items-center gap-2 sm:flex">
                  {talentHref ? (
                    <Link
                      href={talentHref}
                      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-xs text-white/60 transition hover:border-gold/40 hover:text-gold"
                    >
                      <UserRound size={15} />
                      {isArabic ? "عرض الملف" : "Profile"}
                    </Link>
                  ) : null}

                  {opportunityHref ? (
                    <Link
                      href={opportunityHref}
                      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-xs text-white/60 transition hover:border-gold/40 hover:text-gold"
                    >
                      <BriefcaseBusiness size={15} />
                      {isArabic ? "الفرصة" : "Opportunity"}
                    </Link>
                  ) : null}

                  {isActive ? (
                    <form action={closeConversationAction}>
                      <input
                        type="hidden"
                        name="conversationId"
                        value={conversation.id}
                      />
                      <input
                        type="hidden"
                        name="locale"
                        value={locale}
                      />
                      <button
                        type="submit"
                        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-red-300/25 px-4 text-xs text-red-200 transition hover:bg-red-300 hover:text-black"
                      >
                        <XCircle size={15} />
                        {isArabic ? "إغلاق" : "Close"}
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:hidden">
                {talentHref ? (
                  <Link
                    href={talentHref}
                    className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full border border-white/10 px-3 text-[11px] text-white/60"
                  >
                    <UserRound size={14} />
                    {isArabic ? "الملف" : "Profile"}
                  </Link>
                ) : null}

                {opportunityHref ? (
                  <Link
                    href={opportunityHref}
                    className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full border border-white/10 px-3 text-[11px] text-white/60"
                  >
                    <BriefcaseBusiness size={14} />
                    {isArabic ? "تفاصيل الفرصة" : "Opportunity"}
                  </Link>
                ) : null}

                <span
                  className={`inline-flex min-h-9 shrink-0 items-center rounded-full border px-3 text-[11px] ${
                    isActive
                      ? "border-emerald-300/25 bg-emerald-300/[0.08] text-emerald-200"
                      : "border-amber-300/25 bg-amber-300/[0.08] text-amber-200"
                  }`}
                >
                  {isActive
                    ? isArabic
                      ? "محادثة نشطة"
                      : "Active"
                    : isArabic
                      ? "مغلقة"
                      : "Closed"}
                </span>
              </div>
            </header>

            <RealtimeMessageList
              conversationId={conversation.id}
              currentUserId={user.id}
              initialMessages={messages}
              locale={locale}
            />

            <footer className="shrink-0 border-t border-white/10 bg-black/45 backdrop-blur-xl">
              {isActive ? (
                <MessageComposer
                conversationId={conversation.id}
                currentUserId={user.id}
                locale={locale}
              />
              ) : (
                <div className="px-4 py-4 sm:px-5">
                  <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] px-5 py-4 text-center">
                    <p className="text-sm text-amber-100/85">
                      {isArabic
                        ? "المحادثة مغلقة ولا يمكن إرسال رسائل جديدة."
                        : "This conversation is closed and no new messages can be sent."}
                    </p>

                    {closedAtLabel ? (
                      <p className="mt-1 text-[10px] text-white/35">
                        {isArabic
                          ? `أُغلقت في ${closedAtLabel}`
                          : `Closed on ${closedAtLabel}`}
                      </p>
                    ) : null}
                  </div>
                </div>
              )}
            </footer>
          </div>

          <aside className="hidden w-72 shrink-0 border-s border-white/10 bg-black/20 p-5 xl:block">
            <div className="flex h-full flex-col">
              <div className="text-center">
                <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-full border border-gold/25 bg-gold/10">
                  {talent?.image_url ? (
                    <Image
                      src={talent.image_url}
                      alt={talentName}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl text-gold">
                      {talentName.slice(0, 1)}
                    </div>
                  )}
                </div>

                <h2 className="mt-4 truncate text-lg font-medium">
                  {talentName}
                </h2>

                {talentCategory ? (
                  <p className="mt-1 text-xs text-gold/70">
                    {talentCategory}
                  </p>
                ) : null}

                {talentCity ? (
                  <p className="mt-1 text-xs text-white/35">
                    {talentCity}
                  </p>
                ) : null}
              </div>

              <div className="mt-6 space-y-3">
                <ContextItem
                  icon={<BriefcaseBusiness size={15} />}
                  label={isArabic ? "الفرصة" : "Opportunity"}
                  value={opportunityTitle}
                />

                <ContextItem
                  icon={<MessageCircle size={15} />}
                  label={
                    isArabic ? "حالة التواصل" : "Conversation"
                  }
                  value={
                    isActive
                      ? isArabic
                        ? "نشطة"
                        : "Active"
                      : isArabic
                        ? "مغلقة"
                        : "Closed"
                  }
                />
              </div>

              <div className="mt-auto space-y-2 pt-6">
                {talentHref ? (
                  <Link
                    href={talentHref}
                    className="flex min-h-11 items-center justify-center rounded-xl border border-white/10 text-sm text-white/65 transition hover:border-gold/40 hover:text-gold"
                  >
                    {isArabic ? "فتح ملف الموهبة" : "Open talent profile"}
                  </Link>
                ) : null}

                {opportunityHref ? (
                  <Link
                    href={opportunityHref}
                    className="flex min-h-11 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-sm text-gold transition hover:bg-gold hover:text-black"
                  >
                    {isArabic ? "عرض تفاصيل الفرصة" : "View opportunity"}
                  </Link>
                ) : null}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function ContextItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <div className="flex items-center gap-2 text-gold/75">
        {icon}
        <p className="text-[10px] uppercase tracking-[0.16em]">
          {label}
        </p>
      </div>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/70">
        {value}
      </p>
    </div>
  );
}
