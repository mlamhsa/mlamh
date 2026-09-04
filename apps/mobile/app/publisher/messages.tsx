import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View, useColorScheme } from "react-native";
import { router } from "expo-router";

import { PublisherTabBar } from "@/components/PublisherTabBar";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { getPublisherConversations, type MobileConversation } from "@/lib/publisher-api";
import { darkTheme, lightTheme } from "@/lib/theme";

export default function PublisherMessagesScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const theme = useColorScheme() === "dark" ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [items, setItems] = useState<MobileConversation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const result = await getPublisherConversations();
      if (!result) {
        setItems([]);
        setUnreadCount(0);
        setError(isArabic ? "تعذر تحميل المحادثات." : "Unable to load conversations.");
      } else {
        setItems(result.items);
        setUnreadCount(result.unreadCount);
      }
    } catch {
      setItems([]);
      setUnreadCount(0);
      setError(isArabic ? "تعذر تحميل المحادثات. تحقق من الاتصال وحاول مرة أخرى." : "Unable to load conversations. Check your connection and try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isArabic]);

  useEffect(() => { void load(); }, [load]);
  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.accent} /></View>;

  return <View style={styles.screen}><FlatList
    data={items}
    keyExtractor={(item) => String(item.id)}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.accent} />}
    contentContainerStyle={[styles.content, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]}
    ListHeaderComponent={<View style={styles.header}>
      <View style={styles.brandRow}><Text style={styles.eyebrow}>MLAMH</Text>{unreadCount > 0 ? <View style={styles.headerBadge}><Text style={styles.headerBadgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text></View> : null}</View>
      <Text accessibilityRole="header" style={styles.title}>{isArabic ? "الرسائل" : "Messages"}</Text>
      <Text style={styles.subtitle}>{isArabic ? "المحادثات تفتح فقط بعد قبول الموهبة." : "Conversations open only after a talent is accepted."}</Text>
      {error ? <View style={styles.errorCard}><Text accessibilityRole="alert" style={styles.error}>{error}</Text><Pressable accessibilityRole="button" style={styles.retry} onPress={() => void load()}><Text style={styles.retryText}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text></Pressable></View> : null}
    </View>}
    ListEmptyComponent={!error ? <View style={styles.empty}><View style={styles.emptyMark}><Text style={styles.emptyMarkText}>M</Text></View><Text style={styles.emptyTitle}>{isArabic ? "لا توجد محادثات بعد" : "No conversations yet"}</Text><Text style={styles.subtitle}>{isArabic ? "عند قبول موهبة ستظهر المحادثة هنا مباشرة." : "When you accept a talent, the conversation will appear here automatically."}</Text></View> : null}
    renderItem={({ item }) => <ConversationRow item={item} styles={styles} locale={locale} />}
  /><PublisherTabBar active="messages" locale={locale} theme={theme} unreadCount={unreadCount} /></View>;
}

function ConversationRow({ item, styles, locale }: { item: MobileConversation; styles: ReturnType<typeof createStyles>; locale: "ar" | "en" }) {
  const isArabic = locale === "ar";
  const date = item.lastActivityAt ? new Date(item.lastActivityAt).toLocaleDateString(isArabic ? "ar-SA" : "en-US", { month: "short", day: "numeric" }) : "";
  return <Pressable accessibilityRole="button" accessibilityLabel={`${item.partyName}, ${item.opportunityTitle ?? "MLAMH"}`} style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={() => router.push(`/conversations/${item.id}`)}>
    {item.partyImageUrl ? <Image source={{ uri: item.partyImageUrl }} style={styles.avatar} /> : <View style={styles.avatarFallback}><Text style={styles.avatarText}>{item.partyName.slice(0, 1)}</Text></View>}
    <View style={styles.cardBody}><View style={styles.rowTop}><Text numberOfLines={1} style={styles.party}>{item.partyName}</Text><Text style={styles.date}>{date}</Text></View><Text numberOfLines={1} style={styles.opportunity}>{item.opportunityTitle ?? "MLAMH"}</Text><Text numberOfLines={1} style={[styles.preview, item.unreadCount > 0 && styles.previewUnread]}>{item.latestMessage ?? (isArabic ? "ابدأ المحادثة" : "Start the conversation")}</Text></View>
    {item.unreadCount > 0 ? <View style={styles.unread}><Text style={styles.unreadText}>{item.unreadCount > 99 ? "99+" : item.unreadCount}</Text></View> : <Text accessible={false} style={styles.chevron}>{isArabic ? "‹" : "›"}</Text>}
  </Pressable>;
}

function createStyles(theme: typeof lightTheme | typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }, content: { paddingHorizontal: 18, paddingTop: 58, paddingBottom: 28 },
  header: { gap: 7, marginBottom: 18 }, brandRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, eyebrow: { color: theme.accent, fontSize: 12, fontWeight: "800", letterSpacing: 2.2 },
  headerBadge: { minWidth: 26, height: 26, borderRadius: 13, backgroundColor: theme.accent, paddingHorizontal: 7, alignItems: "center", justifyContent: "center" }, headerBadgeText: { color: theme.charcoal, fontSize: 10, fontWeight: "900" },
  title: { color: theme.text, fontSize: 36, fontWeight: "300" }, subtitle: { color: theme.muted, fontSize: 13, lineHeight: 20 },
  errorCard: { gap: 10, marginTop: 8, borderWidth: 1, borderColor: theme.border, borderRadius: 18, backgroundColor: theme.surface, padding: 14 }, error: { color: theme.text, fontSize: 13, lineHeight: 20 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 78, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: theme.border }, pressed: { opacity: 0.65 },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: theme.border }, avatarFallback: { width: 54, height: 54, borderRadius: 27, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.accent, alignItems: "center", justifyContent: "center" }, avatarText: { color: theme.accent, fontSize: 20, fontWeight: "800" },
  cardBody: { flex: 1, gap: 3 }, rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }, party: { flex: 1, color: theme.text, fontSize: 16, fontWeight: "800" }, date: { color: theme.muted, fontSize: 9 },
  opportunity: { color: theme.accent, fontSize: 10, fontWeight: "800" }, preview: { color: theme.muted, fontSize: 12 }, previewUnread: { color: theme.text, fontWeight: "700" },
  unread: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 5, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" }, unreadText: { color: theme.charcoal, fontSize: 9, fontWeight: "900" }, chevron: { color: theme.muted, fontSize: 24 },
  empty: { minHeight: 300, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 26 }, emptyMark: { width: 58, height: 58, borderRadius: 29, borderWidth: 1, borderColor: theme.accent, alignItems: "center", justifyContent: "center" }, emptyMarkText: { color: theme.accent, fontSize: 26, fontWeight: "800" }, emptyTitle: { color: theme.text, fontSize: 18, fontWeight: "700" },
  retry: { alignSelf: "flex-start", borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 9 }, retryText: { color: theme.text, fontWeight: "800", fontSize: 11 },
}); }
