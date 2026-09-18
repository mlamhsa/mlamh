"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { recordAdminAction } from "@/lib/events/admin-audit";
import { EVENT_TARGETS } from "@/lib/events/event-targets";
import { validateAndSanitizeMessageAttachment } from "@/lib/security/message-attachment";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type DashboardType = "publisher" | "talent" | "admin";

const MESSAGE_ATTACHMENTS_BUCKET = "message-attachments";
const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;
const RESTRICTED_ACCOUNT_STATUSES = new Set([
  "suspended",
  "blocked",
  "banned",
  "disabled",
]);
const RESTRICTED_PUBLISHER_STATUSES = new Set([
  ...RESTRICTED_ACCOUNT_STATUSES,
  "rejected",
]);
const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "audio/webm",
  "audio/webm;codecs=opus",
  "audio/mp4",
]);

function getAttachmentFromFormData(formData: FormData) {
  const value = formData.get("attachment");
  if (!(value instanceof File) || value.size === 0) return null;
  if (value.size > MAX_ATTACHMENT_SIZE_BYTES) {
    throw new Error("Attachment size must not exceed 10 MB.");
  }
  if (!ALLOWED_ATTACHMENT_MIME_TYPES.has(value.type)) {
    throw new Error("Unsupported attachment type.");
  }
  return value;
}

function isRestrictedStatus(
  value: string | null | undefined,
  restricted: Set<string> = RESTRICTED_ACCOUNT_STATUSES,
) {
  return restricted.has(String(value ?? "").trim().toLowerCase());
}

async function getAuthenticatedParticipant(conversationId: number) {
  const authClient = await createServerSupabaseClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) throw new Error("Unauthorized.");

  const { data: conversation, error: conversationError } = await adminClient
    .from("conversations")
    .select("id,application_id,opportunity_id,publisher_id,talent_id,admin_user_id,conversation_type,status")
    .eq("id", conversationId)
    .maybeSingle();

  if (conversationError) {
    console.error("Conversation lookup error:", conversationError);
    throw new Error(conversationError.message);
  }
  if (!conversation) throw new Error("Conversation not found.");

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id,account_type,status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Profile lookup error:", profileError);
    throw new Error(profileError.message);
  }
  if (!profile) throw new Error("Profile not found.");
  if (isRestrictedStatus(profile.status)) throw new Error("Access denied.");

  let dashboard: DashboardType | null = null;

  if (profile.account_type === "publisher") {
    const { data: publisher, error: publisherError } = await adminClient
      .from("publishers")
      .select("id,status")
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (publisherError) console.error("Publisher lookup error:", publisherError);
    if (
      !publisherError &&
      publisher?.id === conversation.publisher_id &&
      !isRestrictedStatus(publisher?.status, RESTRICTED_PUBLISHER_STATUSES)
    ) {
      dashboard = "publisher";
    }
  }

  if (profile.account_type === "talent") {
    const { data: talent, error: talentError } = await adminClient
      .from("talents")
      .select("id,status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (talentError) console.error("Talent lookup error:", talentError);
    if (
      !talentError &&
      talent?.id === conversation.talent_id &&
      !isRestrictedStatus(talent?.status)
    ) {
      dashboard = "talent";
    }
  }

  if (
    profile.account_type === "admin" &&
    conversation.conversation_type === "mlamh_talent" &&
    conversation.admin_user_id === user.id
  ) {
    await requireAdminAccess();
    dashboard = "admin";
  }

  if (!dashboard) throw new Error("Access denied.");

  return { adminClient, user, conversation, dashboard };
}

function getConversationPath(locale: string, dashboard: DashboardType, conversationId: number) {
  if (dashboard === "admin") {
    return `/admin/messages/${conversationId}?lang=${locale}`;
  }
  return `/${locale}/${dashboard}-dashboard/messages/${conversationId}`;
}

