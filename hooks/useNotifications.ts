import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      return;
    }

    let active = true;

    async function fetchNotifications() {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!active) return;

      if (error) {
        setNotifications([]);
        return;
      }

      setNotifications(data ?? []);
    }

    fetchNotifications();

    const interval = window.setInterval(fetchNotifications, 30000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [userId]);

  return { notifications };
}