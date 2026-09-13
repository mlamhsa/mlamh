"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { createEvent, EVENT_TARGETS, EVENT_TYPES } from "@/lib/events";
import { trackEvent } from "@/lib/events/track-event";
import {
  MARKETING_ATTRIBUTION_COOKIE,
  hasMarketingAttribution,
  parseMarketingAttributionCookie,
} from "@/lib/marketing/attribution/context";
import { trackMarketingEvent } from "@/lib/marketing/events/track";
import { ensureOpportunityConversation } from "@/lib/messages/ensure-opportunity-conversation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ApplyResult = {
  status:
    | "success"
    | "already_applied"
    | "unauthorized"
    | "not_talent"
    | "error";
  message: string;
};

const RESTRICTED_ACCOUNT_STATUSES = new Set([
  "suspended",
  "blocked",
  "banned",
  "disabled",
]);

const MVP_TALENT_ROLES = new Set(["actor", "model"]);

async function recordAttributedApplication({
  userId,
  applicationId,
  opportunityId,
  talentId,
  locale,
}: {
  userId: string;
  applicationId: string | number;
  opportunityId: string | number;
  talentId: string | number;
  locale: "ar" | "en";
}) {
  try {
    const cookieStore = await cookies();
    const attribution = parseMarketingAttributionCookie(
      cookieStore.get(MARKETING_ATTRIBUTION_COOKIE)?.value,
    );

    await trackMarketingEvent({
      eventName: "application_submitted",
      userId,
      source: attribution.source,
      medium: attribution.medium,
      campaign: attribution.campaign,
      content: attribution.content,
      term: attribution.term,
      entityType: "application",
      entityId: String(applicationId),
      metadata: {
        opportunity_id: String(opportunityId),
        talent_id: String(talentId),
        locale,
        attribution_present: hasMarketingAttribution(attribution),
        outcome_verified_server_side: true,
      },
    });
  } catch (error) {
    console.error("[applyToOpportunityAction.marketingAttribution]", error);
  }
}

