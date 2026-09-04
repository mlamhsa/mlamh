import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const appConfig = JSON.parse(fs.readFileSync(path.join(root, "app.json"), "utf8"));
const easConfig = JSON.parse(fs.readFileSync(path.join(root, "eas.json"), "utf8"));
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

requireValue(expo.slug === "mlamh", "Expo slug must remain 'mlamh'.");
requireValue(expo.scheme === "mlamh", "Custom URL scheme must remain 'mlamh'.");
requireValue(expo.ios?.bundleIdentifier === "net.mlamh.app", "iOS bundleIdentifier must be net.mlamh.app.");
requireValue(/^\d+$/.test(expo.ios?.buildNumber ?? ""), "iOS buildNumber must be a numeric string.");
requireValue(expo.android?.package === "net.mlamh.app", "Android package must be net.mlamh.app.");
requireValue(Number.isInteger(expo.android?.versionCode) && expo.android.versionCode > 0, "Android versionCode must be a positive integer.");

const associatedDomains = new Set(expo.ios?.associatedDomains ?? []);
requireValue(associatedDomains.has("applinks:mlamh.net"), "iOS associated domains must include mlamh.net.");
requireValue(associatedDomains.has("applinks:www.mlamh.net"), "iOS associated domains must include www.mlamh.net.");

const intentData = (expo.android?.intentFilters ?? []).flatMap((filter) => filter.data ?? []);
requireValue(intentData.some((item) => item.scheme === "https" && item.host === "mlamh.net"), "Android App Links must include https://mlamh.net.");
requireValue(intentData.some((item) => item.scheme === "https" && item.host === "www.mlamh.net"), "Android App Links must include https://www.mlamh.net.");

for (const profile of ["development", "preview", "production"]) {
  requireValue(Boolean(easConfig.build?.[profile]), `Missing EAS build profile: ${profile}.`);
}

if (strict) {
  const requiredEnvironment = [
    "EXPO_PUBLIC_SUPABASE_URL",
    "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "EXPO_PUBLIC_API_BASE_URL",
    "EXPO_PUBLIC_DEFAULT_MARKET",
    "EXPO_PUBLIC_EAS_PROJECT_ID",
  ];
  for (const key of requiredEnvironment) requireValue(Boolean(process.env[key]?.trim()), `Missing required build environment variable: ${key}.`);

  const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (apiBase) {
    try {
      const parsed = new URL(apiBase);
      requireValue(parsed.protocol === "https:" || parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1", "EXPO_PUBLIC_API_BASE_URL must use HTTPS outside local development.");
    } catch {
      errors.push("EXPO_PUBLIC_API_BASE_URL must be a valid absolute URL.");
    }
  }

  // Store/internal native builds must never ship with Expo placeholder artwork.
  requireLocalAsset(expo.icon, "App icon");
  requireLocalAsset(expo.android?.adaptiveIcon?.foregroundImage, "Android adaptive icon foreground");
}

if (errors.length) {
  console.error("MLAMH Mobile release preflight failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`MLAMH Mobile release preflight passed${strict ? " (strict)" : ""}.`);
