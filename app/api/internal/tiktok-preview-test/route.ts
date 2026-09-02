import { NextResponse } from "next/server";

const TIKTOK_EVENTS_ENDPOINT =
  "https://business-api.tiktok.com/open_api/v1.3/event/track/";

export async function GET() {
  if (process.env.VERCEL_ENV !== "preview") {
    return NextResponse.json({ ok: false, error: "preview_only" }, { status: 404 });
  }

  const enabled = process.env.TIKTOK_EVENTS_API_ENABLED === "true";
  const pixelId = process.env.TIKTOK_PIXEL_ID?.trim();
  const accessToken = process.env.TIKTOK_EVENTS_API_TOKEN?.trim();
  const testEventCode = process.env.TIKTOK_EVENTS_API_TEST_CODE?.trim();

  if (!enabled || !pixelId || !accessToken || !testEventCode) {
    return NextResponse.json(
      {
        ok: false,
        error: "missing_preview_tiktok_config",
        hasPixelId: Boolean(pixelId),
        hasToken: Boolean(accessToken),
        hasTestEventCode: Boolean(testEventCode),
        enabled,
      },
      { status: 500 },
    );
  }

  const eventId = `preview-test:${Date.now()}`;
  const payload = {
    event_source: "web",
    event_source_id: pixelId,
    test_event_code: testEventCode,
    data: [
      {
        event: "SubmitForm",
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        user: {},
        properties: {
          content_id: "preview-test",
          content_name: "tiktok_events_api_preview_test",
          description: "synthetic_preview_validation",
        },
        page: {
          url: process.env.NEXT_PUBLIC_SITE_URL || "https://mlamh.net",
        },
      },
    ],
  };

  try {
    const response = await fetch(TIKTOK_EVENTS_ENDPOINT, {
      method: "POST",
      headers: {
        "Access-Token": accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const result = (await response.json().catch(() => null)) as
      | { code?: number; message?: string; request_id?: string }
      | null;

    return NextResponse.json(
      {
        ok: response.ok && result?.code === 0,
        status: response.status,
        code: result?.code ?? null,
        message: result?.message ?? null,
        requestId: result?.request_id ?? null,
        eventId,
      },
      { status: response.ok && result?.code === 0 ? 200 : 502 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "request_failed",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}
