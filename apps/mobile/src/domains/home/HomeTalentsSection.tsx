import { router, type Href } from "expo-router";
import { ArrowLeft, ArrowRight, BadgeCheck, MapPin, Sparkles } from "lucide-react-native";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { MobilePublicTalent } from "@/src/domains/talent/types";
import { colors, radius, spacing } from "@/src/theme/tokens";

function go(href: string) {
  router.push(href as Href);
}

function roleLabel(role: MobilePublicTalent["role"], isArabic: boolean) {
  if (role === "actor") return isArabic ? "ممثل" : "Actor";
  if (role === "model") return isArabic ? "مودل" : "Model";
  return isArabic ? "موهبة" : "Talent";
}

export function HomeTalentsSection({
  isArabic,
  items,
  loading,
}: {
  isArabic: boolean;
  items: MobilePublicTalent[];
  loading: boolean;
}) {
  const DirectionArrow = isArabic ? ArrowLeft : ArrowRight;
  const align = isArabic ? "right" : "left";
  const selected = [...items]
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, 6);

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <View style={[styles.eyebrowRow, isArabic ? styles.rowRtl : styles.rowLtr]}>
            <Sparkles size={14} color={colors.gold} />
            <Text style={styles.eyebrow}>{isArabic ? "مختارات ملامح" : "MLAMH SELECTIONS"}</Text>
          </View>
          <Text style={[styles.title, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>
            {isArabic ? "مواهب تستحق الاكتشاف" : "Talent worth discovering"}
          </Text>
          <Text style={[styles.description, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>
            {isArabic
              ? "اكتشف وجوهًا جديدة وملفات مهنية جاهزة للفرصة المناسبة."
              : "Discover new faces and professional profiles ready for the right opportunity."}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => go("/talents")}
          style={({ pressed }) => [styles.viewAll, pressed && styles.pressed]}
        >
          <Text style={styles.viewAllText}>{isArabic ? "عرض الكل" : "View all"}</Text>
          <DirectionArrow size={13} color={colors.textMuted} />
        </Pressable>
      </View>

      <View style={[styles.dividerRow, isArabic ? styles.rowRtl : styles.rowLtr]}>
        <View style={styles.dividerLong} />
        <View style={styles.dividerGold} />
      </View>

      {loading ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{isArabic ? "جارٍ تحميل المواهب..." : "Loading talent..."}</Text>
        </View>
      ) : selected.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{isArabic ? "لا توجد مواهب بصور منشورة حاليًا" : "No talent profiles with images yet"}</Text>
          <Text style={styles.emptyText}>{isArabic ? "ستظهر الملفات هنا فور نشرها." : "Published talent profiles will appear here."}</Text>
        </View>
      ) : (
        <>
          <TalentHeroCard talent={selected[0]} isArabic={isArabic} />
          {selected.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalContent}
              style={styles.horizontalList}
            >
              {selected.slice(1).map((talent) => (
                <TalentSmallCard key={talent.id} talent={talent} isArabic={isArabic} />
              ))}
            </ScrollView>
          ) : null}
        </>
      )}
    </View>
  );
}

function TalentHeroCard({ talent, isArabic }: { talent: MobilePublicTalent; isArabic: boolean }) {
  const DirectionArrow = isArabic ? ArrowLeft : ArrowRight;
  const align = isArabic ? "right" : "left";
  const href = talent.slug ? `/talent/${talent.slug}` : "/talents";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => go(href)}
      style={({ pressed }) => [styles.heroTalent, pressed && styles.pressed]}
    >
      {talent.imageUrl ? <Image source={{ uri: talent.imageUrl }} style={styles.fill} resizeMode="cover" /> : null}
      <View style={styles.overlay} />
      <View style={styles.heroTalentContent}>
        <View style={styles.flexOne}>
          {talent.featured ? (
            <View style={[styles.featuredPill, isArabic ? styles.rowRtl : styles.rowLtr]}>
              <BadgeCheck size={12} color={colors.gold} />
              <Text style={styles.featuredText}>{isArabic ? "موهبة مميزة" : "Featured talent"}</Text>
            </View>
          ) : null}
          <Text numberOfLines={1} style={[styles.heroName, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{talent.name}</Text>
          <TalentMeta talent={talent} isArabic={isArabic} />
        </View>
        <View style={styles.arrowButton}><DirectionArrow size={17} color={colors.textPrimary} /></View>
      </View>
    </Pressable>
  );
}

