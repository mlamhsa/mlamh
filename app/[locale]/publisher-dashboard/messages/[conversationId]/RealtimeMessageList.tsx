"use client";

import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MessageCircle } from "lucide-react";

import {
  markConversationReadAction,
} from "@/lib/actions/message-actions";
import { supabase } from "@/lib/supabase/client";
import DaySeparator from "@/components/messages/DaySeparator";
import MessageBubble, {
  type MessageAttachmentRecord,
} from "@/components/messages/MessageBubble";
import NewMessagesButton from "@/components/messages/NewMessagesButton";
import TypingIndicator from "@/components/messages/TypingIndicator";

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

type RealtimeMessageListProps = {
  conversationId: number;
  currentUserId: string;
  initialMessages: MessageRecord[];
  locale: string;
};

type AttachmentRow = Omit<
  MessageAttachmentRecord,
  "signed_url"
>;

const MESSAGE_ATTACHMENTS_BUCKET =
  "message-attachments";

function sortMessages(messages: MessageRecord[]) {
  return [...messages].sort(
    (first, second) =>
      new Date(first.created_at).getTime() -
      new Date(second.created_at).getTime(),
  );
}

function dayKey(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return [
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ].join("-");
}

function belongsToSameGroup(
  first: MessageRecord | undefined,
  second: MessageRecord | undefined,
) {
  if (!first || !second) {
    return false;
  }

  if (
    first.sender_user_id !==
    second.sender_user_id
  ) {
    return false;
  }

  if (
    dayKey(first.created_at) !==
    dayKey(second.created_at)
  ) {
    return false;
  }

  const firstTime = new Date(
    first.created_at,
  ).getTime();

  const secondTime = new Date(
    second.created_at,
  ).getTime();

  if (
    Number.isNaN(firstTime) ||
    Number.isNaN(secondTime)
  ) {
    return false;
  }

  const fiveMinutes = 5 * 60 * 1000;

  return (
    secondTime >= firstTime &&
    secondTime - firstTime <= fiveMinutes
  );
}

async function loadMessageAttachments(
  messageId: number | string,
): Promise<MessageAttachmentRecord[]> {
  const { data, error } = await supabase
    .from("message_attachments")
    .select(
      `
        id,
        message_id,
        conversation_id,
        uploader_user_id,
        storage_path,
        file_name,
        mime_type,
        size_bytes,
        created_at
      `,
    )
    .eq("message_id", messageId)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    console.error(
      "[RealtimeMessageList attachments]",
      error,
    );

    return [];
  }

  const rows = (data ?? []) as AttachmentRow[];

  return Promise.all(
    rows.map(async (attachment) => {
      const { data: signedData, error: signedError } =
        await supabase.storage
          .from(MESSAGE_ATTACHMENTS_BUCKET)
          .createSignedUrl(
            attachment.storage_path,
            60 * 60,
          );

      if (signedError) {
        console.error(
          "[RealtimeMessageList signedUrl]",
          signedError,
        );
      }

      return {
        ...attachment,
        signed_url:
          signedError
            ? null
            : signedData?.signedUrl ?? null,
      };
    }),
  );
}

