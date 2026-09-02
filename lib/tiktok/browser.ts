type TikTokQueue = {
  page?: () => void;
  track?: (event: string, properties?: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    ttq?: TikTokQueue;
  }
}

export function isTikTokPixelEnabled() {
  return (
    process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ENABLED === "true" &&
    Boolean(process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID)
  );
}

export function trackTikTokBrowserEvent(
  event: string,
  properties: Record<string, unknown> = {},
) {
  if (!isTikTokPixelEnabled() || typeof window === "undefined") return;
  window.ttq?.track?.(event, properties);
}

export function trackTikTokPageView() {
  if (!isTikTokPixelEnabled() || typeof window === "undefined") return;
  window.ttq?.page?.();
}
