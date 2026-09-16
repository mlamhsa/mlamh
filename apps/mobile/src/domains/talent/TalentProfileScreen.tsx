import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, ArrowRight, BadgeCheck, BriefcaseBusiness, Globe2, MapPin, Ruler, ShieldCheck, Sparkles, UserRound } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getMobileTalentProfile } from "@/src/domains/talent/api";
import type { MobilePublicTalent } from "@/src/domains/talent/types";
import { useLocale } from "@/src/i18n/LocaleProvider";
import { colors, radius, spacing } from "@/src/theme/tokens";

export function TalentProfileScreen() {
  const params = useLocalSearchParams<{ slug?: string | string[] }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const { locale } = useLocale();
  const isArabic = locale === "ar";
  const BackIcon = isArabic ? ArrowRight : ArrowLeft;
  const align = isArabic ? "right" : "left";
  const [talent, setTalent] = useState<MobilePublicTalent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    async function run() {
      if (!slug) {
        setError(true);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(false);
      try {
        const response = await getMobileTalentProfile(locale, slug);
        if (!active) return;
        if (!response.ok) throw new Error(response.code);
        setTalent(response.item);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    void run();
    return () => { active = false; };
  }, [locale, slug]);

  const gallery = useMemo(() => {
    if (!talent) return [];
    return [talent.imageUrl, ...talent.galleryImages].filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index).slice(0, 8);
  }, [talent]);

  if (loading) {
    return <StateScreen><ActivityIndicator color={colors.gold} /><Text style={styles.stateText}>{isArabic ? "جارٍ تحميل الملف..." : "Loading profile..."}</Text></StateScreen>;
  }

  if (error || !talent) {
    return (
      <StateScreen>
        <Text style={styles.stateTitle}>{isArabic ? "تعذر فتح ملف الموهبة" : "Unable to open talent profile"}</Text>
        <Pressable onPress={() => router.back()} style={styles.retry}><Text style={styles.retryText}>{isArabic ? "رجوع" : "Back"}</Text></Pressable>
      </StateScreen>
    );
  }

  const role = talent.role === "actor" ? (isArabic ? "ممثل" : "Actor") : talent.role === "model" ? (isArabic ? "مودل" : "Model") : (isArabic ? "موهبة" : "Talent");

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
            <BackIcon size={19} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.brand}>MLAMH</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.hero}>
          {talent.imageUrl ? <Image source={{ uri: talent.imageUrl }} style={styles.heroImage} resizeMode="cover" /> : <View style={styles.heroFallback}><UserRound size={52} color={colors.textMuted} /></View>}
          <View style={styles.heroShade} />
          <View style={styles.heroContent}>
            <View style={[styles.badges, isArabic ? styles.rowRtl : styles.rowLtr]}>
              {talent.featured ? <View style={styles.goldBadge}><Sparkles size={12} color={colors.gold} /><Text style={styles.goldBadgeText}>{isArabic ? "مميزة" : "Featured"}</Text></View> : null}
              {talent.verified ? <View style={styles.verifiedBadge}><BadgeCheck size={12} color={colors.textPrimary} /><Text style={styles.verifiedText}>{isArabic ? "موثقة" : "Verified"}</Text></View> : null}
            </View>
            <Text style={[styles.name, { textAlign: align }]}>{talent.name}</Text>
            <View style={[styles.meta, isArabic ? styles.rowRtl : styles.rowLtr]}>
              <Text style={styles.role}>{role}</Text>
              {talent.city ? <><View style={styles.dot} /><MapPin size={12} color={colors.textMuted} /><Text style={styles.metaText}>{talent.city}</Text></> : null}
            </View>
          </View>
        </View>

        {talent.bio ? <Section title={isArabic ? "نبذة" : "About"}><Text style={[styles.body, { textAlign: align }]}>{talent.bio}</Text></Section> : null}

        <View style={styles.infoGrid}>
          {talent.age != null ? <InfoCard label={isArabic ? "العمر" : "Age"} value={String(talent.age)} icon={UserRound} /> : null}
          {talent.heightCm != null ? <InfoCard label={isArabic ? "الطول" : "Height"} value={`${talent.heightCm} cm`} icon={Ruler} /> : null}
          {talent.nationality ? <InfoCard label={isArabic ? "الجنسية" : "Nationality"} value={talent.nationality} icon={Globe2} /> : null}
          {talent.experienceYears != null ? <InfoCard label={isArabic ? "الخبرة" : "Experience"} value={isArabic ? `${talent.experienceYears} سنوات` : `${talent.experienceYears} years`} icon={BriefcaseBusiness} /> : null}
        </View>

        {talent.skills.length > 0 ? <TagSection title={isArabic ? "المهارات" : "Skills"} items={talent.skills} /> : null}
        {talent.languages.length > 0 ? <TagSection title={isArabic ? "اللغات" : "Languages"} items={talent.languages} /> : null}
        {talent.dialects.length > 0 ? <TagSection title={isArabic ? "اللهجات" : "Dialects"} items={talent.dialects} /> : null}

        {gallery.length > 1 ? (
          <Section title={isArabic ? "الصور" : "Gallery"}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryContent}>
              {gallery.slice(1).map((image, index) => <Image key={`${image}-${index}`} source={{ uri: image }} style={styles.galleryImage} resizeMode="cover" />)}
            </ScrollView>
          </Section>
        ) : null}

        <View style={styles.privacyCard}>
          <ShieldCheck size={20} color={colors.gold} />
          <View style={styles.privacyCopy}>
            <Text style={[styles.privacyTitle, { textAlign: align }]}>{isArabic ? "خصوصية الموهبة" : "Talent privacy"}</Text>
            <Text style={[styles.privacyText, { textAlign: align }]}>{isArabic ? "بيانات التواصل والمحتوى الخاص لا تظهر للعامة، وتخضع لصلاحيات المنصة." : "Contact details and private content are not public and remain protected by platform permissions."}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StateScreen({ children }: { children: React.ReactNode }) {
  return <SafeAreaView style={styles.safeArea}><View style={styles.state}>{children}</View></SafeAreaView>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
}

