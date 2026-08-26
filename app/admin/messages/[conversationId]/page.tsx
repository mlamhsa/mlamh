import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  FileText,
  Flag,
  MessageCircle,
  UserRound,
} from "lucide-react";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { reviewReportedMessageAction } from "@/lib/actions/admin-message-actions";
import {
  closeConversationAction,
  markConversationReadAction,
  sendMessageAction,
} from "@/lib/actions/message-actions";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  params: Promise<{
    conversationId: string;
  }>;
};

type ConversationRecord = {
  id: number;
  application_id: number | null;
  opportunity_id: number;
  publisher_id: number | null;
  talent_id: number;
  admin_user_id: string | null;
  conversation_type:
    | "publisher_talent"
    | "mlamh_talent"
    | string
    | null;
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

type RawAttachment = Omit<
  MessageAttachment,
  "signed_url"
>;

type MessageRecord = {
  id: number | string;
  conversation_id: number;
  sender_user_id: string;
  body: string;
  read_at: string | null;

  reported_at: string | null;
  report_reason: string | null;

  report_reviewed_at: string | null;
  report_reviewed_by: string | null;
  report_admin_note: string | null;

  created_at: string;
  attachments: MessageAttachment[];
};

type RawMessageRecord = Omit<
  MessageRecord,
  "attachments"
>;

type TalentRecord = {
  id: number;
  user_id: string | null;
  slug: string | null;
  name_ar: string | null;
  name_en: string | null;
  image_url: string | null;
  category_ar: string | null;
  category_en: string | null;
  city_ar: string | null;
  city_en: string | null;
};

type PublisherRecord = {
  id: number;
  profile_id: number;
  company_name: string | null;
  contact_name: string | null;
  publisher_type: string | null;
  city: string | null;
  profile_image_url: string | null;
};

type ProfileRecord = {
  id: number;
  user_id: string;
};

type OpportunityRecord = {
  id: number;
  title: string | null;
  slug: string | null;
};

function formatDate(
  value?: string | null,
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "ar-SA",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

function formatFileSize(
  bytes: number,
) {
  if (!bytes) {
    return "0 KB";
  }

  if (bytes < 1024 * 1024) {
    return `${Math.max(
      1,
      Math.round(bytes / 1024),
    )} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

export default async function AdminConversationPage({
  params,
}: PageProps) {
  const adminUser =
  await requireAdminAccess();

  const {
    conversationId:
      rawConversationId,
  } = await params;

  const conversationId =
    Number(rawConversationId);

  if (
    !Number.isInteger(
      conversationId,
    ) ||
    conversationId <= 0
  ) {
    notFound();
  }

  const adminClient =
    createAdminClient();

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
      admin_user_id,
      conversation_type,
      status,
      closed_at,
      updated_at
    `)
    .eq(
      "id",
      conversationId,
    )
    .maybeSingle();

  if (conversationError) {
    throw new Error(
      `[AdminConversationPage conversation] ${conversationError.message}`,
    );
  }

  if (!conversationData) {
    notFound();
  }

  const conversation =
    conversationData as ConversationRecord;
    const isMlamhConversation =
    conversation.conversation_type ===
    "mlamh_talent";
  
  const isAssignedMlamhAdmin =
    isMlamhConversation &&
    conversation.admin_user_id ===
      adminUser.id;
  
  const canAdminSend =
    isAssignedMlamhAdmin &&
    (conversation.status ?? "active") ===
      "active";
      if (isAssignedMlamhAdmin) {
        await markConversationReadAction(
          conversation.id,
        );
      }
      
  const [
    messagesResult,
    attachmentsResult,
    talentResult,
    publisherResult,
    opportunityResult,
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
    report_reviewed_at,
    report_reviewed_by,
    report_admin_note,
    created_at
  `)
      .eq(
        "conversation_id",
        conversation.id,
      )
      .order(
        "created_at",
        {
          ascending: true,
        },
      ),

    adminClient
      .from(
        "message_attachments",
      )
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
      .order(
        "created_at",
        {
          ascending: true,
        },
      ),

    adminClient
      .from("talents")
      .select(`
        id,
        user_id,
        slug,
        name_ar,
        name_en,
        image_url,
        category_ar,
        category_en,
        city_ar,
        city_en
      `)
      .eq(
        "id",
        conversation.talent_id,
      )
      .maybeSingle(),

    conversation.publisher_id
  ? adminClient
      .from("publishers")
      .select(`
        id,
        profile_id,
        company_name,
        contact_name,
        publisher_type,
        city,
        profile_image_url
      `)
      .eq(
        "id",
        conversation.publisher_id,
      )
      .maybeSingle()
  : Promise.resolve({
      data: null,
      error: null,
    }),

    adminClient
      .from("opportunities")
      .select(`
        id,
        title,
        slug
      `)
      .eq(
        "id",
        conversation.opportunity_id,
      )
      .maybeSingle(),
  ]);

  if (messagesResult.error) {
    throw new Error(
      `[AdminConversationPage messages] ${messagesResult.error.message}`,
    );
  }

  if (attachmentsResult.error) {
    throw new Error(
      `[AdminConversationPage attachments] ${attachmentsResult.error.message}`,
    );
  }

  if (talentResult.error) {
    throw new Error(
      `[AdminConversationPage talent] ${talentResult.error.message}`,
    );
  }

  if (publisherResult.error) {
    throw new Error(
      `[AdminConversationPage publisher] ${publisherResult.error.message}`,
    );
  }

  if (opportunityResult.error) {
    throw new Error(
      `[AdminConversationPage opportunity] ${opportunityResult.error.message}`,
    );
  }

  const talent =
    talentResult.data as TalentRecord | null;

  const publisher =
    publisherResult.data as PublisherRecord | null;

  const opportunity =
    opportunityResult.data as OpportunityRecord | null;

  /*
   * نحتاج user_id للناشر حتى نعرف
   * مرسل كل رسالة.
   */
  let publisherUserId:
    | string
    | null = null;

  if (publisher?.profile_id) {
    const {
      data: profileData,
      error: profileError,
    } = await adminClient
      .from("profiles")
      .select("id, user_id")
      .eq(
        "id",
        publisher.profile_id,
      )
      .maybeSingle();

    if (profileError) {
      throw new Error(
        `[AdminConversationPage publisher profile] ${profileError.message}`,
      );
    }

    publisherUserId =
      (
        profileData as ProfileRecord | null
      )?.user_id ?? null;
  }

  const rawMessages =
    (messagesResult.data ??
      []) as RawMessageRecord[];

  const rawAttachments =
    (attachmentsResult.data ??
      []) as RawAttachment[];

  /*
   * توليد روابط مؤقتة للمرفقات.
   */
  const signedAttachments =
    await Promise.all(
      rawAttachments.map(
        async (
          attachment,
        ): Promise<MessageAttachment> => {
          const {
            data:
              signedUrlData,
            error:
              signedUrlError,
          } =
            await adminClient.storage
              .from(
                "message-attachments",
              )
              .createSignedUrl(
                attachment.storage_path,
                60 * 60,
              );

          if (signedUrlError) {
            console.error(
              "[AdminConversationPage signed URL]",
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
    new Map<
      string,
      MessageAttachment[]
    >();

  for (
    const attachment of
      signedAttachments
  ) {
    const key =
      String(
        attachment.message_id,
      );

    const current =
      attachmentsByMessage.get(
        key,
      ) ?? [];

    current.push(
      attachment,
    );

    attachmentsByMessage.set(
      key,
      current,
    );
  }

  const messages: MessageRecord[] =
    rawMessages.map(
      (message) => ({
        ...message,

        body:
          message.body ?? "",

        attachments:
          attachmentsByMessage.get(
            String(
              message.id,
            ),
          ) ?? [],
      }),
    );

  const talentName =
    talent?.name_ar ||
    talent?.name_en ||
    "موهبة غير معروفة";

    const publisherName =
    isMlamhConversation
      ? "ملامح"
      : publisher?.company_name ||
        publisher?.contact_name ||
        "ناشر غير معروف";

  const opportunityTitle =
    opportunity?.title ||
    "فرصة بدون عنوان";

  const isActive =
    (
      conversation.status ??
      "active"
    ) === "active";

    const reportedMessages =
    messages.filter(
      (message) =>
        Boolean(message.reported_at) &&
        !message.report_reviewed_at,
    );

    function getSender(
      senderUserId: string,
    ) {
      if (
        talent?.user_id &&
        senderUserId === talent.user_id
      ) {
        return {
          type: "talent" as const,
          label: talentName,
        };
      }
    
      if (
        isMlamhConversation &&
        conversation.admin_user_id &&
        senderUserId ===
          conversation.admin_user_id
      ) {
        return {
          type: "mlamh" as const,
          label: "ملامح",
        };
      }
    
      if (
        publisherUserId &&
        senderUserId === publisherUserId
      ) {
        return {
          type: "publisher" as const,
          label: publisherName,
        };
      }
    
      return {
        type: "unknown" as const,
        label: "مستخدم غير معروف",
      };
    }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#050505] text-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <Link
            href="/admin/messages"
            className="inline-flex items-center gap-2 text-sm text-gold transition hover:text-white"
          >
            <ArrowLeft
              size={16}
              className="rotate-180"
            />

            العودة إلى المحادثات
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <main className="min-w-0">
            <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02]">
              <header className="border-b border-white/[0.08] bg-black/30 px-5 py-5">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${
                          isActive
                            ? "border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-300"
                            : "border-amber-400/25 bg-amber-400/[0.08] text-amber-300"
                        }`}
                      >
                        {isActive
                          ? "محادثة نشطة"
                          : "محادثة مغلقة"}
                      </span>

                      <span className="text-[10px] uppercase tracking-[0.25em] text-white/30">
                        Conversation #
                        {conversation.id}
                      </span>
                    </div>

                    <h1 className="mt-4 text-2xl font-light sm:text-3xl">
                      {publisherName}
                      <span className="mx-2 text-white/25">
                        ×
                      </span>
                      {talentName}
                    </h1>

                    <p className="mt-2 text-sm text-gold/70">
                      {opportunityTitle}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <div className="rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3 text-center">
                      <p className="text-[9px] uppercase tracking-[0.2em] text-white/30">
                        الرسائل
                      </p>

                      <p className="mt-1 text-xl">
                        {
                          messages.length
                        }
                      </p>
                    </div>

                    <a
  href="#reported-messages"
  className="rounded-xl border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-center transition hover:border-red-400/40 hover:bg-red-400/[0.1]"
>
  <p className="text-[9px] uppercase tracking-[0.2em] text-red-300/70">
    البلاغات
  </p>

  <p className="mt-1 text-xl text-red-300">
    {reportedMessages.length}
  </p>

  {reportedMessages.length > 0 ? (
    <p className="mt-1 text-[9px] text-red-200/50">
      عرض البلاغات
    </p>
  ) : null}
</a>
                  </div>
                  {isAssignedMlamhAdmin &&
                  isActive ? (
                    <form
                      action={closeConversationAction}
                      className="sm:mr-auto"
                    >
                      <input
                        type="hidden"
                        name="conversationId"
                        value={conversation.id}
                      />

                      <input
                        type="hidden"
                        name="locale"
                        value="ar"
                      />

                      <button
                        type="submit"
                        className="rounded-full border border-red-400/25 bg-red-400/[0.05] px-5 py-2.5 text-xs text-red-300 transition hover:border-red-400/40 hover:bg-red-400/[0.1]"
                      >
                        إغلاق المحادثة
                      </button>
                    </form>
                  ) : null}
                </div>
              </header>

              {reportedMessages.length > 0 ? (
  <section
    id="reported-messages"
    className="border-b border-red-400/15 bg-red-400/[0.025] px-4 py-5 sm:px-6"
  >
    <div className="mb-4 flex items-center justify-between gap-3">
      <div>
        <div className="flex items-center gap-2 text-red-300">
          <Flag size={16} />

          <h2 className="text-sm font-medium">
            البلاغات المفتوحة
          </h2>
        </div>

        <p className="mt-1 text-xs text-white/35">
          راجع الرسائل المبلّغ عنها واتخذ الإجراء المناسب.
        </p>
      </div>

      <span className="rounded-full border border-red-400/20 bg-red-400/[0.08] px-3 py-1 text-xs text-red-300">
        {reportedMessages.length}
      </span>
    </div>

    <div className="space-y-4">
      {reportedMessages.map((message) => {
        const sender =
          getSender(message.sender_user_id);

        return (
          <div
            key={`report-${message.id}`}
            className="rounded-2xl border border-red-400/20 bg-black/30 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-red-300">
                  رسالة مبلّغ عنها
                </p>

                <p className="mt-1 text-[11px] text-white/35">
                  المرسل: {sender.label}
                </p>
              </div>

              <time className="text-[10px] text-white/30">
                {formatDate(message.reported_at)}
              </time>
            </div>

            <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
              <p className="whitespace-pre-wrap break-words text-sm leading-7 text-white/75">
                {message.body || "رسالة بدون نص"}
              </p>
            </div>

            {message.report_reason ? (
              <div className="mt-3 rounded-xl border border-red-400/15 bg-red-400/[0.05] p-3">
                <p className="text-[10px] text-red-300/70">
                  سبب البلاغ
                </p>

                <p className="mt-2 text-sm leading-6 text-red-100/80">
                  {message.report_reason}
                </p>
                </div>
            ) : null}

            <form
              action={reviewReportedMessageAction}
              className="mt-4"
            >
              <input
                type="hidden"
                name="message_id"
                value={message.id}
              />

<input
  type="hidden"
  name="conversationId"
  value={conversation.id}
/>

              <label className="mb-2 block text-xs text-white/45">
                ملاحظة الإدارة
              </label>

              <textarea
                name="admin_note"
                rows={2}
                maxLength={1000}
                placeholder="ملاحظة داخلية اختيارية..."
                className="w-full resize-none rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-gold/30"
              />

              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="rounded-full border border-emerald-400/30 bg-emerald-400/[0.07] px-5 py-2.5 text-xs text-emerald-300 transition hover:bg-emerald-400/15"
                >
                  تمت المراجعة
                </button>

                <a
                  href={`#message-${message.id}`}
                  className="rounded-full border border-white/10 px-5 py-2.5 text-xs text-white/55 transition hover:border-gold/30 hover:text-gold"
                >
                  عرض مكان الرسالة
                </a>
              </div>
            </form>
          </div>
        );
      })}
    </div>
  </section>
) : null}

              <div className="max-h-[70vh] overflow-y-auto px-4 py-6 sm:px-6">
                {messages.length >
                0 ? (
                  <div className="space-y-5">
                    {messages.map(
                      (
                        message,
                      ) => {
                        const sender =
                          getSender(
                            message.sender_user_id,
                          );

                        const isTalent =
                          sender.type ===
                          "talent";

                        return (
                          <div
  id={`message-${message.id}`}
  key={message.id}
  className={`scroll-mt-32 flex ${
                              isTalent
                                ? "justify-start"
                                : "justify-end"
                            }`}
                          >
                            <div className="max-w-[85%] sm:max-w-[70%]">
                              <div className="mb-2 flex items-center gap-2 text-[10px] text-white/35">
                                <span>
                                  {
                                    sender.label
                                  }
                                </span>

                                <span>
                                  •
                                </span>

                                <time>
                                  {formatDate(
                                    message.created_at,
                                  )}
                                </time>
                              </div>

                              <div
                                className={`rounded-2xl border px-4 py-3 ${
                                  message.reported_at
                                    ? "border-red-400/30 bg-red-400/[0.06]"
                                    : isTalent
                                      ? "border-white/[0.08] bg-white/[0.04]"
                                      : "border-gold/20 bg-gold/[0.06]"
                                }`}
                              >
                                {message.body ? (
                                  <p className="whitespace-pre-wrap break-words text-sm leading-7 text-white/80">
                                    {
                                      message.body
                                    }
                                  </p>
                                ) : null}

                                {message.attachments.length >
                                0 ? (
                                  <div className="mt-3 space-y-2">
                                    {message.attachments.map(
                                      (
                                        attachment,
                                      ) => (
                                        <div
                                          key={
                                            attachment.id
                                          }
                                          className="rounded-xl border border-white/[0.08] bg-black/20 p-3"
                                        >
                                          <div className="flex items-center gap-3">
                                            <FileText
                                              size={
                                                18
                                              }
                                              className="shrink-0 text-gold"
                                            />

                                            <div className="min-w-0 flex-1">
                                              <p className="truncate text-xs text-white/70">
                                                {
                                                  attachment.file_name
                                                }
                                              </p>

                                              <p className="mt-1 text-[10px] text-white/30">
                                                {formatFileSize(
                                                  attachment.size_bytes,
                                                )}
                                              </p>
                                            </div>

                                            {attachment.signed_url ? (
                                              <a
                                                href={
                                                  attachment.signed_url
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="shrink-0 text-xs text-gold hover:underline"
                                              >
                                                فتح
                                              </a>
                                            ) : null}
                                          </div>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                ) : null}

{message.reported_at ? (
  <div className="mt-3 border-t border-red-400/20 pt-3">
    <div className="flex items-center gap-2 text-xs text-red-300">
      <Flag size={14} />

      تم الإبلاغ عن هذه الرسالة
    </div>

    <p className="mt-2 text-[11px] text-white/35">
      تاريخ البلاغ: {formatDate(message.reported_at)}
    </p>

    {message.report_reason ? (
      <p className="mt-2 text-xs leading-6 text-red-200/70">
        السبب: {message.report_reason}
      </p>
    ) : null}

    {message.report_reviewed_at ? (
      <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-3">
        <p className="text-xs text-emerald-300">
          تمت مراجعة البلاغ
        </p>

        <p className="mt-1 text-[11px] text-white/35">
          {formatDate(message.report_reviewed_at)}
        </p>

        {message.report_admin_note ? (
          <p className="mt-2 text-xs leading-6 text-white/55">
            ملاحظة الإدارة: {message.report_admin_note}
          </p>
        ) : null}
      </div>
    ) : (
      <form
        action={reviewReportedMessageAction}
        className="mt-4 rounded-xl border border-white/[0.08] bg-black/20 p-3"
      >
        <input
          type="hidden"
          name="message_id"
          value={message.id}
        />

        <input
          type="hidden"
          name="conversation_id"
          value={conversation.id}
        />

        <label className="mb-2 block text-[11px] text-white/45">
          ملاحظة الإدارة
        </label>

        <textarea
          name="admin_note"
          rows={2}
          maxLength={1000}
          placeholder="ملاحظة داخلية اختيارية..."
          className="w-full resize-none rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2 text-xs text-white outline-none placeholder:text-white/25 focus:border-gold/30"
        />

        <button
          type="submit"
          className="mt-3 rounded-full border border-emerald-400/30 bg-emerald-400/[0.06] px-4 py-2 text-[10px] text-emerald-300 transition hover:bg-emerald-400/10"
        >
          تمت المراجعة
        </button>
      </form>
    )}
  </div>
) : null}
                              </div>

                              <p className="mt-1 text-[9px] text-white/25">
                                {message.read_at
                                  ? "مقروءة"
                                  : "غير مقروءة"}
                              </p>
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                ) : (
                  <div className="flex min-h-[400px] items-center justify-center text-center">
                    <div>
                      <MessageCircle
                        size={32}
                        className="mx-auto text-white/20"
                      />

                      <p className="mt-4 text-sm text-white/40">
                        لا توجد رسائل في هذه المحادثة.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <footer className="border-t border-white/[0.08] bg-black/25 px-5 py-4">
  {canAdminSend ? (
    <form
      action={sendMessageAction}
      className="space-y-3"
    >
      <input
        type="hidden"
        name="conversation_id"
        value={conversation.id}
      />

      <input
        type="hidden"
        name="locale"
        value="ar"
      />

      <textarea
        name="body"
        rows={3}
        maxLength={3000}
        required
        placeholder="اكتب رسالة إلى الموهبة..."
        className="w-full resize-none rounded-2xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm leading-7 text-white outline-none placeholder:text-white/25 focus:border-gold/40"
      />

      <div className="flex items-center justify-between gap-4">
        <p className="text-[10px] text-white/30">
          سيتم إرسال الرسالة باسم ملامح
        </p>

        <button
          type="submit"
          className="rounded-full border border-gold/30 bg-gold/[0.08] px-6 py-2.5 text-xs text-gold transition hover:bg-gold hover:text-black"
        >
          إرسال الرسالة
        </button>
      </div>
    </form>
  ) : isMlamhConversation ? (
    <p className="text-center text-xs text-white/35">
      هذه المحادثة مرتبطة بمدير نظام آخر أو أنها مغلقة.
    </p>
  ) : (
    <p className="text-center text-xs text-white/35">
      وضع مراقبة الإدارة — لا يمكن إرسال رسائل من هذه الصفحة.
    </p>
  )}
</footer>
            </section>
          </main>

          <aside className="space-y-5">
            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-gold">
                أطراف المحادثة
              </p>

              <div className="mt-5 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/[0.04]">
                  {!isMlamhConversation &&
publisher?.profile_image_url ? (
  <Image
    src={publisher.profile_image_url}
    alt={publisherName}
    fill
    sizes="48px"
    className="object-cover"
  />
) : (
  <div className="flex h-full w-full items-center justify-center text-gold">
    {isMlamhConversation ? (
      <MessageCircle size={18} />
    ) : (
      <Building2 size={18} />
    )}
  </div>
)}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm text-white/80">
                      {
                        publisherName
                      }
                    </p>

                    <p className="mt-1 text-xs text-white/35">
  {isMlamhConversation
    ? "فريق ملامح"
    : "الناشر"}
</p>
                  </div>
                </div>

                <div className="border-t border-white/[0.06]" />

                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/[0.04]">
                    {talent?.image_url ? (
                      <Image
                        src={
                          talent.image_url
                        }
                        alt={
                          talentName
                        }
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gold">
                        <UserRound
                          size={
                            18
                          }
                        />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm text-white/80">
                      {
                        talentName
                      }
                    </p>

                    <p className="mt-1 text-xs text-white/35">
                      الموهبة
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-gold">
                السياق
              </p>

              <div className="mt-4 space-y-3">
                <ContextItem
                  icon={
                    <BriefcaseBusiness
                      size={
                        15
                      }
                    />
                  }
                  label="الفرصة"
                  value={
                    opportunityTitle
                  }
                />

                <ContextItem
                  icon={
                    <MessageCircle
                      size={
                        15
                      }
                    />
                  }
                  label="الحالة"
                  value={
                    isActive
                      ? "نشطة"
                      : "مغلقة"
                  }
                />

                <ContextItem
                  icon={
                    <Flag
                      size={
                        15
                      }
                    />
                  }
                  label="الرسائل المبلّغ عنها"
                  value={String(
                    reportedMessages.length,
                  )}
                />
              </div>

              {conversation.closed_at ? (
                <p className="mt-4 text-xs leading-6 text-white/35">
                  أُغلقت المحادثة:{" "}
                  {formatDate(
                    conversation.closed_at,
                  )}
                </p>
              ) : null}
            </section>

            <section className="space-y-2">
              {talent?.slug ? (
                <Link
                  href={`/ar/talent/${talent.slug}`}
                  target="_blank"
                  className="flex min-h-11 items-center justify-center rounded-xl border border-white/10 text-sm text-white/60 transition hover:border-gold/40 hover:text-gold"
                >
                  فتح ملف الموهبة
                </Link>
              ) : null}

              {opportunity?.slug ? (
                <Link
                  href={`/ar/opportunities/${opportunity.slug}`}
                  target="_blank"
                  className="flex min-h-11 items-center justify-center rounded-xl border border-gold/25 bg-gold/[0.06] text-sm text-gold transition hover:bg-gold hover:text-black"
                >
                  عرض الفرصة
                </Link>
              ) : null}
            </section>
          </aside>
        </div>
      </div>
    </div>
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
    <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
      <div className="flex items-center gap-2 text-gold/70">
        {icon}

        <p className="text-[10px] uppercase tracking-[0.16em]">
          {label}
        </p>
      </div>

      <p className="mt-2 text-sm leading-6 text-white/65">
        {value}
      </p>
    </div>
  );
}