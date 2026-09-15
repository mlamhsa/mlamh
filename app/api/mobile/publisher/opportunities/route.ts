import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import { createAdminClient } from "@/lib/supabase/admin";

function fail(code: string, status: number) {
  return NextResponse.json({ ok: false, code }, { status });
}

export async function GET(request: Request) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return fail("UNAUTHENTICATED", 401);

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id,account_type")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (!profile || profile.account_type !== "publisher") {
    return fail("NOT_PUBLISHER", 403);
  }

  const { data: publisher } = await admin
    .from("publishers")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!publisher) return fail("PUBLISHER_NOT_FOUND", 404);

  const { data: opportunities, error } = await admin
    .from("opportunities")
    .select("id,title,slug,posting_mode,city_ar,city_en,opportunity_type,status,published,created_at,application_deadline")
    .eq("publisher_id", publisher.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[mobile publisher opportunities]", error);
    return fail("LOAD_FAILED", 500);
  }

  const rows = opportunities ?? [];
  const ids = rows.map((item) => item.id);
  const { data: applications } = ids.length
    ? await admin
        .from("opportunity_applications")
        .select("id,opportunity_id")
        .in("opportunity_id", ids)
    : { data: [] as Array<{ id: number; opportunity_id: number }> };

  const applicantCounts = new Map<number, number>();
  for (const application of applications ?? []) {
    applicantCounts.set(
      application.opportunity_id,
      (applicantCounts.get(application.opportunity_id) ?? 0) + 1,
    );
  }

  const items = rows.map((item) => ({
    id: item.id,
    title: item.title,
    slug: item.slug,
    postingMode: item.posting_mode === "quick" ? "quick" : "casting",
    cityAr: item.city_ar,
    cityEn: item.city_en,
    talentType: item.opportunity_type,
    status: item.status,
    published: Boolean(item.published),
    applicantCount: applicantCounts.get(item.id) ?? 0,
    createdAt: item.created_at,
    applicationDeadline: item.application_deadline,
  }));

  const counts = {
    total: items.length,
    pendingReview: items.filter((item) => item.status === "pending_review").length,
    needsChanges: items.filter((item) => item.status === "needs_changes").length,
    published: items.filter((item) => item.status === "published" || item.status === "open").length,
    rejected: items.filter((item) => item.status === "rejected").length,
    closed: items.filter((item) => item.status === "closed").length,
    archived: items.filter((item) => item.status === "archived").length,
    applicants: applications?.length ?? 0,
  };

  return NextResponse.json({ ok: true, counts, items });
}