export default function RealtimeMessageList({
  conversationId,
  currentUserId,
  initialMessages,
  locale,
}: RealtimeMessageListProps) {
  const isArabic = locale === "ar";

  const [messages, setMessages] =
    useState<MessageRecord[]>(() =>
      sortMessages(initialMessages),
    );

  const [
    isOtherUserTyping,
    setIsOtherUserTyping,
  ] = useState(false);

  const [newMessageCount, setNewMessageCount] =
    useState(0);

  const typingTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );

  const scrollContainerRef =
    useRef<HTMLDivElement | null>(null);

  const bottomRef =
    useRef<HTMLDivElement | null>(null);

  const initialScrollDone = useRef(false);
  const isNearBottomRef = useRef(true);
  const shouldAutoScrollRef = useRef(false);

  const groupedMessages = useMemo(
    () =>
      messages.map((message, index) => {
        const previous = messages[index - 1];
        const next = messages[index + 1];

        const showDay =
          !previous ||
          dayKey(previous.created_at) !==
            dayKey(message.created_at);

        const startsGroup =
          !belongsToSameGroup(
            previous,
            message,
          );

        const endsGroup =
          !belongsToSameGroup(
            message,
            next,
          );

        return {
          message,
          showDay,
          startsGroup,
          endsGroup,
        };
      }),
    [messages],
  );

  function scrollToBottom(
    behavior: ScrollBehavior = "smooth",
  ) {
    bottomRef.current?.scrollIntoView({
      behavior,
      block: "end",
    });

    isNearBottomRef.current = true;
    setNewMessageCount(0);
  }

  function handleScroll() {
    const container =
      scrollContainerRef.current;

    if (!container) {
      return;
    }

    const distanceFromBottom =
      container.scrollHeight -
      container.scrollTop -
      container.clientHeight;

    const isNearBottom =
      distanceFromBottom <= 120;

    isNearBottomRef.current = isNearBottom;

    if (isNearBottom) {
      setNewMessageCount(0);
    }
  }

  useEffect(() => {
    const typingChannel = supabase
      .channel(
        `conversation-typing-${conversationId}`,
      )
      .on(
        "broadcast",
        {
          event: "typing",
        },
        ({ payload }) => {
          const typingPayload = payload as {
            userId?: string;
            isTyping?: boolean;
          };

          if (
            !typingPayload.userId ||
            typingPayload.userId === currentUserId
          ) {
            return;
          }

          if (typingTimeoutRef.current) {
            clearTimeout(
              typingTimeoutRef.current,
            );
          }

          setIsOtherUserTyping(
            Boolean(typingPayload.isTyping),
          );

          if (typingPayload.isTyping) {
            typingTimeoutRef.current =
              setTimeout(() => {
                setIsOtherUserTyping(false);
              }, 1800);
          }
        },
      )
      .subscribe();

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(
          typingTimeoutRef.current,
        );
      }

      void supabase.removeChannel(
        typingChannel,
      );
    };
  }, [conversationId, currentUserId]);

  useEffect(() => {
    if (!initialScrollDone.current) {
      scrollToBottom("auto");
      initialScrollDone.current = true;
      return;
    }

    if (
      shouldAutoScrollRef.current ||
      (isOtherUserTyping &&
        isNearBottomRef.current)
    ) {
      scrollToBottom("smooth");
      shouldAutoScrollRef.current = false;
    }
  }, [messages, isOtherUserTyping]);

  useEffect(() => {
    const messagesChannel = supabase
      .channel(
        `publisher-conversation-${conversationId}`,
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const realtimeRow =
            payload.new as Omit<
              MessageRecord,
              "attachments"
            >;
        
          void (async () => {
            const attachments =
              await loadMessageAttachments(realtimeRow.id);
        
            const incomingMessage: MessageRecord = {
              ...realtimeRow,
              attachments,
            };
        
            const isOwnMessage =
              incomingMessage.sender_user_id ===
              currentUserId;
        
            const shouldAutoScroll =
              isOwnMessage ||
              isNearBottomRef.current;
        
            shouldAutoScrollRef.current =
              shouldAutoScroll;
        
            if (
              !isOwnMessage &&
              !shouldAutoScroll
            ) {
              setNewMessageCount(
                (currentCount) =>
                  currentCount + 1,
              );
            }
        
            setMessages((currentMessages) => {
              const existingMessage =
                currentMessages.find(
                  (message) =>
                    String(message.id) ===
                    String(incomingMessage.id),
                );
        
              if (existingMessage) {
                return currentMessages.map(
                  (message) =>
                    String(message.id) ===
                    String(incomingMessage.id)
                      ? {
                          ...message,
                          ...incomingMessage,
                          attachments:
                            incomingMessage.attachments
                              .length > 0
                              ? incomingMessage.attachments
                              : message.attachments ?? [],
                        }
                      : message,
                );
              }
        
              return sortMessages([
                ...currentMessages,
                incomingMessage,
              ]);
            });
        
            if (
              incomingMessage.sender_user_id !==
              currentUserId
            ) {
              void markConversationReadAction(
                conversationId,
              );
            }
          })();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updatedRow =
            payload.new as Omit<
              MessageRecord,
              "attachments"
            >;

          setMessages((currentMessages) =>
            currentMessages.map((message) =>
              String(message.id) ===
              String(updatedRow.id)
                ? {
                    ...message,
                    ...updatedRow,
                    attachments:
                      message.attachments ?? [],
                  }
                : message,
            ),
          );
        },
      )

      /*
       * الاستماع المباشر للمرفقات.
       * لا نعتمد على setTimeout لأن المرفق قد يُحفظ
       * بعد الرسالة بمدة تختلف حسب حجم الملف والرفع.
       */
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message_attachments",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const attachmentRow =
            payload.new as AttachmentRow;

          void (async () => {
            const { data: signedData, error } =
              await supabase.storage
                .from(MESSAGE_ATTACHMENTS_BUCKET)
                .createSignedUrl(
                  attachmentRow.storage_path,
                  60 * 60,
                );

            if (error) {
              console.error(
                "[RealtimeMessageList attachment realtime signedUrl]",
                error,
              );
            }

            const incomingAttachment: MessageAttachmentRecord =
              {
                ...attachmentRow,
                signed_url: error
                  ? null
                  : signedData?.signedUrl ?? null,
              };

            setMessages((currentMessages) =>
              currentMessages.map((message) => {
                if (
                  String(message.id) !==
                  String(attachmentRow.message_id)
                ) {
                  return message;
                }

                const currentAttachments =
                  message.attachments ?? [];

                const alreadyExists =
                  currentAttachments.some(
                    (attachment) =>
                      String(attachment.id) ===
                      String(incomingAttachment.id),
                  );

                if (alreadyExists) {
                  return message;
                }

                return {
                  ...message,
                  attachments: [
                    ...currentAttachments,
                    incomingAttachment,
                  ],
                };
              }),
            );

            shouldAutoScrollRef.current = true;
          })();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(
        messagesChannel,
      );
    };
  }, [conversationId, currentUserId]);

  return (
    <div className="relative h-full min-h-0">
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="h-full min-h-0 overflow-y-auto overscroll-contain bg-[radial-gradient(circle_at_top,rgba(201,169,98,0.05),transparent_34%)] px-3 py-5 sm:px-6 sm:py-7"
      >
        {messages.length > 0 ? (
          <div className="mx-auto flex min-h-full max-w-4xl flex-col justify-end">
            {groupedMessages.map(
              ({
                message,
                showDay,
                startsGroup,
                endsGroup,
              }) => (
                <Fragment key={message.id}>
                  {showDay ? (
                    <DaySeparator
                      value={
                        message.created_at
                      }
                      locale={locale}
                    />
                  ) : null}

                  <MessageBubble
                    message={message}
                    conversationId={
                      conversationId
                    }
                    currentUserId={
                      currentUserId
                    }
                    locale={locale}
                    startsGroup={startsGroup}
                    endsGroup={endsGroup}
                  />
                </Fragment>
              ),
            )}

            {isOtherUserTyping ? (
              <TypingIndicator
                locale={locale}
              />
            ) : null}

            <div
              ref={bottomRef}
              className="h-1"
            />
          </div>
        ) : (
          <div className="flex h-full min-h-[300px] items-center justify-center px-4 text-center">
            <div className="max-w-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/25 bg-gold/[0.08] text-gold">
                <MessageCircle size={22} />
              </div>

              <h2 className="mt-5 text-xl font-light">
                {isArabic
                  ? "ابدأ المحادثة"
                  : "Start the conversation"}
              </h2>

              <p className="mt-2 text-sm leading-7 text-white/40">
                {isArabic
                  ? "أرسل تفاصيل الخطوة التالية أو موعد المقابلة للموهبة."
                  : "Send the talent the next step or interview details."}
              </p>
            </div>
          </div>
        )}
      </div>

      {newMessageCount > 0 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-4">
          <div className="pointer-events-auto">
            <NewMessagesButton
              count={newMessageCount}
              locale={locale}
              onClick={() =>
                scrollToBottom("smooth")
              }
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}