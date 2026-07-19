import Link from "next/link";
import { redirect } from "next/navigation";

import {
  markConversationReadAction,
  reportMessageAction,
  sendMessageAction,
} from "@/lib/actions/message-actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    locale: string;
    conversationId: string;
  }>;
};

type MessageRecord = {
  id: number | string;
  sender_user_id: string;
  body: string;
  read_at: string | null;
  reported_at: string | null;
  report_reason: string | null;
  created_at: string;
};

function formatMessageTime(value: string, locale: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatConversationDate(value: string, locale: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function TalentConversationPage({
  params,
}: PageProps) {
  const { locale, conversationId: conversationIdParam } = await params;
  const isArabic = locale === "ar";
  const conversationId = Number(conversationIdParam);

  const authClient = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    redirect(`/${locale}/talent-login`);
  }

  if (!Number.isInteger(conversationId) || conversationId <= 0) {
    return (
      <main
        dir={isArabic ? "rtl" : "ltr"}
        className="flex min-h-screen items-center justify-center bg-background px-5 py-24 text-white"
      >
        <section className="w-full max-w-xl rounded-[2rem] border border-red-400/20 bg-red-400/[0.04] p-8 text-center text-red-200">
          {isArabic ? "رابط المحادثة غير صحيح." : "Invalid conversation link."}
        </section>
      </main>
    );
  }

  const adminClient = createAdminClient();

  const { data: talent, error: talentError } = await adminClient
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

  const { data: conversation, error: conversationError } =
    await adminClient
      .from("conversations")
      .select(`
        id,
        application_id,
        opportunity_id,
        publisher_id,
        talent_id,
        status,
        closed_at
      `)
      .eq("id", conversationId)
      .eq("talent_id", talent.id)
      .maybeSingle();

  if (conversationError) {
    throw new Error(
      `[TalentConversationPage conversation] ${conversationError.message}`,
    );
  }

  if (!conversation) {
    return (
      <main
        dir={isArabic ? "rtl" : "ltr"}
        className="flex min-h-screen items-center justify-center bg-background px-5 py-24 text-white"
      >
        <section className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/[0.025] p-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">
            {isArabic ? "غير موجود" : "Not Found"}
          </p>

          <h1 className="mt-3 text-3xl font-light">
            {isArabic
              ? "المحادثة غير موجودة أو لا تملك صلاحية الوصول"
              : "Conversation not found or access denied"}
          </h1>

          <Link
            href={`/${locale}/talent-dashboard/applications`}
            className="mt-6 inline-flex rounded-full border border-gold/40 px-5 py-3 text-sm text-gold transition hover:bg-gold hover:text-black"
          >
            {isArabic ? "العودة إلى طلباتي" : "Back to Applications"}
          </Link>
        </section>
      </main>
    );
  }

  await markConversationReadAction(conversationId);

  const [opportunityResult, publisherResult, messagesResult] =
    await Promise.all([
      adminClient
        .from("opportunities")
        .select("id, title, slug")
        .eq("id", conversation.opportunity_id)
        .maybeSingle(),

      adminClient
        .from("publishers")
        .select("id, company_name, contact_name, profile_image_url")
        .eq("id", conversation.publisher_id)
        .maybeSingle(),

      adminClient
        .from("messages")
        .select(`
          id,
          sender_user_id,
          body,
          read_at,
          reported_at,
          report_reason,
          created_at
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true }),
    ]);

  if (messagesResult.error) {
    throw new Error(
      `[TalentConversationPage messages] ${messagesResult.error.message}`,
    );
  }

  const opportunity = opportunityResult.data;
  const publisher = publisherResult.data;
  const messages = (messagesResult.data ?? []) as MessageRecord[];

  const publisherName =
    publisher?.company_name ||
    publisher?.contact_name ||
    (isArabic ? "الناشر" : "Publisher");

  const isActive =
    (conversation.status ?? "active") === "active";

  const closedAtLabel = conversation.closed_at
    ? formatConversationDate(conversation.closed_at, locale)
    : null;

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-background px-4 pb-24 pt-36 text-white sm:px-6 sm:pt-40 lg:pt-32"
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.12),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-6 sm:p-8">
          <Link
            href={`/${locale}/talent-dashboard/applications`}
            className="text-sm text-gold underline underline-offset-4"
          >
            {isArabic ? "← العودة إلى طلباتي" : "← Back to Applications"}
          </Link>

          <div className="mt-7 flex items-center gap-4">
            {publisher?.profile_image_url ? (
              <img
                src={publisher.profile_image_url}
                alt={publisherName}
                className="h-16 w-16 rounded-full border border-white/10 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xl text-gold">
                {publisherName.slice(0, 1)}
              </div>
            )}

            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gold">
                {isArabic ? "محادثة الفرصة" : "Opportunity Conversation"}
              </p>

              <h1 className="mt-2 text-3xl font-light">{publisherName}</h1>

              <p className="mt-1 text-sm text-white/40">
                {opportunity?.title ?? "-"}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full border px-3 py-1.5 text-[10px] ${
                    isActive
                      ? "border-emerald-300/25 bg-emerald-300/[0.08] text-emerald-200"
                      : "border-amber-300/25 bg-amber-300/[0.07] text-amber-200"
                  }`}
                >
                  {isActive
                    ? isArabic
                      ? "المحادثة نشطة"
                      : "Active conversation"
                    : isArabic
                      ? "المحادثة مغلقة"
                      : "Conversation closed"}
                </span>

                {!isActive && closedAtLabel ? (
                  <span className="text-[10px] text-white/35">
                    {isArabic
                      ? `أُغلقت في ${closedAtLabel}`
                      : `Closed on ${closedAtLabel}`}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025]">
          <div className="max-h-[58vh] min-h-[420px] space-y-4 overflow-y-auto p-5 md:p-7">
            {messages.length > 0 ? (
              messages.map((message) => {
                const isOwnMessage = message.sender_user_id === user.id;

                return (
                  <div
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
                      className={`max-w-[85%] rounded-[1.4rem] px-5 py-4 sm:max-w-[70%] ${
                        isOwnMessage
                          ? "border border-gold/25 bg-gold/[0.08]"
                          : "border border-white/10 bg-white/[0.045]"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words text-sm leading-7 text-white/85">
                        {message.body}
                      </p>

                      <div className="mt-2 flex items-center justify-end gap-2 text-[10px] text-white/35">
                        <time dateTime={message.created_at}>
                          {formatMessageTime(message.created_at, locale)}
                        </time>

                        {isOwnMessage ? (
                          <span
                            className={
                              message.read_at
                                ? "text-sky-300"
                                : "text-white/35"
                            }
                            title={
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
                                <input type="hidden" name="conversationId" value={conversationId} />
                                <input type="hidden" name="messageId" value={String(message.id)} />
                                <input type="hidden" name="locale" value={locale} />

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
                  </div>
                );
              })
            ) : (
              <div className="flex min-h-[350px] items-center justify-center text-center">
                <div>
                  <p className="text-lg font-light">
                    {isArabic
                      ? "ابدأ المحادثة الآن"
                      : "Start the conversation"}
                  </p>

                  <p className="mt-2 text-sm text-white/40">
                    {isArabic
                      ? "يمكنك التواصل مع الناشر بعد قبول طلبك."
                      : "You can contact the publisher after your application is accepted."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {isActive ? (
            <form
              action={sendMessageAction}
              className="border-t border-white/10 p-4 md:p-5"
            >
              <input
                type="hidden"
                name="conversationId"
                value={conversationId}
              />

              <input type="hidden" name="locale" value={locale} />

              <div className="flex flex-col gap-3 sm:flex-row">
                <textarea
                  name="body"
                  required
                  maxLength={3000}
                  rows={2}
                  placeholder={
                    isArabic
                      ? "اكتب رسالتك..."
                      : "Write your message..."
                  }
                  className="min-h-[58px] flex-1 resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-7 text-white outline-none placeholder:text-white/25 focus:border-gold/50"
                />

                <button
                  type="submit"
                  className="rounded-2xl border border-gold/40 bg-gold/[0.08] px-8 py-4 text-sm text-gold transition hover:bg-gold hover:text-black"
                >
                  {isArabic ? "إرسال" : "Send"}
                </button>
              </div>
            </form>
          ) : (
            <div className="border-t border-white/10 p-4 md:p-5">
              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] px-5 py-5 text-center">
                <p className="text-sm text-amber-100/85">
                  {isArabic
                    ? "تم إغلاق هذه المحادثة بواسطة الشركة، ولا يمكن إرسال رسائل جديدة."
                    : "This conversation was closed by the company, and no new messages can be sent."}
                </p>

                {closedAtLabel ? (
                  <p className="mt-2 text-[10px] text-white/35">
                    {isArabic
                      ? `تاريخ الإغلاق: ${closedAtLabel}`
                      : `Closed on: ${closedAtLabel}`}
                  </p>
                ) : null}

                <p className="mt-3 text-[10px] leading-5 text-white/25">
                  {isArabic
                    ? "ستبقى جميع الرسائل السابقة محفوظة ويمكنك الرجوع إليها."
                    : "All previous messages remain available for reference."}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
