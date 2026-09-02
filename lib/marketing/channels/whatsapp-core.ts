import { createHmac, timingSafeEqual } from "node:crypto";

export type NormalizedWhatsAppInbound = {
  kind: "message";
  externalEventId: string;
  externalMessageId: string;
  externalThreadId: string;
  senderId: string;
  occurredAt: string | null;
  content: string;
  messageType: string;
  metadata: Record<string, unknown>;
};

export type NormalizedWhatsAppStatus = {
  kind: "status";
  externalEventId: string;
  externalMessageId: string;
  status: string;
  recipientId: string | null;
  occurredAt: string | null;
  metadata: Record<string, unknown>;
};

export type NormalizedWhatsAppEvent = NormalizedWhatsAppInbound | NormalizedWhatsAppStatus;

function record(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function array(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function timestamp(value: unknown) {
  const raw = text(value);
  if (!raw || !/^\d+$/.test(raw)) return null;
  const date = new Date(Number(raw) * 1000);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function messageContent(message: Record<string, unknown>) {
  const type = text(message.type) ?? "unknown";
  if (type === "text") return text(record(message.text).body) ?? "";
  if (type === "button") return text(record(message.button).text) ?? "";
  if (type === "interactive") {
    const interactive = record(message.interactive);
    const buttonReply = record(interactive.button_reply);
    const listReply = record(interactive.list_reply);
    return text(buttonReply.title) ?? text(listReply.title) ?? text(buttonReply.id) ?? text(listReply.id) ?? `[${type}]`;
  }
  return `[${type}]`;
}

export function verifyWhatsAppSignature({ rawBody, signatureHeader, appSecret }: { rawBody: string; signatureHeader: string | null; appSecret: string }) {
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const supplied = signatureHeader.slice("sha256=".length);
  if (!/^[a-f0-9]{64}$/i.test(supplied)) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const a = Buffer.from(supplied, "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function verifyWhatsAppChallenge({ mode, verifyToken, challenge, expectedVerifyToken }: { mode: string | null; verifyToken: string | null; challenge: string | null; expectedVerifyToken: string }) {
  if (mode !== "subscribe" || !challenge || !verifyToken) return null;
  return verifyToken === expectedVerifyToken ? challenge : null;
}

export function normalizeWhatsAppWebhookPayload(payload: unknown): NormalizedWhatsAppEvent[] {
  const root = record(payload);
  if (text(root.object) !== "whatsapp_business_account") return [];
  const events: NormalizedWhatsAppEvent[] = [];

  for (const entryValue of array(root.entry)) {
    const entry = record(entryValue);
    const entryId = text(entry.id) ?? "unknown";
    for (const changeValue of array(entry.changes)) {
      const change = record(changeValue);
      if (text(change.field) !== "messages") continue;
      const value = record(change.value);
      const metadata = record(value.metadata);
      const phoneNumberId = text(metadata.phone_number_id);
      const displayPhoneNumber = text(metadata.display_phone_number);
      const contacts = array(value.contacts).map(record);
      const contactNames = new Map(contacts.map((contact) => [text(contact.wa_id) ?? "", text(record(contact.profile).name)]));

      for (const messageValue of array(value.messages)) {
        const message = record(messageValue);
        const id = text(message.id);
        const from = text(message.from);
        if (!id || !from) continue;
        const type = text(message.type) ?? "unknown";
        events.push({
          kind: "message",
          externalEventId: `${entryId}:message:${id}`,
          externalMessageId: id,
          externalThreadId: from,
          senderId: from,
          occurredAt: timestamp(message.timestamp),
          content: messageContent(message),
          messageType: type,
          metadata: {
            provider: "whatsapp",
            phone_number_id: phoneNumberId,
            display_phone_number: displayPhoneNumber,
            contact_name: contactNames.get(from) ?? null,
            raw_type: type,
          },
        });
      }

      for (const statusValue of array(value.statuses)) {
        const statusRecord = record(statusValue);
        const id = text(statusRecord.id);
        const status = text(statusRecord.status);
        if (!id || !status) continue;
        events.push({
          kind: "status",
          externalEventId: `${entryId}:status:${id}:${status}:${text(statusRecord.timestamp) ?? "unknown"}`,
          externalMessageId: id,
          status,
          recipientId: text(statusRecord.recipient_id),
          occurredAt: timestamp(statusRecord.timestamp),
          metadata: {
            provider: "whatsapp",
            phone_number_id: phoneNumberId,
            display_phone_number: displayPhoneNumber,
            conversation: record(statusRecord.conversation),
            pricing: record(statusRecord.pricing),
            errors: array(statusRecord.errors),
          },
        });
      }
    }
  }

  return events;
}
