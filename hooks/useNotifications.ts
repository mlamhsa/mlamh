"use client";

import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase/client";

type NotificationRecord = {
  id: number | string;
  event_id: number | string | null;
  recipient_type: string | null;
  recipient_id: string | null;
  title: string | null;
  body: string | null;
  is_read: boolean | null;
  created_at: string | null;
};

type AccountType = "publisher" | "talent";

type ResolvedRecipient = {
  recipientType: AccountType;
  recipientId: string;
};

async function resolveNotificationRecipient(
  userId: string,
): Promise<ResolvedRecipient | null> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, account_type")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    return null;
  }

  if (profile.account_type === "publisher") {
    const { data: publisher, error: publisherError } = await supabase
      .from("publishers")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (publisherError || !publisher) {
      return null;
    }

    return {
      recipientType: "publisher",
      recipientId: String(publisher.id),
    };
  }

  if (profile.account_type === "talent") {
    const { data: talent, error: talentError } = await supabase
      .from("talents")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (talentError || !talent) {
      return null;
    }

    return {
      recipientType: "talent",
      recipientId: String(talent.id),
    };
  }

  return null;
}

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    let active = true;
    let channelName: string | null = null;

    async function fetchNotifications() {
      setLoading(true);

      const recipient = await resolveNotificationRecipient(userId);

      if (!active) {
        return;
      }

      if (!recipient) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("notifications")
        .select(
          `
          id,
          event_id,
          recipient_type,
          recipient_id,
          title,
          body,
          is_read,
          created_at
        `,
        )
        .eq("recipient_type", recipient.recipientType)
        .eq("recipient_id", recipient.recipientId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!active) {
        return;
      }

      if (error) {
        console.error("Fetch notifications error:", error);
        setNotifications([]);
        setLoading(false);
        return;
      }

      setNotifications((data ?? []) as NotificationRecord[]);
      setLoading(false);

      if (!channelName) {
        channelName = `notifications-${recipient.recipientType}-${recipient.recipientId}`;

        supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "notifications",
              filter: `recipient_id=eq.${recipient.recipientId}`,
            },
            () => {
              void fetchNotifications();
            },
          )
          .subscribe();
      }
    }

    void fetchNotifications();

    const interval = window.setInterval(() => {
      void fetchNotifications();
    }, 30000);

    return () => {
      active = false;
      window.clearInterval(interval);

      if (channelName) {
        const channel = supabase.getChannels().find(
          (currentChannel) => currentChannel.topic === `realtime:${channelName}`,
        );

        if (channel) {
          void supabase.removeChannel(channel);
        }
      }
    };
  }, [userId]);

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) => notification.is_read !== true,
      ).length,
    [notifications],
  );

  return {
    notifications,
    unreadCount,
    loading,
  };
}
