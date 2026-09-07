import { Linking, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft, ChevronRight, LifeBuoy, Scale } from "lucide-react-native";

import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { darkTheme } from "@/lib/theme";

const SITE = "https://mlamh.net";

export default function SupportLegalScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const { width } = useWindowDimensions();
  const compact = width <= 360;
  const styles = createStyles(darkTheme);
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;
  const ForwardIcon = isRtl ? ChevronLeft : ChevronRight;
  const helpLinks = [{ path: "complaints", ar: "الشكاوى والدعم", en: "Complaints & support" }];
  const legalLinks = [
    { path: "privacy", ar: "سياسة الخصوصية", en: "Privacy policy" },
    { path: "terms", ar: "الشروط والأحكام", en: "Terms & conditions" },
    { path: "refund-policy", ar: "سياسة الاسترداد", en: "Refund policy" },
  ];
  async function open(path: string) { await Linking.openURL(`${SITE}/${locale}/${path}`); }

  return <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
    <ScrollView contentContainerStyle={[styles.content, compact && styles.contentCompact]} showsVerticalScrollIndicator={false}>
      <View style={[styles.top, isRtl && styles.rowRtl]}><Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} style={styles.backButton}><BackIcon size={21} color={darkTheme.text}/></Pressable><Text style={[styles.brand, isArabic && styles.noTracking, isRtl && styles.textRtl]}>{isArabic ? "ملامح" : "MLAMH"}</Text></View>

      <View style={styles.header}><Text style={[styles.eyebrow, isArabic && styles.noTracking, isRtl && styles.textRtl]}>{isArabic ? "مركز المساعدة" : "HELP CENTER"}</Text><Text accessibilityRole="header" style={[styles.title, compact && styles.titleCompact, isRtl && styles.textRtl]}>{isArabic ? "كيف نقدر نساعدك؟" : "How can we help?"}</Text><Text style={[styles.subtitle, isRtl && styles.textRtl]}>{isArabic ? "المساعدة منفصلة عن الوثائق القانونية حتى تصل لما تحتاجه بسرعة." : "Help resources and legal documents are separated so you can find what you need quickly."}</Text></View>

      <Section icon={<LifeBuoy size={20} color={darkTheme.accent}/>} title={isArabic ? "المساعدة والدعم" : "Help & support"} subtitle={isArabic ? "للشكاوى أو طلب المساعدة أو التواصل مع ملامح." : "For complaints, assistance or contacting MLAMH."} isRtl={isRtl} styles={styles} compact={compact}>
        {helpLinks.map((item) => <ResourceRow key={item.path} label={isArabic ? item.ar : item.en} onPress={() => void open(item.path)} ForwardIcon={ForwardIcon} isRtl={isRtl} styles={styles}/>) }
      </Section>

      <Section icon={<Scale size={20} color={darkTheme.accent}/>} title={isArabic ? "القانوني والسياسات" : "Legal & policies"} subtitle={isArabic ? "الخصوصية والشروط والاسترداد في قسم مستقل." : "Privacy, terms and refund documents in one place."} isRtl={isRtl} styles={styles} compact={compact}>
        {legalLinks.map((item) => <ResourceRow key={item.path} label={isArabic ? item.ar : item.en} onPress={() => void open(item.path)} ForwardIcon={ForwardIcon} isRtl={isRtl} styles={styles}/>) }
      </Section>

      <Text style={[styles.note, isRtl && styles.textRtl]}>{isArabic ? "لا تُعرض بيانات التواصل الخاصة بالمواهب للعامة، وتفتح المحادثات حسب قواعد القبول والاعتماد في ملامح." : "Private talent contact data is not public. Messaging follows MLAMH approval and acceptance rules."}</Text>
    </ScrollView>
  </SafeAreaView>;
}

function Section({ icon, title, subtitle, children, isRtl, styles, compact }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode; isRtl: boolean; styles: ReturnType<typeof createStyles>; compact: boolean }) {
  return <View style={styles.section}><View style={[styles.sectionHeading, compact && styles.sectionHeadingCompact, isRtl && styles.rowRtl]}><View style={[styles.iconShell, compact && styles.iconShellCompact]}>{icon}</View><View style={styles.sectionCopy}><Text style={[styles.sectionTitle, isRtl && styles.textRtl]}>{title}</Text><Text style={[styles.sectionSubtitle, isRtl && styles.textRtl]}>{subtitle}</Text></View></View><View style={styles.links}>{children}</View></View>;
}

function ResourceRow({ label, onPress, ForwardIcon, isRtl, styles }: { label: string; onPress: () => void; ForwardIcon: typeof ChevronLeft; isRtl: boolean; styles: ReturnType<typeof createStyles> }) {
  return <Pressable accessibilityRole="link" onPress={onPress} style={({ pressed }) => [styles.link, isRtl && styles.rowRtl, pressed && styles.pressed]}><Text style={[styles.linkText, isRtl && styles.textRtl]}>{label}</Text><ForwardIcon size={18} color="#C9A962"/></Pressable>;
}

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, content: { width: "100%", maxWidth: 680, alignSelf: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 34, gap: 18 }, contentCompact: { paddingHorizontal: 14, gap: 14 }, top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 48 }, rowRtl: { flexDirection: "row-reverse" }, textRtl: { textAlign: "right", writingDirection: "rtl" }, noTracking: { letterSpacing: 0 }, backButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center", backgroundColor: theme.surface }, brand: { color: theme.accent, fontSize: 15, fontWeight: "900", letterSpacing: 1.4 }, header: { gap: 7 }, eyebrow: { color: theme.accent, fontSize: 9, fontWeight: "900", letterSpacing: 1.5 }, title: { color: theme.text, fontSize: 28, lineHeight: 34, fontWeight: "800" }, titleCompact: { fontSize: 24, lineHeight: 30 }, subtitle: { color: theme.muted, fontSize: 13, lineHeight: 21 }, section: { borderWidth: 1, borderColor: theme.border, borderRadius: 20, backgroundColor: theme.surface, overflow: "hidden" }, sectionHeading: { flexDirection: "row", alignItems: "center", gap: 12, padding: 15 }, sectionHeadingCompact: { padding: 12, gap: 10 }, iconShell: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, borderColor: "#C9A96233", backgroundColor: "#C9A9620C", alignItems: "center", justifyContent: "center" }, iconShellCompact: { width: 38, height: 38, borderRadius: 12 }, sectionCopy: { flex: 1 }, sectionTitle: { color: theme.text, fontSize: 16, fontWeight: "900" }, sectionSubtitle: { color: theme.muted, fontSize: 11, lineHeight: 17, marginTop: 3 }, links: { borderTopWidth: 1, borderTopColor: theme.border }, link: { minHeight: 56, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, borderBottomWidth: 1, borderBottomColor: theme.border }, linkText: { flex: 1, color: theme.text, fontSize: 14, fontWeight: "700" }, pressed: { opacity: 0.62 }, note: { color: theme.muted, fontSize: 11, lineHeight: 18, marginTop: 2 }
}); }