function TagSection({ title, items }: { title: string; items: string[] }) {
  return <Section title={title}><View style={styles.tags}>{items.slice(0, 12).map((item) => <View key={item} style={styles.tag}><Text style={styles.tagText}>{item}</Text></View>)}</View></Section>;
}

function InfoCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof UserRound }) {
  return <View style={styles.infoCard}><Icon size={17} color={colors.gold} /><Text style={styles.infoLabel}>{label}</Text><Text numberOfLines={2} style={styles.infoValue}>{value}</Text></View>;
}

const absoluteFill = { position: "absolute" as const, top: 0, right: 0, bottom: 0, left: 0 };

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 52 },
  topBar: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backButton: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  brand: { color: colors.gold, fontSize: 11, fontWeight: "700", letterSpacing: 1.5 },
  hero: { height: 470, borderRadius: 30, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", backgroundColor: colors.surface },
  heroImage: { width: "100%", height: "100%" },
  heroFallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  heroShade: { ...absoluteFill, backgroundColor: "rgba(0,0,0,0.28)" },
  heroContent: { position: "absolute", left: spacing.xl, right: spacing.xl, bottom: spacing.xl },
  badges: { gap: spacing.sm, alignSelf: "flex-start" },
  rowRtl: { flexDirection: "row-reverse", alignItems: "center" },
  rowLtr: { flexDirection: "row", alignItems: "center" },
  goldBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: "rgba(201,169,98,0.32)", backgroundColor: "rgba(0,0,0,0.58)", borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 6 },
  goldBadgeText: { color: colors.gold, fontSize: 10 },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)", backgroundColor: "rgba(0,0,0,0.58)", borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 6 },
  verifiedText: { color: colors.textPrimary, fontSize: 10 },
  name: { color: colors.textPrimary, fontSize: 31, lineHeight: 38, fontWeight: "700", marginTop: spacing.md },
  meta: { gap: 7, marginTop: 8, alignSelf: "flex-start" },
  role: { color: colors.goldSoft, fontSize: 13 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.34)" },
  metaText: { color: "rgba(255,255,255,0.58)", fontSize: 12 },
  section: { marginTop: 30 },
  sectionTitle: { color: colors.textPrimary, fontSize: 19, fontWeight: "600", marginBottom: spacing.md },
  body: { color: colors.textMuted, fontSize: 14, lineHeight: 25 },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: 30 },
  infoCard: { width: "47.8%", minHeight: 112, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg },
  infoLabel: { color: colors.textMuted, fontSize: 10, marginTop: spacing.md },
  infoValue: { color: colors.textPrimary, fontSize: 14, lineHeight: 20, fontWeight: "600", marginTop: 4 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  tag: { borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 8 },
  tagText: { color: colors.textSecondary, fontSize: 11 },
  galleryContent: { gap: spacing.md },
  galleryImage: { width: 190, height: 250, borderRadius: 20, backgroundColor: colors.surface },
  privacyCard: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, marginTop: 34, borderWidth: 1, borderColor: "rgba(201,169,98,0.18)", backgroundColor: "rgba(201,169,98,0.055)", borderRadius: radius.xl, padding: spacing.xl },
  privacyCopy: { flex: 1 },
  privacyTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: "600" },
  privacyText: { color: colors.textMuted, fontSize: 12, lineHeight: 21, marginTop: 5 },
  state: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xxl },
  stateTitle: { color: colors.textPrimary, fontSize: 16, textAlign: "center" },
  stateText: { color: colors.textMuted, fontSize: 12, marginTop: spacing.md },
  retry: { marginTop: spacing.xl, backgroundColor: colors.gold, borderRadius: radius.pill, paddingHorizontal: spacing.xl, paddingVertical: 11 },
  retryText: { color: "#080808", fontWeight: "700", fontSize: 12 },
});
