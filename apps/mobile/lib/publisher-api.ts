import type { AppLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";

function requireApiBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (!configured) throw new Error("Missing EXPO_PUBLIC_API_BASE_URL for this mobile environment.");
  let parsed: URL;
  try { parsed = new URL(configured); } catch { throw new Error("Invalid EXPO_PUBLIC_API_BASE_URL for this mobile environment."); }
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && ["localhost", "127.0.0.1"].includes(parsed.hostname))) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL must use HTTPS except for localhost development.");
  }
  return configured.replace(/\/$/, "");
}

const API_BASE_URL = requireApiBaseUrl();

async function readJson<T>(response: Response): Promise<T | null> {
  let text = "";
  try { text = await response.text(); } catch { return null; }
  if (!text.trim()) return null;
  try { return JSON.parse(text) as T; } catch { return null; }
}

export type MobilePublisherOpportunity = {
  id: number;
  title: string;
  status: string | null;
  published: boolean;
  countryCode: string | null;
  createdAt: string | null;
  applications: number;
  accepted: number;
};

export type MobilePublisherDashboard = {
  publisher: {
    id: number;
    name: string;
    city: string | null;
    countryCode: string | null;
    verified: boolean;
    verificationStatus: string | null;
    approvalStatus: string | null;
    status: string | null;
    imageUrl: string | null;
  };
  metrics: { opportunities: number; published: number; applications: number; accepted: number };
  opportunities: MobilePublisherOpportunity[];
};

export type OpportunityRoleRequirements = {
  languages?: string[];
  dialects?: string[];
  modelingTypes?: string[];
  minHeightCm?: number | null;
  hairColor?: string | null;
};

export type CreateOpportunityDraftInput = {
  title: string;
  description: string;
  opportunityType: "actor" | "model";
  city?: string;
  compensationType: "fixed" | "negotiable" | "unpaid";
  budget?: string;
  countryCode?: string;
  currency?: string;
  requiredGender?: "male" | "female" | "any";
  minAge?: number | null;
  maxAge?: number | null;
  requiredCount?: number | null;
  workDate?: string | null;
  workDuration?: "1_hour" | "2_hours" | "4_hours" | "full_day" | null;
  applicationStartDate?: string | null;
  applicationDeadline?: string | null;
  roleRequirements?: OpportunityRoleRequirements;
};

export type CreateOpportunityDraftResult =
  | { ok: true; item: { id: number; title: string; status: string | null; published: boolean; countryCode: string | null; createdAt: string | null } }
  | { ok: false; code: string };

export type MobileConversation = {
  id: number;
  opportunityId: number;
  opportunityTitle: string | null;
  partyName: string;
  partyImageUrl: string | null;
  status: string | null;
  latestMessage: string | null;
  lastActivityAt: string | null;
  unreadCount: number;
};

export type ConversationsResponse = { items: MobileConversation[]; unreadCount: number };

export type PublisherApplicant = {
  applicationId: number;
  talentId: number;
  talentSlug: string | null;
  name: string;
  imageUrl: string | null;
  category: string | null;
  city: string | null;
  status: string;
  createdAt: string | null;
  conversationId: number | null;
};

export type PublisherOpportunityDetail = {
  opportunity: {
    id: number;
    title: string;
    description: string;
    opportunityType: string;
    city: string | null;
    countryCode: string | null;
    currency: string | null;
    budget: string | null;
    compensationType: string | null;
    requiredGender?: string | null;
    minAge?: number | null;
    maxAge?: number | null;
    requiredCount?: number | null;
    workDate?: string | null;
    workDuration?: string | null;
    applicationStartDate?: string | null;
    applicationDeadline?: string | null;
    roleRequirements?: Record<string, unknown>;
    status: string | null;
    published: boolean;
    createdAt: string | null;
  };
  applicants: PublisherApplicant[];
};

export type PublisherApplicantStatusResult =
  | { ok: true; status: string; conversationId: number | null }
  | { ok: false; code: string };

