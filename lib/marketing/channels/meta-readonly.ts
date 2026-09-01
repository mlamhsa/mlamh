import { createAdminClient } from "@/lib/supabase/admin";
import { META_SECRET_NAMES, readMetaSecrets } from "@/lib/marketing/credentials/meta-infisical";
import { getMetaRuntimeConfig } from "./meta";

type FetchLike = typeof fetch;
type SafeError = { endpoint: string; message: string };
type PageTokenMap = Record<string, string>;

function sanitizeError(endpoint: string): SafeError {
  return { endpoint, message: "Meta read-only request failed." };
}

async function readJson<T>(url: URL, fetchImpl: FetchLike): Promise<T> {
  const response = await fetchImpl(url, { method: "GET", cache: "no-store" });
  const payload = await response.json().catch(() => ({})) as T & { error?: unknown };
  if (!response.ok || payload.error) throw new Error("Meta read-only request failed.");
  return payload;
}

async function optionalRead<T>(endpoint: string, url: URL, fetchImpl: FetchLike, errors: SafeError[]) {
  try {
    return await readJson<T>(url, fetchImpl);
  } catch {
    errors.push(sanitizeError(endpoint));
    return null;
  }
}

function graphUrl(base: string, path: string, accessToken: string, fields?: string) {
  const url = new URL(`${base}/${path.replace(/^\//, "")}`);
  url.searchParams.set("access_token", accessToken);
  if (fields) url.searchParams.set("fields", fields);
  return url;
}

export async function testAndPersistMetaReadOnlyConnection({ fetchImpl = fetch }: { fetchImpl?: FetchLike } = {}) {
  const secrets = await readMetaSecrets([META_SECRET_NAMES.facebookPageTokens]);
  const rawPageTokens = secrets[META_SECRET_NAMES.facebookPageTokens];
  let pageTokens: PageTokenMap;
  try {
    pageTokens = JSON.parse(rawPageTokens) as PageTokenMap;
  } catch {
    throw new Error("Meta Page credential store is invalid.");
  }

  const [pageId, pageToken] = Object.entries(pageTokens).find(([id, token]) => Boolean(id && token)) ?? [];
  if (!pageId || !pageToken) throw new Error("Meta Page credential is unavailable.");

  const config = getMetaRuntimeConfig();
  const errors: SafeError[] = [];
  const page = await readJson<{ id?: string; name?: string; instagram_business_account?: { id?: string; username?: string } }>(
    graphUrl(config.graphBaseUrl, pageId, pageToken, "id,name,instagram_business_account{id,username}"), fetchImpl,
  );
  if (!page.id || !page.name) throw new Error("Facebook Page identity could not be verified.");
  if (page.name.trim().toUpperCase() !== "MLAMH") throw new Error("Connected Facebook Page is not MLAMH.");

  const instagram = page.instagram_business_account;
  if (!instagram?.id) throw new Error("Linked Instagram Professional Account is unavailable.");
  const instagramIdentity = await readJson<{ id?: string; username?: string }>(
    graphUrl(config.graphBaseUrl, instagram.id, pageToken, "id,username"), fetchImpl,
  );
  if (!instagramIdentity.id || instagramIdentity.username?.replace(/^@/, "").toLowerCase() !== "mlamhco") {
    throw new Error("Connected Instagram account is not mlamhco.");
  }

  const pageInsights = await optionalRead<{ data?: unknown[] }>(
    "facebook_page_insights",
    graphUrl(config.graphBaseUrl, `${pageId}/insights`, pageToken, "name,period,values"), fetchImpl, errors,
  );
  const instagramInsights = await optionalRead<{ data?: unknown[] }>(
    "instagram_account_insights",
    graphUrl(config.graphBaseUrl, `${instagramIdentity.id}/insights`, pageToken, "name,period,values"), fetchImpl, errors,
  );
  const media = await optionalRead<{ data?: Array<{ id?: string }> }>(
    "instagram_media",
    graphUrl(config.graphBaseUrl, `${instagramIdentity.id}/media`, pageToken, "id"), fetchImpl, errors,
  );
  let mediaInsightsAvailable = false;
  const firstMediaId = media?.data?.find((item) => item.id)?.id;
  if (firstMediaId) {
    const mediaInsights = await optionalRead<{ data?: unknown[] }>(
      "instagram_media_insights",
      graphUrl(config.graphBaseUrl, `${firstMediaId}/insights`, pageToken, "name,period,values"), fetchImpl, errors,
    );
    mediaInsightsAvailable = Boolean(mediaInsights?.data);
  }

  const now = new Date().toISOString();
  const capabilities = {
    read_identity: true,
    facebook_page_insights: Boolean(pageInsights?.data),
    instagram_account_insights: Boolean(instagramInsights?.data),
    instagram_media_read: Boolean(media?.data),
    instagram_media_insights: mediaInsightsAvailable,
    publishing: false,
    replies: false,
    messages_outbound: false,
    comments_mutation: false,
    webhooks_enabled_by_test: false,
  };

  const db = createAdminClient();
  const { data: existing } = await db.from("marketing_integrations").select("configuration_state").eq("provider", "meta").maybeSingle();
  const previous = existing?.configuration_state && typeof existing.configuration_state === "object" && !Array.isArray(existing.configuration_state)
    ? existing.configuration_state as Record<string, unknown>
    : {};
  const safeConfiguration = {
    ...previous,
    facebook_pages: [{ id: page.id, name: page.name, instagramAccountId: instagramIdentity.id, instagramUsername: instagramIdentity.username ?? null }],
    instagram_login_account_id: instagramIdentity.id,
    readonly_test: { last_sync_at: now, supported_capabilities: capabilities },
  };
  const lastError = errors.length ? errors.map((error) => `${error.endpoint}: ${error.message}`).join(" | ") : null;
  const { error } = await db.from("marketing_integrations").update({
    status: "connected",
    capabilities,
    configuration_state: safeConfiguration,
    last_sync_at: now,
    last_success_at: now,
    last_error: lastError,
    updated_at: now,
  }).eq("provider", "meta");
  if (error) throw new Error("Meta read-only connection result could not be persisted.");

  return { ok: true, page: { id: page.id, name: page.name }, instagram: { id: instagramIdentity.id, username: instagramIdentity.username }, capabilities, warnings: errors };
}
