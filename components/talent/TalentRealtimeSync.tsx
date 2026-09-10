"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase/client";

type Props = {
  userId: string;
  talentId?: string | number | null;
};

export default function TalentRealtimeSync({ userId, talentId }: Props) {
  const router = useRouter();
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const scheduleRefresh = () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => router.refresh(), 180);
    };

    const channel = supabase.channel(`talent-dashboard:${userId}:${talentId ?? "none"}`);

    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "profiles", filter: `user_id=eq.${userId}` },
      scheduleRefresh,
    );

    if (talentId !== null && talentId !== undefined) {
      const id = String(talentId);
      channel
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "talents", filter: `id=eq.${id}` },
          scheduleRefresh,
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "opportunity_applications", filter: `talent_id=eq.${id}` },
          scheduleRefresh,
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "conversations", filter: `talent_id=eq.${id}` },
          scheduleRefresh,
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notifications", filter: `recipient_id=eq.${id}` },
          scheduleRefresh,
        );
    }

    channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "saved_opportunities", filter: `user_id=eq.${userId}` },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        scheduleRefresh,
      )
      .subscribe();

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      void supabase.removeChannel(channel);
    };
  }, [router, talentId, userId]);

  return null;
}
