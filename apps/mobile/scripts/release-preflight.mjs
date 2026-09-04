import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const appConfig = JSON.parse(fs.readFileSync(path.join(root, "app.json"), "utf8"));
const easConfig = JSON.parse(fs.readFileSync(path.join(root, "eas.json"), "utf8"));
const packageConfig = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const themeSource = fs.readFileSync(path.join(root, "lib", "theme.ts"), "utf8");
const expo = appConfig.expo ?? {};
const errors = [];
const strict = process.argv.includes("--strict");

function requireValue(condition, message) {
  if (!condition) errors.push(message);
}

function requireLocalAsset(assetPath, label) {
  requireValue(typeof assetPath === "string" && assetPath.trim().length > 0, `${label} must be configured.`);
  if (typeof assetPath !== "string" || !assetPath.trim()) return;
  const resolved = path.resolve(root, assetPath);
  requireValue(resolved.startsWith(`${root}${path.sep}`), `${label} must reference a local app asset.`);
  requireValue(fs.existsSync(resolved), `${label} does not exist: ${assetPath}.`);
}

requireValue(fs.existsSync(path.join(root, "package-lock.json")), "Mobile package-lock.json must be committed for reproducible EAS builds.");
requireValue(expo.slug === "mlamh", "Expo slug must remain 'mlamh'.");
requireValue(expo.scheme === "mlamh", "Custom URL scheme must remain 'mlamh'.");
requireValue(expo.ios?.bundleIdentifier === "net.mlamh.app", "iOS bundleIdentifier must be net.mlamh.app.");
requireValue(/^\d+$/.test(expo.ios?.buildNumber ?? ""), "iOS buildNumber must be a numeric string.");
requireValue(expo.android?.package === "net.mlamh.app", "Android package must be net.mlamh.app.");
requireValue(Number.isInteger(expo.android?.versionCode) && expo.android.versionCode > 0, "Android versionCode must be a positive integer.");

for (const [name, value] of [["Gold", "#D4A017"], ["Charcoal", "#2E2E2E"], ["Warm Ivory", "#F5F1E8"], ["Bronze", "#8C6A2D"]]) {
  requireValue(themeSource.includes(value), `Canonical MLAMH ${name} token ${value} is missing from lib/theme.ts.`);
}
requireValue(!themeSource.includes("goldStrong"), "MLAMH theme must not redefine the primary Gold token with an alternate brand gold.");

const associatedDomains = new Set(expo.ios?.associatedDomains ?? []);
requireValue(associatedDomains.has("applinks:mlamh.net"), "iOS associated domains must include mlamh.net.");
requireValue(associatedDomains.has("applinks:www.mlamh.net"), "iOS associated domains must include www.mlamh.net.");

const intentData = (expo.android?.intentFilters ?? []).flatMap((filter) => filter.data ?? []);
requireValue(intentData.some((item) => item.scheme === "https" && item.host === "mlamh.net"), "Android App Links must include https://mlamh.net.");
requireValue(intentData.some((item) => item.scheme === "https" && item.host === "www.mlamh.net"), "Android App Links must include https://www.mlamh.net.");

for (const profile of ["development", "preview", "testflight", "production"]) {
  requireValue(Boolean(easConfig.build?.[profile]), `Missing EAS build profile: ${profile}.`);
  requireValue(Boolean(easConfig.build?.[profile]?.environment), `EAS build profile '${profile}' must bind to an environment.`);
}
requireValue(easConfig.build?.development?.distribution === "internal", "Development build must use internal distribution.");
requireValue(easConfig.build?.preview?.distribution === "internal", "Preview build must use internal distribution.");
requireValue(easConfig.build?.preview?.android?.buildType === "apk", "Preview Android build must produce an APK for internal QA.");
requireValue(easConfig.build?.preview?.channel === "preview", "Preview build must use the preview update channel.");
requireValue(easConfig.build?.testflight?.distribution === "store", "TestFlight build must use App Store distribution signing.");
requireValue(easConfig.build?.testflight?.environment === "preview", "TestFlight build must use the preview environment until release approval.");
requireValue(easConfig.build?.production?.channel === "production", "Production build must use the production update channel.");

