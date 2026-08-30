import Link from "next/link";
import { ArrowLeft, ArrowRight, Mail, Phone, Send, UserRound } from "lucide-react";
import { notFound } from "next/navigation";

import {
  adminReplySupportTicketAction,
  updateSupportTicketStatusAction,
} from "@/lib/actions/admin-support-actions";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string; error?: string; sent?: string }>;
};

type TicketRow = {
  id: number;
  ticket_number: string;
  sender_name: string;
  sender_email: string;
  sender_phone: string | null;
  category: string;
  subject: string;
  status: string;
  priority: string;
  locale: string;
  created_at: string;
  updated_at: string;
  first_response_at: string | null;
};

type MessageRow = {
  id: number;
  sender_type: string;
  sender_user_id: string | null;
  message: string;
  created_at: string;
};

function formatDate(value: string, isArabic: boolean) {
  return new Intl.DateTimeFormat(isArabic ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusLabel(status: string, isArabic: boolean) {
  const labels: Record<string, [string, string]> = {
    new: ["جديدة", "New"],
    open: ["مفتوحة", "Open"],
    in_progress: ["قيد المعالجة", "In progress"],
    pending_user: ["بانتظار المستخدم", "Waiting for user"],
    resolved: ["تم الحل", "Resolved"],
    closed: ["مغلقة", "Closed"],
  };
  const label = labels[status];
  return label ? (isArabic ? label[0] : label[1]) : status;
}

export default async function AdminSupportTicketPage({ params, searchParams }: PageProps) {
  const admin = await requireAdminAccess();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const ticketId = Number(id);
  if (!Number.isInteger(ticketId) || ticketId <= 0) notFound();

  const locale = query.lang === "en" ? "en" : "ar";
  const isArabic = locale === "ar";
  const adminClient = createAdminClient();

  const [{ data: ticketData, error: ticketError }, { data: messageData, error: messageError }] = await Promise.all([
    adminClient
      .from("support_tickets")
      .select("id, ticket_number, sender_name, sender_email, sender_phone, category, subject, status, priority, locale, created_at, updated_at, first_response_at")
      .eq("id", ticketId)
      .maybeSingle(),
    adminClient
      .from("support_messages")
      .select("id, sender_type, sender_user_id, message, created_at")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true }),
  ]);

  if (ticketError || !ticketData) notFound();
  if (messageError) throw new Error(`Unable to load support messages: ${messageError.message}`);

  const ticket = ticketData as TicketRow;
  const messages = (messageData ?? []) as MessageRow[];
  const BackIcon = isArabic ? ArrowRight : ArrowLeft;

  return (
    <main dir={isArabic ? "rtl" : "ltr"} className="mx-auto max-w-6xl px-4 py-7 text-white sm:px-6 lg:px-8 lg:py-10">
      <Link
        href={`/admin/support?lang=${locale}`}
        className="inline-flex items-center gap-2 text-xs text-white/40 transition hover:text-gold"
      >
        <BackIcon className="h-4 w-4" />
        {isArabic ? "العودة إلى الدعم" : "Back to support"}
      </Link>

      <section className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span dir="ltr" className="font-mono text-sm text-gold">{ticket.ticket_number}</span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] text-white/55">
                {statusLabel(ticket.status, isArabic)}
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] text-white/35">
                {ticket.category}
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-light sm:text-4xl">{ticket.subject}</h1>
            <p className="mt-3 text-xs text-white/30">{formatDate(ticket.created_at, isArabic)}</p>
          </div>

          <form action={updateSupportTicketStatusAction} className="flex min-w-[220px] gap-2">
            <input type="hidden" name="ticket_id" value={ticket.id} />
            <input type="hidden" name="locale" value={locale} />
            <select
              name="status"
              defaultValue={ticket.status}
              className="min-h-11 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 text-xs text-white outline-none focus:border-gold/30"
            >
              {(["new", "open", "in_progress", "pending_user", "resolved", "closed"] as const).map((status) => (
                <option key={status} value={status}>{statusLabel(status, isArabic)}</option>
              ))}
            </select>
            <button className="rounded-xl border border-gold/25 bg-gold/[0.08] px-4 text-xs text-gold">
              {isArabic ? "حفظ" : "Save"}
            </button>
          </form>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Info icon={<UserRound className="h-4 w-4" />} label={isArabic ? "المرسل" : "Sender"} value={ticket.sender_name} />
          <Info icon={<Mail className="h-4 w-4" />} label={isArabic ? "البريد" : "Email"} value={ticket.sender_email} dir="ltr" />
          <Info icon={<Phone className="h-4 w-4" />} label={isArabic ? "الجوال" : "Phone"} value={ticket.sender_phone || "—"} dir="ltr" />
        </div>
      </section>

      {query.error ? (
        <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {isArabic ? "تعذر تنفيذ العملية. حاول مرة أخرى." : "The action could not be completed. Please try again."}
        </div>
      ) : null}

      <section className="mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.02]">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-medium">{isArabic ? "المحادثة" : "Conversation"}</h2>
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          {messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/35">{isArabic ? "لا توجد رسائل." : "No messages."}</p>
          ) : (
            messages.map((message) => {
              const fromAdmin = message.sender_type === "admin";
              return (
                <article
                  key={message.id}
                  className={`max-w-[90%] rounded-2xl border p-4 sm:max-w-[75%] ${
                    fromAdmin
                      ? "ms-auto border-gold/20 bg-gold/[0.06]"
                      : "me-auto border-white/[0.08] bg-white/[0.035]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className={`text-[10px] ${fromAdmin ? "text-gold" : "text-white/40"}`}>
                      {fromAdmin ? (isArabic ? "فريق ملامح" : "MLAMH Team") : ticket.sender_name}
                    </p>
                    <p className="text-[9px] text-white/25">{formatDate(message.created_at, isArabic)}</p>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/70">{message.message}</p>
                </article>
              );
            })
          )}
        </div>

        <form action={adminReplySupportTicketAction} className="border-t border-white/10 p-4 sm:p-6">
          <input type="hidden" name="ticket_id" value={ticket.id} />
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="admin_user_id" value={admin.id} />
          <textarea
            name="message"
            required
            maxLength={10000}
            rows={5}
            placeholder={isArabic ? "اكتب رد فريق الدعم..." : "Write a support reply..."}
            className="w-full resize-y rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm leading-7 text-white outline-none placeholder:text-white/20 focus:border-gold/40"
          />
          <button
            type="submit"
            className="mt-3 inline-flex min-h-12 items-center gap-2 rounded-xl bg-gold px-5 text-sm font-medium text-black"
          >
            <Send className="h-4 w-4" />
            {isArabic ? "إرسال الرد" : "Send reply"}
          </button>
        </form>
      </section>
    </main>
  );
}

function Info({ icon, label, value, dir }: { icon: React.ReactNode; label: string; value: string; dir?: "ltr" | "rtl" }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
      <div className="flex items-center gap-2 text-[10px] text-white/30">{icon}{label}</div>
      <p dir={dir} className="mt-2 break-words text-sm text-white/65">{value}</p>
    </div>
  );
}
