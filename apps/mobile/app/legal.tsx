import { useEffect, useMemo, useRef, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronDown, ChevronLeft, ChevronRight, FileText, RotateCcw, ShieldCheck } from "lucide-react-native";

import { LEGAL_DOCUMENT_KEYS, LEGAL_DOCUMENTS, type LegalDocumentKey } from "@/lib/legal-content";
import { useAppLocale } from "@/lib/locale-context";
import { darkTheme } from "@/lib/theme";

const BRAND_LOGO_AR = require("../assets/logo.ar.png");
const BRAND_LOGO_EN = require("../assets/logo.en.png");
const ICONS = { privacy: ShieldCheck, terms: FileText, refund: RotateCcw } as const;

export default function LegalScreen() {
  const params = useLocalSearchParams<{ section?: string | string[] }>();
  const requested = Array.isArray(params.section) ? params.section[0] : params.section;
  const initialSection: LegalDocumentKey = LEGAL_DOCUMENT_KEYS.includes(requested as LegalDocumentKey) ? requested as LegalDocumentKey : "privacy";
  const { locale } = useAppLocale();
  const isArabic = locale === "ar";
  const isRtl = isArabic;
  const { width } = useWindowDimensions();
  const compact = width <= 360;
  const styles = useMemo(() => createStyles(darkTheme), []);
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;
  const [open, setOpen] = useState<LegalDocumentKey | null>(initialSection);
  const scrollRef = useRef<ScrollView>(null);
  const brandSource = isArabic ? BRAND_LOGO_AR : BRAND_LOGO_EN;

  function resetScrollPosition() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    });
  }

  function toggleDocument(key: LegalDocumentKey) {
    const next = open === key ? null : key;
    setOpen(next);
    if (next) resetScrollPosition();
  }

  useEffect(() => {
    if (!LEGAL_DOCUMENT_KEYS.includes(requested as LegalDocumentKey)) return;
    setOpen(requested as LegalDocumentKey);
    resetScrollPosition();
  }, [requested]);

  return <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
    <ScrollView ref={scrollRef} contentContainerStyle={[styles.content, compact && styles.contentCompact]} showsVerticalScrollIndicator={false}>
      <View style={[styles.top, isRtl && styles.rowRtl]}>
        <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} style={styles.backButton}>
          <BackIcon size={21} color={darkTheme.text} />
        </Pressable>
        <Image source={brandSource} resizeMode="contain" style={styles.brandLogo} />
      </View>

      <View style={[styles.hero, isRtl && styles.rowRtl]}>
        <View style={styles.heroIcon}><ShieldCheck size={22} color={darkTheme.accent} /></View>
        <View style={styles.heroCopy}>
          <Text accessibilityRole="header" style={[styles.title, compact && styles.titleCompact, isRtl && styles.textRtl]}>{isArabic ? "القانوني والسياسات" : "Legal & policies"}</Text>
          <Text style={[styles.subtitle, isRtl && styles.textRtl]}>{isArabic ? "النصوص المعتمدة لسياسة الخصوصية والشروط والأحكام وسياسة الاسترجاع والاسترداد متاحة كاملة داخل التطبيق." : "The authoritative privacy policy, terms and conditions, and refund policy are available in full inside the app."}</Text>
        </View>
      </View>

      {LEGAL_DOCUMENT_KEYS.map((key) => {
        const doc = LEGAL_DOCUMENTS[key];
        const Icon = ICONS[key];
        const expanded = open === key;
        return <View key={key} style={[styles.document, expanded && styles.documentOpen]}>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => toggleDocument(key)} style={[styles.documentHeader, isRtl && styles.rowRtl]}>
            <View style={styles.documentIcon}><Icon size={20} color={darkTheme.accent} /></View>
            <View style={styles.documentHeading}>
              <Text style={[styles.documentTitle, isRtl && styles.textRtl]}>{isArabic ? doc.arTitle : doc.enTitle}</Text>
              <Text style={[styles.updated, isRtl && styles.textRtl]}>{isArabic ? doc.lastUpdatedAr : doc.lastUpdatedEn}</Text>
            </View>
            <ChevronDown size={19} color={darkTheme.muted} style={expanded ? styles.chevronOpen : undefined} />
          </Pressable>

          {expanded ? <View style={styles.documentBody}>
            {doc.sections.map((section, index) => <View key={`${key}-${section.enTitle}`} style={styles.section}>
              <View style={[styles.sectionHeading, isRtl && styles.rowRtl]}>
                <Text style={styles.sectionNumber}>{String(index + 1).padStart(2, "0")}</Text>
                <Text style={[styles.sectionTitle, isRtl && styles.textRtl]}>{isArabic ? section.arTitle : section.enTitle}</Text>
              </View>
              {(isArabic ? section.ar : section.en).map((paragraph, paragraphIndex) => <Text key={paragraphIndex} style={[styles.paragraph, isRtl && styles.textRtl]}>{paragraph}</Text>)}
            </View>)}
          </View> : null}
        </View>;
      })}

      <Pressable accessibilityRole="button" onPress={() => router.push("/support")} style={[styles.supportCard, isRtl && styles.rowRtl]}>
        <ShieldCheck size={18} color={darkTheme.accent} />
        <Text style={[styles.supportText, isRtl && styles.textRtl]}>{isArabic ? "لديك استفسار قانوني أو طلب استرداد؟ افتح تذكرة دعم من داخل التطبيق." : "Have a legal question or refund request? Open a support ticket inside the app."}</Text>
      </Pressable>
    </ScrollView>
  </SafeAreaView>;
}

