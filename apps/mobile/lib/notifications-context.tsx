import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AppState } from "react-native";

import { getNotifications } from "@/lib/api";
import { supabase } from "@/lib/supabase";

type NotificationSyncValue = { unreadCount: number; ready: boolean; refresh: () => Promise<void> };
const NotificationSyncContext = createContext<NotificationSyncValue>({ unreadCount: 0, ready: false, refresh: async () => undefined });

export function NotificationSyncProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const result = await getNotifications();
      setUnreadCount(result?.unreadCount ?? 0);
      setReady(true);
    } catch {
      // Keep the previous badge during transient network failures.
    }
  }, []);

  useEffect(() => {
    void refresh();
    const appState = AppState.addEventListener("change", (state) => { if (state === "active") void refresh(); });
    const interval = setInterval(() => { if (AppState.currentState === "active") void refresh(); }, 45_000);
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") { setUnreadCount(0); setReady(true); }
      else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") void refresh();
    });
    return () => { appState.remove(); clearInterval(interval); data.subscription.unsubscribe(); };
  }, [refresh]);

  const value = useMemo(() => ({ unreadCount, ready, refresh }), [ready, refresh, unreadCount]);
  return <NotificationSyncContext.Provider value={value}>{children}</NotificationSyncContext.Provider>;
}

export function useNotificationSync() {
  return useContext(NotificationSyncContext);
}
