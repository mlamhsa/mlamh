"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createContactRequestAction(
  application_id: number,
  opportunity_id: number,
  publisher_id: number,
  talent_id: number,
  locale: string
) {
  const authClient = await createServerSupabaseClient();
  const adminClient = createAdminClient();

  // تحقق من المستخدم
  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    redirect(`/${locale}/login`);
  }

  // تحقق إذا تم إنشاء طلب مسبقًا
  const { data: existing } = await adminClient
    .from("contact_requests")
    .select("id,status")
    .eq("application_id", application_id)
    .maybeSingle();

  if (existing) {
    // لا تنشئ طلب جديد، أرجع حالة موجودة
    return existing;
  }

  // إنشاء طلب جديد
  const { data, error } = await adminClient
    .from("contact_requests")
    .insert({
      application_id,
      opportunity_id,
      publisher_id,
      talent_id,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}