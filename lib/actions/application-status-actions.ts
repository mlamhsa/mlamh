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

type ApplicationStatus =
  (typeof ALLOWED_APPLICATION_STATUSES)[number];

type AdminClient = ReturnType<typeof createAdminClient>;

type AcceptedApplicationContext = {
  applicationId: string | number;
  opportunityId: string | number;
  publisherId: string | number;
  talentId: string | number;
};

function isValidApplicationStatus(
  status: string,
): status is ApplicationStatus {
  return ALLOWED_APPLICATION_STATUSES.includes(
    status as ApplicationStatus,
  );
}

function normalizeApplicationStatus(
  status: string | null | undefined,
): ApplicationStatus {
  return status && isValidApplicationStatus(status)
    ? status
    : "pending";
}

function getNotificationMessage(
  status: ApplicationStatus,
  opportunityTitle?: string | null,
) {
  const title = opportunityTitle ? `: ${opportunityTitle}` : "";

  const messages: Record<ApplicationStatus, string> = {
    pending: `Your application is pending${title}`,
    reviewing: `Your application is under review${title}`,
    shortlisted: `You have been shortlisted for the opportunity${title}`,
    accepted: `Your application has been accepted${title}. You can now start a conversation with the company.`,
    rejected: `Your application has been rejected${title}`,
  };

  return messages[status];
}

/*
 * MVP flow:
 * Every non-final application can be accepted or rejected directly.
 * Reviewing and shortlisted remain supported for old test data only.
 */
const validTransitions: Record<
  ApplicationStatus,
  ApplicationStatus[]
> = {
  pending: ["accepted", "rejected"],
  reviewing: ["accepted", "rejected"],
  shortlisted: ["accepted", "rejected"],
  accepted: [],
  rejected: [],
};

