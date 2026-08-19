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
const allowedOpportunityTypes = ["actor", "model"] as const;

type AllowedGender = (typeof allowedGenders)[number];
type AllowedOpportunityType =
  (typeof allowedOpportunityTypes)[number];

type SupportedLocale = "ar" | "en";

type CreateOpportunityPayload = {
  locale?: string;
  posting_mode?: "quick" | "project";
  title: string;
  description: string;
  city: string;
  required_gender: string;

  min_age?: string | number | null;
  max_age?: string | number | null;

  budget?: string | number | null;
  compensation_type?: "fixed" | "negotiable" | "unpaid" | null;
  opportunity_type?: string | null;

  application_days?: string | number | null;

  required_count?: string | number | null;
work_date?: string | null;
work_time?: string | null;
work_duration?: string | null;

role_requirements?: Record<string, unknown> | null;
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
    (
      Number.isInteger(value) &&
      value >= 0 &&
      value <= 100
    )
  );
}

function normalizeBudget(
  value: unknown,
  locale: SupportedLocale,
) {
  const cleaned =
    cleanText(value).replace(/,/g, "");

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

function normalizeWorkDate(
  value: unknown,
  locale: SupportedLocale,
) {
  const cleaned = cleanText(value);

  if (!cleaned) {
    return null;
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(cleaned)
  ) {
    throw new Error(
      getLocalizedMessage(locale, {
        ar: "تاريخ العمل غير صالح.",
        en: "Invalid work date.",
      }),
    );
  }

  const parsedDate = new Date(
    `${cleaned}T00:00:00Z`,
  );

  if (
    Number.isNaN(parsedDate.getTime())
  ) {
    throw new Error(
      getLocalizedMessage(locale, {
        ar: "تاريخ العمل غير صالح.",
        en: "Invalid work date.",
      }),
    );
  }

  return cleaned;
}

function normalizeRoleRequirements(
  value: unknown,
) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  return value as Record<
    string,
    unknown
  >;
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
    compensation_type,
    budget,
    opportunity_type,
    application_days,
    required_count,
work_date,
work_time,
work_duration,
role_requirements,
  } = payload;

  const safeLocale: SupportedLocale =
    locale === "en" ? "en" : "ar";

    const postingMode =
  payload.posting_mode === "quick"
    ? "quick"
    : "project";
    
    const { profile, publisher } =
    await requirePublisher(
      safeLocale,
    );
  
  const approvalStatus =
    profile.approval_status ??
    "not_submitted";
  
  const isApproved =
    approvalStatus === "approved";
  
  const isSuspended =
    publisher.status === "suspended";
  
  if (!isApproved) {
    throw new Error(
      getLocalizedMessage(
        safeLocale,
        {
          ar: "يجب اعتماد حساب الناشر من الإدارة قبل إنشاء الفرص.",
          en: "Your publisher account must be approved before creating opportunities.",
        },
      ),
    );
  }
  
  if (isSuspended) {
    throw new Error(
      getLocalizedMessage(
        safeLocale,
        {
          ar: "حساب الناشر موقوف حاليًا ولا يمكنه إنشاء فرص جديدة.",
          en: "Your publisher account is currently suspended and cannot create new opportunities.",
        },
      ),
    );
  }

  const cleanTitle =
    cleanText(title);

  const cleanDescription =
    cleanText(description);

  const cleanGender =
    cleanText(required_gender);

  const cleanOpportunityType =
    cleanText(
      opportunity_type,
    );

  const minAge =
    numberOrNull(min_age);

  const maxAge =
    numberOrNull(max_age);

  const applicationDays =
    numberOrNull(
      application_days,
    );

  const requiredCount =
    numberOrNull(
      required_count,
    );

    const normalizedCompensationType =
  compensation_type === "negotiable" ||
  compensation_type === "unpaid"
    ? compensation_type
    : "fixed";

  const normalizedBudget =
    normalizeBudget(
      budget,
      safeLocale,
    );

  const normalizedWorkDate =
    normalizeWorkDate(
      work_date,
      safeLocale,
    );

    const cleanWorkTime =
  cleanText(
    work_time,
  );

  const cleanWorkDuration =
    cleanText(
      work_duration,
    );
