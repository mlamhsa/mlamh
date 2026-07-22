import Link from "next/link";

type DashboardMessagesCardProps = {
  locale: string;
  isRtl: boolean;
  unreadMessagesCount: number;
  totalConversations: number;
};

export default function DashboardMessagesCard({
  locale,
  isRtl,
  unreadMessagesCount,
  totalConversations,
}: DashboardMessagesCardProps) {
  return (
    <Link
      href={`/${locale}/talent-dashboard/messages`}
      className="group block rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-5 outline-none transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.045] focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:p-6"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
          <p className="arabic-safe text-[10px] uppercase tracking-[0.28em] text-gold">
              {isRtl ? "الرسائل" : "Messages"}
            </p>

            {unreadMessagesCount > 0 && (
              <span className="rounded-full bg-gold px-2.5 py-1 text-[10px] font-medium text-black">
                {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
              </span>
            )}
          </div>

          <h2 className="mt-3 text-2xl font-light text-white sm:text-3xl">
            {isRtl ? "محادثاتك" : "Your Conversations"}
          </h2>

          <p className="mt-3 text-sm leading-7 text-white/45">
            {unreadMessagesCount > 0
              ? isRtl
                ? `لديك ${unreadMessagesCount} رسالة غير مقروءة.`
                : `You have ${unreadMessagesCount} unread message(s).`
              : totalConversations > 0
                ? isRtl
                  ? "جميع رسائلك مقروءة."
                  : "All your messages are read."
                : isRtl
                  ? "ستظهر محادثاتك هنا بعد قبولك في إحدى الفرص."
                  : "Your conversations will appear here after an application is accepted."}
          </p>

          <div className="mt-5 inline-flex items-center gap-2 text-xs text-gold">
            <span>
              {isRtl ? "فتح مركز الرسائل" : "Open message center"}
            </span>

            <span
  aria-hidden="true"
  className={`transition-transform duration-200 ${
    isRtl
      ? "group-hover:-translate-x-1"
      : "group-hover:translate-x-1"
  }`}
>
  {isRtl ? "←" : "→"}
</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="min-w-[105px] rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-center transition group-hover:border-white/20">
          <p className="arabic-safe text-[10px] uppercase tracking-[0.2em] text-white/35">
              {isRtl ? "المحادثات" : "Conversations"}
            </p>

            <p className="mt-1 text-2xl font-light text-white">
              {totalConversations}
            </p>
          </div>

          {unreadMessagesCount > 0 && (
            <div className="min-w-[105px] rounded-2xl border border-gold/25 bg-gold/[0.08] px-4 py-3 text-center transition group-hover:border-gold/45 group-hover:bg-gold/[0.12]">
              <p className="arabic-safe text-[10px] uppercase tracking-[0.2em] text-gold">
                {isRtl ? "غير مقروء" : "Unread"}
              </p>

              <p className="mt-1 text-2xl font-light text-gold">
                {unreadMessagesCount}
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}