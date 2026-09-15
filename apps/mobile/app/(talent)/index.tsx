import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLocale } from "@/src/i18n/LocaleProvider";
import { useSessionContext } from "@/src/app/SessionContext";
import { colors, spacing, typography } from "@/src/theme/tokens";

export default function TalentHomeFoundationScreen() {
  const { locale } = useLocale();
  const session = useSessionContext();
  const isArabic = locale === "ar";
  const name = session.status === "talent" ? session.account.displayName : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>{isArabic ? "حساب موهبة" : "TALENT"}</Text>
        <Text style={[styles.title, { textAlign: isArabic ? "right" : "left" }]}>
          {name ? (isArabic ? `مرحبًا، ${name}` : `Welcome, ${name}`) : isArabic ? "مرحبًا" : "Welcome"}
        </Text>
        <Text style={[styles.subtitle, { textAlign: isArabic ? "right" : "left" }]}>
          {isArabic
            ? "هذه هي نقطة الدخول الجديدة للموهبة. ستُبنى Home حسب حالة الملف بدل نسخ Dashboard الويب."
            : "This is the new Talent entry point. Home will be state-aware rather than a copy of the Web dashboard."}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, justifyContent: "center", paddingHorizontal: spacing.xxl },
  eyebrow: { color: colors.gold, fontSize: typography.eyebrow, letterSpacing: 3, marginBottom: spacing.md },
  title: { color: colors.textPrimary, fontSize: 34, fontWeight: "300" },
  subtitle: { color: colors.textSecondary, fontSize: typography.body, lineHeight: 24, marginTop: spacing.md },
});
