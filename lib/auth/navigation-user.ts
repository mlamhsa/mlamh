import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type NavigationAccountType = "admin" | "publisher" | "talent" | null;

export type NavigationUserState = {
  userId: string;
  isLoggedIn: boolean;
  accountType: NavigationAccountType;
  userName: string;
  avatarUrl: string | null;
  loading: boolean;
};

export const anonymousNavigationUser: NavigationUserState = {
  userId: "",
  isLoggedIn: false,
  accountType: null,
  userName: "",
  avatarUrl: null,
  loading: false,
};

function metadataString(metadata: Record<string, unknown> | undefined, keys: string[]) {
  for (const key of keys) {
    const value = metadata?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export async function getNavigationUser(): Promise<NavigationUserState> {
  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) return anonymousNavigationUser;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, account_type, display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const rawAccountType = profile?.account_type ?? user.user_metadata?.role;
  const accountType: NavigationAccountType =
    rawAccountType === "admin" ||
    rawAccountType === "publisher" ||
    rawAccountType === "talent"
      ? rawAccountType
      : null;

  let userName =
    profile?.display_name?.trim() ||
    metadataString(user.user_metadata, ["full_name", "name", "display_name", "user_name"]) ||
    user.email?.split("@")[0]?.trim() ||
    "";
  let avatarUrl =
    metadataString(user.user_metadata, ["avatar_url", "picture", "profile_image", "image_url"]) ||
    null;

  if (accountType === "publisher" && profile?.id) {
    const { data: publisher } = await admin
      .from("publishers")
      .select("company_name, contact_name, profile_image_url")
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (publisher) {
      userName =
        publisher.company_name?.trim() ||
        publisher.contact_name?.trim() ||
        userName;
      avatarUrl = publisher.profile_image_url?.trim() || avatarUrl;
    }
  }

  if (accountType === "talent") {
    const { data: talent } = await admin
      .from("talents")
      .select("name_ar, name_en, image_url")
      .eq("user_id", user.id)
      .maybeSingle();

    if (talent) {
      userName = talent.name_ar?.trim() || talent.name_en?.trim() || userName;
      avatarUrl = talent.image_url?.trim() || avatarUrl;
    }
  }

  return {
    userId: user.id,
    isLoggedIn: true,
    accountType,
    userName,
    avatarUrl,
    loading: false,
  };
}
