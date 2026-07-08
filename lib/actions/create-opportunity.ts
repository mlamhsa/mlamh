"use server";

import { revalidatePath } from "next/cache";
import { requirePublisher } from "@/lib/auth/require-publisher";
import { createEvent, EVENT_TARGETS, EVENT_TYPES } from "@/lib/events";
import { OpportunityService } from "@/lib/services/opportunities/OpportunityService";
import {
  cleanText,
  createSlug,
  localizeOpportunityCity,
  localizeOpportunityType,
  numberOrNull,
} from "@/lib/services/localization";

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

  const { publisher } = await requirePublisher(safeLocale);

  const cleanTitle = cleanText(title);
  const cleanDescription = cleanText(description);
  const cleanGender = cleanText(required_gender);
  const cleanBudget = cleanText(budget);

  const localizedCity = localizeOpportunityCity(cleanText(city));
  const localizedType = localizeOpportunityType(
    cleanText(opportunity_type) || "model"
  );

  if (!cleanTitle) {
    throw new Error("Opportunity title is required.");
  }

  if (!cleanDescription) {
    throw new Error("Opportunity description is required.");
  }

  if (!localizedCity.city_ar || !localizedCity.city_en) {
    throw new Error("Opportunity city is required.");
  }

  await OpportunityService.create({
    publisher_id: publisher.id,

    title: cleanTitle,
    description: cleanDescription,
    slug: createSlug(cleanTitle),

    opportunity_type: localizedType.value,

    city_ar: localizedCity.city_ar,
    city_en: localizedCity.city_en,

    required_gender: cleanGender || null,
    min_age: numberOrNull(min_age),
    max_age: numberOrNull(max_age),
    budget: cleanBudget || null,

    company_name:
      publisher.company_name ?? publisher.contact_name ?? "Unknown",
  });

  await createEvent({
    type: EVENT_TYPES.opportunity_pending_review,
    target: EVENT_TARGETS.ADMIN,
    targetId: "admin",
    actorId: publisher.id,
    metadata: {
      publisherId: publisher.id,
      title: cleanTitle,
      city_ar: localizedCity.city_ar,
      city_en: localizedCity.city_en,
      opportunityType: localizedType.value,
    },
  });

  revalidatePath(`/${safeLocale}/publisher-dashboard`);
  revalidatePath(`/${safeLocale}/publisher-dashboard/opportunities`);
  revalidatePath(`/${safeLocale}/opportunities`);
  revalidatePath("/admin/opportunities");

  return {
    success: true,
    status: "pending_review",
    message:
      safeLocale === "ar"
        ? "تم إرسال الفرصة إلى فريق ملامح للمراجعة، وستُنشر بعد اعتمادها."
        : "Your opportunity has been submitted for review and will be published after approval.",
  };
}