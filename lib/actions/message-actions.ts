"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type DashboardType = "publisher" | "talent";

async function getAuthenticatedParticipant(
  conversationId: number,
) {
  const authClient = await createServerSupabaseClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthorized.");
  }

  const { data: conversation, error: conversationError } =
    await adminClient
      .from("conversations")
      .select(`
        id,
        application_id,
        opportunity_id,
        publisher_id,
        talent_id,
        status
      `)
      .eq("id", conversationId)
      .maybeSingle();

  if (conversationError) {
    console.error("Conversation lookup error:", {
      message: conversationError.message,
      details: conversationError.details,
      hint: conversationError.hint,
      code: conversationError.code,
    });

    throw new Error(conversationError.message);
  }

  if (!conversation) {
    throw new Error("Conversation not found.");
  }

  const { data: profile, error: profileError } =
    await adminClient
      .from("profiles")
      .select("id, account_type")
      .eq("user_id", user.id)
      .maybeSingle();

  if (profileError) {
    console.error("Profile lookup error:", {
      message: profileError.message,
      details: profileError.details,
      hint: profileError.hint,
      code: profileError.code,
    });

    throw new Error(profileError.message);
  }

  if (!profile) {
    throw new Error("Profile not found.");
  }

  let dashboard: DashboardType | null = null;

  if (profile.account_type === "publisher") {
    const { data: publisher, error: publisherError } =
      await adminClient
        .from("publishers")
        .select("id")
        .eq("profile_id", profile.id)
        .maybeSingle();

    if (publisherError) {
      console.error("Publisher lookup error:", {
        message: publisherError.message,
        details: publisherError.details,
        hint: publisherError.hint,
        code: publisherError.code,
      });
    }

    if (
      !publisherError &&
      publisher?.id === conversation.publisher_id
    ) {
      dashboard = "publisher";
    }
  }

  if (profile.account_type === "talent") {
    const { data: talent, error: talentError } =
      await adminClient
        .from("talents")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (talentError) {
      console.error("Talent lookup error:", {
        message: talentError.message,
        details: talentError.details,
        hint: talentError.hint,
        code: talentError.code,
      });
    }

    if (
      !talentError &&
      talent?.id === conversation.talent_id
    ) {
      dashboard = "talent";
    }
  }

  if (!dashboard) {
    throw new Error("Access denied.");
  }

  return {
    adminClient,
    user,
    conversation,
    dashboard,
  };
}

function getConversationPath(
  locale: string,
  dashboard: DashboardType,
  conversationId: number,
) {
  return `/${locale}/${dashboard}-dashboard/messages/${conversationId}`;
}

export async function sendMessageAction(
  formData: FormData,
) {
  const conversationId = Number(
    formData.get("conversationId"),
  );

  const locale = String(
    formData.get("locale") ?? "ar",
  );

  const body = String(
    formData.get("body") ?? "",
  ).trim();

  if (
    !Number.isInteger(conversationId) ||
    conversationId <= 0
  ) {
    throw new Error("Invalid conversation.");
  }

  if (!body || body.length > 3000) {
    throw new Error(
      "Message must contain between 1 and 3000 characters.",
    );
  }

  const {
    adminClient,
    user,
    conversation,
    dashboard,
  } = await getAuthenticatedParticipant(conversationId);

  if ((conversation.status ?? "active") !== "active") {
    throw new Error(
      "This conversation is not active.",
    );
  }

  const createdAt = new Date().toISOString();

  const { error: insertError } = await adminClient
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_user_id: user.id,
      body,
      read_at: null,
      created_at: createdAt,
    });

  if (insertError) {
    console.error("Send message error:", {
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint,
      code: insertError.code,
    });

    throw new Error(insertError.message);
  }

  const { error: conversationUpdateError } =
    await adminClient
      .from("conversations")
      .update({
        updated_at: createdAt,
      })
      .eq("id", conversationId);

  if (conversationUpdateError) {
    console.error("Conversation update error:", {
      message: conversationUpdateError.message,
      details: conversationUpdateError.details,
      hint: conversationUpdateError.hint,
      code: conversationUpdateError.code,
    });
  }


  const notificationRecipientType =
    dashboard === "publisher" ? "talent" : "publisher";

  const notificationRecipientId =
    dashboard === "publisher"
      ? String(conversation.talent_id)
      : String(conversation.publisher_id);

  const { error: notificationError } = await adminClient
    .from("notifications")
    .insert({
      event_id: conversationId,
      recipient_type: notificationRecipientType,
      recipient_id: notificationRecipientId,
      title: locale === "ar" ? "رسالة جديدة" : "New message",
      body:
        dashboard === "publisher"
          ? locale === "ar"
            ? "لديك رسالة جديدة من الشركة."
            : "You have a new message from the company."
          : locale === "ar"
            ? "لديك رسالة جديدة من الموهبة."
            : "You have a new message from the talent.",
      is_read: false,
      created_at: createdAt,
    });

  if (notificationError) {
    console.error("Create message notification error:", {
      message: notificationError.message,
      details: notificationError.details,
      hint: notificationError.hint,
      code: notificationError.code,
    });
  }

  revalidatePath(
    getConversationPath(
      locale,
      dashboard,
      conversationId,
    ),
  );

  revalidatePath(
    `/${locale}/${dashboard}-dashboard/messages`,
  );

  revalidatePath(`/${locale}/publisher-dashboard/notifications`);
  revalidatePath(`/${locale}/talent-dashboard/notifications`);
}

