import { mobileEnvironment } from "@/src/config/environment";
import { supabase } from "@/src/services/supabase";

export class MobileApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message?: string,
    public readonly details?: unknown,
  ) {
    super(message || code);
    this.name = "MobileApiError";
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  authenticated?: boolean;
};

export async function mobileApiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const authenticated = options.authenticated !== false;
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.body !== undefined) headers.set("Content-Type", "application/json");

  if (authenticated) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new MobileApiError(401, "UNAUTHENTICATED");
    }
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${mobileEnvironment.apiBaseUrl}${path}`, {
      ...options,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (error) {
    throw new MobileApiError(0, "NETWORK_ERROR", "Unable to reach MLAMH.", error);
  }

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const code =
      typeof payload?.code === "string"
        ? payload.code
        : typeof payload?.error?.code === "string"
          ? payload.error.code
          : `HTTP_${response.status}`;
    const message =
      typeof payload?.message === "string"
        ? payload.message
        : typeof payload?.error === "string"
          ? payload.error
          : typeof payload?.error?.message === "string"
            ? payload.error.message
            : undefined;
    throw new MobileApiError(response.status, code, message, payload?.details);
  }

  return payload as T;
}
