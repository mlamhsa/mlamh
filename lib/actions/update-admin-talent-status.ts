"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminTalentActionResult = {
  success: boolean;
  message: string;
};

type TalentOperationalStatus =
  | "active"
  | "suspended";

type TalentActionRow = {
  id: number | string;
  user_id: string | null;
  slug: string | null;
  status: string | null;
  published: boolean | null;
};

function revalidateTalentPaths(
  talentId: number | string,
  slug?: string | null,
) {
  /*
   * لوحة الإدارة.
   */
  revalidatePath("/admin");

  revalidatePath(
    `/admin/talents/${talentId}`,
  );

  /*
   * لوحة الموهبة.
   */
  revalidatePath(
    "/ar/talent-dashboard",
  );

  revalidatePath(
    "/ar/talent-dashboard/profile",
  );

  revalidatePath(
    "/en/talent-dashboard",
  );

  revalidatePath(
    "/en/talent-dashboard/profile",
  );

  /*
   * قوائم المواهب العامة.
   */
  revalidatePath("/ar/talents");
  revalidatePath("/en/talents");

  /*
   * الصفحة العامة للموهبة،
   * إذا كان لديها slug.
   */
  if (slug) {
    revalidatePath(
      `/ar/talent/${slug}`,
    );

    revalidatePath(
      `/en/talent/${slug}`,
    );
  }
}

/**
 * تفعيل أو إيقاف حساب الموهبة تشغيليًا.
 *
 * مهم:
 * status مستقل عن published.
 *
 * active:
 * الحساب يعمل بشكل طبيعي.
 *
 * suspended:
 * الحساب موقوف إداريًا.
 *
 * لا نغير published هنا حتى لا نفقد
 * حالة النشر الأصلية عند إعادة التفعيل.
 */
export async function updateAdminTalentStatusAction(
  talentId: number | string,
  nextStatus: TalentOperationalStatus,
): Promise<AdminTalentActionResult> {
  await requireAdminAccess();

  if (
    nextStatus !== "active" &&
    nextStatus !== "suspended"
  ) {
    return {
      success: false,
      message:
        "حالة الموهبة المطلوبة غير صالحة.",
    };
  }

  const adminClient =
    createAdminClient();

  const {
    data: talent,
    error: talentError,
  } = await adminClient
    .from("talents")
    .select(`
      id,
      user_id,
      slug,
      status,
      published
    `)
    .eq("id", talentId)
    .maybeSingle();

  if (talentError) {
    console.error(
      "[updateAdminTalentStatusAction load]",
      talentError,
    );

    return {
      success: false,
      message:
        "تعذر تحميل بيانات الموهبة.",
    };
  }

  if (!talent) {
    return {
      success: false,
      message:
        "الموهبة غير موجودة.",
    };
  }

  const currentTalent =
    talent as TalentActionRow;

  if (
    currentTalent.status ===
    nextStatus
  ) {
    return {
      success: true,
      message:
        nextStatus === "active"
          ? "الموهبة مفعلة بالفعل."
          : "الموهبة موقوفة بالفعل.",
    };
  }

  const {
    data: updatedTalent,
    error: updateError,
  } = await adminClient
    .from("talents")
    .update({
      status: nextStatus,
    })
    .eq("id", talentId)
    .select(`
      id,
      user_id,
      slug,
      status,
      published
    `)
    .maybeSingle();

  if (updateError) {
    console.error(
      "[updateAdminTalentStatusAction update]",
      updateError,
    );

    return {
      success: false,
      message:
        nextStatus === "active"
          ? "تعذر تفعيل الموهبة."
          : "تعذر إيقاف الموهبة.",
    };
  }

  if (!updatedTalent) {
    return {
      success: false,
      message:
        "تعذر تحديث حالة الموهبة.",
    };
  }

  revalidateTalentPaths(
    talentId,
    updatedTalent.slug,
  );

  return {
    success: true,
    message:
      nextStatus === "active"
        ? "تم تفعيل الموهبة."
        : "تم إيقاف الموهبة.",
  };
}

/**
 * نشر أو إخفاء ملف الموهبة.
 *
 * هذا الإجراء يغير published فقط،
 * ولا يغير status.
 */
export async function updateAdminTalentPublishedAction(
  talentId: number | string,
  published: boolean,
): Promise<AdminTalentActionResult> {
  await requireAdminAccess();

  const adminClient =
    createAdminClient();

  const {
    data: talent,
    error: talentError,
  } = await adminClient
    .from("talents")
    .select(`
      id,
      user_id,
      slug,
      status,
      published
    `)
    .eq("id", talentId)
    .maybeSingle();

  if (talentError) {
    console.error(
      "[updateAdminTalentPublishedAction load]",
      talentError,
    );

    return {
      success: false,
      message:
        "تعذر تحميل بيانات الموهبة.",
    };
  }

  if (!talent) {
    return {
      success: false,
      message:
        "الموهبة غير موجودة.",
    };
  }

  const currentTalent =
    talent as TalentActionRow;

  if (
    currentTalent.published ===
    published
  ) {
    return {
      success: true,
      message: published
        ? "الملف منشور بالفعل."
        : "الملف مخفي بالفعل.",
    };
  }

  const {
    data: updatedTalent,
    error: updateError,
  } = await adminClient
    .from("talents")
    .update({
      published,
    })
    .eq("id", talentId)
    .select(`
      id,
      user_id,
      slug,
      status,
      published
    `)
    .maybeSingle();

  if (updateError) {
    console.error(
      "[updateAdminTalentPublishedAction update]",
      updateError,
    );

    return {
      success: false,
      message: published
        ? "تعذر نشر ملف الموهبة."
        : "تعذر إخفاء ملف الموهبة.",
    };
  }

  if (!updatedTalent) {
    return {
      success: false,
      message:
        "تعذر تحديث ظهور الملف.",
    };
  }

  revalidateTalentPaths(
    talentId,
    updatedTalent.slug,
  );

  return {
    success: true,
    message: published
      ? "تم نشر ملف الموهبة."
      : "تم إخفاء ملف الموهبة.",
  };
}