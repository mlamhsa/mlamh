"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type Role = "publisher" | "talent";

type ActorContext = {
  userId: string;
  profileId: number;
  role: Role;
  publisherId?: number;
  talentId?: number;
};

async function requireActor(expectedRole: Role): Promise<ActorContext> {
  const auth = await createServerSupabaseClient();
  const admin = createAdminClient();
  const { data: { user }, error } = await auth.auth.getUser();
  if (error || !user) throw new Error("Unauthorized.");

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, account_type, approval_status, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.account_type !== expectedRole) {
    throw new Error("Access denied.");
  }
  if (profile.approval_status !== "approved") throw new Error("Account is not approved.");
  if (["suspended", "blocked", "banned", "disabled"].includes(String(profile.status))) {
    throw new Error("Account is not active.");
  }

  if (expectedRole === "publisher") {
    const { data: publisher, error: publisherError } = await admin
      .from("publishers")
      .select("id, status")
      .eq("profile_id", profile.id)
      .maybeSingle();
    if (publisherError || !publisher) throw new Error("Publisher not found.");
    if (["suspended", "blocked", "banned", "disabled"].includes(String(publisher.status))) {
      throw new Error("Publisher account is not active.");
    }
    return { userId: user.id, profileId: profile.id, role: expectedRole, publisherId: publisher.id };
  }

  const { data: talent, error: talentError } = await admin
    .from("talents")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (talentError || !talent) throw new Error("Talent not found.");
  if (["suspended", "blocked", "banned", "disabled", "rejected"].includes(String(talent.status))) {
    throw new Error("Talent account is not active.");
  }
  return { userId: user.id, profileId: profile.id, role: expectedRole, talentId: talent.id };
}

function localeFrom(formData: FormData) {
  return formData.get("locale") === "en" ? "en" : "ar";
}

function numberId(formData: FormData, key: string) {
  const value = Number(formData.get(key));
  if (!Number.isInteger(value) || value <= 0) throw new Error(`Invalid ${key}.`);
  return value;
}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function revalidateBooking(locale: string, conversationId: number) {
  revalidatePath(`/${locale}/publisher-dashboard/messages/${conversationId}`);
  revalidatePath(`/${locale}/talent-dashboard/messages/${conversationId}`);
  revalidatePath(`/${locale}/publisher-dashboard/messages`);
  revalidatePath(`/${locale}/talent-dashboard/messages`);
}

export async function proposeBookingAction(formData: FormData) {
  const actor = await requireActor("publisher");
  const locale = localeFrom(formData);
  const conversationId = numberId(formData, "conversationId");
  const admin = createAdminClient();

  const { data: conversation, error: conversationError } = await admin
    .from("conversations")
    .select("id, application_id, opportunity_id, publisher_id, talent_id, status")
    .eq("id", conversationId)
    .eq("publisher_id", actor.publisherId!)
    .maybeSingle();
  if (conversationError || !conversation || !conversation.application_id) throw new Error("Conversation not found.");
  if (conversation.status !== "active") throw new Error("Conversation is not active.");

  const { data: application, error: appError } = await admin
    .from("opportunity_applications")
    .select("id, status")
    .eq("id", conversation.application_id)
    .maybeSingle();
  if (appError || !application || application.status !== "accepted") {
    throw new Error("Only accepted applications can be booked.");
  }

  const compensationType = text(formData, "compensationType") || "negotiable";
  if (!['fixed','negotiable','unpaid'].includes(compensationType)) throw new Error("Invalid compensation type.");
  const amountRaw = text(formData, "compensationAmount");
  const amount = amountRaw ? Number(amountRaw) : null;
  if (amount !== null && (!Number.isFinite(amount) || amount < 0)) throw new Error("Invalid compensation amount.");

  const now = new Date().toISOString();
  const payload = {
    application_id: conversation.application_id,
    conversation_id: conversation.id,
    opportunity_id: conversation.opportunity_id,
    publisher_id: conversation.publisher_id,
    talent_id: conversation.talent_id,
    status: "proposed",
    work_date: text(formData, "workDate") || null,
    work_time: text(formData, "workTime") || null,
    work_duration: text(formData, "workDuration") || null,
    location_text: text(formData, "locationText") || null,
    compensation_type: compensationType,
    compensation_amount: amount,
    currency: (text(formData, "currency") || "SAR").toUpperCase(),
    notes: text(formData, "notes") || null,
    talent_response_note: null,
    proposed_by: actor.userId,
    proposed_at: now,
    talent_response_at: null,
    confirmed_at: null,
    updated_at: now,
  };

  const { data: existing, error: existingError } = await admin
    .from("talent_bookings")
    .select("id, status")
    .eq("application_id", conversation.application_id)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);
  if (existing && ["confirmed", "completed", "cancelled"].includes(existing.status)) {
    throw new Error("This booking can no longer be replaced.");
  }

  const query = existing
    ? admin.from("talent_bookings").update(payload).eq("id", existing.id)
    : admin.from("talent_bookings").insert(payload);
  const { error: saveError } = await query;
  if (saveError) throw new Error(saveError.message);

  revalidateBooking(locale, conversation.id);
}

