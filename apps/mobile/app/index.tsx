import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useColorScheme } from "react-native";
import { router } from "expo-router";

import { getMobileAccountContext } from "@/lib/account";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { darkTheme, lightTheme } from "@/lib/theme";

export default function WelcomeScreen() {
  const locale = getDeviceLocale();
  const theme = useColorScheme() === "dark" ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [checking, setChecking] = useState(true);
  const isArabic = locale === "ar";

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      if (!session) { setChecking(false); return; }
      const account = await getMobileAccountContext();
      if (!active) return;
      if (account?.type === "publisher") { router.replace("/publisher"); return; }
      if (account?.type === "talent") {
        if (account.onboardingStatus !== "completed" || !account.entityId) { router.replace("/onboarding"); return; }
        router.replace("/opportunities");
        return;
      }
      router.replace("/onboarding");
    })();
    return () => { active = false; };
  }, []);

  if (checking) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.accent} /></View>;

  return <View style={styles.screen}><View style={[styles.content, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]}>
    <View style={styles.brandBlock}><Text accessibilityRole="header" style={styles.mark}>M</Text><Text style={styles.brand}>MLAMH</Text><Text style={styles.brandArabic}>ملامح</Text><Text style={styles.tagline}>{isArabic ? "منصة المواهب والفرص الإبداعية" : "Talent & Opportunities Platform"}</Text><Text style={styles.taglineEn}>Talent & Opportunities Platform</Text><View style={styles.goldLine} /></View>
    <View style={styles.messageBlock}><Text style={styles.headline}>{isArabic ? "اكتشف فرصك القادمة" : "Discover your next opportunity"}</Text><Text style={styles.subheadline}>{isArabic ? "وابنِ مستقبلك في عالم الإبداع" : "Build your future in the creative world"}</Text></View>
    <View style={styles.actions}>
      <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} onPress={() => router.push("/signup")}><Text style={styles.primaryButtonText}>{isArabic ? "إنشاء حساب" : "Create account"}</Text></Pressable>
      <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={() => router.push("/login")}><Text style={styles.secondaryButtonText}>{isArabic ? "تسجيل الدخول" : "Sign in"}</Text></Pressable>
      <Pressable style={({ pressed }) => [styles.guestButton, pressed && styles.pressed]} onPress={() => router.push("/opportunities")}><Text style={styles.guestButtonText}>{isArabic ? "تصفح كضيف" : "Continue as guest"}</Text></Pressable>
    </View>
  </View></View>;
}

function createStyles(theme: typeof lightTheme | typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background, justifyContent: "center" }, centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }, content: { paddingHorizontal: 30, paddingVertical: 48, gap: 34 }, brandBlock: { alignItems: "center", gap: 3 }, mark: { color: theme.accent, fontSize: 72, lineHeight: 74, fontWeight: "300", letterSpacing: -8 }, brand: { color: theme.text, fontSize: 34, lineHeight: 38, fontWeight: "500", letterSpacing: 1.2 }, brandArabic: { color: theme.text, fontSize: 26, lineHeight: 34, fontWeight: "500" }, tagline: { color: theme.text, fontSize: 13, lineHeight: 20, textAlign: "center", marginTop: 14 }, taglineEn: { color: theme.muted, fontSize: 11, lineHeight: 17, textAlign: "center" }, goldLine: { width: 28, height: 2, backgroundColor: theme.accent, borderRadius: 2, marginTop: 16 }, messageBlock: { alignItems: "center", gap: 8, marginTop: 8 }, headline: { color: theme.text, fontSize: 27, lineHeight: 35, fontWeight: "700", textAlign: "center" }, subheadline: { color: theme.muted, fontSize: 15, lineHeight: 24, textAlign: "center" }, actions: { gap: 11, marginTop: 6 }, primaryButton: { minHeight: 54, borderRadius: 12, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center", shadowColor: theme.shadow, shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } }, primaryButtonText: { color: theme.charcoal, fontSize: 16, fontWeight: "800" }, secondaryButton: { minHeight: 52, borderRadius: 12, borderWidth: 1, borderColor: theme.accent, alignItems: "center", justifyContent: "center", backgroundColor: "transparent" }, secondaryButtonText: { color: theme.text, fontSize: 16, fontWeight: "700" }, guestButton: { minHeight: 44, alignItems: "center", justifyContent: "center" }, guestButtonText: { color: theme.muted, fontSize: 13, fontWeight: "600" }, pressed: { opacity: 0.74, transform: [{ scale: 0.99 }] },
}); }
