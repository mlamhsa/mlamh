import { NextRequest, NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { recordAdminAction } from "@/lib/events/admin-audit";
import { EVENT_TARGETS } from "@/lib/events/event-targets";
import { createAdminClient } from "@/lib/supabase/admin";

const VERIFICATION_BUCKET = "publisher-verification";
const SIGNED_URL_TTL_SECONDS = 60;
const PROOF_OBJECT_PATTERN = /^publishers\/\d+\/verification-\d+\.(?:pdf|png|webp|jpg)$/;

export async function GET(request: NextRequest) {
  const adminUser =
    await requireAdminAccess();

  const objectPath = request.nextUrl.searchParams.get("object")?.trim() ?? "";
  if (!PROOF_OBJECT_PATTERN.test(objectPath)) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "view_publisher_verification_proof",
      outcome: "blocked",
      target: EVENT_TARGETS.VERIFICATION_PROOF,
      targetId: "invalid-input",
      reason: "invalid_verification_proof_path",
    });

    return NextResponse.json({ error: "Invalid verification proof path." }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient.storage
    .from(VERIFICATION_BUCKET)
    .createSignedUrl(objectPath, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "view_publisher_verification_proof",
      outcome: "failed",
      target: EVENT_TARGETS.VERIFICATION_PROOF,
      targetId: objectPath,
      reason: "verification_proof_not_found",
    });

    return NextResponse.json({ error: "Verification proof not found." }, { status: 404 });
  }

  await recordAdminAction({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    action: "view_publisher_verification_proof",
    outcome: "success",
    target: EVENT_TARGETS.VERIFICATION_PROOF,
    targetId: objectPath,
    metadata: {
      signed_url_ttl_seconds:
        SIGNED_URL_TTL_SECONDS,
    },
  });

  return NextResponse.redirect(data.signedUrl, 307);
}
