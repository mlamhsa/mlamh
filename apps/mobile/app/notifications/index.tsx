import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { AppTabBar } from "@/components/AppTabBar";
import { PublisherTabBar } from "@/components/PublisherTabBar";
import { getMobileAccountContext } from "@/lib/account";
import { getNotifications, markNotificationRead, type MobileNotification } from "@/lib/api";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { useNotificationSync } from "@/lib/notifications-context";
import { darkTheme } from "@/lib/theme";

export default function NotificationsScreen() {
  const locale = getDeviceLocale(); const isArabic = locale === "ar"; const isRtl = isRtlLocale(locale);
  const theme = darkTheme; const styles = useMemo(() => createStyles(theme), [theme]);
  const { refresh: refreshBadge } = useNotificationSync();
  const [items, setItems] = useState<MobileNotification[]>([]); const [unreadCount, setUnreadCount] = useState(0); const [accountType, setAccountType] = useState<"talent" | "publisher">("talent"); const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false); const [error, setError] = useState<string | null>(null); const [filter, setFilter] = useState<"all" | "unread">("all");

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true); setError(null);
    try {
      const [result, account] = await Promise.all([getNotifications(), getMobileAccountContext().catch(() => null)]);
      if (!result) { router.replace({ pathname: "/login", params: { next: "/notifications" } }); return; }
      setAccountType(account?.type === "publisher" ? "publisher" : "talent"); setItems(result.items); setUnreadCount(result.unreadCount); void refreshBadge();
    } catch { setError(isArabic ? "تعذر تحميل الإشعارات. تحقق من الاتصال وحاول مرة أخرى." : "Unable to load notifications. Check your connection and try again."); }
    finally { setLoading(false); setRefreshing(false); }
  }, [isArabic, refreshBadge]);
  useEffect(() => { void load(); }, [load]);

  async function openNotification(item: MobileNotification) {
    if (!item.isRead) {
      const updated = await markNotificationRead(item.id);
      if (updated) { setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, isRead: true } : entry)); setUnreadCount((count) => Math.max(0, count - 1)); void refreshBadge(); }
    }
    const target = item.target;
    if (target.type === "conversation") return router.push(`/conversations/${target.id}`);
    if (target.type === "publisher_opportunity") return router.push(`/publisher/opportunities/${target.id}`);
    if (target.type === "opportunity") return router.push(`/opportunities/${target.id}`);
    if (target.type === "talent_applications") router.push("/applications");
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.accent} /></View>;
  const visibleItems = filter === "unread" ? items.filter((item) => !item.isRead) : items;
  return <View style={styles.screen}><FlatList
    data={visibleItems} keyExtractor={(item) => String(item.id)} contentContainerStyle={styles.content}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.accent} />}
    ListHeaderComponent={<View style={[styles.header, { direction: isRtl ? "rtl" : "ltr" }]}>
      <View style={styles.headerRow}><View><Text style={styles.eyebrow}>{isArabic ? "ملامح" : "MLAMH"}</Text><Text accessibilityRole="header" style={styles.title}>{isArabic ? "الإشعارات" : "Notifications"}</Text></View>{unreadCount > 0 ? <View style={styles.countBadge}><Text style={styles.countText}>{unreadCount > 99 ? "99+" : unreadCount}</Text></View> : null}</View>
      <Text style={styles.subtitle}>{isArabic ? "تحديثات الطلبات والقبول والرسائل في مكان واحد." : "Application, acceptance and message updates in one place."}</Text>
      <View accessibilityRole="tablist" style={styles.filters}><Filter active={filter === "all"} label={isArabic ? "الكل" : "All"} onPress={() => setFilter("all")} styles={styles} /><Filter active={filter === "unread"} label={isArabic ? "غير مقروء" : "Unread"} onPress={() => setFilter("unread")} styles={styles} /></View>
      {error ? <View style={styles.errorCard}><Text accessibilityRole="alert" style={styles.error}>{error}</Text><Pressable style={styles.retry} onPress={() => void load()}><Text style={styles.retryText}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text></Pressable></View> : null}
    </View>}
    ListEmptyComponent={!error ? <View style={styles.emptyState}><Text style={styles.emptyTitle}>{filter === "unread" ? (isArabic ? "لا توجد إشعارات غير مقروءة." : "No unread notifications.") : (isArabic ? "لا توجد إشعارات بعد." : "No notifications yet.")}</Text></View> : null}
    renderItem={({ item }) => <NotificationRow item={item} locale={locale} styles={styles} onPress={() => void openNotification(item)} />}
  />{accountType === "publisher" ? <PublisherTabBar active="notifications" locale={locale} theme={theme} notificationCount={unreadCount} /> : <AppTabBar active="notifications" locale={locale} theme={theme} notificationCount={unreadCount} />}</View>;
}

