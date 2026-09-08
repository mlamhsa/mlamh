import { NextResponse } from "next/server";

const PACKAGE_NAME = "net.mlamh.app";
const VERIFIED_ANDROID_SHA256 = "C8:B9:16:F0:A1:BF:B1:75:16:D5:ED:BE:DC:20:44:04:B5:33:50:C2:C9:96:25:10:08:25:3B:19:64:B4:FC:62";
const FINGERPRINT_RE = /^(?:[0-9A-Fa-f]{2}:){31}[0-9A-Fa-f]{2}$/;

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = (process.env.MLAMH_ANDROID_SHA256_CERT_FINGERPRINTS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const fingerprints = configured.length > 0 && configured.every((value) => FINGERPRINT_RE.test(value))
    ? configured
    : [VERIFIED_ANDROID_SHA256];

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
