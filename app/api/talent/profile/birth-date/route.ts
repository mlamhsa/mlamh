import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
