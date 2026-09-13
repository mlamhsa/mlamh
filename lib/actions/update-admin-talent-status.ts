"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { TALENT_CATEGORIES } from "@/lib/data/talent-categories";
import { isActiveTalentCountryCode } from "@/lib/data/talent-active-market";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTalentProfileReviewReadiness } from "@/lib/talent/profile-review-readiness";

type AdminTalentActionResult = {
  success: boolean;
  message: string;
};

type TalentOperationalStatus = "active" | "suspended";

type TalentActionRow = {
  id: number | string;
  user_id: string | null;
  slug: string | null;
  status: string | null;
  published: boolean | null;
};

type PublishTalentRow = TalentActionRow & {
  image_url: string | null;
  profile_visibility: string | null;
  name_ar: string | null;
  name_en: string | null;
  primary_role: string | null;
  category_slug: string | null;
  base_country_code: string | null;
  city_slug: string | null;
  gender: string | null;
  nationality_slug: string | null;
  nationality: string | null;
  date_of_birth: string | null;
};

function revalidateTalentPaths(
  talentId: number | string,
  slug?: string | null,
) {
  revalidatePath("/admin");
  revalidatePath("/admin/talents");
  revalidatePath(`/admin/talents/${talentId}`);

  revalidatePath("/ar/talent-dashboard");
  revalidatePath("/ar/talent-dashboard/profile");
  revalidatePath("/en/talent-dashboard");
  revalidatePath("/en/talent-dashboard/profile");

  revalidatePath("/ar/talent");
  revalidatePath("/en/talent");

  if (slug) {
    revalidatePath(`/ar/talent/${slug}`);
    revalidatePath(`/en/talent/${slug}`);
  }
}

export async function updateAdminTalentStatusAction(
  talentId: number | string,
  nextStatus: TalentOperationalStatus,
): Promise<AdminTalentActionResult> {
  await requireAdminAccess();

  if (nextStatus !== "active" && nextStatus !== "suspended") {
    return {
      success: false,
      message: "حالة الموهبة المطلوبة غير صالحة.",
    };
  }

  const adminClient = createAdminClient();
  const { data: talent, error: talentError } = await adminClient
    .from("talents")
    .select("id,user_id,slug,status,published")
    .eq("id", talentId)
    .maybeSingle();

  if (talentError) {
    console.error("[updateAdminTalentStatusAction load]", talentError);
    return { success: false, message: "تعذر تحميل بيانات الموهبة." };
  }

  if (!talent) {
    return { success: false, message: "الموهبة غير موجودة." };
  }

  const currentTalent = talent as TalentActionRow;
  if (currentTalent.status === nextStatus) {
    return {
      success: true,
      message:
        nextStatus === "active"
          ? "الموهبة مفعلة بالفعل."
          : "الموهبة موقوفة بالفعل.",
    };
  }

  const { data: updatedTalent, error: updateError } = await adminClient
    .from("talents")
    .update({ status: nextStatus })
    .eq("id", talentId)
    .select("id,user_id,slug,status,published")
    .maybeSingle();

  if (updateError) {
    console.error("[updateAdminTalentStatusAction update]", updateError);
    return {
      success: false,
      message:
        nextStatus === "active"
          ? "تعذر تفعيل الموهبة."
          : "تعذر إيقاف الموهبة.",
    };
  }

  if (!updatedTalent) {
    return { success: false, message: "تعذر تحديث حالة الموهبة." };
  }

  revalidateTalentPaths(talentId, updatedTalent.slug);
  return {
    success: true,
    message:
      nextStatus === "active"
        ? "تم تفعيل الموهبة."
        : "تم إيقاف الموهبة.",
  };
}

/**
 * Manual publish is an admin approval operation for public profiles.
 *
 * The user's data/contact consent remains a hard gate for self-submission,
 * but an explicit admin approval must not leave a profile in the contradictory
 * state `published=true` + `draft/not_submitted`. All other canonical profile
 * requirements are still enforced before public publication.
 *
 * Hiding a profile remains an operational visibility action only and does not
 * revoke its approval.
 */