if (
  cleanWorkTime &&
  !/^([01]\d|2[0-3]):[0-5]\d$/.test(
    cleanWorkTime,
  )
) {
  throw new Error(
    getLocalizedMessage(
      safeLocale,
      {
        ar: "وقت العمل غير صالح.",
        en: "Invalid work time.",
      },
    ),
  );
}
  const normalizedRoleRequirements =
    normalizeRoleRequirements(
      role_requirements,
    );

  if (
    cleanTitle.length < 3 ||
    cleanTitle.length > 120
  ) {
    throw new Error(
      getLocalizedMessage(
        safeLocale,
        {
          ar: "يجب أن يتراوح عنوان الفرصة بين 3 و120 حرفًا.",
          en: "Opportunity title must contain between 3 and 120 characters.",
        },
      ),
    );
  }

  if (!cleanDescription) {
    throw new Error(
      getLocalizedMessage(
        safeLocale,
        {
          ar: "وصف الفرصة مطلوب.",
          en: "Opportunity description is required.",
        },
      ),
    );
  }
  
  if (cleanDescription.length > 2000) {
    throw new Error(
      getLocalizedMessage(
        safeLocale,
        {
          ar: "يجب ألا يتجاوز وصف الفرصة 2000 حرف.",
          en: "Opportunity description must not exceed 2000 characters.",
        },
      ),
    );
  }

  if (
    cleanGender &&
    !allowedGenders.includes(
      cleanGender as AllowedGender,
    )
  ) {
    throw new Error(
      getLocalizedMessage(
        safeLocale,
        {
          ar: "قيمة الجنس المطلوب غير صالحة.",
          en: "Invalid required gender.",
        },
      ),
    );
  }

  if (
    !isValidAge(minAge) ||
    !isValidAge(maxAge)
  ) {
    throw new Error(
      getLocalizedMessage(
        safeLocale,
        {
          ar: "يجب أن يكون العمر رقمًا صحيحًا بين 0 و100.",
          en: "Age must be a whole number between 0 and 100.",
        },
      ),
    );
  }

  if (
    minAge !== null &&
    maxAge !== null &&
    minAge > maxAge
  ) {
    throw new Error(
      getLocalizedMessage(
        safeLocale,
        {
          ar: "لا يمكن أن يكون الحد الأدنى للعمر أكبر من الحد الأقصى.",
          en: "Minimum age cannot be greater than maximum age.",
        },
      ),
    );
  }

  if (!cleanOpportunityType) {
    throw new Error(
      getLocalizedMessage(
        safeLocale,
        {
          ar: "نوع الموهبة المطلوبة إلزامي.",
          en: "Required talent type is required.",
        },
      ),
    );
  }

  if (
    !allowedOpportunityTypes.includes(
      cleanOpportunityType as AllowedOpportunityType,
    )
  ) {
    throw new Error(
      getLocalizedMessage(
        safeLocale,
        {
          ar: "نوع الموهبة المطلوبة غير صالح. المتاح حاليًا: ممثل أو مودل.",
          en: "Invalid talent type. Currently supported: Actor or Model.",
        },
      ),
    );
  }

  if (
    applicationDays === null ||
    !Number.isInteger(
      applicationDays,
    ) ||
    applicationDays < 1 ||
    applicationDays > 90
  ) {
    throw new Error(
      getLocalizedMessage(
        safeLocale,
        {
          ar: "يجب أن تكون مدة استقبال الطلبات بين يوم واحد و90 يومًا.",
          en: "The application period must be between 1 and 90 days.",
        },
      ),
    );
  }

  if (
    requiredCount !== null &&
    (
      !Number.isInteger(
        requiredCount,
      ) ||
      requiredCount < 1 ||
      requiredCount > 1000
    )
  ) {
    throw new Error(
      getLocalizedMessage(
        safeLocale,
        {
          ar: "عدد الأشخاص المطلوبين يجب أن يكون بين 1 و1000.",
          en: "Required talent count must be between 1 and 1000.",
        },
      ),
    );
  }

  if (
    cleanWorkDuration.length >
    120
  ) {
    throw new Error(
      getLocalizedMessage(
        safeLocale,
        {
          ar: "مدة العمل طويلة جدًا.",
          en: "Work duration is too long.",
        },
      ),
    );
  }

  const localizedType =
    localizeOpportunityType(
      cleanOpportunityType,
    );

  if (!localizedType.value) {
    throw new Error(
      getLocalizedMessage(
        safeLocale,
        {
          ar: "نوع الفرصة غير صالح.",
          en: "Invalid opportunity type.",
        },
      ),
    );
  }

  const localizedCity =
    localizeOpportunityCity(
      cleanText(city),
    );

  if (
    !localizedCity.city_ar ||
    !localizedCity.city_en
  ) {
    throw new Error(
      getLocalizedMessage(
        safeLocale,
        {
          ar: "مدينة الفرصة مطلوبة.",
          en: "Opportunity city is required.",
        },
      ),
    );
  }

  const opportunity =
  await OpportunityService.create({
    publisher_id: publisher.id,
    posting_mode: postingMode,
  
    title: cleanTitle,
description: cleanDescription,
slug: createSlug(
  cleanTitle,
),

      opportunity_type:
        localizedType.value,

      city_ar:
        localizedCity.city_ar,

      city_en:
        localizedCity.city_en,

      required_gender:
        cleanGender || "any",

      min_age:
        minAge,

      max_age:
        maxAge,
        compensation_type:
        normalizedCompensationType,
      
      budget:
        normalizedCompensationType === "fixed"
          ? normalizedBudget
          : null,

      application_days:
        applicationDays,

      required_count:
        requiredCount,

        work_date:
        normalizedWorkDate,
      
      work_time:
        cleanWorkTime ||
        null,
      
      work_duration:
        cleanWorkDuration ||
        null,

      role_requirements:
        normalizedRoleRequirements,

        company_name:
        publisher.company_name?.trim() ||
        (safeLocale === "ar"
          ? "جهة ناشرة"
          : "Publisher"),
    });

  try {
    await createEvent({
      type:
        EVENT_TYPES
          .opportunity_pending_review,

      target:
        EVENT_TARGETS.ADMIN,

      targetId:
        "admin",

      actorId:
        publisher.id,

      metadata: {
        opportunityId:
          opportunity.id,

        publisherId:
          publisher.id,

        title:
          cleanTitle,

        city_ar:
          localizedCity.city_ar,

        city_en:
          localizedCity.city_en,

        opportunityType:
          localizedType.value,

        applicationDays,

        requiredCount,

        workDate:
  normalizedWorkDate,

workTime:
  cleanWorkTime ||
  null,

workDuration:
  cleanWorkDuration ||
  null,
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

  revalidatePath(
    "/admin/opportunities",
  );

  return {
    success: true,

    opportunityId:
      opportunity.id,

    status:
      "pending_review",

    message:
      safeLocale === "ar"
        ? "تم إرسال الفرصة إلى فريق ملامح للمراجعة، وستُنشر بعد اعتمادها."
        : "Your opportunity has been submitted for review and will be published after approval.",
  };
}