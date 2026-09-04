import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import type { AppLocale } from "@/lib/i18n";
import { darkTheme, lightTheme } from "@/lib/theme";

type Theme = typeof lightTheme | typeof darkTheme;
type PublisherTab = "dashboard" | "create" | "messages" | "notifications";

const tabs = [
  { key: "dashboard" as const, path: "/publisher" as const, ar: "الرئيسية", en: "Home", glyph: "⌂" },
  { key: "messages" as const, path: "/publisher/messages" as const, ar: "الرسائل", en: "Messages", glyph: "✉" },
  { key: "create" as const, path: "/publisher/opportunities/new" as const, ar: "فرصة", en: "New", glyph: "+" },
  { key: "notifications" as const, path: "/notifications" as const, ar: "التنبيهات", en: "Alerts", glyph: "◉" },
];

export function PublisherTabBar({ active, locale, theme, unreadCount = 0, notificationCount = 0 }: { active: PublisherTab; locale: AppLocale; theme: Theme; unreadCount?: number; notificationCount?: number }) {
  const styles = createStyles(theme);
  return <View style={styles.outer}><View style={styles.shell}>{tabs.map((tab) => {
    const selected = active === tab.key;
    const badgeCount = tab.key === "messages" ? unreadCount : tab.key === "notifications" ? notificationCount : 0;
    const label = locale === "ar" ? tab.ar : tab.en;
    const accessibilityLabel = badgeCount > 0 ? `${label}, ${badgeCount > 99 ? "99+" : badgeCount}` : label;
    const create = tab.key === "create";
    return <Pressable key={tab.key} accessibilityRole="tab" accessibilityLabel={accessibilityLabel} accessibilityState={{ selected }} hitSlop={6} style={styles.tab} onPress={() => router.replace(tab.path)}><View style={[styles.iconWrap, selected && styles.iconWrapSelected, create && styles.createWrap]}><Text accessible={false} style={[styles.glyph, selected && styles.glyphSelected, create && styles.createGlyph]}>{tab.glyph}</Text>{badgeCount > 0 ? <View importantForAccessibility="no-hide-descendants" style={styles.badge}><Text style={styles.badgeText}>{badgeCount > 99 ? "99+" : badgeCount}</Text></View> : null}</View><Text numberOfLines={1} style={[styles.label, selected && styles.selected, create && styles.createLabel]}>{label}</Text>{selected && !create ? <View importantForAccessibility="no-hide-descendants" style={styles.dot} /> : null}</Pressable>;
  })}</View></View>;
}

function createStyles(theme: Theme) { return StyleSheet.create({
  outer: { backgroundColor: theme.background, paddingHorizontal: 12, paddingBottom: 10 }, shell: { flexDirection: "row", borderWidth: 1, borderColor: theme.border, borderRadius: 28, backgroundColor: theme.surface, paddingHorizontal: 7, paddingTop: 8, paddingBottom: 9 }, tab: { flex: 1, minHeight: 58, alignItems: "center", justifyContent: "center", gap: 3 }, iconWrap: { width: 36, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" }, iconWrapSelected: { backgroundColor: theme.accent }, glyph: { color: theme.muted, fontSize: 18, lineHeight: 20, fontWeight: "600" }, glyphSelected: { color: theme.charcoal, fontWeight: "900" }, createWrap: { width: 46, height: 46, borderRadius: 23, marginTop: -18, backgroundColor: theme.accent, borderWidth: 4, borderColor: theme.background }, createGlyph: { color: theme.charcoal, fontSize: 28, lineHeight: 30, fontWeight: "500" }, label: { color: theme.muted, fontSize: 10, fontWeight: "700" }, selected: { color: theme.accent }, createLabel: { color: theme.accent, marginTop: 2 }, dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: theme.accent, marginTop: 1 }, badge: { position: "absolute", top: -5, right: -11, minWidth: 17, height: 17, paddingHorizontal: 4, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: theme.accent }, badgeText: { color: theme.charcoal, fontSize: 9, fontWeight: "900" },
}); }
