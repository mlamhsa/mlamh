import type { AppLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";

export type MobileOpportunity = {
  id: number; title: string; slug: string; description: string; opportunityType: string; countryCode: string | null; currency: string | null; citySlug: string | null; city: string | null; requiredGender: string | null; minAge: number | null; maxAge: number | null; requiredCount: number | null; workDate: string | null; workDuration: string | null; applicationStartDate: string | null; applicationDeadline: string | null; roleRequirements: Record<string, unknown>; compensationType: "fixed" | "negotiable" | "unpaid" | null; budget: string | null; companyName: string; featured: boolean; managedByMlamh: boolean; expiresAt: string | null; createdAt: string;
};
export type MobileApplicationStatus = "pending" | "reviewing" | "shortlisted" | "accepted" | "rejected";
export type MobileApplicationItem = { id: number | string; status: MobileApplicationStatus; createdAt: string | null; opportunity: { id: number | string; title: string | null; slug: string | null; city: string | null; countryCode: string | null; opportunityType: string | null; status: string | null; createdAt: string | null } | null; conversationId: string | null };
export type MobileConversation = { id: number; opportunityId: number; opportunityTitle: string | null; partyName: string; partyImageUrl: string | null; status: string | null; latestMessage: string | null; lastActivityAt: string | null; unreadCount: number };
export type ConversationsResponse = { items: MobileConversation[]; unreadCount: number };
export type MobileMessage = { id: number | string; conversationId: number; senderUserId: string; body: string; readAt: string | null; createdAt: string; isMine: boolean };
export type ConversationDetailResponse = { conversation: { id: number; opportunityId: number; opportunityTitle: string | null; partyName: string; status: string }; messages: MobileMessage[] };
export type MobileNotificationTarget = { type: "conversation"; id: string | number } | { type: "opportunity"; id: string | number } | { type: "publisher_opportunity"; id: string | number } | { type: "talent_applications" } | { type: "none" };
export type MobileNotification = { id: number | string; title: string; body: string | null; isRead: boolean; createdAt: string | null; category: "application" | "message" | "invitation" | "system"; referenceId: string | number | null; eventType: string | null; target: MobileNotificationTarget };
export type MobileTalentProfile = {
  id: number; slug: string | null; displayName: string; category: string; primaryRole: "actor" | "model" | null; city: string | null; citySlug: string | null; gender: string | null; dateOfBirth: string | null; nationality: string | null; nationalitySlug: string | null; imageUrl: string | null; gallery: string[]; bio: string | null; skills: string[]; languages: string[]; dialects: string[]; baseCountryCode: string | null; profileCompletion: number; availabilityStatus: string | null; heightCm: number | null; weightKg: number | null; eyeColor: string | null; hairColor: string | null; hairType: string | null; skinColor: string | null; clothingSize: string | null; shoeSize: number | null; actingAgeMin: number | null; actingAgeMax: number | null; modelingTypes: string[]; experienceYears: number | null; readyToTravel: boolean; hasPassport: boolean; hasCar: boolean; workOutsideCity: boolean; workOutsideCountry: boolean; verified: boolean; approvalStatus: string | null; profileStatus: string | null; published: boolean;
};
export type MobileTalentProfileUpdateInput = {
  primaryRole?: "actor" | "model" | null; displayName?: string; bio?: string; skills?: string[]; citySlug?: string | null; gender?: string | null; dateOfBirth?: string | null; nationalitySlug?: string | null; heightCm?: number | null; availabilityStatus?: string | null; languages?: string[]; dialects?: string[]; weightKg?: number | null; eyeColor?: string | null; hairColor?: string | null; hairType?: string | null; skinColor?: string | null; clothingSize?: string | null; shoeSize?: number | null; actingAgeMin?: number | null; actingAgeMax?: number | null; modelingTypes?: string[]; experienceYears?: number | null; readyToTravel?: boolean; hasPassport?: boolean; hasCar?: boolean; workOutsideCity?: boolean; workOutsideCountry?: boolean;
};

type OpportunitiesResponse = { items: MobileOpportunity[]; market: string; locale: AppLocale };
type OpportunityDetailResponse = { item: MobileOpportunity; market: string; locale: AppLocale };
export type ApplicationsResponse = { ok: true; items: MobileApplicationItem[]; counts: Record<MobileApplicationStatus | "total", number> } | { ok: false; code: string };
export type NotificationsResponse = { items: MobileNotification[]; unreadCount: number };
export type ApplyResult = { ok: true; code: "SUCCESS"; applicationId: number | string; opportunityId: number; opportunitySlug: string | null } | { ok: false; code: string; details?: Record<string, unknown> };
export type SendMessageResult = { ok: true; message: MobileMessage } | { ok: false; code: string };
export type TalentProfileResponse = { ok: true; item: MobileTalentProfile } | { ok: false; code: string };
export type TalentProfileUpdateResult = { ok: true; id: number } | { ok: false; code: string };
export type GalleryUploadTicket = { ok: true; bucket: string; path: string; token: string; maxBytes: number } | { ok: false; code: string };
export type GalleryFinalizeResult = { ok: true; url: string; gallery: string[] } | { ok: false; code: string };
export type GalleryPrimaryResult = { ok: true; url: string } | { ok: false; code: string };
export type GalleryReorderResult = { ok: true; gallery: string[] } | { ok: false; code: string };
export type GalleryDeleteResult = { ok: true; gallery: string[]; primaryUrl: string | null } | { ok: false; code: string };

function requireApiBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (!configured) throw new Error("Missing EXPO_PUBLIC_API_BASE_URL for this mobile environment.");
  let parsed: URL;
  try { parsed = new URL(configured); } catch { throw new Error("Invalid EXPO_PUBLIC_API_BASE_URL for this mobile environment."); }
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && ["localhost", "127.0.0.1"].includes(parsed.hostname))) throw new Error("EXPO_PUBLIC_API_BASE_URL must use HTTPS except for localhost development.");
  return configured.replace(/\/$/, "");
}

