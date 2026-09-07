import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { AppLocale } from "@/lib/i18n";
import { darkTheme } from "@/lib/theme";

type Variant = "list" | "profile" | "detail" | "dashboard";

export function ScreenSkeleton({ variant = "list", locale = "en", label }: { variant?: Variant; locale?: AppLocale; label?: string }) {
  const rows = variant === "profile" ? 3 : variant === "detail" ? 4 : variant === "dashboard" ? 4 : 5;
  const accessibilityLabel = label ?? (locale === "ar" ? "جارٍ تحميل المحتوى" : "Loading content");
  const isArabic = locale === "ar";
  return <SafeAreaView edges={["top"]} style={styles.screen} accessibilityRole="progressbar" accessibilityLabel={accessibilityLabel}>
    <View importantForAccessibility="no-hide-descendants" style={styles.content}>
      <View style={[styles.loadingRow, isArabic && styles.loadingRowRtl]}><ActivityIndicator size="small" color={darkTheme.accent}/><Text style={[styles.loadingText, isArabic && styles.loadingTextRtl]}>{accessibilityLabel}</Text></View>
      <View style={styles.brand} />
      <View style={styles.title} />
      <View style={styles.subtitle} />
      {variant === "profile" ? <View style={styles.avatar} /> : null}
      {variant === "dashboard" ? <View style={styles.dashboardHero}><View style={styles.dashboardIdentity} /><View style={styles.dashboardMetrics}><View style={styles.metric} /><View style={styles.metric} /><View style={styles.metric} /></View></View> : null}
      {Array.from({ length: rows }).map((_, index) => <View key={index} style={[styles.card, index === 0 && variant === "detail" && styles.heroCard]} />)}
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: darkTheme.background },
  content: { width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 32, gap: 12 },
  loadingRow: { minHeight: 34, flexDirection: "row", alignItems: "center", gap: 9 },
  loadingRowRtl: { flexDirection: "row-reverse", justifyContent: "flex-start" },
  loadingText: { color: darkTheme.muted, fontSize: 11, fontWeight: "700" },
  loadingTextRtl: { textAlign: "right", writingDirection: "rtl" },
  brand: { width: 72, height: 10, borderRadius: 5, backgroundColor: darkTheme.surfaceElevated },
  title: { width: "62%", height: 30, borderRadius: 10, backgroundColor: darkTheme.surfaceElevated },
  subtitle: { width: "84%", height: 14, borderRadius: 7, backgroundColor: darkTheme.surface },
  avatar: { width: 108, height: 108, borderRadius: 54, alignSelf: "center", marginVertical: 6, backgroundColor: darkTheme.surfaceElevated },
  dashboardHero: { minHeight: 170, borderRadius: 24, borderWidth: 1, borderColor: darkTheme.border, backgroundColor: darkTheme.surface, padding: 16, gap: 16 },
  dashboardIdentity: { width: "58%", height: 38, borderRadius: 12, backgroundColor: darkTheme.surfaceElevated },
  dashboardMetrics: { flexDirection: "row", gap: 8 },
  metric: { flex: 1, height: 68, borderRadius: 16, backgroundColor: darkTheme.background, borderWidth: 1, borderColor: darkTheme.border },
  card: { height: 92, borderRadius: 18, borderWidth: 1, borderColor: darkTheme.border, backgroundColor: darkTheme.surface },
  heroCard: { height: 148, borderRadius: 20 },
});
