import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { AppTabBar } from "@/components/AppTabBar";
import { getConversations, getNotifications, type MobileConversation } from "@/lib/api";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { darkTheme } from "@/lib/theme";

export default function MessagesScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [items, setItems] = useState<MobileConversation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const [response, notifications] = await Promise.all([getConversations(), getNotifications().catch(() => null)]);
      if (!response) {
        setError(isArabic ? "تعذر تحميل المحادثات." : "Unable to load messages.");
        return;
      }
      setItems(response.items);
      setUnreadCount(response.unreadCount);
      setNotificationCount(notifications?.unreadCount ?? 0);
    } catch {
      setError(isArabic ? "تعذر تحميل المحادثات. تحقق من الاتصال وحاول مرة أخرى." : "Unable to load messages. Check your connection and try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isArabic]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.accent} /></View>;

  return <View style={styles.screen}>
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.accent} />}
      ListHeaderComponent={<View style={[styles.header, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]}>
        <Text style={styles.brand}>{isArabic ? "ملامح" : "MLAMH"}</Text>
        <View style={styles.titleRow}><Text accessibilityRole="header" style={styles.title}>{isArabic ? "الرسائل" : "Messages"}</Text>{unreadCount > 0 ? <View style={styles.unreadPill}><Text style={styles.unreadPillText}>{unreadCount > 99 ? "99+" : unreadCount}</Text></View> : null}</View>
        <Text style={[styles.subtitle, { textAlign: isArabic ? "right" : "left" }]}>{isArabic ? "تظهر المحادثات بعد القبول فقط. لا يتم كشف وسائل التواصل أو فتح الرسائل قبل ذلك." : "Conversations appear only after acceptance. Contact access and messaging remain locked before then."}</Text>
      </View>}
      ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyTitle}>{error ?? (isArabic ? "لا توجد محادثات حتى الآن" : "No conversations yet")}</Text><Text style={styles.emptyBody}>{error ? (isArabic ? "أعد المحاولة عند استقرار الاتصال." : "Try again when your connection is stable.") : (isArabic ? "عند قبول أحد طلباتك ستظهر المحادثة هنا تلقائيًا." : "When one of your applications is accepted, its conversation will appear here automatically.")}</Text>{error ? <Pressable accessibilityRole="button" style={styles.retryButton} onPress={() => void load()}><Text style={styles.retryText}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text></Pressable> : null}</View>}
      renderItem={({ item }) => <ConversationRow item={item} locale={locale} styles={styles} />}
    />
    <AppTabBar active="messages" locale={locale} theme={theme} notificationCount={notificationCount} />
  </View>;
}

function ConversationRow({ item, locale, styles }: { item: MobileConversation; locale: "ar" | "en"; styles: ReturnType<typeof createStyles> }) {
  const isArabic = locale === "ar";
  const time = item.lastActivityAt ? new Date(item.lastActivityAt).toLocaleDateString(isArabic ? "ar-SA-u-nu-latn" : "en-US", { day: "numeric", month: "short" }) : "";
  return <Pressable accessibilityRole="button" accessibilityLabel={`${item.partyName}. ${item.latestMessage ?? item.opportunityTitle ?? ""}`} onPress={() => router.push(`/conversations/${item.id}`)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
    {item.partyImageUrl ? <Image source={{ uri: item.partyImageUrl }} style={[styles.avatar, item.unreadCount > 0 && styles.avatarUnread]} /> : <View style={[styles.avatar, styles.avatarFallback, item.unreadCount > 0 && styles.avatarUnread]}><Text style={styles.avatarInitial}>{item.partyName.slice(0, 1).toUpperCase()}</Text></View>}
    <View style={styles.rowBody}>
      <View style={styles.rowTop}><Text numberOfLines={1} style={[styles.partyName, item.unreadCount > 0 && styles.partyNameUnread]}>{item.partyName}</Text><Text style={styles.time}>{time}</Text></View>
      {item.opportunityTitle ? <Text numberOfLines={1} style={styles.opportunity}>{item.opportunityTitle}</Text> : null}
      <View style={styles.previewRow}><Text numberOfLines={1} style={[styles.preview, item.unreadCount > 0 && styles.previewUnread]}>{item.latestMessage ?? (isArabic ? "ابدأ المحادثة" : "Start the conversation")}</Text>{item.unreadCount > 0 ? <View style={styles.messageBadge}><Text style={styles.messageBadgeText}>{item.unreadCount > 99 ? "99+" : item.unreadCount}</Text></View> : null}</View>
    </View>
    <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.chevron}>{isArabic ? "‹" : "›"}</Text>
  </Pressable>;
}

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }, content: { paddingHorizontal: 20, paddingTop: 54, paddingBottom: 28 },
  header: { gap: 10, marginBottom: 20 }, brand: { color: theme.accent, fontSize: 17, fontWeight: "800", letterSpacing: 1.1 }, titleRow: { flexDirection: "row", alignItems: "center", gap: 9 }, title: { color: theme.text, fontSize: 31, lineHeight: 38, fontWeight: "700" }, subtitle: { color: theme.muted, fontSize: 13, lineHeight: 20, maxWidth: 430 }, unreadPill: { minWidth: 24, height: 24, borderRadius: 12, backgroundColor: theme.accent, paddingHorizontal: 7, alignItems: "center", justifyContent: "center" }, unreadPillText: { color: theme.background, fontSize: 10, fontWeight: "900" },
  row: { minHeight: 88, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: theme.border, paddingVertical: 14 }, pressed: { opacity: 0.68 }, avatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface }, avatarFallback: { alignItems: "center", justifyContent: "center" }, avatarUnread: { borderColor: theme.accent }, avatarInitial: { color: theme.accent, fontSize: 18, fontWeight: "800" },
  rowBody: { flex: 1, gap: 3 }, rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }, partyName: { flex: 1, color: theme.text, fontSize: 15, fontWeight: "700" }, partyNameUnread: { fontWeight: "900" }, time: { color: theme.muted, fontSize: 9 }, opportunity: { color: theme.accent, fontSize: 10, fontWeight: "700" }, previewRow: { flexDirection: "row", alignItems: "center", gap: 8 }, preview: { flex: 1, color: theme.muted, fontSize: 11, lineHeight: 17 }, previewUnread: { color: theme.text, fontWeight: "700" }, messageBadge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 }, messageBadgeText: { color: theme.background, fontSize: 8, fontWeight: "900" }, chevron: { color: theme.muted, fontSize: 20 },
  emptyState: { paddingVertical: 74, alignItems: "center", gap: 11, paddingHorizontal: 24 }, emptyTitle: { color: theme.text, fontSize: 17, fontWeight: "800", textAlign: "center" }, emptyBody: { color: theme.muted, fontSize: 12, lineHeight: 19, textAlign: "center", maxWidth: 310 }, retryButton: { marginTop: 5, backgroundColor: theme.accent, borderRadius: 12, minHeight: 44, paddingHorizontal: 18, justifyContent: "center" }, retryText: { color: theme.background, fontSize: 12, fontWeight: "900" },
}); }
