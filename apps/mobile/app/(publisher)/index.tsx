import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLocale } from "@/src/i18n/LocaleProvider";
import { useSessionContext } from "@/src/app/SessionContext";
import { colors, spacing, typography } from "@/src/theme/tokens";

export default function PublisherHomeFoundationScreen() {
  const { locale } = useLocale();
  const session = useSessionContext();
  const isArabic = locale === "ar";
  const account = session.status === "publisher" ? session.account : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>{isArabic ? "حساب ناشر" : "PUBLISHER"}</Text>
        <Text style={[styles.title, { textAlign: isArabic ? "right" : "left" }]}>
          {account?.displayName
            ? isArabic
              ? `مرحبًا، ${account.displayName}`
              : `Welcome, ${account.displayName}`
            : isArabic
              ? "مرحبًا"
              : "Welcome"}
        </Text>
        <Text style={[styles.subtitle, { textAlign: isArabic ? "right" : "left" }]}>
          {isArabic
            ? "هذه نقطة الدخول الجديدة للناشر. إنشاء الطلبات والفرص سيعتمد على الصلاحيات القادمة من الخادم."
            : "This is the new Publisher entry point. Creation actions will follow server-provided capabilities."}
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