function createStyles(theme: typeof darkTheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background },
    content: { width: "100%", maxWidth: 760, alignSelf: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 46, gap: 15 },
    contentCompact: { paddingHorizontal: 15 },
    rowRtl: { flexDirection: "row-reverse" },
    textRtl: { textAlign: "right", writingDirection: "rtl" },
    top: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    backButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" },
    brandLogo: { width: 100, height: 34 },
    hero: { flexDirection: "row", gap: 13, alignItems: "flex-start", borderWidth: 1, borderColor: "#C9A9622E", borderRadius: 22, backgroundColor: "#C9A9620B", padding: 17 },
    heroIcon: { width: 43, height: 43, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "#C9A96213", borderWidth: 1, borderColor: "#C9A96233" },
    heroCopy: { flex: 1, gap: 7 },
    title: { color: theme.text, fontSize: 27, lineHeight: 35, fontWeight: "800" },
    titleCompact: { fontSize: 24, lineHeight: 32 },
    subtitle: { color: theme.muted, fontSize: 12, lineHeight: 20 },
    document: { borderWidth: 1, borderColor: theme.border, borderRadius: 20, overflow: "hidden", backgroundColor: theme.surface },
    documentOpen: { borderColor: "#C9A96238" },
    documentHeader: { minHeight: 74, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 15, paddingVertical: 12 },
    documentIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#C9A96210" },
    documentHeading: { flex: 1, gap: 4 },
    documentTitle: { color: theme.text, fontSize: 15, fontWeight: "800" },
    updated: { color: theme.grayMuted, fontSize: 9, lineHeight: 13 },
    chevronOpen: { transform: [{ rotate: "180deg" }] },
    documentBody: { borderTopWidth: 1, borderTopColor: theme.border, paddingHorizontal: 15 },
    section: { paddingVertical: 17, gap: 9, borderBottomWidth: 1, borderBottomColor: theme.border },
    sectionHeading: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
    sectionNumber: { color: theme.accent, fontSize: 10, fontWeight: "900", minWidth: 24 },
    sectionTitle: { flex: 1, color: theme.text, fontSize: 14, lineHeight: 21, fontWeight: "800" },
    paragraph: { color: theme.muted, fontSize: 12, lineHeight: 21 },
    supportCard: { flexDirection: "row", alignItems: "center", gap: 11, borderWidth: 1, borderColor: "#C9A9622E", borderRadius: 17, backgroundColor: "#C9A96208", padding: 15 },
    supportText: { flex: 1, color: theme.text, fontSize: 11, lineHeight: 18, fontWeight: "700" },
  });
}
