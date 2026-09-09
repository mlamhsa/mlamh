import type { AppLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";

function apiBase() {
  const value = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (!value) throw new Error("Missing EXPO_PUBLIC_API_BASE_URL");
  return value.replace(/\/$/, "");
}

export type TalentInvitationResult =
  | { ok: true; alreadyInvited: boolean }
  | { ok: false; code: string };

export async function inviteTalentToOpportunity(opportunityId: number, talentId: number, locale: AppLocale): Promise<TalentInvitationResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return { ok: false, code: "UNAUTHENTICATED" };
  try {
    const response = await fetch(`${apiBase()}/api/publisher/opportunities/${opportunityId}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ talentId, locale }),
    });
    const payload = await response.json().catch(() => null) as { ok?: boolean; alreadyInvited?: boolean; code?: string } | null;
    if (!response.ok || !payload?.ok) return { ok: false, code: payload?.code ?? "REQUEST_FAILED" };
    return { ok: true, alreadyInvited: payload.alreadyInvited === true };
  } catch {
    return { ok: false, code: "REQUEST_FAILED" };
  }
}