export async function markConversationReadAction(
  conversationId: number,
) {
  if (
    !Number.isInteger(conversationId) ||
    conversationId <= 0
  ) {
    return;
  }

  const {
    adminClient,
    user,
    conversation,
    dashboard,
  } = await getAuthenticatedParticipant(conversationId);
  
  const readAt = new Date().toISOString();
  
  const { error } = await adminClient
    .from("messages")
    .update({
      read_at: readAt,
    })
    .eq("conversation_id", conversationId)
    .neq("sender_user_id", user.id)
    .is("read_at", null);
  
  if (error) {
    console.error("Mark messages read error:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  }
  
  const recipientType =
    dashboard === "talent"
      ? "talent"
      : "publisher";
  
  const recipientId =
    dashboard === "talent"
      ? String(conversation.talent_id)
      : String(conversation.publisher_id);
  
  const { error: notificationError } =
    await adminClient
      .from("notifications")
      .update({
        is_read: true,
      })
      .eq("event_id", conversationId)
      .eq("recipient_type", recipientType)
      .eq("recipient_id", recipientId)
      .eq("is_read", false);
  
  if (notificationError) {
    console.error(
      "Mark notification read error:",
      notificationError,
    );
  }

  if (error) {
    console.error("Mark messages read error:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  }
}

export async function reportMessageAction(
  formData: FormData,
) {
  const conversationId = Number(
    formData.get("conversationId"),
  );

  const messageId = Number(
    formData.get("messageId"),
  );

  const locale = String(
    formData.get("locale") ?? "ar",
  );

  const reportReason = String(
    formData.get("reportReason") ?? "",
  ).trim();

  if (
    !Number.isInteger(conversationId) ||
    conversationId <= 0
  ) {
    throw new Error("Invalid conversation.");
  }

  if (
    !Number.isInteger(messageId) ||
    messageId <= 0
  ) {
    throw new Error("Invalid message.");
  }

  if (
    !reportReason ||
    reportReason.length > 500
  ) {
    throw new Error(
      "Report reason must contain between 1 and 500 characters.",
    );
  }

  const {
    adminClient,
    user,
    dashboard,
  } = await getAuthenticatedParticipant(conversationId);

  const { data: message, error: messageError } =
    await adminClient
      .from("messages")
      .select(`
        id,
        conversation_id,
        sender_user_id,
        reported_at
      `)
      .eq("id", messageId)
      .eq("conversation_id", conversationId)
      .maybeSingle();

  if (messageError) {
    console.error("Message lookup error:", {
      message: messageError.message,
      details: messageError.details,
      hint: messageError.hint,
      code: messageError.code,
    });

    throw new Error(messageError.message);
  }

  if (!message) {
    throw new Error("Message not found.");
  }

  if (message.sender_user_id === user.id) {
    throw new Error(
      "You cannot report your own message.",
    );
  }

  if (message.reported_at) {
    revalidatePath(
      getConversationPath(
        locale,
        dashboard,
        conversationId,
      ),
    );

    return;
  }

  const { error: reportError } = await adminClient
    .from("messages")
    .update({
      reported_at: new Date().toISOString(),
      report_reason: reportReason,
    })
    .eq("id", messageId)
    .eq("conversation_id", conversationId);

  if (reportError) {
    console.error("Report message error:", {
      message: reportError.message,
      details: reportError.details,
      hint: reportError.hint,
      code: reportError.code,
    });

    throw new Error(reportError.message);
  }

  revalidatePath(
    getConversationPath(
      locale,
      dashboard,
      conversationId,
    ),
  );
}

export async function closeConversationAction(
  formData: FormData,
) {
  const conversationId = Number(
    formData.get("conversationId"),
  );

  const locale = String(
    formData.get("locale") ?? "ar",
  );

  if (
    !Number.isInteger(conversationId) ||
    conversationId <= 0
  ) {
    throw new Error("Invalid conversation.");
  }

  const {
    adminClient,
    user,
    conversation,
    dashboard,
  } = await getAuthenticatedParticipant(conversationId);

  if (dashboard !== "publisher") {
    throw new Error(
      "Only the publisher can close this conversation.",
    );
  }

  if ((conversation.status ?? "active") !== "active") {
    revalidatePath(
      getConversationPath(
        locale,
        dashboard,
        conversationId,
      ),
    );

    revalidatePath(
      `/${locale}/publisher-dashboard/messages`,
    );

    return;
  }

  const closedAt = new Date().toISOString();

  const { data: closedConversation, error: closeError } =
    await adminClient
      .from("conversations")
      .update({
        status: "closed",
        closed_by: user.id,
        closed_at: closedAt,
        updated_at: closedAt,
      })
      .eq("id", conversationId)
      .eq("publisher_id", conversation.publisher_id)
      .select(`
        id,
        status,
        closed_by,
        closed_at
      `)
      .maybeSingle();

  if (closeError) {
    console.error("Close conversation error:", {
      message: closeError.message,
      details: closeError.details,
      hint: closeError.hint,
      code: closeError.code,
    });

    throw new Error(closeError.message);
  }

  if (!closedConversation) {
    throw new Error(
      "Conversation could not be closed.",
    );
  }

  revalidatePath(
    getConversationPath(
      locale,
      dashboard,
      conversationId,
    ),
  );

  revalidatePath(
    `/${locale}/publisher-dashboard/messages`,
  );

  revalidatePath(
    `/${locale}/publisher-dashboard`,
  );
}