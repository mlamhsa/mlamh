"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePublisher } from "@/lib/auth/require-publisher";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function numberOrNull(value: unknown) {
  const raw = cleanText(value);
  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function createSlug(title: string) {
  return `${title
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")}-${Date.now()}`;
}

export async function createOpportunityAction({
  locale = "ar",
  title,
  description,
  city,
  required_gender,
  min_age,
  max_age,
  budget,
  opportunity_type,
}: {
  locale?: string;
  title: string;
  description: string;
  city: string;
  required_gender: string;
  min_age?: string | number | null;
  max_age?: string | number | null;
  budget?: string | number | null;
  opportunity_type?: string | null;
}) {
  const safeLocale = locale === "en" ? "en" : "ar";
  const adminClient = createAdminClient();

  const { publisher } = await requirePublisher(safeLocale);

  const cleanTitle = cleanText(title);
  const cleanDescription = cleanText(description);
  const cleanCity = cleanText(city);
  const cleanGender = cleanText(required_gender);
  const cleanOpportunityType = cleanText(opportunity_type) || "model";
  const cleanBudget = cleanText(budget);

  if (!cleanTitle) {
    throw new Error("Opportunity title is required.");
  }

  if (!cleanDescription) {
    throw new Error("Opportunity description is required.");
  }

  if (!cleanCity) {
    throw new Error("Opportunity city is required.");
  }

  const { error } = await adminClient.from("opportunities").insert({
    publisher_id: publisher.id,
    title: cleanTitle,
    description: cleanDescription,
    slug: createSlug(cleanTitle),
    opportunity_type: cleanOpportunityType,
    city_ar: cleanCity,
    city_en: cleanCity,
    required_gender: cleanGender || null,
    min_age: numberOrNull(min_age),
    max_age: numberOrNull(max_age),
    budget: cleanBudget || null,
    company_name: publisher.company_name ?? publisher.contact_name ?? "Unknown",
    status: "open",
    published: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/${safeLocale}/publisher-dashboard`);
  revalidatePath(`/${safeLocale}/publisher-dashboard/opportunities`);
  revalidatePath(`/${safeLocale}/opportunities`);

  return { success: true };
}