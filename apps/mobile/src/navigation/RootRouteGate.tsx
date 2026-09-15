import { Redirect, type Href } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLocale } from "@/src/i18n/LocaleProvider";
import { useSessionContext } from "@/src/app/SessionContext";
import { colors, spacing, typography } from "@/src/theme/tokens";

const ROUTES = {
  public: "/(public)",
  accountType: "/account-type",
  talent: "/(talent)",
  publisher: "/(publisher)",
} as const;

export function RootRouteGate() {
  const session = useSessionContext();
  const { locale, hydrated } = useLocale();

  if (!hydrated || session.status === "loading") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loading}>
          <Text style={styles.brand}>MLAMH</Text>
          <ActivityIndicator color={colors.gold} />
          <Text style={styles.loadingText}>
            {locale === "ar" ? "جارٍ تجهيز ملامح…" : "Preparing MLAMH…"}
          </Text>
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
  brand: {
    color: colors.gold,
    fontSize: typography.eyebrow,
    letterSpacing: 4,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: typography.caption,
  },
});
