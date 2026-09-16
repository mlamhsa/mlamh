const required = [
  "EXPO_PUBLIC_SUPABASE_URL",
  "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "EXPO_PUBLIC_API_BASE_URL",
  "EXPO_PUBLIC_DEFAULT_MARKET",
  "EXPO_PUBLIC_EAS_PROJECT_ID",
];

const missing = required.filter((name) => !process.env[name]?.trim());

if (missing.length > 0) {
  console.error(`Missing required mobile build environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

console.log("Mobile build environment validated.");