function Filter({ active, label, onPress, styles }: { active: boolean; label: string; onPress: () => void; styles: ReturnType<typeof createStyles> }) { return <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.filter, active && styles.filterActive]}><Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text></Pressable>; }
function NotificationRow({ item, locale, styles, onPress }: { item: MobileNotification; locale: "ar" | "en"; styles: ReturnType<typeof createStyles>; onPress: () => void }) {
  const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US", { month: "short", day: "numeric" }) : "";
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, !item.isRead && styles.rowUnread, pressed && styles.pressed]}><View style={styles.indicator}><View style={[styles.indicatorDot, item.isRead && styles.indicatorDotRead]} /></View><View style={styles.rowContent}><View style={styles.rowTop}><Text numberOfLines={1} style={[styles.cardTitle, !item.isRead && styles.cardTitleUnread]}>{item.title}</Text><Text style={styles.date}>{date}</Text></View>{item.body ? <Text numberOfLines={2} style={styles.body}>{item.body}</Text> : null}<Text style={styles.category}>{categoryLabel(item.category, locale)}</Text></View></Pressable>;
}
function categoryLabel(category: MobileNotification["category"], locale: "ar" | "en") { const labels = { application: { ar: "طلب", en: "Application" }, message: { ar: "رسالة", en: "Message" }, invitation: { ar: "دعوة", en: "Invitation" }, system: { ar: "ملامح", en: "MLAMH" } } as const; return labels[category][locale]; }
function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }, content: { paddingHorizontal: 18, paddingTop: 54, paddingBottom: 26 }, header: { gap: 10, marginBottom: 10 }, headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }, eyebrow: { color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.7 }, title: { color: theme.text, fontSize: 31, lineHeight: 38, fontWeight: "700", marginTop: 2 }, subtitle: { color: theme.muted, fontSize: 12, lineHeight: 19 }, countBadge: { minWidth: 28, height: 28, borderRadius: 14, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center", paddingHorizontal: 7 }, countText: { color: theme.background, fontSize: 10, fontWeight: "900" },
  filters: { flexDirection: "row", gap: 18, borderBottomWidth: 1, borderBottomColor: theme.border }, filter: { paddingVertical: 10 }, filterActive: { borderBottomWidth: 2, borderBottomColor: theme.accent }, filterText: { color: theme.muted, fontSize: 11, fontWeight: "700" }, filterTextActive: { color: theme.text },
  row: { minHeight: 78, flexDirection: "row", gap: 10, borderBottomWidth: 1, borderBottomColor: theme.border, paddingVertical: 12 }, rowUnread: { backgroundColor: theme.chip }, pressed: { opacity: 0.65 }, indicator: { width: 12, paddingTop: 7, alignItems: "center" }, indicatorDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.accent }, indicatorDotRead: { backgroundColor: theme.border }, rowContent: { flex: 1, gap: 4 }, rowTop: { flexDirection: "row", justifyContent: "space-between", gap: 9 }, cardTitle: { flex: 1, color: theme.text, fontSize: 14, fontWeight: "600" }, cardTitleUnread: { fontWeight: "900" }, date: { color: theme.muted, fontSize: 9 }, body: { color: theme.muted, fontSize: 12, lineHeight: 18 }, category: { color: theme.accent, fontSize: 9, fontWeight: "800" },
  errorCard: { gap: 9, borderWidth: 1, borderColor: theme.border, borderRadius: 13, backgroundColor: theme.surface, padding: 12 }, error: { color: "#E59A9A", fontSize: 12, lineHeight: 18 }, retry: { alignSelf: "flex-start", borderWidth: 1, borderColor: theme.border, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 7 }, retryText: { color: theme.text, fontSize: 10, fontWeight: "800" }, emptyState: { paddingVertical: 76, alignItems: "center" }, emptyTitle: { color: theme.muted, fontSize: 14, textAlign: "center" },
}); }
