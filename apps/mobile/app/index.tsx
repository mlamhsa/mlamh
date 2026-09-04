import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from "react-native";
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

  const proofItems = isArabic
    ? ["فرص حقيقية", "ملف احترافي", "تواصل بعد القبول"]
    : ["Real opportunities", "Professional portfolio", "Chat after acceptance"];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.content, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]}>
        <View pointerEvents="none" style={styles.ambientOne} />
        <View pointerEvents="none" style={styles.ambientTwo} />

        <View style={styles.topRow}>
          <View style={styles.platformPill}><View style={styles.platformDot} /><Text style={styles.platformText}>{isArabic ? "منصة المواهب والفرص" : "Talent & Opportunities"}</Text></View>
          <Text style={styles.versionText}>MLAMH</Text>
        </View>

        <View style={styles.hero}>
          <View style={styles.markShell}>
            <View style={styles.markRing}><Text accessibilityRole="header" style={styles.mark}>M</Text></View>
          </View>
          <Text style={styles.brand}>MLAMH</Text>
          <Text style={styles.brandArabic}>ملامح</Text>
          <Text style={styles.eyebrow}>{isArabic ? "اكتشف. تقدّم. تواصل." : "DISCOVER. APPLY. CONNECT."}</Text>
          <Text style={styles.headline}>{isArabic ? "مكانك في عالم الإبداع يبدأ من هنا" : "Your place in the creative world starts here"}</Text>
          <Text style={styles.subheadline}>{isArabic ? "اكتشف فرصًا مناسبة، ابنِ ملفك المهني، وتواصل مباشرة بعد قبولك." : "Discover relevant opportunities, build your portfolio, and connect directly after acceptance."}</Text>
        </View>

        <View style={styles.proofCard}>
          {proofItems.map((item, index) => (
            <View key={item} style={[styles.proofItem, index > 0 && styles.proofDivider]}>
              <View style={styles.proofIcon}><Text style={styles.proofIconText}>{index === 0 ? "✦" : index === 1 ? "M" : "↗"}</Text></View>
              <Text style={styles.proofText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <Pressable accessibilityRole="button" style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} onPress={() => router.push("/signup")}>
            <Text style={styles.primaryButtonText}>{isArabic ? "ابدأ الآن" : "Get started"}</Text><Text style={styles.primaryArrow}>{isArabic ? "←" : "→"}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={() => router.push("/login")}>
            <Text style={styles.secondaryButtonText}>{isArabic ? "لدي حساب" : "I already have an account"}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={({ pressed }) => [styles.guestButton, pressed && styles.pressed]} onPress={() => router.push("/opportunities")}>
            <Text style={styles.guestButtonText}>{isArabic ? "استكشف الفرص أولًا" : "Explore opportunities first"}</Text>
          </Pressable>
        </View>

        <Text style={styles.footerNote}>{isArabic ? "المشاركة والتقديم مجانيان" : "Joining and applying are free"}</Text>
      </View>
    </ScrollView>
  );
}

function createStyles(theme: typeof lightTheme | typeof darkTheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background },
    scrollContent: { flexGrow: 1, justifyContent: "center" },
    content: { minHeight: 780, paddingHorizontal: 24, paddingTop: 58, paddingBottom: 34, gap: 24, overflow: "hidden" },
    ambientOne: { position: "absolute", top: 80, right: -120, width: 300, height: 300, borderRadius: 150, borderWidth: 1, borderColor: "rgba(212,160,23,0.20)" },
    ambientTwo: { position: "absolute", top: 120, right: -72, width: 210, height: 210, borderRadius: 105, backgroundColor: "rgba(212,160,23,0.06)" },
    topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    platformPill: { minHeight: 34, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, borderRadius: 17, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface },
    platformDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.accent },
    platformText: { color: theme.text, fontSize: 10, fontWeight: "700" },
    versionText: { color: theme.accent, fontSize: 11, fontWeight: "900", letterSpacing: 2.2 },
    hero: { alignItems: "center", gap: 6, paddingTop: 18 },
    markShell: { width: 126, height: 126, borderRadius: 63, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(212,160,23,0.06)", borderWidth: 1, borderColor: "rgba(212,160,23,0.18)", marginBottom: 5 },
    markRing: { width: 94, height: 94, borderRadius: 47, borderWidth: 1, borderColor: theme.accent, alignItems: "center", justifyContent: "center", backgroundColor: theme.surface },
    mark: { color: theme.accent, fontSize: 56, lineHeight: 60, fontWeight: "300", letterSpacing: -6 },
    brand: { color: theme.text, fontSize: 31, lineHeight: 35, fontWeight: "700", letterSpacing: 1.8 },
    brandArabic: { color: theme.text, fontSize: 22, lineHeight: 28, fontWeight: "600" },
    eyebrow: { color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 2.1, marginTop: 12 },
    headline: { color: theme.text, fontSize: 31, lineHeight: 40, fontWeight: "800", textAlign: "center", marginTop: 4, maxWidth: 350 },
    subheadline: { color: theme.muted, fontSize: 14, lineHeight: 23, textAlign: "center", maxWidth: 350 },
    proofCard: { flexDirection: "row", alignItems: "stretch", borderWidth: 1, borderColor: theme.border, borderRadius: 24, backgroundColor: theme.surface, overflow: "hidden" },
    proofItem: { flex: 1, minHeight: 96, alignItems: "center", justifyContent: "center", paddingHorizontal: 8, gap: 8 },
    proofDivider: { borderStartWidth: 1, borderStartColor: theme.border },
    proofIcon: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(212,160,23,0.12)" },
    proofIconText: { color: theme.accent, fontSize: 13, fontWeight: "900" },
    proofText: { color: theme.text, fontSize: 9, lineHeight: 14, textAlign: "center", fontWeight: "700" },
    actions: { gap: 10, marginTop: 2 },
    primaryButton: { minHeight: 56, borderRadius: 18, backgroundColor: theme.accent, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, shadowColor: theme.shadow, shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
    primaryButtonText: { color: theme.charcoal, fontSize: 15, fontWeight: "900" },
    primaryArrow: { color: theme.charcoal, fontSize: 18, fontWeight: "900" },
    secondaryButton: { minHeight: 52, borderRadius: 18, borderWidth: 1, borderColor: theme.accent, alignItems: "center", justifyContent: "center", backgroundColor: theme.surface },
    secondaryButtonText: { color: theme.text, fontSize: 14, fontWeight: "800" },
    guestButton: { minHeight: 42, alignItems: "center", justifyContent: "center" },
    guestButtonText: { color: theme.muted, fontSize: 12, fontWeight: "700" },
    footerNote: { color: theme.muted, fontSize: 10, textAlign: "center" },
    pressed: { opacity: 0.74, transform: [{ scale: 0.99 }] },
  });
}
