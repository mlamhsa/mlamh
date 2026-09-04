import { NextResponse } from "next/server";

const PACKAGE_NAME = "net.mlamh.app";
const FINGERPRINT_RE = /^(?:[0-9A-Fa-f]{2}:){31}[0-9A-Fa-f]{2}$/;

export const dynamic = "force-dynamic";

export async function GET() {
  const fingerprints = (process.env.MLAMH_ANDROID_SHA256_CERT_FINGERPRINTS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (fingerprints.length === 0 || fingerprints.some((value) => !FINGERPRINT_RE.test(value))) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.json(
    [
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: PACKAGE_NAME,
          sha256_cert_fingerprints: fingerprints,
        },
      },
    ],
    {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300",
        "Content-Type": "application/json",
      },
    },
  );
}
