"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type OpportunityStatus = "open" | "closed" | "archived";

async function updateOpportunityStatus(
  opportunityId: string | number,
  status: OpportunityStatus
) {
  if (!opportunityId) {
    throw new Error("Opportunity ID is required.");
  }

  const authClient = await createServerSupabaseClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthorized.");
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error("Profile not found.");
  }

  const { data: publisher, error: publisherError } = await adminClient
    .from("publishers")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (publisherError || !publisher) {
    throw new Error("Publisher account not found.");
  }

  const { data: opportunity, error: opportunityError } = await adminClient
    .from("opportunities")
    .select("id, publisher_id")
    .eq("id", opportunityId)
    .eq("publisher_id", publisher.id)
    .maybeSingle();

  if (opportunityError || !opportunity) {
    throw new Error("Opportunity not found or access denied.");
  }

  const { error: updateError } = await adminClient
    .from("opportunities")
    .update({ status })
    .eq("id", opportunity.id)
    .eq("publisher_id", publisher.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/ar/publisher-dashboard");
  revalidatePath("/en/publisher-dashboard");

  revalidatePath("/ar/publisher-dashboard/opportunities");
  revalidatePath("/en/publisher-dashboard/opportunities");

  revalidatePath(`/ar/publisher-dashboard/opportunities/${opportunity.id}`);
  revalidatePath(`/en/publisher-dashboard/opportunities/${opportunity.id}`);

  revalidatePath(`/ar/publisher-dashboard/opportunities/${opportunity.id}/edit`);
  revalidatePath(`/en/publisher-dashboard/opportunities/${opportunity.id}/edit`);

  revalidatePath(
    `/ar/publisher-dashboard/opportunities/${opportunity.id}/applicants`
  );
  revalidatePath(
    `/en/publisher-dashboard/opportunities/${opportunity.id}/applicants`
  );
}

export async function closeOpportunityAction(opportunityId: string | number) {
  await updateOpportunityStatus(opportunityId, "closed");
}

export async function archiveOpportunityAction(opportunityId: string | number) {
  await updateOpportunityStatus(opportunityId, "archived");
}

export async function restoreOpportunityAction(opportunityId: string | number) {
  await updateOpportunityStatus(opportunityId, "open");
}