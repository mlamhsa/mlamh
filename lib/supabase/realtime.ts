import type { RealtimeChannel } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase/client";

let channel: RealtimeChannel | null = null;

export function getNotificationsChannel(userId: string) {
  if (channel) return channel;

  channel = supabase.channel(`notifications-${userId}`);

  return channel;
}

export function removeNotificationsChannel() {
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
  }
}