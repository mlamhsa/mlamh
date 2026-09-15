import {
  normalizeApplicationStatus,
  type ApplicationStatus,
} from "@/lib/applications/status-rules";
import {
  resolveQuickRequestProductState,
  type QuickRequestProductState,
  type QuickRequestWorkflowEvent,
} from "@/lib/quick-requests/product-state";
import { createAdminClient } from "@/lib/supabase/admin";

export type TalentApplicationDisplayState = ApplicationStatus | QuickRequestProductState;
export type TalentApplicationNextAction = "open_conversation" | "confirm_or_decline" | "share_contact" | null;

export type TalentApplicationItem = {
  id: number | string;
  status: ApplicationStatus;
  displayState: TalentApplicationDisplayState;
  requiresAction: boolean;
  nextAction: TalentApplicationNextAction;
  createdAt: string | null;
  opportunity: {
    id: number | string;
    title: string | null;
    slug: string | null;
    city: string | null;
    countryCode: string | null;
    opportunityType: string | null;
    postingMode: "quick" | "casting";
    status: string | null;
    createdAt: string | null;
  } | null;
  conversationId: string | null;
};

export type TalentApplicationsResult =
  | {
      ok: true;
      items: TalentApplicationItem[];
      counts: Record<ApplicationStatus | "total", number>;
    }
  | {
      ok: false;
      code: "TALENT_NOT_FOUND" | "TALENT_LOOKUP_FAILED" | "APPLICATIONS_LOOKUP_FAILED";
    };

type OpportunityRow = {
  id: number | string;
  title: string | null;
  title_en?: string | null;
  slug: string | null;
  city_ar: string | null;
  city_en: string | null;
  country_code: string | null;
  opportunity_type: string | null;
  posting_mode: string | null;
  status: string | null;
  created_at: string | null;
};

type ApplicationRow = {
  id: number | string;
  status: string | null;
  created_at: string | null;
  opportunities: OpportunityRow | OpportunityRow[] | null;
};

function firstOpportunity(row: ApplicationRow) {
  return Array.isArray(row.opportunities)
    ? row.opportunities[0] ?? null
    : row.opportunities;
}

function getPostingMode(opportunity: OpportunityRow | null) {
  return opportunity?.posting_mode === "quick" ? "quick" as const : "casting" as const;
}

function asWorkflowEvent(event: { event_type?: string | null; metadata?: unknown }): QuickRequestWorkflowEvent {
  return {
    eventType: String(event.event_type ?? ""),
    metadata:
      event.metadata && typeof event.metadata === "object" && !Array.isArray(event.metadata)
        ? (event.metadata as Record<string, unknown>)
        : null,
  };
}

