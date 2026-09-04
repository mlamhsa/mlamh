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
    refresh ? setRefreshing(true) : setLoading(true); setError(null);
    try {
      const [result, account] = await Promise.all([getNotifications(), getMobileAccountContext().catch(() => null)]);
      if (!result) { router.replace({ pathname: "/login", params: { next: "/notifications" } }); return; }
      setAccountType(account?.type === "publisher" ? "publisher" : "talent");
      setItems(result.items); setUnreadCount(result.unreadCount); void refreshBadge();
    } catch { setError(locale === "ar" ? "تعذر تحميل الإشعارات." : "Unable to load notifications."); }
    finally { setLoading(false); setRefreshing(false); }
  }, [locale, refreshBadge]);

  useEffect(() => { void load(); }, [load]);

  async function openNotification(item: MobileNotification) {
    if (!item.isRead) {
      const updated = await markNotificationRead(item.id);
      if (updated) {
        setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, isRead: true } : entry));
        setUnreadCount((count) => Math.max(0, count - 1)); void refreshBadge();
      }
    }
    const target = item.target;
    if (target.type === "conversation") { router.push(`/conversations/${target.id}`); return; }
    if (target.type === "publisher_opportunity") { router.push(`/publisher/opportunities/${target.id}`); return; }
    if (target.type === "opportunity") { router.push(`/opportunities/${target.id}`); return; }
    if (target.type === "talent_applications") { router.push("/applications"); }
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.accent} /></View>;

  return <View style={styles.screen}>
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.accent} />}
      ListHeaderComponent={<View style={[styles.header, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]}>
        <View style={styles.headerRow}><Text style={styles.title}>{locale === "ar" ? "الإشعارات" : "Notifications"}</Text><Text style={styles.composeIcon}>◌</Text></View>
        <View style={styles.searchMock}><Text style={styles.searchText}>{locale === "ar" ? "آخر تحديثات ملامح" : "Latest MLAMH updates"}</Text><Text style={styles.searchGlyph}>⌕</Text></View>
        <View style={styles.filterRow}><Text style={[styles.filter, styles.filterActive]}>{locale === "ar" ? "الكل" : "All"}</Text><Text style={styles.filter}>{locale === "ar" ? "غير مقروء" : "Unread"}</Text>{unreadCount > 0 ? <Text style={styles.unreadBadge}>{unreadCount}</Text> : null}</View>
      </View>}
      ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyTitle}>{error ?? (locale === "ar" ? "لا توجد إشعارات جديدة." : "No notifications yet.")}</Text></View>}
      renderItem={({ item }) => <Pressable accessibilityRole="button" onPress={() => void openNotification(item)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        <View style={[styles.avatar, !item.isRead && styles.avatarUnread]}><Text style={styles.avatarText}>{categoryGlyph(item.category)}</Text></View>
        <View style={styles.rowContent}><View style={styles.rowTop}><Text numberOfLines={1} style={[styles.cardTitle, !item.isRead && styles.cardTitleUnread]}>{item.title}</Text><Text style={styles.category}>{categoryLabel(item.category, locale)}</Text></View>{item.body ? <Text numberOfLines={2} style={styles.body}>{item.body}</Text> : null}</View>
        {!item.isRead ? <View style={styles.dot} /> : null}
      </Pressable>}
    />
    {accountType === "publisher" ? <PublisherTabBar active="notifications" locale={locale} theme={theme} notificationCount={unreadCount} /> : <AppTabBar active="notifications" locale={locale} theme={theme} notificationCount={unreadCount} />}
  </View>;
}

function categoryLabel(category: MobileNotification["category"], locale: "ar" | "en") {
  const labels = { application: { ar: "طلب", en: "Application" }, message: { ar: "رسالة", en: "Message" }, invitation: { ar: "دعوة", en: "Invitation" }, system: { ar: "ملامح", en: "MLAMH" } } as const;
  return labels[category][locale];
}
function categoryGlyph(category: MobileNotification["category"]) { return category === "message" ? "✉" : category === "application" ? "✓" : category === "invitation" ? "+" : "M"; }

function createStyles(theme: typeof lightTheme | typeof darkTheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background }, centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background },
    content: { paddingHorizontal: 16, paddingTop: 54, paddingBottom: 24 }, header: { gap: 12, marginBottom: 8 }, headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    title: { color: theme.text, fontSize: 30, fontWeight: "800" }, composeIcon: { color: theme.text, fontSize: 24 },
    searchMock: { minHeight: 42, borderWidth: 1, borderColor: theme.border, borderRadius: 14, backgroundColor: theme.surface, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, searchText: { color: theme.muted, fontSize: 12 }, searchGlyph: { color: theme.text, fontSize: 20 },
    filterRow: { flexDirection: "row", alignItems: "center", gap: 16, borderBottomWidth: 1, borderBottomColor: theme.border }, filter: { color: theme.muted, fontSize: 12, fontWeight: "700", paddingVertical: 10 }, filterActive: { color: theme.accent, borderBottomWidth: 2, borderBottomColor: theme.accent }, unreadBadge: { minWidth: 22, textAlign: "center", color: "#2E2E2E", backgroundColor: "#D4A017", borderRadius: 11, overflow: "hidden", paddingHorizontal: 6, paddingVertical: 2, fontSize: 10, fontWeight: "900" },
    row: { minHeight: 76, flexDirection: "row", alignItems: "center", gap: 11, borderBottomWidth: 1, borderBottomColor: theme.border, paddingVertical: 11 }, pressed: { opacity: 0.66 },
    avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" }, avatarUnread: { borderColor: theme.accent }, avatarText: { color: theme.accent, fontSize: 16, fontWeight: "900" },
    rowContent: { flex: 1, gap: 4 }, rowTop: { flexDirection: "row", justifyContent: "space-between", gap: 8 }, cardTitle: { flex: 1, color: theme.text, fontSize: 14, fontWeight: "600" }, cardTitleUnread: { fontWeight: "900" }, category: { color: theme.muted, fontSize: 10 }, body: { color: theme.muted, fontSize: 12, lineHeight: 18 }, dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#D4A017" },
    emptyState: { paddingVertical: 72, alignItems: "center" }, emptyTitle: { color: theme.text, fontSize: 16, textAlign: "center" },
  });
}
