import { router, type Href } from "expo-router";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  MapPin,
  Wallet,
  Zap,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { MobilePublicOpportunity } from "@/src/domains/opportunities/types";
import { colors, radius, spacing } from "@/src/theme/tokens";

function go(href: string) {
  router.push(href as Href);
}

function opportunityTypeLabel(value: string, isArabic: boolean) {
  const labels: Record<string, { ar: string; en: string }> = {
    actor: { ar: "ممثل", en: "Actor" },
    actress: { ar: "ممثلة", en: "Actress" },
    model: { ar: "مودل", en: "Model" },
    makeup_artist: { ar: "خبير مكياج", en: "Makeup Artist" },
    photographer: { ar: "مصور", en: "Photographer" },
    influencer: { ar: "صانع محتوى", en: "Influencer" },
    presenter: { ar: "مقدم", en: "Presenter" },
  };
  return labels[value]?.[isArabic ? "ar" : "en"] ?? value;
}

function formatCompensation(item: MobilePublicOpportunity, isArabic: boolean) {
  if (item.compensationType === "unpaid") return isArabic ? "غير مدفوع" : "Unpaid";
  if (item.compensationType === "negotiable") return isArabic ? "حسب الاتفاق" : "Negotiable";
  const amount = Number(item.budget);
  if (!Number.isFinite(amount) || amount <= 0) return isArabic ? "غير محدد" : "Not specified";
  const formatted = new Intl.NumberFormat(isArabic ? "ar-SA-u-nu-latn" : "en-US").format(amount);
  return `${formatted} ${item.currency || (isArabic ? "ريال" : "SAR")}`;
}

export function HomeOpportunitiesSection({
  isArabic,
  items,
  loading,
}: {
  isArabic: boolean;
  items: MobilePublicOpportunity[];
  loading: boolean;
}) {
  const DirectionArrow = isArabic ? ArrowLeft : ArrowRight;
  const align = isArabic ? "right" : "left";

  return (
    <View style={styles.section}>
      <View style={[styles.headerRow, isArabic && styles.rowReverse]}>
        <View style={styles.headerCopy}>
          <View style={[styles.eyebrowRow, isArabic ? styles.rowRtl : styles.rowLtr]}>
            <BriefcaseBusiness size={14} color={colors.gold} />
            <Text style={styles.eyebrow}>
              {isArabic ? "طلبات وفرص جديدة" : "NEW REQUESTS & OPPORTUNITIES"}
            </Text>
          </View>
          <Text style={[styles.title, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>
            {isArabic ? "فيه من يبحث عن مواهب الآن" : "Talent is needed now"}
          </Text>
          <Text style={[styles.description, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>
            {isArabic
              ? "اكتشف طلبات سريعة وفرص كاستينغ من جهات تبحث عن ممثلين ومودلز."
              : "Discover quick requests and casting opportunities from publishers looking for actors and models."}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => go("/opportunities")}
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
          <Text style={styles.emptyText}>{isArabic ? "جارٍ تحميل الفرص..." : "Loading opportunities..."}</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyCard}>
          <BriefcaseBusiness size={24} color={colors.gold} />
          <Text style={styles.emptyTitle}>{isArabic ? "لا توجد طلبات أو فرص منشورة حاليًا" : "No requests or opportunities yet"}</Text>
          <Text style={styles.emptyText}>{isArabic ? "ستظهر هنا فور نشرها." : "They will appear here as soon as they are published."}</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {items.map((item, index) => (
            <OpportunityCard key={item.id} item={item} index={index} isArabic={isArabic} />
          ))}
        </View>
      )}
    </View>
  );
}

