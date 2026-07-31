import { requirePublisher } from "@/lib/auth/require-publisher";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getPublishedOpportunitiesByPublisher,
} from "@/lib/supabase/opportunities";

import { OpportunityInviteModal } from "./OpportunityInviteModal";

type Props = {
  talentId: number;
  locale: "ar" | "en";
};

export async function PublisherTalentInvitePanel({
  talentId,
  locale,
}: Props) {
  const { publisher } = await requirePublisher(locale);

  const opportunities =
    await getPublishedOpportunitiesByPublisher(
      publisher.id,
    );

  const adminClient = createAdminClient();

  const { data: existingInvitations, error } =
    await adminClient
      .from("opportunity_invitations")
      .select("opportunity_id")
      .eq("publisher_id", publisher.id)
      .eq("talent_id", talentId);

  if (error) {
    console.error(
      "[PublisherTalentInvitePanel:invitations]",
      error,
    );
  }

  const invitedOpportunityIds = Array.from(
    new Set(
      (existingInvitations ?? [])
        .map((invitation) =>
          Number(invitation.opportunity_id),
        )
        .filter(
          (opportunityId) =>
            Number.isInteger(opportunityId) &&
            opportunityId > 0,
        ),
    ),
  );

  return (
    <OpportunityInviteModal
      locale={locale}
      talentId={talentId}
      opportunities={opportunities}
      invitedOpportunityIds={invitedOpportunityIds}
    />
  );
}