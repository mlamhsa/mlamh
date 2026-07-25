"use client";

import { useEffect, useMemo, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

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

  if (profileError) {
    console.error("Resolve notification profile error:", profileError);
    return null;
  }

  if (!profile) {
    return null;
  }

  if (profile.account_type === "publisher") {
    const { data: publisher, error: publisherError } = await supabase
      .from("publishers")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (publisherError) {
      console.error(
        "Resolve notification publisher error:",
        publisherError,
      );
      return null;
    }

    if (!publisher) {
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

    if (talentError) {
      console.error("Resolve notification talent error:", talentError);
      return null;
    }

    if (!talent) {
      return null;
    }

    return {
      recipientType: "talent",
      recipientId: String(talent.id),
    };
  }

  return null;
}

async function loadNotifications(
  recipient: ResolvedRecipient,
): Promise<NotificationRecord[]> {
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

  if (error) {
    throw error;
  }

  return (data ?? []) as NotificationRecord[];
}

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<
    NotificationRecord[]
  >([]);
  const [loading, setLoading] = useState(Boolean(userId));

  useEffect(() => {
    let active = true;
    let channel: RealtimeChannel | null = null;
    let intervalId: number | null = null;
    let requestInProgress = false;

    if (!userId) {
      setNotifications([]);
      setLoading(false);

      return () => {
        active = false;
      };
    }

    async function refreshNotifications(
      recipient: ResolvedRecipient,
      showLoading = false,
    ) {
      /*
       * يمنع تنفيذ طلبين متزامنين بسبب اجتماع التحديث الدوري
       * مع إشعار Realtime في اللحظة نفسها.
       */
      if (requestInProgress) {
        return;
      }

      requestInProgress = true;

      if (showLoading && active) {
        setLoading(true);
      }

      try {
        const nextNotifications = await loadNotifications(recipient);

        if (!active) {
          return;
        }

        setNotifications(nextNotifications);
      } catch (error) {
        console.error("Fetch notifications error:", error);

        if (active && showLoading) {
          setNotifications([]);
        }
      } finally {
        requestInProgress = false;

        if (active && showLoading) {
          setLoading(false);
        }
      }
    }

    async function initialiseNotifications() {
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

      await refreshNotifications(recipient, true);

      if (!active) {
        return;
      }

      const channelName = [
        "notifications",
        recipient.recipientType,
        recipient.recipientId,
        userId,
      ].join("-");
      
      /*
       * إذا كانت هناك قناة قديمة بنفس الاسم (خصوصاً أثناء
       * React StrictMode في التطوير) نحذفها أولاً.
       */
      const existing = supabase
        .getChannels()
        .find((c) => c.topic === `realtime:${channelName}`);
      
      if (existing) {
        await supabase.removeChannel(existing);
      }

      /*
       * يجب تسجيل جميع postgres_changes قبل subscribe().
       * لا تتم إضافة callbacks جديدة للقناة بعد الاشتراك.
       */
      channel = supabase
  .channel(channelName)
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "notifications",
      filter: `recipient_id=eq.${recipient.recipientId}`,
    },
    (payload) => {
      const changedRecord =
        payload.eventType === "DELETE"
          ? payload.old
          : payload.new;

      if (
        changedRecord?.recipient_type &&
        changedRecord.recipient_type !== recipient.recipientType
      ) {
        return;
      }

      void refreshNotifications(recipient);
    },
  )
  .subscribe((status, error) => {
    if (status === "SUBSCRIBED") {
      console.info(
        `Notifications channel subscribed: ${channelName}`,
      );
      return;
    }

    if (status === "CHANNEL_ERROR") {
      console.error(
        `Notifications channel error: ${channelName}`,
        error,
      );
      return;
    }

    if (status === "TIMED_OUT") {
      console.error(
        `Notifications channel timed out: ${channelName}`,
        error,
      );
      return;
    }

    if (status === "CLOSED") {
      console.info(
        `Notifications channel closed: ${channelName}`,
      );
    }
  });

      /*
       * يبقى التحديث الدوري كخطة احتياطية إذا انقطع Realtime.
       */
      intervalId = window.setInterval(() => {
        void refreshNotifications(recipient);
      }, 30_000);
    }

    void initialiseNotifications();

    return () => {
      active = false;

      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }

      if (channel) {
        void supabase.removeChannel(channel);
        channel = null;
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