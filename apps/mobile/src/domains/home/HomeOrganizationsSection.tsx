import { router } from "expo-router";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Clapperboard,
  Sparkles,
  type LucideIcon,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "@/src/theme/tokens";

type Props = {
  isArabic: boolean;
};

type OrganizationItem = {
  key: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
};

export function HomeOrganizationsSection({ isArabic }: Props) {
  const DirectionArrow = isArabic ? ArrowLeft : ArrowRight;
  const align = isArabic ? "right" : "left";

  const organizations: OrganizationItem[] = [
    {
      key: "agencies",
      title: isArabic ? "وكالات الإعلان" : "Ad agencies",
      subtitle: isArabic ? "إعلان وإبداع" : "Advertising & creative",
      icon: Sparkles,
    },
    {
      key: "production",
      title: isArabic ? "شركات الإنتاج" : "Production companies",
      subtitle: isArabic ? "إنتاج مرئي" : "Film & production",
      icon: Clapperboard,
    },
    {
      key: "casting",
      title: isArabic ? "مديرو الكاست" : "Casting directors",
      subtitle: isArabic ? "اختيار المواهب" : "Talent casting",
      icon: BriefcaseBusiness,
    },
    {
      key: "brands",
      title: isArabic ? "العلامات التجارية" : "Brands",
      subtitle: isArabic ? "مشاريع تجارية" : "Commercial projects",
      icon: Building2,
    },
  ];

  return (
    <View style={styles.section}>
      <View style={[styles.header, isArabic ? styles.rowRtl : styles.rowLtr]}>
        <View style={styles.headerText}>
          <View style={[styles.eyebrowRow, isArabic ? styles.rowRtl : styles.rowLtr]}>
            <Building2 size={14} color={colors.gold} />
            <Text style={styles.eyebrow}>{isArabic ? "للناشرين" : "FOR PUBLISHERS"}</Text>
          </View>
          <Text style={[styles.title, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>
            {isArabic ? "انشر احتياجك" : "Post what you need"}
          </Text>
          <Text style={[styles.description, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>
            {isArabic
              ? "سواء كنت فردًا أو صاحب مشروع أو متجرًا أو شركة، أنشئ طلبك أو فرصتك واعثر على الموهبة المناسبة."
              : "Whether you are an individual, business, or organization, post your need and find the right talent."}
          </Text>
        </View>

        <Pressable accessibilityRole="button" onPress={() => router.push("/publishers")} style={styles.viewAll}>
          <Text style={styles.viewAllText}>{isArabic ? "عرض الكل" : "View all"}</Text>
          <DirectionArrow size={13} color={colors.textMuted} />
        </Pressable>
      </View>

      <View style={[styles.dividerRow, isArabic ? styles.rowRtl : styles.rowLtr]}>
        <View style={styles.divider} />
        <View style={styles.dividerGold} />
      </View>

      <View style={styles.grid}>
        {organizations.map((item) => {
          const Icon = item.icon;
          return (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              onPress={() => router.push("/publishers")}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            >
              <View style={[styles.cardTop, isArabic ? styles.rowRtl : styles.rowLtr]}>
                <Icon size={24} color={colors.goldSoft} />
                <DirectionArrow size={15} color="rgba(255,255,255,0.24)" />
              </View>
              <View style={styles.cardBottom}>
                <Text style={[styles.subtitle, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{item.subtitle}</Text>
                <Text style={[styles.cardTitle, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{item.title}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 44, paddingTop: 10 },
  header: { alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md },
  headerText: { flex: 1, minWidth: 0 },
  rowRtl: { flexDirection: "row-reverse" },
  rowLtr: { flexDirection: "row" },
  eyebrowRow: { alignItems: "center", gap: spacing.sm },
  eyebrow: { color: "rgba(201,169,98,0.82)", fontSize: 11, fontWeight: "600" },
  title: { color: colors.textPrimary, fontSize: 25, lineHeight: 31, fontWeight: "700", marginTop: spacing.sm },
  description: { color: "rgba(255,255,255,0.40)", fontSize: 13, lineHeight: 22, marginTop: spacing.sm },
  viewAll: {
    marginTop: 26,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.025)",
    borderRadius: radius.pill,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  viewAllText: { color: colors.textMuted, fontSize: 12 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.lg },
  divider: { height: 1, flex: 1, backgroundColor: "rgba(255,255,255,0.07)" },
  dividerGold: { height: 1, width: 48, backgroundColor: "rgba(201,169,98,0.35)" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.lg },
  card: {
    width: "48%",
    minHeight: 158,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.025)",
    padding: spacing.lg,
  },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  cardTop: { alignItems: "flex-start", justifyContent: "space-between" },
  cardBottom: { marginTop: "auto", paddingTop: 28 },
  subtitle: { color: "rgba(255,255,255,0.30)", fontSize: 10 },
  cardTitle: { color: colors.textPrimary, fontSize: 16, lineHeight: 23, fontWeight: "700", marginTop: 4 },
});
