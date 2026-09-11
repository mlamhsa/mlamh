"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

function positiveInt(value: FormDataEntryValue | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function text(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function parseBudgetAmount(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  if (!normalized) return null;
  const parsed = Number(normalized[0]);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

async function createTalentNotification({
  admin, adminUserId, talentId, bookingId, conversationId, opportunityId, title, body,
}: {
  admin: ReturnType<typeof createAdminClient>; adminUserId: string; talentId: number; bookingId: number;
  conversationId: number; opportunityId: number; title: string; body: string;
}) {
  const { data: event, error: eventError } = await admin.from("events").insert({
    event_type: "managed_casting_booking_proposed", target_type: "booking", target_id: String(bookingId), actor_id: adminUserId,
    metadata: { bookingId, conversationId, opportunityId, managed_by: "mlamh" },
  }).select("id").single();
  if (eventError || !event) { console.error("[managed casting booking event]", eventError); return; }
  const { error: notificationError } = await admin.from("notifications").insert({
    event_id: event.id, recipient_type: "talent", recipient_id: String(talentId), title, body, is_read: false,
  });
  if (notificationError) console.error("[managed casting booking notification]", notificationError);
}

function revalidateManaged(projectId: number, conversationId?: number, token?: string | null) {
  revalidatePath(`/admin/casting/${projectId}`); revalidatePath(`/admin/casting/${projectId}/applications`); revalidatePath(`/admin/casting/${projectId}/supply`);
  revalidatePath("/admin/casting"); revalidatePath("/admin/casting/analytics"); revalidatePath("/admin/messages");
  revalidatePath("/ar/talent-dashboard/messages"); revalidatePath("/en/talent-dashboard/messages");
  revalidatePath("/ar/talent-dashboard/notifications"); revalidatePath("/en/talent-dashboard/notifications");
  if (conversationId) {
    revalidatePath(`/admin/messages/${conversationId}`); revalidatePath(`/ar/booking/${conversationId}`); revalidatePath(`/en/booking/${conversationId}`);
  }
  if (token) { revalidatePath(`/ar/casting/status/${token}`); revalidatePath(`/en/casting/status/${token}`); }
}

export async function startManagedTalentConfirmationAction(formData: FormData) {
  const adminUser = await requireAdminAccess();
  const projectId = positiveInt(formData.get("project_id"));
  const shortlistId = positiveInt(formData.get("shortlist_id"));
  if (!projectId || !shortlistId) throw new Error("Invalid managed casting selection.");
  const admin = createAdminClient();
  const { data: project } = await admin.from("casting_projects")
    .select("id,service_mode,client_access_token,client_selection_confirmed_at,work_date,city,currency,budget").eq("id", projectId).maybeSingle();
  if (!project || project.service_mode !== "managed") throw new Error("Managed casting project not found.");
  if (!project.client_selection_confirmed_at) throw new Error("Client selections must be confirmed first.");

  const { data: shortlist } = await admin.from("casting_shortlist").select("id,application_id,casting_role_id,status")
    .eq("id", shortlistId).eq("casting_project_id", projectId).maybeSingle();
  if (!shortlist || shortlist.status !== "selected") throw new Error("Only client-selected talent can enter confirmation.");
  const { data: application } = await admin.from("opportunity_applications").select("id,opportunity_id,talent_id,status").eq("id", shortlist.application_id).maybeSingle();
  if (!application) throw new Error("Application not found.");
  const { data: opportunity } = await admin.from("opportunities")
    .select("id,title,managed_by_mlamh,work_date,work_time,work_duration,city_ar,city_en,compensation_type,budget,currency")
    .eq("id", application.opportunity_id).maybeSingle();
  if (!opportunity?.managed_by_mlamh) throw new Error("This is not a managed casting opportunity.");

  if (shortlist.casting_role_id) {
    const { data: role } = await admin.from("casting_roles").select("id,opportunity_id,status").eq("id", shortlist.casting_role_id).eq("casting_project_id", projectId).maybeSingle();
    if (!role || role.status === "cancelled" || Number(role.opportunity_id) !== Number(application.opportunity_id)) throw new Error("Selection is not linked to this managed casting role.");
  }
  const { data: talent } = await admin.from("talents").select("id,user_id").eq("id", application.talent_id).maybeSingle();
  if (!talent?.user_id) throw new Error("Talent user account not found.");

  const now = new Date().toISOString();
  if (application.status !== "accepted") {
    if (!["pending", "reviewing", "shortlisted"].includes(String(application.status))) throw new Error(`Application cannot be accepted from ${application.status}.`);
    const { error: applicationUpdateError } = await admin.from("opportunity_applications").update({ status: "accepted", updated_at: now }).eq("id", application.id).eq("status", application.status);
    if (applicationUpdateError) throw new Error(applicationUpdateError.message);
    await admin.from("application_status_logs").insert({ application_id: application.id, old_status: application.status, new_status: "accepted", changed_by: adminUser.id, created_at: now });
  }

  let { data: conversation, error: conversationLookupError } = await admin.from("conversations").select("id,conversation_type,admin_user_id,status").eq("application_id", application.id).maybeSingle();
  if (conversationLookupError) throw new Error(conversationLookupError.message);
  if (!conversation) {
    const { data: createdConversation, error: createConversationError } = await admin.from("conversations").insert({
      application_id: application.id, opportunity_id: application.opportunity_id, publisher_id: null, talent_id: application.talent_id,
      admin_user_id: adminUser.id, conversation_type: "mlamh_talent", status: "active", created_at: now, updated_at: now,
    }).select("id,conversation_type,admin_user_id,status").single();
    if (createConversationError || !createdConversation) throw new Error(createConversationError?.message || "Unable to create MLAMH conversation.");
    conversation = createdConversation;
  } else if (conversation.conversation_type !== "mlamh_talent") {
    throw new Error("Application already belongs to a publisher conversation.");
  } else if (conversation.admin_user_id !== adminUser.id) {
    const { error: assignmentError } = await admin.from("conversations").update({ admin_user_id: adminUser.id, status: "active", updated_at: now }).eq("id", conversation.id);
    if (assignmentError) throw new Error(assignmentError.message);
  }

  const compensationType = ["fixed", "negotiable", "unpaid"].includes(String(opportunity.compensation_type)) ? String(opportunity.compensation_type) : "negotiable";
  const compensationAmount = compensationType === "fixed" ? parseBudgetAmount(opportunity.budget ?? project.budget) : null;
  const currency = String(opportunity.currency || project.currency || "SAR").toUpperCase();
  const payload = {
    application_id: application.id, conversation_id: conversation.id, opportunity_id: application.opportunity_id, publisher_id: null,
    admin_user_id: adminUser.id, managed_casting_project_id: projectId, talent_id: application.talent_id, status: "proposed",
    work_date: text(formData.get("work_date")) || opportunity.work_date || project.work_date || null,
    work_time: text(formData.get("work_time")) || opportunity.work_time || null,
    work_duration: text(formData.get("work_duration")) || opportunity.work_duration || null,
    location_text: text(formData.get("location_text")) || opportunity.city_ar || opportunity.city_en || project.city || null,
    compensation_type: compensationType, compensation_amount: compensationAmount, currency, notes: text(formData.get("notes")) || null,
    talent_response_note: null, proposed_by: adminUser.id, proposed_at: now, talent_response_at: null, confirmed_at: null, updated_at: now,
  };
  const { data: existingBooking } = await admin.from("talent_bookings").select("id,status").eq("application_id", application.id).maybeSingle();
  if (existingBooking && ["confirmed", "completed", "cancelled"].includes(existingBooking.status)) { revalidateManaged(projectId, conversation.id, project.client_access_token); return; }
  const saveQuery = existingBooking ? admin.from("talent_bookings").update(payload).eq("id", existingBooking.id).select("id").single() : admin.from("talent_bookings").insert(payload).select("id").single();
  const { data: booking, error: bookingError } = await saveQuery;
  if (bookingError || !booking) throw new Error(bookingError?.message || "Unable to create managed booking.");
  await createTalentNotification({ admin, adminUserId: adminUser.id, talentId: Number(application.talent_id), bookingId: Number(booking.id), conversationId: Number(conversation.id), opportunityId: Number(application.opportunity_id), title: "تم اختيارك لمشروع مُدار بواسطة ملامح", body: "راجع تفاصيل العمل وأكد الحجز أو اطلب تعديل التفاصيل من فريق ملامح." });
  await admin.from("casting_projects").update({ client_status_note: "تم اعتماد الاختيارات وبدأ فريق ملامح مرحلة تأكيد توفر المواهب المختارة.", updated_at: now }).eq("id", projectId);
  revalidateManaged(projectId, conversation.id, project.client_access_token);
}

export async function updateManagedBookingDetailsAction(formData: FormData) {
  const adminUser = await requireAdminAccess();
  const projectId = positiveInt(formData.get("project_id"));
  const bookingId = positiveInt(formData.get("booking_id"));
  if (!projectId || !bookingId) throw new Error("Invalid managed booking.");
  const admin = createAdminClient();
  const { data: booking } = await admin.from("talent_bookings")
    .select("id,conversation_id,opportunity_id,talent_id,status,managed_casting_project_id")
    .eq("id", bookingId).eq("managed_casting_project_id", projectId).maybeSingle();
  if (!booking || !["proposed", "changes_requested"].includes(booking.status)) throw new Error("Booking details can no longer be changed.");

  const workDate = text(formData.get("work_date"));
  const locationText = text(formData.get("location_text"));
  const workTime = text(formData.get("work_time"));
  const workDuration = text(formData.get("work_duration"));
  const compensationType = text(formData.get("compensation_type")) || "negotiable";
  if (!workDate || !locationText) throw new Error("Work date and location are required.");
  if (!["fixed", "negotiable", "unpaid"].includes(compensationType)) throw new Error("Invalid compensation type.");
  const amountRaw = text(formData.get("compensation_amount"));
  const compensationAmount = amountRaw ? Number(amountRaw) : null;
  if (compensationType === "fixed" && (compensationAmount === null || !Number.isFinite(compensationAmount) || compensationAmount < 0)) throw new Error("A valid fixed compensation amount is required.");
  const currency = (text(formData.get("currency")) || "SAR").toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error("Invalid currency.");
  const now = new Date().toISOString();
  const { error } = await admin.from("talent_bookings").update({
    status: "proposed", work_date: workDate, work_time: workTime || null, work_duration: workDuration || null,
    location_text: locationText, compensation_type: compensationType, compensation_amount: compensationType === "fixed" ? compensationAmount : null,
    currency, notes: text(formData.get("notes")) || null, talent_response_note: null, talent_response_at: null, confirmed_at: null,
    proposed_by: adminUser.id, proposed_at: now, admin_user_id: adminUser.id, updated_at: now,
  }).eq("id", booking.id);
  if (error) throw new Error(error.message);
  const { data: project } = await admin.from("casting_projects").select("client_access_token").eq("id", projectId).maybeSingle();
  await createTalentNotification({ admin, adminUserId: adminUser.id, talentId: Number(booking.talent_id), bookingId: Number(booking.id), conversationId: Number(booking.conversation_id), opportunityId: Number(booking.opportunity_id), title: "تم تحديث تفاصيل العمل", body: "راجع التفاصيل المحدثة وأكد الحجز أو اطلب تعديلًا آخر من فريق ملامح." });
  revalidateManaged(projectId, Number(booking.conversation_id), project?.client_access_token);
}

export async function markManagedBookingCompletedAction(formData: FormData) {
  const adminUser = await requireAdminAccess();
  const projectId = positiveInt(formData.get("project_id"));
  const bookingId = positiveInt(formData.get("booking_id"));
  if (!projectId || !bookingId) return;
  const admin = createAdminClient();
  const { data: booking } = await admin.from("talent_bookings").select("id,conversation_id,status,publisher_completed_at,talent_completed_at,admin_user_id,managed_casting_project_id").eq("id", bookingId).eq("managed_casting_project_id", projectId).maybeSingle();
  if (!booking || !["confirmed", "completed"].includes(booking.status)) return;
  const now = new Date().toISOString();
  const publisherCompletedAt = booking.publisher_completed_at || now;
  const bothComplete = Boolean(publisherCompletedAt && booking.talent_completed_at);
  const { error } = await admin.from("talent_bookings").update({ publisher_completed_at: publisherCompletedAt, status: bothComplete ? "completed" : "confirmed", completed_at: bothComplete ? now : null, updated_at: now, admin_user_id: booking.admin_user_id || adminUser.id }).eq("id", booking.id);
  if (error) throw new Error(error.message);
  const { data: project } = await admin.from("casting_projects").select("client_access_token").eq("id", projectId).maybeSingle();
  const { data: remaining } = await admin.from("talent_bookings").select("id,status").eq("managed_casting_project_id", projectId).neq("status", "completed");
  if ((remaining ?? []).length === 0) await admin.from("casting_projects").update({ status: "completed", client_status_note: "اكتمل تنفيذ مشروع الكاستينغ والمواهب المؤكدة. يمكنكم الآن تقييم التجربة والمواهب.", updated_at: now }).eq("id", projectId);
  revalidateManaged(projectId, Number(booking.conversation_id), project?.client_access_token);
}