export type PublisherOpportunityAction = "edit" | "publish" | "close" | "archive";
export type PublisherOpportunityManageInput = {
  action: PublisherOpportunityAction;
  title?: string;
  description?: string;
  opportunityType?: "actor" | "model";
  city?: string;
  compensationType?: "fixed" | "negotiable" | "unpaid";
  budget?: string;
  countryCode?: string;
  currency?: string;
  requiredGender?: "male" | "female" | "any";
  minAge?: number | null;
  maxAge?: number | null;
  requiredCount?: number | null;
  workDate?: string | null;
  workDuration?: "1_hour" | "2_hours" | "4_hours" | "full_day" | null;
  applicationStartDate?: string | null;
  applicationDeadline?: string | null;
  roleRequirements?: OpportunityRoleRequirements;
};
export type PublisherOpportunityManageResult =
  | { ok: true; item: { id: number; status: string | null; published: boolean } }
  | { ok: false; code: string };

export type MobilePublisherProfile = {
  id: number;
  companyName: string | null;
  contactName: string | null;
  publisherType: string | null;
  city: string | null;
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  tiktokUrl: string | null;
  linkedinUrl: string | null;
  profileImageUrl: string | null;
  coverImageUrl: string | null;
  approvalStatus: string;
  verified: boolean;
  verificationStatus: string | null;
  verificationMethod: string | null;
  verificationEmail: string | null;
  verificationDocumentUrl: string | null;
  verificationSubmittedAt: string | null;
  verificationReviewedAt: string | null;
  verificationRejectionReason: string | null;
  countryCode: string | null;
  isIndividual: boolean;
  reviewReady: boolean;
  required: { key: string; complete: boolean }[];
};

