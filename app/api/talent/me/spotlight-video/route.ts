import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import { talentSpotlightPublicPolicy } from "@/lib/media/talent-spotlight-policy";

export async function GET(request: Request) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });

  return NextResponse.json({
    ok: true,
    policy: talentSpotlightPublicPolicy(),
    asset: null,
  }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(request: Request) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });

  const policy = talentSpotlightPublicPolicy();
  if (!policy.providerConfigured) {
    return NextResponse.json({
      ok: false,
      code: "VIDEO_PROVIDER_NOT_CONFIGURED",
      policy,
    }, { status: 503 });
  }

  // Provider-specific direct-upload tickets are intentionally created only after
  // a managed streaming provider is configured. The app never proxies raw video
  // bytes through Next.js/Vercel and never stores video files in the repository.
  return NextResponse.json({ ok: false, code: "VIDEO_UPLOAD_ADAPTER_PENDING", policy }, { status: 501 });
}
