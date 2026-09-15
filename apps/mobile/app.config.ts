import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "MLAMH",
  slug: "mlamh",
  scheme: "mlamh",
  version: "0.2.0",
  orientation: "portrait",
  userInterfaceStyle: "dark",
  plugins: [
    "expo-router",
    "expo-localization",
    "expo-apple-authentication",
    [
      "expo-image-picker",
      {
        photosPermission:
          "Allow MLAMH to access your photos so you can build and update your professional profile.",
        cameraPermission:
          "Allow MLAMH to use your camera when you choose to capture profile or portfolio media.",
        microphonePermission: false,
      },
    ],
    [
      "expo-notifications",
      {
        color: "#C9A962",
        defaultChannel: "mlamh-updates",
        enableBackgroundRemoteNotifications: false,
      },
    ],
  ],
  ios: {
    supportsTablet: false,
    bundleIdentifier: "net.mlamh.app",
    buildNumber: "15",
    usesAppleSignIn: true,
    entitlements: {
      "com.apple.developer.applesignin": ["Default"],
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      CFBundleAllowMixedLocalizations: true,
    },
    associatedDomains: ["applinks:mlamh.net", "applinks:www.mlamh.net"],
  },
  android: {
    package: "net.mlamh.app",
    versionCode: 15,
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          { scheme: "https", host: "mlamh.net" },
          { scheme: "https", host: "www.mlamh.net" },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: "ca757cb1-e91c-4e8c-a3a9-6cee885e483a",
    },
  },
};

export default config;
