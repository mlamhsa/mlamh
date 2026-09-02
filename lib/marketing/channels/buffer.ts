import { createAdminClient } from "@/lib/supabase/admin";
import type { MarketingChannelAdapter, MarketingPublishInput, MarketingPublishResult } from "./types";

const BUFFER_API_URL = "https://api.buffer.com";
const EXPECTED_INSTAGRAM = "mlamhco";
const EXPECTED_FACEBOOK = "MLAMH";

type BufferOrganization = { id: string; name: string };
type BufferAccount = { id: string; organizations: BufferOrganization[] };
type BufferChannel = { id: string; name: string | null; displayName: string | null; service: string };
type GraphQLError = { message?: string };
type GraphQLResponse<T> = { data?: T; errors?: GraphQLError[] };
type BufferTarget = "instagram" | "facebook";
type BufferCreatePostPayload =
  | { __typename: "PostActionSuccess"; post: { id: string } }
  | { __typename: string; message?: string };

export type BufferConnectionTestResult = {
  ok: boolean;
  accountId?: string;
  instagramChannelId?: string;
  facebookChannelId?: string;
  channels?: Array<{ id: string; service: string; name: string | null; displayName: string | null }>;
  error?: string;
};

function normalizeChannelLabel(value: string | null | undefined) {
  return (value ?? "").trim().replace(/^@+/, "").toLocaleLowerCase("en-US");
}

export function safeBufferError(status?: number) {
  if (status === 401 || status === 403) return "Buffer authentication failed.";
  if (status === 429) return "Buffer API rate limit reached. Try again later.";
  if (status && status >= 500) return "Buffer API is temporarily unavailable.";
  return "Buffer publishing request failed.";
}

