"use server";

import { revalidatePath } from "next/cache";

import { requirePublisher } from "@/lib/auth/require-publisher";
import {
  createEvent,
  EVENT_TARGETS,
  EVENT_TYPES,
} from "@/lib/events";
import { OpportunityService } from "@/lib/services/opportunities/OpportunityService";
import {
  cleanText,
  createSlug,
  localizeOpportunityCity,
  localizeOpportunityType,
  numberOrNull,
} from "@/lib/services/localization";

const allowedGenders = ["any", "male", "female"] as const;

type AllowedGender = (typeof allowedGenders)[number];
type SupportedLocale = "ar" | "en";

type CreateOpportunityPayload = {
  locale?: string;
  title: string;
  description: string;
  city: string;
  required_gender: string;
  min_age?: string | number | null;
  max_age?: string | number | null;
  budget?: string | number | null;
  opportunity_type?: string | null;
  application_days?: string | number | null;
};

function getLocalizedMessage(
  locale: SupportedLocale,
  messages: {
    ar: string;
    en: string;
  },
) {
  return messages[locale];
}

function isValidAge(value: number | null) {
  return (
    value === null ||
    (Number.isInteger(value) && value >= 0 && value <= 100)
  );
}

function normalizeBudget(
  value: unknown,
  locale: SupportedLocale,
) {
  const cleaned = cleanText(value).replace(/,/g, "");

  if (!cleaned) {
    return null;
  }

  if (!/^\d+$/.test(cleaned)) {
    throw new Error(
      getLocalizedMessage(locale, {
        ar: "يجب أن تحتوي الميزانية على أرقام فقط.",
        en: "Budget must contain numbers only.",
      }),
    );
  }

  return cleaned;
}

export async function createOpportunityAction(
  payload: CreateOpportunityPayload,
) {
  const {
    locale = "ar",
    title,
    description,
    city,
    required_gender,
    min_age,
    max_age,
    budget,
    opportunity_type,
    application_days,
  } = payload;

  const safeLocale: SupportedLocale =
    locale === "en" ? "en" : "ar";

  const { publisher } =
    await requirePublisher(safeLocale);

  const cleanTitle = cleanText(title);
  const cleanDescription = cleanText(description);
  const cleanGender = cleanText(required_gender);
  const cleanOpportunityType =
    cleanText(opportunity_type);

  const minAge = numberOrNull(min_age);
  const maxAge = numberOrNull(max_age);
  const applicationDays =
    numberOrNull(application_days);

  const normalizedBudget = normalizeBudget(
    budget,
    safeLocale,
  );

  if (
    cleanTitle.length < 3 ||
    cleanTitle.length > 120
  ) {
    throw new Error(
      getLocalizedMessage(safeLocale, {
        ar: "يجب أن يتراوح عنوان الفرصة بين 3 و120 حرفًا.",
        en: "Opportunity title must contain between 3 and 120 characters.",
      }),
    );
  }

  if (
    cleanDescription.length < 20 ||
    cleanDescription.length > 3000
  ) {
    throw new Error(
      getLocalizedMessage(safeLocale, {
        ar: "يجب أن يتراوح وصف الفرصة بين 20 و3000 حرف.",
        en: "Opportunity description must contain between 20 and 3000 characters.",
      }),
    );
  }

  if (
    cleanGender &&
    !allowedGenders.includes(
      cleanGender as AllowedGender,
    )
  ) {
    throw new Error(
      getLocalizedMessage(safeLocale, {
        ar: "قيمة الجنس المطلوب غير صالحة.",
        en: "Invalid required gender.",
      }),
    );
  }

  if (!isValidAge(minAge) || !isValidAge(maxAge)) {
    throw new Error(
      getLocalizedMessage(safeLocale, {
        ar: "يجب أن يكون العمر رقمًا صحيحًا بين 0 و100.",
        en: "Age must be a whole number between 0 and 100.",
      }),
    );
  }

  if (
    minAge !== null &&
    maxAge !== null &&
    minAge > maxAge
  ) {
    throw new Error(
      getLocalizedMessage(safeLocale, {
        ar: "لا يمكن أن يكون الحد الأدنى للعمر أكبر من الحد الأقصى.",
        en: "Minimum age cannot be greater than maximum age.",
      }),
    );
  }

  if (!cleanOpportunityType) {
    throw new Error(
      getLocalizedMessage(safeLocale, {
        ar: "نوع الفرصة مطلوب.",
        en: "Opportunity type is required.",
      }),
    );
  }

  if (
    applicationDays === null ||
    !Number.isInteger(applicationDays) ||
    applicationDays < 1 ||
    applicationDays > 90
  ) {
    throw new Error(
      getLocalizedMessage(safeLocale, {
        ar: "يجب أن تكون مدة استقبال الطلبات بين يوم واحد و90 يومًا.",
        en: "The application period must be between 1 and 90 days.",
      }),
    );
  }

  const localizedType =
    localizeOpportunityType(cleanOpportunityType);

  if (!localizedType.value) {
    throw new Error(
      getLocalizedMessage(safeLocale, {
        ar: "نوع الفرصة غير صالح.",
        en: "Invalid opportunity type.",
      }),
    );
  }

  const localizedCity =
    localizeOpportunityCity(cleanText(city));

  if (
    !localizedCity.city_ar ||
    !localizedCity.city_en
  ) {
    throw new Error(
      getLocalizedMessage(safeLocale, {
        ar: "مدينة الفرصة مطلوبة.",
        en: "Opportunity city is required.",
      }),
    );
  }


  const opportunity =
    await OpportunityService.create({
      publisher_id: publisher.id,

      title: cleanTitle,
      description: cleanDescription,
      slug: createSlug(cleanTitle),

      opportunity_type: localizedType.value,

      city_ar: localizedCity.city_ar,
      city_en: localizedCity.city_en,

      required_gender: cleanGender || "any",

      min_age: minAge,
      max_age: maxAge,
      budget: normalizedBudget,

      application_days: applicationDays,

      company_name:
        publisher.company_name ??
        publisher.contact_name ??
        "Unknown",
    });

  try {
    await createEvent({
      type: EVENT_TYPES.opportunity_pending_review,
      target: EVENT_TARGETS.ADMIN,
      targetId: "admin",
      actorId: publisher.id,
      metadata: {
        opportunityId: opportunity.id,
        publisherId: publisher.id,
        title: cleanTitle,
        city_ar: localizedCity.city_ar,
        city_en: localizedCity.city_en,
        opportunityType: localizedType.value,
        applicationDays,
      },
    });
  } catch (eventError) {
    console.error(
      "Failed to create opportunity review event:",
      eventError,
    );
  }

  revalidatePath(
    `/${safeLocale}/publisher-dashboard`,
  );

  revalidatePath(
    `/${safeLocale}/publisher-dashboard/opportunities`,
  );

  revalidatePath(
    `/${safeLocale}/opportunities`,
  );

  revalidatePath("/admin/opportunities");

  return {
    success: true,
    opportunityId: opportunity.id,
    status: "pending_review",
    message:
      safeLocale === "ar"
        ? "تم إرسال الفرصة إلى فريق ملامح للمراجعة، وستُنشر بعد اعتمادها."
        : "Your opportunity has been submitted for review and will be published after approval.",
  };
}