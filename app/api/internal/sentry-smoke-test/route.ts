import * as Sentry from "@sentry/nextjs";

export async function GET() {
  const error = new Error("MLAMH Sentry smoke test");
  Sentry.captureException(error, {
    tags: {
      smoke_test: "true",
      surface: "api",
    },
  });

  await Sentry.flush(2000);

  return Response.json({ ok: true, sentry: "smoke-test-dispatched" });
}
