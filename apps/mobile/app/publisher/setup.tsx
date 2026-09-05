import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

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
  const locale = getDeviceLocale(); const isArabic = locale === "ar"; const isRtl = isRtlLocale(locale); const theme = darkTheme; const styles = useMemo(() => createStyles(theme), [theme]);
  const [mode, setMode] = useState<PublisherMode | null>(null); const [publisherType, setPublisherType] = useState<string | null>(null); const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null);

  async function continueSetup() {
    if (!mode || (mode === "organization" && !publisherType) || saving) return;
    setSaving(true); setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { router.replace({ pathname: "/login", params: { next: "/publisher/setup" } }); return; }
      const response = await fetch(`${MOBILE_API_BASE_URL}/api/publisher/onboarding`, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ publisherMode: mode, publisherType }) });
      const raw = await response.text(); let result: { ok?: boolean; code?: string } = {};
      try { result = raw ? JSON.parse(raw) as { ok?: boolean; code?: string } : {}; } catch { result = {}; }
      if (!response.ok || !result.ok) {
        if (response.status === 401 || result.code === "UNAUTHENTICATED") { router.replace({ pathname: "/login", params: { next: "/publisher/setup" } }); return; }
        setError(result.code === "ACCOUNT_TYPE_CONFLICT" ? (isArabic ? "هذا الحساب مرتبط بحساب موهبة ولا يمكن تحويله إلى ناشر." : "This account is already linked to a talent profile.") : (isArabic ? "تعذر إعداد حساب الناشر. حاول مرة أخرى." : "Unable to set up the publisher account. Please try again."));
        return;
      }
      router.replace("/publisher");
    } catch { setError(isArabic ? "تعذر الاتصال بملامح الآن. تحقق من الإنترنت وحاول مرة أخرى." : "We couldn't reach MLAMH. Check your connection and try again."); }
    finally { setSaving(false); }
  }

  return <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { direction: isRtl ? "rtl" : "ltr" }]}>
    <View style={styles.top}><Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} hitSlop={12} style={styles.backButton}><Text style={styles.back}>{isRtl ? "›" : "‹"}</Text></Pressable><Text style={styles.brand}>{isArabic ? "ملامح" : "MLAMH"}</Text></View>
    <View style={styles.header}><Text style={styles.eyebrow}>{isArabic ? "إعداد الناشر" : "PUBLISHER SETUP"}</Text><Text accessibilityRole="header" style={styles.title}>{isArabic ? "كيف ستنشر على ملامح؟" : "How will you publish on MLAMH?"}</Text><Text style={styles.subtitle}>{isArabic ? "اختر إذا كنت تنشر بصفتك الشخصية أو نيابة عن شركة أو جهة." : "Choose whether you publish personally or on behalf of an organization."}</Text></View>
    <View accessibilityRole="radiogroup" style={styles.cards}><ChoiceCard active={mode === "individual"} title={isArabic ? "فرد / مستقل" : "Individual / Freelancer"} body={isArabic ? "أنشر الفرص باسمي الشخصي كمستقل أو محترف." : "Publish opportunities under your personal professional identity."} onPress={() => { setMode("individual"); setPublisherType(null); }} styles={styles} /><ChoiceCard active={mode === "organization"} title={isArabic ? "شركة / جهة" : "Company / Organization"} body={isArabic ? "أنشر الفرص نيابة عن شركة أو وكالة أو علامة تجارية أو جهة." : "Publish opportunities on behalf of a company, agency, brand or organization."} onPress={() => setMode("organization")} styles={styles} /></View>
    {mode === "organization" ? <View style={styles.typeSection}><Text style={styles.sectionTitle}>{isArabic ? "نوع الجهة" : "Organization type"}</Text><View accessibilityRole="radiogroup" style={styles.typeGrid}>{TYPES.map((type) => <Pressable key={type.value} accessibilityRole="radio" accessibilityLabel={isArabic ? type.ar : type.en} accessibilityState={{ selected: publisherType === type.value }} onPress={() => setPublisherType(type.value)} style={[styles.typeChip, publisherType === type.value && styles.typeChipActive]}><Text style={[styles.typeText, publisherType === type.value && styles.typeTextActive]}>{isArabic ? type.ar : type.en}</Text></Pressable>)}</View></View> : null}
    <View style={styles.note}><Text style={styles.noteTitle}>{isArabic ? "قبل نشر الفرص" : "Before publishing"}</Text><Text style={styles.noteBody}>{mode === "organization" ? (isArabic ? "حساب الجهة يحتاج الاعتماد والتوثيق وفق قواعد ملامح قبل إرسال الفرص للمراجعة." : "Organization accounts require approval and verification under MLAMH rules before opportunities can be submitted for review.") : (isArabic ? "حساب الناشر يحتاج الاعتماد قبل إنشاء ونشر الفرص." : "Publisher approval is required before creating and publishing opportunities.")}</Text></View>
    {error ? <View style={styles.errorBox}><Text accessibilityRole="alert" style={styles.error}>{error}</Text></View> : null}
    <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "إكمال إعداد الناشر" : "Complete publisher setup"} accessibilityState={{ disabled: !mode || (mode === "organization" && !publisherType) || saving, busy: saving }} disabled={!mode || (mode === "organization" && !publisherType) || saving} onPress={() => void continueSetup()} style={[styles.button, (!mode || (mode === "organization" && !publisherType) || saving) && styles.disabled]}>{saving ? <ActivityIndicator color={theme.background} /> : <Text style={styles.buttonText}>{isArabic ? "إكمال الإعداد" : "Complete setup"}</Text>}</Pressable>
  </ScrollView>;
}

