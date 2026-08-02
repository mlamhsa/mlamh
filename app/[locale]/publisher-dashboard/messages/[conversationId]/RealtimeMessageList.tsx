"use client";

import { useEffect, useRef, useState } from "react";

import {
  markConversationReadAction,
  reportMessageAction,
} from "@/lib/actions/message-actions";
import { supabase } from "@/lib/supabase/client";

type MessageRecord = {
  id: number | string;
  conversation_id: number;
  sender_user_id: string;
  body: string;
  read_at: string | null;
  reported_at: string | null;
  report_reason: string | null;
  created_at: string;
};

type RealtimeMessageListProps = {
  conversationId: number;
  currentUserId: string;
  initialMessages: MessageRecord[];
  locale: string;
};

function formatMessageDate(value: string, locale: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function sortMessages(messages: MessageRecord[]) {
  return [...messages].sort(
    (first, second) =>
      new Date(first.created_at).getTime() -
      new Date(second.created_at).getTime(),
  );
}

export default function RealtimeMessageList({
  conversationId,
  currentUserId,
  initialMessages,
  locale,
}: RealtimeMessageListProps) {
  const isArabic = locale === "ar";
  const [messages, setMessages] = useState<MessageRecord[]>(() =>
    sortMessages(initialMessages),
  );
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const incomingMessage = payload.new as MessageRecord;

          setMessages((currentMessages) => {
            const alreadyExists = currentMessages.some(
              (message) => String(message.id) === String(incomingMessage.id),
            );

            if (alreadyExists) {
              return currentMessages;
            }

            return sortMessages([...currentMessages, incomingMessage]);
          });

          if (incomingMessage.sender_user_id !== currentUserId) {
            void markConversationReadAction(conversationId);
          }
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
          const updatedMessage = payload.new as MessageRecord;

          setMessages((currentMessages) =>
            currentMessages.map((message) =>
              String(message.id) === String(updatedMessage.id)
                ? updatedMessage
                : message,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  return (
    <div className="min-h-[480px] space-y-4 p-4 sm:p-6">
      {messages.length > 0 ? (
        messages.map((message) => {
          const isOwnMessage = message.sender_user_id === currentUserId;

          return (
            <article
              key={message.id}
              className={`flex ${
                isOwnMessage
                  ? isArabic
                    ? "justify-start"
                    : "justify-end"
                  : isArabic
                    ? "justify-end"
                    : "justify-start"
              }`}
            >
              <div
                className={`max-w-[88%] rounded-3xl px-4 py-3 sm:max-w-[72%] ${
                  isOwnMessage
                    ? "rounded-br-md bg-gold text-black"
                    : "rounded-bl-md border border-white/10 bg-white/[0.055] text-white"
                }`}
              >
                <p className="whitespace-pre-wrap break-words text-sm leading-7">
                  {message.body}
                </p>

                <div
                  className={`mt-2 flex items-center gap-2 text-[10px] ${
                    isOwnMessage
                      ? "justify-end text-black/55"
                      : "justify-end text-white/30"
                  }`}
                >
                  <time>{formatMessageDate(message.created_at, locale)}</time>

                  {isOwnMessage ? (
                    <span
                      title={
                        message.read_at
                          ? isArabic
                            ? "تمت القراءة"
                            : "Read"
                          : isArabic
                            ? "تم الإرسال"
                            : "Sent"
                      }
                      aria-label={
                        message.read_at
                          ? isArabic
                            ? "تمت القراءة"
                            : "Read"
                          : isArabic
                            ? "تم الإرسال"
                            : "Sent"
                      }
                    >
                      {message.read_at ? "✓✓" : "✓"}
                    </span>
                  ) : null}
                </div>

                {!isOwnMessage ? (
                  <div className="mt-3 border-t border-white/10 pt-2">
                    {message.reported_at ? (
                      <p className="text-[10px] text-amber-200/70">
                        {isArabic
                          ? "تم الإبلاغ عن هذه الرسالة."
                          : "This message has been reported."}
                      </p>
                    ) : (
                      <details>
                        <summary className="cursor-pointer list-none text-[10px] text-white/30 transition hover:text-amber-200">
                          {isArabic
                            ? "الإبلاغ عن الرسالة"
                            : "Report message"}
                        </summary>

                        <form
                          action={reportMessageAction}
                          className="mt-3 space-y-2"
                        >
                          <input
                            type="hidden"
                            name="conversationId"
                            value={conversationId}
                          />
                          <input
                            type="hidden"
                            name="messageId"
                            value={String(message.id)}
                          />
                          <input
                            type="hidden"
                            name="locale"
                            value={locale}
                          />

                          <textarea
                            name="reportReason"
                            required
                            maxLength={500}
                            rows={2}
                            placeholder={
                              isArabic
                                ? "اكتب سبب البلاغ..."
                                : "Enter the report reason..."
                            }
                            className="w-full resize-none rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-white outline-none placeholder:text-white/20 focus:border-amber-200/40"
                          />

                          <button
                            type="submit"
                            className="rounded-full border border-amber-200/30 px-3 py-1.5 text-[10px] text-amber-200 transition hover:bg-amber-200 hover:text-black"
                          >
                            {isArabic ? "إرسال البلاغ" : "Submit report"}
                          </button>
                        </form>
                      </details>
                    )}
                  </div>
                ) : null}
              </div>
            </article>
          );
        })
      ) : (
        <div className="flex min-h-[420px] items-center justify-center text-center">
          <div className="max-w-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/25 bg-gold/[0.08] text-xl text-gold">
              ✉
            </div>

            <h2 className="mt-5 text-xl font-light">
              {isArabic ? "ابدأ المحادثة" : "Start the conversation"}
            </h2>

            <p className="mt-2 text-sm leading-7 text-white/40">
              {isArabic
                ? "أرسل رسالتك الأولى إلى الموهبة بخصوص هذه الفرصة."
                : "Send your first message to the talent about this opportunity."}
            </p>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
