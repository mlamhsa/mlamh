import { useEffect } from "react";
import * as Linking from "expo-linking";
import { type ErrorBoundaryProps, type Href, router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { getMobileHrefFromUrl } from "@/lib/deep-links";
import { getDeviceLocale } from "@/lib/i18n";
import { NotificationSyncProvider } from "@/lib/notifications-context";
import { installPushDeepLinkObserver, startPushSessionLifecycle } from "@/lib/push";
import { consumeNativeAuthCallback, startAuthSessionLifecycle, supabase } from "@/lib/supabase";

function requiresAuthentication(href: Href) {
  const path = typeof href === "string" ? href : href.pathname;
  return typeof path === "string" && (path.startsWith("/conversations/") || path.startsWith("/publisher/") || path === "/publisher" || path === "/applications" || path === "/messages" || path === "/notifications" || path.startsWith("/profile"));
}

function getAuthCallbackType(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);
    const fragment = new URLSearchParams(parsed.hash.replace(/^#/, ""));
    return fragment.get("type") ?? parsed.searchParams.get("type");
  } catch {
    return null;
  }
}

async function routeIncomingUrl(url: string) {
  const callbackType = getAuthCallbackType(url);
  const consumedAuth = await consumeNativeAuthCallback(url);
  if (consumedAuth) {
    if (callbackType === "recovery") {
      router.replace("/reset-password");
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const accountType = user?.user_metadata?.account_type;
    router.replace(accountType === "publisher" ? "/publisher/setup" : "/onboarding");
    return;
  }
  const href = getMobileHrefFromUrl(url);
  if (!href) return;
  const { data } = await supabase.auth.getSession();
  if (!data.session && requiresAuthentication(href)) {
    const next = typeof href === "string" ? href : String(href.pathname ?? "/");
    router.push({ pathname: "/login", params: { next } });
    return;
  }
  router.push(href);
}

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  const locale = getDeviceLocale(); const isArabic = locale === "ar";
  return <View style={errorStyles.screen} accessibilityRole="alert"><Text style={errorStyles.brand}>{isArabic ? "ملامح" : "MLAMH"}</Text><Text style={errorStyles.title}>{isArabic ? "حدث خطأ غير متوقع" : "Something went wrong"}</Text><Text style={errorStyles.body}>{isArabic ? "لم نفقد بياناتك. حاول إعادة تحميل هذه الشاشة." : "Your data is safe. Try loading this screen again."}</Text><Pressable accessibilityRole="button" style={errorStyles.button} onPress={retry}><Text style={errorStyles.buttonText}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text></Pressable></View>;
}

export default function RootLayout() {
  useEffect(() => startAuthSessionLifecycle(), []);
  useEffect(() => startPushSessionLifecycle(getDeviceLocale()), []);
  useEffect(() => {
    let active = true;
    const openUrl = (url: string) => { if (active) void routeIncomingUrl(url); };
    void Linking.getInitialURL().then((url) => { if (url) openUrl(url); });
    const linkingSubscription = Linking.addEventListener("url", ({ url }) => openUrl(url));
    const removePushObserver = installPushDeepLinkObserver(openUrl);
    return () => { active = false; linkingSubscription.remove(); removePushObserver(); };
  }, []);
  return <SafeAreaProvider><NotificationSyncProvider><StatusBar style="light" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#050505" } }} /></NotificationSyncProvider></SafeAreaProvider>;
}

const errorStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#050505", alignItems: "center", justifyContent: "center", paddingHorizontal: 28, gap: 14 }, brand: { color: "#C9A962", fontSize: 13, fontWeight: "800", letterSpacing: 1.7 }, title: { color: "#F5F5F0", fontSize: 28, fontWeight: "700", textAlign: "center" }, body: { color: "#B9B6AE", fontSize: 15, lineHeight: 23, textAlign: "center", maxWidth: 360 }, button: { marginTop: 8, minHeight: 48, minWidth: 160, borderRadius: 12, backgroundColor: "#C9A962", alignItems: "center", justifyContent: "center", paddingHorizontal: 22 }, buttonText: { color: "#050505", fontSize: 14, fontWeight: "800" },
});
