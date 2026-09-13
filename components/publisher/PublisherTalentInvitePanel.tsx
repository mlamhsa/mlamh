import { requirePublisher } from "@/lib/auth/require-publisher";
import { createAdminClient } from "@/lib/supabase/admin";
import { canRequestTalentFromProfile } from "@/lib/talent/public-profile-access";
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
  const { user, profile, publisher } = await requirePublisher(locale);
  const isArabic = locale === "ar";

  const canInvite = canRequestTalentFromProfile({
    userId: user.id,
    accountType: profile.account_type,
    approvalStatus: profile.approval_status,
    publisherVerified: publisher.verified,
    publisherVerificationStatus: publisher.verification_status,
    publisherStatus: publisher.status,
  });

  if (!canInvite) {
    return (
      <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-sm leading-7 text-amber-100">
        {isArabic
          ? "إرسال الدعوات متاح بعد اعتماد حساب الناشر وإكمال التحقق منه، مع بقاء الحساب في حالة نشطة."
          : "Invitations become available once the publisher account is approved, verified, and active."}
      </div>
    );
  }

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
