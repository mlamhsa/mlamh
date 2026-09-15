import { router } from "expo-router";
import { LogIn } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { PublicHomeScreen } from "@/src/domains/home/PublicHomeScreen";
import { useLocale } from "@/src/i18n/LocaleProvider";
import { colors, radius, spacing } from "@/src/theme/tokens";

export default function PublicHomeRoute() {
  const { locale } = useLocale();
  const isArabic = locale === "ar";

  return (
    <View style={styles.container}>
      <PublicHomeScreen />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isArabic ? "تسجيل الدخول" : "Sign in"}
        onPress={() => router.push("/login" as never)}
        style={({ pressed }) => [styles.signIn, pressed && styles.pressed]}
      >
        <LogIn size={16} color={colors.background} />
        <Text style={styles.signInText}>{isArabic ? "دخول" : "Sign in"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  signIn: {
    position: "absolute",
    top: spacing.md,
    right: spacing.lg,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
  },
  signInText: { color: colors.background, fontSize: 12, fontWeight: "900" },
  pressed: { opacity: 0.86 },
});