const API_BASE_URL = requireApiBaseUrl();

async function readJson<T>(response: Response): Promise<T | null> {
  let raw = "";
  try { raw = await response.text(); } catch { return null; }
  if (!raw.trim()) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

async function getAccessToken() { const { data: { session } } = await supabase.auth.getSession(); return session?.access_token ?? null; }
async function authHeaders() { const accessToken = await getAccessToken(); return accessToken ? { Accept: "application/json", Authorization: `Bearer ${accessToken}` } : null; }

export async function getPublicOpportunities(locale: AppLocale, market: string): Promise<OpportunitiesResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/opportunities?market=${encodeURIComponent(market)}&locale=${locale}`, { headers: { Accept: "application/json" } });
    const payload = await readJson<OpportunitiesResponse>(response);
    if (!response.ok || !payload || !Array.isArray(payload.items)) throw new Error(`OPPORTUNITIES_REQUEST_FAILED:${response.status}`);
    return payload;
  } catch (error) { if (error instanceof Error && error.message.startsWith("OPPORTUNITIES_REQUEST_FAILED")) throw error; throw new Error("OPPORTUNITIES_REQUEST_FAILED:NETWORK"); }
}

export async function getPublicOpportunity(identifier: string, locale: AppLocale, market: string): Promise<OpportunityDetailResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/opportunities/${encodeURIComponent(identifier)}?market=${encodeURIComponent(market)}&locale=${locale}`, { headers: { Accept: "application/json" } });
    const payload = await readJson<OpportunityDetailResponse>(response);
    if (!response.ok || !payload?.item) throw new Error(`OPPORTUNITY_REQUEST_FAILED:${response.status}`);
    return payload;
  } catch (error) { if (error instanceof Error && error.message.startsWith("OPPORTUNITY_REQUEST_FAILED")) throw error; throw new Error("OPPORTUNITY_REQUEST_FAILED:NETWORK"); }
}

async function authedMutation<T extends { ok: boolean }>(path: string, method: "POST" | "PUT" | "PATCH" | "DELETE", fallback: T, body?: unknown): Promise<T> {
  const headers = await authHeaders();
  if (!headers) return { ...fallback, ok: false, code: "UNAUTHENTICATED" } as T;
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { method, headers: { ...headers, ...(body === undefined ? {} : { "Content-Type": "application/json" }) }, body: body === undefined ? undefined : JSON.stringify(body) });
    return (await readJson<T>(response)) ?? { ...fallback, ok: false, code: response.ok ? "INVALID_RESPONSE" : "REQUEST_FAILED" } as T;
  } catch { return { ...fallback, ok: false, code: "REQUEST_FAILED" } as T; }
}

export async function applyToOpportunity(opportunityId: number): Promise<ApplyResult> { return authedMutation<ApplyResult>(`/api/opportunities/${opportunityId}/apply`, "POST", { ok: false, code: "REQUEST_FAILED" }); }

export async function getMyApplications(locale: AppLocale): Promise<ApplicationsResponse> {
  const headers = await authHeaders(); if (!headers) return { ok: false, code: "UNAUTHENTICATED" };
  try { const response = await fetch(`${API_BASE_URL}/api/applications/mine?locale=${locale}`, { headers }); return (await readJson<ApplicationsResponse>(response)) ?? { ok: false, code: "REQUEST_FAILED" }; } catch { return { ok: false, code: "REQUEST_FAILED" }; }
}

