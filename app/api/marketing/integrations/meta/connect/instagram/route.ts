import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { requireMarketingAdminAccess } from "@/lib/auth/require-marketing-admin";
import { createInstagramOAuthRequest } from "@/lib/marketing/channels/meta";

export async function GET() {
  await requireMarketingAdminAccess("marketing.integrations.manage");
  const oauth = await createInstagramOAuthRequest();
  const cookieStore = await cookies();
  cookieStore.set("mlamh_meta_instagram_oauth_state", oauth.state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return NextResponse.redirect(oauth.authorizationUrl);
}