function OpportunityCard({
  item,
  index,
  isArabic,
}: {
  item: MobilePublicOpportunity;
  index: number;
  isArabic: boolean;
}) {
  const DirectionArrow = isArabic ? ArrowLeft : ArrowRight;
  const align = isArabic ? "right" : "left";
  const isQuick = item.postingMode === "quick";
  const href = item.slug ? `/opportunities/${item.slug}` : "/opportunities";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => go(href)}
      style={({ pressed }) => [
        styles.card,
        index === 0 && styles.cardFeatured,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.topRow, isArabic ? styles.rowRtl : styles.rowLtr]}>
        <View style={[styles.badges, isArabic ? styles.rowRtl : styles.rowLtr]}>
          <View style={[styles.modeBadge, isQuick ? styles.quickBadge : styles.castingBadge]}>
            {isQuick ? <Zap size={11} color={colors.warning} /> : <BriefcaseBusiness size={11} color={colors.gold} />}
            <Text style={[styles.modeText, isQuick ? styles.quickText : styles.castingText]}>
              {isQuick ? (isArabic ? "طلب الآن" : "Quick Request") : (isArabic ? "كاستينغ" : "Casting")}
            </Text>
          </View>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{opportunityTypeLabel(item.opportunityType, isArabic)}</Text>
          </View>
        </View>
        {index === 0 ? <Text style={styles.latest}>{isArabic ? "الأحدث" : "LATEST"}</Text> : null}
      </View>

      <Text style={[styles.cardTitle, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]} numberOfLines={2}>{item.title}</Text>

      <View style={[styles.companyRow, isArabic ? styles.rowRtl : styles.rowLtr]}>
        <Building2 size={13} color="rgba(201,169,98,0.68)" />
        <Text numberOfLines={1} style={styles.company}>{item.companyName}</Text>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoCard}>
          <View style={[styles.infoLabelRow, isArabic ? styles.rowRtl : styles.rowLtr]}>
            <MapPin size={11} color="rgba(201,169,98,0.65)" />
            <Text style={styles.infoLabel}>{isArabic ? "الموقع" : "Location"}</Text>
          </View>
          <Text numberOfLines={1} style={[styles.infoValue, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{item.city || "-"}</Text>
        </View>
        <View style={styles.infoCard}>
          <View style={[styles.infoLabelRow, isArabic ? styles.rowRtl : styles.rowLtr]}>
            <Wallet size={11} color="rgba(201,169,98,0.65)" />
            <Text style={styles.infoLabel}>{isArabic ? "المقابل" : "Compensation"}</Text>
          </View>
          <Text numberOfLines={1} style={[styles.infoValue, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{formatCompensation(item, isArabic)}</Text>
        </View>
      </View>

      <View style={[styles.footerRow, isArabic ? styles.rowRtl : styles.rowLtr]}>
        <Text style={styles.footerText}>
          {isArabic ? (isQuick ? "عرض الطلب" : "عرض تفاصيل الفرصة") : (isQuick ? "View request" : "View opportunity")}
        </Text>
        <DirectionArrow size={16} color={colors.gold} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 42 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.lg },
  headerCopy: { flex: 1 },
  eyebrowRow: { alignSelf: "flex-start" },
  rowRtl: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.sm },
  rowReverse: { flexDirection: "row-reverse" },
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
  emptyTitle: { color: "rgba(255,255,255,0.72)", fontSize: 14, textAlign: "center", marginTop: spacing.md },
  emptyText: { color: colors.textMuted, fontSize: 12, lineHeight: 20, textAlign: "center", marginTop: 6 },
  list: { marginTop: spacing.xl, gap: spacing.md },
  card: { borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.025)", borderRadius: 25, padding: spacing.lg },
  cardFeatured: { borderColor: "rgba(201,169,98,0.22)", backgroundColor: "rgba(201,169,98,0.055)" },
  topRow: { justifyContent: "space-between" },
  badges: { flexWrap: "wrap", flex: 1 },
  modeBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 5 },
  quickBadge: { borderColor: "rgba(231,194,111,0.28)", backgroundColor: "rgba(231,194,111,0.08)" },
  castingBadge: { borderColor: "rgba(201,169,98,0.22)", backgroundColor: "rgba(201,169,98,0.07)" },
  modeText: { fontSize: 10, fontWeight: "600" },
  quickText: { color: colors.warning },
  castingText: { color: colors.gold },
  typeBadge: { borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.025)", borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 5 },
  typeText: { color: "rgba(255,255,255,0.48)", fontSize: 10 },
  latest: { color: "rgba(201,169,98,0.68)", fontSize: 9, fontWeight: "700" },
  cardTitle: { color: colors.textPrimary, fontSize: 17, lineHeight: 27, fontWeight: "700", marginTop: spacing.lg },
  companyRow: { alignSelf: "flex-start", marginTop: spacing.md },
  company: { color: "rgba(255,255,255,0.48)", fontSize: 12, maxWidth: 250 },
  infoGrid: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  infoCard: { flex: 1, minWidth: 0, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", backgroundColor: "rgba(0,0,0,0.15)", borderRadius: 16, paddingHorizontal: spacing.md, paddingVertical: 10 },
  infoLabelRow: { alignSelf: "flex-start" },
  infoLabel: { color: "rgba(255,255,255,0.32)", fontSize: 10 },
  infoValue: { color: "rgba(255,255,255,0.68)", fontSize: 12, fontWeight: "600", marginTop: 5 },
  footerRow: { justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)", paddingTop: spacing.md, marginTop: spacing.lg },
  footerText: { color: "rgba(255,255,255,0.38)", fontSize: 11 },
});
