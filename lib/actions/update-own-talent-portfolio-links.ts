"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type UpdateTalentPortfolioLinksResult = {
  success: boolean;
  message: string;
};

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalUrl(value: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function updateOwnTalentPortfolioLinksAction(
  formData: FormData,
): Promise<UpdateTalentPortfolioLinksResult> {
  const locale = text(formData, "locale") === "en" ? "en" : "ar";
  const isArabic = locale === "ar";

  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      message: isArabic ? "انتهت الجلسة. سجل الدخول مرة أخرى." : "Your session has expired. Please sign in again.",
    };
  }

  const raw = {
    showreel_url: text(formData, "showreel_url"),
    video_intro: text(formData, "video_intro"),
    instagram: text(formData, "instagram"),
    tiktok: text(formData, "tiktok"),
    snapchat: text(formData, "snapchat"),
    portfolio_url: text(formData, "portfolio_url"),
  };

  const payload = {
    showreel_url: optionalUrl(raw.showreel_url),
    video_intro: optionalUrl(raw.video_intro),
    instagram: optionalUrl(raw.instagram),
    tiktok: optionalUrl(raw.tiktok),
    snapchat: optionalUrl(raw.snapchat),
    portfolio_url: optionalUrl(raw.portfolio_url),
  };

  const invalidKey = Object.entries(raw).find(
    ([key, value]) => value && payload[key as keyof typeof payload] === null,
  )?.[0];

  if (invalidKey) {
    return {
      success: false,
      message: isArabic
        ? "أحد الروابط غير صحيح. استخدم رابطًا كاملاً يبدأ بـ https://"
        : "One of the links is invalid. Use a full URL starting with https://",
    };
  }

  const admin = createAdminClient();
  const { data: talent, error: talentError } = await admin
    .from("talents")
    .select("id, slug")
    .eq("user_id", user.id)
    .maybeSingle();

  if (talentError || !talent) {
    return {
      success: false,
      message: isArabic ? "تعذر العثور على ملف الموهبة." : "Talent profile could not be found.",
    };
  }

  const { error: updateError } = await admin
    .from("talents")
    .update(payload)
    .eq("id", talent.id)
    .eq("user_id", user.id);

  if (updateError) {
    return {
      success: false,
      message: isArabic ? "تعذر حفظ روابط معرض الأعمال." : "Unable to save portfolio links.",
    };
  }

  revalidatePath(`/${locale}/talent-dashboard/gallery`);
  revalidatePath(`/${locale}/talent-dashboard/gallery/links`);
  revalidatePath(`/${locale}/talent-dashboard/profile`);

  if (talent.slug) {
    revalidatePath(`/ar/talent/${encodeURIComponent(talent.slug)}`);
    revalidatePath(`/en/talent/${encodeURIComponent(talent.slug)}`);
  }

  return {
    success: true,
    message: isArabic ? "تم حفظ روابط معرض أعمالك." : "Your portfolio links were saved.",
  };
}
