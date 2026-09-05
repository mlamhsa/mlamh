import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import type { AppLocale } from "@/lib/i18n";
import { darkTheme } from "@/lib/theme";

type TabKey = "discover" | "applications" | "messages" | "profile" | "notifications";
type NavTabKey = Exclude<TabKey, "notifications">;
type Theme = typeof darkTheme;

const tabs: Array<{ key: NavTabKey; path: "/opportunities" | "/applications" | "/messages" | "/profile"; ar: string; en: string }> = [
  { key: "discover", path: "/opportunities", ar: "الفرص", en: "Discover" },
  { key: "applications", path: "/applications", ar: "طلباتي", en: "Applications" },
  { key: "messages", path: "/messages", ar: "الرسائل", en: "Messages" },
  { key: "profile", path: "/profile", ar: "ملفي", en: "Profile" },
];

export function AppTabBar({ active, locale, theme = darkTheme }: { active: TabKey; locale: AppLocale; theme?: Theme; notificationCount?: number }) {
  const styles = createStyles(theme);
  return <View style={styles.outer}><View style={styles.shell}>
    {tabs.map((tab) => <Tab key={tab.key} tab={tab} active={active} locale={locale} styles={styles} />)}
  </View></View>;
}

function Tab({ tab, active, locale, styles }: { tab: (typeof tabs)[number]; active: TabKey; locale: AppLocale; styles: ReturnType<typeof createStyles> }) {
  const selected = tab.key === active;
  const label = locale === "ar" ? tab.ar : tab.en;
  return <Pressable style={({ pressed }) => [styles.tab, pressed && styles.pressed]} onPress={() => router.replace(tab.path)} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected }} hitSlop={6}>
    <View style={[styles.indicator, selected && styles.indicatorSelected]} />
    <Text numberOfLines={1} style={[styles.label, locale === "ar" && styles.arabicText, selected && styles.labelSelected]}>{label}</Text>
  </Pressable>;
}

function createStyles(theme: Theme) { return StyleSheet.create({
  outer: { backgroundColor: theme.background, paddingHorizontal: 0, paddingBottom: 0 },
  shell: { minHeight: 70, flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.nav, paddingHorizontal: 8, paddingTop: 7, paddingBottom: 9 },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 7, minHeight: 52, paddingHorizontal: 4 },
  indicator: { width: 18, height: 2, borderRadius: 1, backgroundColor: "transparent" },
  indicatorSelected: { backgroundColor: theme.accent },
  label: { color: theme.muted, fontSize: 10, lineHeight: 14, fontWeight: "600", textAlign: "center" },
  labelSelected: { color: theme.text, fontWeight: "800" },
  pressed: { opacity: 0.65 },
  arabicText: { letterSpacing: 0 },
}); }
