"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAccess } from "@/lib/auth/require-admin";

import {
  createEvent,
  EVENT_TARGETS,
  EVENT_TYPES,
} from "@/lib/events";

import { OpportunityService } from "@/lib/services/opportunities/OpportunityService";
import { createAdminClient } from "@/lib/supabase/admin";

type OpportunityStatus =
  | "published"
  | "rejected"
  | "draft"
  | "pending_review"
  | "needs_changes"
  | "closed"
  | "archived";

type AdminLocale =
  | "ar"
  | "en";

function revalidateOpportunityPaths(
  id: number,
) {
  revalidatePath(
    "/admin/opportunities",
  );

  revalidatePath(
    `/admin/opportunities/${id}`,
  );

  revalidatePath(
    "/ar/opportunities",
  );

  revalidatePath(
    "/en/opportunities",
  );

  revalidatePath(
    "/ar/publisher-dashboard",
  );

  revalidatePath(
    "/en/publisher-dashboard",
  );

  revalidatePath(
    "/ar/publisher-dashboard/opportunities",
  );

  revalidatePath(
    "/en/publisher-dashboard/opportunities",
  );

  revalidatePath(
    `/ar/publisher-dashboard/opportunities/${id}`,
  );

  revalidatePath(
    `/en/publisher-dashboard/opportunities/${id}`,
  );
}

function getEventTypeForStatus(
  status: OpportunityStatus,
) {
  switch (status) {
    case "published":
      return EVENT_TYPES
        .opportunity_published;

    case "rejected":
      return EVENT_TYPES
        .opportunity_rejected;

    case "needs_changes":
      return EVENT_TYPES
        .opportunity_needs_changes;

    default:
      return null;
  }
}

function getOpportunityId(
  formData: FormData,
) {
  const id =
    Number(
      formData.get("id"),
    );

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new Error(
      "Invalid opportunity ID.",
    );
  }

  return id;
}

function getOptionalText(
  formData: FormData,
  key: string,
) {
  const value =
    formData.get(key);

  if (
    typeof value !== "string"
  ) {
    return null;
  }

  return (
    value.trim() ||
    null
  );
}

function getLocale(
  formData: FormData,
): AdminLocale {
  return formData.get(
    "locale",
  ) === "en"
    ? "en"
    : "ar";
}

function formatDateOnly(
  date: Date,
) {
  return date
    .toISOString()
    .slice(
      0,
      10,
    );
}

function calculateApplicationDates(
  applicationDays: number,
) {
  const startDate =
    new Date();

  const deadlineDate =
    new Date(
      startDate,
    );

  deadlineDate.setUTCDate(
    deadlineDate.getUTCDate() +
      applicationDays,
  );

  return {
    applicationStartDate:
      formatDateOnly(
        startDate,
      ),

    applicationDeadline:
      formatDateOnly(
        deadlineDate,
      ),
  };
}

