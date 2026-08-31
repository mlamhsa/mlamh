"use server";

import { revalidatePath } from "next/cache";

import { requireMarketingAdminAccess } from "@/lib/auth/require-marketing-admin";
import { testAndPersistBufferConnection } from "@/lib/marketing/channels/buffer";

export type BufferConnectionActionState = {
  ok: boolean | null;
  message: string | null;
};

export async function testBufferConnectionAction(
  _previousState: BufferConnectionActionState,
): Promise<BufferConnectionActionState> {
  try {
    await requireMarketingAdminAccess("marketing.integrations.manage");
    const result = await testAndPersistBufferConnection();

    revalidatePath("/admin/marketing/integrations");
    revalidatePath("/admin/marketing");

    if (!result.ok) {
      return { ok: false, message: result.error ?? "Buffer connection test failed." };
    }

    return {
      ok: true,
      message: "Buffer connected successfully. Instagram @mlamhco and Facebook MLAMH were verified.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Buffer connection test failed.",
    };
  }
}