export async function respondToBookingAction(formData: FormData) {
  const actor = await requireActor("talent");
  const locale = localeFrom(formData);
  const bookingId = numberId(formData, "bookingId");
  const response = text(formData, "response");
  if (!["confirm", "request_changes"].includes(response)) throw new Error("Invalid booking response.");
  const admin = createAdminClient();

  const { data: booking, error } = await admin
    .from("talent_bookings")
    .select("id, conversation_id, talent_id, status")
    .eq("id", bookingId)
    .eq("talent_id", actor.talentId!)
    .maybeSingle();
  if (error || !booking) throw new Error("Booking not found.");
  if (!['proposed','changes_requested'].includes(booking.status)) throw new Error("Booking is not awaiting a response.");

  const now = new Date().toISOString();
  const nextStatus = response === "confirm" ? "confirmed" : "changes_requested";
  const { error: updateError } = await admin
    .from("talent_bookings")
    .update({
      status: nextStatus,
      talent_response_note: text(formData, "responseNote") || null,
      talent_response_at: now,
      confirmed_at: response === "confirm" ? now : null,
      updated_at: now,
    })
    .eq("id", booking.id)
    .eq("status", booking.status);
  if (updateError) throw new Error(updateError.message);

  revalidateBooking(locale, booking.conversation_id);
}

export async function markBookingCompletedAction(formData: FormData) {
  const locale = localeFrom(formData);
  const role = text(formData, "role") as Role;
  if (role !== "publisher" && role !== "talent") throw new Error("Invalid role.");
  const actor = await requireActor(role);
  const bookingId = numberId(formData, "bookingId");
  const admin = createAdminClient();

  let query = admin.from("talent_bookings").select("*").eq("id", bookingId);
  query = role === "publisher" ? query.eq("publisher_id", actor.publisherId!) : query.eq("talent_id", actor.talentId!);
  const { data: booking, error } = await query.maybeSingle();
  if (error || !booking) throw new Error("Booking not found.");
  if (!['confirmed','completed'].includes(booking.status)) throw new Error("Booking must be confirmed first.");

  const now = new Date().toISOString();
  const publisherCompletedAt = role === "publisher" ? now : booking.publisher_completed_at;
  const talentCompletedAt = role === "talent" ? now : booking.talent_completed_at;
  const bothComplete = Boolean(publisherCompletedAt && talentCompletedAt);

  const { error: updateError } = await admin
    .from("talent_bookings")
    .update({
      publisher_completed_at: publisherCompletedAt,
      talent_completed_at: talentCompletedAt,
      status: bothComplete ? "completed" : "confirmed",
      completed_at: bothComplete ? now : null,
      updated_at: now,
    })
    .eq("id", booking.id);
  if (updateError) throw new Error(updateError.message);

  revalidateBooking(locale, booking.conversation_id);
}

export async function submitBookingRatingAction(formData: FormData) {
  const locale = localeFrom(formData);
  const role = text(formData, "role") as Role;
  if (role !== "publisher" && role !== "talent") throw new Error("Invalid role.");
  const actor = await requireActor(role);
  const bookingId = numberId(formData, "bookingId");
  const rating = Number(formData.get("rating"));
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error("Rating must be between 1 and 5.");
  const admin = createAdminClient();

  let query = admin.from("talent_bookings").select("id, conversation_id, publisher_id, talent_id, status").eq("id", bookingId);
  query = role === "publisher" ? query.eq("publisher_id", actor.publisherId!) : query.eq("talent_id", actor.talentId!);
  const { data: booking, error } = await query.maybeSingle();
  if (error || !booking || booking.status !== "completed") throw new Error("Completed booking required.");

  const now = new Date().toISOString();
  const { error: reviewError } = await admin
    .from("talent_booking_reviews")
    .upsert({
      booking_id: booking.id,
      reviewer_user_id: actor.userId,
      reviewer_role: role,
      rating,
      comment: text(formData, "comment") || null,
      updated_at: now,
    }, { onConflict: "booking_id,reviewer_user_id" });
  if (reviewError) throw new Error(reviewError.message);

  revalidateBooking(locale, booking.conversation_id);
}
