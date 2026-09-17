import { router } from "expo-router";
import { BriefcaseBusiness, UserRound } from "lucide-react-native";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { useSessionContext } from "@/src/runtime/SessionContext";
import { selectMobileAccountType } from "@/src/domains/account/api";
import { useLocale } from "@/src/i18n/LocaleProvider";
import { colors, radius, spacing, typography } from "@/src/theme/tokens";

type AccountType = "talent" | "publisher";

export default function AccountTypeScreen() {
  const { locale } = useLocale();
  const session = useSessionContext();
  const isArabic = locale === "ar";
  const align = isArabic ? "right" : "left";
  const [saving, setSaving] = useState<AccountType | null>(null);

  async function choose(accountType: AccountType) {
    if (saving) return;
    if (session.status === "guest") {
      router.push(`/register?type=${accountType}` as never);
      return;
    }
    if (session.status === "account_missing") {
      router.push(`/setup-account?type=${accountType}` as never);
      return;
    }
    setSaving(accountType);
    try {
      await selectMobileAccountType(accountType);
      await session.refresh();
      router.replace("/" as never);
    } catch {
      Alert.alert(
        isArabic ? "تعذر إكمال الحساب" : "Unable to finish setup",
        isArabic
          ? "لم نتمكن من حفظ نوع الحساب الآن. تحقق من اتصالك ثم حاول مرة أخرى."
          : "We could not save your account type. Check your connection and try again.",
      );
    } finally {
      setSaving(null);
    }
  }

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>MLAMH</Text>
        <Text style={[styles.title, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>
          {isArabic ? "كيف تريد استخدام ملامح؟" : "How will you use MLAMH?"}
        </Text>
        <Text style={[styles.subtitle, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>
          {isArabic
            ? "اختر المسار الأقرب لك الآن. يمكنك بدء ملف موهبة أو استخدام ملامح للبحث عن المواهب."
            : "Choose the path that fits you now. Start as talent or use MLAMH to find talent."}
        </Text>

        <View style={styles.options}>
          <Pressable
            accessibilityRole="button"
            disabled={Boolean(saving)}
            onPress={() => void choose("talent")}
            style={({ pressed }) => [styles.option, pressed && styles.pressed, saving && styles.disabled]}
          >
            <View style={isArabic ? styles.rowRtl : styles.rowLtr}>
              <View style={styles.iconBox}><UserRound size={22} color={colors.gold} /></View>
              <View style={styles.flexOne}>
                <Text style={[styles.optionTitle, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>
                  {isArabic ? "أنا موهبة" : "I am talent"}
                </Text>
                <Text style={[styles.optionText, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>
                  {isArabic
                    ? "أنشئ ملفك المهني واكتشف الفرص المناسبة لك."
                    : "Build your professional profile and discover opportunities."}
                </Text>
              </View>
            </View>
            {saving === "talent" ? (
              <Text style={styles.savingText}>{isArabic ? "جارٍ التجهيز…" : "Setting up…"}</Text>
            ) : null}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={Boolean(saving)}
            onPress={() => void choose("publisher")}
            style={({ pressed }) => [styles.option, pressed && styles.pressed, saving && styles.disabled]}
          >
            <View style={isArabic ? styles.rowRtl : styles.rowLtr}>
              <View style={styles.iconBox}><BriefcaseBusiness size={22} color={colors.gold} /></View>
              <View style={styles.flexOne}>
                <Text style={[styles.optionTitle, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>
                  {isArabic ? "أبحث عن مواهب" : "I am looking for talent"}
                </Text>
                <Text style={[styles.optionText, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>
                  {isArabic
                    ? "أنشئ طلبًا أو فرصة وابدأ الوصول للمواهب المناسبة."
                    : "Create a request or opportunity and start finding the right talent."}
                </Text>
              </View>
            </View>
            {saving === "publisher" ? (
              <Text style={styles.savingText}>{isArabic ? "جارٍ التجهيز…" : "Setting up…"}</Text>
            ) : null}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, justifyContent: "center", paddingHorizontal: spacing.xxl },
  eyebrow: { color: colors.gold, fontSize: typography.eyebrow, letterSpacing: 4, marginBottom: spacing.md },
  title: { color: colors.textPrimary, fontSize: 32, lineHeight: 40, fontWeight: "700" },
  subtitle: { color: colors.textSecondary, fontSize: typography.body, lineHeight: 24, marginTop: spacing.md },
  options: { gap: spacing.md, marginTop: spacing.xxxl },
  option: {
    borderWidth: 1,
    borderColor: "rgba(201,169,98,0.22)",
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    padding: spacing.xl,
  },
  rowRtl: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.lg },
  rowLtr: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  iconBox: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    backgroundColor: "rgba(201,169,98,0.08)",
    borderWidth: 1,
    borderColor: "rgba(201,169,98,0.18)",
  },
  flexOne: { flex: 1 },
  optionTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "700" },
  optionText: { color: colors.textMuted, fontSize: typography.caption, lineHeight: 20, marginTop: spacing.sm },
  savingText: { color: colors.gold, fontSize: 11, marginTop: spacing.md, textAlign: "center" },
  pressed: { opacity: 0.84, transform: [{ scale: 0.995 }] },
  disabled: { opacity: 0.6 },
});
