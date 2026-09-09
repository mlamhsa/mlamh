import { MOBILE_API_BASE_URL } from "@/lib/api-config";
import { supabase } from "@/lib/supabase";

export type TalentSpotlightPolicy = {
  maxVideos: 1;
  maxDurationSeconds: number;
  autoplayInDiscovery: false;
  publicRawFileUrls: false;
  delivery: "managed_streaming";
  acceptedMimeTypes: string[];
  providerConfigured: boolean;
};

export type TalentSpotlightStatus = {
  ok: true;
  policy: TalentSpotlightPolicy;
  asset: null | {
    status: "preparing" | "uploading" | "processing" | "ready" | "failed";
    playbackUrl?: string | null;
    posterUrl?: string | null;
    durationSeconds?: number | null;
  };
};

export async function getTalentSpotlightStatus(): Promise<TalentSpotlightStatus | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return null;
  try {
    const response = await fetch(`${MOBILE_API_BASE_URL}/api/talent/me/spotlight-video`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${session.access_token}` },
    });
    if (!response.ok) return null;
    const payload = await response.json() as TalentSpotlightStatus;
    return payload?.ok === true ? payload : null;
  } catch {
    return null;
  }
}
