"use server";

import { revalidatePath } from "next/cache";

import { requirePublisher } from "@/lib/auth/require-publisher";
import {
  createEvent,
  EVENT_TARGETS,
  EVENT_TYPES,
} from "@/lib/events";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const { user, publisher } =
    await requirePublisher(locale);

  if (
    publisher.verified !== true ||
    publisher.status === "suspended"
  ) {
    return {
      success: false,
      message:
        locale === "ar"
          ? "حساب الناشر غير مؤهل لإرسال الدعوات."
          : "Your publisher account cannot send invitations.",
      sentCount: 0,
    };
  }

  const adminClient = createAdminClient();

  /*
   * تأكيد وجود الموهبة قبل إنشاء أي دعوات.
   */
  const { data: talent, error: talentError } =
    await adminClient
      .from("talents")
      .select("id")
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

  if (!talent) {
    return {
      success: false,
      message:
        locale === "ar"
          ? "ملف الموهبة غير موجود."
          : "Talent profile not found.",
      sentCount: 0,
    };
  }

  /*
   * لا نثق بمعرّفات الفرص القادمة من الواجهة.
   * نعيد جلبها ونتأكد أنها:
   * 1. تخص الناشر الحالي.
   * 2. منشورة ومتاحة.
   */
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
          published
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

  const invitationRows = validOpportunities.map(
    (opportunity) => ({
      publisher_id: publisher.id,
      talent_id: talentId,
      opportunity_id: opportunity.id,
      status: "sent",
    }),
  );

  /*
   * ignoreDuplicates يمنع فشل العملية إذا كانت دعوة
   * لنفس الموهبة والفرصة موجودة سابقًا.
   */
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

  const insertedRows = insertedInvitations ?? [];

  if (insertedRows.length === 0) {
    return {
      success: true,
      message:
        locale === "ar"
          ? "سبق إرسال الدعوة للموهبة إلى الفرص المختارة."
          : "The talent has already been invited to the selected opportunities.",
      sentCount: 0,
    };
  }

  const opportunityById = new Map(
    validOpportunities.map((opportunity) => [
      opportunity.id,
      opportunity,
    ]),
  );

  /*
   * ننشئ Event فقط للدعوات الجديدة،
   * وبالتالي لن تصل إشعارات مكررة.
   */
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
  revalidatePath(`/${locale}/talent-dashboard`);

  return {
    success: true,
    message:
      locale === "ar"
        ? `تم إرسال ${insertedRows.length} دعوة بنجاح.`
        : `${insertedRows.length} invitation${
            insertedRows.length === 1 ? "" : "s"
          } sent successfully.`,
    sentCount: insertedRows.length,
  };
}