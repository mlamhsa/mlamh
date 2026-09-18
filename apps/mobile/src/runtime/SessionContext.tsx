import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

import { getMobileAccountContext } from "@/src/domains/account/api";
import type { MobileAccountContext } from "@/src/domains/account/types";
import { supabase } from "@/src/services/supabase";

type SessionState =
  | { status: "loading"; account: null }
  | { status: "guest"; account: null }
  | { status: "account_missing"; account: null }
  | { status: "unavailable"; account: null }
  | { status: "talent"; account: MobileAccountContext }
  | { status: "publisher"; account: MobileAccountContext };

type SessionContextValue = SessionState & {
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<SessionState>({ status: "loading", account: null });

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setState({ status: "guest", account: null });
      return;
    }

    try {
      let result;
      try {
        result = await getMobileAccountContext();
      } catch {
        // Social sign-in can complete a fraction before the backend sees the
        // freshest Supabase token. Refresh once, then retry account context.
        await supabase.auth.refreshSession().catch(() => undefined);
        result = await getMobileAccountContext();
      }
      if (!result.ok) {
        setState({ status: "account_missing", account: null });
        return;
      }
      setState({
        status: result.account.type === "talent" ? "talent" : "publisher",
        account: result.account,
      });
    } catch {
      setState({ status: "unavailable", account: null });
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
