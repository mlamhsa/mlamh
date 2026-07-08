"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const allowedStatuses = ["draft", "open", "published", "closed", "archived"];

type UpdateOpportunityPayload = {
  id: number;
  locale: string;
  title: string;
  description: string;
  city_ar: string;
  city_en: string;
  required_gender?: string | null;
  opportunity_type: string;
  status: string;
  min_age?: number | null;
  max_age?: number | null;
  budget?: string | null;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_");
}

export async function updateOpportunityAction(payload: UpdateOpportunityPayload) {
  const authClient = await createServerSupabaseClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthorized.");
  }

  const locale = payload.locale === "en" ? "en" : "ar";
  const opportunityId = Number(payload.id);

  if (!Number.isFinite(opportunityId)) {
    throw new Error("Opportunity ID is required.");
  }

  const title = cleanText(payload.title);
  const description = cleanText(payload.description);
  const cityAr = cleanText(payload.city_ar);
  const cityEn = cleanText(payload.city_en);
  const gender = cleanText(payload.required_gender);
  const opportunityType = cleanText(payload.opportunity_type);
  const status = cleanText(payload.status) || "draft";
  const minAge = payload.min_age ?? null;
  const maxAge = payload.max_age ?? null;
  const budget = cleanText(payload.budget);

  if (!title) throw new Error("Title is required.");
  if (!description) throw new Error("Description is required.");
  if (!cityAr || !cityEn) throw new Error("City is required.");
  if (!opportunityType) throw new Error("Opportunity type is required.");

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid opportunity status.");
  }

  if (minAge !== null && maxAge !== null && minAge > maxAge) {
    throw new Error("Minimum age cannot be greater than maximum age.");
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error("Profile not found.");
  }

  const { data: publisher, error: publisherError } = await adminClient
    .from("publishers")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (publisherError || !publisher) {
    throw new Error("Publisher account not found.");
  }

  const { data: opportunity, error: opportunityError } = await adminClient
    .from("opportunities")
    .select("id, publisher_id")
    .eq("id", opportunityId)
    .eq("publisher_id", publisher.id)
    .maybeSingle();

  if (opportunityError || !opportunity) {
    throw new Error("Opportunity not found or access denied.");
  }

  const citySlug = createSlug(cityEn || cityAr);

  const { data: updatedOpportunity, error: updateError } = await adminClient
    .from("opportunities")
    .update({
      title,
      description,
      city_slug: citySlug,
      city_ar: cityAr,
      city_en: cityEn,
      required_gender: gender || null,
      opportunity_type: opportunityType,
      min_age: minAge,
      max_age: maxAge,
      budget: budget || null,
      status,
      published: status === "published" || status === "open",
      updated_at: new Date().toISOString(),
    })
    .eq("id", opportunity.id)
    .eq("publisher_id", publisher.id)
    .select("id")
    .single();

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath(`/${locale}/publisher-dashboard`);
  revalidatePath(`/${locale}/publisher-dashboard/opportunities`);
  revalidatePath(`/${locale}/publisher-dashboard/opportunities/${opportunity.id}`);
  revalidatePath(`/${locale}/publisher-dashboard/opportunities/${opportunity.id}/edit`);
  revalidatePath(`/${locale}/opportunities`);

  return {
    success: true,
    opportunity: updatedOpportunity,
  };
}