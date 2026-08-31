"use server";

import { revalidatePath } from "next/cache";
import { requireMarketingAdminAccess } from "@/lib/auth/require-marketing-admin";
import { executeMarketingChannelJob } from "@/lib/marketing/channels/executor";

async function execute(formData: FormData, mode: "publish_now" | "schedule") {
  await requireMarketingAdminAccess("marketing.manage");
  const jobId = Number(formData.get("job_id"));
  if (!Number.isInteger(jobId) || jobId <= 0) throw new Error("Invalid channel job id.");
  await executeMarketingChannelJob(jobId, mode);
  revalidatePath("/admin/marketing/social");
  revalidatePath("/admin/marketing/content");
  revalidatePath("/admin/marketing/activity");
}

export async function publishChannelJobNowAction(formData: FormData) {
  await execute(formData, "publish_now");
}

export async function executeScheduledChannelJobAction(formData: FormData) {
  await execute(formData, "schedule");
}
