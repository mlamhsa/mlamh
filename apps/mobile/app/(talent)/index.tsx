import { router } from "expo-router";
import { ArrowLeft, ArrowRight, ClipboardList } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLocale } from "@/src/i18n/LocaleProvider";
import { useSessionContext } from "@/src/app/SessionContext";
import { colors, radius, spacing, typography } from "@/src/theme/tokens";

export default function TalentHomeFoundationScreen() {
  const { locale } = useLocale();
  const session = useSessionContext();
  const isArabic = locale === "ar";
  const DirectionArrow = isArabic ? ArrowLeft : ArrowRight;
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

        <Pressable onPress={() => router.push("/applications")} style={({ pressed }) => [styles.applicationsCard, pressed && styles.pressed]}>
          <View style={styles.iconWrap}><ClipboardList size={22} color={colors.gold} /></View>
          <View style={styles.cardCopy}>
            <Text style={[styles.cardTitle, { textAlign: isArabic ? "right" : "left" }]}>{isArabic ? "طلباتي" : "My applications"}</Text>
            <Text style={[styles.cardText, { textAlign: isArabic ? "right" : "left" }]}>{isArabic ? "تابع طلبات الآن والكاستينغ وحالاتها الصحيحة." : "Track Quick Requests, Casting applications, and their correct states."}</Text>
          </View>
          <DirectionArrow size={17} color={colors.textMuted} />
        </Pressable>
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
  applicationsCard: { marginTop: spacing.xxxl, minHeight: 108, flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg },
  iconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(201,169,98,0.22)", backgroundColor: "rgba(201,169,98,0.06)" },
  cardCopy: { flex: 1 },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "700" },
  cardText: { color: colors.textMuted, fontSize: 11, lineHeight: 18, marginTop: 5 },
  pressed: { opacity: 0.84, transform: [{ scale: 0.994 }] },
});
