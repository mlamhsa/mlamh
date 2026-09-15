import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLocale } from "@/src/i18n/LocaleProvider";
import { colors, radius, spacing, typography } from "@/src/theme/tokens";

export default function AccountTypeFoundationScreen() {
  const { locale } = useLocale();
  const isArabic = locale === "ar";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>MLAMH</Text>
        <Text style={[styles.title, { textAlign: isArabic ? "right" : "left" }]}>
          {isArabic ? "كيف تريد استخدام ملامح؟" : "How will you use MLAMH?"}
        </Text>
        <Text style={[styles.subtitle, { textAlign: isArabic ? "right" : "left" }]}>
          {isArabic
            ? "هذه الشاشة تُفتح فقط للحساب المسجل الذي لم يحدد نوعه بعد. الربط الفعلي بالحساب سيأتي مع Auth flow."
            : "This screen is only for an authenticated user whose account type is not set yet. The action wiring comes with the Auth flow."}
        </Text>

        <View style={styles.options}>
          <Pressable accessibilityRole="button" style={styles.option} disabled>
            <Text style={styles.optionTitle}>{isArabic ? "أبحث عن فرص" : "I am looking for opportunities"}</Text>
            <Text style={styles.optionText}>{isArabic ? "أنشئ ملف موهبة وابدأ الوصول للفرص." : "Create a talent profile and start discovering opportunities."}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.option} disabled>
            <Text style={styles.optionTitle}>{isArabic ? "أبحث عن مواهب" : "I am looking for talent"}</Text>
            <Text style={styles.optionText}>{isArabic ? "أنشئ طلبًا أو فرصة واعثر على المواهب المناسبة." : "Create a request or casting opportunity and find the right talent."}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, justifyContent: "center", paddingHorizontal: spacing.xxl },
  eyebrow: { color: colors.gold, fontSize: typography.eyebrow, letterSpacing: 4, marginBottom: spacing.md },
  title: { color: colors.textPrimary, fontSize: 32, fontWeight: "300" },
  subtitle: { color: colors.textSecondary, fontSize: typography.body, lineHeight: 24, marginTop: spacing.md },
  options: { gap: spacing.md, marginTop: spacing.xxxl },
  option: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, backgroundColor: colors.surface, padding: spacing.xl, opacity: 0.72 },
  optionTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "600" },
  optionText: { color: colors.textMuted, fontSize: typography.caption, lineHeight: 20, marginTop: spacing.sm },
});
