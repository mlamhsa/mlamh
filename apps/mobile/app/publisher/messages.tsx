import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View, useColorScheme } from "react-native";
import { router } from "expo-router";

import { PublisherTabBar } from "@/components/PublisherTabBar";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { getPublisherConversations, type MobileConversation } from "@/lib/publisher-api";
import { darkTheme, lightTheme } from "@/lib/theme";

export default function PublisherMessagesScreen() {
  const locale = getDeviceLocale();
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
    const result = await getPublisherConversations();
    if (!result) setError(locale === "ar" ? "تعذر تحميل المحادثات." : "Unable to load conversations.");
    else { setItems(result.items); setUnreadCount(result.unreadCount); }
    setLoading(false); setRefreshing(false);
  }, [locale]);

  useEffect(() => { void load(); }, [load]);
  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.accent} /></View>;

  return <View style={styles.screen}><FlatList
    data={items}
    keyExtractor={(item) => String(item.id)}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.accent} />}
    contentContainerStyle={[styles.content, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]}
    ListHeaderComponent={<View style={styles.header}><Text style={styles.eyebrow}>MLAMH</Text><Text style={styles.title}>{locale === "ar" ? "الرسائل" : "Messages"}</Text><Text style={styles.subtitle}>{locale === "ar" ? "تواصل مع المواهب بعد القبول فقط." : "Connect with talents after acceptance only."}</Text>{error ? <Text style={styles.error}>{error}</Text> : null}</View>}
    ListEmptyComponent={!error ? <View style={styles.empty}><Text style={styles.emptyTitle}>{locale === "ar" ? "لا توجد محادثات بعد" : "No conversations yet"}</Text><Text style={styles.subtitle}>{locale === "ar" ? "تظهر المحادثة تلقائيًا بعد قبول موهبة." : "A conversation appears automatically after accepting a talent."}</Text></View> : null}
    renderItem={({ item }) => <ConversationRow item={item} styles={styles} locale={locale} />}
  /><PublisherTabBar active="messages" locale={locale} theme={theme} unreadCount={unreadCount} /></View>;
}

function ConversationRow({ item, styles, locale }: { item: MobileConversation; styles: ReturnType<typeof createStyles>; locale: "ar" | "en" }) {
  const date = item.lastActivityAt ? new Date(item.lastActivityAt).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", { month: "short", day: "numeric" }) : "";
  return <Pressable style={styles.card} onPress={() => router.push(`/conversations/${item.id}`)}>{item.partyImageUrl ? <Image source={{ uri: item.partyImageUrl }} style={styles.avatar} /> : <View style={styles.avatarFallback}><Text style={styles.avatarText}>{item.partyName.slice(0, 1)}</Text></View>}<View style={styles.cardBody}><View style={styles.rowTop}><Text numberOfLines={1} style={styles.party}>{item.partyName}</Text><Text style={styles.date}>{date}</Text></View><Text numberOfLines={1} style={styles.opportunity}>{item.opportunityTitle ?? "MLAMH"}</Text><Text numberOfLines={1} style={styles.preview}>{item.latestMessage ?? (locale === "ar" ? "ابدأ المحادثة" : "Start the conversation")}</Text></View>{item.unreadCount > 0 ? <View style={styles.unread}><Text style={styles.unreadText}>{item.unreadCount > 99 ? "99+" : item.unreadCount}</Text></View> : null}</Pressable>;
}

function createStyles(theme: typeof lightTheme | typeof darkTheme) { return StyleSheet.create({ screen: { flex: 1, backgroundColor: theme.background }, centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }, content: { paddingHorizontal: 18, paddingTop: 60, paddingBottom: 28, gap: 10 }, header: { gap: 7, marginBottom: 10 }, eyebrow: { color: theme.accent, fontSize: 12, fontWeight: "800", letterSpacing: 2.2 }, title: { color: theme.text, fontSize: 36, fontWeight: "300" }, subtitle: { color: theme.muted, fontSize: 13, lineHeight: 20 }, error: { color: "#EF8B8B", fontSize: 13 }, card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderWidth: 1, borderColor: theme.border, borderRadius: 22, backgroundColor: theme.surface }, avatar: { width: 52, height: 52, borderRadius: 18, backgroundColor: theme.border }, avatarFallback: { width: 52, height: 52, borderRadius: 18, backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" }, avatarText: { color: theme.accent, fontSize: 20, fontWeight: "700" }, cardBody: { flex: 1, gap: 3 }, rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }, party: { flex: 1, color: theme.text, fontSize: 16, fontWeight: "700" }, date: { color: theme.muted, fontSize: 9 }, opportunity: { color: theme.accent, fontSize: 10, fontWeight: "700" }, preview: { color: theme.muted, fontSize: 12 }, unread: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 5, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" }, unreadText: { color: "#181818", fontSize: 9, fontWeight: "800" }, empty: { minHeight: 220, borderWidth: 1, borderStyle: "dashed", borderColor: theme.border, borderRadius: 24, alignItems: "center", justifyContent: "center", gap: 8, padding: 20 }, emptyTitle: { color: theme.text, fontSize: 18, fontWeight: "600" } }); }
