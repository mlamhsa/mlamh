import { isRestrictedAccountStatus } from "@/lib/accounts/account-rules";
import { normalizeOrganizationVerificationEmail } from "@/lib/publishers/verification-rules";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "publisher-assets";
const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const IMAGE_EXTENSIONS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const ALLOWED_PUBLISHER_TYPES = new Set([
  "production_company",
  "advertising_agency",
  "casting_agency",
  "talent_agency",
  "brand",
  "content_company",
  "individual",
  "other",
]);

type PublisherProfileInput = {
  companyName?: string | null;
  contactName?: string | null;
  publisherType?: string | null;
  city?: string | null;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  instagram?: string | null;
  tiktokUrl?: string | null;
  linkedinUrl?: string | null;
};

function clean(value: unknown, max: number) {
  if (value == null) return null;
  if (typeof value !== "string") throw new Error("INVALID_INPUT");
  const normalized = value.trim();
  if (normalized.length > max) throw new Error("INVALID_INPUT");
  return normalized || null;
}

async function resolvePublisher(userId: string) {
  const supabase = createAdminClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,account_type,approval_status,status,display_name,phone")
    .eq("user_id", userId)
    .maybeSingle();
  if (profileError) return { ok: false as const, code: "PROFILE_LOOKUP_FAILED" as const };
  if (!profile || profile.account_type !== "publisher") return { ok: false as const, code: "NOT_PUBLISHER" as const };
  if (isRestrictedAccountStatus(profile.status)) return { ok: false as const, code: "ACCOUNT_RESTRICTED" as const };

  const { data: publisher, error: publisherError } = await supabase
    .from("publishers")
    .select("id,company_name,contact_name,publisher_type,city,description,phone,email,website,instagram,tiktok_url,linkedin_url,profile_image_url,cover_image_url,verified,verification_status,verification_method,verification_email,verification_document_url,verification_submitted_at,verification_reviewed_at,verification_rejection_reason,status,country_code")
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (publisherError) return { ok: false as const, code: "PUBLISHER_LOOKUP_FAILED" as const };
  if (!publisher) return { ok: false as const, code: "PUBLISHER_NOT_FOUND" as const };
  if (isRestrictedAccountStatus(publisher.status)) return { ok: false as const, code: "ACCOUNT_RESTRICTED" as const };
  return { ok: true as const, supabase, profile, publisher };
}

export async function getMobilePublisherProfile(userId: string) {
  const resolved = await resolvePublisher(userId);
  if (!resolved.ok) return resolved;
  const { profile, publisher } = resolved;
  const isIndividual = publisher.publisher_type === "individual";
  const required = [
    { key: "company_name", complete: isIndividual || Boolean(publisher.company_name?.trim()) },
    { key: "contact_name", complete: Boolean(publisher.contact_name?.trim()) },
    { key: "publisher_type", complete: Boolean(publisher.publisher_type?.trim()) },
    { key: "city", complete: Boolean(publisher.city?.trim()) },
    { key: "profile_image_url", complete: isIndividual || Boolean(publisher.profile_image_url?.trim()) },
  ];
  return {
    ok: true as const,
    item: {
      id: Number(publisher.id),
      companyName: publisher.company_name ?? null,
      contactName: publisher.contact_name ?? profile.display_name ?? null,
      publisherType: publisher.publisher_type ?? null,
      city: publisher.city ?? null,
      description: publisher.description ?? null,
      phone: publisher.phone ?? profile.phone ?? null,
      email: publisher.email ?? null,
      website: publisher.website ?? null,
      instagram: publisher.instagram ?? null,
      tiktokUrl: publisher.tiktok_url ?? null,
      linkedinUrl: publisher.linkedin_url ?? null,
      profileImageUrl: publisher.profile_image_url ?? null,
      coverImageUrl: publisher.cover_image_url ?? null,
      approvalStatus: profile.approval_status ?? "not_submitted",
      verified: Boolean(publisher.verified),
      verificationStatus: publisher.verification_status ?? null,
      verificationMethod: publisher.verification_method ?? null,
      verificationEmail: publisher.verification_email ?? null,
      verificationDocumentUrl: publisher.verification_document_url ?? null,
      verificationSubmittedAt: publisher.verification_submitted_at ?? null,
      verificationReviewedAt: publisher.verification_reviewed_at ?? null,
      verificationRejectionReason: publisher.verification_rejection_reason ?? null,
      countryCode: publisher.country_code ?? null,
      isIndividual,
      reviewReady: required.every((entry) => entry.complete),
      required,
    },
  };
}

