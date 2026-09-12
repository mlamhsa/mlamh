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
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("account_type,approval_status,profile_completed_at,onboarding_step")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.account_type !== "talent") {
    console.error("[birth-date POST profile]", profileError?.message || "Talent profile row not found");
    return NextResponse.json(
      {
        success: false,
        message: locale === "ar" ? "تعذر التحقق من حالة ملفك." : "We could not verify your profile state.",
      },
      { status: 403 },
    );
  }

  const approvalStatus = getEffectiveTalentApprovalStatus(profile);
  if (!EDITABLE_APPROVAL_STATUSES.has(approvalStatus)) {
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
