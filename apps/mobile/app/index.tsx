import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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
      if (account?.type === "publisher") { router.replace("/publisher"); return; }
      if (account?.type === "talent") {
        if (account.onboardingStatus !== "completed" || !account.entityId) { router.replace("/onboarding"); return; }
        router.replace("/opportunities"); return;
      }
      router.replace("/onboarding");
    })();
    return () => { active = false; };
  }, []);

  if (checking) return <View style={styles.centered}><Text style={[styles.loadingBrand, isArabic && styles.arabicText]}>{isArabic ? "ملامح" : "MLAMH"}</Text><ActivityIndicator size="small" color={theme.accent} /></View>;

  const textAlign = isRtl ? "right" : "left";
  return <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
    <View style={[styles.content, { direction: isRtl ? "rtl" : "ltr" }]}>
      <View style={[styles.topRow, isRtl && styles.topRowRtl]}><Text style={[styles.brand, isArabic && styles.arabicText]}>{isArabic ? "ملامح" : "MLAMH"}</Text><Text style={[styles.platform, isArabic && styles.arabicText]}>{isArabic ? "المواهب والفرص" : "Talent & Opportunities"}</Text></View>

      <View style={styles.hero}>
        <Text style={[styles.kicker, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "منصة للمواهب وصنّاع الفرص" : "FOR TALENT. FOR OPPORTUNITY."}</Text>
        <Text accessibilityRole="header" style={[styles.headline, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "ابدأ من ملف مهني.\nووصل للفرصة المناسبة." : "Build your profile.\nReach the right opportunity."}</Text>
        <Text style={[styles.subheadline, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "اكتشف الفرص، قدّم من التطبيق، وتواصل بعد القبول ضمن تجربة بسيطة وواضحة." : "Discover opportunities, apply from the app, and connect after acceptance through one clear experience."}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.valueGrid}>
        <ValueItem number="01" title={isArabic ? "اكتشف" : "Discover"} body={isArabic ? "فرص مناسبة لتخصصك" : "Relevant opportunities for your talent"} styles={styles} isArabic={isArabic} align={textAlign} />
        <ValueItem number="02" title={isArabic ? "قدّم" : "Apply"} body={isArabic ? "بطلب واضح من ملفك" : "Apply directly from your profile"} styles={styles} isArabic={isArabic} align={textAlign} />
        <ValueItem number="03" title={isArabic ? "تواصل" : "Connect"} body={isArabic ? "بعد القبول فقط" : "Messaging unlocks after acceptance"} styles={styles} isArabic={isArabic} align={textAlign} />
      </View>

      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={() => router.push("/signup")} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={[styles.primaryButtonText, isArabic && styles.arabicText]}>{isArabic ? "إنشاء حساب موهبة" : "Create talent account"}</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push("/login")} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={[styles.secondaryButtonText, isArabic && styles.arabicText]}>{isArabic ? "تسجيل الدخول" : "Sign in"}</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push("/opportunities")} style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}><Text style={[styles.textButtonText, isArabic && styles.arabicText]}>{isArabic ? "استكشف الفرص بدون تسجيل" : "Explore opportunities without signing in"}</Text></Pressable>
      </View>

      <Text style={[styles.footer, isArabic && styles.arabicText]}>{isArabic ? "الانضمام والتقديم على الفرص مجاني" : "Free to join and apply to opportunities"}</Text>
    </View>
  </ScrollView>;
}

function ValueItem({ number, title, body, styles, isArabic, align }: { number: string; title: string; body: string; styles: ReturnType<typeof createStyles>; isArabic: boolean; align: "left" | "right" }) {
  return <View style={styles.valueItem}><Text style={styles.valueNumber}>{number}</Text><Text style={[styles.valueTitle, isArabic && styles.arabicText, { textAlign: align }]}>{title}</Text><Text style={[styles.valueBody, isArabic && styles.arabicText, { textAlign: align }]}>{body}</Text></View>;
}

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, backgroundColor: theme.background }, loadingBrand: { color: theme.accent, fontSize: 19, fontWeight: "800", letterSpacing: 1.4 },
  scrollContent: { flexGrow: 1, justifyContent: "center", paddingVertical: Platform.OS === "ios" ? 24 : 20 }, content: { width: "100%", maxWidth: 560, alignSelf: "center", paddingHorizontal: 24, paddingTop: 34, paddingBottom: 32, gap: 28 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 }, topRowRtl: { flexDirection: "row-reverse" }, brand: { color: theme.accent, fontSize: 20, fontWeight: "800", letterSpacing: 1.2 }, platform: { color: theme.muted, fontSize: 11, fontWeight: "600" },
  hero: { gap: 13, paddingTop: 24 }, kicker: { color: theme.accent, fontSize: 11, lineHeight: 16, fontWeight: "800", letterSpacing: 1.7 }, headline: { color: theme.text, fontSize: 39, lineHeight: 47, fontWeight: "700", maxWidth: 500 }, subheadline: { color: theme.muted, fontSize: 15, lineHeight: 24, maxWidth: 470 }, divider: { height: 1, backgroundColor: theme.border },
  valueGrid: { gap: 0, borderTopWidth: 1, borderTopColor: theme.border, borderBottomWidth: 1, borderBottomColor: theme.border }, valueItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border, gap: 3 }, valueNumber: { color: theme.accent, fontSize: 10, fontWeight: "800", letterSpacing: 1.3 }, valueTitle: { color: theme.text, fontSize: 16, lineHeight: 22, fontWeight: "700" }, valueBody: { color: theme.muted, fontSize: 12, lineHeight: 18 },
  actions: { gap: 10 }, primaryButton: { minHeight: 52, borderRadius: 12, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }, primaryButtonText: { color: theme.background, fontSize: 15, fontWeight: "800" }, secondaryButton: { minHeight: 50, borderRadius: 12, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }, secondaryButtonText: { color: theme.text, fontSize: 14, fontWeight: "700" }, textButton: { minHeight: 42, alignItems: "center", justifyContent: "center" }, textButtonText: { color: theme.muted, fontSize: 12, fontWeight: "600", textAlign: "center" }, footer: { color: theme.muted, fontSize: 10, textAlign: "center" }, pressed: { opacity: 0.72 }, arabicText: { letterSpacing: 0 },
}); }
