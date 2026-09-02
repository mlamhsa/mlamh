import { createAdminClient } from "@/lib/supabase/admin";
import type { MarketingChannelAdapter, MarketingChannelStatus } from "./types";

function normalizeStatus(value: unknown): MarketingChannelStatus {
  return value === "connected" || value === "setup_required" || value === "connecting" || value === "error" || value === "paused" || value === "limited"
    ? value
    : "setup_required";
}

export const whatsappServerAdapter: MarketingChannelAdapter = {
  provider: "whatsapp",
  capabilities: ["messages", "webhooks", "templates", "delivery_status"],
  async getStatus() {
    const db = createAdminClient();
    const { data, error } = await db.from("marketing_integrations")
      .select("status")
      .eq("provider", "whatsapp")
      .maybeSingle();
    if (error || !data) return "setup_required";
    return normalizeStatus(data.status);
  },
};