export async function updateMobilePublisherProfile(userId: string, input: PublisherProfileInput) {
  const resolved = await resolvePublisher(userId);
  if (!resolved.ok) return resolved;
  const { supabase, profile, publisher } = resolved;

  const publisherType = clean(input.publisherType, 64);
  if (!publisherType || !ALLOWED_PUBLISHER_TYPES.has(publisherType)) return { ok: false as const, code: "INVALID_PUBLISHER_TYPE" as const };
  if (!publisher.publisher_type || publisherType !== publisher.publisher_type) return { ok: false as const, code: "PUBLISHER_TYPE_LOCKED" as const };
  const companyName = clean(input.companyName, 160);
  const contactName = clean(input.contactName, 120);
  const phone = clean(input.phone, 40);
  const isIndividual = publisherType === "individual";

  const update = {
    company_name: companyName,
    contact_name: contactName,
    city: clean(input.city, 120),
    description: clean(input.description, 2000),
    phone,
    email: clean(input.email, 254),
    website: clean(input.website, 500),
    instagram: clean(input.instagram, 500),
    tiktok_url: clean(input.tiktokUrl, 500),
    linkedin_url: clean(input.linkedinUrl, 500),
  };

  const { error: profileUpdateError } = await supabase.from("profiles").update({
    display_name: isIndividual ? contactName : companyName,
    phone,
    updated_at: new Date().toISOString(),
  }).eq("id", profile.id).eq("user_id", userId);
  if (profileUpdateError) return { ok: false as const, code: "PROFILE_UPDATE_FAILED" as const };

  const { error: publisherUpdateError } = await supabase.from("publishers").update(update).eq("id", publisher.id).eq("profile_id", profile.id);
  if (publisherUpdateError) return { ok: false as const, code: "PUBLISHER_UPDATE_FAILED" as const };
  return getMobilePublisherProfile(userId);
}

export async function submitMobilePublisherProfileForReview(userId: string) {
  const resolved = await resolvePublisher(userId);
  if (!resolved.ok) return resolved;
  const current = await getMobilePublisherProfile(userId);
  if (!current.ok) return current;
  const missing = current.item.required.filter((entry) => !entry.complete).map((entry) => entry.key);
  if (missing.length) return { ok: false as const, code: "PROFILE_INCOMPLETE" as const, missing };

  const { error } = await resolved.supabase.from("profiles").update({
    approval_status: "pending",
    updated_at: new Date().toISOString(),
  }).eq("id", resolved.profile.id).eq("user_id", userId);
  if (error) return { ok: false as const, code: "SUBMIT_FAILED" as const };
  return { ok: true as const, approvalStatus: "pending" as const };
}

export async function submitMobilePublisherVerification(userId: string, input: { method?: unknown; email?: unknown }) {
  const resolved = await resolvePublisher(userId);
  if (!resolved.ok) return resolved;
  const { supabase, profile, publisher } = resolved;
  if (publisher.publisher_type === "individual") return { ok: false as const, code: "INDIVIDUAL_NOT_ELIGIBLE" as const };
  if (profile.approval_status !== "approved") return { ok: false as const, code: "PROFILE_NOT_APPROVED" as const };
  if (publisher.verification_status === "verified" || publisher.verified === true) return { ok: false as const, code: "ALREADY_VERIFIED" as const };
  if (publisher.verification_status === "pending") return { ok: false as const, code: "VERIFICATION_PENDING" as const };
  if (input.method !== "company_email") return { ok: false as const, code: "METHOD_NOT_AVAILABLE" as const };
  const email = normalizeOrganizationVerificationEmail(input.email);
  if (!email) return { ok: false as const, code: "INVALID_COMPANY_EMAIL" as const };

  const { error } = await supabase.from("publishers").update({
    verified: false,
    verification_status: "pending",
    verification_method: "company_email",
    verification_email: email,
    verification_document_url: null,
    verification_submitted_at: new Date().toISOString(),
    verification_rejection_reason: null,
    verification_reviewed_by: null,
    verification_reviewed_at: null,
  }).eq("id", publisher.id).eq("profile_id", profile.id);
  if (error) return { ok: false as const, code: "VERIFICATION_SUBMIT_FAILED" as const };
  return { ok: true as const, verificationStatus: "pending" as const, method: "company_email" as const, email };
}

export async function uploadMobilePublisherLogo(userId: string, bytes: ArrayBuffer, contentType: string) {
  const resolved = await resolvePublisher(userId);
  if (!resolved.ok) return resolved;
  if (!ALLOWED_IMAGE_TYPES.has(contentType) || bytes.byteLength <= 0 || bytes.byteLength > MAX_PROFILE_IMAGE_SIZE) {
    return { ok: false as const, code: "INVALID_IMAGE" as const };
  }
  const extension = IMAGE_EXTENSIONS[contentType];
  const filePath = `publishers/${resolved.publisher.id}/profile-${Date.now()}.${extension}`;
  const buffer = Buffer.from(bytes);
  const { error: uploadError } = await resolved.supabase.storage.from(BUCKET).upload(filePath, buffer, { contentType, upsert: false });
  if (uploadError) return { ok: false as const, code: "UPLOAD_FAILED" as const };
  const { data } = resolved.supabase.storage.from(BUCKET).getPublicUrl(filePath);
  const { error: updateError } = await resolved.supabase.from("publishers").update({ profile_image_url: data.publicUrl }).eq("id", resolved.publisher.id).eq("profile_id", resolved.profile.id);
  if (updateError) return { ok: false as const, code: "IMAGE_UPDATE_FAILED" as const };
  return { ok: true as const, url: data.publicUrl };
}