export async function sendMessageAction(formData: FormData) {
  const conversationId = Number(formData.get("conversationId"));
  const locale = String(formData.get("locale") ?? "ar");
  const body = String(formData.get("body") ?? "").trim();
  const attachment = getAttachmentFromFormData(formData);

  if (!Number.isInteger(conversationId) || conversationId <= 0) {
    throw new Error("Invalid conversation.");
  }
  if (body.length > 3000) throw new Error("Message must not exceed 3000 characters.");
  if (!body && !attachment) throw new Error("Message must contain text or an attachment.");

  const { adminClient, user, conversation, dashboard } =
    await getAuthenticatedParticipant(conversationId);

  if ((conversation.status ?? "active") !== "active") {
    if (dashboard === "admin") {
      await recordAdminAction({
        actorId: user.id,
        actorEmail: user.email,
        action: "send_admin_message",
        outcome: "blocked",
        target: EVENT_TARGETS.CONVERSATION,
        targetId: conversationId,
        reason: "conversation_not_active",
      });
    }
    throw new Error("This conversation is not active.");
  }

  const safeAttachment = attachment
    ? await validateAndSanitizeMessageAttachment(attachment)
    : null;

  const createdAt = new Date().toISOString();
  const { data: createdMessage, error: insertError } = await adminClient
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_user_id: user.id,
      body,
      read_at: null,
      created_at: createdAt,
    })
    .select("id")
    .single();

  if (insertError || !createdMessage) {
    console.error("Send message error:", insertError);
    if (dashboard === "admin") {
      await recordAdminAction({
        actorId: user.id,
        actorEmail: user.email,
        action: "send_admin_message",
        outcome: "failed",
        target: EVENT_TARGETS.CONVERSATION,
        targetId: conversationId,
        reason: "message_insert_failed",
      });
    }
    throw new Error(insertError?.message ?? "Message could not be created.");
  }

  let uploadedStoragePath: string | null = null;

  try {
    if (safeAttachment) {
      const storageFileName = `${crypto.randomUUID()}${safeAttachment.storageExtension}`;
      uploadedStoragePath = [String(conversationId), user.id, storageFileName].join("/");

      const { error: uploadError } = await adminClient.storage
        .from(MESSAGE_ATTACHMENTS_BUCKET)
        .upload(uploadedStoragePath, safeAttachment.buffer, {
          contentType: safeAttachment.contentType,
          upsert: false,
          cacheControl: "3600",
        });

      if (uploadError) {
        console.error("Attachment upload error:", uploadError);
        throw new Error(uploadError.message);
      }

      const { error: attachmentInsertError } = await adminClient
        .from("message_attachments")
        .insert({
          message_id: createdMessage.id,
          conversation_id: conversationId,
          uploader_user_id: user.id,
          storage_path: uploadedStoragePath,
          file_name: safeAttachment.displayName,
          mime_type: safeAttachment.contentType,
          size_bytes: safeAttachment.sizeBytes,
          created_at: createdAt,
        });

      if (attachmentInsertError) {
        console.error("Attachment record error:", attachmentInsertError);
        throw new Error(attachmentInsertError.message);
      }
    }
  } catch (error) {
    if (uploadedStoragePath) {
      const { error: storageCleanupError } = await adminClient.storage
        .from(MESSAGE_ATTACHMENTS_BUCKET)
        .remove([uploadedStoragePath]);
      if (storageCleanupError) {
        console.error("Attachment storage cleanup error:", storageCleanupError);
      }
    }

    const { error: messageCleanupError } = await adminClient
      .from("messages")
      .delete()
      .eq("id", createdMessage.id)
      .eq("conversation_id", conversationId);

    if (messageCleanupError) {
      console.error("Message cleanup error:", messageCleanupError);
    }

    if (dashboard === "admin") {
      await recordAdminAction({
        actorId: user.id,
        actorEmail: user.email,
        action: "send_admin_message",
        outcome: "failed",
        target: EVENT_TARGETS.CONVERSATION,
        targetId: conversationId,
        reason: "message_attachment_processing_failed",
        metadata: {
          message_id: createdMessage.id,
          cleanup_failed:
            Boolean(messageCleanupError),
        },
      });
    }

    throw error;
  }

  const { error: conversationUpdateError } = await adminClient
    .from("conversations")
    .update({ updated_at: createdAt })
    .eq("id", conversationId);
  if (conversationUpdateError) {
    console.error("Conversation update error:", conversationUpdateError);
  }

  const isMlamhConversation = conversation.conversation_type === "mlamh_talent";
  const notificationRecipientType =
    dashboard === "publisher" || dashboard === "admin"
      ? "talent"
      : isMlamhConversation
        ? "ADMIN"
        : "publisher";
  const notificationRecipientId =
    dashboard === "publisher" || dashboard === "admin"
      ? String(conversation.talent_id)
      : isMlamhConversation
        ? String(conversation.admin_user_id)
        : String(conversation.publisher_id);

  const hasAttachment = Boolean(safeAttachment);
  const notificationBody = hasAttachment
    ? dashboard === "admin"
      ? locale === "ar"
        ? "لديك مرفق جديد من ملامح."
        : "You have a new attachment from MLAMH."
      : dashboard === "publisher"
        ? locale === "ar"
          ? "لديك مرفق جديد من الشركة."
          : "You have a new attachment from the company."
        : locale === "ar"
          ? "لديك مرفق جديد من الموهبة."
          : "You have a new attachment from the talent."
    : dashboard === "admin"
      ? locale === "ar"
        ? "لديك رسالة جديدة من ملامح."
        : "You have a new message from MLAMH."
      : dashboard === "publisher"
        ? locale === "ar"
          ? "لديك رسالة جديدة من الشركة."
          : "You have a new message from the company."
        : locale === "ar"
          ? "لديك رسالة جديدة من الموهبة."
          : "You have a new message from the talent.";

  // notifications.event_id is a real foreign key to events.id. Never reuse a
  // conversation id here: it can point at an unrelated event and corrupt the
  // notification/read relationship.
  const { data: messageEvent, error: messageEventError } = await adminClient
    .from("events")
    .insert({
      event_type: "message_created",
      target_type: "conversation",
      target_id: String(conversationId),
      actor_id: user.id,
      metadata: {
        conversationId,
        messageId: createdMessage.id,
        senderDashboard: dashboard,
        hasAttachment,
      },
    })
    .select("id")
    .single();

  if (messageEventError || !messageEvent) {
    console.error("Create message event error:", messageEventError);
  } else {
    const { error: notificationError } = await adminClient
      .from("notifications")
      .insert({
        event_id: messageEvent.id,
        recipient_type: notificationRecipientType,
        recipient_id: notificationRecipientId,
        title:
          locale === "ar"
            ? hasAttachment
              ? "مرفق جديد"
              : "رسالة جديدة"
            : hasAttachment
              ? "New attachment"
              : "New message",
        body: notificationBody,
        is_read: false,
        created_at: createdAt,
      });
    if (notificationError) {
      console.error("Create message notification error:", notificationError);
    }
  }

  if (dashboard === "admin") {
    await recordAdminAction({
      actorId: user.id,
      actorEmail: user.email,
      action: "send_admin_message",
      outcome: "success",
      target: EVENT_TARGETS.MESSAGE,
      targetId: createdMessage.id,
      metadata: {
        conversation_id: conversationId,
        has_attachment: hasAttachment,
      },
    });
  }

  revalidatePath(getConversationPath(locale, dashboard, conversationId));
  if (dashboard === "admin") {
    revalidatePath("/admin/messages");
    revalidatePath("/admin/notifications");
  } else {
    revalidatePath(`/${locale}/${dashboard}-dashboard/messages`);
  }
  revalidatePath(`/${locale}/publisher-dashboard/notifications`);
  revalidatePath(`/${locale}/talent-dashboard/notifications`);
  revalidatePath("/admin/messages");
  revalidatePath("/admin/notifications");
}

