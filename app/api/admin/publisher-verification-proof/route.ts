import { NextRequest, NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

const VERIFICATION_BUCKET = "publisher-verification";
const SIGNED_URL_TTL_SECONDS = 60;
const PROOF_OBJECT_PATTERN = /^publishers\/\d+\/verification-\d+\.(?:pdf|png|webp|jpg)$/;

export async function GET(request: NextRequest) {
  await requireAdminAccess();

  const objectPath = request.nextUrl.searchParams.get("object")?.trim() ?? "";
  if (!PROOF_OBJECT_PATTERN.test(objectPath)) {
    return NextResponse.json({ error: "Invalid verification proof path." }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient.storage
    .from(VERIFICATION_BUCKET)
    .createSignedUrl(objectPath, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Verification proof not found." }, { status: 404 });
  }

  return NextResponse.redirect(data.signedUrl, 307);
}
