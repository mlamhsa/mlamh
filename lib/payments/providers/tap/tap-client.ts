import "server-only";

const TAP_API_BASE_URL = "https://api.tap.company/v2";

type TapRequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
};

function getTapSecretKey() {
  const secretKey = process.env.TAP_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new Error("TAP_SECRET_KEY is not configured.");
  }

  if (secretKey.startsWith("sk_live_") && process.env.PAYMENTS_LIVE_ENABLED !== "true") {
    throw new Error("Tap live payments are disabled. Set PAYMENTS_LIVE_ENABLED=true only after production approval.");
  }

  if (!secretKey.startsWith("sk_test_") && !secretKey.startsWith("sk_live_")) {
    throw new Error("TAP_SECRET_KEY does not use a recognized Tap secret-key format.");
  }

  return secretKey;
}

export async function tapRequest<T>(
  path: string,
  options: TapRequestOptions = {},
): Promise<T> {
  const headers = new Headers({
    Authorization: `Bearer ${getTapSecretKey()}`,
    "Content-Type": "application/json",
  });

  const response = await fetch(`${TAP_API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as T | null;

  if (!response.ok || payload === null) {
    const details =
      payload && typeof payload === "object"
        ? JSON.stringify(payload)
        : "No response body";

    console.error("[Tap API] Request failed", {
      status: response.status,
      path,
      details,
    });

    throw new Error(
      `Tap API request failed with HTTP ${response.status}: ${details}`,
    );
  }

  return payload;
}
