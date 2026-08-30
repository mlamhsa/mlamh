"use server";

import { revalidatePath } from "next/cache";

import { requireMarketingAdminAccess } from "@/lib/auth/require-marketing-admin";
import { trackMarketingEvent } from "@/lib/marketing/events/track";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createMarketingLeadAction(formData: FormData) {
  await requireMarketingAdminAccess("marketing.manage");
  const organization = String(formData.get("organization") ?? "").trim();
  if (!organization) throw new Error("Organization is required.");

  const db = createAdminClient();
  const contactName = String(formData.get("contact_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  let contactId: number | null = null;

  if (contactName || email || phone) {
    const { data: contact, error: contactError } = await db.from("marketing_contacts").insert({
      organization_name: organization,
      contact_name: contactName || null,
      email: email || null,
      phone: phone || null,
      website: String(formData.get("website") ?? "").trim() || null,
      city: String(formData.get("city") ?? "").trim() || null,
    }).select("id").single();
    if (contactError) throw new Error(`[create contact] ${contactError.message}`);
    contactId = contact.id;
  }

  const scoreRaw = Number(formData.get("lead_score"));
  const leadScore = Number.isFinite(scoreRaw) ? Math.max(0, Math.min(100, Math.round(scoreRaw))) : null;
  const { data: lead, error } = await db.from("marketing_leads").insert({
    organization,
    contact_id: contactId,
    source: String(formData.get("source") ?? "").trim() || null,
    channel: String(formData.get("channel") ?? "").trim() || null,
    owner: String(formData.get("owner") ?? "").trim() || "nora",
    stage: "new",
    lead_score: leadScore,
    demand_signal: String(formData.get("demand_signal") ?? "").trim() || null,
    opportunity_type: String(formData.get("opportunity_type") ?? "").trim() || null,
    city: String(formData.get("city") ?? "").trim() || null,
    tags: String(formData.get("tags") ?? "").split(",").map((value) => value.trim()).filter(Boolean),
    notes: String(formData.get("notes") ?? "").trim() || null,
  }).select("id").single();
  if (error) throw new Error(`[create lead] ${error.message}`);

  await trackMarketingEvent({ eventName: "lead_created", source: String(formData.get("source") ?? "").trim() || "admin", entityType: "marketing_lead", entityId: String(lead.id), metadata: { organization } });
  revalidatePath("/admin/marketing/leads");
  revalidatePath("/admin/marketing");
}