async function updateOpportunityStatus({
  id,
  status,
  published,
  locale = "ar",
  reason = null,
  adminNote = null,
}: {
  id: number;
  status: OpportunityStatus;
  published: boolean;

  locale?: AdminLocale;

  reason?: string | null;

  adminNote?: string | null;
}) {
  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new Error(
      "Invalid opportunity ID.",
    );
  }

  const cleanReason =
    reason?.trim() ||
    null;

  const cleanAdminNote =
    adminNote?.trim() ||
    null;

  /*
   * سبب طلب التعديل إلزامي.
   */
  if (
    status ===
      "needs_changes" &&
    !cleanReason
  ) {
    throw new Error(
      locale === "ar"
        ? "سبب طلب التعديل مطلوب."
        : "A reason for requesting changes is required.",
    );
  }

  /*
   * سبب الرفض إلزامي.
   */
  if (
    status ===
      "rejected" &&
    !cleanReason
  ) {
    throw new Error(
      locale === "ar"
        ? "سبب رفض الفرصة مطلوب."
        : "A rejection reason is required.",
    );
  }

  const adminUser =
    await requireAdminAccess();

  const opportunity =
    await OpportunityService
      .getStatusSnapshot(
        id,
      );

  if (!opportunity) {
    throw new Error(
      "Opportunity not found.",
    );
  }

  const adminClient =
  createAdminClient();

  let applicationStartDate:
    | string
    | null =
    null;

  let applicationDeadline:
    | string
    | null =
    null;

  let effectiveApplicationDays:
    | number
    | null =
    null;

  /*
   * تبدأ مدة استقبال الطلبات
   * عند اعتماد الإدارة ونشر الفرصة.
   */
  if (
  status ===
    "published" &&
  published
) {
  const {
    data: publisher,
    error: publisherError,
  } = await adminClient
    .from("publishers")
    .select("id, profile_id, status")
    .eq(
      "id",
      opportunity.publisher_id,
    )
    .maybeSingle();

  if (
    publisherError ||
    !publisher
  ) {
    throw new Error(
      locale === "ar"
        ? "تعذر العثور على حساب الناشر المرتبط بهذه الفرصة."
        : "The publisher account linked to this opportunity could not be found.",
    );
  }

  if (
    publisher.status ===
    "suspended"
  ) {
    throw new Error(
      locale === "ar"
        ? "لا يمكن نشر الفرصة لأن حساب الناشر موقوف."
        : "This opportunity cannot be published because the publisher account is suspended.",
    );
  }

  const {
    data: publisherProfile,
    error: publisherProfileError,
  } = await adminClient
    .from("profiles")
    .select("approval_status")
    .eq(
      "id",
      publisher.profile_id,
    )
    .eq(
      "account_type",
      "publisher",
    )
    .maybeSingle();

  if (
    publisherProfileError ||
    !publisherProfile
  ) {
    throw new Error(
      locale === "ar"
        ? "تعذر التحقق من حالة اعتماد الناشر."
        : "Unable to verify the publisher approval status.",
    );
  }

  if (
    publisherProfile.approval_status !==
    "approved"
  ) {
    throw new Error(
      locale === "ar"
        ? "لا يمكن نشر الفرصة قبل اعتماد ملف الناشر."
        : "The opportunity cannot be published until the publisher profile is approved.",
    );
  }

  const storedApplicationDays =
    Number(
      opportunity
        .application_days,
    );

    effectiveApplicationDays =
      Number.isInteger(
        storedApplicationDays,
      ) &&
      storedApplicationDays >=
        1 &&
      storedApplicationDays <=
        90
        ? storedApplicationDays
        : 30;

    const calculatedDates =
      calculateApplicationDates(
        effectiveApplicationDays,
      );

    applicationStartDate =
      calculatedDates
        .applicationStartDate;

    applicationDeadline =
      calculatedDates
        .applicationDeadline;

    const {
      data,
      error,
    } = await adminClient
      .from(
        "opportunities",
      )
      .update({
        status,
        published,

        application_days:
          effectiveApplicationDays,

        application_start_date:
          applicationStartDate,

        application_deadline:
          applicationDeadline,
      })
      .eq(
        "id",
        id,
      )
      .select(`
        id,
        status,
        published,
        application_days,
        application_start_date,
        application_deadline
      `)
      .maybeSingle();

    if (error) {
      console.error(
        "[AdminOpportunity publish]",
        error,
      );

      throw new Error(
        "Unable to publish the opportunity.",
      );
    }

    if (!data) {
      throw new Error(
        "Opportunity not found.",
      );
    }
  } else {
    await OpportunityService
      .updateStatus({
        id,
        status,
        published,
      });
  }

  /*
   * Events = سجل القرار +
   * مصدر الإشعار للناشر.
   */
  const eventType =
    getEventTypeForStatus(
      status,
    );

  if (
    eventType &&
    opportunity.publisher_id
  ) {
    try {
      await createEvent({
        type:
          eventType,

        target:
          EVENT_TARGETS
            .PUBLISHER,

        targetId:
          opportunity
            .publisher_id,

        actorId:
          adminUser.id,

        metadata: {
          opportunityId:
            id,

          title:
            opportunity.title ??
            null,

          locale,

          reason:
            cleanReason,

          adminNote:
            cleanAdminNote,

          previousStatus:
            opportunity.status ??
            null,

          newStatus:
            status,

          published,

          applicationDays:
            effectiveApplicationDays,

          applicationStartDate,

          applicationDeadline,

          reviewedBy:
            adminUser.id,

          reviewedAt:
            new Date()
              .toISOString(),
        },
      });
    } catch (
      eventError
    ) {
      /*
       * لا نفشل قرار الإدارة
       * إذا فشل إنشاء الإشعار.
       */
      console.error(
        "[AdminOpportunity event]",
        eventError,
      );
    }
  }

  revalidateOpportunityPaths(
    id,
  );
}

export async function publishOpportunityAction(
  formData: FormData,
) {
  const id =
    getOpportunityId(
      formData,
    );

  const locale =
    getLocale(
      formData,
    );

  await updateOpportunityStatus({
    id,
    status:
      "published",
    published: true,
    locale,

    adminNote:
      getOptionalText(
        formData,
        "admin_note",
      ),
  });
}

export async function hideOpportunityAction(
  formData: FormData,
) {
  const id =
    getOpportunityId(
      formData,
    );

  const locale =
    getLocale(
      formData,
    );

  await updateOpportunityStatus({
    id,
    status:
      "draft",
    published: false,
    locale,
  });
}

export async function rejectOpportunityAction(
  formData: FormData,
) {
  const id =
    getOpportunityId(
      formData,
    );

  const locale =
    getLocale(
      formData,
    );

  await updateOpportunityStatus({
    id,
    status:
      "rejected",
    published: false,
    locale,

    reason:
      getOptionalText(
        formData,
        "reason",
      ),

    adminNote:
      getOptionalText(
        formData,
        "admin_note",
      ),
  });
}

export async function requestChangesOpportunityAction(
  formData: FormData,
) {
  const id =
    getOpportunityId(
      formData,
    );

  const locale =
    getLocale(
      formData,
    );

  await updateOpportunityStatus({
    id,
    status:
      "needs_changes",
    published: false,
    locale,

    reason:
      getOptionalText(
        formData,
        "reason",
      ),

    adminNote:
      getOptionalText(
        formData,
        "admin_note",
      ),
  });
}

export async function archiveOpportunityAction(
  formData: FormData,
) {
  const id =
    getOpportunityId(
      formData,
    );

  const locale =
    getLocale(
      formData,
    );

  await updateOpportunityStatus({
    id,
    status:
      "archived",
    published: false,
    locale,
  });
}