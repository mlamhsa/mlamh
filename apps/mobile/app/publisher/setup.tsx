import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, ArrowRight, Building2, Check, UserRound } from "lucide-react-native";

import { MOBILE_API_BASE_URL } from "@/lib/api-config";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { darkTheme } from "@/lib/theme";

type PublisherMode = "individual" | "organization";
const TYPES = [
  { value: "production_company", ar: "شركة إنتاج", en: "Production Company" },
  { value: "advertising_agency", ar: "وكالة إعلانية", en: "Advertising Agency" },
  { value: "casting_agency", ar: "كاستينغ", en: "Casting Agency" },
  { value: "talent_agency", ar: "وكالة مواهب", en: "Talent Agency" },
  { value: "brand", ar: "علامة تجارية", en: "Brand" },
  { value: "content_company", ar: "شركة محتوى", en: "Content Company" },
  { value: "other", ar: "أخرى", en: "Other" },
] as const;

export default function PublisherSetupScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const { width } = useWindowDimensions();
  const compact = width <= 360;
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme, compact), [compact, theme]);
  const [mode, setMode] = useState<PublisherMode | null>(null);
  const [publisherType, setPublisherType] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const dirty = mode !== null || publisherType !== null;

  function leaveSetup() {
    if (!dirty || saving) { router.back(); return; }
    Alert.alert(
      isArabic ? "لديك تغييرات غير محفوظة" : "You have unsaved changes",
      isArabic ? "لم يتم حفظ اختيارات هذه الخطوة بعد." : "Your choices on this step have not been saved yet.",
      [
        { text: isArabic ? "إلغاء" : "Cancel", style: "cancel" },
        { text: isArabic ? "الخروج بدون حفظ" : "Leave without saving", style: "destructive", onPress: () => router.back() },
        { text: isArabic ? "حفظ والمتابعة" : "Save & continue", onPress: () => void continueSetup() },
      ],
    );
  }

  async function continueSetup() {
    if (saving) return;
    if (!mode) { setError(isArabic ? "اختر طريقة النشر للمتابعة." : "Choose how you will publish to continue."); return; }
    if (mode === "organization" && !publisherType) { setError(isArabic ? "اختر نوع الجهة للمتابعة." : "Choose the organization type to continue."); return; }
    setSaving(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.replace({ pathname: "/login", params: { next: "/publisher/setup" } });
        return;
      }
      const response = await fetch(`${MOBILE_API_BASE_URL}/api/publisher/onboarding`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ publisherMode: mode, publisherType }),
      });
      const raw = await response.text();
      let result: { ok?: boolean; code?: string } = {};
      try { result = raw ? JSON.parse(raw) as { ok?: boolean; code?: string } : {}; } catch { result = {}; }
      if (!response.ok || !result.ok) {
        if (response.status === 401 || result.code === "UNAUTHENTICATED") {
          router.replace({ pathname: "/login", params: { next: "/publisher/setup" } });
          return;
        }
        setError(result.code === "ACCOUNT_TYPE_CONFLICT"
          ? (isArabic ? "هذا الحساب مرتبط بحساب موهبة ولا يمكن تحويله إلى ناشر." : "This account is already linked to a talent profile.")
          : (isArabic ? "تعذر حفظ إعداد حساب الناشر. حاول مرة أخرى." : "Unable to save the publisher setup. Please try again."));
        return;
      }
      router.replace("/publisher");
    } catch {
      setError(isArabic ? "تعذر الاتصال بملامح الآن. تحقق من الإنترنت وحاول مرة أخرى." : "We couldn't reach MLAMH. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  const textRtl = isRtl ? styles.textRtl : undefined;

  return <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.top, isRtl && styles.rowRtl]}>
        <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={leaveSetup} hitSlop={12} style={styles.backButton}><BackIcon size={21} color={theme.text} strokeWidth={1.9} /></Pressable>
        <Text style={[styles.brand, isArabic && styles.arabicText, textRtl]}>{isArabic ? "ملامح" : "MLAMH"}</Text>
      </View>

      <View style={styles.progressCard}>
        <View style={[styles.progressCopy, isRtl && styles.rowRtl]}><Text style={[styles.progressLabel, textRtl]}>{isArabic ? "إعداد حساب الناشر" : "Publisher setup"}</Text><Text style={styles.progressValue}>1 / 2</Text></View>
        <View style={styles.progressTrack}><View style={styles.progressFill}/></View>
      </View>

      <View style={styles.header}>
        <Text style={[styles.eyebrow, isArabic && styles.arabicText, textRtl]}>{isArabic ? "ابدأ بطريقة واضحة" : "START CLEARLY"}</Text>
        <Text accessibilityRole="header" style={[styles.title, textRtl]}>{isArabic ? "بأي صفة ستستخدم ملامح؟" : "How will you use MLAMH?"}</Text>
        <Text style={[styles.subtitle, textRtl]}>{isArabic ? "اختر الصفة الصحيحة الآن حتى نجهز لك تجربة النشر والاعتماد المناسبة بدون خطوات مربكة." : "Choose the correct publishing identity so we can prepare the right approval and publishing journey."}</Text>
        <Text style={[styles.requiredLegend, textRtl]}><Text style={styles.requiredStar}>*</Text> {isArabic ? "حقل مطلوب" : "Required field"}</Text>
      </View>

      <View>
        <Text style={[styles.fieldLabel, textRtl]}>{isArabic ? "صفة الناشر" : "Publisher identity"} <Text style={styles.requiredStar}>*</Text></Text>
        <View accessibilityRole="radiogroup" style={styles.cards}>
          <ChoiceCard active={mode === "individual"} icon="individual" title={isArabic ? "فرد / مستقل" : "Individual / Freelancer"} body={isArabic ? "أستخدم ملامح بصفتي الشخصية كمستقل أو محترف." : "Use MLAMH under your personal professional identity."} onPress={() => { setMode("individual"); setPublisherType(null); setError(null); }} styles={styles} isRtl={isRtl} />
          <ChoiceCard active={mode === "organization"} icon="organization" title={isArabic ? "شركة / جهة" : "Company / Organization"} body={isArabic ? "أمثل شركة أو وكالة أو علامة تجارية أو جهة." : "Represent a company, agency, brand or organization."} onPress={() => { setMode("organization"); setError(null); }} styles={styles} isRtl={isRtl} />
        </View>
      </View>

      {mode === "organization" ? <View style={styles.typeSection}>
        <Text style={[styles.fieldLabel, textRtl]}>{isArabic ? "نوع الجهة" : "Organization type"} <Text style={styles.requiredStar}>*</Text></Text>
        <Text style={[styles.sectionHint, textRtl]}>{isArabic ? "اختر التصنيف الأقرب لنشاط الجهة." : "Choose the category closest to the organization."}</Text>
        <View accessibilityRole="radiogroup" style={styles.typeList}>
          {TYPES.map((type) => { const active = publisherType === type.value; return <Pressable key={type.value} accessibilityRole="radio" accessibilityLabel={isArabic ? type.ar : type.en} accessibilityState={{ selected: active }} onPress={() => { setPublisherType(type.value); setError(null); }} style={[styles.typeRow, isRtl && styles.rowRtl, active && styles.typeRowActive]}><Text style={[styles.typeText, textRtl, active && styles.typeTextActive]}>{isArabic ? type.ar : type.en}</Text><View style={[styles.checkCircle, active && styles.checkCircleActive]}>{active ? <Check size={14} color={theme.background} strokeWidth={3}/> : null}</View></Pressable>; })}
        </View>
      </View> : null}

      <View style={styles.note}>
        <Text style={[styles.noteTitle, textRtl]}>{isArabic ? "ماذا سيحدث بعد الحفظ؟" : "What happens next?"}</Text>
        <Text style={[styles.noteBody, textRtl]}>{mode === "organization"
          ? (isArabic ? "سنحفظ نوع جهتك ثم تنقلك ملامح إلى ملف الناشر، حيث تكمل بيانات الجهة والتوثيق المطلوب قبل نشر الفرص." : "We'll save your organization type and take you to the publisher profile to complete organization details and verification before publishing opportunities.")
          : (isArabic ? "سنحفظ صفتك كناشر فردي ثم تنقلك ملامح إلى ملفك لاستكمال البيانات المطلوبة قبل نشر الفرص." : "We'll save your individual publisher identity and take you to your profile to complete the required information before publishing opportunities.")}</Text>
      </View>

      {error ? <View style={styles.errorBox}><Text accessibilityRole="alert" style={[styles.error, textRtl]}>{error}</Text></View> : null}
      <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "حفظ ومتابعة" : "Save and continue"} accessibilityState={{ disabled: saving, busy: saving }} disabled={saving} onPress={() => void continueSetup()} style={[styles.button, saving && styles.disabled]}>{saving ? <ActivityIndicator color={theme.background} /> : <Text style={styles.buttonText}>{isArabic ? "حفظ ومتابعة" : "Save & continue"}</Text>}</Pressable>
    </ScrollView>
  </SafeAreaView>;
}