export async function updateAdminTalentPublishedAction(
  talentId: number | string,
  published: boolean,
): Promise<AdminTalentActionResult> {
  const adminUser = await requireAdminAccess();
  const adminClient = createAdminClient();

  const { data: talent, error: talentError } = await adminClient
    .from("talents")
    .select(
      "id,user_id,slug,status,published,image_url,profile_visibility,name_ar,name_en,primary_role,category_slug,base_country_code,city_slug,gender,nationality_slug,nationality,date_of_birth",
    )
    .eq("id", talentId)
    .maybeSingle();

  if (talentError) {
    console.error("[updateAdminTalentPublishedAction load]", talentError);
    return { success: false, message: "تعذر تحميل بيانات الموهبة." };
  }

  if (!talent) {
    return { success: false, message: "الموهبة غير موجودة." };
  }

  const currentTalent = talent as PublishTalentRow;

  if (!published) {
    if (currentTalent.published !== true) {
      return { success: true, message: "الملف مخفي بالفعل." };
    }

    const { data: updatedTalent, error: updateError } = await adminClient
      .from("talents")
      .update({ published: false })
      .eq("id", talentId)
      .select("id,slug,published")
      .maybeSingle();

    if (updateError || !updatedTalent) {
      console.error("[updateAdminTalentPublishedAction hide]", updateError);
      return { success: false, message: "تعذر إخفاء ملف الموهبة." };
    }

    revalidateTalentPaths(talentId, updatedTalent.slug);
    return { success: true, message: "تم إخفاء ملف الموهبة." };
  }

  const visibility = String(currentTalent.profile_visibility ?? "public")
    .trim()
    .toLowerCase();

  if (visibility !== "public") {
    return {
      success: false,
      message:
        "هذه الموهبة اختارت ملفًا خاصًا، لذلك لا يمكن نشرها في الدليل العام دون تغيير خيار ظهور الملف.",
    };
  }

  if (!currentTalent.user_id) {
    return {
      success: false,
      message: "لا يمكن نشر الملف لأنه غير مرتبط بحساب موهبة.",
    };
  }

  const activeRole = String(
    currentTalent.primary_role ?? currentTalent.category_slug ?? "",
  )
    .trim()
    .toLowerCase();
  const roleIsActive = TALENT_CATEGORIES.some(
    (category) => category.slug === activeRole,
  );

  if (!roleIsActive || !isActiveTalentCountryCode(currentTalent.base_country_code)) {
    return {
      success: false,
      message:
        "لا يمكن نشر الملف: الإطلاق الحالي متاح للممثلين والمودلز المقيمين في السعودية فقط.",
    };
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id,account_type,approval_status,phone,data_accuracy_contact_consent")
    .eq("user_id", currentTalent.user_id)
    .maybeSingle();

  if (profileError) {
    console.error("[updateAdminTalentPublishedAction profile]", profileError);
    return { success: false, message: "تعذر قراءة حالة مراجعة الموهبة." };
  }

  if (!profile || profile.account_type !== "talent") {
    return {
      success: false,
      message: "لم يتم العثور على حساب موهبة مرتبط بهذا الملف.",
    };
  }

  const readiness = getTalentProfileReviewReadiness({
    ...currentTalent,
    phone: profile.phone,
    data_accuracy_contact_consent: true,
  });

  const blockingMissingRequirements = readiness.missingRequirements.filter(
    (requirement) => requirement.key !== "data_accuracy_contact_consent",
  );

  if (blockingMissingRequirements.length > 0) {
    return {
      success: false,
      message: `لا يمكن اعتماد ونشر الملف قبل اكتمال المتطلبات الأساسية: ${blockingMissingRequirements
        .map((requirement) => requirement.ar)
        .join("، ")}`,
    };
  }

  const previousApprovalStatus = profile.approval_status ?? "not_submitted";
  const previousTalentStatus = currentTalent.status;
  const previousPublished = currentTalent.published === true;

  if (previousApprovalStatus !== "approved") {
    const { error: profileUpdateError } = await adminClient
      .from("profiles")
      .update({ approval_status: "approved" })
      .eq("id", profile.id)
      .eq("account_type", "talent");

    if (profileUpdateError) {
      console.error(
        "[updateAdminTalentPublishedAction approve profile]",
        profileUpdateError,
      );
      return { success: false, message: "تعذر اعتماد حساب الموهبة." };
    }
  }

  const { data: updatedTalent, error: talentUpdateError } = await adminClient
    .from("talents")
    .update({ status: "approved", published: true })
    .eq("id", talentId)
    .select("id,slug,status,published")
    .maybeSingle();

  if (
    talentUpdateError ||
    !updatedTalent ||
    updatedTalent.status !== "approved" ||
    updatedTalent.published !== true
  ) {
    console.error(
      "[updateAdminTalentPublishedAction approve talent]",
      talentUpdateError ?? { updatedTalent },
    );

    if (previousApprovalStatus !== "approved") {
      await adminClient
        .from("profiles")
        .update({ approval_status: previousApprovalStatus })
        .eq("id", profile.id)
        .eq("account_type", "talent");
    }

    return {
      success: false,
      message: "تعذر إكمال اعتماد ونشر ملف الموهبة.",
    };
  }

  if (previousApprovalStatus !== "approved") {
    const { error: historyError } = await adminClient
      .from("profile_review_history")
      .insert({
        profile_id: profile.id,
        account_type: "talent",
        talent_id: talentId,
        reviewer_user_id: adminUser.id,
        decision: "approved",
        reason: null,
        admin_note: "Approved through the admin publish control.",
        previous_status: previousApprovalStatus,
        new_status: "approved",
      });

    if (historyError) {
      console.error(
        "[updateAdminTalentPublishedAction history]",
        historyError,
      );

      await Promise.all([
        adminClient
          .from("profiles")
          .update({ approval_status: previousApprovalStatus })
          .eq("id", profile.id)
          .eq("account_type", "talent"),
        adminClient
          .from("talents")
          .update({
            status: previousTalentStatus,
            published: previousPublished,
          })
          .eq("id", talentId),
      ]);

      return {
        success: false,
        message: "تعذر حفظ سجل الاعتماد، لذلك تم إلغاء عملية النشر.",
      };
    }
  }

  revalidateTalentPaths(talentId, updatedTalent.slug);

  return {
    success: true,
    message:
      profile.data_accuracy_contact_consent === true
        ? "تم اعتماد ملف الموهبة ونشره في الدليل العام."
        : "تم اعتماد ملف الموهبة ونشره في الدليل العام. موافقة دقة البيانات والتواصل ما زالت غير مكتملة لدى الموهبة، لكنها لا تمنع اعتماد الإدارة.",
  };
}