export async function applyToOpportunityAction(
  _prevState: ApplyResult | null,
  formData: FormData,
): Promise<ApplyResult> {
  const opportunityId = Number(formData.get("opportunity_id"));
  const locale = formData.get("locale") === "en" ? "en" : "ar";

  if (!Number.isInteger(opportunityId) || opportunityId <= 0) {
    return {
      status: "error",
      message: locale === "ar" ? "بيانات الفرصة غير صحيحة." : "Invalid opportunity.",
    };
  }

  const authClient = await createServerSupabaseClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    return {
      status: "unauthorized",
      message: locale === "ar" ? "يرجى تسجيل الدخول أولاً." : "Please login first.",
    };
  }

  await trackEvent({
    type: "application_started",
    target: "opportunity",
    targetId: opportunityId,
    actorId: user.id,
    metadata: { logged_in: true },
  });

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("account_type, status, approval_status, phone")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Apply opportunity profile lookup error:", profileError);
    return {
      status: "error",
      message:
        locale === "ar"
          ? "تعذر التحقق من الحساب. حاول مرة أخرى."
          : "Unable to verify your account. Please try again.",
    };
  }

  if (!profile || profile.account_type !== "talent") {
    return {
      status: "not_talent",
      message:
        locale === "ar"
          ? "يجب إنشاء ملف موهبة قبل التقديم."
          : "Please create your talent profile before applying.",
    };
  }

  if (RESTRICTED_ACCOUNT_STATUSES.has(profile.status ?? "")) {
    return {
      status: "unauthorized",
      message:
        locale === "ar"
          ? "هذا الحساب غير متاح للتقديم حاليًا."
          : "This account is not currently allowed to apply.",
    };
  }

  if (profile.approval_status !== "approved") {
    return {
      status: "unauthorized",
      message:
        locale === "ar"
          ? "يجب اعتماد ملف الموهبة من الإدارة قبل التقديم على الفرص."
          : "Your talent profile must be approved before applying to opportunities.",
    };
  }

  const { data: talent, error: talentError } = await adminClient
    .from("talents")
    .select(`
      id,
      name_ar,
      name_en,
      image_url,
      primary_role,
      category_slug,
      city_slug,
      gender,
      nationality,
      nationality_slug,
      date_of_birth,
      bio_ar,
      bio_en,
      height_cm,
      acting_age_min,
      acting_age_max,
      modeling_types
    `)
    .eq("user_id", user.id)
    .maybeSingle();

  if (talentError) {
    console.error("Apply opportunity talent lookup error:", talentError);
    return {
      status: "error",
      message:
        locale === "ar"
          ? "تعذر التحقق من ملف الموهبة."
          : "Unable to verify your talent profile.",
    };
  }

  if (!talent) {
    return {
      status: "not_talent",
      message:
        locale === "ar"
          ? "يجب إنشاء ملف موهبة قبل التقديم."
          : "Please create your talent profile before applying.",
    };
  }

  const { data: opportunity, error: opportunityError } = await adminClient
    .from("opportunities")
    .select("id, title, slug, status, published, created_at, application_days, opportunity_type, posting_mode, publisher_id")
    .eq("id", opportunityId)
    .maybeSingle();

  if (opportunityError) {
    console.error("Apply opportunity lookup error:", opportunityError);
    return {
      status: "error",
      message:
        locale === "ar"
          ? "تعذر تحميل بيانات الفرصة."
          : "Unable to load the opportunity.",
    };
  }

  const isAvailable =
    opportunity &&
    opportunity.published === true &&
    (opportunity.status === "open" || opportunity.status === "published");

  if (!isAvailable) {
    return {
      status: "error",
      message:
        locale === "ar"
          ? "هذه الفرصة غير متاحة للتقديم حاليًا."
          : "This opportunity is not currently open for applications.",
    };
  }

  const talentRole = String(talent.primary_role ?? talent.category_slug ?? "")
    .trim()
    .toLowerCase();
  const opportunityRole = String(opportunity.opportunity_type ?? "")
    .trim()
    .toLowerCase();

  if (
    MVP_TALENT_ROLES.has(opportunityRole) &&
    talentRole !== opportunityRole
  ) {
    return {
      status: "unauthorized",
      message:
        locale === "ar"
          ? opportunityRole === "actor"
            ? "هذه الفرصة مخصصة للممثلين والممثلات."
            : "هذه الفرصة مخصصة للمودلز."
          : opportunityRole === "actor"
            ? "This opportunity is for actors."
            : "This opportunity is for models.",
    };
  }

  if (opportunity.created_at && opportunity.application_days) {
    const createdAt = new Date(opportunity.created_at);
    const applicationDeadline = new Date(createdAt);
    applicationDeadline.setDate(
      applicationDeadline.getDate() + opportunity.application_days,
    );

    if (
      !Number.isNaN(applicationDeadline.getTime()) &&
      new Date() > applicationDeadline
    ) {
      return {
        status: "error",
        message:
          locale === "ar"
            ? "انتهت مدة استقبال الطلبات لهذه الفرصة."
            : "The application period for this opportunity has ended.",
      };
    }
  }

  const { data: existingApplication, error: existingApplicationError } =
    await adminClient
      .from("opportunity_applications")
      .select("id")
      .eq("opportunity_id", opportunity.id)
      .eq("talent_id", talent.id)
      .maybeSingle();

  if (existingApplicationError) {
    console.error("Existing application lookup error:", existingApplicationError);
    return {
      status: "error",
      message:
        locale === "ar"
          ? "تعذر التحقق من حالة الطلب."
          : "Unable to verify your application status.",
    };
  }

  if (existingApplication) {
    if (opportunity.posting_mode === "quick" && opportunity.publisher_id) {
      try {
        await ensureOpportunityConversation(adminClient, {
          applicationId: existingApplication.id,
          opportunityId: opportunity.id,
          publisherId: opportunity.publisher_id,
          talentId: talent.id,
        });
      } catch (error) {
        console.error("Ensure quick interest conversation error:", error);
      }
    }

    return {
      status: "already_applied",
      message:
        locale === "ar"
          ? opportunity.posting_mode === "quick"
            ? "سبق أن أرسلت اهتمامك بهذا الطلب."
            : "لقد قدمت على هذه الفرصة مسبقًا."
          : opportunity.posting_mode === "quick"
            ? "You have already expressed interest in this request."
            : "You have already applied to this opportunity.",
    };
  }

  const { data: insertedApplication, error: insertError } = await adminClient
    .from("opportunity_applications")
    .insert({
      opportunity_id: opportunity.id,
      talent_id: talent.id,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return {
        status: "already_applied",
        message:
          locale === "ar"
            ? opportunity.posting_mode === "quick"
              ? "سبق أن أرسلت اهتمامك بهذا الطلب."
              : "لقد قدمت على هذه الفرصة مسبقًا."
            : opportunity.posting_mode === "quick"
              ? "You have already expressed interest in this request."
              : "You have already applied to this opportunity.",
      };
    }

    console.error("Apply opportunity insert error:", insertError);
    return {
      status: "error",
      message:
        locale === "ar"
          ? "حدث خطأ أثناء التقديم. حاول مرة أخرى."
          : "Something went wrong while applying. Please try again.",
    };
  }

  let quickConversationId: number | null = null;

  if (opportunity.posting_mode === "quick" && opportunity.publisher_id) {
    try {
      quickConversationId = await ensureOpportunityConversation(adminClient, {
        applicationId: insertedApplication.id,
        opportunityId: opportunity.id,
        publisherId: opportunity.publisher_id,
        talentId: talent.id,
      });
    } catch (error) {
      console.error("Create quick interest conversation error:", error);
      return {
        status: "error",
        message:
          locale === "ar"
            ? "تم تسجيل اهتمامك، لكن تعذر فتح المحادثة الآن. حاول مرة أخرى."
            : "Your interest was saved, but the conversation could not be opened yet. Please try again.",
      };
    }

    await createEvent({
      type: EVENT_TYPES.quick_request_interest,
      target: EVENT_TARGETS.PUBLISHER,
      targetId: opportunity.publisher_id,
      actorId: user.id,
      metadata: {
        locale,
        title: opportunity.title ?? "",
        opportunityId: opportunity.id,
        opportunitySlug: opportunity.slug,
        applicationId: insertedApplication.id,
        talentId: talent.id,
        talent_name:
          locale === "ar"
            ? talent.name_ar || talent.name_en || ""
            : talent.name_en || talent.name_ar || "",
        conversationId: quickConversationId,
      },
    });
  }

  await trackEvent({
    type: "application_submitted",
    target: "application",
    targetId: insertedApplication.id,
    actorId: user.id,
    metadata: {
      opportunity_id: opportunity.id,
      talent_id: talent.id,
      posting_mode: opportunity.posting_mode,
      conversation_id: quickConversationId,
      logged_in: true,
    },
  });

  await recordAttributedApplication({
    userId: user.id,
    applicationId: insertedApplication.id,
    opportunityId: opportunity.id,
    talentId: talent.id,
    locale,
  });

  if (opportunity.slug) {
    revalidatePath(`/${locale}/opportunities/${opportunity.slug}`);
  }

  revalidatePath(`/${locale}/talent-dashboard/applications`);
  revalidatePath(`/${locale}/talent-dashboard/messages`);
  revalidatePath(`/${locale}/publisher-dashboard/messages`);
  revalidatePath(`/${locale}/publisher-dashboard/notifications`);
  revalidatePath(`/${locale}/talent-dashboard`);
  revalidatePath(`/admin/opportunities/${opportunity.id}`);
  revalidatePath("/admin/opportunity-applications");

  return {
    status: "success",
    message:
      locale === "ar"
        ? opportunity.posting_mode === "quick"
          ? "تم إرسال اهتمامك ويمكنك بدء المحادثة الآن."
          : "تم تقديم طلبك بنجاح."
        : opportunity.posting_mode === "quick"
          ? "Your interest was sent and you can start the conversation now."
          : "Your application has been submitted successfully.",
  };
}