export type PublisherProfileInput = {
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

type PublisherProfileResponse = { ok: true; item: MobilePublisherProfile } | { ok: false; code: string; missing?: string[] };
export type PublisherVerificationResult =
  | { ok: true; verificationStatus: "pending"; method: "company_email"; email: string }
  | { ok: false; code: string };

async function accessToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export async function getPublisherDashboard(locale: AppLocale): Promise<MobilePublisherDashboard | null> {
  const token = await accessToken();
  if (!token) return null;
  try {
    const response = await fetch(`${API_BASE_URL}/api/publisher/me?locale=${locale}`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;
    return await readJson<MobilePublisherDashboard>(response);
  } catch { return null; }
}

export async function createPublisherOpportunityDraft(input: CreateOpportunityDraftInput): Promise<CreateOpportunityDraftResult> {
  const token = await accessToken();
  if (!token) return { ok: false, code: "UNAUTHENTICATED" };
  try {
    const response = await fetch(`${API_BASE_URL}/api/publisher/opportunities`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(input),
    });
    return (await readJson<CreateOpportunityDraftResult>(response)) ?? { ok: false, code: response.ok ? "INVALID_RESPONSE" : "REQUEST_FAILED" };
  } catch { return { ok: false, code: "REQUEST_FAILED" }; }
}

export async function getPublisherConversations(): Promise<ConversationsResponse | null> {
  const token = await accessToken();
  if (!token) return null;
  try {
    const response = await fetch(`${API_BASE_URL}/api/conversations`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;
    return await readJson<ConversationsResponse>(response);
  } catch { return null; }
}

export async function getPublisherOpportunity(opportunityId: number, locale: AppLocale): Promise<PublisherOpportunityDetail | null> {
  const token = await accessToken();
  if (!token) return null;
  try {
    const response = await fetch(`${API_BASE_URL}/api/publisher/opportunities/${opportunityId}?locale=${locale}`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;
    const payload = await readJson<{ ok?: boolean; opportunity?: PublisherOpportunityDetail["opportunity"]; applicants?: PublisherApplicant[] }>(response);
    if (!payload?.ok || !payload.opportunity || !Array.isArray(payload.applicants)) return null;
    return { opportunity: payload.opportunity, applicants: payload.applicants };
  } catch { return null; }
}

export async function updatePublisherApplicantStatus(opportunityId: number, applicationId: number, status: "accepted" | "rejected" | "shortlisted"): Promise<PublisherApplicantStatusResult> {
  const token = await accessToken();
  if (!token) return { ok: false, code: "UNAUTHENTICATED" };
  try {
    const response = await fetch(`${API_BASE_URL}/api/publisher/opportunities/${opportunityId}`, {
      method: "PATCH",
      headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ applicationId, status }),
    });
    return (await readJson<PublisherApplicantStatusResult>(response)) ?? { ok: false, code: response.ok ? "INVALID_RESPONSE" : "REQUEST_FAILED" };
  } catch { return { ok: false, code: "REQUEST_FAILED" }; }
}

export async function managePublisherOpportunity(opportunityId: number, input: PublisherOpportunityManageInput): Promise<PublisherOpportunityManageResult> {
  const token = await accessToken();
  if (!token) return { ok: false, code: "UNAUTHENTICATED" };
  try {
    const response = await fetch(`${API_BASE_URL}/api/publisher/opportunities/${opportunityId}`, {
      method: "PATCH",
      headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(input),
    });
    return (await readJson<PublisherOpportunityManageResult>(response)) ?? { ok: false, code: response.ok ? "INVALID_RESPONSE" : "REQUEST_FAILED" };
  } catch { return { ok: false, code: "REQUEST_FAILED" }; }
}

export async function getPublisherProfile(): Promise<PublisherProfileResponse> {
  const token = await accessToken();
  if (!token) return { ok: false, code: "UNAUTHENTICATED" };
  try {
    const response = await fetch(`${API_BASE_URL}/api/publisher/profile`, { headers: { Accept: "application/json", Authorization: `Bearer ${token}` } });
    return (await readJson<PublisherProfileResponse>(response)) ?? { ok: false, code: response.ok ? "INVALID_RESPONSE" : "REQUEST_FAILED" };
  } catch { return { ok: false, code: "REQUEST_FAILED" }; }
}

export async function updatePublisherProfile(input: PublisherProfileInput): Promise<PublisherProfileResponse> {
  const token = await accessToken();
  if (!token) return { ok: false, code: "UNAUTHENTICATED" };
  try {
    const response = await fetch(`${API_BASE_URL}/api/publisher/profile`, {
      method: "PATCH",
      headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(input),
    });
    return (await readJson<PublisherProfileResponse>(response)) ?? { ok: false, code: response.ok ? "INVALID_RESPONSE" : "REQUEST_FAILED" };
  } catch { return { ok: false, code: "REQUEST_FAILED" }; }
}

export async function submitPublisherProfileForReview(): Promise<{ ok: true; approvalStatus: string } | { ok: false; code: string; missing?: string[] }> {
  const token = await accessToken();
  if (!token) return { ok: false, code: "UNAUTHENTICATED" };
  try {
    const response = await fetch(`${API_BASE_URL}/api/publisher/profile`, { method: "POST", headers: { Accept: "application/json", Authorization: `Bearer ${token}` } });
    return (await readJson<{ ok: true; approvalStatus: string } | { ok: false; code: string; missing?: string[] }>(response)) ?? { ok: false, code: response.ok ? "INVALID_RESPONSE" : "REQUEST_FAILED" };
  } catch { return { ok: false, code: "REQUEST_FAILED" }; }
}

export async function uploadPublisherLogoBuffer(buffer: ArrayBuffer, contentType = "image/jpeg"): Promise<{ ok: true; url: string } | { ok: false; code: string }> {
  const token = await accessToken();
  if (!token) return { ok: false, code: "UNAUTHENTICATED" };
  try {
    const response = await fetch(`${API_BASE_URL}/api/publisher/profile`, {
      method: "PUT",
      headers: { Accept: "application/json", "Content-Type": contentType, Authorization: `Bearer ${token}` },
      body: buffer,
    });
    return (await readJson<{ ok: true; url: string } | { ok: false; code: string }>(response)) ?? { ok: false, code: response.ok ? "INVALID_RESPONSE" : "REQUEST_FAILED" };
  } catch { return { ok: false, code: "REQUEST_FAILED" }; }
}

export async function submitPublisherVerificationEmail(email: string): Promise<PublisherVerificationResult> {
  const token = await accessToken();
  if (!token) return { ok: false, code: "UNAUTHENTICATED" };
  try {
    const response = await fetch(`${API_BASE_URL}/api/publisher/verification`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ method: "company_email", email }),
    });
    return (await readJson<PublisherVerificationResult>(response)) ?? { ok: false, code: response.ok ? "INVALID_RESPONSE" : "REQUEST_FAILED" };
  } catch { return { ok: false, code: "REQUEST_FAILED" }; }
}
