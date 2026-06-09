"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ALLOWED_APPLICATION_STATUSES = [
  "pending",
  "reviewing",
  "shortlisted",
  "accepted",
  "rejected",
] as const;

type ApplicationStatus = (typeof ALLOWED_APPLICATION_STATUSES)[number];

function isValidApplicationStatus(status: string): status is ApplicationStatus {
  return ALLOWED_APPLICATION_STATUSES.includes(status as ApplicationStatus);
}

export async function updateApplicationStatusAction(
  applicationId: string | number,
  status: string
) {
  if (!applicationId) throw new Error("Application ID is required.");
  if (!isValidApplicationStatus(status)) throw new Error("Invalid application status.");

  const authClient = await createServerSupabaseClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) throw new Error("Unauthorized.");

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile) throw new Error("Profile not found.");

  const { data: publisher, error: publisherError } = await adminClient
    .from("publishers")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (publisherError || !publisher) throw new Error("Publisher account not found.");

  const { data: application, error: applicationError } = await adminClient
    .from("opportunity_applications")
    .select(`
      id,
      opportunity_id,
      talent_id,
      status,
      opportunities (
        id,
        title,
        publisher_id
      ),
      talents (
        id,
        profile_id,
        profiles (
          id,
          user_id
        )
      )
    `)
    .eq("id", applicationId)
    .maybeSingle();

  if (applicationError || !application) throw new Error("Application not found.");

  const opportunity = Array.isArray(application.opportunities)
    ? application.opportunities[0]
    : application.opportunities;

  if (!opportunity || opportunity.publisher_id !== publisher.id) {
    throw new Error("Access denied.");
  }

  const talent = Array.isArray(application.talents)
    ? application.talents[0]
    : application.talents;

  const talentProfile = Array.isArray(talent?.profiles)
    ? talent.profiles[0]
    : talent?.profiles;

  const talentUserId = talentProfile?.user_id;

  if (!talentUserId) {
    throw new Error("Talent user account not found.");
  }

  const { error: updateError } = await adminClient
    .from("opportunity_applications")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", application.id)
    .eq("opportunity_id", application.opportunity_id);

  if (updateError) throw new Error(updateError.message);

  if (["shortlisted", "accepted", "rejected"].includes(status)) {
    const messages: Record<ApplicationStatus, string> = {
      pending: "Your application is pending",
      reviewing: "Your application is under review",
      shortlisted: "You have been shortlisted for the opportunity",
      accepted: "Your application has been accepted",
      rejected: "Your application has been rejected",
    };

    await adminClient.from("notifications").insert({
      user_id: talentUserId,
      message: messages[status as ApplicationStatus],
      type: "application_status",
      reference_id: application.opportunity_id,
      created_at: new Date().toISOString(),
      read: false,
    });
  }

  revalidatePath("/ar/publisher-dashboard/applicants");
  revalidatePath("/en/publisher-dashboard/applicants");

  revalidatePath(
    `/ar/publisher-dashboard/opportunities/${application.opportunity_id}/applicants`
  );
  revalidatePath(
    `/en/publisher-dashboard/opportunities/${application.opportunity_id}/applicants`
  );

  revalidatePath("/ar/publisher-dashboard/opportunities");
  revalidatePath("/en/publisher-dashboard/opportunities");

  revalidatePath("/ar/talent-dashboard");
  revalidatePath("/en/talent-dashboard");

  revalidatePath("/ar/talent-dashboard/applications");
  revalidatePath("/en/talent-dashboard/applications");

  revalidatePath("/ar/talent-dashboard/notifications");
  revalidatePath("/en/talent-dashboard/notifications");
}