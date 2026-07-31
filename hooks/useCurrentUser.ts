"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase/client";

export type CurrentAccountType =
  | "admin"
  | "publisher"
  | "talent"
  | null;

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

function normalizeAccountType(
  value: string | null | undefined,
): CurrentAccountType {
  if (
    value === "admin" ||
    value === "publisher" ||
    value === "talent"
  ) {
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

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
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

  if (metadataName) {
    return metadataName;
  }

  const emailName = user.email?.split("@")[0]?.trim();

  return emailName || "";
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

function getReadableError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
    };
  }

  if (error && typeof error === "object") {
    const value = error as {
      message?: unknown;
      code?: unknown;
      details?: unknown;
      hint?: unknown;
    };

    return {
      message:
        typeof value.message === "string"
          ? value.message
          : "Unknown profile lookup error",
      code:
        typeof value.code === "string"
          ? value.code
          : undefined,
      details:
        typeof value.details === "string"
          ? value.details
          : undefined,
      hint:
        typeof value.hint === "string"
          ? value.hint
          : undefined,
    };
  }

  return {
    message:
      typeof error === "string"
        ? error
        : "Unknown profile lookup error",
  };
}

export function useCurrentUser(): CurrentUserState {
  const [state, setState] =
    useState<CurrentUserState>(initialState);

  useEffect(() => {
    let isActive = true;
    let requestVersion = 0;

    function commitState(
      version: number,
      nextState: CurrentUserState,
    ) {
      if (!isActive || version !== requestVersion) {
        return;
      }

      setState(nextState);
    }

    async function resolveUser(
      user?: AuthUserSnapshot | null,
    ) {
      const version = ++requestVersion;

      if (!user?.id) {
        commitState(version, {
          userId: "",
          isLoggedIn: false,
          accountType: null,
          userName: "",
          avatarUrl: null,
          loading: false,
        });

        return;
      }

      const userName = resolveDisplayName(user);
      const avatarUrl = resolveAvatarUrl(user);

      commitState(version, {
        userId: user.id,
        isLoggedIn: true,
        accountType: null,
        userName,
        avatarUrl,
        loading: true,
      });

      try {
        const {
          data: profile,
          error,
        } = await supabase
          .from("profiles")
          .select("id, account_type")
          .eq("user_id", user.id)
          .maybeSingle<ProfileAccountTypeRow>();

        if (!isActive || version !== requestVersion) {
          return;
        }

        if (error) {
          console.warn(
            "Unable to resolve current user profile:",
            getReadableError(error),
          );
        
          commitState(version, {
            userId: user.id,
            isLoggedIn: true,
            accountType: null,
            userName,
            avatarUrl,
            loading: false,
          });
        
          return;
        }
        
        if (!profile) {
          console.warn(
            "Current user profile was not found:",
            user.id,
          );
        
          commitState(version, {
            userId: user.id,
            isLoggedIn: true,
            accountType: null,
            userName,
            avatarUrl,
            loading: false,
          });
        
          return;
        }
        
        const accountType = normalizeAccountType(
          profile.account_type,
        );

        let resolvedAvatarUrl = avatarUrl;
        let resolvedUserName = userName;

        if (accountType === "publisher") {
          const {
            data: publisher,
            error: publisherError,
          } = await supabase
            .from("publishers")
            .select(
              "company_name, contact_name, profile_image_url",
            )
            .eq("profile_id", profile.id)
            .maybeSingle<PublisherNavigationRow>();

          if (publisherError) {
            console.warn(
              "Unable to load publisher profile:",
              getReadableError(publisherError),
            );
          } else {
          
            if (publisher) {
              resolvedAvatarUrl =
                publisher.profile_image_url?.trim() ||
                resolvedAvatarUrl;
          
              resolvedUserName =
                publisher.company_name?.trim() ||
                publisher.contact_name?.trim() ||
                resolvedUserName;
            }
          }
        }

        if (accountType === "talent") {
          const {
            data: talent,
            error: talentError,
          } = await supabase
            .from("talents")
            .select("name_ar, name_en, image_url")
            .eq("user_id", user.id)
            .maybeSingle<TalentNavigationRow>();

          if (talentError) {
            console.warn(
              "Unable to load talent profile:",
              getReadableError(talentError),
            );
          } else if (talent) {
            resolvedAvatarUrl =
              talent.image_url?.trim() ||
              resolvedAvatarUrl;

            resolvedUserName =
              talent.name_ar?.trim() ||
              talent.name_en?.trim() ||
              resolvedUserName;
          }
        }

        commitState(version, {
          userId: user.id,
          isLoggedIn: true,
          accountType,
          userName: resolvedUserName,
          avatarUrl: resolvedAvatarUrl,
          loading: false,
        });
      } catch (error) {
        if (!isActive || version !== requestVersion) {
          return;
        }

        console.warn(
          "Unexpected current user profile lookup failure:",
          getReadableError(error),
        );

        commitState(version, {
          userId: user.id,
          isLoggedIn: true,
          accountType: null,
          userName,
          avatarUrl,
          loading: false,
        });
      }
    }

    async function initialise() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!isActive) {
          return;
        }

        if (error) {
          console.warn(
            "Unable to resolve current authentication session:",
            getReadableError(error),
          );

          await resolveUser();

          return;
        }

        await resolveUser(session?.user ?? null);
      } catch (error) {
        if (!isActive) {
          return;
        }

        console.warn(
          "Unexpected authentication session failure:",
          getReadableError(error),
        );

        await resolveUser();
      }
    }

    void initialise();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        queueMicrotask(() => {
          if (!isActive) {
            return;
          }

          void resolveUser(session?.user ?? null);
        });
      },
    );

    return () => {
      isActive = false;
      requestVersion += 1;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}