export async function markConversationReadAction(conversationId: number) {
  if (!Number.isInteger(conversationId) || conversationId <= 0) return;

  const { adminClient, user, conversation, dashboard } =
    await getAuthenticatedParticipant(conversationId);
  const readAt = new Date().toISOString();

  const { error } = await adminClient
    .from("messages")
    .update({ read_at: readAt })
    .eq("conversation_id", conversationId)
    .neq("sender_user_id", user.id)
    .is("read_at", null);

  if (error) {
    console.error("Mark messages read error:", error);

    if (dashboard === "admin") {
      await recordAdminAction({
        actorId: user.id,
        actorEmail: user.email,
        action: "mark_admin_conversation_read",
        outcome: "failed",
        target: EVENT_TARGETS.CONVERSATION,
        targetId: conversationId,
        reason: "message_read_update_failed",
      });
    }
  } else if (dashboard === "admin") {
    await recordAdminAction({
      actorId: user.id,
      actorEmail: user.email,
      action: "mark_admin_conversation_read",
      outcome: "success",
      target: EVENT_TARGETS.CONVERSATION,
      targetId: conversationId,
    });
  }

  const recipientType =
    dashboard === "talent" ? "talent" : dashboard === "admin" ? "ADMIN" : "publisher";
  const recipientId =
    dashboard === "talent"
      ? String(conversation.talent_id)
      : dashboard === "admin"
        ? String(conversation.admin_user_id)
        : String(conversation.publisher_id);

  const { data: messageEvents, error: eventLookupError } = await adminClient
    .from("events")
    .select("id")
    .eq("event_type", "message_created")
    .eq("target_type", "conversation")
    .eq("target_id", String(conversationId));

  if (eventLookupError) {
    console.error("Message notification event lookup error:", eventLookupError);
    return;
  }

  const eventIds = (messageEvents ?? []).map((event) => event.id);
  if (eventIds.length === 0) return;

  const { error: notificationError } = await adminClient
    .from("notifications")
    .update({ is_read: true })
    .in("event_id", eventIds)
    .eq("recipient_type", recipientType)
    .eq("recipient_id", recipientId)
    .eq("is_read", false);
  if (notificationError) console.error("Mark notification read error:", notificationError);
}

