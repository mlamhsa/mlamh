import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createInvestorGmailOAuthRequest, INVESTOR_GMAIL_PROVIDER } from "@/lib/intelligence/investors/gmail";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "mlamh_investor_gmail_oauth_state";
const VERIFIER_COOKIE = "mlamh_investor_gmail_oauth_verifier";

export async function GET() {
  await requireAdminAccess();
  const oauth = await createInvestorGmailOAuthRequest();
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";
  const options = { httpOnly: true, secure, sameSite: "lax" as const, path: "/", maxAge: 10 * 60 };
  cookieStore.set(STATE_COOKIE, oauth.state, options);
  cookieStore.set(VERIFIER_COOKIE, oauth.codeVerifier, options);

  const db = createAdminClient();
  await db.from("marketing_integrations").upsert({
    provider: INVESTOR_GMAIL_PROVIDER,
    status: "connecting",
    capabilities: { send: false, read: false, threading: false },
    metadata: { purpose: "investor_relations", technical_provider: "gmail" },
    updated_at: new Date().toISOString(),
  }, { onConflict: "provider" });

  return NextResponse.redirect(oauth.authorizationUrl);
}
