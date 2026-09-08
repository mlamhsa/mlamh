import * as Sentry from "@sentry/nextjs";

const DEFAULT_SENTRY_DSN =
  "https://c28ffcb92f580d9a1bf98382797f8e95@o4512051431800832.ingest.de.sentry.io/4512051443400784";
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? DEFAULT_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: process.env.NODE_ENV === "production",
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  sendDefaultPii: false,
  tracesSampleRate: 0,
  enableLogs: false,
  beforeSend(event) {
    if (event.request) {
      event.request.data = undefined;
      event.request.cookies = undefined;

      if (event.request.headers) {
        const headers = { ...event.request.headers };
        for (const key of Object.keys(headers)) {
          const normalizedKey = key.toLowerCase();
          if (
            normalizedKey === "authorization" ||
            normalizedKey === "cookie" ||
            normalizedKey === "set-cookie" ||
            normalizedKey === "x-api-key"
          ) {
            delete headers[key];
          }
        }
        event.request.headers = headers;
      }
    }

    if (event.user) {
      event.user = event.user.id ? { id: event.user.id } : undefined;
    }

    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
