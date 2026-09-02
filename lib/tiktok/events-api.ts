import { createHash } from "node:crypto";

const TIKTOK_EVENTS_ENDPOINT =
  "https://business-api.tiktok.com/open_api/v1.3/event/track/";

const EVENT_NAME_MAP: Partial<Record<string, string>> = {
  profile_completed: "CompleteRegistration",
  application_submitted: "SubmitForm",
  casting_service_lead: "SubmitForm",
};

function sha256(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function getConfig() {
  const enabled = process.env.TIKTOK_EVENTS_API_ENABLED === "true";
  const pixelId = process.env.TIKTOK_PIXEL_ID?.trim();
  const accessToken = process.env.TIKTOK_EVENTS_API_TOKEN?.trim();

  if (!enabled || !pixelId || !accessToken) return null;

  return {
    pixelId,
    accessToken,
    testEventCode: process.env.TIKTOK_EVENTS_API_TEST_CODE?.trim() || null,
    siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "https://mlamh.net").replace(/\/$/, ""),
  };
}

export async function sendTikTokServerEvent({
  type,
  target,
  targetId,
  actorId,
  metadata = {},
}: {
  type: string;
  target: string;
  targetId: string | number;
  actorId?: string | number | null;
  metadata?: Record<string, unknown>;
}) {
  const config = getConfig();
  const event = EVENT_NAME_MAP[type];

  if (!config || !event) return;

  const eventId = `${type}:${target}:${String(targetId)}`;
  const user =
    actorId === null || actorId === undefined
      ? {}
      : { external_id: sha256(String(actorId)) };

  const payload = {
    event_source: "web",
    event_source_id: config.pixelId,
    ...(config.testEventCode ? { test_event_code: config.testEventCode } : {}),
    data: [
      {
        event,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        user,
        properties: {
          content_id: String(targetId),
          content_name: type,
          description: target,
          ...(typeof metadata.opportunity_id === "number" ||
          typeof metadata.opportunity_id === "string"
            ? { content_category: `opportunity:${String(metadata.opportunity_id)}` }
            : {}),
        },
        page: {
          url: config.siteUrl,
        },
      },
    ],
  };

  try {
    const response = await fetch(TIKTOK_EVENTS_ENDPOINT, {
      method: "POST",
      headers: {
        "Access-Token": config.accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const result = (await response.json().catch(() => null)) as
      | { code?: number; message?: string; request_id?: string }
      | null;

    if (!response.ok || result?.code !== 0) {
      console.error("[tiktok/events-api] event rejected", {
        type,
        target,
        targetId,
        status: response.status,
        code: result?.code,
        message: result?.message,
        requestId: result?.request_id,
      });
    }
  } catch (error) {
    console.error("[tiktok/events-api] request failed", {
      type,
      target,
      targetId,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
