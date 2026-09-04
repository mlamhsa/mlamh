import { useEffect } from "react";
import * as Linking from "expo-linking";
import { type ErrorBoundaryProps, type Href, router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { getMobileHrefFromUrl } from "@/lib/deep-links";
import { getDeviceLocale } from "@/lib/i18n";
import { NotificationSyncProvider } from "@/lib/notifications-context";
import { installPushDeepLinkObserver, startPushSessionLifecycle } from "@/lib/push";
import { startAuthSessionLifecycle, supabase } from "@/lib/supabase";

function requiresAuthentication(href: Href) {
  const path = typeof href === "string" ? href : href.pathname;
  return typeof path === "string" && (
    path.startsWith("/conversations/") ||
    path.startsWith("/publisher/") ||
    path === "/publisher" ||
    path === "/applications" ||
    path === "/notifications" ||
    path.startsWith("/profile")
  );
}

async function routeIncomingUrl(url: string) {
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
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  return <View style={errorStyles.screen} accessibilityRole="alert">
    <Text style={errorStyles.brand}>MLAMH</Text>
    <Text style={errorStyles.title}>{isArabic ? "حدث خطأ غير متوقع" : "Something went wrong"}</Text>
    <Text style={errorStyles.body}>{isArabic ? "لم نفقد بياناتك. حاول إعادة تحميل هذه الشاشة." : "Your data is safe. Try loading this screen again."}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "إعادة المحاولة" : "Try again"} style={errorStyles.button} onPress={retry}><Text style={errorStyles.buttonText}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text></Pressable>
  </View>;
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
  return <NotificationSyncProvider><StatusBar style="auto" /><Stack screenOptions={{ headerShown: false }} /></NotificationSyncProvider>;
}

const errorStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#2E2E2E", alignItems: "center", justifyContent: "center", paddingHorizontal: 28, gap: 14 },
  brand: { color: "#D4A017", fontSize: 13, fontWeight: "800", letterSpacing: 2.4 },
  title: { color: "#F5F1E8", fontSize: 28, fontWeight: "700", textAlign: "center" },
  body: { color: "#F5F1E8B8", fontSize: 15, lineHeight: 23, textAlign: "center", maxWidth: 360 },
  button: { marginTop: 8, minHeight: 48, minWidth: 160, borderRadius: 24, backgroundColor: "#D4A017", alignItems: "center", justifyContent: "center", paddingHorizontal: 22 },
  buttonText: { color: "#2E2E2E", fontSize: 14, fontWeight: "800" },
});
