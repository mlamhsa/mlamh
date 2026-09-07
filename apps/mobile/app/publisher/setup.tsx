import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, ArrowRight, Building2, UserRound } from "lucide-react-native";

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

  async function continueSetup() {
    if (!mode || (mode === "organization" && !publisherType) || saving) return;
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
          : (isArabic ? "تعذر إعداد حساب الناشر. حاول مرة أخرى." : "Unable to set up the publisher account. Please try again."));
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

  return <SafeAreaView style={styles.screen} edges={["top"]}>
    <ScrollView contentContainerStyle={[styles.content, { direction: isRtl ? "rtl" : "ltr" }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.top, isRtl && styles.rowRtl]}>
        <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} hitSlop={12} style={styles.backButton}><BackIcon size={21} color={theme.text} strokeWidth={1.9} /></Pressable>
        <Text style={[styles.brand, isArabic && styles.arabicText, textRtl]}>{isArabic ? "ملامح" : "MLAMH"}</Text>
      </View>

      <View style={styles.header}>
        <Text style={[styles.eyebrow, isArabic && styles.arabicText, textRtl]}>{isArabic ? "إعداد الناشر" : "PUBLISHER SETUP"}</Text>
        <Text accessibilityRole="header" style={[styles.title, textRtl]}>{isArabic ? "كيف ستنشر على ملامح؟" : "How will you publish on MLAMH?"}</Text>
        <Text style={[styles.subtitle, textRtl]}>{isArabic ? "اختر إذا كنت تنشر بصفتك الشخصية أو نيابة عن شركة أو جهة." : "Choose whether you publish personally or on behalf of an organization."}</Text>
      </View>

      <View accessibilityRole="radiogroup" style={styles.cards}>
        <ChoiceCard active={mode === "individual"} icon="individual" title={isArabic ? "فرد / مستقل" : "Individual / Freelancer"} body={isArabic ? "أنشر الفرص باسمي الشخصي كمستقل أو محترف." : "Publish opportunities under your personal professional identity."} onPress={() => { setMode("individual"); setPublisherType(null); }} styles={styles} isRtl={isRtl} />
        <ChoiceCard active={mode === "organization"} icon="organization" title={isArabic ? "شركة / جهة" : "Company / Organization"} body={isArabic ? "أنشر الفرص نيابة عن شركة أو وكالة أو علامة تجارية أو جهة." : "Publish opportunities on behalf of a company, agency, brand or organization."} onPress={() => setMode("organization")} styles={styles} isRtl={isRtl} />
      </View>

      {mode === "organization" ? <View style={styles.typeSection}>
        <Text style={[styles.sectionTitle, textRtl]}>{isArabic ? "نوع الجهة" : "Organization type"}</Text>
        <View accessibilityRole="radiogroup" style={[styles.typeGrid, isRtl && styles.typeGridRtl]}>
          {TYPES.map((type) => <Pressable key={type.value} accessibilityRole="radio" accessibilityLabel={isArabic ? type.ar : type.en} accessibilityState={{ selected: publisherType === type.value }} onPress={() => setPublisherType(type.value)} style={[styles.typeChip, publisherType === type.value && styles.typeChipActive]}><Text style={[styles.typeText, publisherType === type.value && styles.typeTextActive, isArabic && styles.arabicText]}>{isArabic ? type.ar : type.en}</Text></Pressable>)}
        </View>
      </View> : null}

      <View style={styles.note}>
        <Text style={[styles.noteTitle, textRtl]}>{isArabic ? "قبل نشر الفرص" : "Before publishing"}</Text>
        <Text style={[styles.noteBody, textRtl]}>{mode === "organization" ? (isArabic ? "حساب الجهة يحتاج الاعتماد والتوثيق وفق قواعد ملامح قبل إرسال الفرص للمراجعة." : "Organization accounts require approval and verification under MLAMH rules before opportunities can be submitted for review.") : (isArabic ? "حساب الناشر يحتاج الاعتماد قبل إنشاء ونشر الفرص." : "Publisher approval is required before creating and publishing opportunities.")}</Text>
      </View>

      {error ? <View style={styles.errorBox}><Text accessibilityRole="alert" style={[styles.error, textRtl]}>{error}</Text></View> : null}
      <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "إكمال إعداد الناشر" : "Complete publisher setup"} accessibilityState={{ disabled: !mode || (mode === "organization" && !publisherType) || saving, busy: saving }} disabled={!mode || (mode === "organization" && !publisherType) || saving} onPress={() => void continueSetup()} style={[styles.button, (!mode || (mode === "organization" && !publisherType) || saving) && styles.disabled]}>{saving ? <ActivityIndicator color={theme.background} /> : <Text style={styles.buttonText}>{isArabic ? "إكمال الإعداد" : "Complete setup"}</Text>}</Pressable>
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
  screen: { flex: 1, backgroundColor: theme.background },
  content: { width: "100%", maxWidth: 620, alignSelf: "center", paddingHorizontal: compact ? 14 : 20, paddingTop: compact ? 8 : 10, paddingBottom: compact ? 32 : 46, gap: compact ? 15 : 18 },
  rowRtl: { flexDirection: "row-reverse" },
  textRtl: { textAlign: "right", writingDirection: "rtl" },
  arabicText: { letterSpacing: 0 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 46 },
  backButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" },
  brand: { color: theme.accent, fontSize: compact ? 15 : 17, fontWeight: "800", letterSpacing: 1.1 },
  header: { gap: compact ? 6 : 8 },
  eyebrow: { color: theme.accent, fontSize: compact ? 9 : 10, fontWeight: "900", letterSpacing: 1.7 },
  title: { color: theme.text, fontSize: compact ? 27 : 31, lineHeight: compact ? 34 : 39, fontWeight: "700" },
  subtitle: { color: theme.muted, fontSize: compact ? 12 : 13, lineHeight: compact ? 19 : 21 },
  cards: { gap: 10 },
  choiceCard: { minHeight: compact ? 92 : 104, borderWidth: 1, borderColor: theme.border, borderRadius: 18, backgroundColor: theme.surface, padding: compact ? 12 : 14, flexDirection: "row", alignItems: "center", gap: 11 },
  choiceCardActive: { borderColor: theme.accent, backgroundColor: theme.chip },
  choiceIcon: { width: 42, height: 42, borderRadius: 13, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" },
  choiceIconActive: { borderColor: "#C9A96266", backgroundColor: "#C9A96210" },
  choiceCopy: { flex: 1, gap: 4 },
  choiceTitle: { color: theme.text, fontSize: compact ? 16 : 18, fontWeight: "800" },
  choiceBody: { color: theme.muted, fontSize: compact ? 11 : 12, lineHeight: compact ? 17 : 19 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: theme.muted, alignItems: "center", justifyContent: "center" },
  radioActive: { borderColor: theme.accent },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.accent },
  typeSection: { gap: 10 },
  sectionTitle: { color: theme.text, fontSize: 14, fontWeight: "800" },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeGridRtl: { flexDirection: "row-reverse" },
  typeChip: { minHeight: 42, borderWidth: 1, borderColor: theme.border, borderRadius: 999, paddingHorizontal: compact ? 11 : 13, paddingVertical: 8, backgroundColor: theme.surface, justifyContent: "center" },
  typeChipActive: { borderColor: theme.accent, backgroundColor: theme.chip },
  typeText: { color: theme.muted, fontSize: compact ? 10 : 11, fontWeight: "700" },
  typeTextActive: { color: theme.text },
  note: { borderWidth: 1, borderColor: theme.border, borderRadius: 14, backgroundColor: theme.surface, padding: compact ? 12 : 14, gap: 5 },
  noteTitle: { color: theme.accent, fontSize: 11, fontWeight: "800" },
  noteBody: { color: theme.muted, fontSize: 11, lineHeight: 18 },
  errorBox: { borderWidth: 1, borderColor: "#C84F4F55", backgroundColor: "#C84F4F12", borderRadius: 12, padding: 12 },
  error: { color: "#E59A9A", fontSize: 12, lineHeight: 18 },
  button: { minHeight: 52, borderRadius: 13, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" },
  buttonText: { color: theme.background, fontSize: 14, fontWeight: "900" },
  disabled: { opacity: 0.4 },
}); }