async function bufferGraphQL<T>(apiKey: string, query: string, variables?: Record<string, unknown>, operation = "request") {
  let response: Response;
  try {
    response = await fetch(BUFFER_API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    throw new Error("Buffer API could not be reached.");
  }
  if (!response.ok) throw new Error(safeBufferError(response.status));
  let payload: GraphQLResponse<T>;
  try { payload = (await response.json()) as GraphQLResponse<T>; }
  catch { throw new Error("Buffer API returned an invalid response."); }
  if (payload.errors?.length || !payload.data) throw new Error(`Buffer API rejected the ${operation}.`);
  return payload.data;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function safeMutationMessage(value: unknown) {
  const message = stringValue(value);
  return message ? message.slice(0, 240) : "Buffer rejected the post mutation.";
}

export class BufferServerAdapter implements MarketingChannelAdapter {
  readonly provider = "buffer";
  readonly capabilities = ["publish"] as const;

  private getApiKey() {
    const apiKey = process.env.BUFFER_API_KEY?.trim();
    if (!apiKey) throw new Error("BUFFER_API_KEY is not configured in the server environment.");
    return apiKey;
  }

  async getStatus() {
    const db = createAdminClient();
    const { data } = await db.from("marketing_integrations").select("status,configuration_state").eq("provider", "buffer").maybeSingle();
    const config = data?.configuration_state && typeof data.configuration_state === "object" && !Array.isArray(data.configuration_state)
      ? data.configuration_state as Record<string, unknown> : {};
    return data?.status === "connected" && config.connection_tested === true ? "connected" as const : "setup_required" as const;
  }

  private async getConfiguredTargetId(target: BufferTarget) {
    const db = createAdminClient();
    const { data, error } = await db.from("marketing_integrations").select("status,configuration_state").eq("provider", "buffer").maybeSingle();
    if (error || !data || data.status !== "connected") throw new Error("Buffer integration is not connected.");
    const config = data.configuration_state && typeof data.configuration_state === "object" && !Array.isArray(data.configuration_state)
      ? data.configuration_state as Record<string, unknown> : {};
    if (config.connection_tested !== true) throw new Error("Buffer connection has not been verified.");
    const channelId = stringValue(config[target === "instagram" ? "instagram_channel_id" : "facebook_channel_id"]);
    if (!channelId) throw new Error(`Buffer ${target} channel is not configured.`);
    return channelId;
  }

  async getAccountAndChannels() {
    const apiKey = this.getApiKey();
    const accountData = await bufferGraphQL<{ account: BufferAccount }>(apiKey, `query MLAMHBufferAccount { account { id organizations { id name } } }`, undefined, "connection query");
    const organizations = accountData.account.organizations ?? [];
    if (organizations.length === 0) throw new Error("Buffer account has no accessible organizations.");
    const channelGroups = await Promise.all(organizations.map(async (organization) => {
      const data = await bufferGraphQL<{ channels: BufferChannel[] }>(apiKey, `query MLAMHBufferChannels($organizationId: OrganizationId!) { channels(input: { organizationId: $organizationId }) { id name displayName service } }`, { organizationId: organization.id }, "connection query");
      return data.channels ?? [];
    }));
    return { accountId: accountData.account.id, channels: channelGroups.flat() };
  }

  async testConnection(): Promise<BufferConnectionTestResult> {
    try {
      const { accountId, channels } = await this.getAccountAndChannels();
      const instagram = channels.find((channel) => normalizeChannelLabel(channel.service) === "instagram" && [channel.name, channel.displayName].some((v) => normalizeChannelLabel(v) === normalizeChannelLabel(EXPECTED_INSTAGRAM)));
      const facebook = channels.find((channel) => normalizeChannelLabel(channel.service) === "facebook" && [channel.name, channel.displayName].some((v) => normalizeChannelLabel(v) === normalizeChannelLabel(EXPECTED_FACEBOOK)));
      if (!instagram || !facebook) {
        const missing = [!instagram ? `Instagram @${EXPECTED_INSTAGRAM}` : null, !facebook ? `Facebook ${EXPECTED_FACEBOOK}` : null].filter(Boolean).join(" and ");
        return { ok: false, accountId, channels, error: `Buffer connection is valid, but expected channels were not found: ${missing}.` };
      }
      return { ok: true, accountId, instagramChannelId: instagram.id, facebookChannelId: facebook.id, channels };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Buffer connection test failed." };
    }
  }

  async publish(input: MarketingPublishInput): Promise<MarketingPublishResult> {
    const target = input.target === "instagram" || input.target === "facebook" ? input.target : null;
    if (!target) return { ok: false, errorCode: "invalid_target", errorMessage: "Buffer publish target must be instagram or facebook." };
    if (!input.idempotencyKey) return { ok: false, errorCode: "missing_idempotency", errorMessage: "Buffer publish requires an idempotency key." };
    const channelId = await this.getConfiguredTargetId(target);
    const apiKey = this.getApiKey();
    const text = input.text?.trim() ?? "";
    const assets = input.assetUrls ?? [];
    if (!text && assets.length === 0) return { ok: false, errorCode: "empty_content", errorMessage: "Buffer publish content is empty." };

    try {
      const scheduled = Boolean(input.scheduledAt);
      const data = await bufferGraphQL<{ createPost: BufferCreatePostPayload }>(apiKey, `mutation MLAMHBufferCreatePost($input: CreatePostInput!) {
        createPost(input: $input) {
          __typename
          ... on PostActionSuccess { post { id } }
          ... on MutationError { message }
        }
      }`, {
        input: {
          channelId,
          text,
          schedulingType: "automatic",
          mode: scheduled ? "customScheduled" : "shareNow",
          assets: assets.map((url) => ({ image: { url } })),
          ...(scheduled ? { dueAt: input.scheduledAt } : {}),
        },
      }, scheduled ? "schedule request" : "publish request");

      const payload = data.createPost;
      if (!("post" in payload)) {
        return { ok: false, errorCode: "buffer_mutation_error", errorMessage: safeMutationMessage("message" in payload ? payload.message : null) };
      }

      const externalId = stringValue(payload.post?.id);
      if (!externalId) return { ok: false, errorCode: "missing_external_id", errorMessage: "Buffer accepted the request but did not return a post id." };
      return { ok: true, externalId, metadata: { provider: "buffer", target, channel_id: channelId, mode: scheduled ? "schedule" : "publish_now" } };
    } catch (error) {
      return { ok: false, errorCode: "buffer_api_error", errorMessage: error instanceof Error ? error.message : "Buffer publishing request failed." };
    }
  }
}

export const bufferServerAdapter = new BufferServerAdapter();

export async function testAndPersistBufferConnection(): Promise<BufferConnectionTestResult> {
  const db = createAdminClient();
  const { data: integration, error: readError } = await db.from("marketing_integrations").select("id,configuration_state").eq("provider", "buffer").maybeSingle();
  if (readError || !integration) throw new Error("Buffer integration record is not configured.");
  const currentConfiguration = integration.configuration_state && typeof integration.configuration_state === "object" && !Array.isArray(integration.configuration_state) ? integration.configuration_state as Record<string, unknown> : {};
  const result = await bufferServerAdapter.testConnection();
  const now = new Date().toISOString();
  if (result.ok && result.instagramChannelId && result.facebookChannelId) {
    const { error: updateError } = await db.from("marketing_integrations").update({ status: "connected", configuration_state: { ...currentConfiguration, connection_tested: true, instagram_channel_id: result.instagramChannelId, facebook_channel_id: result.facebookChannelId }, last_success_at: now, last_sync_at: now, last_error: null, updated_at: now }).eq("id", integration.id);
    if (updateError) throw new Error("Buffer connection succeeded, but integration state could not be saved.");
    return result;
  }
  const safeError = result.error || "Buffer connection test failed.";
  const { error: updateError } = await db.from("marketing_integrations").update({ status: "error", configuration_state: { ...currentConfiguration, connection_tested: false, instagram_channel_id: null, facebook_channel_id: null }, last_sync_at: now, last_error: safeError, updated_at: now }).eq("id", integration.id);
  if (updateError) throw new Error("Buffer connection failed and integration state could not be saved.");
  return { ...result, error: safeError };
}
