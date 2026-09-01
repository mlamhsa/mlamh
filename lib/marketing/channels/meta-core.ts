import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type NormalizedMetaInbound = {
  channel: "instagram" | "facebook";
  eventType: "dm" | "comment" | "engagement";
  externalEventId: string;
  externalThreadId: string;
  externalMessageId: string;
  senderId: string | null;
  recipientId: string | null;
  content: string;
  occurredAt: string | null;
  metadata: Record<string, unknown>;
};

export type VerifiedMetaSignedRequest = {
  algorithm: "HMAC-SHA256";
  userId: string;
  issuedAt: number | null;
  rawPayload: Record<string, unknown>;
};

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function timestampToIso(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  const milliseconds = numeric > 10_000_000_000 ? numeric : numeric * 1000;
  return new Date(milliseconds).toISOString();
}

function decodeBase64UrlJson(value: string) {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as unknown;
  } catch {
    return null;
  }
}

export function verifyMetaSignedRequest({
  signedRequest,
  appSecret,
}: {
  signedRequest: string;
  appSecret: string;
}): VerifiedMetaSignedRequest | null {
  const trimmed = signedRequest.trim();
  if (!trimmed || !appSecret) return null;
  const segments = trimmed.split(".");
  if (segments.length !== 2) return null;
  const [encodedSignature, encodedPayload] = segments;
  if (!encodedSignature || !encodedPayload) return null;

  let providedSignature: Buffer;
  try {
    providedSignature = Buffer.from(encodedSignature, "base64url");
  } catch {
    return null;
  }
  const expectedSignature = createHmac("sha256", appSecret)
    .update(encodedPayload, "utf8")
    .digest();
  if (providedSignature.length !== expectedSignature.length || !timingSafeEqual(providedSignature, expectedSignature)) {
    return null;
  }

  const payload = asObject(decodeBase64UrlJson(encodedPayload));
  if (!payload) return null;
  const algorithm = asString(payload.algorithm)?.toUpperCase();
  if (algorithm !== "HMAC-SHA256") return null;
  const userId = asString(payload.user_id);
  if (!userId) return null;
  const issuedAtNumeric = Number(payload.issued_at);

  return {
    algorithm: "HMAC-SHA256",
    userId,
    issuedAt: Number.isFinite(issuedAtNumeric) && issuedAtNumeric > 0 ? issuedAtNumeric : null,
    rawPayload: payload,
  };
}

export function buildMetaLifecycleFingerprint(kind: "deauthorize" | "data-deletion", signedRequest: string) {
  return createHash("sha256").update(`meta:${kind}:${signedRequest}`).digest("hex");
}

export function buildMetaDeletionConfirmationCode(fingerprint: string) {
  return `meta-del-${fingerprint.slice(0, 24)}`;
}

export function verifyMetaWebhookChallenge({
  mode,
  verifyToken,
  challenge,
  expectedVerifyToken,
}: {
  mode: string | null;
  verifyToken: string | null;
  challenge: string | null;
  expectedVerifyToken: string;
}) {
  if (mode !== "subscribe" || !verifyToken || !challenge || !expectedVerifyToken) return null;
  if (verifyToken.length !== expectedVerifyToken.length) return null;
  const left = Buffer.from(verifyToken);
  const right = Buffer.from(expectedVerifyToken);
  if (!timingSafeEqual(left, right)) return null;
  return challenge;
}

