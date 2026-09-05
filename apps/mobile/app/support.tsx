import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { darkTheme } from "@/lib/theme";

const SITE = "https://mlamh.net";

export default function SupportLegalScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const styles = createStyles(darkTheme);
  const links = [
    { path: "privacy", ar: "سياسة الخصوصية", en: "Privacy policy" },
    { path: "terms", ar: "الشروط والأحكام", en: "Terms & conditions" },
    { path: "refund-policy", ar: "سياسة الاسترداد", en: "Refund policy" },
    { path: "complaints", ar: "الشكاوى والدعم", en: "Complaints & support" },
  ];
  async function open(path: string) { await Linking.openURL(`${SITE}/${locale}/${path}`); }
  return <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { direction: isRtl ? "rtl" : "ltr" }]}>
    <View style={styles.top}><Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} hitSlop={12}><Text style={styles.back}>{isRtl ? "›" : "‹"}</Text></Pressable><Text style={styles.brand}>{isArabic ? "ملامح" : "MLAMH"}</Text></View>
    <View style={styles.header}><Text style={styles.eyebrow}>{isArabic ? "المساعدة والقانوني" : "SUPPORT & LEGAL"}</Text><Text accessibilityRole="header" style={styles.title}>{isArabic ? "الدعم والسياسات" : "Support & policies"}</Text><Text style={styles.subtitle}>{isArabic ? "روابط رسمية ومحدثة من موقع ملامح. تفتح في المتصفح لضمان عرض أحدث نسخة دائمًا." : "Official, current MLAMH resources. They open on the web so you always see the latest version."}</Text></View>
    <View style={styles.links}>{links.map((item) => <Pressable key={item.path} accessibilityRole="link" onPress={() => void open(item.path)} style={({ pressed }) => [styles.link, pressed && styles.pressed]}><Text style={styles.linkText}>{isArabic ? item.ar : item.en}</Text><Text style={styles.arrow}>{isRtl ? "‹" : "›"}</Text></Pressable>)}</View>
    <Text style={styles.note}>{isArabic ? "لا تُعرض بيانات التواصل الخاصة بالمواهب للعامة. وتخضع المحادثات وصلاحيات الجهات لقواعد الاعتماد والقبول في ملامح." : "Private talent contact data is not public. Conversations and publisher access follow MLAMH approval and acceptance rules."}</Text>
  </ScrollView>;
}

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, content: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 50, gap: 24 }, top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, back: { color: theme.text, fontSize: 30, lineHeight: 34 }, brand: { color: theme.accent, fontSize: 17, fontWeight: "800", letterSpacing: 1.2 }, header: { gap: 8 }, eyebrow: { color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.7 }, title: { color: theme.text, fontSize: 31, lineHeight: 38, fontWeight: "700" }, subtitle: { color: theme.muted, fontSize: 13, lineHeight: 21 }, links: { borderTopWidth: 1, borderTopColor: theme.border }, link: { minHeight: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, borderBottomWidth: 1, borderBottomColor: theme.border }, linkText: { color: theme.text, fontSize: 14, fontWeight: "700" }, arrow: { color: theme.accent, fontSize: 21 }, pressed: { opacity: 0.62 }, note: { color: theme.muted, fontSize: 11, lineHeight: 18 },
}); }
