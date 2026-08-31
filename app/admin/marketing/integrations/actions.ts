"use server";

import { revalidatePath } from "next/cache";

import { requireMarketingAdminAccess } from "@/lib/auth/require-marketing-admin";
import { testAndPersistBufferConnection } from "@/lib/marketing/channels/buffer";

export async function testBufferConnectionAction() {
  await requireMarketingAdminAccess("marketing.integrations.manage");
  await testAndPersistBufferConnection();

  revalidatePath("/admin/marketing/integrations");
  revalidatePath("/admin/marketing");
}