export function verifyMetaSignature({
  rawBody,
  signatureHeader,
  appSecret,
}: {
  rawBody: string;
  signatureHeader: string | null;
  appSecret: string;
}) {
  if (!signatureHeader?.startsWith("sha256=") || !appSecret) return false;
  const providedHex = signatureHeader.slice("sha256=".length);
  if (!/^[a-f0-9]{64}$/i.test(providedHex)) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest();
  const provided = Buffer.from(providedHex, "hex");
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export function buildMetaWebhookFingerprint(rawBody: string) {
  return createHash("sha256").update(`meta:${rawBody}`).digest("hex");
}

function fallbackId(prefix: string, value: unknown) {
  return `${prefix}-${createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 32)}`;
}

function normalizeMessagingEntry(
  channel: "instagram" | "facebook",
  entryId: string,
  messaging: unknown,
): NormalizedMetaInbound[] {
  if (!Array.isArray(messaging)) return [];
  return messaging.flatMap((item): NormalizedMetaInbound[] => {
    const event = asObject(item);
    if (!event) return [];
    const sender = asObject(event.sender);
    const recipient = asObject(event.recipient);
    const message = asObject(event.message);
    const senderId = asString(sender?.id);
    const recipientId = asString(recipient?.id) ?? entryId;
    const externalMessageId = asString(message?.mid) ?? fallbackId("message", event);
    const content = asString(message?.text) ?? "";
    if (!content && !message) return [];
    const threadPeer = senderId ?? "unknown";
    return [{
      channel,
      eventType: "dm",
      externalEventId: externalMessageId,
      externalThreadId: `${channel}:dm:${entryId}:${threadPeer}`,
      externalMessageId,
      senderId,
      recipientId,
      content: content || "[non-text message]",
      occurredAt: timestampToIso(event.timestamp),
      metadata: { source: "messaging", raw_event: event },
    }];
  });
}

function normalizeChanges(
  channel: "instagram" | "facebook",
  entryId: string,
  changes: unknown,
): NormalizedMetaInbound[] {
  if (!Array.isArray(changes)) return [];
  return changes.flatMap((item): NormalizedMetaInbound[] => {
    const change = asObject(item);
    const value = asObject(change?.value);
    if (!change || !value) return [];
    const field = asString(change.field) ?? "unknown";
    const itemType = asString(value.item) ?? asString(value.type) ?? field;
    const commentId = asString(value.comment_id) ?? asString(value.id);
    const postId = asString(value.post_id) ?? asString(value.media_id) ?? asString(value.parent_id) ?? entryId;
    const sender = asObject(value.from) ?? asObject(value.sender);
    const senderId = asString(sender?.id) ?? asString(value.from_id);
    const content = asString(value.message) ?? asString(value.text) ?? "";
    const isComment = field === "comments" || itemType === "comment" || Boolean(commentId);
    const externalMessageId = commentId ?? fallbackId(isComment ? "comment" : "engagement", change);
    return [{
      channel,
      eventType: isComment ? "comment" : "engagement",
      externalEventId: externalMessageId,
      externalThreadId: `${channel}:${isComment ? "comment" : "engagement"}:${postId}`,
      externalMessageId,
      senderId,
      recipientId: entryId,
      content: content || `[${itemType}]`,
      occurredAt: timestampToIso(value.created_time ?? value.timestamp),
      metadata: { source: "changes", field, item_type: itemType, raw_change: change },
    }];
  });
}

export function normalizeMetaWebhookPayload(payload: unknown): NormalizedMetaInbound[] {
  const root = asObject(payload);
  const object = asString(root?.object);
  const channel: "instagram" | "facebook" = object === "instagram" ? "instagram" : "facebook";
  const entries = Array.isArray(root?.entry) ? root.entry : [];
  return entries.flatMap((entry): NormalizedMetaInbound[] => {
    const record = asObject(entry);
    if (!record) return [];
    const entryId = asString(record.id) ?? "unknown";
    return [
      ...normalizeMessagingEntry(channel, entryId, record.messaging),
      ...normalizeChanges(channel, entryId, record.changes),
    ];
  });
}

export function buildMetaInboundTaskCandidate(event: NormalizedMetaInbound) {
  return {
    agentId: "faisal",
    taskType: "classify_inbound_social",
    title: `Classify ${event.channel} ${event.eventType}`,
    objective: "Classify the inbound social interaction and recommend the next internal action. No external reply is permitted by this task.",
    approvalLevel: "auto" as const,
    channel: event.channel,
  };
}
