"use server";

import { revalidatePath } from "next/cache";

import {
  isPublisherApplicationStatus,
  updatePublisherApplicationStatus,
} from "@/lib/applications/publisher-application-status-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function revalidateApplicationPaths(opportunityId: string | number) {
  const paths = [
    "/ar/publisher-dashboard/applicants",
    "/en/publisher-dashboard/applicants",
    `/ar/publisher-dashboard/opportunities/${opportunityId}`,
    `/en/publisher-dashboard/opportunities/${opportunityId}`,
    `/ar/publisher-dashboard/opportunities/${opportunityId}/applicants`,
    `/en/publisher-dashboard/opportunities/${opportunityId}/applicants`,
    "/ar/publisher-dashboard/opportunities",
    "/en/publisher-dashboard/opportunities",
    "/ar/publisher-dashboard/messages",
    "/en/publisher-dashboard/messages",
    "/ar/publisher-dashboard/notifications",
    "/en/publisher-dashboard/notifications",
    "/ar/talent-dashboard",
    "/en/talent-dashboard",
    "/ar/talent-dashboard/applications",
    "/en/talent-dashboard/applications",
    "/ar/talent-dashboard/messages",
    "/en/talent-dashboard/messages",
    "/ar/talent-dashboard/notifications",
    "/en/talent-dashboard/notifications",
  ];

  paths.forEach((path) => revalidatePath(path));
}

export async function updateApplicationStatusAction(
  applicationId: string | number,
  status: string,
) {
  if (!applicationId) throw new Error("Application ID is required.");
  if (!isPublisherApplicationStatus(status)) {
    throw new Error("Invalid application status.");
  }

  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) throw new Error("Unauthorized.");

  const result = await updatePublisherApplicationStatus({
    userId: user.id,
    applicationId,
    status,
  });

  revalidateApplicationPaths(result.opportunityId);
  return result;
}
