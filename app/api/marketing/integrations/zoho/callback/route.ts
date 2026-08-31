import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { requireMarketingAdminAccess } from "@/lib/auth/require-marketing-admin";
import {
  exchangeZohoAuthorizationCode,
  getZohoMailRuntimeConfig,
  persistZohoAccountVerification,
  persistZohoConnectionError,
  verifyZohoMailAccount,
} from "@/lib/marketing/channels/zoho-mail";

function integrationsUrl(request: NextRequest, state: "verified" | "error") {
  const url = new URL("/admin/marketing/integrations", request.url);
  url.searchParams.set("zoho", state);
  return url;
}

export async function GET(request: NextRequest) {
  await requireMarketingAdminAccess("marketing.integrations.manage");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("mlamh_zoho_oauth_state")?.value ?? "";
  const codeVerifier = cookieStore.get("mlamh_zoho_pkce_verifier")?.value ?? "";
  const state = request.nextUrl.searchParams.get("state") ?? "";
  const code = request.nextUrl.searchParams.get("code") ?? "";
  cookieStore.delete("mlamh_zoho_oauth_state");
  cookieStore.delete("mlamh_zoho_pkce_verifier");

  try {
    if (!expectedState || !state || state !== expectedState || !codeVerifier || !code) {
      throw new Error("Zoho OAuth callback validation failed.");
    }
    const config = getZohoMailRuntimeConfig();
    const tokenSet = await exchangeZohoAuthorizationCode({ code, codeVerifier, config });
    const verified = await verifyZohoMailAccount({ accessToken: tokenSet.accessToken, config });
    await persistZohoAccountVerification({
      accountId: verified.accountId,
      config,
      refreshTokenReceived: Boolean(tokenSet.refreshToken),
    });

    // Phase 1 deliberately discards OAuth tokens after READ verification.
    // Durable refresh-token storage must be configured before the integration can become "connected" or send real email.
    return NextResponse.redirect(integrationsUrl(request, "verified"));
  } catch (error) {
    await persistZohoConnectionError(error);
    return NextResponse.redirect(integrationsUrl(request, "error"));
  }
}
