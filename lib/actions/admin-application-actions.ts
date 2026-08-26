"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  createEvent,
  EVENT_TARGETS,
  EVENT_TYPES,
} from "@/lib/events";

import {
  type AdminApplicationStatus,
  getAdminApplicationById,
  updateAdminApplicationStatus,
} from "@/lib/supabase/admin-applications";

type ApplicationRelation = {
  id: number;
  title?: string | null;
  name_ar?: string | null;
  name_en?: string | null;
  publisher_id?: number | null;
  role_requirements?: Record<string, unknown> | null;
};

function getApplicationId(
  formData: FormData,
) {
  const id = Number(
    formData.get("application_id"),
  );

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new Error(
      "Invalid application ID.",
    );
  }

  return id;
}

function getLocale(
  formData: FormData,
): "ar" | "en" {
  return formData.get("locale") === "en"
    ? "en"
    : "ar";
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

  return value.trim() || null;
}

function normalizeRelation<T>(
  value: T | T[] | null,
): T | null {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function isMlamhManagedOpportunity(
  opportunity: ApplicationRelation | null,
) {
  return (
    opportunity?.publisher_id == null &&
    opportunity?.role_requirements?.managed_by === "mlamh"
  );
}

async function ensureMlamhAcceptedConversation({
  applicationId,
  opportunityId,
  talentId,
  adminUserId,
}: {
  applicationId: number;
  opportunityId: number;
  talentId: number;
  adminUserId: string;
}) {
  const adminClient = createAdminClient();

  const {
    data: existingConversation,
    error: existingConversationError,
  } = await adminClient
    .from("conversations")
    .select("id")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (existingConversationError) {
    throw new Error(
      `[ensureMlamhAcceptedConversation lookup] ${existingConversationError.message}`,
    );
  }

  if (existingConversation) {
    return existingConversation.id;
  }

  const now = new Date().toISOString();

  const {
    data: createdConversation,
    error: createConversationError,
  } = await adminClient
    .from("conversations")
    .insert({
      application_id: applicationId,
      opportunity_id: opportunityId,
      publisher_id: null,
      talent_id: talentId,
      admin_user_id: adminUserId,
      conversation_type: "mlamh_talent",
      status: "active",
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (createConversationError || !createdConversation) {
    if (createConversationError?.code === "23505") {
      const {
        data: concurrentConversation,
        error: concurrentConversationError,
      } = await adminClient
        .from("conversations")
        .select("id")
        .eq("application_id", applicationId)
        .maybeSingle();

      if (
        !concurrentConversationError &&
        concurrentConversation
      ) {
        return concurrentConversation.id;
      }
    }

    throw new Error(
      `[ensureMlamhAcceptedConversation create] ${
        createConversationError?.message ??
        "Unable to create MLAMH conversation."
      }`,
    );
  }

  return createdConversation.id;
}

function getEventType(
  status: AdminApplicationStatus,
) {
  switch (status) {
    case "shortlisted":
      return EVENT_TYPES
        .application_shortlisted;

    case "accepted":
      return EVENT_TYPES
        .application_accepted;

    case "rejected":
      return EVENT_TYPES
        .application_rejected;

    default:
      return null;
  }
}

function revalidateApplicationPaths(
  id: number,
) {
  revalidatePath(
    "/admin/opportunity-applications",
  );

  revalidatePath(
    `/admin/opportunity-applications/${id}`,
  );

  revalidatePath(
    "/ar/talent-dashboard",
  );

  revalidatePath(
    "/en/talent-dashboard",
  );

  revalidatePath(
    "/ar/talent-dashboard/applications",
  );

  revalidatePath(
    "/en/talent-dashboard/applications",
  );

  revalidatePath(
    "/ar/publisher-dashboard",
  );

  revalidatePath(
    "/en/publisher-dashboard",
  );

  revalidatePath(
    "/ar/publisher-dashboard/applications",
  );

  revalidatePath(
    "/en/publisher-dashboard/applications",
  );

  revalidatePath("/admin/messages");

revalidatePath(
  "/ar/talent-dashboard/messages",
);

revalidatePath(
  "/en/talent-dashboard/messages",
);
}

async function setApplicationStatus(
  formData: FormData,
  status: AdminApplicationStatus,
) {
  const adminUser =
    await requireAdminAccess();

  const id =
    getApplicationId(
      formData,
    );

  const locale =
    getLocale(
      formData,
    );

  const reason =
    getOptionalText(
      formData,
      "reason",
    );

  /*
   * الرفض يجب أن يحتوي على سبب.
   */
  if (
    status === "rejected" &&
    !reason
  ) {
    throw new Error(
      locale === "ar"
        ? "سبب رفض الطلب مطلوب."
        : "A rejection reason is required.",
    );
  }

  const application =
    await getAdminApplicationById(
      id,
    );

  if (!application) {
    throw new Error(
      "Application not found.",
    );
  }

  const currentStatus =
    (application.status ||
      "pending") as AdminApplicationStatus;

  /*
   * لا نعيد تنفيذ نفس القرار.
   */


  const opportunity =
    normalizeRelation(
      application.opportunities,
    ) as ApplicationRelation | null;

  const talent =
    normalizeRelation(
      application.talents,
    ) as ApplicationRelation | null;

    if (currentStatus === status) {
      if (
        status === "accepted" &&
        isMlamhManagedOpportunity(opportunity) &&
        opportunity?.id &&
        talent?.id
      ) {
        await ensureMlamhAcceptedConversation({
          applicationId: id,
          opportunityId: opportunity.id,
          talentId: talent.id,
          adminUserId: adminUser.id,
        });
      }
    
      revalidateApplicationPaths(id);
    
      return;
    }

  /*
   * الطلب المقبول يعتبر قرارًا نهائيًا
   * من واجهة الإدارة الحالية.
   */
  if (
    currentStatus === "accepted" &&
    status !== "accepted"
  ) {
    throw new Error(
      locale === "ar"
        ? "لا يمكن تغيير حالة طلب مقبول مباشرة."
        : "An accepted application cannot be changed directly.",
    );
  }

  await updateAdminApplicationStatus({
    id,
    status,
  });
  
  if (
    status === "accepted" &&
    isMlamhManagedOpportunity(opportunity) &&
    opportunity?.id &&
    talent?.id
  ) {
    try {
      await ensureMlamhAcceptedConversation({
        applicationId: id,
        opportunityId: opportunity.id,
        talentId: talent.id,
        adminUserId: adminUser.id,
      });
    } catch (error) {
      // لا نترك الطلب مقبولًا بدون محادثة في فرص MLAMH.
      await updateAdminApplicationStatus({
        id,
        status: currentStatus,
      });
  
      throw error;
    }
  }

const eventType =
  getEventType(
    status,
  );

  /*
   * الإشعار يذهب للموهبة صاحبة الطلب.
   */
  if (
    eventType &&
    talent?.id
  ) {
    await createEvent({
      type: eventType,

      target:
        EVENT_TARGETS.TALENT,

      targetId:
        talent.id,

      actorId:
        adminUser.id,

      metadata: {
        applicationId:
          id,

        opportunityId:
          opportunity?.id ??
          null,

        title:
          opportunity?.title ??
          null,

        previousStatus:
          currentStatus,

        newStatus:
          status,

        reason,

        locale,

        reviewedBy:
          adminUser.id,

        reviewedAt:
          new Date()
            .toISOString(),
      },
    });
  }

  revalidateApplicationPaths(
    id,
  );
}

export async function markPendingApplicationAction(
  formData: FormData,
) {
  await setApplicationStatus(
    formData,
    "pending",
  );
}

export async function shortlistApplicationAction(
  formData: FormData,
) {
  await setApplicationStatus(
    formData,
    "shortlisted",
  );
}

export async function acceptApplicationAction(
  formData: FormData,
) {
  await setApplicationStatus(
    formData,
    "accepted",
  );
}

export async function rejectAdminApplicationAction(
  formData: FormData,
) {
  await setApplicationStatus(
    formData,
    "rejected",
  );
}