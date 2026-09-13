import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

type EnsureOpportunityConversationInput = {
  opportunityId: string | number;
  publisherId: string | number;
  talentId: string | number;
  applicationId?: string | number | null;
};

export async function ensureOpportunityConversation(
  adminClient: AdminClient,
  input: EnsureOpportunityConversationInput,
) {
  const opportunityId = Number(input.opportunityId);
  const publisherId = Number(input.publisherId);
  const talentId = Number(input.talentId);
  const applicationId = input.applicationId == null ? null : Number(input.applicationId);

  if (
    !Number.isInteger(opportunityId) ||
    opportunityId <= 0 ||
    !Number.isInteger(publisherId) ||
    publisherId <= 0 ||
    !Number.isInteger(talentId) ||
    talentId <= 0 ||
    (applicationId !== null && (!Number.isInteger(applicationId) || applicationId <= 0))
  ) {
    throw new Error("Invalid opportunity conversation context.");
  }

  if (applicationId !== null) {
    const { data: byApplication, error: applicationLookupError } = await adminClient
      .from("conversations")
      .select("id")
      .eq("application_id", applicationId)
      .maybeSingle();

    if (applicationLookupError) {
      throw new Error(
        `Failed to check application conversation: ${applicationLookupError.message}`,
      );
    }

    if (byApplication?.id) return Number(byApplication.id);
  }

  const { data: byOpportunity, error: opportunityLookupError } = await adminClient
    .from("conversations")
    .select("id")
    .eq("opportunity_id", opportunityId)
    .eq("publisher_id", publisherId)
    .eq("talent_id", talentId)
    .eq("conversation_type", "publisher_talent")
    .maybeSingle();

  if (opportunityLookupError) {
    throw new Error(
      `Failed to check opportunity conversation: ${opportunityLookupError.message}`,
    );
  }

  if (byOpportunity?.id) return Number(byOpportunity.id);

  const now = new Date().toISOString();
  const { data: created, error: createError } = await adminClient
    .from("conversations")
    .insert({
      application_id: applicationId,
      opportunity_id: opportunityId,
      publisher_id: publisherId,
      talent_id: talentId,
      conversation_type: "publisher_talent",
      status: "active",
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (!createError && created?.id) return Number(created.id);

  const { data: retry, error: retryError } = await adminClient
    .from("conversations")
    .select("id")
    .eq("opportunity_id", opportunityId)
    .eq("publisher_id", publisherId)
    .eq("talent_id", talentId)
    .eq("conversation_type", "publisher_talent")
    .maybeSingle();

  if (!retryError && retry?.id) return Number(retry.id);

  throw new Error(
    `Failed to create opportunity conversation: ${createError?.message ?? retryError?.message ?? "Unknown error"}`,
  );
}
