export const TALENT_SPOTLIGHT_POLICY = {
  maxVideos: 1,
  maxDurationSeconds: 30,
  autoplayInDiscovery: false,
  publicRawFileUrls: false,
  delivery: "managed_streaming" as const,
  acceptedMimeTypes: ["video/mp4", "video/quicktime", "video/webm"] as const,
};

export type TalentSpotlightProvider = "mux" | "cloudflare-stream" | "none";

export function getTalentSpotlightProvider(): TalentSpotlightProvider {
  const configured = process.env.MLAMH_VIDEO_PROVIDER?.trim().toLowerCase();
  if (configured === "mux") return "mux";
  if (configured === "cloudflare-stream") return "cloudflare-stream";
  return "none";
}

export function talentSpotlightProviderConfigured() {
  const provider = getTalentSpotlightProvider();
  if (provider === "mux") {
    return Boolean(process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET);
  }
  if (provider === "cloudflare-stream") {
    return Boolean(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_STREAM_TOKEN);
  }
  return false;
}

export function talentSpotlightPublicPolicy() {
  return {
    ...TALENT_SPOTLIGHT_POLICY,
    acceptedMimeTypes: [...TALENT_SPOTLIGHT_POLICY.acceptedMimeTypes],
    providerConfigured: talentSpotlightProviderConfigured(),
  };
}
