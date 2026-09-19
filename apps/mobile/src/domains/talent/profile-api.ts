import { mobileApiRequest } from "@/src/api/client";
import type { AppLocale } from "@/src/i18n/locale";

export type OwnTalentProfile = {
  id: number;
  slug: string | null;
  displayName: string;
  category: string;
  primaryRole: "actor" | "model" | null;
  city: string | null;
  citySlug: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  nationality: string | null;
  nationalitySlug: string | null;
  imageUrl: string | null;
  gallery: string[];
  bio: string | null;
  skills: string[];
  languages: string[];
  dialects: string[];
  baseCountryCode: string | null;
  profileCompletion: number;
  availabilityStatus: string | null;
  heightCm: number | null;
  weightKg: number | null;
  approvalStatus: string | null;
  profileStatus: string | null;
  published: boolean;
};

export type OwnTalentProfileResponse =
  | { ok: true; item: OwnTalentProfile }
  | { ok: false; code: string };

export type TalentProfileUpdate = {
  displayName?: string;
  bio?: string | null;
  dateOfBirth?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  availabilityStatus?: string | null;
  skills?: string[];
  languages?: string[];
  dialects?: string[];
};

export function getOwnTalentProfile(locale: AppLocale) {
  return mobileApiRequest<OwnTalentProfileResponse>(`/api/talent/me?locale=${locale}`);
}

export function updateOwnTalentProfile(locale: AppLocale, input: TalentProfileUpdate) {
  return mobileApiRequest<{ ok: true; id: number }>(`/api/talent/me?locale=${locale}`, {
    method: "PATCH",
    body: input,
  });
}

export function submitOwnTalentProfileForReview(locale: AppLocale) {
  return mobileApiRequest<{
    ok: true;
    completion: number;
    approvalStatus: "approved" | "pending";
    message: string;
  }>(`/api/talent/me/review?locale=${locale}`, { method: "POST" });
}

export function createTalentGalleryUpload(mimeType: string, size: number) {
  return mobileApiRequest<{ ok: true; bucket: string; path: string; token: string; maxBytes: number }>(
    "/api/talent/me/media",
    { method: "POST", body: { mimeType, size } },
  );
}

export function finalizeTalentGalleryUpload(path: string) {
  return mobileApiRequest<{ ok: true; url: string; gallery: string[] }>("/api/talent/me/media", {
    method: "PUT",
    body: { path },
  });
}

export function setTalentPrimaryImage(url: string) {
  return mobileApiRequest<{ ok: true; url: string }>("/api/talent/me/media", {
    method: "PATCH",
    body: { action: "primary", url },
  });
}

export function deleteTalentGalleryImage(url: string) {
  return mobileApiRequest<{ ok: true; gallery: string[]; primaryUrl: string | null }>(
    "/api/talent/me/media",
    { method: "DELETE", body: { url } },
  );
}
