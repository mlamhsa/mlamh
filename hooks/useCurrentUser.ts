"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase/client";

export type CurrentAccountType = "publisher" | "talent" | null;

type CurrentUserState = {
  userId: string;
  isLoggedIn: boolean;
  accountType: CurrentAccountType;
  loading: boolean;
};

type ProfileAccountTypeRow = {
  account_type: string | null;
};

const initialState: CurrentUserState = {
  userId: "",
  isLoggedIn: false,
  accountType: null,
  loading: true,
};

function normalizeAccountType(
  value: string | null | undefined,
): CurrentAccountType {
  if (value === "publisher" || value === "talent") {
    return value;
  }

  return null;
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

    async function resolveUser(nextUserId?: string) {
      const version = ++requestVersion;

      if (!nextUserId) {
        commitState(version, {
          userId: "",
          isLoggedIn: false,
          accountType: null,
          loading: false,
        });

        return;
      }

      commitState(version, {
        userId: nextUserId,
        isLoggedIn: true,
        accountType: null,
        loading: true,
      });

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("account_type")
          .eq("user_id", nextUserId)
          .maybeSingle<ProfileAccountTypeRow>();

        if (!isActive || version !== requestVersion) {
          return;
        }

        if (error) {
          const readableError = getReadableError(error);

          /*
           * نستخدم console.warn بدل console.error حتى لا يعرض
           * Next.js شاشة خطأ كاملة لمشكلة استعلام غير قاتلة.
           */
          console.warn(
            "Unable to resolve current user profile:",
            readableError,
          );

          commitState(version, {
            userId: nextUserId,
            isLoggedIn: true,
            accountType: null,
            loading: false,
          });

          return;
        }

        commitState(version, {
          userId: nextUserId,
          isLoggedIn: true,
          accountType: normalizeAccountType(
            data?.account_type,
          ),
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
          userId: nextUserId,
          isLoggedIn: true,
          accountType: null,
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

        await resolveUser(session?.user?.id);
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
        /*
         * إخراج الاستعلام من callback الخاص بالمصادقة يمنع
         * تداخل عمليات Supabase أثناء تحديث الجلسة.
         */
        queueMicrotask(() => {
          if (!isActive) {
            return;
          }

          void resolveUser(session?.user?.id);
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