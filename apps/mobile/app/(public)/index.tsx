import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLocale } from "@/src/i18n/LocaleProvider";
import { colors, radius, spacing, typography } from "@/src/theme/tokens";

export default function PublicHomeFoundationScreen() {
  const { locale } = useLocale();
  const isArabic = locale === "ar";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>MLAMH</Text>
        <Text style={[styles.title, { textAlign: isArabic ? "right" : "left" }]}>
          {isArabic ? "ملامح" : "MLAMH"}
        </Text>
        <Text style={[styles.subtitle, { textAlign: isArabic ? "right" : "left" }]}>
          {isArabic
            ? "الواجهة العامة الجديدة ستُبنى هنا مباشرة من تجربة Mobile Web الحالية."
            : "The new public experience will be rebuilt here directly from the current Mobile Web."}
        </Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{isArabic ? "Public shell" : "Public shell"}</Text>
          <Text style={[styles.cardText, { textAlign: isArabic ? "right" : "left" }]}>
            {isArabic
              ? "الخطوة التالية: Hero ثم الوصول السريع والمواهب والفرص وScene بنفس ترتيب الويب الحالي."
              : "Next: Hero, quick access, talents, opportunities and Scene in the current Web order."}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, justifyContent: "center", paddingHorizontal: spacing.xxl },
  eyebrow: { color: colors.gold, fontSize: typography.eyebrow, letterSpacing: 4, marginBottom: spacing.md },
  title: { color: colors.textPrimary, fontSize: 44, fontWeight: "300" },
  subtitle: { color: colors.textSecondary, fontSize: typography.body, lineHeight: 24, marginTop: spacing.md },
  card: { marginTop: spacing.xxxl, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, backgroundColor: colors.surface, padding: spacing.xl },
  cardTitle: { color: colors.gold, fontSize: typography.caption, marginBottom: spacing.sm },
  cardText: { color: colors.textMuted, fontSize: typography.caption, lineHeight: 20 },
});
