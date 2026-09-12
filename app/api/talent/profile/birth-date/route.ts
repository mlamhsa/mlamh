import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getEffectiveTalentApprovalStatus } from "@/lib/talent/approval-status";

const EDITABLE_APPROVAL_STATUSES = new Set([
  "not_submitted",
  "rejected",
  "changes_requested",
]);

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

  if (!EDITABLE_APPROVAL_STATUSES.has(approvalStatus)) {
    // The professional-details form can submit the already-saved birth date along
    // with optional fields. Treat an unchanged value as a safe no-op so approved
    // or in-review users can still save optional professional details without
    // reopening a protected core identity field.
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
            ? "تاريخ الميلاد من البيانات الأساسية، ولا يمكن تغييره أثناء المراجعة أو بعد الاعتماد من هذا المسار."
            : "Date of birth is a core profile field and cannot be changed here while under review or after approval.",
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

  return NextResponse.json({
    success: true,
    message: locale === "ar" ? "تم حفظ تاريخ الميلاد." : "Date of birth saved.",
  });
}
