"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type UpdateTalentPortfolioLinksResult = {
  success: boolean;
  message: string;
};

const MAX_URL_LENGTH = 2048;

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalHttpsUrl(value: string) {
  if (!value) return null;
  if (value.length > MAX_URL_LENGTH) return null;

  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" || !url.hostname) return null;
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return null;
    url.username = "";
    url.password = "";
    return url.toString();
  } catch {
    return null;
  }
}

function optionalPlatformUrl(
  value: string,
  platform: "instagram" | "tiktok" | "snapchat",
) {
  if (!value) return null;
  if (value.length > MAX_URL_LENGTH) return null;

  const handle = value
    .replace(/^@/, "")
    .replace(/^\/+|\/+$/g, "")
    .trim();

  if (/^[A-Za-z0-9._-]+$/.test(handle) && !handle.includes("..")) {
    if (platform === "instagram") {
      return `https://www.instagram.com/${encodeURIComponent(handle)}/`;
    }
    if (platform === "tiktok") {
      return `https://www.tiktok.com/@${encodeURIComponent(handle)}`;
    }
    return `https://www.snapchat.com/add/${encodeURIComponent(handle)}`;
  }

  const normalized = optionalHttpsUrl(value);
  if (!normalized) return null;

  const url = new URL(normalized);
  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  const allowedHost = `${platform}.com`;
  const allowed = hostname === allowedHost || hostname.endsWith(`.${allowedHost}`);

  return allowed ? url.toString() : null;
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
    showreel_url: optionalHttpsUrl(raw.showreel_url),
    video_intro: optionalHttpsUrl(raw.video_intro),
    instagram: optionalPlatformUrl(raw.instagram, "instagram"),
    tiktok: optionalPlatformUrl(raw.tiktok, "tiktok"),
    snapchat: optionalPlatformUrl(raw.snapchat, "snapchat"),
    portfolio_url: optionalHttpsUrl(raw.portfolio_url),
  };

  const invalidKey = Object.entries(raw).find(
    ([key, value]) => value && payload[key as keyof typeof payload] === null,
  )?.[0];

  if (invalidKey) {
    const socialKey = ["instagram", "tiktok", "snapchat"].includes(invalidKey);
    return {
      success: false,
      message: socialKey
        ? isArabic
          ? "أحد حسابات السوشيال غير صحيح. أدخل اسم المستخدم أو رابط الحساب الرسمي على المنصة نفسها."
          : "One social account is invalid. Enter the username or the official profile URL on that platform."
        : isArabic
          ? "أحد الروابط غير صحيح. أدخل رابطًا آمنًا يبدأ بـ https:// أو اسم نطاق صحيح."
          : "One of the links is invalid. Enter a secure https:// URL or a valid domain name.",
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
