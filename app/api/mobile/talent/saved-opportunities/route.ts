import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getSavedOpportunityState,
  listSavedOpportunities,
  toggleSavedOpportunity,
} from "@/lib/opportunities/saved-opportunities";

function parseOpportunityId(value: unknown) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

async function requireTalent(request: Request) {
  const auth = await getRequestUser(request);
  if (!auth.ok) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, code: auth.code }, { status: 401 }),
    };
  }

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("account_type")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (error) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, code: "ACCOUNT_LOOKUP_FAILED" }, { status: 500 }),
    };
  }
  if (profile?.account_type !== "talent") {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, code: "TALENT_REQUIRED" }, { status: 403 }),
    };
  }

  return { ok: true as const, userId: auth.user.id, admin };
}

export async function GET(request: Request) {
  const access = await requireTalent(request);
  if (!access.ok) return access.response;

  const url = new URL(request.url);
  const opportunityId = parseOpportunityId(url.searchParams.get("opportunityId"));

  try {
    if (opportunityId) {
      const state = await getSavedOpportunityState(access.admin, access.userId, opportunityId);
      return NextResponse.json({ ok: true, saved: state.saved });
    }

    const rows = await listSavedOpportunities(access.admin, access.userId);
    return NextResponse.json({
      ok: true,
      count: rows.length,
      items: rows.map((row) => ({
        opportunityId: Number(row.opportunity_id),
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    console.error("[api/mobile/talent/saved-opportunities GET]", error);
    return NextResponse.json({ ok: false, code: "SAVED_OPPORTUNITIES_FETCH_FAILED" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const access = await requireTalent(request);
  if (!access.ok) return access.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, code: "INVALID_JSON" }, { status: 400 });
  }

  const opportunityId = parseOpportunityId((body as { opportunityId?: unknown })?.opportunityId);
  if (!opportunityId) {
    return NextResponse.json({ ok: false, code: "INVALID_OPPORTUNITY_ID" }, { status: 400 });
  }

  const { data: opportunity, error: opportunityError } = await access.admin
    .from("opportunities")
    .select("id")
    .eq("id", opportunityId)
    .maybeSingle();

  if (opportunityError) {
    return NextResponse.json({ ok: false, code: "OPPORTUNITY_LOOKUP_FAILED" }, { status: 500 });
  }
  if (!opportunity) {
    return NextResponse.json({ ok: false, code: "OPPORTUNITY_NOT_FOUND" }, { status: 404 });
  }

  try {
    const result = await toggleSavedOpportunity(access.admin, access.userId, opportunityId);
    return NextResponse.json({ ok: true, saved: result.saved });
  } catch (error) {
    console.error("[api/mobile/talent/saved-opportunities POST]", error);
    return NextResponse.json({ ok: false, code: "SAVED_OPPORTUNITY_TOGGLE_FAILED" }, { status: 500 });
  }
}
