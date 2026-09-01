import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function statusLabel(processingStatus: string | null | undefined) {
  if (processingStatus === "processed") return "completed";
  if (processingStatus === "failed") return "error";
  if (processingStatus === "ignored") return "rejected";
  return "pending";
}

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code")?.trim() ?? "";
  if (!/^meta-del-[a-f0-9]{24}$/i.test(code)) {
    return NextResponse.json({ error: "invalid_confirmation_code" }, { status: 400 });
  }

  const db = createAdminClient();
  const { data, error } = await db
    .from("marketing_webhook_events")
    .select("processing_status,payload,received_at,processed_at")
    .eq("provider", "meta")
    .eq("event_type", "meta.data_deletion_request")
    .contains("payload", { confirmation_code: code })
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "deletion_status_unavailable" }, { status: 503 });
  }
  if (!data) {
    return NextResponse.json({ error: "deletion_request_not_found" }, { status: 404 });
  }

  return NextResponse.json({
    confirmation_code: code,
    status: statusLabel(data.processing_status),
    requested_at: data.received_at,
    completed_at: data.processed_at,
  });
}
