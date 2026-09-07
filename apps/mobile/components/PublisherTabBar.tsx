import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BriefcaseBusiness, House, MessageCircle, Plus, Search, UserRound, type LucideIcon } from "lucide-react-native";

import { getMobileAccountContext } from "@/lib/account";
import type { AppLocale } from "@/lib/i18n";
import { darkTheme } from "@/lib/theme";

type Theme = typeof darkTheme;
type PublisherTab = "dashboard" | "talents" | "create" | "messages" | "profile" | "notifications";
type ViewerKind = "checking" | "publisher" | "other";

type TabDefinition = {
  key: Exclude<PublisherTab, "notifications">;
  path: "/publisher" | "/talents" | "/publisher/opportunities/new" | "/publisher/messages" | "/publisher/profile";
  ar: string;
  en: string;
  icon: LucideIcon;
};

const tabs: TabDefinition[] = [
  { key: "dashboard", path: "/publisher", ar: "الرئيسية", en: "Home", icon: House },
  { key: "talents", path: "/talents", ar: "المواهب", en: "Talents", icon: Search },
  { key: "create", path: "/publisher/opportunities/new", ar: "فرصة", en: "Create", icon: Plus },
  { key: "messages", path: "/publisher/messages", ar: "الرسائل", en: "Messages", icon: MessageCircle },
  { key: "profile", path: "/publisher/profile", ar: "الملف", en: "Profile", icon: UserRound },
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
          <BriefcaseBusiness size={18} strokeWidth={1.8} color={theme.muted} />
          <Text style={styles.publicActionText}>{locale === "ar" ? "الفرص" : "Opportunities"}</Text>
        </Pressable>
        <View style={styles.publicCurrent}><Search size={19} strokeWidth={2.1} color={theme.accent} /><Text style={styles.publicCurrentText}>{locale === "ar" ? "المواهب" : "Talents"}</Text></View>
        <Pressable accessibilityRole="button" onPress={() => router.push(viewer === "checking" ? "/login" : "/signup")} style={({ pressed }) => [styles.publicAction, pressed && styles.pressed]}>
          <UserRound size={18} strokeWidth={1.8} color={theme.muted} />
          <Text style={styles.publicActionText}>{locale === "ar" ? (viewer === "checking" ? "الدخول" : "انضم") : (viewer === "checking" ? "Sign in" : "Join")}</Text>
        </Pressable>
      </View>
    </View>;
  }

  return <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
    <View accessibilityRole="tablist" style={styles.shell}>
      {tabs.map((tab) => {
        const selected = active === tab.key;
        const badgeCount = tab.key === "messages" ? unreadCount : 0;
        const label = locale === "ar" ? tab.ar : tab.en;
        const accessibilityLabel = badgeCount > 0 ? `${label}, ${badgeCount > 99 ? "99+" : badgeCount}` : label;
        const Icon = tab.icon;
        return <Pressable key={tab.key} accessibilityRole="tab" accessibilityLabel={accessibilityLabel} accessibilityState={{ selected }} hitSlop={5} style={({ pressed }) => [styles.tab, selected && styles.tabSelected, pressed && styles.pressed]} onPress={() => router.replace(tab.path)}>
          <View style={styles.iconWrap}>
            <Icon size={18} strokeWidth={selected ? 2.15 : 1.8} color={selected ? theme.accent : theme.muted} />
            {badgeCount > 0 ? <View importantForAccessibility="no-hide-descendants" style={styles.badge}><Text style={styles.badgeText}>{badgeCount > 99 ? "99+" : badgeCount}</Text></View> : null}
          </View>
          <Text numberOfLines={1} style={[styles.label, locale === "ar" && styles.arabicText, selected && styles.labelSelected]}>{label}</Text>
        </Pressable>;
      })}
    </View>
  </View>;
}

function createStyles(theme: Theme) { return StyleSheet.create({
  outer: { backgroundColor: theme.background, paddingHorizontal: 10, paddingTop: 7 },
  shell: { minHeight: 68, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: theme.border, borderRadius: 24, backgroundColor: theme.nav, paddingHorizontal: 5, paddingVertical: 6 },
  tab: { flex: 1, minHeight: 54, borderRadius: 17, alignItems: "center", justifyContent: "center", gap: 5, paddingHorizontal: 2 },
  tabSelected: { backgroundColor: theme.chip },
  iconWrap: { minHeight: 20, alignItems: "center", justifyContent: "center", position: "relative" },
  label: { color: theme.muted, fontSize: 9, lineHeight: 13, fontWeight: "700", textAlign: "center", flexShrink: 1 },
  labelSelected: { color: theme.accent, fontWeight: "900" },
  badge: { position: "absolute", top: -6, right: -11, minWidth: 16, height: 16, paddingHorizontal: 3, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: theme.accent },
  badgeText: { color: theme.background, fontSize: 8, fontWeight: "900" },
  publicShell: { minHeight: 68, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: theme.border, borderRadius: 24, backgroundColor: theme.nav, paddingHorizontal: 6, paddingVertical: 6 },
  publicAction: { flex: 1, minHeight: 54, borderRadius: 17, alignItems: "center", justifyContent: "center", gap: 5 },
  publicActionText: { color: theme.muted, fontSize: 9, fontWeight: "700" },
  publicCurrent: { flex: 1, minHeight: 54, borderRadius: 17, alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: theme.chip },
  publicCurrentText: { color: theme.accent, fontSize: 9, fontWeight: "900" },
  pressed: { opacity: 0.65 },
  arabicText: { letterSpacing: 0 },
}); }
