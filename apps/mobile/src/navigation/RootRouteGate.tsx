import { Redirect, type Href } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLocale } from "@/src/i18n/LocaleProvider";
import { useSessionContext } from "@/src/app/SessionContext";
import { colors, radius, spacing, typography } from "@/src/theme/tokens";

const ROUTES = {
  public: "/public-home",
  accountType: "/account-type",
  talent: "/talent-home",
  publisher: "/publisher-home",
} as const;

export function RootRouteGate() {
  const session = useSessionContext();
  const { locale, hydrated } = useLocale();
  const isArabic = locale === "ar";

  if (!hydrated || session.status === "loading") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loading}>
          <Text style={styles.brand}>MLAMH</Text>
          <ActivityIndicator color={colors.gold} />
          <Text style={styles.loadingText}>
            {isArabic ? "جارٍ تجهيز ملامح…" : "Preparing MLAMH…"}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (session.status === "unavailable") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorState}>
          <Text style={styles.brand}>MLAMH</Text>
          <Text style={styles.errorTitle}>
            {isArabic ? "تعذر الاتصال بملامح" : "Unable to reach MLAMH"}
          </Text>
          <Text style={styles.errorText}>
            {isArabic
              ? "تحقق من اتصالك بالإنترنت ثم حاول مرة أخرى. لن نغيّر نوع حسابك بسبب مشكلة اتصال مؤقتة."
              : "Check your internet connection and try again. A temporary connection issue will not change your account type."}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void session.refresh()}
            style={({ pressed }) => [styles.retryButton, pressed && styles.retryPressed]}
          >
            <Text style={styles.retryText}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (session.status === "guest") {
    return <Redirect href={ROUTES.public as Href} />;
  }

  if (session.status === "account_missing") {
    return <Redirect href={ROUTES.accountType as Href} />;
  }

  if (session.status === "talent") {
    return <Redirect href={ROUTES.talent as Href} />;
  }

  return <Redirect href={ROUTES.publisher as Href} />;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  errorState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  brand: {
    color: colors.gold,
    fontSize: typography.eyebrow,
    letterSpacing: 4,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: typography.caption,
  },
  errorTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginTop: spacing.sm,
  },
  errorText: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 360,
  },
  retryButton: {
    minWidth: 180,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
  retryPressed: {
    opacity: 0.84,
  },
  retryText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: "800",
  },
});
