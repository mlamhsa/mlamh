import { StyleSheet, View } from "react-native";

import type { AppLocale } from "@/lib/i18n";
import { darkTheme } from "@/lib/theme";

type Variant = "list" | "profile" | "detail" | "dashboard";

export function ScreenSkeleton({ variant = "list", locale = "en", label }: { variant?: Variant; locale?: AppLocale; label?: string }) {
  const rows = variant === "profile" ? 3 : variant === "detail" ? 4 : variant === "dashboard" ? 4 : 5;
  const accessibilityLabel = label ?? (locale === "ar" ? "جارٍ تحميل المحتوى" : "Loading content");
  return <View style={styles.screen} accessibilityRole="progressbar" accessibilityLabel={accessibilityLabel}>
    <View importantForAccessibility="no-hide-descendants" style={styles.content}>
      <View style={styles.brand} />
      <View style={styles.title} />
      <View style={styles.subtitle} />
      {variant === "profile" ? <View style={styles.avatar} /> : null}
      {variant === "dashboard" ? <View style={styles.dashboardHero}><View style={styles.dashboardIdentity} /><View style={styles.dashboardMetrics}><View style={styles.metric} /><View style={styles.metric} /><View style={styles.metric} /></View></View> : null}
      {Array.from({ length: rows }).map((_, index) => <View key={index} style={[styles.card, index === 0 && variant === "detail" && styles.heroCard]} />)}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: darkTheme.background },
  content: { width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: 20, paddingTop: 56, paddingBottom: 32, gap: 14 },
  brand: { width: 76, height: 12, borderRadius: 6, backgroundColor: darkTheme.surfaceElevated },
  title: { width: "68%", height: 34, borderRadius: 10, backgroundColor: darkTheme.surfaceElevated },
  subtitle: { width: "88%", height: 16, borderRadius: 8, backgroundColor: darkTheme.surface },
  avatar: { width: 112, height: 112, borderRadius: 56, alignSelf: "center", marginVertical: 8, backgroundColor: darkTheme.surfaceElevated },
  dashboardHero: { minHeight: 180, borderRadius: 24, borderWidth: 1, borderColor: darkTheme.border, backgroundColor: darkTheme.surface, padding: 18, gap: 18 },
  dashboardIdentity: { width: "62%", height: 42, borderRadius: 12, backgroundColor: darkTheme.surfaceElevated },
  dashboardMetrics: { flexDirection: "row", gap: 8 },
  metric: { flex: 1, height: 72, borderRadius: 16, backgroundColor: darkTheme.background, borderWidth: 1, borderColor: darkTheme.border },
  card: { height: 96, borderRadius: 16, borderWidth: 1, borderColor: darkTheme.border, backgroundColor: darkTheme.surface },
  heroCard: { height: 154, borderRadius: 20 },
});
