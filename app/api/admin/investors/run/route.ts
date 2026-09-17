import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import {
  discoverInvestors,
  prepareDueInvestorFollowUps,
  syncInvestorReplies,
} from "@/lib/intelligence/investors/service";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST() {
  await requireAdminAccess();
  try {
    const replies = await syncInvestorReplies({ limit: 20 });
    const followUps = await prepareDueInvestorFollowUps({ limit: 10 });
    const discovery = await discoverInvestors({ limit: 8 });
    return NextResponse.json({ ok: true, replies, followUps, discovery });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Investor agent cycle failed.";
    console.error("[InvestorRelations run]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
