"use server";

import { revalidatePath } from "next/cache";
import { createEvent } from "@/lib/events/create-event";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

type ReviewDecision =
  | "approved"
  | "changes_requested"
  | "rejected";

type ReviewActionResult = {
  success: boolean;
  message: string;
  status?: ReviewDecision;
};

function parseTalentId(formData: FormData): number {
  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid talent id.");
  }

  return id;
}

function getLocale(formData: FormData): "ar" | "en" {
  return formData.get("locale") === "en"
    ? "en"
    : "ar";
}

function getOptionalText(
  formData: FormData,
  key: string,
) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized || null;
}

function revalidateTalentReviewPaths(
  id: number,
) {
  revalidatePath("/admin");
  revalidatePath("/admin/talents");
  revalidatePath(`/admin/talents/${id}`);
  revalidatePath(`/admin/talents/${id}/edit`);

  revalidatePath("/ar/talents");
  revalidatePath("/en/talents");

  revalidatePath("/ar/talent-dashboard");
  revalidatePath("/en/talent-dashboard");

  revalidatePath(
    "/ar/talent-dashboard/profile",
  );
  revalidatePath(
    "/en/talent-dashboard/profile",
  );
}

async function updateTalentReviewStatus({
  id,
  decision,
  locale,
  reason,
  adminNote,
}: {
  id: number;
  decision: ReviewDecision;
  locale: "ar" | "en";
  reason?: string | null;
  adminNote?: string | null;
}): Promise<ReviewActionResult> {
  const adminUser =
    await requireAdminAccess();

  const adminClient =
    createAdminClient();

  /*
   * 1. قراءة الموهبة والحالة الحالية
   */
  const {
    data: talent,
    error: talentError,
  } = await adminClient
    .from("talents")
    .select(
      "id, user_id, status, published",
    )
    .eq("id", id)
    .maybeSingle();

  if (talentError) {
    console.error(
      "[updateTalentReviewStatus talent]",
      talentError,
    );

    return {
      success: false,
      message:
        locale === "ar"
          ? "تعذر تحميل ملف الموهبة."
          : "Unable to load the talent profile.",
    };
  }

  if (!talent) {
    return {
      success: false,
      message:
        locale === "ar"
          ? "لم يتم العثور على ملف الموهبة."
          : "Talent profile not found.",
    };
  }

  if (!talent.user_id) {
    return {
      success: false,
      message:
        locale === "ar"
          ? "ملف الموهبة غير مرتبط بحساب مستخدم."
          : "The talent profile is not linked to a user account.",
    };
  }

  /*
   * 2. profiles.approval_status هو المصدر
   * الرئيسي لحالة المراجعة.
   *
   * نحتاج profile.id أيضًا لتسجيل القرار
   * في profile_review_history.
   */
  const {
    data: profile,
    error: profileError,
  } = await adminClient
    .from("profiles")
    .select(
      "id, approval_status",
    )
    .eq(
      "user_id",
      talent.user_id,
    )
    .maybeSingle();

  if (profileError) {
    console.error(
      "[updateTalentReviewStatus profile read]",
      profileError,
    );

    return {
      success: false,
      message:
        locale === "ar"
          ? "تعذر قراءة حالة المراجعة الحالية."
          : "Unable to read the current review status.",
    };
  }

  if (!profile) {
    return {
      success: false,
      message:
        locale === "ar"
          ? "لم يتم العثور على حساب الموهبة المرتبط."
          : "The linked talent account could not be found.",
    };
  }

  const previousStatus =
    profile.approval_status ??
    "not_submitted";

  /*
   * 3. السبب إلزامي لطلب التعديل والرفض.
   */
  if (
    decision === "changes_requested" &&
    !reason
  ) {
    return {
      success: false,
      message:
        locale === "ar"
          ? "اكتب سبب طلب التعديل."
          : "Please provide a reason for requesting changes.",
    };
  }

  if (
    decision === "rejected" &&
    !reason
  ) {
    return {
      success: false,
      message:
        locale === "ar"
          ? "اكتب سبب رفض الملف."
          : "Please provide a reason for rejecting the profile.",
    };
  }

  /*
   * 4. تحديث المصدر الرئيسي للحالة.
   */
  const {
    error: profileUpdateError,
  } = await adminClient
    .from("profiles")
    .update({
      approval_status: decision,
    })
    .eq(
      "id",
      profile.id,
    );

  if (profileUpdateError) {
    console.error(
      "[updateTalentReviewStatus profile update]",
      profileUpdateError,
    );

    return {
      success: false,
      message:
        locale === "ar"
          ? "تعذر تحديث حالة مراجعة الحساب."
          : "Unable to update the account review status.",
    };
  }

  /*
   * talents.status ما زال موجودًا لأجزاء
   * Legacy من النظام.
   *
   * changes_requested تبقى pending داخله،
   * بينما approval_status يحمل الحالة الدقيقة.
   */
  const talentStatus =
    decision === "changes_requested"
      ? "pending"
      : decision;

  /*
   * النشر مسموح فقط بعد الاعتماد.
   */
  const published =
    decision === "approved";

  /*
   * 5. تحديث حالة التشغيل للموهبة.
   */
  const {
    error: talentUpdateError,
  } = await adminClient
    .from("talents")
    .update({
      status: talentStatus,
      published,
    })
    .eq("id", id);

  if (talentUpdateError) {
    console.error(
      "[updateTalentReviewStatus talent update]",
      talentUpdateError,
    );

    /*
     * إعادة approval_status للحالة السابقة
     * إذا فشل تحديث talents.
     */
    await adminClient
      .from("profiles")
      .update({
        approval_status:
          previousStatus,
      })
      .eq(
        "id",
        profile.id,
      );

    return {
      success: false,
      message:
        locale === "ar"
          ? "تعذر إكمال قرار المراجعة. تم إلغاء التغيير."
          : "Unable to complete the review decision. The change was rolled back.",
    };
  }

  /*
   * 6. تسجيل القرار في سجل المراجعة الموحد.
   */
  const {
    error: historyError,
  } = await adminClient
    .from("profile_review_history")
    .insert({
      profile_id: profile.id,
      account_type: "talent",

      /*
       * نبقي talent_id مؤقتًا للتوافق
       * مع السجلات والواجهات القديمة.
       */
      talent_id: id,

      reviewer_user_id:
        adminUser.id,

      decision,

      reason:
        reason ?? null,

      admin_note:
        adminNote ?? null,

      previous_status:
        previousStatus,

      new_status:
        decision,
    });

  if (historyError) {
    console.error(
      "[updateTalentReviewStatus history]",
      historyError,
    );

    /*
     * بما أن سجل المراجعة جزء أساسي من القرار،
     * نعيد الحالتين إذا فشل حفظ السجل.
     */
    await Promise.all([
      adminClient
        .from("profiles")
        .update({
          approval_status:
            previousStatus,
        })
        .eq(
          "id",
          profile.id,
        ),

      adminClient
        .from("talents")
        .update({
          status:
            talent.status,
          published:
            talent.published,
        })
        .eq("id", id),
    ]);

    return {
      success: false,
      message:
        locale === "ar"
          ? "تعذر حفظ سجل المراجعة، لذلك تم إلغاء القرار."
          : "The review history could not be saved, so the decision was rolled back.",
    };
  }
/*
 * 7. إنشاء حدث النظام.
 *
 * createEvent يقوم بـ:
 * - تسجيل الحدث في events
 * - تمريره إلى NotificationHandler
 * - إنشاء إشعار للمستخدم المستهدف
 */
const eventType =
  decision === "approved"
    ? "talent_approved"
    : decision === "changes_requested"
      ? "talent_changes_requested"
      : "talent_rejected";

await createEvent({
  type: eventType,
  target: "talent",
  targetId: talent.user_id,
  actorId: adminUser.id,
  metadata: {
    locale,
    talent_id: id,
    profile_id: profile.id,
    reason: reason ?? null,
    admin_note: adminNote ?? null,
  },
});
  /*
 * 8. تحديث الصفحات المتأثرة.
 */
  revalidateTalentReviewPaths(id);

  const successMessage =
    decision === "approved"
      ? locale === "ar"
        ? "تم اعتماد ملف الموهبة ونشره بنجاح."
        : "The talent profile has been approved and published."
      : decision === "changes_requested"
        ? locale === "ar"
          ? "تم إرسال الملف للتعديل."
          : "The profile has been returned for changes."
        : locale === "ar"
          ? "تم رفض ملف الموهبة."
          : "The talent profile has been rejected.";

  return {
    success: true,
    status: decision,
    message: successMessage,
  };
}

export async function approveTalentAction(
  formData: FormData,
): Promise<ReviewActionResult> {
  const id =
    parseTalentId(formData);

  const locale =
    getLocale(formData);

  return updateTalentReviewStatus({
    id,
    decision: "approved",
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

export async function requestTalentChangesAction(
  formData: FormData,
): Promise<ReviewActionResult> {
  const id =
    parseTalentId(formData);

  const locale =
    getLocale(formData);

  return updateTalentReviewStatus({
    id,
    decision:
      "changes_requested",
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

export async function rejectTalentAction(
  formData: FormData,
): Promise<ReviewActionResult> {
  const id =
    parseTalentId(formData);

  const locale =
    getLocale(formData);

  return updateTalentReviewStatus({
    id,
    decision: "rejected",
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