import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import { isRestrictedAccountStatus } from "@/lib/accounts/account-rules";
import { resolveQuickRequestProductState } from "@/lib/quick-requests/product-state";
import { createAdminClient } from "@/lib/supabase/admin";

function fail(code: string, status: number, message: string) {
  return NextResponse.json({ ok: false, code, message }, { status });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return fail("UNAUTHENTICATED", 401, "Authentication required.");

  const { id } = await context.params;
  const opportunityId = Number(id);
  if (!Number.isInteger(opportunityId) || opportunityId <= 0) {
    return fail("INVALID_OPPORTUNITY_ID", 400, "Invalid opportunity id.");
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id,account_type,approval_status,status")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (!profile || profile.account_type !== "publisher") {
    return fail("NOT_PUBLISHER", 403, "Publisher access required.");
  }
  if (profile.approval_status !== "approved" || isRestrictedAccountStatus(profile.status)) {
    return fail("PUBLISHER_NOT_ACTIVE", 403, "Publisher account is not active.");
  }

  const { data: publisher } = await admin
    .from("publishers")
    .select("id,status")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!publisher || isRestrictedAccountStatus(publisher.status)) {
    return fail("PUBLISHER_NOT_ACTIVE", 403, "Publisher account is not active.");
  }

  const { data: opportunity, error: opportunityError } = await admin
    .from("opportunities")
    .select("id,title,slug,posting_mode,status,city_ar,city_en,opportunity_type,created_at")
    .eq("id", opportunityId)
    .eq("publisher_id", publisher.id)
    .maybeSingle();

  if (opportunityError) {
    console.error("[publisher opportunity workspace] opportunity", opportunityError);
    return fail("LOAD_FAILED", 500, "Unable to load opportunity.");
  }
  if (!opportunity) return fail("NOT_FOUND", 404, "Opportunity not found.");

  const { data: applications, error: applicationsError } = await admin
    .from("opportunity_applications")
    .select("id,talent_id,status,created_at,updated_at")
    .eq("opportunity_id", opportunityId)
    .order("created_at", { ascending: false });

  if (applicationsError) {
    console.error("[publisher opportunity workspace] applications", applicationsError);
    return fail("LOAD_FAILED", 500, "Unable to load applicants.");
  }

  const applicationRows = applications ?? [];
  const talentIds = Array.from(new Set(applicationRows.map((item) => item.talent_id).filter(Boolean)));
  const applicationIds = applicationRows.map((item) => item.id);

  const [{ data: talents }, { data: conversations }] = await Promise.all([
    talentIds.length
      ? admin
          .from("talents")
          .select("id,slug,name_ar,name_en,image_url,city_ar,city_en,primary_role,category_slug")
          .in("id", talentIds)
      : Promise.resolve({ data: [] }),
    applicationIds.length
      ? admin
          .from("conversations")
          .select("id,application_id,status")
          .in("application_id", applicationIds)
      : Promise.resolve({ data: [] }),
  ]);

  const talentById = new Map((talents ?? []).map((item) => [String(item.id), item]));
  const conversationByApplication = new Map((conversations ?? []).map((item) => [String(item.application_id), item]));

  const conversationIds = (conversations ?? []).map((item) => item.id);
  const { data: workflowEvents } = conversationIds.length
    ? await admin
        .from("events")
        .select("target_id,event_type,metadata")
        .eq("target_type", "conversation")
        .in("target_id", conversationIds.map(String))
        .in("event_type", [
          "quick_request_materials_requested",
          "quick_request_selection_confirmed",
          "quick_request_talent_confirmed",
          "quick_request_talent_declined",
          "quick_request_contact_shared",
        ])
    : { data: [] };

  const eventsByConversation = new Map<string, Array<{ eventType: string; metadata: Record<string, unknown> | null }>>();
  for (const event of workflowEvents ?? []) {
    const key = String(event.target_id);
    const list = eventsByConversation.get(key) ?? [];
    list.push({ eventType: event.event_type, metadata: (event.metadata as Record<string, unknown> | null) ?? null });
    eventsByConversation.set(key, list);
  }

  const isQuick = opportunity.posting_mode === "quick";
  const applicants = applicationRows.map((application) => {
    const talent = talentById.get(String(application.talent_id)) ?? null;
    const conversation = conversationByApplication.get(String(application.id)) ?? null;
    const quickWorkflow = isQuick
      ? resolveQuickRequestProductState({
          applicationStatus: application.status,
          hasConversation: Boolean(conversation),
          viewerRole: "publisher",
          events: conversation ? eventsByConversation.get(String(conversation.id)) ?? [] : [],
        })
      : null;

    return {
      applicationId: Number(application.id),
      rawStatus: application.status ?? "pending",
      displayState: quickWorkflow?.state ?? application.status ?? "pending",
      createdAt: application.created_at,
      updatedAt: application.updated_at,
      conversationId: conversation ? Number(conversation.id) : null,
      conversationStatus: conversation?.status ?? null,
      quickWorkflow,
      talent: talent
        ? {
            id: Number(talent.id),
            slug: talent.slug,
            nameAr: talent.name_ar,
            nameEn: talent.name_en,
            imageUrl: talent.image_url,
            cityAr: talent.city_ar,
            cityEn: talent.city_en,
            role: talent.primary_role ?? talent.category_slug ?? null,
          }
        : null,
    };
  });

  return NextResponse.json({
    ok: true,
    opportunity: {
      id: Number(opportunity.id),
      title: opportunity.title,
      slug: opportunity.slug,
      postingMode: isQuick ? "quick" : "casting",
      status: opportunity.status,
      cityAr: opportunity.city_ar,
      cityEn: opportunity.city_en,
      talentType: opportunity.opportunity_type,
      createdAt: opportunity.created_at,
    },
    applicants,
    counts: {
      total: applicants.length,
      pending: applicants.filter((item) => item.rawStatus !== "accepted" && item.rawStatus !== "rejected").length,
      selected: applicants.filter((item) => item.rawStatus === "accepted").length,
      rejected: applicants.filter((item) => item.rawStatus === "rejected").length,
      conversations: applicants.filter((item) => item.conversationId !== null).length,
    },
  });
}
