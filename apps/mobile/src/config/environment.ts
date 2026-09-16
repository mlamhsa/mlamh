function required(name: string, value: string | undefined) {
  const normalized = value?.trim();
  if (!normalized) throw new Error(`Missing required mobile environment variable: ${name}`);
  return normalized;
}

export const mobileEnvironment = {
  supabaseUrl: required("EXPO_PUBLIC_SUPABASE_URL", process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabasePublishableKey: required(
    "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ),
  apiBaseUrl: (process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://mlamh.net")
    .trim()
    .replace(/\/$/, ""),
  defaultMarket: (process.env.EXPO_PUBLIC_DEFAULT_MARKET ?? "SA")
    .trim()
    .toUpperCase(),
  easProjectId:
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim() ||
    "ca757cb1-e91c-4e8c-a3a9-6cee885e483a",
} as const;
