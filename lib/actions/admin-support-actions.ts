"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

function getTicketId(formData: FormData) {
  const id = Number(formData.get("ticket_id"));
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid support ticket id.");
  return id;
}

function getLocale(formData: FormData): "ar" | "en" {
  return formData.get("locale") === "en" ? "en" : "ar";
}

export async function adminReplySupportTicketAction(formData: FormData) {
  const admin = await requireAdminAccess();
  const ticketId = getTicketId(formData);
  const locale = getLocale(formData);
  const message = String(formData.get("message") ?? "").trim();

  if (!message || message.length > 10000) {
    redirect(`/admin/support/${ticketId}?lang=${locale}&error=invalid_message`);
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.rpc("admin_reply_support_ticket", {
    p_ticket_id: ticketId,
    p_admin_user_id: admin.id,
    p_message: message,
  });

  if (error) {
    console.error("[adminReplySupportTicketAction]", error);
    redirect(`/admin/support/${ticketId}?lang=${locale}&error=reply_failed`);
  }

  revalidatePath(`/admin/support/${ticketId}`);
  revalidatePath("/admin/support");
  redirect(`/admin/support/${ticketId}?lang=${locale}&sent=1`);
}

export async function updateSupportTicketStatusAction(formData: FormData) {
  await requireAdminAccess();
  const ticketId = getTicketId(formData);
  const locale = getLocale(formData);
  const status = String(formData.get("status") ?? "");
  const allowed = new Set(["new", "open", "in_progress", "pending_user", "resolved", "closed"]);

  if (!allowed.has(status)) {
    redirect(`/admin/support/${ticketId}?lang=${locale}&error=invalid_status`);
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("support_tickets")
    .update({ status })
    .eq("id", ticketId);

  if (error) {
    console.error("[updateSupportTicketStatusAction]", error);
    redirect(`/admin/support/${ticketId}?lang=${locale}&error=status_failed`);
  }

  revalidatePath(`/admin/support/${ticketId}`);
  revalidatePath("/admin/support");
  redirect(`/admin/support/${ticketId}?lang=${locale}`);
}
