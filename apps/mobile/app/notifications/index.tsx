import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View, useColorScheme } from "react-native";
import { router } from "expo-router";

import { AppTabBar } from "@/components/AppTabBar";
import { PublisherTabBar } from "@/components/PublisherTabBar";
import { getMobileAccountContext } from "@/lib/account";
import { getNotifications, markNotificationRead, type MobileNotification } from "@/lib/api";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { useNotificationSync } from "@/lib/notifications-context";
import { darkTheme, lightTheme } from "@/lib/theme";

export default function NotificationsScreen() {
  const locale = getDeviceLocale();
  const theme = useColorScheme() === "dark" ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { refresh: refreshBadge } = useNotificationSync();
  const [items, setItems] = useState<MobileNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [accountType, setAccountType] = useState<"talent" | "publisher">("talent");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const [result, account] = await Promise.all([getNotifications(), getMobileAccountContext().catch(() => null)]);
      if (!result) {
        router.replace({ pathname: "/login", params: { next: "/notifications" } });
        return;
      }
      if (account?.type === "publisher") setAccountType("publisher");
      else setAccountType("talent");
      setItems(result.items);
      setUnreadCount(result.unreadCount);
      void refreshBadge();
    } catch {
      setError(locale === "ar" ? "تعذر تحميل الإشعارات." : "Unable to load notifications.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [locale, refreshBadge]);

  useEffect(() => { void load(); }, [load]);

  async function openNotification(item: MobileNotification) {
    if (!item.isRead) {
      const updated = await markNotificationRead(item.id);
      if (updated) {
        setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, isRead: true } : entry));
        setUnreadCount((count) => Math.max(0, count - 1));
        void refreshBadge();
      }
    }

    const target = item.target;
    if (target.type === "conversation") { router.push(`/conversations/${target.id}`); return; }
    if (target.type === "publisher_opportunity") { router.push(`/publisher/opportunities/${target.id}`); return; }
    if (target.type === "opportunity") { router.push(`/opportunities/${target.id}`); return; }
    if (target.type === "talent_applications") { router.push("/applications"); return; }
    if (target.type === "none") return;
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.accent} /></View>;

  return <View style={styles.screen}>
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.accent} />}
      ListHeaderComponent={<View style={[styles.header, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]}><Text style={styles.eyebrow}>MLAMH</Text><View style={styles.titleRow}><Text style={styles.title}>{locale === "ar" ? "الإشعارات" : "Notifications"}</Text>{unreadCount > 0 ? <Text style={styles.unreadBadge}>{unreadCount}</Text> : null}</View><Text style={styles.subtitle}>{accountType === "publisher" ? (locale === "ar" ? "طلبات جديدة ورسائل وتحديثات فرصك في مكان واحد." : "New applications, messages and opportunity updates in one place.") : (locale === "ar" ? "تابع تحديثات طلباتك ورسائلك من مكان واحد." : "Keep up with application and message updates in one place.")}</Text></View>}
      ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyTitle}>{error ?? (locale === "ar" ? "لا توجد إشعارات جديدة." : "No notifications yet.")}</Text></View>}
      renderItem={({ item }) => <Pressable accessibilityRole="button" onPress={() => void openNotification(item)} style={({ pressed }) => [styles.card, !item.isRead && styles.unreadCard, pressed && styles.pressed]}><View style={styles.cardTopRow}><Text style={styles.category}>{categoryLabel(item.category, locale)}</Text>{!item.isRead ? <View style={styles.dot} /> : null}</View><Text style={styles.cardTitle}>{item.title}</Text>{item.body ? <Text style={styles.body}>{item.body}</Text> : null}</Pressable>}
    />
    {accountType === "publisher" ? <PublisherTabBar active="notifications" locale={locale} theme={theme} notificationCount={unreadCount} /> : <AppTabBar active="notifications" locale={locale} theme={theme} notificationCount={unreadCount} />}
  </View>;
}

function categoryLabel(category: MobileNotification["category"], locale: "ar" | "en") {
  const labels = { application: { ar: "طلب", en: "Application" }, message: { ar: "رسالة", en: "Message" }, invitation: { ar: "دعوة", en: "Invitation" }, system: { ar: "ملامح", en: "MLAMH" } } as const;
  return labels[category][locale];
}

function createStyles(theme: typeof lightTheme | typeof darkTheme) {
  return StyleSheet.create({ screen: { flex: 1, backgroundColor: theme.background }, centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }, content: { paddingHorizontal: 18, paddingTop: 64, paddingBottom: 24, gap: 12 }, header: { gap: 8, marginBottom: 14 }, eyebrow: { color: theme.accent, fontSize: 12, fontWeight: "700", letterSpacing: 2.2 }, titleRow: { flexDirection: "row", alignItems: "center", gap: 10 }, title: { color: theme.text, fontSize: 38, fontWeight: "300" }, unreadBadge: { minWidth: 28, textAlign: "center", color: "#181818", backgroundColor: theme.accent, borderRadius: 14, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 4, fontSize: 12, fontWeight: "700" }, subtitle: { color: theme.muted, fontSize: 15, lineHeight: 24 }, card: { borderRadius: 22, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, padding: 17, gap: 7 }, unreadCard: { borderColor: theme.accent }, pressed: { opacity: 0.7 }, cardTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, category: { color: theme.accent, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 }, dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.accent }, cardTitle: { color: theme.text, fontSize: 18, fontWeight: "600" }, body: { color: theme.muted, fontSize: 14, lineHeight: 21 }, emptyState: { paddingVertical: 72, alignItems: "center" }, emptyTitle: { color: theme.text, fontSize: 17, textAlign: "center" } });
}
