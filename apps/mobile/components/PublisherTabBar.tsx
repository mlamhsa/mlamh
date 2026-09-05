import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getMobileAccountContext } from "@/lib/account";
import type { AppLocale } from "@/lib/i18n";
import { darkTheme } from "@/lib/theme";

type Theme = typeof darkTheme;
type PublisherTab = "dashboard" | "talents" | "create" | "messages" | "profile" | "notifications";

type ViewerKind = "checking" | "publisher" | "other";

const tabs = [
  { key: "dashboard" as const, path: "/publisher" as const, ar: "الرئيسية", en: "Home" },
  { key: "talents" as const, path: "/talents" as const, ar: "المواهب", en: "Talents" },
  { key: "create" as const, path: "/publisher/opportunities/new" as const, ar: "فرصة", en: "Create" },
  { key: "messages" as const, path: "/publisher/messages" as const, ar: "الرسائل", en: "Messages" },
  { key: "profile" as const, path: "/publisher/profile" as const, ar: "الملف", en: "Profile" },
];

export function PublisherTabBar({ active, locale, theme = darkTheme, unreadCount = 0 }: { active: PublisherTab; locale: AppLocale; theme?: Theme; unreadCount?: number; notificationCount?: number }) {
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);
  const [viewer, setViewer] = useState<ViewerKind>(active === "talents" ? "checking" : "publisher");

  useEffect(() => {
    if (active !== "talents") return;
    let mounted = true;
    void getMobileAccountContext()
      .then((account) => { if (mounted) setViewer(account?.type === "publisher" ? "publisher" : "other"); })
      .catch(() => { if (mounted) setViewer("other"); });
    return () => { mounted = false; };
  }, [active]);

  if (active === "talents" && viewer !== "publisher") {
    return <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.publicShell}>
        <Pressable accessibilityRole="button" onPress={() => router.replace("/opportunities")} style={({ pressed }) => [styles.publicAction, pressed && styles.pressed]}>
          <Text style={styles.publicActionText}>{locale === "ar" ? "الفرص" : "Opportunities"}</Text>
        </Pressable>
        <View style={styles.publicCurrent}><View style={styles.indicatorSelectedPublic} /><Text style={styles.publicCurrentText}>{locale === "ar" ? "المواهب" : "Talents"}</Text></View>
        <Pressable accessibilityRole="button" onPress={() => router.push(viewer === "checking" ? "/login" : "/signup")} style={({ pressed }) => [styles.publicAction, pressed && styles.pressed]}>
          <Text style={styles.publicActionText}>{locale === "ar" ? (viewer === "checking" ? "الدخول" : "انضم") : (viewer === "checking" ? "Sign in" : "Join")}</Text>
        </Pressable>
      </View>
    </View>;
  }

  return <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 8) }]}><View accessibilityRole="tablist" style={styles.shell}>{tabs.map((tab) => {
    const selected = active === tab.key;
    const badgeCount = tab.key === "messages" ? unreadCount : 0;
    const label = locale === "ar" ? tab.ar : tab.en;
    const accessibilityLabel = badgeCount > 0 ? `${label}, ${badgeCount > 99 ? "99+" : badgeCount}` : label;
    return <Pressable key={tab.key} accessibilityRole="tab" accessibilityLabel={accessibilityLabel} accessibilityState={{ selected }} hitSlop={5} style={({ pressed }) => [styles.tab, pressed && styles.pressed]} onPress={() => router.replace(tab.path)}>
      <View style={[styles.indicator, selected && styles.indicatorSelected]} />
      <View style={styles.labelRow}><Text numberOfLines={1} style={[styles.label, locale === "ar" && styles.arabicText, selected && styles.labelSelected]}>{label}</Text>{badgeCount > 0 ? <View importantForAccessibility="no-hide-descendants" style={styles.badge}><Text style={styles.badgeText}>{badgeCount > 99 ? "99+" : badgeCount}</Text></View> : null}</View>
    </Pressable>;
  })}</View></View>;
}

function createStyles(theme: Theme) { return StyleSheet.create({
  outer: { backgroundColor: theme.background },
  shell: { minHeight: 70, flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.nav, paddingHorizontal: 5, paddingTop: 7, paddingBottom: 9 },
  tab: { flex: 1, minHeight: 52, alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 2 },
  indicator: { width: 16, height: 2, borderRadius: 1, backgroundColor: "transparent" },
  indicatorSelected: { backgroundColor: theme.accent },
  labelRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, maxWidth: "100%" },
  label: { color: theme.muted, fontSize: 9, lineHeight: 13, fontWeight: "600", textAlign: "center", flexShrink: 1 },
  labelSelected: { color: theme.text, fontWeight: "800" },
  badge: { minWidth: 16, height: 16, paddingHorizontal: 3, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: theme.accent },
  badgeText: { color: theme.background, fontSize: 8, fontWeight: "900" },
  publicShell: { minHeight: 66, flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.nav, paddingHorizontal: 10, paddingTop: 7, paddingBottom: 7 },
  publicAction: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center" },
  publicActionText: { color: theme.muted, fontSize: 10, fontWeight: "700" },
  publicCurrent: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", gap: 7 },
  indicatorSelectedPublic: { width: 16, height: 2, borderRadius: 1, backgroundColor: theme.accent },
  publicCurrentText: { color: theme.text, fontSize: 10, fontWeight: "900" },
  pressed: { opacity: 0.65 },
  arabicText: { letterSpacing: 0 },
}); }