export async function getTalentApplications(input: {
  userId: string;
  locale: "ar" | "en";
}): Promise<TalentApplicationsResult> {
  const admin = createAdminClient();

  const { data: talent, error: talentError } = await admin
    .from("talents")
    .select("id")
    .eq("user_id", input.userId)
    .maybeSingle();

  if (talentError) {
    console.error("[getTalentApplications talent]", talentError);
    return { ok: false, code: "TALENT_LOOKUP_FAILED" };
  }

  if (!talent) return { ok: false, code: "TALENT_NOT_FOUND" };

  const { data, error } = await admin
    .from("opportunity_applications")
    .select(`
      id,
      status,
      created_at,
      opportunities (
        id,
        title,
        title_en,
        slug,
        city_ar,
        city_en,
        country_code,
        opportunity_type,
        posting_mode,
        status,
        created_at
      )
    `)
    .eq("talent_id", talent.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getTalentApplications applications]", error);
    return { ok: false, code: "APPLICATIONS_LOOKUP_FAILED" };
  }

  const rows = (data ?? []) as ApplicationRow[];
  const conversationEligibleIds = rows
    .filter((row) => {
      const opportunity = firstOpportunity(row);
      return getPostingMode(opportunity) === "quick" || normalizeApplicationStatus(row.status) === "accepted";
    })
    .map((row) => row.id);

  const conversationByApplicationId = new Map<string, string>();
  if (conversationEligibleIds.length > 0) {
    const { data: conversations, error: conversationError } = await admin
      .from("conversations")
      .select("id, application_id")
      .in("application_id", conversationEligibleIds);

    if (conversationError) {
      console.error("[getTalentApplications conversations]", conversationError);
    } else {
      for (const conversation of conversations ?? []) {
        if (conversation.application_id !== null && conversation.application_id !== undefined) {
          conversationByApplicationId.set(String(conversation.application_id), String(conversation.id));
        }
      }
    }
  }

  const quickConversationIds = rows
    .filter((row) => getPostingMode(firstOpportunity(row)) === "quick")
    .map((row) => conversationByApplicationId.get(String(row.id)))
    .filter((value): value is string => Boolean(value));

  const eventsByConversationId = new Map<string, QuickRequestWorkflowEvent[]>();
  if (quickConversationIds.length > 0) {
    const { data: rawEvents, error: eventsError } = await admin
      .from("events")
      .select("target_id,event_type,metadata")
      .eq("target_type", "conversation")
      .in("target_id", quickConversationIds)
      .in("event_type", [
        "quick_request_materials_requested",
        "quick_request_selection_confirmed",
        "quick_request_talent_confirmed",
        "quick_request_talent_declined",
        "quick_request_contact_shared",
      ]);

    if (eventsError) {
      console.error("[getTalentApplications quick events]", eventsError);
    } else {
      for (const event of rawEvents ?? []) {
        const key = String(event.target_id ?? "");
        if (!key) continue;
        const bucket = eventsByConversationId.get(key) ?? [];
        bucket.push(asWorkflowEvent(event));
        eventsByConversationId.set(key, bucket);
      }
    }
  }

  const items: TalentApplicationItem[] = rows.map((row) => {
    const opportunity = firstOpportunity(row);
    const status = normalizeApplicationStatus(row.status);
    const postingMode = getPostingMode(opportunity);
    const isEnglish = input.locale === "en";
    const conversationId =
      postingMode === "quick" || status === "accepted"
        ? conversationByApplicationId.get(String(row.id)) ?? null
        : null;

    let displayState: TalentApplicationDisplayState = status;
    let requiresAction = false;
    let nextAction: TalentApplicationNextAction = null;

    if (postingMode === "quick") {
      const workflow = resolveQuickRequestProductState({
        applicationStatus: row.status,
        hasConversation: Boolean(conversationId),
        viewerRole: "talent",
        events: conversationId ? eventsByConversationId.get(conversationId) ?? [] : [],
      });
      displayState = workflow.state;
      requiresAction = workflow.actions.canTalentConfirm || workflow.actions.canTalentDecline;
      nextAction = requiresAction
        ? "confirm_or_decline"
        : workflow.actions.canShareContact
          ? "share_contact"
          : conversationId
            ? "open_conversation"
            : null;
    } else if (conversationId) {
      nextAction = "open_conversation";
    }

    return {
      id: row.id,
      status,
      displayState,
      requiresAction,
      nextAction,
      createdAt: row.created_at,
      opportunity: opportunity
        ? {
            id: opportunity.id,
            title: isEnglish
              ? opportunity.title_en?.trim() || opportunity.title
              : opportunity.title,
            slug: opportunity.slug,
            city: isEnglish
              ? opportunity.city_en || opportunity.city_ar
              : opportunity.city_ar || opportunity.city_en,
            countryCode: opportunity.country_code?.trim().toUpperCase() || null,
            opportunityType: opportunity.opportunity_type,
            postingMode,
            status: opportunity.status,
            createdAt: opportunity.created_at,
          }
        : null,
      conversationId,
    };
  });

  const counts: Record<ApplicationStatus | "total", number> = {
    total: items.length,
    pending: 0,
    reviewing: 0,
    shortlisted: 0,
    accepted: 0,
    rejected: 0,
  };

  for (const item of items) counts[item.status] += 1;

  return { ok: true, items, counts };
}
