import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { AppLocale } from "@/lib/i18n";
import { darkTheme } from "@/lib/theme";

type Theme = typeof darkTheme;
type PublisherTab = "dashboard" | "create" | "messages" | "notifications";

const tabs = [
  { key: "dashboard" as const, path: "/publisher" as const, ar: "الرئيسية", en: "Home" },
  { key: "create" as const, path: "/publisher/opportunities/new" as const, ar: "فرصة جديدة", en: "Create" },
  { key: "messages" as const, path: "/publisher/messages" as const, ar: "الرسائل", en: "Messages" },
  { key: "notifications" as const, path: "/notifications" as const, ar: "التنبيهات", en: "Alerts" },
];

export function PublisherTabBar({ active, locale, theme = darkTheme, unreadCount = 0, notificationCount = 0 }: { active: PublisherTab; locale: AppLocale; theme?: Theme; unreadCount?: number; notificationCount?: number }) {
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);
  return <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 8) }]}><View style={styles.shell}>{tabs.map((tab) => {
    const selected = active === tab.key;
    const badgeCount = tab.key === "messages" ? unreadCount : tab.key === "notifications" ? notificationCount : 0;
    const label = locale === "ar" ? tab.ar : tab.en;
    const accessibilityLabel = badgeCount > 0 ? `${label}, ${badgeCount > 99 ? "99+" : badgeCount}` : label;
    return <Pressable key={tab.key} accessibilityRole="tab" accessibilityLabel={accessibilityLabel} accessibilityState={{ selected }} hitSlop={6} style={({ pressed }) => [styles.tab, pressed && styles.pressed]} onPress={() => router.replace(tab.path)}>
      <View style={[styles.indicator, selected && styles.indicatorSelected]} />
      <View style={styles.labelRow}><Text numberOfLines={1} style={[styles.label, locale === "ar" && styles.arabicText, selected && styles.labelSelected]}>{label}</Text>{badgeCount > 0 ? <View importantForAccessibility="no-hide-descendants" style={styles.badge}><Text style={styles.badgeText}>{badgeCount > 99 ? "99+" : badgeCount}</Text></View> : null}</View>
    </Pressable>;
  })}</View></View>;
}

function createStyles(theme: Theme) { return StyleSheet.create({
  outer: { backgroundColor: theme.background },
  shell: { minHeight: 70, flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.nav, paddingHorizontal: 8, paddingTop: 7, paddingBottom: 9 },
  tab: { flex: 1, minHeight: 52, alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 3 },
  indicator: { width: 18, height: 2, borderRadius: 1, backgroundColor: "transparent" },
  indicatorSelected: { backgroundColor: theme.accent },
  labelRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, maxWidth: "100%" },
  label: { color: theme.muted, fontSize: 10, lineHeight: 14, fontWeight: "600", textAlign: "center", flexShrink: 1 },
  labelSelected: { color: theme.text, fontWeight: "800" },
  badge: { minWidth: 17, height: 17, paddingHorizontal: 4, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: theme.accent },
  badgeText: { color: theme.background, fontSize: 9, fontWeight: "900" },
  pressed: { opacity: 0.65 },
  arabicText: { letterSpacing: 0 },
}); }
