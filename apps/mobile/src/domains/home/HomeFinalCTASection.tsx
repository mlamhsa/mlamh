import { router } from "expo-router";
import { ArrowUpLeft, ArrowUpRight, BriefcaseBusiness, Sparkles, Users } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "@/src/theme/tokens";

type Props = {
  isArabic: boolean;
};

export function HomeFinalCTASection({ isArabic }: Props) {
  const ArrowIcon = isArabic ? ArrowUpLeft : ArrowUpRight;
  const align = isArabic ? "right" : "left";

  return (
    <View style={styles.section}>
      <View style={styles.shell}>
        <View style={styles.badge}>
          <Sparkles size={14} color={colors.gold} />
          <Text style={styles.badgeText}>MLAMH</Text>
        </View>

        <Text style={styles.title}>
          {isArabic ? "مكان واحد تبدأ منه فرصتك القادمة." : "One Place to Start What Comes Next."}
        </Text>
        <Text style={styles.description}>
          {isArabic
            ? "سواء كنت موهبة تبحث عن فرصة، أو جهة تبحث عن الشخص المناسب لمشروعها، ملامح تجمع رحلة الاكتشاف والتقديم والكاست في تجربة واحدة."
            : "Whether you're talent looking for your next opportunity or an organization searching for the right person, MLAMH brings discovery, applications, and casting into one experience."}
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/account-type")}
          style={({ pressed }) => [styles.talentCard, pressed && styles.pressed]}
        >
          <Users size={24} color="#090909" />
          <Text style={styles.talentEyebrow}>{isArabic ? "للمواهب" : "FOR TALENT"}</Text>
          <Text style={styles.talentTitle}>{isArabic ? "أنشئ ملفك المهني" : "Create Your Talent Profile"}</Text>
          <Text style={styles.talentText}>
            {isArabic ? "اعرض أعمالك، اكتشف الفرص وابدأ التقديم." : "Show your work, discover opportunities, and start applying."}
          </Text>
          <View style={[styles.cardFooter, isArabic ? styles.rowRtl : styles.rowLtr]}>
            <Text style={styles.talentFooterText}>{isArabic ? "ابدأ الآن" : "Get Started"}</Text>
            <ArrowIcon size={20} color="#090909" />
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/account-type")}
          style={({ pressed }) => [styles.publisherCard, pressed && styles.pressed]}
        >
          <BriefcaseBusiness size={24} color={colors.gold} />
          <Text style={[styles.publisherEyebrow, { textAlign: align }]}>{isArabic ? "للجهات" : "FOR ORGANIZATIONS"}</Text>
          <Text style={[styles.publisherTitle, { textAlign: align }]}>
            {isArabic ? "انشر فرصك واكتشف المواهب" : "Publish & Discover Talent"}
          </Text>
          <Text style={[styles.publisherText, { textAlign: align }]}>
            {isArabic
              ? "أنشئ فرص الكاست، استقبل المتقدمين واختر الأنسب."
              : "Create casting opportunities, review applicants, and choose the right talent."}
          </Text>
          <View style={[styles.cardFooter, isArabic ? styles.rowRtl : styles.rowLtr]}>
            <Text style={styles.publisherFooterText}>{isArabic ? "سجل كجهة" : "Join as Organization"}</Text>
            <ArrowIcon size={20} color={colors.gold} />
          </View>
        </Pressable>

        <View style={styles.footerLine}>
          <Text style={styles.footerText}>
            {isArabic ? "مواهب • جهات • فرص • كاستينغ" : "TALENT • ORGANIZATIONS • OPPORTUNITIES • CASTING"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 44, paddingBottom: 18 },
  shell: {
    borderWidth: 1,
    borderColor: "rgba(201,169,98,0.16)",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderRadius: 30,
    padding: spacing.xl,
  },
  badge: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(201,169,98,0.25)",
    backgroundColor: "rgba(201,169,98,0.07)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  badgeText: { color: colors.gold, fontSize: 10, fontWeight: "600", letterSpacing: 1.8 },
  title: { color: colors.textPrimary, fontSize: 29, lineHeight: 36, fontWeight: "500", textAlign: "center", marginTop: spacing.xl },
  description: { color: "rgba(255,255,255,0.50)", fontSize: 13, lineHeight: 23, textAlign: "center", marginTop: spacing.md },
  talentCard: { backgroundColor: colors.gold, borderRadius: 24, padding: spacing.xl, marginTop: spacing.xxl },
  talentEyebrow: { color: "rgba(9,9,9,0.58)", fontSize: 10, marginTop: spacing.xl },
  talentTitle: { color: "#090909", fontSize: 20, lineHeight: 27, fontWeight: "700", marginTop: spacing.sm },
  talentText: { color: "rgba(9,9,9,0.64)", fontSize: 13, lineHeight: 21, marginTop: spacing.md },
  publisherCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderRadius: 24,
    padding: spacing.xl,
    marginTop: spacing.md,
  },
  publisherEyebrow: { color: "rgba(255,255,255,0.30)", fontSize: 10, marginTop: spacing.xl },
  publisherTitle: { color: colors.textPrimary, fontSize: 20, lineHeight: 27, fontWeight: "500", marginTop: spacing.sm },
  publisherText: { color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 21, marginTop: spacing.md },
  cardFooter: { alignItems: "center", justifyContent: "space-between", marginTop: spacing.xl },
  rowRtl: { flexDirection: "row-reverse" },
  rowLtr: { flexDirection: "row" },
  talentFooterText: { color: "rgba(9,9,9,0.82)", fontSize: 13, fontWeight: "600" },
  publisherFooterText: { color: "rgba(255,255,255,0.58)", fontSize: 13 },
  footerLine: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)", marginTop: spacing.xl, paddingTop: spacing.lg },
  footerText: { color: "rgba(255,255,255,0.25)", fontSize: 10, textAlign: "center" },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
});