if (easConfig.build?.development?.developmentClient === true) {
  requireValue(Boolean(packageConfig.dependencies?.["expo-dev-client"]), "Development Client builds require expo-dev-client in dependencies.");
}

requireValue(expo.android?.adaptiveIcon?.backgroundColor === "#2E2E2E", "Android adaptive icon background must use official MLAMH Charcoal #2E2E2E.");
const splashPlugin = (expo.plugins ?? []).find((plugin) => Array.isArray(plugin) && plugin[0] === "expo-splash-screen");
if (splashPlugin) {
  const splashConfig = splashPlugin[1] ?? {};
  requireValue(splashConfig.backgroundColor === "#F5F1E8", "Light splash background must use official MLAMH Warm Ivory #F5F1E8.");
  requireValue(splashConfig.dark?.backgroundColor === "#2E2E2E", "Dark splash background must use official MLAMH Charcoal #2E2E2E.");
}

if (strict) {
  const requiredEnvironment = [
    "EXPO_PUBLIC_SUPABASE_URL",
    "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "EXPO_PUBLIC_API_BASE_URL",
    "EXPO_PUBLIC_DEFAULT_MARKET",
    "EXPO_PUBLIC_EAS_PROJECT_ID",
  ];
  const previewEnvironment = easConfig.build?.preview?.env ?? {};
  const testflightEnvironment = easConfig.build?.testflight?.env ?? {};
  for (const key of requiredEnvironment) {
    const runtimeValue = process.env[key]?.trim();
    const previewValue = typeof previewEnvironment[key] === "string" ? previewEnvironment[key].trim() : "";
    const testflightValue = typeof testflightEnvironment[key] === "string" ? testflightEnvironment[key].trim() : "";
    requireValue(Boolean(runtimeValue), `Missing required build environment variable: ${key}.`);
    requireValue(Boolean(previewValue), `Missing required preview EAS environment value: ${key}.`);
    requireValue(Boolean(testflightValue), `Missing required TestFlight EAS environment value: ${key}.`);
    if (runtimeValue && previewValue) requireValue(runtimeValue === previewValue, `Preview EAS environment value must match CI for ${key}.`);
    if (runtimeValue && testflightValue) requireValue(runtimeValue === testflightValue, `TestFlight EAS environment value must match CI for ${key}.`);
  }

  const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (apiBase) {
    try {
      const parsed = new URL(apiBase);
      requireValue(parsed.protocol === "https:" || parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1", "EXPO_PUBLIC_API_BASE_URL must use HTTPS outside local development.");
    } catch {
      errors.push("EXPO_PUBLIC_API_BASE_URL must be a valid absolute URL.");
    }
  }

  const market = process.env.EXPO_PUBLIC_DEFAULT_MARKET?.trim().toUpperCase();
  if (market) requireValue(/^[A-Z]{2}$/.test(market), "EXPO_PUBLIC_DEFAULT_MARKET must be an ISO 3166-1 alpha-2 country code.");

  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim();
  if (projectId) {
    requireValue(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(projectId), "EXPO_PUBLIC_EAS_PROJECT_ID must be a valid UUID.");
    requireValue(expo.extra?.eas?.projectId === projectId, "app.json EAS project linkage must match EXPO_PUBLIC_EAS_PROJECT_ID.");
  }

  requireLocalAsset(expo.icon, "App icon");
  requireLocalAsset(expo.android?.adaptiveIcon?.foregroundImage, "Android adaptive icon foreground");
  if (splashPlugin) requireLocalAsset(splashPlugin[1]?.image, "Splash image");
}

if (errors.length) {
  console.error("MLAMH Mobile release preflight failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`MLAMH Mobile release preflight passed${strict ? " (strict)" : ""}.`);
