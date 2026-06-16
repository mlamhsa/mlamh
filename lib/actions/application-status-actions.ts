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

function getNotificationMessage(
  status: ApplicationStatus,
  opportunityTitle?: string | null
) {
  const title = opportunityTitle ? `: ${opportunityTitle}` : "";

  const messages: Record<ApplicationStatus, string> = {
    pending: `Your application is pending${title}`,
    reviewing: `Your application is under review${title}`,
    shortlisted: `You have been shortlisted for the opportunity${title}`,
    accepted: `Your application has been accepted${title}`,
    rejected: `Your application has been rejected${title}`,
  };

  return messages[status];
}

/* ===========================
   V2 ENHANCEMENT: STATUS RULES ENGINE
=========================== */
const validTransitions: Record<string, string[]> = {
  pending: ["reviewing", "shortlisted", "rejected"],
  reviewing: ["shortlisted", "accepted", "rejected"],
  shortlisted: ["accepted", "rejected"],
  accepted: [],
  rejected: [],
};

/* ===========================
   V2 ENHANCEMENT: ANALYTICS TRACKING
=========================== */
async function logStatusChange(
  adminClient: any,
  applicationId: string | number,
  oldStatus: string,
  newStatus: string,
  userId: string
) {
  await adminClient.from("application_status_logs").insert({
    application_id: applicationId,
    old_status: oldStatus,
    new_status: newStatus,
    changed_by: userId,
    created_at: new Date().toISOString(),
  });
}

/* ===========================
   V2 ENHANCEMENT: ENGAGEMENT TRACKING
=========================== */
async function updateEngagement(
  adminClient: any,
  talentId: string | number,
  status: string
) {
  await adminClient.from("talent_engagement_score").upsert({
    talent_id: talentId,
    last_status: status,
    updated_at: new Date().toISOString(),
  });
}

export async function updateApplicationStatusAction(
  applicationId: string | number,
  status: string
) {
  if (!applicationId) throw new Error("Application ID is required.");
  if (!isValidApplicationStatus(status)) {
    throw new Error("Invalid application status.");
  }

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

  if (publisherError || !publisher) {
    throw new Error("Publisher account not found.");
  }

  const { data: application, error: applicationError } = await adminClient
    .from("opportunity_applications")
    .select("id, opportunity_id, talent_id, status")
    .eq("id", applicationId)
    .maybeSingle();

  if (applicationError || !application) {
    throw new Error("Application not found.");
  }

  const { data: opportunity, error: opportunityError } = await adminClient
    .from("opportunities")
    .select("id, title, publisher_id")
    .eq("id", application.opportunity_id)
    .maybeSingle();

  if (opportunityError || !opportunity) {
    throw new Error("Opportunity not found.");
  }

  if (opportunity.publisher_id !== publisher.id) {
    throw new Error("Access denied.");
  }

  const { data: talent, error: talentError } = await adminClient
    .from("talents")
    .select("id, user_id")
    .eq("id", application.talent_id)
    .maybeSingle();

  if (talentError || !talent?.user_id) {
    throw new Error("Talent user account not found.");
  }

  /* ===========================
     V2 RULE: VALID TRANSITION CHECK
  =========================== */
  const currentStatus = application.status;

  if (!validTransitions[currentStatus]?.includes(status)) {
    throw new Error("Invalid status transition.");
  }

  /* ===========================
     UPDATE STATUS
  =========================== */
  const { error: updateError } = await adminClient
    .from("opportunity_applications")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", application.id)
    .eq("opportunity_id", application.opportunity_id);

  if (updateError) throw new Error(updateError.message);

  /* ===========================
     V2 LOGGING
  =========================== */
  await logStatusChange(
    adminClient,
    application.id,
    currentStatus,
    status,
    user.id
  );

  /* ===========================
     NOTIFICATIONS (existing logic)
  =========================== */
  if (["shortlisted", "accepted", "rejected"].includes(status)) {
    const { error: notificationError } = await adminClient
      .from("notifications")
      .insert({
        user_id: talent.user_id,
        type: "application_status",
        message: getNotificationMessage(status, opportunity.title),
        reference_id: application.opportunity_id,
        read: false,
        created_at: new Date().toISOString(),
      });

    if (notificationError) {
      console.error(
        "Failed to create notification:",
        notificationError.message
      );
    }
  }

  /* ===========================
     V2 ENGAGEMENT UPDATE
  =========================== */
  await updateEngagement(adminClient, application.talent_id, status);

  /* ===========================
     REVALIDATE PATHS
  =========================== */
  const paths = [
    "/ar/publisher-dashboard/applicants",
    "/en/publisher-dashboard/applicants",
    `/ar/publisher-dashboard/opportunities/${application.opportunity_id}/applicants`,
    `/en/publisher-dashboard/opportunities/${application.opportunity_id}/applicants`,
    "/ar/publisher-dashboard/opportunities",
    "/en/publisher-dashboard/opportunities",
    "/ar/talent-dashboard",
    "/en/talent-dashboard",
    "/ar/talent-dashboard/applications",
    "/en/talent-dashboard/applications",
    "/ar/talent-dashboard/notifications",
    "/en/talent-dashboard/notifications",
  ];

  paths.forEach((path) => {
    revalidatePath(path);
  });
}