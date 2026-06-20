import { supabase } from "@/lib/supabase/client";

let channel: any = null;

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