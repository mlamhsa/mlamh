const PGRST303_RETRY_DELAY_MS = 1_000;

function sleep(milliseconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function isFutureJwtRejection(response: Response) {
  if (response.status !== 401) return false;

  try {
    const payload = (await response.clone().json()) as {
      code?: unknown;
      message?: unknown;
    };

    return (
      payload.code === "PGRST303" &&
      payload.message === "JWT issued at future"
    );
  } catch {
    return false;
  }
}

/**
 * Temporary resilience for the hosted PostgREST stale-time-cache incident.
 *
 * Retry exactly once and only when PostgREST rejects the request with the
 * known PGRST303 "JWT issued at future" response. All other responses are
 * returned untouched. The first request is rejected before database work is
 * executed, so replaying that rejected request does not duplicate a write.
 */
export async function fetchWithPgrst303Retry(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const request = new Request(input, init);
  const firstResponse = await fetch(request.clone());

  if (!(await isFutureJwtRejection(firstResponse))) {
    return firstResponse;
  }

  let pathname = "unknown";
  try {
    pathname = new URL(request.url).pathname;
  } catch {
    // Keep telemetry free of raw request details if URL parsing fails.
  }

  console.warn("[Supabase PGRST303 retry]", { pathname });

  await sleep(PGRST303_RETRY_DELAY_MS);
  return fetch(request.clone());
}
