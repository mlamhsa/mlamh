import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import { isRestrictedAccountStatus } from "@/lib/accounts/account-rules";
import { createEvent, EVENT_TARGETS, EVENT_TYPES } from "@/lib/events";
import { createAdminClient } from "@/lib/supabase/admin";
import { OpportunityService } from "@/lib/services/opportunities/OpportunityService";
import {
  cleanText,
  createSlug,
  localizeOpportunityCity,
  localizeOpportunityType,
  numberOrNull,
} from "@/lib/services/localization";
import { consumeServerRateLimit } from "@/lib/security/server-rate-limit";

const allowedGenders = new Set(["any", "male", "female"]);
const allowedTalentTypes = new Set(["actor", "model"]);
const allowedCompensation = new Set(["fixed", "negotiable", "unpaid"]);

type Payload = {
  locale?: "ar" | "en";
  postingMode?: "quick" | "casting";
  title?: unknown;
  description?: unknown;
  city?: unknown;
  requiredGender?: unknown;
  minAge?: unknown;
  maxAge?: unknown;
  compensationType?: unknown;
  budget?: unknown;
  talentType?: unknown;
  applicationDays?: unknown;
  requiredCount?: unknown;
  workDate?: unknown;
  workTime?: unknown;
  workDuration?: unknown;
};

function fail(code: string, status: number, message: string) {
  return NextResponse.json({ ok: false, code, message }, { status });
}

