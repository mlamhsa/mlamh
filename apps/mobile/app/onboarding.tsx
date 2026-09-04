import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from "react-native";
import { router } from "expo-router";

import { MOBILE_API_BASE_URL } from "@/lib/api-config";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { darkTheme, lightTheme } from "@/lib/theme";

type TalentType = "actor" | "model";

export default function TalentOnboardingScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const theme = useColorScheme() === "dark" ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [selected, setSelected] = useState<TalentType | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function continueOnboarding() {
    if (!selected || saving) return;
    setSaving(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.replace({ pathname: "/login", params: { next: "/onboarding" } });
        return;
      }
      const response = await fetch(`${MOBILE_API_BASE_URL}/api/talent/onboarding`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ talentType: selected }),
      });
      const result = await response.json() as { ok: boolean; code?: string };
      if (!response.ok || !result.ok) {
        setError(result.code === "ACCOUNT_TYPE_CONFLICT"
          ? (isArabic ? "هذا الحساب مرتبط بنوع حساب آخر." : "This account is linked to another account type.")
          : (isArabic ? "تعذر تجهيز ملف الموهبة. حاول مرة أخرى." : "Unable to prepare your talent profile. Please try again."));
        return;
      }
      router.replace("/profile");
    } catch {
      setError(isArabic ? "تعذر إكمال الإعداد الآن." : "Unable to complete setup right now.");
    } finally {
      setSaving(false);
    }
  }

  return <View style={styles.screen}><ScrollView contentContainerStyle={styles.scrollContent} contentInsetAdjustmentBehavior="automatic"><View style={[styles.content, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]}>
    <View style={styles.header}><Text style={styles.eyebrow}>MLAMH</Text><Text accessibilityRole="header" style={styles.title}>{isArabic ? "ابدأ بملفك" : "Start your profile"}</Text><Text style={styles.subtitle}>{isArabic ? "اختر تخصصك الأساسي الآن. تقدر تطور ملفك وصورك ومهاراتك بعد هذه الخطوة." : "Choose your primary talent type. You can build out your portfolio, photos and skills next."}</Text></View>
    <View accessibilityRole="radiogroup" style={styles.options}>
      <TalentChoice active={selected === "actor"} title={isArabic ? "ممثل" : "Actor"} body={isArabic ? "للتمثيل، الإعلانات والمشاريع المرئية." : "For acting, commercials and screen projects."} onPress={() => setSelected("actor")} styles={styles} />
      <TalentChoice active={selected === "model"} title={isArabic ? "مودل" : "Model"} body={isArabic ? "للتصوير، الحملات والعروض." : "For shoots, campaigns and modeling work."} onPress={() => setSelected("model")} styles={styles} />
    </View>
    {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
    <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "متابعة إلى ملفي" : "Continue to my profile"} accessibilityState={{ disabled: !selected || saving, busy: saving }} disabled={!selected || saving} onPress={() => void continueOnboarding()} style={[styles.primaryButton, (!selected || saving) && styles.disabled]}>
      {saving ? <ActivityIndicator accessibilityLabel={isArabic ? "جارٍ حفظ الاختيار" : "Saving selection"} color="#181818" /> : <Text style={styles.primaryText}>{isArabic ? "متابعة إلى ملفي" : "Continue to my profile"}</Text>}
    </Pressable>
  </View></ScrollView></View>;
}

function TalentChoice({ active, title, body, onPress, styles }: { active: boolean; title: string; body: string; onPress: () => void; styles: ReturnType<typeof createStyles> }) {
  return <Pressable accessibilityRole="radio" accessibilityLabel={title} accessibilityHint={body} accessibilityState={{ selected: active }} onPress={onPress} style={[styles.choice, active && styles.choiceActive]}><View style={styles.choiceTop}><Text style={styles.choiceTitle}>{title}</Text><View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.radio, active && styles.radioActive]} /></View><Text style={styles.choiceBody}>{body}</Text></Pressable>;
}

function createStyles(theme: typeof lightTheme | typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, scrollContent: { flexGrow: 1, justifyContent: "center", paddingVertical: 28 }, content: { width: "100%", paddingHorizontal: 24, paddingTop: 44, paddingBottom: 42, gap: 28 },
  header: { gap: 10 }, eyebrow: { color: theme.accent, fontSize: 12, fontWeight: "800", letterSpacing: 2.2 }, title: { color: theme.text, fontSize: 40, lineHeight: 48, fontWeight: "300" }, subtitle: { color: theme.muted, fontSize: 15, lineHeight: 24 },
  options: { gap: 12 }, choice: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, borderRadius: 24, padding: 20, gap: 8, minHeight: 88 }, choiceActive: { borderColor: theme.accent }, choiceTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, choiceTitle: { color: theme.text, fontSize: 23, fontWeight: "500" }, choiceBody: { color: theme.muted, fontSize: 13, lineHeight: 20 }, radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: theme.border }, radioActive: { borderWidth: 6, borderColor: theme.accent },
  error: { color: "#EF8B8B", fontSize: 13, lineHeight: 20 }, primaryButton: { backgroundColor: theme.accent, borderRadius: 18, minHeight: 52, paddingVertical: 16, alignItems: "center", justifyContent: "center" }, primaryText: { color: "#181818", fontSize: 15, fontWeight: "800" }, disabled: { opacity: 0.45 },
}); }