export async function reportMessageAction(formData: FormData) {
  const conversationId = Number(formData.get("conversationId"));
  const messageId = Number(formData.get("messageId"));
  const locale = String(formData.get("locale") ?? "ar");
  const reportReason = String(formData.get("reportReason") ?? "").trim();

  if (!Number.isInteger(conversationId) || conversationId <= 0) {
    throw new Error("Invalid conversation.");
  }
  if (!Number.isInteger(messageId) || messageId <= 0) throw new Error("Invalid message.");
  if (!reportReason || reportReason.length > 500) {
    throw new Error("Report reason must contain between 1 and 500 characters.");
  }

  const { adminClient, user, dashboard } = await getAuthenticatedParticipant(conversationId);
  const { data: message, error: messageError } = await adminClient
    .from("messages")
    .select("id,conversation_id,sender_user_id,reported_at")
    .eq("id", messageId)
    .eq("conversation_id", conversationId)
    .maybeSingle();

  if (messageError) {
    if (dashboard === "admin") {
      await recordAdminAction({
        actorId: user.id,
        actorEmail: user.email,
        action: "report_message_as_admin",
        outcome: "failed",
        target: EVENT_TARGETS.MESSAGE,
        targetId: messageId,
        reason: "message_lookup_failed",
      });
    }
    throw new Error(messageError.message);
  }

  if (!message) {
    if (dashboard === "admin") {
      await recordAdminAction({
        actorId: user.id,
        actorEmail: user.email,
        action: "report_message_as_admin",
        outcome: "failed",
        target: EVENT_TARGETS.MESSAGE,
        targetId: messageId,
        reason: "message_not_found",
      });
    }
    throw new Error("Message not found.");
  }

  if (message.sender_user_id === user.id) {
    if (dashboard === "admin") {
      await recordAdminAction({
        actorId: user.id,
        actorEmail: user.email,
        action: "report_message_as_admin",
        outcome: "blocked",
        target: EVENT_TARGETS.MESSAGE,
        targetId: messageId,
        reason: "cannot_report_own_message",
      });
    }
    throw new Error("You cannot report your own message.");
  }

  if (message.reported_at) {
    if (dashboard === "admin") {
      await recordAdminAction({
        actorId: user.id,
        actorEmail: user.email,
        action: "report_message_as_admin",
        outcome: "noop",
        target: EVENT_TARGETS.MESSAGE,
        targetId: messageId,
        reason: "message_already_reported",
      });
    }
    revalidatePath(getConversationPath(locale, dashboard, conversationId));
    return;
  }

  const { error: reportError } = await adminClient
    .from("messages")
    .update({ reported_at: new Date().toISOString(), report_reason: reportReason })
    .eq("id", messageId)
    .eq("conversation_id", conversationId);
  if (reportError) {
    if (dashboard === "admin") {
      await recordAdminAction({
        actorId: user.id,
        actorEmail: user.email,
        action: "report_message_as_admin",
        outcome: "failed",
        target: EVENT_TARGETS.MESSAGE,
        targetId: messageId,
        reason: "message_report_update_failed",
      });
    }
    throw new Error(reportError.message);
  }

  if (dashboard === "admin") {
    await recordAdminAction({
      actorId: user.id,
      actorEmail: user.email,
      action: "report_message_as_admin",
      outcome: "success",
      target: EVENT_TARGETS.MESSAGE,
      targetId: messageId,
      metadata: {
        conversation_id: conversationId,
        report_reason_length:
          reportReason.length,
      },
    });
  }

  revalidatePath(getConversationPath(locale, dashboard, conversationId));
}

