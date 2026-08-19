"use client";

import Image from "next/image";
import {
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  Download,
  FileText,
  Flag,
  ImageIcon,
  X,
} from "lucide-react";

import MessageStatus from "@/components/messages/MessageStatus";
import VoiceMessagePlayer from "@/components/messages/VoiceMessagePlayer";
import {
  reportMessageAction,
} from "@/lib/actions/message-actions";

export type MessageAttachmentRecord = {
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

export type MessageBubbleRecord = {
  id: number | string;
  sender_user_id: string;
  body: string;
  read_at: string | null;
  reported_at: string | null;
  report_reason: string | null;
  created_at: string;
  attachments: MessageAttachmentRecord[];
};

type MessageBubbleProps = {
  message: MessageBubbleRecord;
  conversationId: number;
  currentUserId: string;
  locale: string;
  startsGroup: boolean;
  endsGroup: boolean;
};

const MESSAGE_TIME_ZONE =
  "Asia/Riyadh";

const ARABIC_DIGITS: Record<
  string,
  string
> = {
  "0": "٠",
  "1": "١",
  "2": "٢",
  "3": "٣",
  "4": "٤",
  "5": "٥",
  "6": "٦",
  "7": "٧",
  "8": "٨",
  "9": "٩",
};

function toArabicDigits(
  value: string,
) {
  return value.replace(
    /\d/g,
    (digit) =>
      ARABIC_DIGITS[digit] ??
      digit,
  );
}

function formatTime(
  value: string,
  locale: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  /*
   * نستخدم locale إنجليزي فقط
   * لاستخراج الساعة والدقيقة.
   *
   * هذا يمنع اختلاف ICU بين
   * Node وSafari أثناء Hydration.
   */
  const parts =
    new Intl.DateTimeFormat(
      "en-US-u-ca-gregory",
      {
        timeZone:
          MESSAGE_TIME_ZONE,
        calendar: "gregory",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      },
    ).formatToParts(date);

  const hourValue =
    parts.find(
      (part) =>
        part.type === "hour",
    )?.value ?? "00";

  const minuteValue =
    parts.find(
      (part) =>
        part.type === "minute",
    )?.value ?? "00";

  const hour24 =
    Number(hourValue);

  const minute =
    minuteValue.padStart(
      2,
      "0",
    );

  if (locale === "ar") {
    const period =
      hour24 >= 12
        ? "م"
        : "ص";

    const hour12 =
      hour24 % 12 || 12;

    const time =
      `${hour12}:${minute}`;

    return `${toArabicDigits(
      time,
    )} ${period}`;
  }

  const period =
    hour24 >= 12
      ? "PM"
      : "AM";

  const hour12 =
    hour24 % 12 || 12;

  return `${hour12}:${minute} ${period}`;
}

function formatFileSize(
  sizeBytes: number,
  locale: string,
) {
  if (
    !Number.isFinite(sizeBytes) ||
    sizeBytes <= 0
  ) {
    return "";
  }

  const units =
    locale === "ar"
      ? ["بايت", "ك.ب", "م.ب", "ج.ب"]
      : ["B", "KB", "MB", "GB"];

  const unitIndex = Math.min(
    Math.floor(
      Math.log(sizeBytes) /
        Math.log(1024),
    ),
    units.length - 1,
  );

  const formattedSize =
    sizeBytes /
    Math.pow(1024, unitIndex);

  return `${new Intl.NumberFormat(
    locale === "ar" ? "ar-SA" : "en-US",
    {
      maximumFractionDigits:
        unitIndex === 0 ? 0 : 1,
    },
  ).format(formattedSize)} ${
    units[unitIndex]
  }`;
}

function isImageAttachment(
  attachment: MessageAttachmentRecord,
) {
  return attachment.mime_type.startsWith(
    "image/",
  );
}

function isAudioAttachment(
  attachment: MessageAttachmentRecord,
) {
  return attachment.mime_type.startsWith(
    "audio/",
  );
}

function getFileLabel(
  mimeType: string,
) {
  if (mimeType === "application/pdf") {
    return "PDF";
  }

  if (
    mimeType === "application/msword" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "Word";
  }

  return "File";
}

export default function MessageBubble({
  message,
  conversationId,
  currentUserId,
  locale,
  startsGroup,
  endsGroup,
}: MessageBubbleProps) {
  const isArabic = locale === "ar";

  const isOwnMessage =
    message.sender_user_id ===
    currentUserId;

  const hasBody =
    message.body.trim().length > 0;

  const attachments =
    message.attachments ?? [];

  const hasAttachments =
    attachments.length > 0;

  const alignmentClass = isOwnMessage
    ? isArabic
      ? "justify-start"
      : "justify-end"
    : isArabic
      ? "justify-end"
      : "justify-start";

  const bubbleClass = isOwnMessage
    ? [
        "bg-gold text-black shadow-gold/5",
        startsGroup
          ? "rounded-2xl"
          : "rounded-2xl rounded-ss-md",
        endsGroup
          ? "rounded-ee-md"
          : "rounded-ee-lg",
      ].join(" ")
    : [
        "border border-white/10 bg-white/[0.065] text-white shadow-black/20",
        startsGroup
          ? "rounded-2xl"
          : "rounded-2xl rounded-se-md",
        endsGroup
          ? "rounded-es-md"
          : "rounded-es-lg",
      ].join(" ");

  return (
    <article
      className={`group flex ${
        startsGroup ? "mt-3" : "mt-1"
      } ${alignmentClass}`}
    >
      <div
        className={`max-w-[92%] overflow-hidden px-3 py-3 shadow-lg sm:max-w-[76%] sm:px-4 md:max-w-[66%] ${bubbleClass}`}
      >
        {hasAttachments ? (
          <div
            className={`space-y-2 ${
              hasBody ? "mb-2.5" : ""
            }`}
          >
            {attachments.map((attachment) => {
  if (isImageAttachment(attachment)) {
    return (
      <ImageAttachment
        key={attachment.id}
        attachment={attachment}
        isArabic={isArabic}
        isOwnMessage={isOwnMessage}
      />
    );
  }

  if (isAudioAttachment(attachment)) {
    return (
      <AudioAttachment
        key={attachment.id}
        attachment={attachment}
        isArabic={isArabic}
        isOwnMessage={isOwnMessage}
      />
    );
  }

  return (
    <FileAttachment
      key={attachment.id}
      attachment={attachment}
      locale={locale}
      isArabic={isArabic}
      isOwnMessage={isOwnMessage}
    />
  );
})}

          </div>
        ) : null}

        {hasBody ? (
          <p className="whitespace-pre-wrap break-words px-1 text-[15px] leading-7">
            {message.body}
          </p>
        ) : null}

        {!hasBody && !hasAttachments ? (
          <p
            className={`px-1 text-xs ${
              isOwnMessage
                ? "text-black/45"
                : "text-white/30"
            }`}
          >
            {isArabic
              ? "جارٍ تحميل المرفق..."
              : "Loading attachment..."}
          </p>
        ) : null}

        <div
          className={`mt-1.5 flex items-center justify-end gap-1.5 px-1 text-[10px] ${
            isOwnMessage
              ? "text-black/55"
              : "text-white/30"
          }`}
        >
          <time dateTime={message.created_at}>
            {formatTime(
              message.created_at,
              locale,
            )}
          </time>

          {isOwnMessage ? (
            <MessageStatus
              readAt={message.read_at}
              locale={locale}
            />
          ) : null}
        </div>

        {!isOwnMessage ? (
          <div className="mt-2 border-t border-white/10 px-1 pt-2">
            {message.reported_at ? (
              <p className="flex items-center gap-1.5 text-[10px] text-amber-200/70">
                <Flag size={11} />

                {isArabic
                  ? "تم الإبلاغ عن الرسالة"
                  : "Message reported"}
              </p>
            ) : (
              <details>
                <summary className="flex min-h-7 cursor-pointer list-none items-center gap-1.5 text-[10px] text-white/25 transition hover:text-amber-200">
                  <Flag size={11} />

                  {isArabic
                    ? "إبلاغ"
                    : "Report"}
                </summary>

                <form
                  action={
                    reportMessageAction
                  }
                  className="mt-3 w-64 max-w-full space-y-2 rounded-xl border border-white/10 bg-black/40 p-3"
                >
                  <input
                    type="hidden"
                    name="conversationId"
                    value={conversationId}
                  />

                  <input
                    type="hidden"
                    name="messageId"
                    value={String(
                      message.id,
                    )}
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
                        ? "سبب البلاغ..."
                        : "Report reason..."
                    }
                    className="w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white outline-none placeholder:text-white/20 focus:border-amber-200/40"
                  />

                  <button
                    type="submit"
                    className="min-h-10 rounded-full border border-amber-200/30 px-4 text-[11px] text-amber-200 transition hover:bg-amber-200 hover:text-black"
                  >
                    {isArabic
                      ? "إرسال البلاغ"
                      : "Submit"}
                  </button>
                </form>
              </details>
            )}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function ImageAttachment({
  attachment,
  isArabic,
  isOwnMessage,
}: {
  attachment: MessageAttachmentRecord;
  isArabic: boolean;
  isOwnMessage: boolean;
}) {
  const [
    isPreviewOpen,
    setIsPreviewOpen,
  ] = useState(false);

  useEffect(() => {
    if (!isPreviewOpen) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        setIsPreviewOpen(false);
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [isPreviewOpen]);

  if (!attachment.signed_url) {
    return (
      <div
        className={`flex min-h-24 items-center justify-center rounded-xl border ${
          isOwnMessage
            ? "border-black/10 bg-black/[0.06]"
            : "border-white/10 bg-black/20"
        }`}
      >
        <div className="text-center">
          <ImageIcon
            size={22}
            className="mx-auto opacity-45"
          />

          <p className="mt-2 text-[10px] opacity-45">
            {isArabic
              ? "تعذر تحميل الصورة"
              : "Image unavailable"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() =>
          setIsPreviewOpen(true)
        }
        aria-label={
          isArabic
            ? `معاينة الصورة ${attachment.file_name}`
            : `Preview image ${attachment.file_name}`
        }
        className="group/image block w-full cursor-zoom-in overflow-hidden rounded-xl text-start outline-none focus-visible:ring-2 focus-visible:ring-black/40"
      >
        <div className="relative aspect-[4/3] max-h-[420px] min-h-40 w-full min-w-[220px] overflow-hidden rounded-xl bg-black/20 sm:min-w-[280px]">
          <Image
            src={attachment.signed_url}
            alt={attachment.file_name}
            fill
            sizes="(max-width: 640px) 85vw, 520px"
            className="object-cover transition duration-300 group-hover/image:scale-[1.015]"
          />

          <div className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover/image:bg-black/10" />
        </div>
      </button>

      {isPreviewOpen
        ? createPortal(
            <ImagePreviewModal
              attachment={attachment}
              isArabic={isArabic}
              onClose={() =>
                setIsPreviewOpen(false)
              }
            />,
            document.body,
          )
        : null}
    </>
  );
}

function ImagePreviewModal({
  attachment,
  isArabic,
  onClose,
}: {
  attachment: MessageAttachmentRecord;
  isArabic: boolean;
  onClose: () => void;
}) {
  if (!attachment.signed_url) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={
        isArabic
          ? "معاينة الصورة"
          : "Image preview"
      }
      dir={isArabic ? "rtl" : "ltr"}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md sm:p-6"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-5">
        <p className="min-w-0 truncate text-sm text-white/70">
          {attachment.file_name}
        </p>

        <div className="pointer-events-auto flex shrink-0 items-center gap-2">
          <a
            href={attachment.signed_url}
            download={attachment.file_name}
            target="_blank"
            rel="noreferrer"
            aria-label={
              isArabic
                ? "تنزيل الصورة"
                : "Download image"
            }
            className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-full border border-white/15 bg-black/55 text-white/75 backdrop-blur-md transition hover:border-gold/50 hover:text-gold active:scale-95"
          >
            <Download size={19} />
          </a>

          <button
            type="button"
            onClick={onClose}
            aria-label={
              isArabic
                ? "إغلاق المعاينة"
                : "Close preview"
            }
            className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-full border border-white/15 bg-black/55 text-white/75 backdrop-blur-md transition hover:border-white/35 hover:text-white active:scale-95"
          >
            <X size={21} />
          </button>
        </div>
      </div>

      <div
        className="relative h-[calc(100dvh-6rem)] w-full max-w-[1500px]"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <Image
          src={attachment.signed_url}
          alt={attachment.file_name}
          fill
          priority
          sizes="100vw"
          className="select-none object-contain"
        />
      </div>
    </div>
  );
}

function FileAttachment({
  attachment,
  locale,
  isArabic,
  isOwnMessage,
}: {
  attachment: MessageAttachmentRecord;
  locale: string;
  isArabic: boolean;
  isOwnMessage: boolean;
}) {
  const fileSize = formatFileSize(
    attachment.size_bytes,
    locale,
  );

  const fileLabel = getFileLabel(
    attachment.mime_type,
  );

  const cardClass = isOwnMessage
    ? "border-black/10 bg-black/[0.07]"
    : "border-white/10 bg-black/20";

  const secondaryTextClass =
    isOwnMessage
      ? "text-black/50"
      : "text-white/35";

  return (
    <div
      className={`flex min-w-[240px] max-w-full items-center gap-3 rounded-xl border p-3 sm:min-w-[300px] ${cardClass}`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
          isOwnMessage
            ? "bg-black/10 text-black/65"
            : "bg-white/[0.07] text-gold"
        }`}
      >
        <FileText size={21} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {attachment.file_name}
        </p>

        <p
          className={`mt-1 text-[10px] ${secondaryTextClass}`}
        >
          {fileLabel}
          {fileSize
            ? ` • ${fileSize}`
            : ""}
        </p>
      </div>

      {attachment.signed_url ? (
        <a
          href={attachment.signed_url}
          target="_blank"
          rel="noreferrer"
          download={attachment.file_name}
          aria-label={
            isArabic
              ? `تنزيل ${attachment.file_name}`
              : `Download ${attachment.file_name}`
          }
          className={`flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-full border transition active:scale-95 ${
            isOwnMessage
              ? "border-black/15 text-black/60 hover:bg-black/10"
              : "border-white/10 text-white/55 hover:border-gold/35 hover:text-gold"
          }`}
        >
          <Download size={17} />
        </a>
      ) : (
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center opacity-30 ${secondaryTextClass}`}
        >
          <Download size={17} />
        </span>
      )}
    </div>
  );
}
function AudioAttachment({
  attachment,
  isArabic,
  isOwnMessage,
}: {
  attachment: MessageAttachmentRecord;
  isArabic: boolean;
  isOwnMessage: boolean;
}) {
  const cardClass = isOwnMessage
    ? "border-black/10 bg-black/[0.07]"
    : "border-white/10 bg-black/20";

  const secondaryTextClass =
    isOwnMessage
      ? "text-black/50"
      : "text-white/35";

  if (!attachment.signed_url) {
    return (
      <div
        className={`w-full min-w-0 rounded-xl border p-3 ${cardClass}`}
      >
        <p
          className={`text-xs ${secondaryTextClass}`}
        >
          {isArabic
            ? "تعذر تحميل الرسالة الصوتية"
            : "Voice message unavailable"}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`w-full min-w-0 rounded-xl border p-3 ${cardClass}`}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-medium">
          {isArabic
            ? "رسالة صوتية"
            : "Voice message"}
        </p>

        <a
          href={attachment.signed_url}
          target="_blank"
          rel="noreferrer"
          download={attachment.file_name}
          aria-label={
            isArabic
              ? "تنزيل الرسالة الصوتية"
              : "Download voice message"
          }
          className={`flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center rounded-full border transition active:scale-95 ${
            isOwnMessage
              ? "border-black/15 text-black/60 hover:bg-black/10"
              : "border-white/10 text-white/55 hover:border-gold/35 hover:text-gold"
          }`}
        >
          <Download size={16} />
        </a>
      </div>

      <VoiceMessagePlayer
  src={attachment.signed_url}
  isOwnMessage={isOwnMessage}
  isArabic={isArabic}
/>
    </div>
  );
}