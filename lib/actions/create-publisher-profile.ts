"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isValidLocale, type Locale } from "@/lib/i18n";

const ALLOWED_PUBLISHER_TYPES = new Set([
  "individual",
  "salon",
  "store",
  "agency",
  "production_company",
  "brand",
  "photographer",
  "marketer",
  "other",
]);

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function requiredStringValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);

  if (!value) {
    throw new Error(`${key} is required.`);
  }

  return value;
}

export async function createPublisherProfileAction(
  formData: FormData
) {
  const localeValue = stringValue(formData, "locale");

  const locale: Locale = isValidLocale(localeValue)
    ? localeValue
    : "ar";

  const authClient = await createServerSupabaseClient();

  /*
   * المستخدم تم تسجيله مسبقًا في خطوة إنشاء الحساب.
   * هنا نقرأ المستخدم الحالي ولا ننشئ Auth User جديدًا.
   */
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    redirect(`/${locale}/join`);
  }

  const userId = user.id;
  const adminClient = createAdminClient();

  const contactName = requiredStringValue(
    formData,
    "contact_name"
  );

  const publisherType = requiredStringValue(
    formData,
    "publisher_type"
  );

  if (!ALLOWED_PUBLISHER_TYPES.has(publisherType)) {
    throw new Error("Invalid publisher type.");
  }

  const publisherTypeOther = stringValue(
    formData,
    "publisher_type_other"
  );

  if (publisherType === "other" && !publisherTypeOther) {
    throw new Error(
      "Please describe your publisher type."
    );
  }

  const companyName = stringValue(formData, "company_name");
  const phone = stringValue(formData, "phone");

  const displayName = companyName || contactName;

  /*
   * نبحث عن Profile موجود للمستخدم الحالي.
   */
  const {
    data: existingProfile,
    error: existingProfileError,
  } = await adminClient
    .from("profiles")
    .select("id, account_type")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingProfileError) {
    throw new Error(
      `[createPublisherProfileAction.profileFetch] ${existingProfileError.message}`
    );
  }

  /*
   * إذا كان الحساب مرتبطًا بنوع آخر، نحافظ على السلوك الحالي
   * ونرسله إلى لوحة الحساب المرتبطة به.
   */
  if (
    existingProfile &&
    existingProfile.account_type !== "publisher"
  ) {
    redirect(
      existingProfile.account_type === "admin"
        ? "/admin"
        : `/${locale}/talent-dashboard`
    );
  }

  let profileId = existingProfile?.id;

  /*
   * إذا كان Profile من نوع Publisher موجودًا، نتأكد من وجود
   * سجل Publisher المرتبط به قبل التحويل إلى لوحة التحكم.
   */
  if (profileId) {
    const {
      data: existingPublisher,
      error: existingPublisherError,
    } = await adminClient
      .from("publishers")
      .select("id")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (existingPublisherError) {
      throw new Error(
        `[createPublisherProfileAction.publisherFetch] ${existingPublisherError.message}`
      );
    }

    if (existingPublisher) {
      redirect(`/${locale}/publisher-dashboard`);
    }

    /*
     * تحديث بيانات Profile الحالي بدل إنشاء سجل مكرر.
     */
    const { error: profileUpdateError } =
      await adminClient
        .from("profiles")
        .update({
          account_type: "publisher",
          display_name: displayName,
          phone: phone || null,
        })
        .eq("id", profileId)
        .eq("user_id", userId);

    if (profileUpdateError) {
      throw new Error(
        `[createPublisherProfileAction.profileUpdate] ${profileUpdateError.message}`
      );
    }
  } else {
    /*
     * إنشاء Profile فقط عندما لا يوجد Profile للمستخدم.
     */
    const { data: profile, error: profileError } =
      await adminClient
        .from("profiles")
        .insert({
          user_id: userId,
          account_type: "publisher",
          display_name: displayName,
          phone: phone || null,
        })
        .select("id")
        .single();

    if (profileError || !profile) {
      throw new Error(
        `[createPublisherProfileAction.profile] ${
          profileError?.message ||
          "Failed to create profile."
        }`
      );
    }

    profileId = profile.id;
  }

  /*
   * في هذه المرحلة يوجد Profile صالح، لكن لا يوجد Publisher
   * مرتبط به، لذلك ننشئ سجل Publisher فقط.
   */
  const { error: publisherError } = await adminClient
    .from("publishers")
    .insert({
      profile_id: profileId,
      publisher_type: publisherType,
      publisher_type_other:
        publisherType === "other"
          ? publisherTypeOther
          : null,
      company_name: companyName || null,
      contact_name: contactName,
      city: stringValue(formData, "city") || null,
      website: stringValue(formData, "website") || null,
      instagram:
        stringValue(formData, "instagram") || null,
    });

  if (publisherError) {
    throw new Error(
      `[createPublisherProfileAction.publisher] ${publisherError.message}`
    );
  }

  redirect(`/${locale}/publisher-dashboard`);
}