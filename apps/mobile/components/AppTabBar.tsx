import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import type { AppLocale } from "@/lib/i18n";
import { darkTheme, lightTheme } from "@/lib/theme";

type TabKey = "discover" | "applications" | "notifications" | "profile";
type Theme = typeof lightTheme | typeof darkTheme;

const tabs: Array<{ key: TabKey; path: "/opportunities" | "/applications" | "/notifications" | "/profile"; ar: string; en: string; glyph: string }> = [
  { key: "discover", path: "/opportunities", ar: "الفرص", en: "Discover", glyph: "⌕" },
  { key: "applications", path: "/applications", ar: "طلباتي", en: "Applications", glyph: "✓" },
  { key: "notifications", path: "/notifications", ar: "التنبيهات", en: "Alerts", glyph: "•" },
  { key: "profile", path: "/profile", ar: "ملفي", en: "Profile", glyph: "◯" },
];

export function AppTabBar({ active, locale, theme, notificationCount = 0 }: { active: TabKey; locale: AppLocale; theme: Theme; notificationCount?: number }) {
  const styles = createStyles(theme);

  return (
    <View style={styles.shell}>
      {tabs.map((tab) => {
        const selected = tab.key === active;
        return (
          <Pressable key={tab.key} style={styles.tab} onPress={() => router.replace(tab.path)} accessibilityRole="tab" accessibilityState={{ selected }}>
            <View style={styles.glyphWrap}>
              <Text style={[styles.glyph, selected && styles.selected]}>{tab.glyph}</Text>
              {tab.key === "notifications" && notificationCount > 0 ? (
                <View style={styles.badge}><Text style={styles.badgeText}>{notificationCount > 99 ? "99+" : notificationCount}</Text></View>
              ) : null}
            </View>
            <Text numberOfLines={1} style={[styles.label, selected && styles.selected]}>{locale === "ar" ? tab.ar : tab.en}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    shell: {
      flexDirection: "row",
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
      backgroundColor: theme.surface,
      paddingTop: 8,
      paddingBottom: 18,
      paddingHorizontal: 8,
    },
    tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4, minHeight: 48 },
    glyphWrap: { minWidth: 28, minHeight: 22, alignItems: "center", justifyContent: "center" },
    glyph: { color: theme.muted, fontSize: 20, lineHeight: 22, fontWeight: "500" },
    label: { color: theme.muted, fontSize: 10, fontWeight: "600" },
    selected: { color: theme.accent },
    badge: { position: "absolute", top: -5, right: -10, minWidth: 17, height: 17, borderRadius: 9, paddingHorizontal: 4, alignItems: "center", justifyContent: "center", backgroundColor: theme.accent },
    badgeText: { color: "#181818", fontSize: 9, fontWeight: "800" },
  });
}
