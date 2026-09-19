export const PUBLIC_READ_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=0, must-revalidate",
  "Vercel-CDN-Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
} as const;
