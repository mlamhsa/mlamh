import { getZohoDurableAccessToken, getZohoMailConnectionState } from "./zoho-mail";
import { normalizeZohoBaseUrl, sanitizeZohoError } from "./zoho-mail-core";

export type ZohoNativeReplyResult = {
  ok: boolean;
  externalId?: string;
  metadata?: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;
};

type ZohoReplyResponse = {
  status?: { code?: number; description?: string };
  data?: {
    messageId?: string | number;
    mailId?: string;
    threadId?: string | number;
  };
};

export async function replyToZohoMessage({
  messageId,
  text,
  fetchImpl = fetch,
}: {
  messageId: string;
  text: string;
  fetchImpl?: typeof fetch;
}): Promise<ZohoNativeReplyResult> {
  try {
    const targetMessageId = messageId.trim();
    if (!targetMessageId) {
      return { ok: false, errorCode: "MISSING_REPLY_TARGET", errorMessage: "Zoho reply target is missing." };
    }
    if (!text.trim()) {
      return { ok: false, errorCode: "MISSING_REPLY_CONTENT", errorMessage: "Zoho reply content is missing." };
    }

    const connection = await getZohoMailConnectionState();
    if (connection.status !== "connected" || !connection.accountId || !connection.apiBaseUrl) {
      return { ok: false, errorCode: "ZOHO_NOT_CONNECTED", errorMessage: "Zoho Mail is not connected for reply execution." };
    }

    const accessToken = await getZohoDurableAccessToken();
    const base = normalizeZohoBaseUrl(connection.apiBaseUrl, "Zoho Mail API base URL");
    const response = await fetchImpl(
      `${base}/api/accounts/${encodeURIComponent(connection.accountId)}/messages/${encodeURIComponent(targetMessageId)}`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
        body: JSON.stringify({
          action: "reply",
          fromAddress: connection.fromAddress,
          content: text,
          mailFormat: "plaintext",
        }),
        cache: "no-store",
      },
    );

    const payload = await response.json().catch(() => ({})) as ZohoReplyResponse;
    const providerMessageId = payload.data?.messageId;
    if (!response.ok || payload.status?.code !== 200 || providerMessageId === undefined || providerMessageId === null) {
      return { ok: false, errorCode: "ZOHO_REPLY_FAILED", errorMessage: "Zoho Mail reply request failed." };
    }

    return {
      ok: true,
      externalId: String(providerMessageId),
      metadata: {
        provider: "zoho_mail",
        external_message_id: String(providerMessageId),
        mail_id: payload.data?.mailId ?? null,
        thread_id: payload.data?.threadId === undefined || payload.data?.threadId === null ? null : String(payload.data.threadId),
        reply_to_message_id: targetMessageId,
        native_reply: true,
      },
    };
  } catch (error) {
    return { ok: false, errorCode: "ZOHO_REPLY_FAILED", errorMessage: sanitizeZohoError(error) };
  }
}