export async function getTalentProfile(locale: AppLocale): Promise<TalentProfileResponse> {
  const headers = await authHeaders(); if (!headers) return { ok: false, code: "UNAUTHENTICATED" };
  try { const response = await fetch(`${API_BASE_URL}/api/talent/me?locale=${locale}`, { headers }); return (await readJson<TalentProfileResponse>(response)) ?? { ok: false, code: "REQUEST_FAILED" }; } catch { return { ok: false, code: "REQUEST_FAILED" }; }
}

export async function updateTalentProfile(locale: AppLocale, input: MobileTalentProfileUpdateInput): Promise<TalentProfileUpdateResult> { return authedMutation<TalentProfileUpdateResult>(`/api/talent/me?locale=${locale}`, "PATCH", { ok: false, code: "REQUEST_FAILED" }, input); }
export async function createTalentGalleryUpload(mimeType: string, size: number): Promise<GalleryUploadTicket> { return authedMutation<GalleryUploadTicket>("/api/talent/me/media", "POST", { ok: false, code: "REQUEST_FAILED" }, { mimeType, size }); }
export async function finalizeTalentGalleryUpload(path: string): Promise<GalleryFinalizeResult> { return authedMutation<GalleryFinalizeResult>("/api/talent/me/media", "PUT", { ok: false, code: "REQUEST_FAILED" }, { path }); }
export async function setTalentPrimaryImage(url: string): Promise<GalleryPrimaryResult> { return authedMutation<GalleryPrimaryResult>("/api/talent/me/media", "PATCH", { ok: false, code: "REQUEST_FAILED" }, { url }); }
export async function reorderTalentGallery(urls: string[]): Promise<GalleryReorderResult> { return authedMutation<GalleryReorderResult>("/api/talent/me/media", "PATCH", { ok: false, code: "REQUEST_FAILED" }, { action: "reorder", urls }); }
export async function deleteTalentGalleryImage(url: string): Promise<GalleryDeleteResult> { return authedMutation<GalleryDeleteResult>("/api/talent/me/media", "DELETE", { ok: false, code: "REQUEST_FAILED" }, { url }); }
export async function uploadTalentGalleryBuffer(body: ArrayBuffer, mimeType = "image/jpeg"): Promise<GalleryFinalizeResult> { const ticket = await createTalentGalleryUpload(mimeType, body.byteLength); if (!ticket.ok) return ticket; const { error } = await supabase.storage.from(ticket.bucket).uploadToSignedUrl(ticket.path, ticket.token, body, { contentType: mimeType }); if (error) return { ok: false, code: "UPLOAD_FAILED" }; return finalizeTalentGalleryUpload(ticket.path); }

export async function getConversations(): Promise<ConversationsResponse | null> {
  const headers = await authHeaders(); if (!headers) return null;
  try { const response = await fetch(`${API_BASE_URL}/api/conversations`, { headers }); if (!response.ok) return null; return await readJson<ConversationsResponse>(response); } catch { return null; }
}
export async function getConversation(conversationId: string): Promise<ConversationDetailResponse | null> {
  const headers = await authHeaders(); if (!headers) return null;
  try { const response = await fetch(`${API_BASE_URL}/api/conversations/${encodeURIComponent(conversationId)}`, { headers }); if (!response.ok) return null; return await readJson<ConversationDetailResponse>(response); } catch { return null; }
}
export async function sendMessage(conversationId: string, body: string): Promise<SendMessageResult> { return authedMutation<SendMessageResult>(`/api/conversations/${encodeURIComponent(conversationId)}`, "POST", { ok: false, code: "REQUEST_FAILED" }, { body }); }
export async function getNotifications(): Promise<NotificationsResponse | null> {
  const headers = await authHeaders();
  if (!headers) return null;
  let response: Response;
  try { response = await fetch(`${API_BASE_URL}/api/notifications`, { headers }); }
  catch { throw new Error("NOTIFICATIONS_REQUEST_FAILED:NETWORK"); }
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error(`NOTIFICATIONS_REQUEST_FAILED:${response.status}`);
  const payload = await readJson<NotificationsResponse>(response);
  if (!payload || !Array.isArray(payload.items) || typeof payload.unreadCount !== "number") throw new Error("NOTIFICATIONS_REQUEST_FAILED:INVALID_RESPONSE");
  return payload;
}
export async function markNotificationRead(notificationId: number | string) {
  const headers = await authHeaders(); if (!headers) return false;
  try { const response = await fetch(`${API_BASE_URL}/api/notifications/${encodeURIComponent(String(notificationId))}/read`, { method: "POST", headers }); return response.ok; } catch { return false; }
}
