import Link from "next/link";
import { redirect } from "next/navigation";

import {
  closeConversationAction,
  markConversationReadAction,
  sendMessageAction,
} from "@/lib/actions/message-actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
};

type OpportunityRecord = {
  id: number;
  title: string | null;
};

type TalentRecord = {
  id: number;
  name_ar: string | null;
  name_en: string | null;
  image_url: string | null;
  category_ar: string | null;
  category_en: string | null;
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

export default async function PublisherConversationPage({
  params,
}: PageProps) {
  const { locale, conversationId: rawConversationId } = await params;
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
    redirect(`/${locale}/publisher-login`);
  }

  const adminClient = createAdminClient();

  const { data: profile, error: profileError } = await adminClient
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
    redirect(`/${locale}/publisher-login`);
  }

  const { data: publisher, error: publisherError } = await adminClient
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

  const conversation = conversationData as ConversationRecord;

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
          name_ar,
          name_en,
          image_url,
          category_ar,
          category_en
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

  const messages = (messagesResult.data ?? []) as MessageRecord[];
  const opportunity = opportunityResult.data as OpportunityRecord | null;
  const talent = talentResult.data as TalentRecord | null;

  await markConversationReadAction(conversation.id);

  const talentName = isArabic
    ? talent?.name_ar || talent?.name_en || "الموهبة"
    : talent?.name_en || talent?.name_ar || "Talent";

  const talentCategory = isArabic
    ? talent?.category_ar || talent?.category_en || ""
    : talent?.category_en || talent?.category_ar || "";

  const isActive = (conversation.status ?? "active") === "active";

  const closedAtLabel = conversation.closed_at
    ? formatMessageDate(conversation.closed_at, locale)
    : null;

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-background px-4 pb-24 pt-36 text-white sm:px-6 sm:pt-40 lg:pt-32"
    >
      <div className="mx-auto max-w-5xl">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025]">
          <header className="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.12),transparent_40%)] p-5 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                {talent?.image_url ? (
                  <img
                    src={talent.image_url}
                    alt={talentName}
                    className="h-14 w-14 shrink-0 rounded-full border border-white/10 object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xl text-gold">
                    {talentName.slice(0, 1)}
                  </div>
                )}

                <div className="min-w-0">
                  <Link
                    href={`/${locale}/publisher-dashboard/messages`}
                    className="text-xs text-gold underline underline-offset-4"
                  >
                    {isArabic
                      ? "العودة إلى المحادثات"
                      : "Back to conversations"}
                  </Link>

                  <h1 className="mt-2 truncate text-2xl font-light sm:text-3xl">
                    {talentName}
                  </h1>

                  <p className="mt-1 truncate text-xs text-white/40">
                    {opportunity?.title ??
                      (isArabic
                        ? "فرصة بدون عنوان"
                        : "Untitled Opportunity")}
                  </p>

                  {talentCategory ? (
                    <p className="mt-1 truncate text-[11px] text-gold/65">
                      {talentCategory}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="text-end">
                  <div
                    className={`w-fit rounded-full border px-4 py-2 text-xs ${
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
                  </div>

                  {!isActive && closedAtLabel ? (
                    <p className="mt-2 text-[10px] text-white/35">
                      {isArabic
                        ? `أُغلقت في ${closedAtLabel}`
                        : `Closed on ${closedAtLabel}`}
                    </p>
                  ) : null}
                </div>

                {isActive ? (
                  <form action={closeConversationAction}>
                    <input type="hidden" name="conversationId" value={conversation.id} />
                    <input type="hidden" name="locale" value={locale} />
                    <button
                      type="submit"
                      className="rounded-full border border-red-300/25 bg-red-300/[0.06] px-4 py-2 text-xs text-red-200 transition hover:bg-red-300 hover:text-black"
                    >
                      {isArabic ? "إغلاق المحادثة" : "Close conversation"}
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          </header>

          <RealtimeMessageList
            conversationId={conversation.id}
            currentUserId={user.id}
            initialMessages={messages}
            locale={locale}
          />

          <footer className="border-t border-white/10 bg-black/20 p-4 sm:p-6">
            {isActive ? (
              <form action={sendMessageAction}>
                <input
                  type="hidden"
                  name="conversationId"
                  value={conversation.id}
                />

                <input type="hidden" name="locale" value={locale} />

                <label htmlFor="message-body" className="sr-only">
                  {isArabic ? "نص الرسالة" : "Message text"}
                </label>

                <textarea
                  id="message-body"
                  name="body"
                  required
                  maxLength={3000}
                  rows={3}
                  placeholder={
                    isArabic
                      ? "اكتب رسالتك هنا..."
                      : "Write your message..."
                  }
                  className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-7 text-white outline-none transition placeholder:text-white/25 focus:border-gold/45"
                />

                <div className="mt-3 flex items-center justify-between gap-4">
                  <p className="text-[10px] text-white/25">
                    {isArabic
                      ? "الحد الأقصى 3000 حرف"
                      : "Maximum 3,000 characters"}
                  </p>

                  <button
                    type="submit"
                    className="inline-flex min-w-28 items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-medium text-black transition hover:brightness-110"
                  >
                    {isArabic ? "إرسال" : "Send"}
                  </button>
                </div>
              </form>
            ) : (
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
                    ? "ستبقى جميع الرسائل السابقة محفوظة ويمكن الرجوع إليها."
                    : "All previous messages remain available for reference."}
                </p>
              </div>
            )}
          </footer>
        </section>
      </div>
    </main>
  );
}
