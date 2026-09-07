import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft, ChevronRight, LockKeyhole, MessageCircle, MessagesSquare } from "lucide-react-native";

import { AppTabBar } from "@/components/AppTabBar";
import { ScreenSkeleton } from "@/components/ScreenSkeleton";
import { getConversations, getNotifications, type MobileConversation } from "@/lib/api";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { darkTheme } from "@/lib/theme";

export default function MessagesScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const { width } = useWindowDimensions();
  const compact = width <= 360;
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
      if (!response) { setError(isArabic ? "تعذر تحميل المحادثات." : "Unable to load messages."); return; }
      setItems(response.items);
      setUnreadCount(response.unreadCount);
      setNotificationCount(notifications?.unreadCount ?? 0);
    } catch {
      setError(isArabic ? "تعذر تحميل المحادثات. تحقق من الاتصال وحاول مرة أخرى." : "Unable to load messages. Check your connection and try again.");
    } finally { setLoading(false); setRefreshing(false); }
  }, [isArabic]);

  useEffect(() => { void load(); }, [load]);
  if (loading) return <ScreenSkeleton variant="list" locale={locale} label={isArabic ? "جارٍ تحميل المحادثات" : "Loading conversations"} />;

  return <SafeAreaView style={styles.screen} edges={["top"]}>
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={[styles.content, compact && styles.contentCompact, { direction: isRtl ? "rtl" : "ltr" }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.accent} />}
      ListHeaderComponent={<View style={styles.header}>
        <Text style={[styles.brand, isArabic && styles.arabicBrand, { textAlign: isRtl ? "right" : "left" }]}>{isArabic ? "ملامح" : "MLAMH"}</Text>
        <View style={[styles.titleRow, isRtl && styles.rowRtl]}><View style={styles.titleIcon}><MessagesSquare size={compact ? 18 : 20} color={theme.accent} strokeWidth={1.8} /></View><Text accessibilityRole="header" style={[styles.title, compact && styles.titleCompact, { textAlign: isRtl ? "right" : "left", writingDirection: isRtl ? "rtl" : "ltr" }]}>{isArabic ? "الرسائل" : "Messages"}</Text>{unreadCount > 0 ? <View accessibilityLabel={isArabic ? `${unreadCount} رسائل غير مقروءة` : `${unreadCount} unread messages`} style={styles.unreadPill}><Text style={styles.unreadPillText}>{unreadCount > 99 ? "99+" : unreadCount}</Text></View> : null}</View>
        <Text style={[styles.subtitle, { textAlign: isRtl ? "right" : "left", writingDirection: isRtl ? "rtl" : "ltr" }]}>{isArabic ? "المحادثات تفتح بعد القبول فقط، لحماية بيانات الطرفين." : "Conversations unlock only after acceptance, keeping both parties protected."}</Text>
        <View style={[styles.privacyNote, isRtl && styles.rowRtl]}><LockKeyhole size={15} color={theme.accent} strokeWidth={1.8} /><Text style={[styles.privacyText, { textAlign: isRtl ? "right" : "left", writingDirection: isRtl ? "rtl" : "ltr" }]}>{isArabic ? "التواصل وبيانات الاتصال تبقى خاصة قبل القبول." : "Contact details stay private until acceptance."}</Text></View>
      </View>}
      ListEmptyComponent={<View style={[styles.emptyState, compact && styles.emptyStateCompact]}><View style={styles.emptyIcon}><MessageCircle size={25} color={theme.accent} strokeWidth={1.8} /></View><Text accessibilityRole={error ? "alert" : undefined} style={[styles.emptyTitle, isArabic && styles.arabicText]}>{error ?? (isArabic ? "لا توجد محادثات حتى الآن" : "No conversations yet")}</Text><Text style={[styles.emptyBody, isArabic && styles.arabicText]}>{error ? (isArabic ? "أعد المحاولة عند استقرار الاتصال." : "Try again when your connection is stable.") : (isArabic ? "عند قبول أحد طلباتك ستظهر المحادثة هنا تلقائيًا." : "When one of your applications is accepted, its conversation appears here automatically.")}</Text>{error ? <Pressable accessibilityRole="button" style={styles.retryButton} onPress={() => void load()}><Text style={styles.retryText}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text></Pressable> : null}</View>}
      renderItem={({ item }) => <ConversationRow item={item} locale={locale} isRtl={isRtl} compact={compact} styles={styles} />}
      showsVerticalScrollIndicator={false}
    />
    <AppTabBar active="messages" locale={locale} theme={theme} notificationCount={notificationCount} />
  </SafeAreaView>;
}

