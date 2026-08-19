"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createDisplayName } from "@/lib/actions/talent-profile-utils";
import { createAdminClient } from "@/lib/supabase/admin";

type ReviewTalentProfileChangeResult = {
  success: boolean;
  message: string;
};

type TalentProfileChangeRequest = {
  id: number | string;
  user_id: string;
  talent_id: number | string;
  requested_name_ar: string | null;
  requested_name_en: string | null;
  requested_phone: string | null;
  requested_nationality_slug: string | null;
  status: string;
};

export async function approveTalentProfileChangeAction(
  requestId: number | string,
): Promise<ReviewTalentProfileChangeResult> {
  const adminUser = await requireAdminAccess();
  const adminClient = createAdminClient();

  const {
    data: request,
    error: requestError,
  } = await adminClient
    .from("talent_profile_change_requests")
    .select(`
      id,
      user_id,
      talent_id,
      requested_name_ar,
      requested_name_en,
      requested_phone,
      requested_nationality_slug,
      status
    `)
    .eq("id", requestId)
    .maybeSingle();

  if (requestError) {
    console.error(
      "[approveTalentProfileChangeAction request]",
      requestError,
    );

    return {
      success: false,
      message: "تعذر تحميل طلب التعديل.",
    };
  }

  if (!request) {
    return {
      success: false,
      message: "طلب التعديل غير موجود.",
    };
  }

  const changeRequest =
    request as TalentProfileChangeRequest;

  if (changeRequest.status !== "pending") {
    return {
      success: false,
      message: "تمت معالجة هذا الطلب مسبقًا.",
    };
  }

  /*
   * نحدّث فقط البيانات المحمية.
   *
   * لا نلمس:
   * - verified
   * - approval_status
   * - talents.status
   */
  const talentPayload: Record<string, unknown> = {};

  if (changeRequest.requested_name_ar !== null) {
    talentPayload.name_ar =
      changeRequest.requested_name_ar;

    talentPayload.display_name_ar =
      createDisplayName(
        changeRequest.requested_name_ar,
      );
  }

  if (changeRequest.requested_name_en !== null) {
    talentPayload.name_en =
      changeRequest.requested_name_en;

    talentPayload.display_name_en =
      createDisplayName(
        changeRequest.requested_name_en,
      );
  }

  if (
    changeRequest.requested_nationality_slug !== null
  ) {
    talentPayload.nationality_slug =
      changeRequest.requested_nationality_slug;

    /*
     * المشروع حاليًا يحفظ نفس القيمة في الحقلين
     * nationality و nationality_slug.
     */
    talentPayload.nationality =
      changeRequest.requested_nationality_slug;
  }

  /*
   * ننفذ تحديث الموهبة فقط إذا كان هناك شيء
   * فعلي مطلوب تحديثه.
   */
  if (Object.keys(talentPayload).length > 0) {
    const { error: talentUpdateError } =
      await adminClient
        .from("talents")
        .update(talentPayload)
        .eq("id", changeRequest.talent_id)
        .eq("user_id", changeRequest.user_id);

    if (talentUpdateError) {
      console.error(
        "[approveTalentProfileChangeAction talent]",
        talentUpdateError,
      );

      return {
        success: false,
        message: "تعذر تحديث بيانات الموهبة.",
      };
    }
  }

  /*
   * رقم الجوال موجود في profiles وليس talents.
   */
  if (changeRequest.requested_phone !== null) {
    const { error: phoneUpdateError } =
      await adminClient
        .from("profiles")
        .update({
          phone: changeRequest.requested_phone,
        })
        .eq("user_id", changeRequest.user_id);

    if (phoneUpdateError) {
      console.error(
        "[approveTalentProfileChangeAction phone]",
        phoneUpdateError,
      );

      return {
        success: false,
        message: "تعذر تحديث رقم الجوال.",
      };
    }
  }

  const reviewedAt = new Date().toISOString();

  const { error: reviewUpdateError } =
    await adminClient
      .from("talent_profile_change_requests")
      .update({
        status: "approved",
        reviewed_at: reviewedAt,
        reviewed_by: adminUser.id,
      })
      .eq("id", changeRequest.id)
      .eq("status", "pending");

  if (reviewUpdateError) {
    console.error(
      "[approveTalentProfileChangeAction review]",
      reviewUpdateError,
    );

    return {
      success: false,
      message:
        "تم تحديث البيانات، لكن تعذر إغلاق طلب المراجعة.",
    };
  }

  revalidatePath("/admin/talents");
  revalidatePath(
    `/admin/talents/${changeRequest.talent_id}`,
  );

  revalidatePath("/ar/talent-dashboard");
  revalidatePath("/ar/talent-dashboard/profile");

  revalidatePath("/en/talent-dashboard");
  revalidatePath("/en/talent-dashboard/profile");

  return {
    success: true,
    message: "تم اعتماد التغييرات وتحديث البيانات.",
  };
}

export async function rejectTalentProfileChangeAction(
  requestId: number | string,
): Promise<ReviewTalentProfileChangeResult> {
  const adminUser = await requireAdminAccess();
  const adminClient = createAdminClient();

  const {
    data: request,
    error: requestError,
  } = await adminClient
    .from("talent_profile_change_requests")
    .select(`
      id,
      user_id,
      talent_id,
      status
    `)
    .eq("id", requestId)
    .maybeSingle();

  if (requestError) {
    console.error(
      "[rejectTalentProfileChangeAction request]",
      requestError,
    );

    return {
      success: false,
      message: "تعذر تحميل طلب التعديل.",
    };
  }

  if (!request) {
    return {
      success: false,
      message: "طلب التعديل غير موجود.",
    };
  }

  if (request.status !== "pending") {
    return {
      success: false,
      message: "تمت معالجة هذا الطلب مسبقًا.",
    };
  }

  const reviewedAt = new Date().toISOString();

  const { error: reviewUpdateError } =
    await adminClient
      .from("talent_profile_change_requests")
      .update({
        status: "rejected",
        reviewed_at: reviewedAt,
        reviewed_by: adminUser.id,
      })
      .eq("id", request.id)
      .eq("status", "pending");

  if (reviewUpdateError) {
    console.error(
      "[rejectTalentProfileChangeAction review]",
      reviewUpdateError,
    );

    return {
      success: false,
      message: "تعذر إغلاق طلب المراجعة.",
    };
  }

  revalidatePath("/admin/talents");
  revalidatePath(
    `/admin/talents/${request.talent_id}`,
  );

  revalidatePath("/ar/talent-dashboard");
  revalidatePath("/ar/talent-dashboard/profile");

  revalidatePath("/en/talent-dashboard");
  revalidatePath("/en/talent-dashboard/profile");

  return {
    success: true,
    message:
      "تم رفض التغييرات والإبقاء على البيانات الحالية.",
  };
}