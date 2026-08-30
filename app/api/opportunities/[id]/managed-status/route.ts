import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const opportunityId = Number(id);

  if (!Number.isInteger(opportunityId) || opportunityId <= 0) {
    return NextResponse.json(
      { managedByMlamh: false },
      { status: 400 },
    );
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("opportunities")
    .select("managed_by_mlamh,published,status")
    .eq("id", opportunityId)
    .maybeSingle();

  if (error) {
    console.error("[managed-status]", error);
    return NextResponse.json(
      { managedByMlamh: false },
      { status: 500 },
    );
  }

  const isPublic =
    Boolean(data?.published) &&
    (data?.status === "published" || data?.status === "open");

  return NextResponse.json({
    managedByMlamh:
      isPublic && data?.managed_by_mlamh === true,
  });
}