async function logStatusChange(
  adminClient: AdminClient,
  applicationId: string | number,
  oldStatus: ApplicationStatus,
  newStatus: ApplicationStatus,
  userId: string,
) {
  const { error } = await adminClient
    .from("application_status_logs")
    .insert({
      application_id: applicationId,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by: userId,
      created_at: new Date().toISOString(),
    });

  if (error) {
    console.error("Application status log error:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  }
}

async function updateEngagement(
  adminClient: AdminClient,
  talentId: string | number,
  status: ApplicationStatus,
) {
  const { error } = await adminClient
    .from("talent_engagement_score")
    .upsert({
      talent_id: talentId,
      last_status: status,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error("Talent engagement update error:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  }
}

async function ensureAcceptedConversation(
  adminClient: AdminClient,
  context: AcceptedApplicationContext,
) {
  const {
    applicationId,
    opportunityId,
    publisherId,
    talentId,
  } = context;

  const { data: existingConversation, error: lookupError } =
    await adminClient
      .from("conversations")
      .select("id, status")
      .eq("application_id", applicationId)
      .maybeSingle();

  if (lookupError) {
    throw new Error(
      `Failed to check the application conversation: ${lookupError.message}`,
    );
  }

  if (existingConversation) {
    return existingConversation.id;
  }

  const now = new Date().toISOString();

  const { data: createdConversation, error: createError } =
    await adminClient
      .from("conversations")
      .insert({
        application_id: applicationId,
        opportunity_id: opportunityId,
        publisher_id: publisherId,
        talent_id: talentId,
        status: "active",
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .single();

  if (!createError && createdConversation) {
    return createdConversation.id;
  }

  if (createError?.code === "23505") {
    const { data: concurrentConversation, error: retryError } =
      await adminClient
        .from("conversations")
        .select("id")
        .eq("application_id", applicationId)
        .maybeSingle();

    if (!retryError && concurrentConversation) {
      return concurrentConversation.id;
    }
  }

  throw new Error(
    `Failed to create the accepted application conversation: ${
      createError?.message ?? "Unknown error"
    }`,
  );
}

function revalidateApplicationPaths(
  opportunityId: string | number,
) {
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

  paths.forEach((path) => {
    revalidatePath(path);
  });
}

export async function updateApplicationStatusAction(
  applicationId: string | number,
  status: string,
) {
  if (!applicationId) {
    throw new Error("Application ID is required.");
  }

  if (!isValidApplicationStatus(status)) {
    throw new Error("Invalid application status.");
  }

  const authClient = await createServerSupabaseClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthorized.");
  }

  const { data: profile, error: profileError } =
  await adminClient
    .from("profiles")
    .select("id, account_type, approval_status, status")
    .eq("user_id", user.id)
    .maybeSingle();

if (profileError || !profile) {
  throw new Error("Profile not found.");
}

if (profile.account_type !== "publisher") {
  throw new Error("Publisher access required.");
}

if (profile.approval_status !== "approved") {
  throw new Error("Publisher account is not approved.");
}

if (
  profile.status === "suspended" ||
  profile.status === "blocked" ||
  profile.status === "banned" ||
  profile.status === "disabled"
) {
  throw new Error("Publisher account is not active.");
}

  const { data: publisher, error: publisherError } =
    await adminClient
      .from("publishers")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();

  if (publisherError || !publisher) {
    throw new Error("Publisher account not found.");
  }

  const { data: application, error: applicationError } =
    await adminClient
      .from("opportunity_applications")
      .select("id, opportunity_id, talent_id, status")
      .eq("id", applicationId)
      .maybeSingle();

  if (applicationError || !application) {
    throw new Error("Application not found.");
  }

  const { data: opportunity, error: opportunityError } =
    await adminClient
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

  const currentStatus = normalizeApplicationStatus(
    application.status,
  );

  if (currentStatus === status) {
    if (status === "accepted") {
      await ensureAcceptedConversation(adminClient, {
        applicationId: application.id,
        opportunityId: application.opportunity_id,
        publisherId: publisher.id,
        talentId: application.talent_id,
      });

      revalidateApplicationPaths(application.opportunity_id);
    }

    return;
  }

  if (!validTransitions[currentStatus].includes(status)) {
    throw new Error(
      `Invalid status transition: ${currentStatus} → ${status}.`,
    );
  }

  const { data: talent, error: talentError } =
    await adminClient
      .from("talents")
      .select("id, user_id")
      .eq("id", application.talent_id)
      .maybeSingle();

  if (talentError || !talent?.user_id) {
    throw new Error("Talent user account not found.");
  }

  const now = new Date().toISOString();

  const {
    data: updatedApplication,
    error: updateError,
  } = await adminClient
    .from("opportunity_applications")
    .update({
      status,
      updated_at: now,
    })
    .eq("id", application.id)
    .eq("opportunity_id", application.opportunity_id)
    .eq("status", application.status)
    .select("id")
    .maybeSingle();
  
  if (updateError) {
    throw new Error(updateError.message);
  }
  
  if (!updatedApplication) {
    throw new Error(
      "Application status changed before the update could complete.",
    );
  }

  await logStatusChange(
    adminClient,
    application.id,
    currentStatus,
    status,
    user.id,
  );

  if (status === "accepted") {
    await ensureAcceptedConversation(adminClient, {
      applicationId: application.id,
      opportunityId: application.opportunity_id,
      publisherId: publisher.id,
      talentId: application.talent_id,
    });
  }

  if (["accepted", "rejected"].includes(status)) {
    const { error: notificationError } = await adminClient
      .from("notifications")
      .insert({
        user_id: talent.user_id,
        type: "application_status",
        message: getNotificationMessage(
          status,
          opportunity.title,
        ),
        reference_id: application.opportunity_id,
        read: false,
        created_at: now,
      });

    if (notificationError) {
      console.error("Failed to create notification:", {
        message: notificationError.message,
        details: notificationError.details,
        hint: notificationError.hint,
        code: notificationError.code,
      });
    }
  }

  await updateEngagement(
    adminClient,
    application.talent_id,
    status,
  );

  revalidateApplicationPaths(application.opportunity_id);
}