function TalentSmallCard({ talent, isArabic }: { talent: MobilePublicTalent; isArabic: boolean }) {
  const href = talent.slug ? `/talent/${talent.slug}` : "/talents";
  const align = isArabic ? "right" : "left";

  return (
    <Pressable accessibilityRole="button" onPress={() => go(href)} style={({ pressed }) => [styles.smallTalent, pressed && styles.pressed]}>
      {talent.imageUrl ? <Image source={{ uri: talent.imageUrl }} style={styles.fill} resizeMode="cover" /> : null}
      <View style={styles.overlayStrong} />
      {talent.featured ? <View style={styles.featuredDot}><BadgeCheck size={13} color={colors.gold} /></View> : null}
      <View style={styles.smallTalentContent}>
        <Text numberOfLines={1} style={[styles.smallName, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{talent.name}</Text>
        <TalentMeta talent={talent} isArabic={isArabic} compact />
      </View>
    </Pressable>
  );
}

function TalentMeta({
  talent,
  isArabic,
  compact = false,
}: {
  talent: MobilePublicTalent;
  isArabic: boolean;
  compact?: boolean;
}) {
  return (
    <View style={[styles.metaRow, isArabic ? styles.rowRtl : styles.rowLtr]}>
      <Text style={[styles.role, compact && styles.metaCompact]}>{roleLabel(talent.role, isArabic)}</Text>
      {talent.city ? (
        <>
          <View style={styles.metaDot} />
          <View style={[styles.cityRow, isArabic ? styles.rowRtl : styles.rowLtr]}>
            <MapPin size={compact ? 10 : 12} color={colors.textMuted} />
            <Text numberOfLines={1} style={[styles.city, compact && styles.metaCompact]}>{talent.city}</Text>
          </View>
        </>
      ) : null}
    </View>
  );
}

const absoluteFill = { position: "absolute" as const, top: 0, right: 0, bottom: 0, left: 0 };

const styles = StyleSheet.create({
  section: { marginTop: 42 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.lg },
  headerCopy: { flex: 1 },
  eyebrowRow: { alignSelf: "flex-start" },
  rowRtl: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.sm },
  rowLtr: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  eyebrow: { color: "rgba(201,169,98,0.82)", fontSize: 11, fontWeight: "600" },
  title: { color: colors.textPrimary, fontSize: 25, lineHeight: 31, fontWeight: "700", marginTop: spacing.sm },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 23, marginTop: spacing.sm, maxWidth: 290 },
  viewAll: { marginTop: 28, minHeight: 38, flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.025)", borderRadius: radius.pill, paddingHorizontal: 13 },
  viewAllText: { color: "rgba(255,255,255,0.50)", fontSize: 12 },
  pressed: { opacity: 0.84, transform: [{ scale: 0.994 }] },
  dividerRow: { marginTop: spacing.xl },
  dividerLong: { height: 1, flex: 1, backgroundColor: "rgba(255,255,255,0.07)" },
  dividerGold: { height: 1, width: 48, backgroundColor: "rgba(201,169,98,0.35)" },
  emptyCard: { marginTop: spacing.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(255,255,255,0.025)", borderRadius: radius.xl, padding: spacing.xxl, alignItems: "center" },
  emptyTitle: { color: "rgba(255,255,255,0.72)", fontSize: 14, textAlign: "center" },
  emptyText: { color: colors.textMuted, fontSize: 12, lineHeight: 20, textAlign: "center", marginTop: 6 },
  heroTalent: { height: 360, marginTop: spacing.xl, borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", backgroundColor: colors.surface, borderRadius: 28, overflow: "hidden" },
  fill: { ...absoluteFill, width: "100%", height: "100%" },
  overlay: { ...absoluteFill, backgroundColor: "rgba(0,0,0,0.32)" },
  overlayStrong: { ...absoluteFill, backgroundColor: "rgba(0,0,0,0.38)" },
  heroTalentContent: { position: "absolute", left: spacing.xl, right: spacing.xl, bottom: spacing.xl, flexDirection: "row", alignItems: "flex-end", gap: spacing.md },
  flexOne: { flex: 1 },
  featuredPill: { alignSelf: "flex-start", borderWidth: 1, borderColor: "rgba(201,169,98,0.30)", backgroundColor: "rgba(0,0,0,0.58)", borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  featuredText: { color: colors.gold, fontSize: 10 },
  heroName: { color: colors.textPrimary, fontSize: 25, lineHeight: 31, fontWeight: "700", marginTop: spacing.sm },
  arrowButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", backgroundColor: "rgba(0,0,0,0.42)" },
  metaRow: { marginTop: 7, alignSelf: "flex-start" },
  role: { color: colors.gold, fontSize: 12 },
  metaCompact: { fontSize: 10 },
  metaDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.26)" },
  cityRow: { flexShrink: 1 },
  city: { color: "rgba(255,255,255,0.48)", fontSize: 12, maxWidth: 140 },
  horizontalList: { marginHorizontal: -spacing.lg, marginTop: spacing.md },
  horizontalContent: { paddingHorizontal: spacing.lg, gap: spacing.md },
  smallTalent: { width: 168, height: 210, borderRadius: 22, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: colors.surface },
  featuredDot: { position: "absolute", top: spacing.md, right: spacing.md, width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(201,169,98,0.30)", backgroundColor: "rgba(0,0,0,0.55)" },
  smallTalentContent: { position: "absolute", left: spacing.md, right: spacing.md, bottom: spacing.md },
  smallName: { color: colors.textPrimary, fontSize: 15, fontWeight: "700" },
});
