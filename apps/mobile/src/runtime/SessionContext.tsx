import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

import { getMobileAccountContext } from "@/src/domains/account/api";
import { MobileApiError } from "@/src/api/client";
import type { MobileAccountContext } from "@/src/domains/account/types";
import { supabase } from "@/src/services/supabase";

type SessionState =
  | { status: "loading"; account: null }
  | { status: "guest"; account: null }
  | { status: "account_missing"; account: null }
  | { status: "unsupported_account"; account: null }
  | { status: "unavailable"; account: null }
  | { status: "talent"; account: MobileAccountContext }
  | { status: "publisher"; account: MobileAccountContext };

type SessionContextValue = SessionState & {
  refresh: () => Promise<SessionState["status"]>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<SessionState>({ status: "loading", account: null });

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next: SessionState = { status: "guest", account: null };
      setState(next);
      return next.status;
    }

    try {
      let result;
      try {
        result = await getMobileAccountContext();
      } catch (error) {
        // Retry only authentication propagation failures. A 404 means the
        // authenticated user has no supported mobile account and must not be
        // disguised as a transport failure.
        if (
          error instanceof MobileApiError &&
          error.status === 401 &&
          (error.code === "UNAUTHENTICATED" ||
            error.code === "INVALID_ACCESS_TOKEN" ||
            error.code === "MISSING_BEARER_TOKEN")
        ) {
          const refreshed = await supabase.auth.refreshSession().catch(() => null);
          if (!refreshed?.data.session) throw error;
          result = await getMobileAccountContext();
        } else {
          throw error;
        }
      }
      if (!result.ok) {
        const next: SessionState = { status: "account_missing", account: null };
        setState(next);
        return next.status;
      }
      const next: SessionState = {
        status: result.account.type === "talent" ? "talent" : "publisher",
        account: result.account,
      };
      setState(next);
      return next.status;
    } catch (error) {
      if (
        error instanceof MobileApiError &&
        error.status === 404 &&
        error.code === "ACCOUNT_NOT_FOUND"
      ) {
        const next: SessionState = { status: "account_missing", account: null };
        setState(next);
        return next.status;
      }

      if (
        error instanceof MobileApiError &&
        error.status === 409 &&
        error.code === "ACCOUNT_TYPE_UNSUPPORTED"
      ) {
        const next: SessionState = { status: "unsupported_account", account: null };
        setState(next);
        return next.status;
      }

      if (
        error instanceof MobileApiError &&
        error.status === 401 &&
        (error.code === "UNAUTHENTICATED" ||
          error.code === "INVALID_ACCESS_TOKEN" ||
          error.code === "MISSING_BEARER_TOKEN")
      ) {
        await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
        const next: SessionState = { status: "guest", account: null };
        setState(next);
        return next.status;
      }

      // Keep a valid Supabase session intact when MLAMH's API is temporarily
      // unavailable. Showing a connection state is safer than silently
      // presenting an authenticated user as a guest.
      const next: SessionState = { status: "unavailable", account: null };
      setState(next);
      return next.status;
    }
  }, []);

  useEffect(() => {
    let active = true;
    void refresh();
    const { data } = supabase.auth.onAuthStateChange(() => {
      if (active) void refresh();
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [refresh]);

  const value = useMemo<SessionContextValue>(() => ({ ...state, refresh }), [refresh, state]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSessionContext() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSessionContext must be used within SessionProvider.");
  return context;
}
