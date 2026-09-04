import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import type { AppLocale } from "@/lib/i18n";
import { darkTheme, lightTheme } from "@/lib/theme";

type Theme = typeof lightTheme | typeof darkTheme;
type PublisherTab = "dashboard" | "create" | "messages" | "notifications";

const tabs = [
  { key: "dashboard" as const, path: "/publisher" as const, ar: "الرئيسية", en: "Dashboard" },
  { key: "create" as const, path: "/publisher/opportunities/new" as const, ar: "فرصة", en: "New" },
  { key: "messages" as const, path: "/publisher/messages" as const, ar: "الرسائل", en: "Messages" },
  { key: "notifications" as const, path: "/notifications" as const, ar: "التنبيهات", en: "Alerts" },
];

export function PublisherTabBar({ active, locale, theme, unreadCount = 0, notificationCount = 0 }: { active: PublisherTab; locale: AppLocale; theme: Theme; unreadCount?: number; notificationCount?: number }) {
  const styles = createStyles(theme);
  return <View style={styles.outer}><View style={styles.shell}>{tabs.map((tab) => {
    const selected = active === tab.key;
    const badgeCount = tab.key === "messages" ? unreadCount : tab.key === "notifications" ? notificationCount : 0;
    const label = locale === "ar" ? tab.ar : tab.en;
    const accessibilityLabel = badgeCount > 0 ? `${label}, ${badgeCount > 99 ? "99+" : badgeCount}` : label;
    return <Pressable
      key={tab.key}
      accessibilityRole="tab"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      hitSlop={6}
      style={styles.tab}
      onPress={() => router.replace(tab.path)}
    ><Text style={[styles.label, selected && styles.selected]}>{label}</Text>{badgeCount > 0 ? <View importantForAccessibility="no-hide-descendants" style={styles.badge}><Text style={styles.badgeText}>{badgeCount > 99 ? "99+" : badgeCount}</Text></View> : null}{selected ? <View importantForAccessibility="no-hide-descendants" style={styles.dot} /> : null}</Pressable>;
  })}</View></View>;
}

function createStyles(theme: Theme) { return StyleSheet.create({ outer: { backgroundColor: theme.background, paddingHorizontal: 12, paddingBottom: 10 }, shell: { flexDirection: "row", borderWidth: 1, borderColor: theme.border, borderRadius: 26, backgroundColor: theme.surface, paddingHorizontal: 5, paddingVertical: 9 }, tab: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", gap: 5 }, label: { color: theme.muted, fontSize: 10, fontWeight: "700" }, selected: { color: theme.accent }, dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: theme.accent }, badge: { position: "absolute", top: 2, right: 8, minWidth: 17, height: 17, paddingHorizontal: 4, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: theme.accent }, badgeText: { color: "#181818", fontSize: 9, fontWeight: "800" } }); }
