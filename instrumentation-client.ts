import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn) && process.env.NODE_ENV === "production",
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
