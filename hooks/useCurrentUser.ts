"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase/client";

export type CurrentAccountType = "admin" | "publisher" | "talent" | null;

type CurrentUserState = {
  userId: string;
  isLoggedIn: boolean;
  accountType: CurrentAccountType;
  userName: string;
  avatarUrl: string | null;
  loading: boolean;
};

type ProfileAccountTypeRow = {
  id: string;
  account_type: string | null;
};

type PublisherNavigationRow = {
  company_name: string | null;
  contact_name: string | null;
  profile_image_url: string | null;
};

type TalentNavigationRow = {
  name_ar: string | null;
  name_en: string | null;
  image_url: string | null;
};

type AuthUserSnapshot = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

const initialState: CurrentUserState = {
  userId: "",
  isLoggedIn: false,
  accountType: null,
  userName: "",
  avatarUrl: null,
  loading: true,
};

function normalizeAccountType(value: string | null | undefined): CurrentAccountType {
  if (value === "admin" || value === "publisher" || value === "talent") {
    return value;
  }
  return null;
}

function getMetadataString(
  metadata: Record<string, unknown> | null | undefined,
  keys: string[],
) {
  for (const key of keys) {
    const value = metadata?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function resolveDisplayName(user: AuthUserSnapshot) {
  const metadataName = getMetadataString(user.user_metadata, [
    "full_name",
    "name",
    "display_name",
    "user_name",
  ]);
  if (metadataName) return metadataName;
  return user.email?.split("@")[0]?.trim() || "";
}

function resolveAvatarUrl(user: AuthUserSnapshot) {
  return (
    getMetadataString(user.user_metadata, [
      "avatar_url",
      "picture",
      "profile_image",
      "image_url",
    ]) || null
  );
}

function readableError(error: unknown) {
  if (error instanceof Error) return { message: error.message, name: error.name };
  if (error && typeof error === "object") {
    const value = error as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown };
    return {
      message: typeof value.message === "string" ? value.message : "Unknown profile lookup error",
      code: typeof value.code === "string" ? value.code : undefined,
      details: typeof value.details === "string" ? value.details : undefined,
      hint: typeof value.hint === "string" ? value.hint : undefined,
    };
  }
  return { message: typeof error === "string" ? error : "Unknown profile lookup error" };
}

export function useCurrentUser(): CurrentUserState {
  const [state, setState] = useState<CurrentUserState>(initialState);

  useEffect(() => {
    let active = true;
    let requestVersion = 0;

    function commit(version: number, next: CurrentUserState) {
      if (active && version === requestVersion) setState(next);
    }

    async function resolveTalentFallback(
      user: AuthUserSnapshot,
      version: number,
      fallbackName: string,
      fallbackAvatar: string | null,
    ) {
      const { data: talent, error: talentError } = await supabase
        .from("talents")
        .select("name_ar, name_en, image_url")
        .eq("user_id", user.id)
        .maybeSingle<TalentNavigationRow>();

      if (!active || version !== requestVersion) return true;

      if (talentError) {
        console.warn("Unable to load talent profile fallback:", readableError(talentError));
        return false;
      }

      if (!talent) return false;

      commit(version, {
        userId: user.id,
        isLoggedIn: true,
        accountType: "talent",
        userName: talent.name_ar?.trim() || talent.name_en?.trim() || fallbackName,
        avatarUrl: talent.image_url?.trim() || fallbackAvatar,
        loading: false,
      });

      return true;
    }

    async function resolveUser(user?: AuthUserSnapshot | null) {
      const version = ++requestVersion;

      if (!user?.id) {
        commit(version, { ...initialState, loading: false });
        return;
      }

      const fallbackName = resolveDisplayName(user);
      const fallbackAvatar = resolveAvatarUrl(user);

      commit(version, {
        userId: user.id,
        isLoggedIn: true,
        accountType: null,
        userName: fallbackName,
        avatarUrl: fallbackAvatar,
        loading: true,
      });

      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id, account_type")
          .eq("user_id", user.id)
          .maybeSingle<ProfileAccountTypeRow>();

        if (!active || version !== requestVersion) return;

        if (error || !profile) {
          if (error) console.warn("Unable to resolve current user profile:", readableError(error));

          const resolvedAsTalent = await resolveTalentFallback(
            user,
            version,
            fallbackName,
            fallbackAvatar,
          );

          if (resolvedAsTalent || !active || version !== requestVersion) return;

          commit(version, {
            userId: user.id,
            isLoggedIn: true,
            accountType: null,
            userName: fallbackName,
            avatarUrl: fallbackAvatar,
            loading: false,
          });
          return;
        }

        let accountType = normalizeAccountType(profile.account_type);
        let resolvedName = fallbackName;
        let resolvedAvatar = fallbackAvatar;

        if (accountType === "publisher") {
          const { data: publisher, error: publisherError } = await supabase
            .from("publishers")
            .select("company_name, contact_name, profile_image_url")
            .eq("profile_id", profile.id)
            .maybeSingle<PublisherNavigationRow>();

          if (publisherError) {
            console.warn("Unable to load publisher profile:", readableError(publisherError));
          } else if (publisher) {
            resolvedAvatar = publisher.profile_image_url?.trim() || resolvedAvatar;
            resolvedName =
              publisher.company_name?.trim() ||
              publisher.contact_name?.trim() ||
              resolvedName;
          }
        }

        if (accountType === "talent" || accountType === null) {
          const { data: talent, error: talentError } = await supabase
            .from("talents")
            .select("name_ar, name_en, image_url")
            .eq("user_id", user.id)
            .maybeSingle<TalentNavigationRow>();

          if (talentError) {
            console.warn("Unable to load talent profile:", readableError(talentError));
          } else if (talent) {
            if (accountType === null) accountType = "talent";
            resolvedAvatar = talent.image_url?.trim() || resolvedAvatar;
            resolvedName = talent.name_ar?.trim() || talent.name_en?.trim() || resolvedName;
          }
        }

        commit(version, {
          userId: user.id,
          isLoggedIn: true,
          accountType,
          userName: resolvedName,
          avatarUrl: resolvedAvatar,
          loading: false,
        });
      } catch (error) {
        if (!active || version !== requestVersion) return;
        console.warn("Unexpected current user profile lookup failure:", readableError(error));

        const resolvedAsTalent = await resolveTalentFallback(
          user,
          version,
          fallbackName,
          fallbackAvatar,
        );

        if (resolvedAsTalent || !active || version !== requestVersion) return;

        commit(version, {
          userId: user.id,
          isLoggedIn: true,
          accountType: null,
          userName: fallbackName,
          avatarUrl: fallbackAvatar,
          loading: false,
        });
      }
    }

    async function initialise() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!active) return;
        if (error) {
          console.warn("Unable to resolve current authentication session:", readableError(error));
          await resolveUser();
          return;
        }
        await resolveUser(session?.user ?? null);
      } catch (error) {
        if (!active) return;
        console.warn("Unexpected authentication session failure:", readableError(error));
        await resolveUser();
      }
    }

    function refreshCurrentUser() {
      void supabase.auth.getUser().then(({ data }) => {
        if (active) void resolveUser(data.user ?? null);
      });
    }

    void initialise();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      queueMicrotask(() => {
        if (active) void resolveUser(session?.user ?? null);
      });
    });

    window.addEventListener("mlamh:account-updated", refreshCurrentUser);

    return () => {
      active = false;
      requestVersion += 1;
      window.removeEventListener("mlamh:account-updated", refreshCurrentUser);
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
