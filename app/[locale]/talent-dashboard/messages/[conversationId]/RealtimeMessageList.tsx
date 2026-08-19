"use client";

import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MessageCircle } from "lucide-react";

import DaySeparator from "@/components/messages/DaySeparator";
import MessageBubble from "@/components/messages/MessageBubble";
import NewMessagesButton from "@/components/messages/NewMessagesButton";
import TypingIndicator from "@/components/messages/TypingIndicator";
import {
  markConversationReadAction,
} from "@/lib/actions/message-actions";
import { supabase } from "@/lib/supabase/client";

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

type RealtimeMessageListProps = {
  conversationId: number;
  currentUserId: string;
  initialMessages: MessageRecord[];
  locale: string;
};

type IncomingMessageRecord = Omit<
  MessageRecord,
  "attachments"
>;

type IncomingAttachmentRecord = Omit<
  MessageAttachment,
  "signed_url"
>;

function sortMessages(
  messages: MessageRecord[],
) {
  return [...messages].sort(
    (first, second) =>
      new Date(first.created_at).getTime() -
      new Date(second.created_at).getTime(),
  );
}

function sortAttachments(
  attachments: MessageAttachment[],
) {
  return [...attachments].sort(
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

  const [
    newMessageCount,
    setNewMessageCount,
  ] = useState(0);

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

    isNearBottomRef.current =
      isNearBottom;

    if (isNearBottom) {
      setNewMessageCount(0);
    }
  }

  useEffect(() => {
    setMessages(
      sortMessages(initialMessages),
    );
  }, [initialMessages]);

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
          const typingPayload =
            payload as {
              userId?: string;
              isTyping?: boolean;
            };

          if (
            !typingPayload.userId ||
            typingPayload.userId ===
              currentUserId
          ) {
            return;
          }

          if (typingTimeoutRef.current) {
            clearTimeout(
              typingTimeoutRef.current,
            );
          }

          setIsOtherUserTyping(
            Boolean(
              typingPayload.isTyping,
            ),
          );

          if (typingPayload.isTyping) {
            typingTimeoutRef.current =
              setTimeout(() => {
                setIsOtherUserTyping(
                  false,
                );
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
      shouldAutoScrollRef.current =
        false;
    }
  }, [messages, isOtherUserTyping]);

  useEffect(() => {
    const realtimeChannel = supabase
      .channel(
        `talent-conversation-${conversationId}`,
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter:
            `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const incomingData =
            payload.new as IncomingMessageRecord;

          const incomingMessage: MessageRecord =
            {
              ...incomingData,
              body:
                incomingData.body ?? "",
              attachments: [],
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

          setMessages(
            (currentMessages) => {
              const alreadyExists =
                currentMessages.some(
                  (message) =>
                    String(message.id) ===
                    String(
                      incomingMessage.id,
                    ),
                );

              if (alreadyExists) {
                return currentMessages;
              }

              return sortMessages([
                ...currentMessages,
                incomingMessage,
              ]);
            },
          );

          if (!isOwnMessage) {
            void markConversationReadAction(
              conversationId,
            );
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter:
            `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updatedData =
            payload.new as IncomingMessageRecord;

          setMessages(
            (currentMessages) =>
              currentMessages.map(
                (message) =>
                  String(message.id) ===
                  String(updatedData.id)
                    ? {
                        ...updatedData,
                        body:
                          updatedData.body ??
                          "",
                        attachments:
                          message.attachments,
                      }
                    : message,
              ),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table:
            "message_attachments",
          filter:
            `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const incomingAttachment =
            payload.new as IncomingAttachmentRecord;

          const {
            data: signedUrlData,
            error: signedUrlError,
          } = await supabase.storage
            .from("message-attachments")
            .createSignedUrl(
              incomingAttachment.storage_path,
              60 * 60,
            );

          if (signedUrlError) {
            console.error(
              "[RealtimeMessageList attachment signed URL]",
              signedUrlError.message,
            );
          }

          const attachment: MessageAttachment =
            {
              ...incomingAttachment,
              signed_url:
                signedUrlData?.signedUrl ??
                null,
            };

          const isOwnAttachment =
            attachment.uploader_user_id ===
            currentUserId;

          shouldAutoScrollRef.current =
            isOwnAttachment ||
            isNearBottomRef.current;

          setMessages(
            (currentMessages) =>
              currentMessages.map(
                (message) => {
                  if (
                    String(message.id) !==
                    String(
                      attachment.message_id,
                    )
                  ) {
                    return message;
                  }

                  const alreadyExists =
                    message.attachments.some(
                      (
                        currentAttachment,
                      ) =>
                        String(
                          currentAttachment.id,
                        ) ===
                        String(
                          attachment.id,
                        ),
                    );

                  if (alreadyExists) {
                    return message;
                  }

                  return {
                    ...message,
                    attachments:
                      sortAttachments([
                        ...message.attachments,
                        attachment,
                      ]),
                  };
                },
              ),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table:
            "message_attachments",
          filter:
            `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const deletedAttachment =
            payload.old as {
              id?: number;
              message_id?: number;
            };

          if (
            deletedAttachment.id ===
            undefined
          ) {
            return;
          }

          setMessages(
            (currentMessages) =>
              currentMessages.map(
                (message) => ({
                  ...message,
                  attachments:
                    message.attachments.filter(
                      (attachment) =>
                        String(
                          attachment.id,
                        ) !==
                        String(
                          deletedAttachment.id,
                        ),
                    ),
                }),
              ),
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(
        realtimeChannel,
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
                <Fragment
                  key={message.id}
                >
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
                    startsGroup={
                      startsGroup
                    }
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
                <MessageCircle
                  size={22}
                />
              </div>

              <h2 className="mt-5 text-xl font-light">
                {isArabic
                  ? "ابدأ المحادثة"
                  : "Start the conversation"}
              </h2>

              <p className="mt-2 text-sm leading-7 text-white/40">
                {isArabic
                  ? "ابدأ التواصل مع الشركة حول الفرصة والخطوات التالية."
                  : "Start communicating with the company about the opportunity and next steps."}
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
                scrollToBottom(
                  "smooth",
                )
              }
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}