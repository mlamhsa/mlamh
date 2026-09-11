"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function positiveInt(value: FormDataEntryValue | null) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error("Invalid id.");
  return parsed;
}

function text(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

async function requireTalent() {
  const auth = await createServerSupabaseClient();
  const admin = createAdminClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) throw new Error("Unauthorized.");

  const { data: profile } = await admin
    .from("profiles")
    .select("id,account_type,approval_status,status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile || profile.account_type !== "talent" || profile.approval_status !== "approved") {
    throw new Error("Talent access required.");
  }
  if (["suspended", "blocked", "banned", "disabled"].includes(String(profile.status))) {
    throw new Error("Talent account is not active.");
  }

  const { data: talent } = await admin.from("talents").select("id,status").eq("user_id", user.id).maybeSingle();
  if (!talent || ["suspended", "blocked", "banned", "disabled", "rejected"].includes(String(talent.status))) {
    throw new Error("Talent account is not active.");
  }
  return { userId: user.id, talentId: Number(talent.id) };
}

async function refreshManagedBooking(projectId: number, conversationId: number) {
  const admin = createAdminClient();
  const { data: project } = await admin.from("casting_projects").select("client_access_token").eq("id", projectId).maybeSingle();
  revalidatePath(`/ar/booking/${conversationId}`);
  revalidatePath(`/en/booking/${conversationId}`);
  revalidatePath(`/ar/talent-dashboard/messages/${conversationId}`);
  revalidatePath(`/en/talent-dashboard/messages/${conversationId}`);
  revalidatePath(`/admin/messages/${conversationId}`);
  revalidatePath(`/admin/casting/${projectId}`);
  revalidatePath(`/admin/casting/${projectId}/applications`);
  if (project?.client_access_token) {
    revalidatePath(`/ar/casting/status/${project.client_access_token}`);
    revalidatePath(`/en/casting/status/${project.client_access_token}`);
  }
}

async function logManagedEvent({
  eventType,
  bookingId,
  conversationId,
  projectId,
  actorUserId,
  responseNote,
}: {
  eventType: string;
  bookingId: number;
  conversationId: number;
  projectId: number;
  actorUserId: string;
  responseNote?: string | null;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from("events").insert({
    event_type: eventType,
    target_type: "booking",
    target_id: String(bookingId),
    actor_id: actorUserId,
    metadata: { bookingId, conversationId, projectId, response_note: responseNote || null, managed_by: "mlamh" },
  });
  if (error) console.error("[managed booking event]", error);
}

export async function respondToManagedBookingAction(formData: FormData) {
  const actor = await requireTalent();
  const bookingId = positiveInt(formData.get("bookingId"));
  const response = text(formData.get("response"));
  if (!["confirm", "request_changes"].includes(response)) throw new Error("Invalid booking response.");
  const responseNote = text(formData.get("responseNote")) || null;
  if (response === "request_changes" && !responseNote) throw new Error("Please describe the requested change.");

  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("talent_bookings")
    .select("id,conversation_id,talent_id,status,managed_casting_project_id,publisher_id")
    .eq("id", bookingId)
    .eq("talent_id", actor.talentId)
    .maybeSingle();
  if (!booking || booking.publisher_id !== null || !booking.managed_casting_project_id) throw new Error("Managed booking not found.");
  if (!["proposed", "changes_requested"].includes(booking.status)) throw new Error("Booking is not awaiting a response.");

  const now = new Date().toISOString();
  const nextStatus = response === "confirm" ? "confirmed" : "changes_requested";
  const { error } = await admin.from("talent_bookings").update({
    status: nextStatus,
    talent_response_note: responseNote,
    talent_response_at: now,
    confirmed_at: response === "confirm" ? now : null,
    updated_at: now,
  }).eq("id", booking.id).eq("status", booking.status);
  if (error) throw new Error(error.message);

  const projectId = Number(booking.managed_casting_project_id);
  await logManagedEvent({
    eventType: response === "confirm" ? "managed_booking_confirmed" : "managed_booking_changes_requested",
    bookingId: Number(booking.id),
    conversationId: Number(booking.conversation_id),
    projectId,
    actorUserId: actor.userId,
    responseNote,
  });

  const { data: projectBookings } = await admin
    .from("talent_bookings")
    .select("id,status")
    .eq("managed_casting_project_id", projectId);
  const rows = projectBookings ?? [];
  const confirmed = rows.filter((item) => ["confirmed", "completed"].includes(item.status)).length;
  const awaiting = rows.filter((item) => ["proposed", "changes_requested"].includes(item.status)).length;
  await admin.from("casting_projects").update({
    client_status_note: awaiting === 0 && rows.length > 0
      ? `تم تأكيد جميع المواهب المختارة (${confirmed}/${rows.length}) وأصبحت الحجوزات جاهزة للتنفيذ.`
      : `جاري تأكيد المواهب المختارة. تم تأكيد ${confirmed} من ${rows.length}.`,
    updated_at: now,
  }).eq("id", projectId);

  await refreshManagedBooking(projectId, Number(booking.conversation_id));
}

export async function markManagedBookingCompletedByTalentAction(formData: FormData) {
  const actor = await requireTalent();
  const bookingId = positiveInt(formData.get("bookingId"));
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("talent_bookings")
    .select("id,conversation_id,talent_id,status,managed_casting_project_id,publisher_id,publisher_completed_at,talent_completed_at")
    .eq("id", bookingId)
    .eq("talent_id", actor.talentId)
    .maybeSingle();
  if (!booking || booking.publisher_id !== null || !booking.managed_casting_project_id) throw new Error("Managed booking not found.");
  if (!["confirmed", "completed"].includes(booking.status)) throw new Error("Booking must be confirmed first.");
  if (booking.talent_completed_at) {
    await refreshManagedBooking(Number(booking.managed_casting_project_id), Number(booking.conversation_id));
    return;
  }

  const now = new Date().toISOString();
  const bothComplete = Boolean(booking.publisher_completed_at);
  const { error } = await admin.from("talent_bookings").update({
    talent_completed_at: now,
    status: bothComplete ? "completed" : "confirmed",
    completed_at: bothComplete ? now : null,
    updated_at: now,
  }).eq("id", booking.id);
  if (error) throw new Error(error.message);

  const projectId = Number(booking.managed_casting_project_id);
  await logManagedEvent({
    eventType: bothComplete ? "managed_booking_completed" : "managed_booking_talent_completed",
    bookingId: Number(booking.id),
    conversationId: Number(booking.conversation_id),
    projectId,
    actorUserId: actor.userId,
  });

  await refreshManagedBooking(projectId, Number(booking.conversation_id));
}
