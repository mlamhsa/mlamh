import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { recordAdminAction } from "@/lib/events/admin-audit";
import { EVENT_TARGETS } from "@/lib/events/event-targets";
import { createAdminClient } from "@/lib/supabase/admin";
import { createInvestorGmailOAuthRequest, INVESTOR_GMAIL_PROVIDER } from "@/lib/intelligence/investors/gmail";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "mlamh_investor_gmail_oauth_state";
const VERIFIER_COOKIE = "mlamh_investor_gmail_oauth_verifier";

export async function GET() {
  const adminUser =
    await requireAdminAccess();

  let oauth: Awaited<
    ReturnType<
      typeof createInvestorGmailOAuthRequest
    >
  >;

  try {
    oauth =
      await createInvestorGmailOAuthRequest();
  } catch (error) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "connect_investor_gmail",
      outcome: "failed",
      target: EVENT_TARGETS.INTEGRATION,
      targetId: INVESTOR_GMAIL_PROVIDER,
      reason: "oauth_request_creation_failed",
    });

    throw error;
  }
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";
  const options = { httpOnly: true, secure, sameSite: "lax" as const, path: "/", maxAge: 10 * 60 };
  cookieStore.set(STATE_COOKIE, oauth.state, options);
  cookieStore.set(VERIFIER_COOKIE, oauth.codeVerifier, options);

  const db = createAdminClient();
  const { error: integrationError } =
    await db
      .from("marketing_integrations")
      .upsert({
        provider: INVESTOR_GMAIL_PROVIDER,
        status: "connecting",
        capabilities: { send: false, read: false, threading: false },
        metadata: { purpose: "investor_relations", technical_provider: "gmail" },
        updated_at: new Date().toISOString(),
      }, { onConflict: "provider" });

  if (integrationError) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "connect_investor_gmail",
      outcome: "failed",
      target: EVENT_TARGETS.INTEGRATION,
      targetId: INVESTOR_GMAIL_PROVIDER,
      reason: "integration_state_update_failed",
    });

    throw new Error(
      integrationError.message,
    );
  }

  await recordAdminAction({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    action: "connect_investor_gmail",
    outcome: "success",
    target: EVENT_TARGETS.INTEGRATION,
    targetId: INVESTOR_GMAIL_PROVIDER,
    metadata: {
      status: "connecting",
      purpose:
        "investor_relations",
    },
  });

  return NextResponse.redirect(oauth.authorizationUrl);
}
