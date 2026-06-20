import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  getNotificationsChannel,
  removeNotificationsChannel,
} from "@/lib/supabase/realtime";

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      setNotifications(data || []);
    };

    load();

    // 🔥 remove old channel completely
    removeNotificationsChannel();

    const channel = getNotificationsChannel(userId);

    // 🔥 IMPORTANT: reset channel before reusing
    supabase.removeChannel(channel);

    const freshChannel = supabase.channel(`notifications-${userId}`);

    freshChannel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        setNotifications((prev) => {
          const exists = prev.some((n) => n.id === payload.new.id);
          if (exists) return prev;

          return [payload.new, ...prev];
        });
      }
    );

    freshChannel.subscribe();

    return () => {
      removeNotificationsChannel();
    };
  }, [userId]);

  return { notifications };
}