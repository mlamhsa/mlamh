import * as Sentry from "@sentry/nextjs";

function verifiedSourceMapMarker() {
  throw new Error("MLAMH Sentry source maps verified");
}

export async function GET() {
  try {
    verifiedSourceMapMarker();
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        smoke_test: "sourcemap_verified",
        surface: "api",
      },
    });
    await Sentry.flush(2000);
  }

  return Response.json({ ok: true, sentry: "source-maps-verified-dispatched" });
}
