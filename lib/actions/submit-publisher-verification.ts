"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePublisher } from "@/lib/auth/require-publisher";
import { createAdminClient } from "@/lib/supabase/admin";

type SupportedLocale = "ar" | "en";

type VerificationMethod =
  | "company_email"
  | "official_document"
  | "business_card";

const ALLOWED_METHODS = new Set<VerificationMethod>([
  "company_email",
  "official_document",
  "business_card",
]);

function getLocale(formData: FormData): SupportedLocale {
  return formData.get("locale") === "en"
    ? "en"
    : "ar";
}

function getText(
  formData: FormData,
  key: string,
) {
  const value = formData.get(key);

  return typeof value === "string"
    ? value.trim()
    : "";
}

function getMethod(
  formData: FormData,
): VerificationMethod {
  const method = getText(
    formData,
    "verification_method",
  ) as VerificationMethod;

  if (!ALLOWED_METHODS.has(method)) {
    throw new Error(
      "Invalid verification method.",
    );
  }

  return method;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value,
  );
}

export async function submitPublisherVerificationAction(
  formData: FormData,
): Promise<void> {
  const locale = getLocale(formData);

  const { publisher } =
    await requirePublisher(locale);

  if (
    publisher.publisher_type === "individual"
  ) {
    redirect(
      `/${locale}/publisher-dashboard/profile`,
    );
  }

  if (
    publisher.verification_status === "verified"
  ) {
    redirect(
      `/${locale}/publisher-dashboard/verification`,
    );
  }

  if (
    publisher.verification_status === "pending"
  ) {
    redirect(
      `/${locale}/publisher-dashboard/verification`,
    );
  }

  const method = getMethod(formData);

  const verificationEmail =
    getText(
      formData,
      "verification_email",
    );

  const verificationDocumentUrl =
    getText(
      formData,
      "verification_document_url",
    );

  if (method === "company_email") {
    if (
      !verificationEmail ||
      !isValidEmail(verificationEmail)
    ) {
      throw new Error(
        locale === "ar"
          ? "أدخل بريدًا إلكترونيًا رسميًا صالحًا للجهة."
          : "Enter a valid official organization email address.",
      );
    }

    const emailDomain =
      verificationEmail
        .split("@")[1]
        ?.toLowerCase();

    const blockedDomains = new Set([
      "gmail.com",
      "hotmail.com",
      "outlook.com",
      "yahoo.com",
      "icloud.com",
      "live.com",
      "proton.me",
      "protonmail.com",
    ]);

    if (
      !emailDomain ||
      blockedDomains.has(emailDomain)
    ) {
      throw new Error(
        locale === "ar"
          ? "يجب استخدام بريد رسمي على نطاق الجهة، وليس بريدًا شخصيًا عامًا."
          : "Use an official organization-domain email, not a public personal email provider.",
      );
    }
  }

  if (
    method === "official_document" ||
    method === "business_card"
  ) {
    if (!verificationDocumentUrl) {
      throw new Error(
        locale === "ar"
          ? "يجب إرفاق ملف الإثبات قبل إرسال طلب التوثيق."
          : "You must attach proof before submitting the verification request.",
      );
    }
  }

  const adminClient =
    createAdminClient();

  const {
    data: updatedPublisher,
    error: updateError,
  } = await adminClient
    .from("publishers")
    .update({
      verified: false,
      verification_status: "pending",
      verification_method: method,
    
      verification_email:
        method === "company_email"
          ? verificationEmail
          : null,
    
      verification_document_url:
        method === "official_document" ||
        method === "business_card"
          ? verificationDocumentUrl
          : null,
    
      verification_submitted_at:
        new Date().toISOString(),
    
      verification_rejection_reason: null,
      verification_reviewed_by: null,
      verification_reviewed_at: null,
    })
    .eq("id", publisher.id)
    .select("id")
    .maybeSingle();

  if (
    updateError ||
    !updatedPublisher
  ) {
    throw new Error(
      locale === "ar"
        ? "تعذر إرسال طلب التوثيق. حاول مرة أخرى."
        : "Unable to submit the verification request. Please try again.",
    );
  }

  revalidatePath(
    `/${locale}/publisher-dashboard`,
  );

  revalidatePath(
    `/${locale}/publisher-dashboard/profile`,
  );

  revalidatePath(
    `/${locale}/publisher-dashboard/verification`,
  );

  revalidatePath(
    "/admin/publishers",
  );

  redirect(
    `/${locale}/publisher-dashboard/verification`,
  );
}