function ConversationRow({ item, locale, isRtl, compact, styles }: { item: MobileConversation; locale: "ar" | "en"; isRtl: boolean; compact: boolean; styles: ReturnType<typeof createStyles> }) {
  const isArabic = locale === "ar";
  const time = item.lastActivityAt ? new Date(item.lastActivityAt).toLocaleDateString(isArabic ? "ar-SA-u-nu-latn" : "en-US", { day: "numeric", month: "short" }) : "";
  const ArrowIcon = isRtl ? ChevronLeft : ChevronRight;
  return <Pressable accessibilityRole="button" accessibilityLabel={`${item.partyName}. ${item.latestMessage ?? item.opportunityTitle ?? ""}`} onPress={() => router.push(`/conversations/${item.id}`)} style={({ pressed }) => [styles.row, compact && styles.rowCompact, item.unreadCount > 0 && styles.rowUnread, isRtl && styles.rowRtl, pressed && styles.pressed]}>
    {item.partyImageUrl ? <Image source={{ uri: item.partyImageUrl }} style={[styles.avatar, compact && styles.avatarCompact, item.unreadCount > 0 && styles.avatarUnread]} /> : <View style={[styles.avatar, compact && styles.avatarCompact, styles.avatarFallback, item.unreadCount > 0 && styles.avatarUnread]}><Text style={styles.avatarInitial}>{item.partyName.slice(0, 1).toUpperCase()}</Text></View>}
    <View style={styles.rowBody}>
      <View style={[styles.rowTop, isRtl && styles.rowRtl]}><Text numberOfLines={1} style={[styles.partyName, item.unreadCount > 0 && styles.partyNameUnread, { textAlign: isRtl ? "right" : "left", writingDirection: isRtl ? "rtl" : "ltr" }]}>{item.partyName}</Text><Text style={styles.time}>{time}</Text></View>
      {item.opportunityTitle ? <View style={[styles.opportunityPill, isRtl && styles.opportunityPillRtl]}><Text numberOfLines={1} style={[styles.opportunity, { textAlign: isRtl ? "right" : "left", writingDirection: isRtl ? "rtl" : "ltr" }]}>{item.opportunityTitle}</Text></View> : null}
      <View style={[styles.previewRow, isRtl && styles.rowRtl]}><Text numberOfLines={1} style={[styles.preview, item.unreadCount > 0 && styles.previewUnread, { textAlign: isRtl ? "right" : "left", writingDirection: isRtl ? "rtl" : "ltr" }]}>{item.latestMessage ?? (isArabic ? "ابدأ المحادثة" : "Start the conversation")}</Text>{item.unreadCount > 0 ? <View style={styles.messageBadge}><Text style={styles.messageBadgeText}>{item.unreadCount > 99 ? "99+" : item.unreadCount}</Text></View> : null}</View>
    </View>
    <View style={styles.openIcon}><ArrowIcon size={17} color="#F5F5F0" strokeWidth={1.8} /></View>
  </Pressable>;
}

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28 }, contentCompact: { paddingHorizontal: 14 },
  header: { gap: 10, marginBottom: 18 }, brand: { color: theme.accent, fontSize: 12, fontWeight: "900", letterSpacing: 1.9 }, arabicBrand: { letterSpacing: 0, writingDirection: "rtl" }, arabicText: { writingDirection: "rtl" }, titleRow: { flexDirection: "row", alignItems: "center", gap: 9 }, titleIcon: { width: 38, height: 38, borderRadius: 14, borderWidth: 1, borderColor: "#C9A96244", backgroundColor: "#C9A9620C", alignItems: "center", justifyContent: "center" }, title: { flexShrink: 1, color: theme.text, fontSize: 29, lineHeight: 35, fontWeight: "800" }, titleCompact: { fontSize: 26, lineHeight: 31 }, subtitle: { color: theme.muted, fontSize: 13, lineHeight: 20, maxWidth: 430 }, unreadPill: { minWidth: 25, height: 25, borderRadius: 13, backgroundColor: theme.accent, paddingHorizontal: 7, alignItems: "center", justifyContent: "center" }, unreadPillText: { color: theme.background, fontSize: 10, fontWeight: "900" }, privacyNote: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#C9A96233", borderRadius: 14, backgroundColor: "#C9A96208", paddingHorizontal: 12, paddingVertical: 10 }, privacyText: { flex: 1, color: theme.muted, fontSize: 10, lineHeight: 16 },
  row: { minHeight: 94, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: theme.border, borderRadius: 19, backgroundColor: theme.surface, paddingHorizontal: 13, paddingVertical: 13, marginBottom: 9 }, rowCompact: { gap: 9, paddingHorizontal: 11, paddingVertical: 11 }, rowUnread: { borderColor: "#C9A96255", backgroundColor: "#C9A96208" }, rowRtl: { flexDirection: "row-reverse" }, pressed: { opacity: 0.72 }, avatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface }, avatarCompact: { width: 46, height: 46, borderRadius: 23 }, avatarFallback: { alignItems: "center", justifyContent: "center" }, avatarUnread: { borderColor: theme.accent }, avatarInitial: { color: theme.accent, fontSize: 18, fontWeight: "800" },
  rowBody: { flex: 1, gap: 5 }, rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }, partyName: { flex: 1, color: theme.text, fontSize: 15, fontWeight: "700" }, partyNameUnread: { fontWeight: "900" }, time: { color: theme.muted, fontSize: 9 }, opportunityPill: { alignSelf: "flex-start", maxWidth: "100%", borderRadius: 999, backgroundColor: "#C9A9620C", paddingHorizontal: 8, paddingVertical: 3 }, opportunityPillRtl: { alignSelf: "flex-end" }, opportunity: { color: theme.accent, fontSize: 9, fontWeight: "800" }, previewRow: { flexDirection: "row", alignItems: "center", gap: 8 }, preview: { flex: 1, color: theme.muted, fontSize: 11, lineHeight: 17 }, previewUnread: { color: theme.text, fontWeight: "700" }, messageBadge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 }, messageBadgeText: { color: theme.background, fontSize: 8, fontWeight: "900" }, openIcon: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" },
  emptyState: { minHeight: 230, borderWidth: 1, borderColor: theme.border, borderRadius: 22, backgroundColor: theme.surface, padding: 25, alignItems: "center", justifyContent: "center", gap: 10 }, emptyStateCompact: { minHeight: 200, padding: 18 }, emptyIcon: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: "#C9A96255", backgroundColor: "#C9A9620A", alignItems: "center", justifyContent: "center" }, emptyTitle: { color: theme.text, fontSize: 17, fontWeight: "800", textAlign: "center" }, emptyBody: { color: theme.muted, fontSize: 12, lineHeight: 19, textAlign: "center", maxWidth: 310 }, retryButton: { marginTop: 5, backgroundColor: theme.accent, borderRadius: 12, minHeight: 48, paddingHorizontal: 18, justifyContent: "center" }, retryText: { color: theme.background, fontSize: 12, fontWeight: "900" },
}); }