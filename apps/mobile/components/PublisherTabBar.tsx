import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import type { AppLocale } from "@/lib/i18n";
import { darkTheme, lightTheme } from "@/lib/theme";

type Theme = typeof lightTheme | typeof darkTheme;
type PublisherTab = "dashboard" | "create" | "messages";

const tabs = [
  { key: "dashboard" as const, path: "/publisher" as const, ar: "الرئيسية", en: "Dashboard" },
  { key: "create" as const, path: "/publisher/opportunities/new" as const, ar: "فرصة جديدة", en: "New" },
  { key: "messages" as const, path: "/publisher/messages" as const, ar: "الرسائل", en: "Messages" },
];

export function PublisherTabBar({ active, locale, theme, unreadCount = 0 }: { active: PublisherTab; locale: AppLocale; theme: Theme; unreadCount?: number }) {
  const styles = createStyles(theme);
  return <View style={styles.outer}><View style={styles.shell}>{tabs.map((tab) => {
    const selected = active === tab.key;
    return <Pressable key={tab.key} accessibilityRole="tab" accessibilityState={{ selected }} style={styles.tab} onPress={() => router.replace(tab.path)}><Text style={[styles.label, selected && styles.selected]}>{locale === "ar" ? tab.ar : tab.en}</Text>{tab.key === "messages" && unreadCount > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text></View> : null}{selected ? <View style={styles.dot} /> : null}</Pressable>;
  })}</View></View>;
}

function createStyles(theme: Theme) { return StyleSheet.create({ outer: { backgroundColor: theme.background, paddingHorizontal: 12, paddingBottom: 10 }, shell: { flexDirection: "row", borderWidth: 1, borderColor: theme.border, borderRadius: 26, backgroundColor: theme.surface, paddingHorizontal: 7, paddingVertical: 9 }, tab: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", gap: 5 }, label: { color: theme.muted, fontSize: 11, fontWeight: "700" }, selected: { color: theme.accent }, dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: theme.accent }, badge: { position: "absolute", top: 2, right: 18, minWidth: 17, height: 17, paddingHorizontal: 4, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: theme.accent }, badgeText: { color: "#181818", fontSize: 9, fontWeight: "800" } }); }
