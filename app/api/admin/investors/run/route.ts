import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { assertApprovedInvestorGmail } from "@/lib/intelligence/investors/account-policy";
import { getInvestorGmailConnectionState } from "@/lib/intelligence/investors/gmail";
import { discoverVerifiedInvestors, enrichInvestorContacts } from "@/lib/intelligence/investors/research-v2";
import { runInvestorResearchDegraded } from "@/lib/intelligence/investors/research-resilience";
import { ensureInvestorStructuredProvider } from "@/lib/intelligence/investors/structured-provider";
import {
  prepareDueInvestorFollowUps,
  syncInvestorReplies,
} from "@/lib/intelligence/investors/service";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST() {
  await requireAdminAccess();
  try {
    ensureInvestorStructuredProvider();
    const gmail = await getInvestorGmailConnectionState();
    if (gmail.status === "connected") assertApprovedInvestorGmail(gmail.emailAddress);
    const replies = await syncInvestorReplies({ limit: 20 });
    const followUps = await prepareDueInvestorFollowUps({ limit: 10 });
    const discovery = await runInvestorResearchDegraded("discovery", () => discoverVerifiedInvestors({ limit: 8 }));
    const contactEnrichment = await runInvestorResearchDegraded("contact_enrichment", () => enrichInvestorContacts({ limit: 12 }));
    return NextResponse.json({ ok: true, replies, followUps, discovery, contactEnrichment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Investor agent cycle failed.";
    console.error("[InvestorRelations run]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
