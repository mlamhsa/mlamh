import { createAdminClient } from "@/lib/supabase/admin";
import type { MarketingChannelAdapter, MarketingChannelStatus } from "./types";

function normalizeStatus(value: unknown): MarketingChannelStatus {
  return value === "connected" || value === "setup_required" || value === "connecting" || value === "error" || value === "paused" || value === "limited"
    ? value
    : "setup_required";
}

export const whatsappServerAdapter: MarketingChannelAdapter = {
  provider: "whatsapp",
  // WhatsApp account state may exist in Marketing Hub, but outbound messaging and
  // webhook verification are not implemented yet. Do not advertise capabilities
  // that the runtime cannot actually execute.
  capabilities: [],
  async getStatus() {
    const db = createAdminClient();
    const { data, error } = await db.from("marketing_integrations")
      .select("status")
      .eq("provider", "whatsapp")
      .maybeSingle();
    if (error || !data) return "setup_required";
    const status = normalizeStatus(data.status);
    // A persisted account-level "connected" state must not make Dana treat
    // WhatsApp as send-ready before a real sendMessage adapter is installed.
    return status === "connected" ? "limited" : status;
  },
};
