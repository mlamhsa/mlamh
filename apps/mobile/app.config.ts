import type { ExpoConfig } from "expo/config";

const ANDROID_APP_LINK_PATHS = [
  "/opportunities","/opportunities/","/ar/opportunities","/ar/opportunities/","/en/opportunities","/en/opportunities/",
  "/talent","/talent/","/talents","/talents/","/ar/talent","/ar/talent/","/ar/talents","/ar/talents/",
  "/en/talent","/en/talent/","/en/talents","/en/talents/","/messages/","/conversations/","/applications",
  "/ar/applications","/en/applications","/casting","/casting/","/ar/casting","/ar/casting/","/en/casting",
  "/en/casting/","/scene","/scene/","/ar/scene","/ar/scene/","/en/scene","/en/scene/",
] as const;

const androidAppLinkData = ["mlamh.net", "www.mlamh.net"].flatMap((host) =>
  ANDROID_APP_LINK_PATHS.map((pathPrefix) => ({ scheme: "https" as const, host, pathPrefix })),
);

const config: ExpoConfig = {
  name: "MLAMH", slug: "mlamh", scheme: "mlamh", version: "0.2.0", icon: "./assets/icon.png",
  orientation: "portrait", userInterfaceStyle: "dark",
  plugins: [
    "expo-router","expo-localization","expo-apple-authentication","expo-web-browser",
    ["expo-splash-screen",{ backgroundColor: "#000000", image: "./assets/logo.ar.png", imageWidth: 220 }],
    ["expo-image-picker",{ photosPermission: "Allow MLAMH to access your photos so you can build and update your professional profile.", cameraPermission: "Allow MLAMH to use your camera when you choose to capture profile or portfolio media.", microphonePermission: false }],
    ["expo-notifications",{ color: "#C9A962", defaultChannel: "mlamh-updates", enableBackgroundRemoteNotifications: false }],
  ],
  ios: {
    supportsTablet: false, bundleIdentifier: "net.mlamh.app", buildNumber: "27", usesAppleSignIn: true,
    entitlements: { "com.apple.developer.applesignin": ["Default"] },
    infoPlist: { ITSAppUsesNonExemptEncryption: false, CFBundleAllowMixedLocalizations: true },
    associatedDomains: ["applinks:mlamh.net", "applinks:www.mlamh.net"],
  },
  android: {
    package: "net.mlamh.app", versionCode: 15,
    adaptiveIcon: { foregroundImage: "./assets/icon.png", backgroundColor: "#000000" },
    intentFilters: [{ action: "VIEW", autoVerify: true, data: androidAppLinkData, category: ["BROWSABLE", "DEFAULT"] }],
  },
  experiments: { typedRoutes: true },
  extra: { eas: { projectId: "ca757cb1-e91c-4e8c-a3a9-6cee885e483a" } },
};
export default config;
