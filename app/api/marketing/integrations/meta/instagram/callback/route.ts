import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { requireMarketingAdminAccess } from "@/lib/auth/require-marketing-admin";
import { completeInstagramFacebookLoginOAuth } from "@/lib/marketing/channels/meta-instagram-facebook-login";
import { persistMetaConnectionError } from "@/lib/marketing/channels/meta";

function integrationsUrl(request: NextRequest, state: "instagram_connected" | "error") {
  const url = new URL("/admin/marketing/integrations", request.url);
  url.searchParams.set("meta", state);
  return url;
}

export async function GET(request: NextRequest) {
  await requireMarketingAdminAccess("marketing.integrations.manage");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("mlamh_meta_instagram_oauth_state")?.value ?? "";
  const state = request.nextUrl.searchParams.get("state") ?? "";
  const code = request.nextUrl.searchParams.get("code") ?? "";
  cookieStore.delete("mlamh_meta_instagram_oauth_state");

  try {
    if (!expectedState || !state || state !== expectedState || !code) {
      throw new Error("Meta Instagram OAuth callback validation failed.");
    }
    await completeInstagramFacebookLoginOAuth(code);
    return NextResponse.redirect(integrationsUrl(request, "instagram_connected"));
  } catch (error) {
    await persistMetaConnectionError(error);
    return NextResponse.redirect(integrationsUrl(request, "error"));
  }
}
