type MessageStatusProps = {
  readAt: string | null;
  locale: string;
};

export default function MessageStatus({
  readAt,
  locale,
}: MessageStatusProps) {
  const isArabic = locale === "ar";
  const isRead = Boolean(readAt);

  const title = isRead
    ? isArabic
      ? "تمت القراءة"
      : "Read"
    : isArabic
      ? "تم الإرسال"
      : "Sent";

  const ariaLabel = isRead
    ? isArabic
      ? "تمت قراءة الرسالة"
      : "Message read"
    : isArabic
      ? "تم إرسال الرسالة"
      : "Message sent";

  return (
    <span
      dir="ltr"
      title={title}
      aria-label={ariaLabel}
      className={`relative inline-flex h-4 w-[18px] shrink-0 items-center justify-center ${
        isRead
          ? "text-emerald-700"
          : "text-black/45"
      }`}
    >
      {isRead ? (
        <>
          <span
            aria-hidden="true"
            className="absolute left-[1px] text-[11px] font-bold leading-none"
          >
            ✓
          </span>

          <span
            aria-hidden="true"
            className="absolute left-[6px] text-[11px] font-bold leading-none"
          >
            ✓
          </span>
        </>
      ) : (
        <span
          aria-hidden="true"
          className="text-[11px] font-bold leading-none"
        >
          ✓
        </span>
      )}
    </span>
  );
}