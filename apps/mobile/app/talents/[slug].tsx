import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { darkTheme } from "@/lib/theme";
import { getMobileTalent, type MobilePublicTalent } from "@/lib/talents";

export default function TalentProfileScreen() {
  const params = useLocalSearchParams<{ slug?: string | string[] }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [item, setItem] = useState<MobilePublicTalent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      if (!slug) { setError(isArabic ? "ملف الموهبة غير متاح." : "Talent profile is unavailable."); setLoading(false); return; }
      try {
        const talent = await getMobileTalent(locale, slug);
        if (active) setItem(talent);
      } catch {
        if (active) setError(isArabic ? "تعذر تحميل ملف الموهبة." : "We couldn't load this talent profile.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [isArabic, locale, slug]);

  if (loading) return <View style={styles.center}><ActivityIndicator color={theme.accent} /><Text style={styles.loadingText}>{isArabic ? "جارٍ تحميل الملف…" : "Loading profile…"}</Text></View>;
  if (!item || error) return <View style={styles.center}><Text style={styles.errorTitle}>{error ?? (isArabic ? "الملف غير متاح" : "Profile unavailable")}</Text><Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.backButtonText}>{isArabic ? "رجوع" : "Go back"}</Text></Pressable></View>;

  const role = item.role === "actor" ? (isArabic ? "ممثل" : "Actor") : (isArabic ? "مودل" : "Model");
  const facts = [item.city, item.age ? `${item.age} ${isArabic ? "سنة" : "years"}` : null, item.heightCm ? `${item.heightCm} cm` : null, item.nationality].filter(Boolean);
  const details = [
    { label: isArabic ? "الخبرة" : "Experience", value: item.experienceYears != null ? `${item.experienceYears} ${isArabic ? "سنة" : item.experienceYears === 1 ? "year" : "years"}` : null },
    { label: isArabic ? "التوفر" : "Availability", value: item.availabilityStatus },
    { label: isArabic ? "السفر" : "Travel", value: item.readyToTravel == null ? null : item.readyToTravel ? (isArabic ? "متاح للسفر" : "Open to travel") : (isArabic ? "غير متاح للسفر" : "Not available for travel") },
  ].filter((entry) => entry.value);

  return <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
    <View style={[styles.content, { direction: isRtl ? "rtl" : "ltr" }]}>
      <View style={[styles.topRow, isRtl && styles.rowRtl]}><Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} hitSlop={12}><Text style={styles.back}>{isRtl ? "›" : "‹"}</Text></Pressable><Text style={styles.brand}>{isArabic ? "ملامح" : "MLAMH"}</Text></View>
      <View style={styles.heroCard}>
        <View style={styles.imageWrap}>{item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" /> : <View style={styles.imageFallback}><Text style={styles.imageInitial}>{item.name.slice(0, 1).toUpperCase()}</Text></View>}{item.featured ? <View style={styles.featured}><Text style={styles.featuredText}>{isArabic ? "موهبة مميزة" : "FEATURED TALENT"}</Text></View> : null}</View>
        <View style={styles.identity}><View style={[styles.nameRow, isRtl && styles.rowRtl]}><Text accessibilityRole="header" style={[styles.name, { textAlign: isRtl ? "right" : "left" }]}>{item.name}</Text>{item.verified ? <Text style={styles.verified}>✓</Text> : null}</View><Text style={[styles.role, { textAlign: isRtl ? "right" : "left" }]}>{role}</Text>{facts.length ? <View style={[styles.factRow, isRtl && styles.rowRtl]}>{facts.map((fact) => <View key={String(fact)} style={styles.factChip}><Text style={styles.factText}>{fact}</Text></View>)}</View> : null}</View>
      </View>

      {item.bio ? <Section title={isArabic ? "نبذة" : "About"} styles={styles} isRtl={isRtl}><Text style={[styles.body, { textAlign: isRtl ? "right" : "left" }]}>{item.bio}</Text></Section> : null}
      {details.length ? <Section title={isArabic ? "معلومات مهنية" : "Professional details"} styles={styles} isRtl={isRtl}><View style={styles.detailList}>{details.map((entry) => <View key={entry.label} style={[styles.detailRow, isRtl && styles.rowRtl]}><Text style={styles.detailLabel}>{entry.label}</Text><Text style={styles.detailValue}>{entry.value}</Text></View>)}</View></Section> : null}
      {item.languages.length || item.dialects.length ? <Section title={isArabic ? "اللغات واللهجات" : "Languages & dialects"} styles={styles} isRtl={isRtl}><ChipList values={[...item.languages, ...item.dialects]} styles={styles} isRtl={isRtl} /></Section> : null}
      {item.skills.length ? <Section title={isArabic ? "المهارات" : "Skills"} styles={styles} isRtl={isRtl}><ChipList values={item.skills} styles={styles} isRtl={isRtl} /></Section> : null}

      <View style={styles.privacyNote}><Text style={[styles.privacyTitle, { textAlign: isRtl ? "right" : "left" }]}>{isArabic ? "خصوصية الموهبة" : "Talent privacy"}</Text><Text style={[styles.privacyBody, { textAlign: isRtl ? "right" : "left" }]}>{isArabic ? "يعرض هذا الملف المعلومات العامة فقط. وسائل التواصل والمحتوى الخاص لا تظهر هنا." : "This profile shows public information only. Private media and contact details are not exposed here."}</Text></View>
      <Pressable accessibilityRole="button" onPress={() => router.push("/publisher/opportunities/new")} style={styles.cta}><Text style={styles.ctaText}>{isArabic ? "أنشئ فرصة لهذه الموهبة" : "Create an opportunity"}</Text></Pressable>
    </View>
  </ScrollView>;
}

function Section({ title, styles, isRtl, children }: { title: string; styles: ReturnType<typeof createStyles>; isRtl: boolean; children: React.ReactNode }) { return <View style={styles.section}><Text style={[styles.sectionTitle, { textAlign: isRtl ? "right" : "left" }]}>{title}</Text>{children}</View>; }
function ChipList({ values, styles, isRtl }: { values: string[]; styles: ReturnType<typeof createStyles>; isRtl: boolean }) { return <View style={[styles.chipList, isRtl && styles.rowRtl]}>{[...new Set(values)].filter(Boolean).map((value) => <View key={value} style={styles.chip}><Text style={styles.chipText}>{value}</Text></View>)}</View>; }
function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, scrollContent: { paddingVertical: Platform.OS === "ios" ? 16 : 22 }, content: { width: "100%", maxWidth: 700, alignSelf: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 42, gap: 18 }, center: { flex: 1, backgroundColor: theme.background, alignItems: "center", justifyContent: "center", paddingHorizontal: 26, gap: 12 }, loadingText: { color: theme.muted, fontSize: 12 }, errorTitle: { color: theme.text, fontSize: 17, fontWeight: "800", textAlign: "center" }, backButton: { minHeight: 44, borderRadius: 10, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }, backButtonText: { color: theme.background, fontSize: 12, fontWeight: "900" }, topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, rowRtl: { flexDirection: "row-reverse" }, back: { color: theme.text, fontSize: 31, lineHeight: 34 }, brand: { color: theme.accent, fontSize: 17, fontWeight: "900", letterSpacing: 1.1 }, heroCard: { borderWidth: 1, borderColor: theme.border, borderRadius: 18, backgroundColor: theme.surface, overflow: "hidden" }, imageWrap: { width: "100%", aspectRatio: 4 / 3, backgroundColor: theme.grayElevated }, image: { width: "100%", height: "100%" }, imageFallback: { flex: 1, alignItems: "center", justifyContent: "center" }, imageInitial: { color: theme.accent, fontSize: 58, fontWeight: "800" }, featured: { position: "absolute", top: 12, left: 12, borderRadius: 999, backgroundColor: theme.accent, paddingHorizontal: 10, paddingVertical: 6 }, featuredText: { color: theme.background, fontSize: 8, fontWeight: "900", letterSpacing: 0.8 }, identity: { padding: 18, gap: 6 }, nameRow: { flexDirection: "row", alignItems: "center", gap: 7 }, name: { flexShrink: 1, color: theme.text, fontSize: 28, lineHeight: 34, fontWeight: "800" }, verified: { color: theme.accent, fontSize: 16, fontWeight: "900" }, role: { color: theme.accent, fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1 }, factRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 7 }, factChip: { borderWidth: 1, borderColor: theme.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: theme.background }, factText: { color: theme.muted, fontSize: 10, fontWeight: "700" }, section: { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 17, gap: 11 }, sectionTitle: { color: theme.text, fontSize: 15, fontWeight: "900" }, body: { color: theme.muted, fontSize: 13, lineHeight: 22 }, detailList: { gap: 0 }, detailRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16, minHeight: 42, borderBottomWidth: 1, borderBottomColor: theme.border }, detailLabel: { color: theme.muted, fontSize: 11 }, detailValue: { color: theme.text, fontSize: 11, fontWeight: "800", flexShrink: 1, textAlign: "right" }, chipList: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, chip: { borderWidth: 1, borderColor: theme.border, borderRadius: 999, backgroundColor: theme.surface, paddingHorizontal: 11, paddingVertical: 8 }, chipText: { color: theme.text, fontSize: 10, fontWeight: "700" }, privacyNote: { borderWidth: 1, borderColor: theme.border, borderRadius: 14, backgroundColor: theme.surface, padding: 14, gap: 5 }, privacyTitle: { color: theme.accent, fontSize: 11, fontWeight: "900" }, privacyBody: { color: theme.muted, fontSize: 11, lineHeight: 18 }, cta: { minHeight: 52, borderRadius: 12, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }, ctaText: { color: theme.background, fontSize: 13, fontWeight: "900" },
}); }