function ChoiceCard({ active, title, body, onPress, styles }: { active: boolean; title: string; body: string; onPress: () => void; styles: ReturnType<typeof createStyles> }) { return <Pressable accessibilityRole="radio" accessibilityLabel={title} accessibilityHint={body} accessibilityState={{ selected: active }} onPress={onPress} style={[styles.choiceCard, active && styles.choiceCardActive]}><Text style={styles.choiceTitle}>{title}</Text><Text style={styles.choiceBody}>{body}</Text></Pressable>; }
function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, content: { width: "100%", maxWidth: 620, alignSelf: "center", paddingHorizontal: 20, paddingTop: 48, paddingBottom: 58, gap: 20 }, top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, backButton: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }, back: { color: theme.text, fontSize: 30, lineHeight: 34 }, brand: { color: theme.accent, fontSize: 17, fontWeight: "800", letterSpacing: 1.1 }, header: { gap: 8 }, eyebrow: { color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.7 }, title: { color: theme.text, fontSize: 31, lineHeight: 39, fontWeight: "700" }, subtitle: { color: theme.muted, fontSize: 13, lineHeight: 21 }, cards: { gap: 10 }, choiceCard: { minHeight: 112, borderWidth: 1, borderColor: theme.border, borderRadius: 16, backgroundColor: theme.surface, padding: 16, gap: 6, justifyContent: "center" }, choiceCardActive: { borderColor: theme.accent, backgroundColor: theme.chip }, choiceTitle: { color: theme.text, fontSize: 18, fontWeight: "800" }, choiceBody: { color: theme.muted, fontSize: 12, lineHeight: 19 }, typeSection: { gap: 10 }, sectionTitle: { color: theme.text, fontSize: 14, fontWeight: "800" }, typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, typeChip: { minHeight: 44, borderWidth: 1, borderColor: theme.border, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9, backgroundColor: theme.surface, justifyContent: "center" }, typeChipActive: { borderColor: theme.accent, backgroundColor: theme.chip }, typeText: { color: theme.muted, fontSize: 11, fontWeight: "700" }, typeTextActive: { color: theme.text }, note: { borderWidth: 1, borderColor: theme.border, borderRadius: 14, backgroundColor: theme.surface, padding: 14, gap: 5 }, noteTitle: { color: theme.accent, fontSize: 11, fontWeight: "800" }, noteBody: { color: theme.muted, fontSize: 11, lineHeight: 18 }, errorBox: { borderWidth: 1, borderColor: "#C84F4F55", backgroundColor: "#C84F4F12", borderRadius: 12, padding: 12 }, error: { color: "#E59A9A", fontSize: 12, lineHeight: 18 }, button: { minHeight: 52, borderRadius: 12, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" }, buttonText: { color: theme.background, fontSize: 14, fontWeight: "900" }, disabled: { opacity: 0.4 },
}); }
