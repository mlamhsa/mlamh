"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function PublisherNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      if (!userId) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_type", "PUBLISHER")
        .eq("recipient_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error.message);
        setNotifications([]);
      } else {
        setNotifications(data ?? []);
      }

      setLoading(false);
    }

    fetchNotifications();
  }, []);

  return (
    <div className="p-6 text-white">
      <h1 className="mb-4 text-xl">Notifications</h1>

      {loading ? (
        <p>Loading...</p>
      ) : notifications.length === 0 ? (
        <p>No notifications</p>
      ) : (
        <ul className="space-y-3">
          {notifications.map((n) => (
            <li key={n.id} className="rounded border p-3">
              <h3 className="font-bold">{n.title}</h3>
              <p className="text-sm opacity-70">{n.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}