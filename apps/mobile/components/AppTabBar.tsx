import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import type { AppLocale } from "@/lib/i18n";
import { useNotificationSync } from "@/lib/notifications-context";
import { darkTheme, lightTheme } from "@/lib/theme";

type TabKey = "discover" | "applications" | "notifications" | "profile";
type Theme = typeof lightTheme | typeof darkTheme;

const tabs: Array<{ key: TabKey; path: "/opportunities" | "/applications" | "/notifications" | "/profile"; ar: string; en: string; glyph: string }> = [
  { key: "discover", path: "/opportunities", ar: "الرئيسية", en: "Home", glyph: "⌂" },
  { key: "applications", path: "/applications", ar: "طلباتي", en: "Applications", glyph: "⌕" },
  { key: "notifications", path: "/notifications", ar: "التنبيهات", en: "Alerts", glyph: "✉" },
  { key: "profile", path: "/profile", ar: "ملفي", en: "Profile", glyph: "♙" },
];

export function AppTabBar({ active, locale, theme, notificationCount = 0 }: { active: TabKey; locale: AppLocale; theme: Theme; notificationCount?: number }) {
  const styles = createStyles(theme);
  const { unreadCount: syncedUnreadCount, ready } = useNotificationSync();
  const badgeCount = ready ? syncedUnreadCount : notificationCount;

  return <View style={styles.outer}><View style={styles.shell}>
    {tabs.slice(0, 2).map((tab) => <Tab key={tab.key} tab={tab} active={active} locale={locale} badgeCount={badgeCount} styles={styles} />)}
    <Pressable accessibilityRole="button" accessibilityLabel={locale === "ar" ? "استكشف الفرص" : "Discover opportunities"} onPress={() => router.push("/opportunities")} style={({ pressed }) => [styles.fabWrap, pressed && styles.pressed]}><View style={styles.fab}><Text style={styles.fabText}>+</Text></View></Pressable>
    {tabs.slice(2).map((tab) => <Tab key={tab.key} tab={tab} active={active} locale={locale} badgeCount={badgeCount} styles={styles} />)}
  </View></View>;
}

function Tab({ tab, active, locale, badgeCount, styles }: { tab: (typeof tabs)[number]; active: TabKey; locale: AppLocale; badgeCount: number; styles: ReturnType<typeof createStyles> }) {
  const selected = tab.key === active;
  const label = locale === "ar" ? tab.ar : tab.en;
  const accessibilityLabel = tab.key === "notifications" && badgeCount > 0 ? `${label}, ${badgeCount > 99 ? "99+" : badgeCount}` : label;
  return <Pressable key={tab.key} style={styles.tab} onPress={() => router.replace(tab.path)} accessibilityRole="tab" accessibilityLabel={accessibilityLabel} accessibilityState={{ selected }} hitSlop={6}><View style={styles.iconWrap}><Text accessible={false} style={[styles.glyph, selected && styles.glyphSelected]}>{tab.glyph}</Text>{tab.key === "notifications" && badgeCount > 0 ? <View importantForAccessibility="no-hide-descendants" style={styles.badge}><Text style={styles.badgeText}>{badgeCount > 99 ? "99+" : badgeCount}</Text></View> : null}</View><Text numberOfLines={1} style={[styles.label, selected && styles.labelSelected]}>{label}</Text></Pressable>;
}

function createStyles(theme: Theme) { return StyleSheet.create({
  outer: { backgroundColor: theme.background, paddingHorizontal: 0, paddingBottom: 0 }, shell: { minHeight: 76, flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.nav, paddingHorizontal: 8, paddingTop: 6, paddingBottom: 10 }, tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2, minHeight: 56 }, iconWrap: { width: 34, height: 28, alignItems: "center", justifyContent: "center" }, glyph: { color: theme.text, fontSize: 20, lineHeight: 21, fontWeight: "500" }, glyphSelected: { color: theme.accent, fontWeight: "800" }, label: { color: theme.text, fontSize: 10, fontWeight: "500" }, labelSelected: { color: theme.accent, fontWeight: "800" }, fabWrap: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 56 }, fab: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: theme.accent, borderWidth: 4, borderColor: theme.nav, marginTop: -24, shadowColor: theme.shadow, shadowOpacity: 0.16, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }, fabText: { color: theme.charcoal, fontSize: 28, lineHeight: 29, fontWeight: "300" }, badge: { position: "absolute", top: -4, right: -8, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4, alignItems: "center", justifyContent: "center", backgroundColor: theme.accent }, badgeText: { color: theme.charcoal, fontSize: 8, fontWeight: "900" }, pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
}); }
