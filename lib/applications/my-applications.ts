import {
  normalizeApplicationStatus,
  type ApplicationStatus,
} from "@/lib/applications/status-rules";
import { createAdminClient } from "@/lib/supabase/admin";

export type TalentApplicationItem = {
  id: number | string;
  status: ApplicationStatus;
  createdAt: string | null;
  opportunity: {
    id: number | string;
    title: string | null;
    slug: string | null;
    city: string | null;
    opportunityType: string | null;
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

type ApplicationRow = {
  id: number | string;
  status: string | null;
  created_at: string | null;
  opportunities:
    | {
        id: number | string;
        title: string | null;
        title_en?: string | null;
        slug: string | null;
        city_ar: string | null;
        city_en: string | null;
        opportunity_type: string | null;
        status: string | null;
        created_at: string | null;
      }
    | Array<{
        id: number | string;
        title: string | null;
        title_en?: string | null;
        slug: string | null;
        city_ar: string | null;
        city_en: string | null;
        opportunity_type: string | null;
        status: string | null;
        created_at: string | null;
      }>
    | null;
};

function firstOpportunity(row: ApplicationRow) {
  return Array.isArray(row.opportunities)
    ? row.opportunities[0] ?? null
    : row.opportunities;
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
        opportunity_type,
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
  const acceptedIds = rows
    .filter((row) => normalizeApplicationStatus(row.status) === "accepted")
    .map((row) => row.id);

  const conversationByApplicationId = new Map<string, string>();
  if (acceptedIds.length > 0) {
    const { data: conversations, error: conversationError } = await admin
      .from("conversations")
      .select("id, application_id")
      .in("application_id", acceptedIds);

    if (conversationError) {
      console.error("[getTalentApplications conversations]", conversationError);
    } else {
      for (const conversation of conversations ?? []) {
        if (conversation.application_id !== null && conversation.application_id !== undefined) {
          conversationByApplicationId.set(
            String(conversation.application_id),
            String(conversation.id),
          );
        }
      }
    }
  }

  const items: TalentApplicationItem[] = rows.map((row) => {
    const opportunity = firstOpportunity(row);
    const status = normalizeApplicationStatus(row.status);
    const isEnglish = input.locale === "en";

    return {
      id: row.id,
      status,
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
            opportunityType: opportunity.opportunity_type,
            status: opportunity.status,
            createdAt: opportunity.created_at,
          }
        : null,
      conversationId:
        status === "accepted"
          ? conversationByApplicationId.get(String(row.id)) ?? null
          : null,
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