function ChoiceCard({ active, icon, title, body, onPress, styles, isRtl }: { active: boolean; icon: "individual" | "organization"; title: string; body: string; onPress: () => void; styles: ReturnType<typeof createStyles>; isRtl: boolean }) {
  const Icon = icon === "individual" ? UserRound : Building2;
  return <Pressable accessibilityRole="radio" accessibilityLabel={title} accessibilityHint={body} accessibilityState={{ selected: active }} onPress={onPress} style={[styles.choiceCard, active && styles.choiceCardActive, isRtl && styles.rowRtl]}>
    <View style={[styles.choiceIcon, active && styles.choiceIconActive]}><Icon size={20} color={active ? "#C9A962" : "#F5F5F0"} strokeWidth={1.8} /></View>
    <View style={styles.choiceCopy}><Text style={[styles.choiceTitle, isRtl && styles.textRtl]}>{title}</Text><Text style={[styles.choiceBody, isRtl && styles.textRtl]}>{body}</Text></View>
    <View style={[styles.radio, active && styles.radioActive]}>{active ? <View style={styles.radioDot} /> : null}</View>
  </Pressable>;
}

function createStyles(theme: typeof darkTheme, compact: boolean) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, content: { width: "100%", maxWidth: 620, alignSelf: "center", paddingHorizontal: compact ? 14 : 20, paddingTop: compact ? 8 : 10, paddingBottom: compact ? 32 : 46, gap: compact ? 15 : 18 }, rowRtl: { flexDirection: "row-reverse" }, textRtl: { textAlign: "right", writingDirection: "rtl" }, arabicText: { letterSpacing: 0 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 46 }, backButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }, brand: { color: theme.accent, fontSize: compact ? 15 : 17, fontWeight: "800", letterSpacing: 1.1 },
  progressCard: { borderWidth: 1, borderColor: "#C9A96233", borderRadius: 16, backgroundColor: "#C9A96208", padding: 12, gap: 8 }, progressCopy: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, progressLabel: { color: theme.text, fontSize: 11, fontWeight: "800" }, progressValue: { color: theme.accent, fontSize: 11, fontWeight: "900" }, progressTrack: { height: 4, borderRadius: 2, backgroundColor: "#FFFFFF12", overflow: "hidden" }, progressFill: { width: "50%", height: "100%", backgroundColor: theme.accent },
  header: { gap: compact ? 6 : 8 }, eyebrow: { color: theme.accent, fontSize: compact ? 9 : 10, fontWeight: "900", letterSpacing: 1.7 }, title: { color: theme.text, fontSize: compact ? 27 : 31, lineHeight: compact ? 34 : 39, fontWeight: "700" }, subtitle: { color: theme.muted, fontSize: compact ? 12 : 13, lineHeight: compact ? 19 : 21 }, requiredLegend: { color: theme.muted, fontSize: 10, marginTop: 2 }, requiredStar: { color: theme.accent, fontWeight: "900" }, fieldLabel: { color: theme.text, fontSize: 13, fontWeight: "900", marginBottom: 9 }, sectionHint: { color: theme.muted, fontSize: 10, lineHeight: 16, marginTop: -4 },
  cards: { gap: 10 }, choiceCard: { minHeight: compact ? 92 : 104, borderWidth: 1, borderColor: theme.border, borderRadius: 18, backgroundColor: theme.surface, padding: compact ? 12 : 14, flexDirection: "row", alignItems: "center", gap: 11 }, choiceCardActive: { borderColor: theme.accent, backgroundColor: theme.chip }, choiceIcon: { width: 42, height: 42, borderRadius: 13, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" }, choiceIconActive: { borderColor: "#C9A96266", backgroundColor: "#C9A96210" }, choiceCopy: { flex: 1, gap: 4 }, choiceTitle: { color: theme.text, fontSize: compact ? 16 : 18, fontWeight: "800" }, choiceBody: { color: theme.muted, fontSize: compact ? 11 : 12, lineHeight: compact ? 17 : 19 }, radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: theme.muted, alignItems: "center", justifyContent: "center" }, radioActive: { borderColor: theme.accent }, radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.accent },
  typeSection: { gap: 9 }, typeList: { borderWidth: 1, borderColor: theme.border, borderRadius: 17, overflow: "hidden", backgroundColor: theme.surface }, typeRow: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: theme.border }, typeRowActive: { backgroundColor: "#C9A9620B" }, typeText: { flex: 1, color: theme.text, fontSize: 13, fontWeight: "700" }, typeTextActive: { color: theme.accent, fontWeight: "900" }, checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: "#FFFFFF22", alignItems: "center", justifyContent: "center" }, checkCircleActive: { borderColor: theme.accent, backgroundColor: theme.accent },
  note: { borderWidth: 1, borderColor: theme.border, borderRadius: 14, backgroundColor: theme.surface, padding: compact ? 12 : 14, gap: 5 }, noteTitle: { color: theme.accent, fontSize: 11, fontWeight: "800" }, noteBody: { color: theme.muted, fontSize: 11, lineHeight: 18 }, errorBox: { borderWidth: 1, borderColor: "#C84F4F55", backgroundColor: "#C84F4F12", borderRadius: 12, padding: 12 }, error: { color: "#E59A9A", fontSize: 12, lineHeight: 18 }, button: { minHeight: 54, borderRadius: 14, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" }, buttonText: { color: theme.background, fontSize: 14, fontWeight: "900" }, disabled: { opacity: 0.4 },
}); }
