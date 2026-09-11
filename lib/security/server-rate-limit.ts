import { createHash } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

export type ServerRateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

type ConsumeServerRateLimitInput = {
  namespace: string;
  identifier: string;
  limit: number;
  windowSeconds: number;
};

export async function consumeServerRateLimit({
  namespace,
  identifier,
  limit,
  windowSeconds,
}: ConsumeServerRateLimitInput): Promise<ServerRateLimitResult> {
  if (!namespace || !identifier || limit <= 0 || windowSeconds <= 0) {
    throw new Error("Invalid server rate-limit configuration.");
  }

  const keyHash = createHash("sha256")
    .update(`${namespace}:${identifier}`)
    .digest("hex");

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("consume_support_rate_limit", {
    p_key_hash: keyHash,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    throw new Error(`[consumeServerRateLimit] ${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : data;

  return {
    allowed: row?.allowed !== false,
    remaining: Number(row?.remaining ?? 0),
    retryAfterSeconds: Number(row?.retry_after_seconds ?? windowSeconds),
  };
}
