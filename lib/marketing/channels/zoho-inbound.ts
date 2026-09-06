import { createAdminClient } from "@/lib/supabase/admin";
import { createMarketingTask } from "@/lib/marketing/tasks/service";
import {
  getZohoDurableAccessToken,
  getZohoMailConnectionState,
} from "./zoho-mail";
import { normalizeZohoBaseUrl } from "./zoho-mail-core";

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

type ZohoListResponse = {
  status?: { code?: number; description?: string };
  data?: ZohoSearchMessage[];
};

type ZohoContentResponse = {
  status?: { code?: number; description?: string };
  data?: { messageId?: string | number; content?: string };
};

type ZohoHeaderResponse = {
  status?: { code?: number; description?: string };
  data?: {
    messageId?: string | number;
    headerContent?: Record<string, string[] | string>;
  };
};

function record(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeEmail(value: unknown) {
  const email = text(value)?.toLowerCase() ?? null;
  return email && email.includes("@") ? email : null;
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

export function htmlEmailToPlainText(value: string) {
  return decodeHtmlEntities(
    value
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<\/p\s*>/gi, "\n")
      .replace(/<\/div\s*>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function headerValue(headers: Record<string, string[] | string> | undefined, name: string) {
  if (!headers) return null;
  const key = Object.keys(headers).find((candidate) => candidate.toLowerCase() === name.toLowerCase());
  if (!key) return null;
  const value = headers[key];
  if (Array.isArray(value)) return text(value[0]);
  return text(value);
}

function receivedAt(message: ZohoSearchMessage) {
  const raw = message.receivedtime ?? message.receivedTime;
  const ms = Number(raw);
  return Number.isFinite(ms) && ms > 0 ? new Date(ms).toISOString() : new Date().toISOString();
}

async function fetchZohoJson<T>(url: string, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Zoho-oauthtoken ${accessToken}`,
    },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({})) as T;
  if (!response.ok) throw new Error(`Zoho inbound request failed with status ${response.status}.`);
  return payload;
}

async function findConversationForInbound({
  inReplyTo,
  senderEmail,
}: {
  inReplyTo: string | null;
  senderEmail: string;
}) {
  const db = createAdminClient();

  if (inReplyTo) {
    const { data: job } = await db
      .from("marketing_channel_jobs")
      .select("task_id")
      .eq("channel", "email")
      .eq("status", "published")
      .contains("result", { mail_id: inReplyTo })
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (job?.task_id) {
      const { data: task } = await db
        .from("marketing_tasks")
        .select("conversation_id")
        .eq("id", job.task_id)
        .maybeSingle();
      if (task?.conversation_id) {
        const { data: conversation } = await db
          .from("marketing_conversations")
          .select("*")
          .eq("id", task.conversation_id)
          .maybeSingle();
        if (conversation) return conversation;
      }
    }
  }

  const { data: contact } = await db
    .from("marketing_contacts")
    .select("id")
    .ilike("email", senderEmail)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (contact?.id) {
    const { data: conversation } = await db
      .from("marketing_conversations")
      .select("*")
      .eq("contact_id", contact.id)
      .eq("status", "open")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (conversation) return conversation;
  }

  return null;
}

async function ensureContact(senderEmail: string, senderName: string | null) {
  const db = createAdminClient();
  const { data: existing } = await db
    .from("marketing_contacts")
    .select("id,contact_name,email")
    .ilike("email", senderEmail)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing?.id) return existing.id as number;

  const { data: created, error } = await db
    .from("marketing_contacts")
    .insert({
      contact_name: senderName,
      email: senderEmail,
      metadata: {
        source: "zoho_inbound",
        consent_basis: "inbound_business_contact",
        captured_from: "hello@mlamh.net",
      },
    })
    .select("id")
    .single();
  if (error || !created) throw new Error(`[zoho_inbound.contact] ${error?.message ?? "insert failed"}`);
  return created.id as number;
}

async function ensureConversation({
  senderEmail,
  senderName,
  threadId,
  messageId,
}: {
  senderEmail: string;
  senderName: string | null;
  threadId: string | null;
  messageId: string;
}) {
  const db = createAdminClient();
  const contactId = await ensureContact(senderEmail, senderName);
  const externalThreadId = `zoho:${threadId ?? messageId}`;
  const { data: existing } = await db
    .from("marketing_conversations")
    .select("*")
    .eq("channel", "email")
    .eq("external_thread_id", externalThreadId)
    .maybeSingle();
  if (existing) return existing;

  const now = new Date().toISOString();
  const { data: created, error } = await db
    .from("marketing_conversations")
    .insert({
      channel: "email",
      external_thread_id: externalThreadId,
      contact_id: contactId,
      assigned_agent_id: "dana",
      status: "open",
      stage: "new",
      last_message_at: now,
      unread_count: 0,
      priority: "high",
      tags: ["email_inbound", "dana"],
      metadata: { source_of_truth: "zoho_mail", sender_email: senderEmail },
    })
    .select("*")
    .single();
  if (error || !created) throw new Error(`[zoho_inbound.conversation] ${error?.message ?? "insert failed"}`);
  return created;
}

async function mirrorIntoSupportTicket(conversation: Record<string, unknown>, content: string, received: string) {
  const metadata = record(conversation.metadata);
  const refs = Array.isArray(metadata.source_references) ? metadata.source_references : [];
  const ticketNumber = refs
    .map((value) => text(value))
    .find((value) => value?.startsWith("support-ticket:"))
    ?.replace(/^support-ticket:/, "");
  if (!ticketNumber) return null;

  const db = createAdminClient();
  const { data: ticket } = await db
    .from("support_tickets")
    .select("id")
    .eq("ticket_number", ticketNumber)
    .maybeSingle();
  if (!ticket?.id) return null;

  const { error } = await db.from("support_messages").insert({
    ticket_id: ticket.id,
    sender_type: "guest",
    message: content,
    is_read: false,
  });
  if (error) throw new Error(`[zoho_inbound.support_message] ${error.message}`);
  await db.from("support_tickets").update({
    status: "in_progress",
    last_message_at: received,
    updated_at: new Date().toISOString(),
  }).eq("id", ticket.id);
  return ticket.id as number;
}

async function ingestMessage({
  message,
  accountId,
  apiBaseUrl,
  accessToken,
  day,
}: {
  message: ZohoSearchMessage;
  accountId: string;
  apiBaseUrl: string;
  accessToken: string;
  day: string;
}) {
  const db = createAdminClient();
  const messageId = String(message.messageId ?? "").trim();
  const folderId = String(message.folderId ?? "").trim();
  const senderEmail = normalizeEmail(message.fromAddress);
  if (!messageId || !folderId || !senderEmail || senderEmail === "hello@mlamh.net") return { status: "ignored" as const };

  const { data: duplicate } = await db
    .from("marketing_messages")
    .select("id")
    .eq("external_message_id", messageId)
    .limit(1)
    .maybeSingle();
  if (duplicate?.id) return { status: "duplicate" as const };

  const base = normalizeZohoBaseUrl(apiBaseUrl, "Zoho Mail API base URL");
  const [contentResponse, headerResponse] = await Promise.all([
    fetchZohoJson<ZohoContentResponse>(`${base}/api/accounts/${encodeURIComponent(accountId)}/folders/${encodeURIComponent(folderId)}/messages/${encodeURIComponent(messageId)}/content?includeBlockContent=false`, accessToken),
    fetchZohoJson<ZohoHeaderResponse>(`${base}/api/accounts/${encodeURIComponent(accountId)}/folders/${encodeURIComponent(folderId)}/messages/${encodeURIComponent(messageId)}/header?raw=false`, accessToken),
  ]);
  if (contentResponse.status?.code !== 200) throw new Error("Zoho inbound content lookup failed.");
  if (headerResponse.status?.code !== 200) throw new Error("Zoho inbound header lookup failed.");

  const content = htmlEmailToPlainText(contentResponse.data?.content ?? message.summary ?? "");
  if (!content) return { status: "ignored" as const };
  const headers = headerResponse.data?.headerContent;
  const inReplyTo = headerValue(headers, "In-Reply-To");
  const internetMessageId = headerValue(headers, "Message-Id");
  const threadId = text(message.threadId === undefined || message.threadId === null ? null : String(message.threadId));
  const received = receivedAt(message);

  let conversation = await findConversationForInbound({ inReplyTo, senderEmail });
  if (!conversation) {
    conversation = await ensureConversation({
      senderEmail,
      senderName: text(message.sender),
      threadId,
      messageId,
    });
  }

  const conversationMetadata = record(conversation.metadata);
  const nextMetadata = {
    ...conversationMetadata,
    zoho_thread_id: threadId ?? conversationMetadata.zoho_thread_id ?? null,
    last_inbound_message_id: messageId,
    last_inbound_internet_message_id: internetMessageId,
  };

  const { data: inserted, error: insertError } = await db
    .from("marketing_messages")
    .insert({
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
      },
    })
    .select("id")
    .single();
  if (insertError || !inserted) throw new Error(`[zoho_inbound.message] ${insertError?.message ?? "insert failed"}`);

  await db.from("marketing_conversations").update({
    stage: "replied",
    last_message_at: received,
    unread_count: Math.max(0, Number(conversation.unread_count ?? 0)) + 1,
    assigned_agent_id: "dana",
    metadata: nextMetadata,
    updated_at: new Date().toISOString(),
  }).eq("id", conversation.id);

  if (conversation.lead_id) {
    await db.from("marketing_leads").update({
      stage: "replied",
      last_contact_at: received,
      updated_at: new Date().toISOString(),
    }).eq("id", conversation.lead_id).in("stage", ["new", "contacted"]);
    await db.from("marketing_outreach").update({
      reply_status: "replied",
      updated_at: new Date().toISOString(),
    }).eq("lead_id", conversation.lead_id).eq("channel", "email").eq("send_status", "sent");
  }

  const supportTicketId = await mirrorIntoSupportTicket(conversation, content, received);
  const task = await createMarketingTask({
    agentId: "dana",
    taskType: "inbound_email_reply",
    title: `Inbound email reply · ${text(message.subject) ?? senderEmail}`,
    objective: "Analyze this inbound email in the context of the existing MLAMH conversation, update the commercial understanding, and prepare the safest useful reply draft. Do not send anything. Escalate pricing, partnership, legal, guarantees, discounts, spend, or commitments for CEO review.",
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
        metadata: conversationMetadata,
      },
    },
    metadata: { day, inbound_email: true, provider: "zoho_mail", outcome: "approval_ready_reply" },
    idempotencyKey: `zoho-inbound-reply:${messageId}`,
    maxRetries: 1,
  });

  await db.from("marketing_agent_activity").insert({
    agent_id: "dana",
    task_id: task.id,
    action: "inbound_email_ingested",
    reason: "Zoho inbound email was linked to an MLAMH conversation and queued for Dana.",
    channel: "email",
    result: { conversation_id: conversation.id, marketing_message_id: inserted.id, support_ticket_id: supportTicketId },
  });

  return { status: "ingested" as const, taskId: task.id as number, conversationId: conversation.id as number };
}

export async function syncZohoInboundEmails({ day, limit = 20 }: { day: string; limit?: number }) {
  const db = createAdminClient();
  const { data: integration, error } = await db
    .from("marketing_integrations")
    .select("status,capabilities,configuration_state")
    .eq("provider", "email")
    .maybeSingle();
  if (error || !integration || integration.status !== "connected") {
    return { enabled: false, reason: "email_not_connected", ingested: 0, duplicates: 0, ignored: 0, taskIds: [] as number[] };
  }

  const state = record(integration.configuration_state);
  const scopes = Array.isArray(state.oauth_scopes) ? state.oauth_scopes.map(String) : [];
  const hasReadScope = scopes.includes("ZohoMail.messages.READ") || scopes.includes("ZohoMail.messages.ALL");
  if (!hasReadScope) {
    return { enabled: false, reason: "zoho_read_reauthorization_required", ingested: 0, duplicates: 0, ignored: 0, taskIds: [] as number[] };
  }

  const connection = await getZohoMailConnectionState();
  if (connection.status !== "connected" || !connection.accountId || !connection.apiBaseUrl) {
    return { enabled: false, reason: "zoho_connection_incomplete", ingested: 0, duplicates: 0, ignored: 0, taskIds: [] as number[] };
  }

  const accessToken = await getZohoDurableAccessToken();
  const safeLimit = Math.max(1, Math.min(limit, 50));
  const searchUrl = new URL(`${normalizeZohoBaseUrl(connection.apiBaseUrl, "Zoho Mail API base URL")}/api/accounts/${encodeURIComponent(connection.accountId)}/messages/search`);
  searchUrl.searchParams.set("searchKey", "newMails");
  searchUrl.searchParams.set("receivedTime", String(Date.now()));
  searchUrl.searchParams.set("start", "1");
  searchUrl.searchParams.set("limit", String(safeLimit));
  searchUrl.searchParams.set("includeto", "true");

  const list = await fetchZohoJson<ZohoListResponse>(searchUrl.toString(), accessToken);
  if (list.status?.code !== 200 || !Array.isArray(list.data)) throw new Error("Zoho inbound message search failed.");

  let ingested = 0;
  let duplicates = 0;
  let ignored = 0;
  const taskIds: number[] = [];
  for (const message of list.data) {
    const result = await ingestMessage({
      message,
      accountId: connection.accountId,
      apiBaseUrl: connection.apiBaseUrl,
      accessToken,
      day,
    });
    if (result.status === "ingested") {
      ingested += 1;
      taskIds.push(result.taskId);
    } else if (result.status === "duplicate") duplicates += 1;
    else ignored += 1;
  }

  const now = new Date().toISOString();
  await db.from("marketing_integrations").update({
    capabilities: { send: true, receive: true, tracking: false },
    last_sync_at: now,
    ...(ingested > 0 ? { last_success_at: now } : {}),
    last_error: null,
    updated_at: now,
  }).eq("provider", "email");

  return { enabled: true, reason: "ok", ingested, duplicates, ignored, taskIds };
}
