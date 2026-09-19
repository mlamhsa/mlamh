"use server";

import { revalidatePath } from "next/cache";

import { requirePublisher } from "@/lib/auth/require-publisher";
import {
  createEvent,
  EVENT_TARGETS,
  EVENT_TYPES,
} from "@/lib/events";
import { ensureOpportunityConversation } from "@/lib/messages/ensure-opportunity-conversation";
import { createAdminClient } from "@/lib/supabase/admin";
import { canRequestTalentFromProfile } from "@/lib/talent/public-profile-access";
import { buildTalentBriefFromOpportunity, evaluateTalentForBrief, type BriefTalent } from "@/lib/talent/supply";

export type SendOpportunityInvitationsState = {
  success: boolean;
  message: string | null;
  sentCount: number;
};

const initialErrorState: SendOpportunityInvitationsState = {
  success: false,
  message: null,
  sentCount: 0,
};

function getPositiveInteger(value: FormDataEntryValue | null) {
  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : null;
}

function getOpportunityIds(formData: FormData) {
  return [
    ...new Set(
      formData
        .getAll("opportunity_ids")
        .map((value) => Number(value))
        .filter(
          (value) =>
            Number.isInteger(value) && value > 0,
        ),
    ),
  ];
}

export async function sendOpportunityInvitationsAction(
  previousState: SendOpportunityInvitationsState =
    initialErrorState,
  formData: FormData,
): Promise<SendOpportunityInvitationsState> {
  void previousState;
  const locale =
    formData.get("locale") === "en" ? "en" : "ar";

  const talentId = getPositiveInteger(
    formData.get("talent_id"),
  );

  const opportunityIds = getOpportunityIds(formData);

  if (!talentId) {
    return {
      success: false,
      message:
        locale === "ar"
          ? "بيانات الموهبة غير صحيحة."
          : "Invalid talent.",
      sentCount: 0,
    };
  }

  if (opportunityIds.length === 0) {
    return {
      success: false,
      message:
        locale === "ar"
          ? "اختر فرصة واحدة على الأقل."
          : "Select at least one opportunity.",
      sentCount: 0,
    };
  }

  const { user, profile, publisher } =
    await requirePublisher(locale);

  const publisherCanInvite = canRequestTalentFromProfile({
    userId: user.id,
    accountType: profile.account_type,
    approvalStatus: profile.approval_status,
    profileStatus: profile.status,
    publisherVerified: publisher.verified,
    publisherVerificationStatus: publisher.verification_status,
    publisherStatus: publisher.status,
  });

  if (!publisherCanInvite) {
    return {
      success: false,
      message:
        locale === "ar"
          ? "حساب الناشر غير مؤهل لإرسال الدعوات. يجب أن يكون الحساب معتمدًا ونشطًا."
          : "Your publisher account must be approved and active before sending invitations.",
      sentCount: 0,
    };
  }

  const adminClient = createAdminClient();

  const { data: talent, error: talentError } =
    await adminClient
      .from("talents")
      .select("*")
      .eq("id", talentId)
      .maybeSingle();

  if (talentError) {
    console.error(
      "[sendOpportunityInvitationsAction:talent]",
      talentError,
    );

    return {
      success: false,
      message:
        locale === "ar"
          ? "تعذر التحقق من الموهبة."
          : "Unable to verify the talent.",
      sentCount: 0,
    };
  }

  const talentStatus = String(talent?.status ?? "").trim().toLowerCase();
  const talentVisibility = String(talent?.profile_visibility ?? "public").trim().toLowerCase();
  const talentOperationallyActive = Boolean(
    talent?.id &&
      talent.user_id &&
      ["approved", "active"].includes(talentStatus),
  );

  if (!talentOperationallyActive || !talent?.user_id) {
    return {
      success: false,
      message:
        locale === "ar"
          ? "هذه الموهبة غير متاحة للدعوات حاليًا."
          : "This talent is not currently available for invitations.",
      sentCount: 0,
    };
  }

  const { data: talentProfile, error: talentProfileError } = await adminClient
    .from("profiles")
    .select("approval_status,account_type,status")
    .eq("user_id", talent.user_id)
    .maybeSingle();

  if (
    talentProfileError ||
    talentProfile?.account_type !== "talent" ||
    talentProfile.approval_status !== "approved"
  ) {
    if (talentProfileError) {
      console.error(
        "[sendOpportunityInvitationsAction:talentProfile]",
        talentProfileError,
      );
    }

    return {
      success: false,
      message:
        locale === "ar"
          ? "هذه الموهبة غير متاحة للدعوات حاليًا."
          : "This talent is not currently available for invitations.",
      sentCount: 0,
    };
  }

  const { data: opportunities, error: opportunitiesError } =
    await adminClient
      .from("opportunities")
      .select(
        `
          id,
          title,
          slug,
          publisher_id,
          status,
          published,
          posting_mode,
          opportunity_type,
          country_code,
          city_slug,
          required_gender,
          required_count,
          role_requirements
        `,
      )
      .in("id", opportunityIds)
      .eq("publisher_id", publisher.id)
      .eq("published", true)
      .in("status", ["published", "open"]);

  if (opportunitiesError) {
    console.error(
      "[sendOpportunityInvitationsAction:opportunities]",
      opportunitiesError,
    );

    return {
      success: false,
      message:
        locale === "ar"
          ? "تعذر تحميل الفرص المختارة."
          : "Unable to load the selected opportunities.",
      sentCount: 0,
    };
  }

  const validOpportunities = opportunities ?? [];

  if (validOpportunities.length !== opportunityIds.length) {
    return {
      success: false,
      message:
        locale === "ar"
          ? "تحتوي القائمة على فرصة غير منشورة أو لا تخص حسابك."
          : "One or more selected opportunities are unavailable.",
      sentCount: 0,
    };
  }

  const publisherVerified =
    publisher.verified === true ||
    publisher.verification_status === "verified";
  const publisherType = String(publisher.publisher_type ?? "").trim().toLowerCase();
  const individualPublisherTypes = new Set(["individual", "salon", "store", "photographer", "marketer"]);
  const allSelectedQuick = validOpportunities.every(
    (opportunity) => opportunity.posting_mode === "quick",
  );

  const publicTalentInviteAllowed =
    talentVisibility === "public" && talent.published === true;

  const talentForMatching = {
    ...(talent as BriefTalent),
    profile_approval_status: talentProfile.approval_status,
    profile_status: talentProfile.status,
  } satisfies BriefTalent;

  const allSelectedMatchTalent = validOpportunities.every((opportunity) =>
    evaluateTalentForBrief(
      talentForMatching,
      buildTalentBriefFromOpportunity(opportunity),
    ).sendable,
  );

  const restrictedTalentInviteAllowed =
    talentVisibility === "verified_publishers" &&
    allSelectedMatchTalent &&
    (publisherVerified ||
      (individualPublisherTypes.has(publisherType) && allSelectedQuick));

  if (!publicTalentInviteAllowed && !restrictedTalentInviteAllowed) {
    return {
      success: false,
      message:
        locale === "ar"
          ? talentVisibility === "verified_publishers"
            ? allSelectedMatchTalent
              ? "هذه الموهبة متاحة للناشرين المعتمدين. للحساب الفردي يجب استخدام فرصة سريعة منشورة."
              : "الفرصة المختارة لا تطابق متطلبات هذه الموهبة. عدّل متطلبات الفرصة أو اختر موهبة مطابقة."
            : "هذه الموهبة غير متاحة للدعوات حاليًا."
          : talentVisibility === "verified_publishers"
            ? allSelectedMatchTalent
              ? "This talent is available to approved publishers. Individual publishers must use a published Quick Opportunity."
              : "The selected opportunity does not match this talent's requirements. Update the opportunity or choose a matching talent."
            : "This talent is not currently available for invitations.",
      sentCount: 0,
    };
  }

  const invitationRows = validOpportunities.map(
    (opportunity) => ({
      publisher_id: publisher.id,
      talent_id: talentId,
      opportunity_id: opportunity.id,
      status: "sent",
    }),
  );

  const { data: insertedInvitations, error: insertError } =
    await adminClient
      .from("opportunity_invitations")
      .upsert(invitationRows, {
        onConflict: "opportunity_id,talent_id",
        ignoreDuplicates: true,
      })
      .select("id, opportunity_id");

  if (insertError) {
    console.error(
      "[sendOpportunityInvitationsAction:insert]",
      insertError,
    );

    return {
      success: false,
      message:
        locale === "ar"
          ? "تعذر إرسال الدعوات. حاول مرة أخرى."
          : "Unable to send invitations. Please try again.",
      sentCount: 0,
    };
  }

  const conversationByOpportunity = new Map<number, number>();

  try {
    const conversationRows = await Promise.all(
      validOpportunities.map(async (opportunity) => ({
        opportunityId: Number(opportunity.id),
        conversationId: await ensureOpportunityConversation(adminClient, {
          opportunityId: opportunity.id,
          publisherId: publisher.id,
          talentId,
        }),
      })),
    );

    for (const item of conversationRows) {
      conversationByOpportunity.set(item.opportunityId, item.conversationId);
    }
  } catch (error) {
    console.error(
      "[sendOpportunityInvitationsAction:conversation]",
      error,
    );

    return {
      success: false,
      message:
        locale === "ar"
          ? "تم حفظ الدعوة، لكن تعذر فتح المحادثة الآن. حاول مرة أخرى."
          : "The invitation was saved, but the conversation could not be opened yet. Please try again.",
      sentCount: 0,
    };
  }

  const insertedRows = insertedInvitations ?? [];

  if (insertedRows.length === 0) {
    revalidatePath(`/${locale}/publisher-dashboard/messages`);
    revalidatePath(`/${locale}/talent-dashboard/messages`);

    return {
      success: true,
      message:
        locale === "ar"
          ? "سبق إرسال الدعوة، والمحادثة متاحة من الرسائل."
          : "The invitation was already sent and the conversation is available in Messages.",
      sentCount: 0,
    };
  }

  const opportunityById = new Map(
    validOpportunities.map((opportunity) => [
      opportunity.id,
      opportunity,
    ]),
  );

  const eventResults = await Promise.allSettled(
    insertedRows.map(async (invitation) => {
      const opportunity = opportunityById.get(
        invitation.opportunity_id,
      );

      if (!opportunity) {
        return;
      }

      await createEvent({
        type: EVENT_TYPES.opportunity_invitation,
        target: EVENT_TARGETS.TALENT,
        targetId: String(talentId),
        actorId: user.id,
        metadata: {
          invitationId: invitation.id,
          opportunityId: opportunity.id,
          opportunitySlug: opportunity.slug,
          title: opportunity.title,
          publisherId: publisher.id,
          company_name: publisher.company_name,
          conversationId:
            conversationByOpportunity.get(Number(opportunity.id)) ?? null,
          locale,
        },
      });
    }),
  );

  for (const result of eventResults) {
    if (result.status === "rejected") {
      console.error(
        "[sendOpportunityInvitationsAction:event]",
        result.reason,
      );
    }
  }

  revalidatePath(
    `/${locale}/publisher-dashboard/notifications`,
  );
  revalidatePath(
    `/${locale}/talent-dashboard/notifications`,
  );
  revalidatePath(`/${locale}/publisher-dashboard/messages`);
  revalidatePath(`/${locale}/talent-dashboard/messages`);
  revalidatePath(`/${locale}/talent-dashboard`);

  return {
    success: true,
    message:
      locale === "ar"
        ? `تم إرسال ${insertedRows.length} دعوة ويمكن بدء المحادثة من الرسائل.`
        : `${insertedRows.length} invitation${
            insertedRows.length === 1 ? "" : "s"
          } sent. The conversation is now available in Messages.`,
    sentCount: insertedRows.length,
  };
}
