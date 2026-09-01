import { createAdminClient } from "@/lib/supabase/admin";
import { META_SECRET_NAMES, readMetaSecrets } from "@/lib/marketing/credentials/meta-infisical";
import { getMetaRuntimeConfig } from "./meta";

type FetchLike = typeof fetch;
type PageTokenMap = Record<string, string>;
type MetaErrorPayload = {
  error?: {
    code?: number;
    error_subcode?: number;
    type?: string;
    message?: string;
  };
};
type SafeErrorCategory = "permission" | "unsupported_metric" | "api_version" | "account_capability" | "invalid_request" | "token" | "api_error";
type SafeError = {
  endpoint: string;
  category: SafeErrorCategory;
  message: string;
  code: number | null;
  subcode: number | null;
  graph_version: string;
};

class MetaReadOnlyApiError extends Error {
  constructor(
    readonly code: number | null,
    readonly subcode: number | null,
    readonly apiType: string | null,
    readonly rawMessage: string,
  ) {
    super("Meta read-only request failed.");
  }
}

function classifyMetaError(error: MetaReadOnlyApiError): SafeErrorCategory {
  const message = error.rawMessage.toLowerCase();
  if (error.code === 190) return "token";
  if ([10, 200, 294].includes(error.code ?? -1) || message.includes("permission") || message.includes("permissions")) return "permission";
  if (message.includes("metric") || message.includes("period") || message.includes("insight metric")) return "unsupported_metric";
  if (message.includes("version") || message.includes("deprecated")) return "api_version";
  if (message.includes("professional") || message.includes("business account") || message.includes("creator account") || message.includes("not supported for this object")) return "account_capability";
  if ([100, 803].includes(error.code ?? -1)) return "invalid_request";
  return "api_error";
}

function sanitizeError(endpoint: string, graphVersion: string, error: unknown): SafeError {
  if (error instanceof MetaReadOnlyApiError) {
    const category = classifyMetaError(error);
    return {
      endpoint,
      category,
      message: `Meta read-only ${category.replaceAll("_", " ")} failure.`,
      code: error.code,
      subcode: error.subcode,
      graph_version: graphVersion,
    };
  }
  return {
    endpoint,
    category: "api_error",
    message: "Meta read-only API failure.",
    code: null,
    subcode: null,
    graph_version: graphVersion,
  };
}

async function readJson<T>(url: URL, fetchImpl: FetchLike): Promise<T> {
  const response = await fetchImpl(url, { method: "GET", cache: "no-store" });
  const payload = await response.json().catch(() => ({})) as T & MetaErrorPayload;
  if (!response.ok || payload.error) {
    const metaError = payload.error;
    throw new MetaReadOnlyApiError(
      typeof metaError?.code === "number" ? metaError.code : null,
      typeof metaError?.error_subcode === "number" ? metaError.error_subcode : null,
      typeof metaError?.type === "string" ? metaError.type : null,
      typeof metaError?.message === "string" ? metaError.message : "",
    );
  }
  return payload;
}

async function optionalRead<T>(endpoint: string, url: URL, fetchImpl: FetchLike, errors: SafeError[], graphVersion: string) {
  try {
    return await readJson<T>(url, fetchImpl);
  } catch (error) {
    errors.push(sanitizeError(endpoint, graphVersion, error));
    return null;
  }
}

function graphUrl(base: string, path: string, accessToken: string, params: Record<string, string> = {}) {
  const url = new URL(`${base}/${path.replace(/^\//, "")}`);
  url.searchParams.set("access_token", accessToken);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
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
    graphUrl(config.graphBaseUrl, pageId, pageToken, { fields: "id,name,instagram_business_account{id,username}" }), fetchImpl,
  );
  if (!page.id || !page.name) throw new Error("Facebook Page identity could not be verified.");
  if (page.name.trim().toUpperCase() !== "MLAMH") throw new Error("Connected Facebook Page is not MLAMH.");

  const instagram = page.instagram_business_account;
  if (!instagram?.id) throw new Error("Linked Instagram Professional Account is unavailable.");
  const instagramIdentity = await readJson<{ id?: string; username?: string }>(
    graphUrl(config.graphBaseUrl, instagram.id, pageToken, { fields: "id,username" }), fetchImpl,
  );
  if (!instagramIdentity.id || instagramIdentity.username?.replace(/^@/, "").toLowerCase() !== "mlamhco") {
    throw new Error("Connected Instagram account is not mlamhco.");
  }

  // Insights edges require explicit metric parameters. These are optional probes:
  // identity success remains the core connection result even when insight permissions/capabilities are unavailable.
  const pageInsights = await optionalRead<{ data?: unknown[] }>(
    "facebook_page_insights",
    graphUrl(config.graphBaseUrl, `${pageId}/insights`, pageToken, { metric: "page_post_engagements", period: "day" }),
    fetchImpl, errors, config.graphVersion,
  );
  const instagramInsights = await optionalRead<{ data?: unknown[] }>(
    "instagram_account_insights",
    graphUrl(config.graphBaseUrl, `${instagramIdentity.id}/insights`, pageToken, { metric: "reach", period: "day" }),
    fetchImpl, errors, config.graphVersion,
  );
  const media = await optionalRead<{ data?: Array<{ id?: string }> }>(
    "instagram_media",
    graphUrl(config.graphBaseUrl, `${instagramIdentity.id}/media`, pageToken, { fields: "id" }),
    fetchImpl, errors, config.graphVersion,
  );
  let mediaInsightsAvailable = false;
  const firstMediaId = media?.data?.find((item) => item.id)?.id;
  if (firstMediaId) {
    const mediaInsights = await optionalRead<{ data?: unknown[] }>(
      "instagram_media_insights",
      graphUrl(config.graphBaseUrl, `${firstMediaId}/insights`, pageToken, { metric: "reach,likes,comments,saved,shares" }),
      fetchImpl, errors, config.graphVersion,
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
    readonly_test: { last_sync_at: now, supported_capabilities: capabilities, diagnostics: errors },
  };
  const lastError = errors.length
    ? errors.map((error) => `${error.endpoint}: ${error.category} (code=${error.code ?? "n/a"}, subcode=${error.subcode ?? "n/a"}, graph=${error.graph_version})`).join(" | ")
    : null;
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
