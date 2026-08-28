import "server-only";

const TAP_API_BASE_URL = "https://api.tap.company/v2";

type TapRequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  idempotencyKey?: string;
};

function getTapSecretKey() {
  const secretKey = process.env.TAP_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new Error("TAP_SECRET_KEY is not configured.");
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

  if (options.idempotencyKey) {
    headers.set("Idempotency-Key", options.idempotencyKey);
  }

  const response = await fetch(`${TAP_API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as T | null;

  if (!response.ok || payload === null) {
    throw new Error(`Tap API request failed with HTTP ${response.status}.`);
  }

  return payload;
}
