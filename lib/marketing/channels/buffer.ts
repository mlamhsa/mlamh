import { createAdminClient } from "@/lib/supabase/admin";

const BUFFER_API_URL = "https://api.buffer.com";
const EXPECTED_INSTAGRAM = "mlamhco";
const EXPECTED_FACEBOOK = "MLAMH";

type BufferOrganization = {
  id: string;
  name: string;
};

type BufferAccount = {
  id: string;
  organizations: BufferOrganization[];
};

type BufferChannel = {
  id: string;
  name: string | null;
  displayName: string | null;
  service: string;
};

type GraphQLError = {
  message?: string;
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: GraphQLError[];
};

export type BufferConnectionTestResult = {
  ok: boolean;
  accountId?: string;
  instagramChannelId?: string;
  facebookChannelId?: string;
  channels?: Array<{
    id: string;
    service: string;
    name: string | null;
    displayName: string | null;
  }>;
  error?: string;
};

function normalizeChannelLabel(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .replace(/^@+/, "")
    .toLocaleLowerCase("en-US");
}

function safeBufferError(status?: number) {
  if (status === 401 || status === 403) {
    return "Buffer authentication failed. Check the server-side BUFFER_API_KEY and its accountRead permission.";
  }
  if (status === 429) {
    return "Buffer API rate limit reached. Try the connection test again later.";
  }
  if (status && status >= 500) {
    return "Buffer API is temporarily unavailable.";
  }
  return "Buffer connection test failed.";
}

async function bufferGraphQL<T>(apiKey: string, query: string, variables?: Record<string, unknown>) {
  let response: Response;

  try {
    response = await fetch(BUFFER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    throw new Error("Buffer API could not be reached.");
  }

  if (!response.ok) {
    throw new Error(safeBufferError(response.status));
  }

  let payload: GraphQLResponse<T>;
  try {
    payload = (await response.json()) as GraphQLResponse<T>;
  } catch {
    throw new Error("Buffer API returned an invalid response.");
  }

  if (payload.errors?.length || !payload.data) {
    throw new Error("Buffer API rejected the read-only connection query.");
  }

  return payload.data;
}

export class BufferServerAdapter {
  readonly provider = "buffer";
  readonly mode = "read_only" as const;

  private getApiKey() {
    const apiKey = process.env.BUFFER_API_KEY?.trim();
    if (!apiKey) {
      throw new Error("BUFFER_API_KEY is not configured in the server environment.");
    }
    return apiKey;
  }

  async getAccountAndChannels() {
    const apiKey = this.getApiKey();

    const accountData = await bufferGraphQL<{ account: BufferAccount }>(
      apiKey,
      `query MLAMHBufferAccount {
        account {
          id
          organizations {
            id
            name
          }
        }
      }`,
    );

    const organizations = accountData.account.organizations ?? [];
    if (organizations.length === 0) {
      throw new Error("Buffer account has no accessible organizations.");
    }

    const channelGroups = await Promise.all(
      organizations.map(async (organization) => {
        const data = await bufferGraphQL<{ channels: BufferChannel[] }>(
          apiKey,
          `query MLAMHBufferChannels($organizationId: ID!) {
            channels(input: { organizationId: $organizationId }) {
              id
              name
              displayName
              service
            }
          }`,
          { organizationId: organization.id },
        );

        return data.channels ?? [];
      }),
    );

    return {
      accountId: accountData.account.id,
      channels: channelGroups.flat(),
    };
  }

  async testConnection(): Promise<BufferConnectionTestResult> {
    try {
      const { accountId, channels } = await this.getAccountAndChannels();

      const instagram = channels.find((channel) => {
        if (normalizeChannelLabel(channel.service) !== "instagram") return false;
        const expected = normalizeChannelLabel(EXPECTED_INSTAGRAM);
        return normalizeChannelLabel(channel.name) === expected || normalizeChannelLabel(channel.displayName) === expected;
      });

      const facebook = channels.find((channel) => {
        if (normalizeChannelLabel(channel.service) !== "facebook") return false;
        const expected = normalizeChannelLabel(EXPECTED_FACEBOOK);
        return normalizeChannelLabel(channel.name) === expected || normalizeChannelLabel(channel.displayName) === expected;
      });

      if (!instagram || !facebook) {
        const missing = [
          !instagram ? `Instagram @${EXPECTED_INSTAGRAM}` : null,
          !facebook ? `Facebook ${EXPECTED_FACEBOOK}` : null,
        ].filter(Boolean).join(" and ");

        return {
          ok: false,
          accountId,
          channels,
          error: `Buffer connection is valid, but the expected channel${missing.includes(" and ") ? "s were" : " was"} not found: ${missing}.`,
        };
      }

      return {
        ok: true,
        accountId,
        instagramChannelId: instagram.id,
        facebookChannelId: facebook.id,
        channels,
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Buffer connection test failed.",
      };
    }
  }
}

export const bufferServerAdapter = new BufferServerAdapter();

export async function testAndPersistBufferConnection(): Promise<BufferConnectionTestResult> {
  const db = createAdminClient();
  const { data: integration, error: readError } = await db
    .from("marketing_integrations")
    .select("id,configuration_state")
    .eq("provider", "buffer")
    .maybeSingle();

  if (readError || !integration) {
    throw new Error("Buffer integration record is not configured.");
  }

  const currentConfiguration = integration.configuration_state && typeof integration.configuration_state === "object" && !Array.isArray(integration.configuration_state)
    ? integration.configuration_state as Record<string, unknown>
    : {};

  const result = await bufferServerAdapter.testConnection();
  const now = new Date().toISOString();

  if (result.ok && result.instagramChannelId && result.facebookChannelId) {
    const { error: updateError } = await db
      .from("marketing_integrations")
      .update({
        status: "connected",
        configuration_state: {
          ...currentConfiguration,
          connection_tested: true,
          instagram_channel_id: result.instagramChannelId,
          facebook_channel_id: result.facebookChannelId,
        },
        last_success_at: now,
        last_sync_at: now,
        last_error: null,
        updated_at: now,
      })
      .eq("id", integration.id);

    if (updateError) {
      throw new Error("Buffer connection succeeded, but integration state could not be saved.");
    }

    return result;
  }

  const safeError = result.error || "Buffer connection test failed.";
  const { error: updateError } = await db
    .from("marketing_integrations")
    .update({
      status: "error",
      configuration_state: {
        ...currentConfiguration,
        connection_tested: false,
        instagram_channel_id: null,
        facebook_channel_id: null,
      },
      last_sync_at: now,
      last_error: safeError,
      updated_at: now,
    })
    .eq("id", integration.id);

  if (updateError) {
    throw new Error("Buffer connection failed and integration state could not be saved.");
  }

  return { ...result, error: safeError };
}
