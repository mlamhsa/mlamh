import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { getMobileAccountContext } from "@/lib/account";
import { isRtlLocale } from "@/lib/i18n";
import { useAppLocale } from "@/lib/locale-context";
import { supabase } from "@/lib/supabase";
import { darkTheme } from "@/lib/theme";

const BRAND_MARK = require("../assets/app-icon.png");

export default function WelcomeScreen() {
  const { locale, changeLocale, hasChosenLocale } = useAppLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [checking, setChecking] = useState(true);
  const pulse = useRef(new Animated.Value(0.42)).current;
  const reveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(reveal, { toValue: 1, duration: 420, useNativeDriver: true }).start();
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 760, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.42, duration: 760, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse, reveal]);

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
    return <View style={styles.splash}>
      <Animated.View style={[styles.splashMark, { opacity: reveal, transform: [{ translateY: -10 }, { scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }] }]}>
        <View style={styles.splashLogoShell}><Image source={BRAND_MARK} resizeMode="contain" style={styles.splashLogo} /></View>
        <Animated.View style={[styles.splashProgress, { opacity: pulse }]} />
      </Animated.View>
    </View>;
  }

  if (!hasChosenLocale) {
    return <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.languageGate}>
        <View style={styles.languageBrandShell}><Image source={BRAND_MARK} resizeMode="contain" style={styles.languageBrand} /></View>
        <View style={styles.languageCopy}>
          <Text style={styles.languageArabicTitle}>اختر لغتك</Text>
          <Text style={styles.languageEnglishTitle}>Choose your language</Text>
          <Text style={styles.languageHint}>يمكنك تغيير اللغة لاحقًا من الإعدادات · You can change this later in Settings.</Text>
        </View>
        <View style={styles.languageActions}>
          <Pressable accessibilityRole="button" onPress={() => changeLocale("ar")} style={({ pressed }) => [styles.languagePrimary, pressed && styles.pressed]}>
            <View style={styles.languageButtonCopy}><Text style={styles.languagePrimaryTitle}>العربية</Text><Text style={styles.languagePrimarySubtitle}>موصى بها للسعودية</Text></View><Text style={styles.languageArrow}>←</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => changeLocale("en")} style={({ pressed }) => [styles.languageSecondary, pressed && styles.pressed]}>
            <View style={styles.languageButtonCopy}><Text style={styles.languageSecondaryTitle}>English</Text><Text style={styles.languageSecondarySubtitle}>Continue in English</Text></View><Text style={styles.languageSecondaryArrow}>→</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>;
  }

  const textAlign = isRtl ? "right" : "left";
  const horizontalAlign = isRtl ? "flex-end" : "flex-start";

  return <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={[styles.topRow, isRtl && styles.topRowRtl]}>
          <View style={[styles.brandBlock, isRtl && styles.brandBlockRtl]}>
            <Image source={BRAND_MARK} resizeMode="contain" style={styles.brandMark} />
            <View style={styles.brandCopy}><Text style={[styles.platform, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "المواهب والفرص" : "Talent & Opportunities"}</Text><Text style={[styles.market, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "السعودية" : "Saudi Arabia"}</Text></View>
          </View>
          <View accessibilityLabel={isArabic ? "تغيير اللغة" : "Change language"} style={styles.localeSwitch}>
            <Pressable onPress={() => changeLocale("ar")} style={[styles.localeOption, locale === "ar" && styles.localeOptionActive]}><Text style={[styles.localeText, locale === "ar" && styles.localeTextActive, styles.arabicText]}>ع</Text></Pressable>
            <Pressable onPress={() => changeLocale("en")} style={[styles.localeOption, locale === "en" && styles.localeOptionActive]}><Text style={[styles.localeText, locale === "en" && styles.localeTextActive]}>EN</Text></Pressable>
          </View>
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
  splash: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background },
  splashMark: { alignItems: "center", gap: 16 },
  splashLogoShell: { width: 116, height: 116, borderRadius: 34, alignItems: "center", justifyContent: "center" },
  splashLogo: { width: 108, height: 108 },
  splashProgress: { width: 28, height: 2, borderRadius: 2, backgroundColor: theme.accent },
  languageGate: { flex: 1, width: "100%", maxWidth: 560, alignSelf: "center", paddingHorizontal: 24, paddingTop: 56, paddingBottom: 32, justifyContent: "center", gap: 30 },
  languageBrandShell: { width: 76, height: 76, borderRadius: 24, borderWidth: 1, borderColor: "#C9A96233", backgroundColor: "#C9A96208", alignItems: "center", justifyContent: "center", alignSelf: "center" },
  languageBrand: { width: 66, height: 66 },
  languageCopy: { alignItems: "center", gap: 5 },
  languageArabicTitle: { color: theme.text, fontSize: 30, lineHeight: 38, fontWeight: "800", writingDirection: "rtl", textAlign: "center" },
  languageEnglishTitle: { color: theme.text, fontSize: 21, lineHeight: 28, fontWeight: "650", textAlign: "center" },
  languageHint: { color: theme.muted, fontSize: 11, lineHeight: 18, textAlign: "center", marginTop: 6, maxWidth: 370 },
  languageActions: { gap: 11 },
  languagePrimary: { minHeight: 70, borderRadius: 20, backgroundColor: theme.accent, paddingHorizontal: 18, flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", gap: 14 },
  languageSecondary: { minHeight: 68, borderRadius: 20, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14 },
  languageButtonCopy: { flex: 1 },
  languagePrimaryTitle: { color: theme.background, fontSize: 17, fontWeight: "900", textAlign: "right", writingDirection: "rtl" },
  languagePrimarySubtitle: { color: "#1B1B18A6", fontSize: 10, fontWeight: "700", textAlign: "right", writingDirection: "rtl", marginTop: 3 },
  languageSecondaryTitle: { color: theme.text, fontSize: 16, fontWeight: "800" },
  languageSecondarySubtitle: { color: theme.muted, fontSize: 10, marginTop: 3 },
  languageArrow: { color: theme.background, fontSize: 22, fontWeight: "700" },
  languageSecondaryArrow: { color: theme.accent, fontSize: 22, fontWeight: "700" },
  scrollContent: { flexGrow: 1, justifyContent: "center" },
  content: { width: "100%", maxWidth: 560, alignSelf: "center", paddingHorizontal: 22, paddingTop: 18, paddingBottom: 28, gap: 24 },
  topRow: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  topRowRtl: { flexDirection: "row-reverse" },
  brandBlock: { flexDirection: "row", alignItems: "center", gap: 9 },
  brandBlockRtl: { flexDirection: "row-reverse" },
  brandMark: { width: 40, height: 40 },
  brandCopy: { gap: 1 },
  platform: { color: theme.text, fontSize: 11, lineHeight: 16, fontWeight: "800" },
  market: { color: theme.muted, fontSize: 9, lineHeight: 13, fontWeight: "600" },
  localeSwitch: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, borderRadius: 18, padding: 3, gap: 2 },
  localeOption: { minWidth: 35, height: 30, paddingHorizontal: 8, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  localeOptionActive: { backgroundColor: "#C9A9621F", borderWidth: 1, borderColor: "#C9A96266" },
  localeText: { color: theme.muted, fontSize: 11, fontWeight: "800" },
  localeTextActive: { color: theme.accent },
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
