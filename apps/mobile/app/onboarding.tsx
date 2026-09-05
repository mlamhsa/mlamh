import { useMemo, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { MOBILE_API_BASE_URL } from "@/lib/api-config";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { darkTheme } from "@/lib/theme";

type TalentType = "actor" | "model";
type OnboardingResult = { ok?: boolean; code?: string };

export default function TalentOnboardingScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const theme = darkTheme;
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

      const raw = await response.text();
      let result: OnboardingResult = {};
      try { result = raw ? JSON.parse(raw) as OnboardingResult : {}; } catch { result = {}; }

      if (!response.ok || !result.ok) {
        if (response.status === 401 || result.code === "UNAUTHENTICATED") {
          await supabase.auth.refreshSession().catch(() => undefined);
          setError(isArabic ? "انتهت جلسة الدخول. سجّل الدخول مرة أخرى للمتابعة." : "Your session expired. Sign in again to continue.");
          return;
        }
        setError(result.code === "ACCOUNT_TYPE_CONFLICT"
          ? (isArabic ? "هذا الحساب مرتبط بنوع حساب آخر." : "This account is linked to another account type.")
          : (isArabic ? "تعذر حفظ نوع الموهبة. حاول مرة أخرى." : "We couldn't save your talent type. Please try again."));
        return;
      }
      router.replace("/profile");
    } catch {
      setError(isArabic ? "تعذر الاتصال بملامح الآن. تحقق من الإنترنت وحاول مرة أخرى." : "We couldn't reach MLAMH. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return <View style={styles.screen}>
    <ScrollView contentContainerStyle={styles.scrollContent} contentInsetAdjustmentBehavior="automatic">
      <View style={[styles.content, { direction: isRtl ? "rtl" : "ltr" }]}>
        <View style={styles.brandRow}><Text style={[styles.brand, isArabic && styles.arabicText]}>{isArabic ? "ملامح" : "MLAMH"}</Text></View>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={[styles.title, isArabic && styles.arabicText, { textAlign: isRtl ? "right" : "left" }]}>{isArabic ? "اختر تخصصك الأساسي" : "Choose your primary talent type"}</Text>
          <Text style={[styles.subtitle, isArabic && styles.arabicText, { textAlign: isRtl ? "right" : "left" }]}>{isArabic ? "ابدأ بتخصص واحد الآن. تقدر تكمل صورك ومهاراتك وبيانات ملفك في الخطوة التالية." : "Start with one talent type. You can complete your photos, skills and profile details next."}</Text>
        </View>
        <View accessibilityRole="radiogroup" style={styles.options}>
          <TalentChoice active={selected === "actor"} title={isArabic ? "ممثل" : "Actor"} body={isArabic ? "تمثيل، إعلانات ومشاريع مرئية" : "Acting, commercials and screen projects"} onPress={() => setSelected("actor")} styles={styles} isArabic={isArabic} isRtl={isRtl} />
          <TalentChoice active={selected === "model"} title={isArabic ? "مودل" : "Model"} body={isArabic ? "تصوير، حملات وعروض" : "Shoots, campaigns and modeling work"} onPress={() => setSelected("model")} styles={styles} isArabic={isArabic} isRtl={isRtl} />
        </View>
        {error ? <View style={styles.errorBox}><Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.error, isArabic && styles.arabicText, { textAlign: isRtl ? "right" : "left" }]}>{error}</Text></View> : null}
        <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "متابعة إلى ملفي" : "Continue to my profile"} accessibilityState={{ disabled: !selected || saving, busy: saving }} disabled={!selected || saving} onPress={() => void continueOnboarding()} style={({ pressed }) => [styles.primaryButton, (!selected || saving) && styles.disabled, pressed && selected && !saving && styles.pressed]}>
          {saving ? <ActivityIndicator accessibilityLabel={isArabic ? "جارٍ حفظ الاختيار" : "Saving selection"} color={theme.background} /> : <Text style={[styles.primaryText, isArabic && styles.arabicText]}>{isArabic ? "متابعة" : "Continue"}</Text>}
        </Pressable>
        <Text style={[styles.footnote, isArabic && styles.arabicText]}>{isArabic ? "يمكنك تحديث بيانات ملفك لاحقًا" : "You can update your profile details later"}</Text>
      </View>
    </ScrollView>
  </View>;
}

function TalentChoice({ active, title, body, onPress, styles, isArabic, isRtl }: { active: boolean; title: string; body: string; onPress: () => void; styles: ReturnType<typeof createStyles>; isArabic: boolean; isRtl: boolean }) {
  return <Pressable accessibilityRole="radio" accessibilityLabel={title} accessibilityHint={body} accessibilityState={{ selected: active }} onPress={onPress} style={({ pressed }) => [styles.choice, active && styles.choiceActive, pressed && styles.choicePressed]}>
    <View style={[styles.choiceTop, isRtl && styles.choiceTopRtl]}>
      <View style={styles.choiceCopy}><Text style={[styles.choiceTitle, isArabic && styles.arabicText, { textAlign: isRtl ? "right" : "left" }]}>{title}</Text><Text style={[styles.choiceBody, isArabic && styles.arabicText, { textAlign: isRtl ? "right" : "left" }]}>{body}</Text></View>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.radio, active && styles.radioActive]}>{active ? <View style={styles.radioDot} /> : null}</View>
    </View>
  </Pressable>;
}

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  scrollContent: { flexGrow: 1, justifyContent: "center", paddingVertical: Platform.OS === "ios" ? 24 : 20 },
  content: { width: "100%", maxWidth: 520, alignSelf: "center", paddingHorizontal: 24, paddingTop: 30, paddingBottom: 34, gap: 24 },
  brandRow: { alignItems: "flex-start" }, brand: { color: theme.accent, fontSize: 18, lineHeight: 24, fontWeight: "800", letterSpacing: 1.2 },
  header: { gap: 9 }, title: { color: theme.text, fontSize: 31, lineHeight: 38, fontWeight: "700" }, subtitle: { color: theme.muted, fontSize: 14, lineHeight: 22, maxWidth: 430 },
  options: { gap: 10 }, choice: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, borderRadius: 16, paddingHorizontal: 17, paddingVertical: 16, minHeight: 78 }, choiceActive: { borderColor: theme.accent, backgroundColor: theme.surfaceElevated }, choicePressed: { opacity: 0.82 }, choiceTop: { flexDirection: "row", alignItems: "center", gap: 14 }, choiceTopRtl: { flexDirection: "row-reverse" }, choiceCopy: { flex: 1, gap: 4 }, choiceTitle: { color: theme.text, fontSize: 18, lineHeight: 24, fontWeight: "700" }, choiceBody: { color: theme.muted, fontSize: 13, lineHeight: 19 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" }, radioActive: { borderColor: theme.accent }, radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.accent },
  errorBox: { borderWidth: 1, borderColor: "#C84F4F66", backgroundColor: "#C84F4F14", borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11 }, error: { color: "#E59A9A", fontSize: 13, lineHeight: 19 },
  primaryButton: { backgroundColor: theme.accent, borderRadius: 12, minHeight: 52, paddingHorizontal: 18, alignItems: "center", justifyContent: "center" }, primaryText: { color: theme.background, fontSize: 15, fontWeight: "800" }, disabled: { opacity: 0.38 }, pressed: { opacity: 0.8 },
  footnote: { color: theme.muted, fontSize: 11, lineHeight: 17, textAlign: "center" }, arabicText: { letterSpacing: 0 },
}); }
