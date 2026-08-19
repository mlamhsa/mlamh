"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAccess } from "@/lib/auth/require-admin";

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
  if (
    currentStatus === status
  ) {
    revalidateApplicationPaths(
      id,
    );

    return;
  }

  const opportunity =
    normalizeRelation(
      application.opportunities,
    ) as ApplicationRelation | null;

  const talent =
    normalizeRelation(
      application.talents,
    ) as ApplicationRelation | null;

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