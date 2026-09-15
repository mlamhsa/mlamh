import { router } from "expo-router";
import { ArrowLeft, ArrowRight } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLocale } from "@/src/i18n/LocaleProvider";
import { colors, radius, spacing, typography } from "@/src/theme/tokens";

export function SectionPlaceholder({
  titleAr,
  titleEn,
  descriptionAr,
  descriptionEn,
}: {
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
}) {
  const { locale } = useLocale();
  const isArabic = locale === "ar";
  const BackIcon = isArabic ? ArrowRight : ArrowLeft;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <BackIcon size={18} color={colors.textSecondary} />
          <Text style={styles.backText}>{isArabic ? "رجوع" : "Back"}</Text>
        </Pressable>
        <Text style={[styles.title, { textAlign: isArabic ? "right" : "left" }]}>
          {isArabic ? titleAr : titleEn}
        </Text>
        <Text style={[styles.description, { textAlign: isArabic ? "right" : "left" }]}>
          {isArabic ? descriptionAr : descriptionEn}
        </Text>
        <View style={styles.card}>
          <Text style={[styles.cardText, { textAlign: isArabic ? "right" : "left" }]}>
            {isArabic
              ? "المسار موجود الآن داخل Native V3، وسيتم استبدال هذه الشاشة بالتجربة الكاملة في مرحلتها التالية."
              : "This route now exists in Native V3 and will be replaced with the full experience in its next implementation phase."}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: spacing.xxl, paddingTop: spacing.xl },
  backButton: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 44 },
  backText: { color: colors.textSecondary, fontSize: typography.caption },
  title: { color: colors.textPrimary, fontSize: 32, fontWeight: "300", marginTop: spacing.xxxl },
  description: { color: colors.textSecondary, fontSize: typography.body, lineHeight: 25, marginTop: spacing.md },
  card: { marginTop: spacing.xxxl, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, backgroundColor: colors.surface, padding: spacing.xl },
  cardText: { color: colors.textMuted, fontSize: typography.caption, lineHeight: 20 },
});