export async function POST(request: Request) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return fail("UNAUTHENTICATED", 401, "Authentication required.");

  try {
    const rate = await consumeServerRateLimit({
      namespace: "mobile-opportunity-create",
      identifier: auth.user.id,
      limit: 8,
      windowSeconds: 600,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { ok: false, code: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
      );
    }
  } catch (error) {
    console.error("[mobile opportunities create rate-limit]", error);
    return fail("RATE_LIMIT_UNAVAILABLE", 503, "Please try again shortly.");
  }

  let payload: Payload;
  try {
    payload = await request.json();
  } catch {
    return fail("INVALID_BODY", 400, "Invalid request body.");
  }

  const locale = payload.locale === "en" ? "en" : "ar";
  const postingMode = payload.postingMode;
  if (postingMode !== "quick" && postingMode !== "casting") {
    return fail("INVALID_POSTING_MODE", 400, locale === "ar" ? "نوع الفرصة غير صالح." : "Invalid opportunity type.");
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id,account_type,approval_status,status")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (!profile || profile.account_type !== "publisher") {
    return fail("NOT_PUBLISHER", 403, locale === "ar" ? "هذه العملية مخصصة للناشرين." : "Publisher access required.");
  }
  if (profile.approval_status !== "approved") {
    return fail("PUBLISHER_NOT_APPROVED", 403, locale === "ar" ? "يجب اعتماد حساب الناشر قبل إنشاء فرصة." : "Your publisher account must be approved first.");
  }
  if (isRestrictedAccountStatus(profile.status)) {
    return fail("ACCOUNT_RESTRICTED", 403, locale === "ar" ? "الحساب مقيّد حاليًا." : "Your account is currently restricted.");
  }

  const { data: publisher } = await admin
    .from("publishers")
    .select("id,status,company_name,contact_name")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!publisher) return fail("PUBLISHER_NOT_FOUND", 404, "Publisher not found.");
  if (isRestrictedAccountStatus(publisher.status)) {
    return fail("ACCOUNT_RESTRICTED", 403, locale === "ar" ? "الحساب موقوف حاليًا." : "Your publisher account is currently restricted.");
  }

  const title = cleanText(payload.title);
  const description = cleanText(payload.description);
  const city = cleanText(payload.city);
  const requiredGender = cleanText(payload.requiredGender) || "any";
  const talentType = cleanText(payload.talentType);
  const compensationType = cleanText(payload.compensationType) || "negotiable";
  const minAge = numberOrNull(payload.minAge);
  const maxAge = numberOrNull(payload.maxAge);
  const applicationDays = numberOrNull(payload.applicationDays);
  const requiredCount = numberOrNull(payload.requiredCount);
  const workDate = cleanText(payload.workDate) || null;
  const workTime = cleanText(payload.workTime) || null;
  const workDuration = cleanText(payload.workDuration) || null;

  if (title.length < 3 || title.length > 120) return fail("INVALID_TITLE", 400, locale === "ar" ? "عنوان الفرصة يجب أن يكون بين 3 و120 حرفًا." : "Title must be between 3 and 120 characters.");
  if (!description || description.length > 2000) return fail("INVALID_DESCRIPTION", 400, locale === "ar" ? "الوصف مطلوب وبحد أقصى 2000 حرف." : "Description is required and must be at most 2000 characters.");
  if (!allowedGenders.has(requiredGender)) return fail("INVALID_GENDER", 400, locale === "ar" ? "الجنس المطلوب غير صالح." : "Invalid required gender.");
  if (!allowedTalentTypes.has(talentType)) return fail("INVALID_TALENT_TYPE", 400, locale === "ar" ? "اختر ممثل أو مودل." : "Choose Actor or Model.");
  if (!allowedCompensation.has(compensationType)) return fail("INVALID_COMPENSATION", 400, locale === "ar" ? "نوع المقابل غير صالح." : "Invalid compensation type.");
  if (minAge !== null && (!Number.isInteger(minAge) || minAge < 0 || minAge > 100)) return fail("INVALID_AGE", 400, locale === "ar" ? "العمر غير صالح." : "Invalid age.");
  if (maxAge !== null && (!Number.isInteger(maxAge) || maxAge < 0 || maxAge > 100)) return fail("INVALID_AGE", 400, locale === "ar" ? "العمر غير صالح." : "Invalid age.");
  if (minAge !== null && maxAge !== null && minAge > maxAge) return fail("INVALID_AGE_RANGE", 400, locale === "ar" ? "الحد الأدنى للعمر أكبر من الحد الأقصى." : "Minimum age cannot exceed maximum age.");
  if (applicationDays === null || !Number.isInteger(applicationDays) || applicationDays < 1 || applicationDays > 90) return fail("INVALID_APPLICATION_DAYS", 400, locale === "ar" ? "مدة استقبال الطلبات يجب أن تكون بين 1 و90 يومًا." : "Application period must be between 1 and 90 days.");
  if (requiredCount !== null && (!Number.isInteger(requiredCount) || requiredCount < 1 || requiredCount > 1000)) return fail("INVALID_REQUIRED_COUNT", 400, locale === "ar" ? "العدد المطلوب يجب أن يكون بين 1 و1000." : "Required count must be between 1 and 1000.");
  if (workDate && !/^\d{4}-\d{2}-\d{2}$/.test(workDate)) return fail("INVALID_WORK_DATE", 400, locale === "ar" ? "تاريخ العمل غير صالح." : "Invalid work date.");
  if (workTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(workTime)) return fail("INVALID_WORK_TIME", 400, locale === "ar" ? "وقت العمل غير صالح." : "Invalid work time.");
  if (workDuration && workDuration.length > 120) return fail("INVALID_WORK_DURATION", 400, locale === "ar" ? "مدة العمل طويلة جدًا." : "Work duration is too long.");

  let budget: string | null = null;
  if (compensationType === "fixed") {
    const rawBudget = cleanText(payload.budget).replace(/,/g, "");
    if (!rawBudget || !/^\d+$/.test(rawBudget)) return fail("INVALID_BUDGET", 400, locale === "ar" ? "أدخل ميزانية صحيحة بالأرقام." : "Enter a valid numeric budget.");
    budget = rawBudget;
  }

  const localizedCity = localizeOpportunityCity(city);
  if (!localizedCity.city_ar || !localizedCity.city_en) return fail("INVALID_CITY", 400, locale === "ar" ? "اختر مدينة صحيحة." : "Choose a valid city.");
  const localizedType = localizeOpportunityType(talentType);
  if (!localizedType.value) return fail("INVALID_TALENT_TYPE", 400, locale === "ar" ? "نوع الموهبة غير صالح." : "Invalid talent type.");

  const companyName = publisher.company_name?.trim() || publisher.contact_name?.trim() || (locale === "ar" ? "ناشر على ملامح" : "MLAMH Publisher");

  try {
    const opportunity = await OpportunityService.create({
      publisher_id: publisher.id,
      posting_mode: postingMode === "quick" ? "quick" : "project",
      title,
      description,
      slug: createSlug(title),
      opportunity_type: localizedType.value,
      city_ar: localizedCity.city_ar,
      city_en: localizedCity.city_en,
      required_gender: requiredGender,
      min_age: minAge,
      max_age: maxAge,
      compensation_type: compensationType as "fixed" | "negotiable" | "unpaid",
      budget,
      application_days: applicationDays,
      company_name: companyName,
      required_count: requiredCount,
      work_date: workDate,
      work_time: workTime,
      work_duration: workDuration,
      role_requirements: {},
    });

    try {
      await createEvent({
        type: EVENT_TYPES.opportunity_pending_review,
        target: EVENT_TARGETS.ADMIN,
        targetId: "admin",
        actorId: publisher.id,
        metadata: { opportunityId: opportunity.id, publisherId: publisher.id, postingMode, title },
      });
    } catch (eventError) {
      console.error("[mobile opportunity review event]", eventError);
    }

    return NextResponse.json({
      ok: true,
      opportunityId: opportunity.id,
      status: "pending_review",
      postingMode,
      message: locale === "ar" ? "تم إرسال الفرصة للمراجعة وستُنشر بعد اعتمادها." : "Your opportunity was submitted for review and will be published after approval.",
    }, { status: 201 });
  } catch (error) {
    console.error("[mobile opportunity create]", error);
    return fail("CREATE_FAILED", 500, locale === "ar" ? "تعذر إنشاء الفرصة. حاول مرة أخرى." : "Unable to create the opportunity. Try again.");
  }
}
