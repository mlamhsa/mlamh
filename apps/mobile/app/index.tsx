import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { getMobileAccountContext } from "@/lib/account";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { darkTheme } from "@/lib/theme";

export default function WelcomeScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      if (!session) { setChecking(false); return; }
      const account = await getMobileAccountContext().catch(() => null);
      if (!active) return;
      if (account?.type === "publisher") {
        router.replace(account.onboardingStatus === "completed" && account.entityId ? "/publisher" : "/publisher/setup");
        return;
      }
      if (account?.type === "talent") {
        router.replace(account.onboardingStatus === "completed" && account.entityId ? "/opportunities" : "/onboarding");
        return;
      }
      router.replace(session.user.user_metadata?.account_type === "publisher" ? "/publisher/setup" : "/onboarding");
    })();
    return () => { active = false; };
  }, []);

  if (checking) {
    return <View style={styles.centered}><Text style={[styles.loadingBrand, isArabic && styles.arabicText]}>{isArabic ? "ملامح" : "MLAMH"}</Text><ActivityIndicator size="small" color={theme.accent} /></View>;
  }

  const textAlign = isRtl ? "right" : "left";
  const horizontalAlign = isRtl ? "flex-end" : "flex-start";

  return <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={[styles.topRow, isRtl && styles.topRowRtl]}>
          <Text style={[styles.brand, isArabic && styles.arabicText]}>{isArabic ? "ملامح" : "MLAMH"}</Text>
          <Text style={[styles.platform, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "المواهب والفرص" : "Talent & Opportunities"}</Text>
        </View>

        <View style={[styles.hero, { alignItems: horizontalAlign }]}>
          <Text style={[styles.kicker, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "منصة للمواهب وصنّاع الفرص" : "TALENT MEETS OPPORTUNITY"}</Text>
          <Text accessibilityRole="header" style={[styles.headline, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "ملف احترافي. فرص حقيقية. تواصل في الوقت الصحيح." : "Professional profiles. Real opportunities. The right connection."}</Text>
          <Text style={[styles.subheadline, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "اكتشف الفرص، قدّم من ملفك، وتواصل بعد القبول ضمن تجربة واحدة واضحة." : "Discover, apply from your profile, and connect after acceptance in one clear experience."}</Text>
        </View>

        <View style={styles.valueGrid}>
          <ValueItem number="01" title={isArabic ? "اكتشف" : "Discover"} body={isArabic ? "فرصًا مناسبة بدون تعقيد" : "Relevant opportunities without friction"} styles={styles} isArabic={isArabic} isRtl={isRtl} />
          <ValueItem number="02" title={isArabic ? "قدّم" : "Apply"} body={isArabic ? "من ملف مهني موحد" : "From one professional profile"} styles={styles} isArabic={isArabic} isRtl={isRtl} />
          <ValueItem number="03" title={isArabic ? "تواصل" : "Connect"} body={isArabic ? "بعد القبول لحماية الطرفين" : "After acceptance, for both sides"} styles={styles} isArabic={isArabic} isRtl={isRtl} />
        </View>

        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={() => router.push("/signup")} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={[styles.primaryButtonText, isArabic && styles.arabicText]}>{isArabic ? "إنشاء حساب" : "Create account"}</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push("/opportunities")} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={[styles.secondaryButtonText, isArabic && styles.arabicText]}>{isArabic ? "استكشف الفرص" : "Explore opportunities"}</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push("/login")} style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}><Text style={[styles.textButtonText, isArabic && styles.arabicText]}>{isArabic ? "لديك حساب؟ تسجيل الدخول" : "Already have an account? Sign in"}</Text></Pressable>
        </View>
      </View>
    </ScrollView>
  </SafeAreaView>;
}

function ValueItem({ number, title, body, styles, isArabic, isRtl }: { number: string; title: string; body: string; styles: ReturnType<typeof createStyles>; isArabic: boolean; isRtl: boolean }) {
  const textAlign = isRtl ? "right" : "left";
  return <View style={[styles.valueItem, { alignItems: isRtl ? "flex-end" : "flex-start" }]}>
    <Text style={[styles.valueNumber, isRtl && styles.valueNumberRtl]}>{number}</Text>
    <Text style={[styles.valueTitle, isArabic && styles.arabicText, { textAlign }]}>{title}</Text>
    <Text style={[styles.valueBody, isArabic && styles.arabicText, { textAlign }]}>{body}</Text>
  </View>;
}

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, backgroundColor: theme.background },
  loadingBrand: { color: theme.accent, fontSize: 19, fontWeight: "800", letterSpacing: 1.4 },
  scrollContent: { flexGrow: 1, justifyContent: "center" },
  content: { width: "100%", maxWidth: 560, alignSelf: "center", paddingHorizontal: 22, paddingTop: 18, paddingBottom: 28, gap: 24 },
  topRow: { minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  topRowRtl: { flexDirection: "row-reverse" },
  brand: { color: theme.accent, fontSize: 21, fontWeight: "800", letterSpacing: 1.2 },
  platform: { color: theme.muted, fontSize: 11, fontWeight: "600" },
  hero: { gap: 10, paddingTop: 8 },
  kicker: { color: theme.accent, fontSize: 11, lineHeight: 16, fontWeight: "800", letterSpacing: 1.5 },
  headline: { color: theme.text, fontSize: 35, lineHeight: 43, fontWeight: "700", maxWidth: 510 },
  subheadline: { color: theme.muted, fontSize: 15, lineHeight: 24, maxWidth: 480 },
  valueGrid: { borderTopWidth: 1, borderTopColor: theme.border, borderBottomWidth: 1, borderBottomColor: theme.border },
  valueItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: theme.border, gap: 4 },
  valueNumber: { color: theme.accent, fontSize: 10, fontWeight: "800", letterSpacing: 1.3 },
  valueNumberRtl: { letterSpacing: 1.3, writingDirection: "ltr" },
  valueTitle: { color: theme.text, fontSize: 17, lineHeight: 23, fontWeight: "700" },
  valueBody: { color: theme.muted, fontSize: 12, lineHeight: 18 },
  actions: { gap: 10 },
  primaryButton: { minHeight: 54, borderRadius: 14, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  primaryButtonText: { color: theme.background, fontSize: 15, fontWeight: "900" },
  secondaryButton: { minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  secondaryButtonText: { color: theme.text, fontSize: 14, fontWeight: "700" },
  textButton: { minHeight: 40, alignItems: "center", justifyContent: "center" },
  textButtonText: { color: theme.muted, fontSize: 12, fontWeight: "600", textAlign: "center" },
  pressed: { opacity: 0.72 },
  arabicText: { letterSpacing: 0, writingDirection: "rtl" },
}); }
