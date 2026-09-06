import { createAdminClient } from "@/lib/supabase/admin";
import { createMarketingTask } from "@/lib/marketing/tasks/service";
import {
  getZohoDurableAccessToken,
  getZohoMailConnectionState,
} from "./zoho-mail";
import { normalizeZohoBaseUrl } from "./zoho-mail-core";
import { htmlEmailToPlainText } from "./zoho-inbound";

type ZohoSearchMessage = {
  messageId?: string | number;
  folderId?: string | number;
  threadId?: string | number;
  fromAddress?: string;
  sender?: string;
  subject?: string;
  summary?: string;
  receivedtime?: string | number;
  receivedTime?: string | number;
};

type ZohoListResponse = { status?: { code?: number }; data?: ZohoSearchMessage[] };
type ZohoContentResponse = { status?: { code?: number }; data?: { content?: string } };
type ZohoHeaderResponse = {
  status?: { code?: number };
  data?: { headerContent?: Record<string, string[] | string> };
};

function record(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeEmail(value: unknown) {
  const email = text(value)?.toLowerCase() ?? null;
  return email && email.includes("@") ? email : null;
}

function headerValue(headers: Record<string, string[] | string> | undefined, name: string) {
  if (!headers) return null;
  const key = Object.keys(headers).find((candidate) => candidate.toLowerCase() === name.toLowerCase());
  if (!key) return null;
  const value = headers[key];
  return Array.isArray(value) ? text(value[0]) : text(value);
}

function receivedAt(message: ZohoSearchMessage) {
  const ms = Number(message.receivedtime ?? message.receivedTime);
  return Number.isFinite(ms) && ms > 0 ? new Date(ms).toISOString() : new Date().toISOString();
}

function zohoDate(day: string, subtractDays: number) {
  const parsed = new Date(`${day}T00:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() - subtractDays);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${String(parsed.getUTCDate()).padStart(2, "0")}-${months[parsed.getUTCMonth()]}-${parsed.getUTCFullYear()}`;
}

function automatedSender(email: string) {
  const local = email.split("@")[0] ?? "";
  return /^(mailer-daemon|postmaster|bounce|bounces|no-?reply|do-?not-?reply)$/i.test(local);
}

async function fetchZohoJson<T>(url: string, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Zoho-oauthtoken ${accessToken}`,
    },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({})) as T;
  if (!response.ok) throw new Error(`Zoho inbound recent request failed with status ${response.status}.`);
  return payload;
}

async function findConversation(senderEmail: string, inReplyTo: string | null) {
  const db = createAdminClient();
  if (inReplyTo) {
    const { data: job } = await db.from("marketing_channel_jobs")
      .select("task_id")
      .eq("channel", "email")
      .eq("status", "published")
      .contains("result", { mail_id: inReplyTo })
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (job?.task_id) {
      const { data: task } = await db.from("marketing_tasks")
        .select("conversation_id")
        .eq("id", job.task_id)
        .maybeSingle();
      if (task?.conversation_id) {
        const { data: conversation } = await db.from("marketing_conversations")
          .select("*")
          .eq("id", task.conversation_id)
          .maybeSingle();
        if (conversation) return conversation;
      }
    }
  }

  const { data: contact } = await db.from("marketing_contacts")
    .select("id")
    .ilike("email", senderEmail)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!contact?.id) return null;

  const { data: conversation } = await db.from("marketing_conversations")
    .select("*")
    .eq("contact_id", contact.id)
    .eq("status", "open")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return conversation ?? null;
}

async function mirrorSupportReply(conversation: Record<string, unknown>, content: string, received: string) {
  const refs = Array.isArray(record(conversation.metadata).source_references)
    ? record(conversation.metadata).source_references as unknown[]
    : [];
  const ticketNumber = refs.map(text).find((value) => value?.startsWith("support-ticket:"))?.replace(/^support-ticket:/, "");
  if (!ticketNumber) return null;

  const db = createAdminClient();
  const { data: ticket } = await db.from("support_tickets")
    .select("id")
    .eq("ticket_number", ticketNumber)
    .maybeSingle();
  if (!ticket?.id) return null;

  await db.from("support_messages").insert({
    ticket_id: ticket.id,
    sender_type: "guest",
    message: content,
    is_read: false,
  });
  await db.from("support_tickets").update({
    status: "in_progress",
    last_message_at: received,
    updated_at: new Date().toISOString(),
  }).eq("id", ticket.id);
  return ticket.id as number;
}

async function ingestRecentMessage(message: ZohoSearchMessage, params: {
  accountId: string;
  apiBaseUrl: string;
  accessToken: string;
  day: string;
}) {
  const db = createAdminClient();
  const messageId = String(message.messageId ?? "").trim();
  const folderId = String(message.folderId ?? "").trim();
  const senderEmail = normalizeEmail(message.fromAddress);
  if (!messageId || !folderId || !senderEmail || senderEmail === "hello@mlamh.net" || automatedSender(senderEmail)) {
    return { status: "ignored" as const };
  }

  const { data: duplicate } = await db.from("marketing_messages")
    .select("id")
    .eq("external_message_id", messageId)
    .limit(1)
    .maybeSingle();
  if (duplicate?.id) return { status: "duplicate" as const };

  const base = normalizeZohoBaseUrl(params.apiBaseUrl, "Zoho Mail API base URL");
  const [contentResponse, headerResponse] = await Promise.all([
    fetchZohoJson<ZohoContentResponse>(`${base}/api/accounts/${encodeURIComponent(params.accountId)}/folders/${encodeURIComponent(folderId)}/messages/${encodeURIComponent(messageId)}/content?includeBlockContent=false`, params.accessToken),
    fetchZohoJson<ZohoHeaderResponse>(`${base}/api/accounts/${encodeURIComponent(params.accountId)}/folders/${encodeURIComponent(folderId)}/messages/${encodeURIComponent(messageId)}/header?raw=false`, params.accessToken),
  ]);
  if (contentResponse.status?.code !== 200 || headerResponse.status?.code !== 200) return { status: "ignored" as const };

  const headers = headerResponse.data?.headerContent;
  const autoSubmitted = headerValue(headers, "Auto-Submitted");
  const precedence = headerValue(headers, "Precedence");
  if ((autoSubmitted && autoSubmitted.toLowerCase() !== "no") || /^(bulk|list|junk)$/i.test(precedence ?? "")) {
    return { status: "ignored" as const };
  }

  const content = htmlEmailToPlainText(contentResponse.data?.content ?? message.summary ?? "");
  if (!content) return { status: "ignored" as const };

  const inReplyTo = headerValue(headers, "In-Reply-To");
  const internetMessageId = headerValue(headers, "Message-Id");
  const threadId = text(message.threadId == null ? null : String(message.threadId));
  const received = receivedAt(message);
  const conversation = await findConversation(senderEmail, inReplyTo);
  if (!conversation) return { status: "unmatched" as const };

  const { data: inserted, error } = await db.from("marketing_messages").insert({
    conversation_id: conversation.id,
    direction: "inbound",
    sender: text(message.sender) ?? senderEmail,
    content,
    message_type: "email",
    external_message_id: messageId,
    delivery_status: "received",
    received_at: received,
    metadata: {
      provider: "zoho_mail",
      sender_email: senderEmail,
      subject: text(message.subject),
      folder_id: folderId,
      thread_id: threadId,
      internet_message_id: internetMessageId,
      in_reply_to: inReplyTo,
      poller: "recent_window_v2",
    },
  }).select("id").single();
  if (error || !inserted) throw new Error(`[zoho_recent.message] ${error?.message ?? "insert failed"}`);

  await db.from("marketing_conversations").update({
    stage: "replied",
    last_message_at: received,
    unread_count: Math.max(0, Number(conversation.unread_count ?? 0)) + 1,
    assigned_agent_id: "dana",
    metadata: {
      ...record(conversation.metadata),
      zoho_thread_id: threadId,
      last_inbound_message_id: messageId,
      last_inbound_internet_message_id: internetMessageId,
    },
    updated_at: new Date().toISOString(),
  }).eq("id", conversation.id);

  if (conversation.lead_id) {
    await db.from("marketing_leads").update({
      last_contact_at: received,
      updated_at: new Date().toISOString(),
    }).eq("id", conversation.lead_id);
  }

  const supportTicketId = await mirrorSupportReply(conversation, content, received);
  const task = await createMarketingTask({
    agentId: "dana",
    taskType: "inbound_email_reply",
    title: `Inbound email reply · ${text(message.subject) ?? senderEmail}`,
    objective: "Analyze this inbound email in context, update the commercial understanding, and prepare the safest useful reply draft. Do not send anything. Escalate pricing, partnership, legal, guarantees, discounts, spend, or commitments for CEO review.",
    priority: "urgent",
    channel: "email",
    source: "autonomous_orchestrator",
    leadId: conversation.lead_id ?? null,
    conversationId: conversation.id,
    input: {
      inbound_message_id: inserted.id,
      zoho_message_id: messageId,
      sender: { name: text(message.sender), email: senderEmail },
      subject: text(message.subject),
      content,
      in_reply_to: inReplyTo,
      internet_message_id: internetMessageId,
      support_ticket_id: supportTicketId,
      prior_conversation: {
        id: conversation.id,
        stage: conversation.stage,
        lead_id: conversation.lead_id,
        contact_id: conversation.contact_id,
        metadata: record(conversation.metadata),
      },
    },
    metadata: { day: params.day, inbound_email: true, provider: "zoho_mail", poller: "recent_window_v2", outcome: "approval_ready_reply" },
    idempotencyKey: `zoho-inbound-reply:${messageId}`,
    maxRetries: 1,
  });

  return { status: "ingested" as const, taskId: task.id as number };
}

export async function syncZohoRecentInboundEmails({ day, limit = 50 }: { day: string; limit?: number }) {
  const connection = await getZohoMailConnectionState();
  if (connection.status !== "connected" || !connection.accountId || !connection.apiBaseUrl) {
    return { enabled: false, reason: "zoho_connection_incomplete", ingested: 0, duplicates: 0, ignored: 0, unmatched: 0, taskIds: [] as number[] };
  }

  const accessToken = await getZohoDurableAccessToken();
  const base = normalizeZohoBaseUrl(connection.apiBaseUrl, "Zoho Mail API base URL");
  const searchUrl = new URL(`${base}/api/accounts/${encodeURIComponent(connection.accountId)}/messages/search`);
  searchUrl.searchParams.set("searchKey", `fromDate:${zohoDate(day, 1)}`);
  searchUrl.searchParams.set("receivedTime", String(Date.now()));
  searchUrl.searchParams.set("start", "1");
  searchUrl.searchParams.set("limit", String(Math.max(1, Math.min(limit, 100))));
  searchUrl.searchParams.set("includeto", "true");

  const list = await fetchZohoJson<ZohoListResponse>(searchUrl.toString(), accessToken);
  if (list.status?.code !== 200 || !Array.isArray(list.data)) throw new Error("Zoho recent inbound search failed.");

  let ingested = 0;
  let duplicates = 0;
  let ignored = 0;
  let unmatched = 0;
  const taskIds: number[] = [];
  for (const message of list.data) {
    const result = await ingestRecentMessage(message, {
      accountId: connection.accountId,
      apiBaseUrl: connection.apiBaseUrl,
      accessToken,
      day,
    });
    if (result.status === "ingested") {
      ingested += 1;
      taskIds.push(result.taskId);
    } else if (result.status === "duplicate") duplicates += 1;
    else if (result.status === "unmatched") unmatched += 1;
    else ignored += 1;
  }

  const db = createAdminClient();
  const now = new Date().toISOString();
  await db.from("marketing_integrations").update({
    last_sync_at: now,
    ...(ingested > 0 ? { last_success_at: now } : {}),
    last_error: null,
    updated_at: now,
  }).eq("provider", "email");

  return { enabled: true, reason: "ok", ingested, duplicates, ignored, unmatched, taskIds };
}
