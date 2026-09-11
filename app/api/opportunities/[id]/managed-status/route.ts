import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import { createAdminClient } from "@/lib/supabase/admin";

function parseOpportunityId(value: string) {
  const opportunityId = Number(value);
  return Number.isInteger(opportunityId) && opportunityId > 0 ? opportunityId : null;
}

async function getManagedPublicOpportunity(opportunityId: number) {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("opportunities")
    .select("id,managed_by_mlamh,published,status")
    .eq("id", opportunityId)
    .maybeSingle();

  if (error) throw error;

  const isPublic =
    Boolean(data?.published) &&
    (data?.status === "published" || data?.status === "open");

  return {
    adminClient,
    managedByMlamh: isPublic && data?.managed_by_mlamh === true,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const opportunityId = parseOpportunityId(id);

  if (!opportunityId) {
    return NextResponse.json({ managedByMlamh: false }, { status: 400 });
  }

  try {
    const { managedByMlamh } = await getManagedPublicOpportunity(opportunityId);
    return NextResponse.json({ managedByMlamh });
  } catch (error) {
    console.error("[managed-status]", error);
    return NextResponse.json({ managedByMlamh: false }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const opportunityId = parseOpportunityId(id);
  if (!opportunityId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const auth = await getRequestUser(request);
  if (!auth.ok) {
    // Invitation view tracking is supplementary; anonymous opportunity viewing
    // remains available and must not reveal whether an invitation exists.
    return NextResponse.json({ ok: true });
  }

  try {
    const { adminClient, managedByMlamh } = await getManagedPublicOpportunity(opportunityId);
    if (!managedByMlamh) return NextResponse.json({ ok: true });

    const { data: talent, error: talentError } = await adminClient
      .from("talents")
      .select("id")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (talentError) throw talentError;
    if (!talent) return NextResponse.json({ ok: true });

    const now = new Date().toISOString();
    const { error: invitationError } = await adminClient
      .from("managed_casting_invitations")
      .update({ status: "viewed", viewed_at: now, updated_at: now })
      .eq("opportunity_id", opportunityId)
      .eq("talent_id", talent.id)
      .eq("status", "sent");

    if (invitationError) throw invitationError;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[managed-status.view]", error);
    // Do not break the opportunity page because analytics/state tracking failed.
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
