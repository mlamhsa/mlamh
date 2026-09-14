import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getEffectiveTalentApprovalStatus } from "@/lib/talent/approval-status";
import { syncApprovedTalentReadiness } from "@/lib/talent/sync-approved-talent-readiness";

export async function POST(request: Request) {
  const formData = await request.formData();
  const locale = formData.get("locale") === "en" ? "en" : "ar";
  const rawDate = String(formData.get("date_of_birth") ?? "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    return NextResponse.json(
      {
        success: false,
        message: locale === "ar" ? "أدخل تاريخ ميلاد صحيحًا." : "Enter a valid date of birth.",
      },
      { status: 400 },
    );
  }

  const parsed = new Date(`${rawDate}T00:00:00Z`);
  const now = new Date();
  if (Number.isNaN(parsed.getTime()) || parsed > now) {
    return NextResponse.json(
      {
        success: false,
        message: locale === "ar" ? "تحقق من تاريخ الميلاد." : "Check your date of birth.",
      },
      { status: 400 },
    );
  }

  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      {
        success: false,
        message: locale === "ar" ? "انتهت الجلسة. سجل الدخول مرة أخرى." : "Your session expired. Sign in again.",
      },
      { status: 401 },
    );
  }

  const adminClient = createAdminClient();
  const [profileResult, talentResult] = await Promise.all([
    adminClient
      .from("profiles")
      .select("account_type,approval_status,profile_completed_at,onboarding_step")
      .eq("user_id", user.id)
      .maybeSingle(),
    adminClient
      .from("talents")
      .select("id,date_of_birth")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const profile = profileResult.data;
  const talent = talentResult.data;

  if (
    profileResult.error ||
    talentResult.error ||
    !profile ||
    !talent ||
    profile.account_type !== "talent"
  ) {
    console.error(
      "[birth-date POST profile]",
      profileResult.error?.message || talentResult.error?.message || "Talent account state not found",
    );
    return NextResponse.json(
      {
        success: false,
        message: locale === "ar" ? "تعذر التحقق من حالة ملفك." : "We could not verify your profile state.",
      },
      { status: 403 },
    );
  }

  const approvalStatus = getEffectiveTalentApprovalStatus(profile);
  const currentDate = String(talent.date_of_birth ?? "").slice(0, 10);
  const underReview = approvalStatus === "pending" || approvalStatus === "submitted";

  if (underReview) {
    // Forms may send the already-saved value while another section is saved.
    // Keep that as a no-op, but do not mutate a profile during active review.
    if (currentDate === rawDate) {
      return NextResponse.json({
        success: true,
        message: locale === "ar" ? "تاريخ الميلاد محفوظ." : "Date of birth is already saved.",
      });
    }

    return NextResponse.json(
      {
        success: false,
        message:
          locale === "ar"
            ? "لا يمكن تغيير تاريخ الميلاد أثناء مراجعة الملف. يمكنك تعديله بعد صدور قرار المراجعة."
            : "Date of birth cannot be changed while the profile is under review. You can edit it after the review decision.",
      },
      { status: 409 },
    );
  }

  const { data: updatedTalent, error } = await adminClient
    .from("talents")
    .update({ date_of_birth: rawDate })
    .eq("id", talent.id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !updatedTalent) {
    console.error("[birth-date POST]", error?.message || "No talent row updated");
    return NextResponse.json(
      {
        success: false,
        message: locale === "ar" ? "تعذر حفظ تاريخ الميلاد الآن." : "We could not save your date of birth right now.",
      },
      { status: 500 },
    );
  }

  try {
    await syncApprovedTalentReadiness(user.id);
  } catch (readinessError) {
    console.error("[birth-date POST readiness]", readinessError);
    return NextResponse.json(
      {
        success: false,
        message:
          locale === "ar"
            ? "تم حفظ تاريخ الميلاد، لكن تعذر تحديث جاهزية الملف. حاول مرة أخرى."
            : "Date of birth was saved, but profile readiness could not be refreshed. Please try again.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    message: locale === "ar" ? "تم حفظ تاريخ الميلاد." : "Date of birth saved.",
  });
}
