import { NextResponse } from "next/server";

import { assertApprovedInvestorGmail } from "@/lib/intelligence/investors/account-policy";
import { getInvestorGmailConnectionState } from "@/lib/intelligence/investors/gmail";
import { discoverVerifiedInvestors, enrichInvestorContacts } from "@/lib/intelligence/investors/research-v2";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  prepareDueInvestorFollowUps,
  syncInvestorReplies,
} from "@/lib/intelligence/investors/service";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function discoveryIsDue() {
  const db = createAdminClient();
  const { data, error } = await db.from("investor_activity")
    .select("created_at")
    .eq("action", "investor_discovered")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data?.created_at) return true;
  return Date.now() - new Date(data.created_at).getTime() >= 12 * 60 * 60 * 1000;
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    const gmail = await getInvestorGmailConnectionState();
    if (gmail.status === "connected") assertApprovedInvestorGmail(gmail.emailAddress);

    const replies = await syncInvestorReplies({ limit: 30 });
    const followUps = await prepareDueInvestorFollowUps({ limit: 12 });
    const discovery = await discoveryIsDue()
      ? await discoverVerifiedInvestors({ limit: 8 })
      : { skipped: true, reason: "discovery_interval_not_due" };
    const contactEnrichment = await enrichInvestorContacts({ limit: 16 });

    // This cron never sends investor email. External sending remains approval-gated and manual.
    return NextResponse.json({ ok: true, replies, followUps, discovery, contactEnrichment, sendingEnabled: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Investor relations cron failed.";
    console.error("[InvestorRelations cron]", message);
    return NextResponse.json({ ok: false, error: "investor_relations_cycle_failed" }, { status: 500 });
  }
}
