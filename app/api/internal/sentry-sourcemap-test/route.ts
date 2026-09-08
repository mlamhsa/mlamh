import * as Sentry from "@sentry/nextjs";

function sourceMapMarker() {
  throw new Error("MLAMH Sentry source map verification");
}

export async function GET() {
  try {
    sourceMapMarker();
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        smoke_test: "sourcemap",
        surface: "api",
      },
    });
    await Sentry.flush(2000);
  }

  return Response.json({ ok: true, sentry: "sourcemap-test-dispatched" });
}
