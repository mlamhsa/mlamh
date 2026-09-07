import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ClipboardList, MessageCircle, Search, UserRound, type LucideIcon } from "lucide-react-native";

import type { AppLocale } from "@/lib/i18n";
import { darkTheme } from "@/lib/theme";

type TabKey = "discover" | "applications" | "messages" | "profile" | "notifications";
type NavTabKey = Exclude<TabKey, "notifications">;
type Theme = typeof darkTheme;

type TabDefinition = {
  key: NavTabKey;
  path: "/opportunities" | "/applications" | "/messages" | "/profile";
  ar: string;
  en: string;
  icon: LucideIcon;
};

const tabs: TabDefinition[] = [
  { key: "discover", path: "/opportunities", ar: "الفرص", en: "Discover", icon: Search },
  { key: "applications", path: "/applications", ar: "طلباتي", en: "Applications", icon: ClipboardList },
  { key: "messages", path: "/messages", ar: "الرسائل", en: "Messages", icon: MessageCircle },
  { key: "profile", path: "/profile", ar: "الملف", en: "Profile", icon: UserRound },
];

export function AppTabBar({ active, locale, theme = darkTheme }: { active: TabKey; locale: AppLocale; theme?: Theme; notificationCount?: number }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width <= 360;
  const styles = createStyles(theme);
  const isArabic = locale === "ar";
  return <View style={[styles.outer, compact && styles.outerCompact, { paddingBottom: Math.max(insets.bottom, 8) }]}>
    <View accessibilityRole="tablist" style={[styles.shell, isArabic && styles.shellRtl, compact && styles.shellCompact]}>
      {tabs.map((tab) => <Tab key={tab.key} tab={tab} active={active} locale={locale} theme={theme} styles={styles} compact={compact} />)}
    </View>
  </View>;
}

function Tab({ tab, active, locale, theme, styles, compact }: { tab: TabDefinition; active: TabKey; locale: AppLocale; theme: Theme; styles: ReturnType<typeof createStyles>; compact: boolean }) {
  const selected = tab.key === active;
  const label = locale === "ar" ? tab.ar : tab.en;
  const Icon = tab.icon;
  return <Pressable
    style={({ pressed }) => [styles.tab, compact && styles.tabCompact, selected && styles.tabSelected, pressed && styles.pressed]}
    onPress={() => router.replace(tab.path)}
    accessibilityRole="tab"
    accessibilityLabel={label}
    accessibilityState={{ selected }}
    hitSlop={5}
  >
    <Icon size={compact ? 18 : 19} strokeWidth={selected ? 2.15 : 1.8} color={selected ? theme.accent : theme.muted} />
    <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82} style={[styles.label, compact && styles.labelCompact, locale === "ar" && styles.arabicText, selected && styles.labelSelected]}>{label}</Text>
  </Pressable>;
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    outer: { backgroundColor: theme.background, paddingHorizontal: 12, paddingTop: 7 },
    outerCompact: { paddingHorizontal: 7 },
    shell: { minHeight: 68, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: theme.border, borderRadius: 24, backgroundColor: theme.nav, paddingHorizontal: 6, paddingVertical: 6 },
    shellRtl: { flexDirection: "row-reverse" },
    shellCompact: { minHeight: 64, borderRadius: 21, paddingHorizontal: 4, paddingVertical: 5 },
    tab: { flex: 1, minHeight: 54, borderRadius: 18, alignItems: "center", justifyContent: "center", gap: 5, paddingHorizontal: 4 },
    tabCompact: { minHeight: 50, borderRadius: 16, gap: 3, paddingHorizontal: 2 },
    tabSelected: { backgroundColor: theme.chip },
    label: { color: theme.muted, fontSize: 10, lineHeight: 14, fontWeight: "700", textAlign: "center" },
    labelCompact: { fontSize: 9, lineHeight: 12 },
    labelSelected: { color: theme.accent, fontWeight: "900" },
    pressed: { opacity: 0.65 },
    arabicText: { letterSpacing: 0, writingDirection: "rtl" },
  });
}
