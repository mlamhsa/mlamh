import type { AppLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://mlamh.net").replace(/\/$/, "");

export type MobilePublisherOpportunity = { id: number; title: string; status: string | null; published: boolean; countryCode: string | null; createdAt: string | null; applications: number; accepted: number };
export type MobilePublisherDashboard = { publisher: { id: number; name: string; city: string | null; countryCode: string | null; verified: boolean; verificationStatus: string | null; approvalStatus: string | null; status: string | null; imageUrl: string | null }; metrics: { opportunities: number; published: number; applications: number; accepted: number }; opportunities: MobilePublisherOpportunity[] };
export type CreateOpportunityDraftInput = { title: string; description: string; opportunityType: "actor" | "model"; city?: string; compensationType: "fixed" | "negotiable" | "unpaid"; budget?: string; countryCode?: string; currency?: string };
export type CreateOpportunityDraftResult = { ok: true; item: { id: number; title: string; status: string | null; published: boolean; countryCode: string | null; createdAt: string | null } } | { ok: false; code: string };
export type MobileConversation = { id: number; opportunityId: number; opportunityTitle: string | null; partyName: string; partyImageUrl: string | null; status: string | null; latestMessage: string | null; lastActivityAt: string | null; unreadCount: number };
export type ConversationsResponse = { items: MobileConversation[]; unreadCount: number };

async function accessToken() { const { data: { session } } = await supabase.auth.getSession(); return session?.access_token ?? null; }

export async function getPublisherDashboard(locale: AppLocale): Promise<MobilePublisherDashboard | null> { const token = await accessToken(); if (!token) return null; const response = await fetch(`${API_BASE_URL}/api/publisher/me?locale=${locale}`, { headers: { Accept: "application/json", Authorization: `Bearer ${token}` } }); if (!response.ok) return null; return (await response.json()) as MobilePublisherDashboard; }
export async function createPublisherOpportunityDraft(input: CreateOpportunityDraftInput): Promise<CreateOpportunityDraftResult> { const token = await accessToken(); if (!token) return { ok: false, code: "UNAUTHENTICATED" }; const response = await fetch(`${API_BASE_URL}/api/publisher/opportunities`, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(input) }); try { return (await response.json()) as CreateOpportunityDraftResult; } catch { return { ok: false, code: "REQUEST_FAILED" }; } }
export async function getPublisherConversations(): Promise<ConversationsResponse | null> { const token = await accessToken(); if (!token) return null; const response = await fetch(`${API_BASE_URL}/api/conversations`, { headers: { Accept: "application/json", Authorization: `Bearer ${token}` } }); if (!response.ok) return null; return (await response.json()) as ConversationsResponse; }
