import { router } from "expo-router";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Building2,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "@/src/theme/tokens";

type Props = {
  isArabic: boolean;
};

type ScenePath = {
  key: string;
  label: string;
  text: string;
  href: string;
  icon: LucideIcon;
};

export function HomeSceneSection({ isArabic }: Props) {
  const DirectionArrow = isArabic ? ArrowLeft : ArrowRight;
  const align = isArabic ? "right" : "left";

  const paths: ScenePath[] = [
    {
      key: "talent",
      icon: UserRound,
      label: isArabic ? "للمواهب" : "For talent",
      text: isArabic ? "ملفك، صورك، الكاستينغ ومسارك المهني" : "Your profile, media, casting and career",
      href: "/scene/category/talent",
    },
    {
      key: "publishers",
      icon: Building2,
      label: isArabic ? "للناشرين" : "For publishers",
      text: isArabic ? "الطلبات، الاختيار وإدارة المواهب" : "Briefs, selection and talent workflow",
      href: "/scene/category/publishers",
    },
    {
      key: "using-mlamh",
      icon: BookOpenText,
      label: isArabic ? "استخدام ملامح" : "Using MLAMH",
      text: isArabic ? "شروحات عملية لكل خطوة داخل المنصة" : "Practical help for every step in the platform",
      href: "/scene/category/using-mlamh",
    },
  ];

  return (
    <View style={styles.section}>
      <View style={[styles.eyebrowRow, isArabic ? styles.rowRtl : styles.rowLtr]}>
        <Sparkles size={14} color={colors.gold} />
        <Text style={styles.eyebrow}>MLAMH SCENE</Text>
      </View>

      <Text style={[styles.title, { textAlign: align }]}>
        {isArabic ? "ادخل مشهد ملامح" : "Enter MLAMH Scene"}
      </Text>
      <Text style={[styles.description, { textAlign: align }]}>
        {isArabic
          ? "مساحة داخل ملامح تجمع المعرفة العملية، شروحات المنصة، الكاستينغ وصناعة المواهب في مكان واحد."
          : "A space inside MLAMH for practical knowledge, platform guidance, casting and the talent industry."}
      </Text>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/scene")}
        style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
      >
        <Text style={styles.primaryButtonText}>{isArabic ? "استكشف المشهد" : "Explore the Scene"}</Text>
        <DirectionArrow size={16} color="#090909" />
      </Pressable>

      <View style={styles.paths}>
        {paths.map((item) => {
          const Icon = item.icon;
          return (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              onPress={() => router.push(item.href as never)}
              style={({ pressed }) => [styles.pathCard, pressed && styles.pressed]}
            >
              <View style={[styles.pathTop, isArabic ? styles.rowRtl : styles.rowLtr]}>
                <Icon size={20} color={colors.gold} />
                <DirectionArrow size={14} color="rgba(201,169,98,0.72)" />
              </View>
              <Text style={[styles.pathTitle, { textAlign: align }]}>{item.label}</Text>
              <Text style={[styles.pathText, { textAlign: align }]}>{item.text}</Text>
              <Text style={[styles.startText, { textAlign: align }]}>{isArabic ? "ابدأ من هنا" : "Start here"}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 44,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    paddingVertical: 36,
  },
  rowRtl: { flexDirection: "row-reverse" },
  rowLtr: { flexDirection: "row" },
  eyebrowRow: { alignItems: "center", gap: spacing.sm },
  eyebrow: { color: colors.gold, fontSize: 10, fontWeight: "600", letterSpacing: 1.8 },
  title: { color: colors.textPrimary, fontSize: 29, lineHeight: 36, fontWeight: "500", marginTop: spacing.md },
  description: { color: "rgba(255,255,255,0.50)", fontSize: 13, lineHeight: 24, marginTop: spacing.md },
  primaryButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: 13,
    marginTop: spacing.xl,
  },
  primaryButtonText: { color: "#090909", fontSize: 13, fontWeight: "700" },
  paths: { gap: spacing.md, marginTop: spacing.xxl },
  pathCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.025)",
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  pathTop: { alignItems: "center", justifyContent: "space-between" },
  pathTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "600", marginTop: spacing.lg },
  pathText: { color: "rgba(255,255,255,0.40)", fontSize: 12, lineHeight: 20, marginTop: spacing.sm },
  startText: { color: "rgba(201,169,98,0.72)", fontSize: 11, marginTop: spacing.lg },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
});
