import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  MessageCircle,
} from "lucide-react";

import {
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
  publisher_id: number | null;
  talent_id: number;
  conversation_type: string | null;
  status: string | null;
  closed_at: string | null;
  updated_at: string | null;
};

type MessageAttachment = {
  id: number;
  message_id: number;
  conversation_id: number;
  uploader_user_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  signed_url: string | null;
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
  attachments: MessageAttachment[];
};

type RawMessageRecord = Omit<
  MessageRecord,
  "attachments"
>;

type AttachmentRecord = Omit<
  MessageAttachment,
  "signed_url"
>;

type OpportunityRecord = {
  id: number;
  title: string | null;
  slug: string | null;
};

type PublisherRecord = {
  id: number;
  company_name: string | null;
  contact_name: string | null;
  publisher_type: string | null;
  city: string | null;
  profile_image_url: string | null;
};

function formatConversationDate(
  value: string,
  locale: string,
) {
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

export default async function TalentConversationPage({
  params,
}: PageProps) {
  const {
    locale,
    conversationId: rawConversationId,
  } = await params;

  const isArabic = locale === "ar";
  const conversationId = Number(
    rawConversationId,
  );

  if (
    !Number.isInteger(conversationId) ||
    conversationId <= 0
  ) {
    redirect(
      `/${locale}/talent-dashboard/applications`,
    );
  }

  const authClient =
    await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    redirect(`/${locale}/login`);
  }

  const adminClient = createAdminClient();

  const {
    data: talent,
    error: talentError,
  } = await adminClient
    .from("talents")
    .select("id, slug, name_ar, name_en")
    .eq("user_id", user.id)
    .maybeSingle();

  if (talentError) {
    throw new Error(
      `[TalentConversationPage talent] ${talentError.message}`,
    );
  }

  if (!talent) {
    redirect(`/${locale}/join/talent`);
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
      conversation_type,
      status,
      closed_at,
      updated_at
    `)
    .eq("id", conversationId)
    .eq("talent_id", talent.id)
    .maybeSingle();

  if (conversationError) {
    throw new Error(
      `[TalentConversationPage conversation] ${conversationError.message}`,
    );
  }

  if (!conversationData) {
    redirect(
      `/${locale}/talent-dashboard/applications`,
    );
  }

  const conversation =
    conversationData as ConversationRecord;
    const isMlamhConversation =
    conversation.conversation_type === "mlamh_talent";
    if (!conversation.application_id) {
      redirect(
        `/${locale}/talent-dashboard/applications`,
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
        `[TalentConversationPage application] ${applicationError.message}`,
      );
    }
    
    if (
      !application ||
      application.status !== "accepted"
    ) {
      redirect(
        `/${locale}/talent-dashboard/applications`,
      );
    }
    
  const [
    messagesResult,
    attachmentsResult,
    opportunityResult,
    publisherResult,
  ] = await Promise.all([
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
      .eq(
        "conversation_id",
        conversation.id,
      )
      .order("created_at", {
        ascending: true,
      }),

    adminClient
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
      .eq(
        "conversation_id",
        conversation.id,
      )
      .order("created_at", {
        ascending: true,
      }),

    adminClient
      .from("opportunities")
      .select("id, title, slug")
      .eq(
        "id",
        conversation.opportunity_id,
      )
      .maybeSingle(),

      conversation.publisher_id !== null
      ? adminClient
          .from("publishers")
          .select(`
            id,
            company_name,
            contact_name,
            publisher_type,
            city,
            profile_image_url
          `)
          .eq("id", conversation.publisher_id)
          .maybeSingle()
      : Promise.resolve({
          data: null,
          error: null,
        }),
  ]);

  if (messagesResult.error) {
    throw new Error(
      `[TalentConversationPage messages] ${messagesResult.error.message}`,
    );
  }

  if (attachmentsResult.error) {
    throw new Error(
      `[TalentConversationPage attachments] ${attachmentsResult.error.message}`,
    );
  }

  if (opportunityResult.error) {
    throw new Error(
      `[TalentConversationPage opportunity] ${opportunityResult.error.message}`,
    );
  }

  if (publisherResult.error) {
    throw new Error(
      `[TalentConversationPage publisher] ${publisherResult.error.message}`,
    );
  }

  const rawMessages =
    (messagesResult.data ??
      []) as RawMessageRecord[];

  const rawAttachments =
    (attachmentsResult.data ??
      []) as AttachmentRecord[];

  const signedAttachments =
    await Promise.all(
      rawAttachments.map(
        async (
          attachment,
        ): Promise<MessageAttachment> => {
          const {
            data: signedUrlData,
            error: signedUrlError,
          } = await adminClient.storage
            .from("message-attachments")
            .createSignedUrl(
              attachment.storage_path,
              60 * 60,
            );

          if (signedUrlError) {
            console.error(
              "[TalentConversationPage signed URL]",
              {
                attachmentId:
                  attachment.id,
                storagePath:
                  attachment.storage_path,
                message:
                  signedUrlError.message,
              },
            );
          }

          return {
            ...attachment,
            signed_url:
              signedUrlData?.signedUrl ??
              null,
          };
        },
      ),
    );

  const attachmentsByMessage =
    new Map<string, MessageAttachment[]>();

  for (const attachment of signedAttachments) {
    const key = String(
      attachment.message_id,
    );

    const current =
      attachmentsByMessage.get(key) ?? [];

    current.push(attachment);
    attachmentsByMessage.set(
      key,
      current,
    );
  }

  const messages: MessageRecord[] =
    rawMessages.map((message) => ({
      ...message,
      body: message.body ?? "",
      attachments:
        attachmentsByMessage.get(
          String(message.id),
        ) ?? [],
    }));

  const opportunity =
    opportunityResult.data as
      | OpportunityRecord
      | null;

  const publisher =
    publisherResult.data as
      | PublisherRecord
      | null;

  await markConversationReadAction(
    conversation.id,
  );

  const publisherName =
  isMlamhConversation
    ? isArabic
      ? "ملامح"
      : "MLAMH"
    : publisher?.company_name ||
      publisher?.contact_name ||
      (isArabic ? "الناشر" : "Publisher");

      const publisherType =
      isMlamhConversation
        ? ""
        : publisher?.publisher_type ?? "";
    
    const publisherCity =
      isMlamhConversation
        ? ""
        : publisher?.city ?? "";

  const opportunityTitle =
    opportunity?.title ??
    (isArabic
      ? "فرصة بدون عنوان"
      : "Untitled Opportunity");

  const isActive =
    (conversation.status ?? "active") ===
    "active";

  const closedAtLabel =
    conversation.closed_at
      ? formatConversationDate(
          conversation.closed_at,
          locale,
        )
      : null;

      const publisherHref =
      !isMlamhConversation && publisher?.id
        ? `/${locale}/publishers/${publisher.id}`
        : null;

  const opportunityHref =
    opportunity?.slug
      ? `/${locale}/opportunities/${opportunity.slug}`
      : null;

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="h-[100dvh] overflow-hidden bg-background px-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-24 text-white sm:px-6 sm:pt-28 lg:pb-6"
    >
      <div className="mx-auto h-full max-w-7xl">
      <section className="flex h-full min-h-0 overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.025] shadow-2xl shadow-black/30">
      <div className="flex min-w-0 flex-1 flex-col">
            <header className="shrink-0 border-b border-white/10 bg-black/35 px-4 py-3 backdrop-blur-xl sm:px-5">
              <div className="flex items-center gap-3">
              <Link
  href={`/${locale}/talent-dashboard/messages`}
  aria-label={
    isArabic
      ? "العودة إلى الرسائل"
      : "Back to messages"
  }
  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/65 transition hover:border-gold/40 hover:text-gold"
>
  <ArrowLeft
    size={18}
    className={
      isArabic
        ? "rotate-180"
        : ""
    }
  />
</Link>

<div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-gold/25 bg-black">
  {isMlamhConversation ? (
    <Image
    src="/brand/mlamh-logo.png?v=2"
    alt={isArabic ? "ملامح" : "MLAMH"}
    fill
    sizes="44px"
    unoptimized
    className="object-cover"
  />
  ) : publisher?.profile_image_url ? (
    <Image
      src={publisher.profile_image_url}
      alt={publisherName}
      fill
      sizes="44px"
      className="object-cover"
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center font-medium text-gold">
      {publisherName.slice(0, 1)}
    </div>
  )}
</div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h1 className="truncate text-base font-medium sm:text-lg">
                      {publisherName}
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
                  {publisherHref ? (
                    <Link
                      href={publisherHref}
                      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-xs text-white/60 transition hover:border-gold/40 hover:text-gold"
                    >
                      <Building2 size={15} />

                      {isArabic
                        ? "عرض الشركة"
                        : "Company"}
                    </Link>
                  ) : null}

                  {opportunityHref ? (
                    <Link
                      href={opportunityHref}
                      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-xs text-white/60 transition hover:border-gold/40 hover:text-gold"
                    >
                      <BriefcaseBusiness
                        size={15}
                      />

                      {isArabic
                        ? "الفرصة"
                        : "Opportunity"}
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:hidden">
                {publisherHref ? (
                  <Link
                    href={publisherHref}
                    className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full border border-white/10 px-3 text-[11px] text-white/60"
                  >
                    <Building2 size={14} />

                    {isArabic
                      ? "الشركة"
                      : "Company"}
                  </Link>
                ) : null}

                {opportunityHref ? (
                  <Link
                    href={opportunityHref}
                    className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full border border-white/10 px-3 text-[11px] text-white/60"
                  >
                    <BriefcaseBusiness
                      size={14}
                    />

                    {isArabic
                      ? "تفاصيل الفرصة"
                      : "Opportunity"}
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
              conversationId={
                conversation.id
              }
              currentUserId={user.id}
              initialMessages={messages}
              locale={locale}
            />

            <footer className="shrink-0 border-t border-white/10 bg-black/45 backdrop-blur-xl">
              {isActive ? (
                <MessageComposer
                  conversationId={
                    conversation.id
                  }
                  currentUserId={user.id}
                  locale={locale}
                />
              ) : (
                <div className="px-4 py-4 sm:px-5">
                  <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] px-5 py-4 text-center">
                    <p className="text-sm text-amber-100/85">
                    {isArabic
  ? "تم إغلاق هذه المحادثة، ولا يمكن إرسال رسائل جديدة."
  : "This conversation has been closed and no new messages can be sent."}
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
              <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-full border border-gold/25 bg-black">
  {isMlamhConversation ? (
    <Image
    src="/brand/mlamh-logo.png?v=2"
    alt={isArabic ? "ملامح" : "MLAMH"}
    fill
    sizes="80px"
    unoptimized
    className="object-cover"
  />
  ) : publisher?.profile_image_url ? (
    <Image
      src={publisher.profile_image_url}
      alt={publisherName}
      fill
      sizes="80px"
      className="object-cover"
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center text-2xl text-gold">
      {publisherName.slice(0, 1)}
    </div>
  )}
</div>

                <h2 className="mt-4 truncate text-lg font-medium">
                  {publisherName}
                </h2>

                {publisherType ? (
                  <p className="mt-1 text-xs text-gold/70">
                    {publisherType}
                  </p>
                ) : null}

                {publisherCity ? (
                  <p className="mt-1 text-xs text-white/35">
                    {publisherCity}
                  </p>
                ) : null}
              </div>

              <div className="mt-6 space-y-3">
                <ContextItem
                  icon={
                    <BriefcaseBusiness
                      size={15}
                    />
                  }
                  label={
                    isArabic
                      ? "الفرصة"
                      : "Opportunity"
                  }
                  value={opportunityTitle}
                />

                <ContextItem
                  icon={
                    <MessageCircle size={15} />
                  }
                  label={
                    isArabic
                      ? "حالة التواصل"
                      : "Conversation"
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
                {publisherHref ? (
                  <Link
                    href={publisherHref}
                    className="flex min-h-11 items-center justify-center rounded-xl border border-white/10 text-sm text-white/65 transition hover:border-gold/40 hover:text-gold"
                  >
                    {isArabic
                      ? "فتح ملف الشركة"
                      : "Open company profile"}
                  </Link>
                ) : null}

                {opportunityHref ? (
                  <Link
                    href={opportunityHref}
                    className="flex min-h-11 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-sm text-gold transition hover:bg-gold hover:text-black"
                  >
                    {isArabic
                      ? "عرض تفاصيل الفرصة"
                      : "View opportunity"}
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