export async function closeConversationAction(formData: FormData) {
  const conversationId = Number(formData.get("conversationId"));
  const locale = String(formData.get("locale") ?? "ar");
  if (!Number.isInteger(conversationId) || conversationId <= 0) {
    throw new Error("Invalid conversation.");
  }

  const { adminClient, user, conversation, dashboard } =
    await getAuthenticatedParticipant(conversationId);

  const isMlamhAdminConversation =
    dashboard === "admin" &&
    conversation.conversation_type === "mlamh_talent" &&
    conversation.admin_user_id === user.id;

  if (dashboard !== "publisher" && !isMlamhAdminConversation) {
    throw new Error("Only the publisher or assigned MLAMH admin can close this conversation.");
  }

  if ((conversation.status ?? "active") !== "active") {
    if (dashboard === "admin") {
      await recordAdminAction({
        actorId: user.id,
        actorEmail: user.email,
        action: "close_admin_conversation",
        outcome: "noop",
        target: EVENT_TARGETS.CONVERSATION,
        targetId: conversationId,
        reason: "conversation_already_closed",
      });
    }
    revalidatePath(getConversationPath(locale, dashboard, conversationId));
    revalidatePath(`/${locale}/publisher-dashboard/messages`);
    return;
  }

  const closedAt = new Date().toISOString();
  let closeQuery = adminClient
    .from("conversations")
    .update({
      status: "closed",
      closed_by: user.id,
      closed_at: closedAt,
      updated_at: closedAt,
    })
    .eq("id", conversationId);

  if (dashboard === "publisher") {
    closeQuery = closeQuery.eq("publisher_id", conversation.publisher_id);
  } else {
    closeQuery = closeQuery
      .eq("conversation_type", "mlamh_talent")
      .eq("admin_user_id", user.id);
  }

  const { data: closedConversation, error: closeError } = await closeQuery
    .select("id,status,closed_by,closed_at")
    .maybeSingle();
  if (closeError) {
    if (dashboard === "admin") {
      await recordAdminAction({
        actorId: user.id,
        actorEmail: user.email,
        action: "close_admin_conversation",
        outcome: "failed",
        target: EVENT_TARGETS.CONVERSATION,
        targetId: conversationId,
        reason: "conversation_close_failed",
      });
    }
    throw new Error(closeError.message);
  }

  if (!closedConversation) {
    if (dashboard === "admin") {
      await recordAdminAction({
        actorId: user.id,
        actorEmail: user.email,
        action: "close_admin_conversation",
        outcome: "failed",
        target: EVENT_TARGETS.CONVERSATION,
        targetId: conversationId,
        reason: "conversation_not_closed",
      });
    }
    throw new Error("Conversation could not be closed.");
  }

  if (dashboard === "admin") {
    await recordAdminAction({
      actorId: user.id,
      actorEmail: user.email,
      action: "close_admin_conversation",
      outcome: "success",
      target: EVENT_TARGETS.CONVERSATION,
      targetId: conversationId,
      metadata: {
        closed_at: closedAt,
      },
    });
  }

  revalidatePath(getConversationPath(locale, dashboard, conversationId));
  if (dashboard === "admin") {
    revalidatePath("/admin/messages");
    revalidatePath(`/admin/messages/${conversationId}`);
    revalidatePath(`/${locale}/talent-dashboard/messages`);
    revalidatePath(`/${locale}/talent-dashboard`);
  } else {
    revalidatePath(`/${locale}/publisher-dashboard/messages`);
    revalidatePath(`/${locale}/publisher-dashboard`);
  }
}
