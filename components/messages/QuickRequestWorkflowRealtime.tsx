"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type Props = {
  conversationId: number;
};

export default function QuickRequestWorkflowRealtime({
  conversationId,
}: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!Number.isInteger(conversationId) || conversationId <= 0) return;

    const supabase = createBrowserSupabaseClient();
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    const refreshServerState = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        router.refresh();
      }, 180);
    };

    const channel = supabase
      .channel(`quick-request-workflow-state:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        refreshServerState,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `id=eq.${conversationId}`,
        },
        refreshServerState,
      )
      .subscribe();

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      void supabase.removeChannel(channel);
    };
  }, [conversationId, router]);

  return null;
}
