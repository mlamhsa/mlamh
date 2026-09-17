import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { assertApprovedInvestorGmail } from "@/lib/intelligence/investors/account-policy";
import {
  exchangeInvestorGmailAuthorizationCode,
  persistInvestorGmailConnection,
  persistInvestorGmailError,
} from "@/lib/intelligence/investors/gmail";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "mlamh_investor_gmail_oauth_state";
const VERIFIER_COOKIE = "mlamh_investor_gmail_oauth_verifier";

function adminRedirect(request: Request, result: "connected" | "error") {
  const url = new URL("/admin/intelligence/investors", request.url);
  url.searchParams.set("lang", "ar");
  url.searchParams.set("gmail", result);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  await requireAdminAccess();
  const requestUrl = new URL(request.url);
  const errorParam = requestUrl.searchParams.get("error");
  const code = requestUrl.searchParams.get("code")?.trim() ?? "";
  const state = requestUrl.searchParams.get("state")?.trim() ?? "";
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE)?.value ?? "";
  const codeVerifier = cookieStore.get(VERIFIER_COOKIE)?.value ?? "";
  cookieStore.delete(STATE_COOKIE);
  cookieStore.delete(VERIFIER_COOKIE);

  try {
    if (errorParam) throw new Error(`Google authorization failed: ${errorParam}`);
    if (!code || !state || !expectedState || state !== expectedState || !codeVerifier) {
      throw new Error("Investor Gmail OAuth state validation failed.");
    }
    const tokenSet = await exchangeInvestorGmailAuthorizationCode({ code, codeVerifier });
    const profile = await persistInvestorGmailConnection({
      accessToken: tokenSet.accessToken,
      refreshToken: tokenSet.refreshToken,
    });
    assertApprovedInvestorGmail(profile.emailAddress);
    return adminRedirect(request, "connected");
  } catch (error) {
    console.error("[Investor Gmail callback]", error instanceof Error ? error.message : "oauth_callback_failed");
    await persistInvestorGmailError(error);
    return adminRedirect(request, "error");
  }
}
