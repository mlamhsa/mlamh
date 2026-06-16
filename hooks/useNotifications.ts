import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;

    // =========================
    // 1. LOAD INITIAL DATA
    // =========================
    const load = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && isMounted) {
        setNotifications(data || []);
      }
    };

    load();

    // =========================
    // 2. REALTIME SUBSCRIPTION
    // =========================
    const channel = supabase
      .channel(`notifications-${userId}`) // 🔥 unique channel (important fix)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => {
            // 🔥 prevent duplicates
            const exists = prev.some((n) => n.id === payload.new.id);
            if (exists) return prev;

            return [payload.new, ...prev];
          });
        }
      )
      .subscribe((status) => {
        console.log("Realtime status:", status);
      });

    // =========================
    // 3. CLEANUP
    // =========================
    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { notifications };
}