import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import type { AppLocale } from "@/lib/i18n";
import { useNotificationSync } from "@/lib/notifications-context";
import { darkTheme, lightTheme } from "@/lib/theme";

type TabKey = "discover" | "applications" | "notifications" | "profile";
type Theme = typeof lightTheme | typeof darkTheme;

const tabs: Array<{ key: TabKey; path: "/opportunities" | "/applications" | "/notifications" | "/profile"; ar: string; en: string; glyph: string }> = [
  { key: "discover", path: "/opportunities", ar: "الرئيسية", en: "Home", glyph: "⌂" },
  { key: "applications", path: "/applications", ar: "طلباتي", en: "Applications", glyph: "▣" },
  { key: "notifications", path: "/notifications", ar: "التنبيهات", en: "Alerts", glyph: "•" },
  { key: "profile", path: "/profile", ar: "حسابي", en: "Profile", glyph: "○" },
];

export function AppTabBar({ active, locale, theme, notificationCount = 0 }: { active: TabKey; locale: AppLocale; theme: Theme; notificationCount?: number }) {
  const styles = createStyles(theme);
  const { unreadCount: syncedUnreadCount, ready } = useNotificationSync();
  const badgeCount = ready ? syncedUnreadCount : notificationCount;

  return <View style={styles.outer}><View style={styles.shell}>{tabs.map((tab) => {
    const selected = tab.key === active;
    return <Pressable key={tab.key} style={styles.tab} onPress={() => router.replace(tab.path)} accessibilityRole="tab" accessibilityState={{ selected }}><View style={[styles.iconWrap, selected && styles.iconWrapSelected]}><Text style={[styles.glyph, selected && styles.glyphSelected]}>{tab.glyph}</Text>{tab.key === "notifications" && badgeCount > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{badgeCount > 99 ? "99+" : badgeCount}</Text></View> : null}</View><Text numberOfLines={1} style={[styles.label, selected && styles.labelSelected]}>{locale === "ar" ? tab.ar : tab.en}</Text>{selected ? <View style={styles.activeDot} /> : null}</Pressable>;
  })}</View></View>;
}

function createStyles(theme: Theme) { return StyleSheet.create({ outer: { backgroundColor: theme.background, paddingHorizontal: 12, paddingBottom: 10 }, shell: { flexDirection: "row", borderWidth: 1, borderColor: theme.border, borderRadius: 28, backgroundColor: theme.surface, paddingHorizontal: 7, paddingTop: 8, paddingBottom: 9 }, tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3, minHeight: 56 }, iconWrap: { width: 36, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" }, iconWrapSelected: { backgroundColor: theme.accent }, glyph: { color: theme.muted, fontSize: 19, lineHeight: 20, fontWeight: "500" }, glyphSelected: { color: "#181818", fontWeight: "800" }, label: { color: theme.muted, fontSize: 10, fontWeight: "600" }, labelSelected: { color: theme.accent }, activeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: theme.accent, marginTop: 1 }, badge: { position: "absolute", top: -5, right: -11, minWidth: 17, height: 17, borderRadius: 9, paddingHorizontal: 4, alignItems: "center", justifyContent: "center", backgroundColor: theme.accent }, badgeText: { color: "#181818", fontSize: 9, fontWeight: "800" } }); }
