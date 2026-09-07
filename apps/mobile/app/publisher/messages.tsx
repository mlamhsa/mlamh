import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft, ChevronRight, MessageCircle, MessagesSquare } from "lucide-react-native";

import { PublisherTabBar } from "@/components/PublisherTabBar";
import { ScreenSkeleton } from "@/components/ScreenSkeleton";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { getPublisherConversations, type MobileConversation } from "@/lib/publisher-api";
import { darkTheme } from "@/lib/theme";

export default function PublisherMessagesScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const { width } = useWindowDimensions();
  const compact = width <= 360;
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme, compact), [compact, theme]);
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
  if (loading) return <ScreenSkeleton variant="list" locale={locale} label={isArabic ? "جارٍ تحميل محادثات الجهة" : "Loading publisher messages"} />;

  return <SafeAreaView style={styles.screen} edges={["top"]}>
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.accent} />}
      contentContainerStyle={[styles.content, { direction: isRtl ? "rtl" : "ltr" }]}
      ListHeaderComponent={<View style={styles.header}>
        <View style={[styles.brandRow, isRtl && styles.rowRtl]}>
          <View style={styles.headingCopy}>
            <Text style={[styles.eyebrow, isArabic && styles.arabicText, isRtl && styles.textRtl]}>{isArabic ? "ملامح للأعمال" : "MLAMH FOR BUSINESS"}</Text>
            <View style={[styles.titleRow, isRtl && styles.rowRtl]}>
              <View style={styles.titleIcon}><MessagesSquare size={compact ? 18 : 20} color={theme.accent} strokeWidth={1.8} /></View>
              <Text accessibilityRole="header" style={[styles.title, isRtl && styles.textRtl]}>{isArabic ? "الرسائل" : "Messages"}</Text>
            </View>
          </View>
          {unreadCount > 0 ? <View style={styles.headerBadge}><Text style={styles.headerBadgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text></View> : null}
        </View>
        <Text style={[styles.subtitle, isRtl && styles.textRtl]}>{isArabic ? "المحادثات تظهر فقط بعد قبول الموهبة، حفاظًا على دورة العمل والخصوصية." : "Conversations appear only after a talent is accepted, preserving workflow and privacy."}</Text>
        {error ? <View style={styles.errorCard}><Text accessibilityRole="alert" style={[styles.error, isRtl && styles.textRtl]}>{error}</Text><Pressable accessibilityRole="button" style={[styles.retry, isRtl && styles.retryRtl]} onPress={() => void load()}><Text style={styles.retryText}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text></Pressable></View> : null}
      </View>}
      ListEmptyComponent={!error ? <View style={styles.empty}><View style={styles.emptyIcon}><MessageCircle size={24} color={theme.accent} strokeWidth={1.8} /></View><Text style={styles.emptyTitle}>{isArabic ? "لا توجد محادثات بعد" : "No conversations yet"}</Text><Text style={styles.emptyBody}>{isArabic ? "بعد قبول موهبة على إحدى فرصك ستظهر المحادثة هنا تلقائيًا." : "After accepting a talent for an opportunity, the conversation will appear here automatically."}</Text></View> : null}
      renderItem={({ item }) => <ConversationRow item={item} styles={styles} locale={locale} isRtl={isRtl} />}
      showsVerticalScrollIndicator={false}
    />
    <PublisherTabBar active="messages" locale={locale} theme={theme} unreadCount={unreadCount} />
  </SafeAreaView>;
}

function ConversationRow({ item, styles, locale, isRtl }: { item: MobileConversation; styles: ReturnType<typeof createStyles>; locale: "ar" | "en"; isRtl: boolean }) {
  const isArabic = locale === "ar";
  const date = item.lastActivityAt ? new Date(item.lastActivityAt).toLocaleDateString(isArabic ? "ar-SA-u-nu-latn" : "en-US", { month: "short", day: "numeric" }) : "";
  const ArrowIcon = isRtl ? ChevronLeft : ChevronRight;
  return <Pressable accessibilityRole="button" accessibilityLabel={`${item.partyName}, ${item.opportunityTitle ?? "MLAMH"}`} style={({ pressed }) => [styles.row, isRtl && styles.rowRtl, item.unreadCount > 0 && styles.rowUnread, pressed && styles.pressed]} onPress={() => router.push(`/conversations/${item.id}`)}>
    {item.partyImageUrl ? <Image source={{ uri: item.partyImageUrl }} style={[styles.avatar, item.unreadCount > 0 && styles.avatarUnread]} /> : <View style={[styles.avatarFallback, item.unreadCount > 0 && styles.avatarUnread]}><Text style={styles.avatarText}>{item.partyName.slice(0, 1)}</Text></View>}
    <View style={styles.cardBody}>
      <View style={[styles.rowTop, isRtl && styles.rowRtl]}><Text numberOfLines={1} style={[styles.party, item.unreadCount > 0 && styles.partyUnread, isRtl && styles.textRtl]}>{item.partyName}</Text><Text style={styles.date}>{date}</Text></View>
      <Text numberOfLines={1} style={[styles.opportunity, isRtl && styles.textRtl]}>{item.opportunityTitle ?? "MLAMH"}</Text>
      <Text numberOfLines={1} style={[styles.preview, item.unreadCount > 0 && styles.previewUnread, isRtl && styles.textRtl]}>{item.latestMessage ?? (isArabic ? "ابدأ المحادثة" : "Start the conversation")}</Text>
    </View>
    {item.unreadCount > 0 ? <View style={styles.unread}><Text style={styles.unreadText}>{item.unreadCount > 99 ? "99+" : item.unreadCount}</Text></View> : <View style={styles.openIcon}><ArrowIcon size={16} color={themeColor} strokeWidth={1.8} /></View>}
  </Pressable>;
}

const themeColor = "#F5F5F0";

function createStyles(theme: typeof darkTheme, compact: boolean) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  content: { width: "100%", maxWidth: 680, alignSelf: "center", paddingHorizontal: compact ? 14 : 18, paddingTop: compact ? 14 : 18, paddingBottom: compact ? 104 : 116 },
  rowRtl: { flexDirection: "row-reverse" },
  textRtl: { textAlign: "right", writingDirection: "rtl" },
  arabicText: { letterSpacing: 0, writingDirection: "rtl" },
  header: { gap: compact ? 9 : 11, marginBottom: compact ? 18 : 22 },
  brandRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  headingCopy: { flex: 1, gap: 5 },
  eyebrow: { color: theme.accent, fontSize: compact ? 9 : 10, fontWeight: "900", letterSpacing: 1.8 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  titleIcon: { width: compact ? 36 : 40, height: compact ? 36 : 40, borderRadius: 14, borderWidth: 1, borderColor: "#C9A96244", backgroundColor: "#C9A9620C", alignItems: "center", justifyContent: "center" },
  title: { flexShrink: 1, color: theme.text, fontSize: compact ? 26 : 30, lineHeight: compact ? 32 : 37, fontWeight: "800" },
  subtitle: { color: theme.muted, fontSize: compact ? 11 : 12, lineHeight: compact ? 18 : 19, maxWidth: 430 },
  headerBadge: { minWidth: 28, height: 28, borderRadius: 14, backgroundColor: theme.accent, paddingHorizontal: 7, alignItems: "center", justifyContent: "center" },
  headerBadgeText: { color: theme.background, fontSize: 10, fontWeight: "900" },
  errorCard: { gap: 10, marginTop: 6, borderWidth: 1, borderColor: theme.border, borderRadius: 14, backgroundColor: theme.surface, padding: 13 },
  error: { color: "#E59A9A", fontSize: 12, lineHeight: 19 },
  retry: { alignSelf: "flex-start", borderWidth: 1, borderColor: theme.border, borderRadius: 11, paddingHorizontal: 13, minHeight: 42, justifyContent: "center" },
  retryRtl: { alignSelf: "flex-end" },
  retryText: { color: theme.text, fontWeight: "800", fontSize: 11 },
  row: { flexDirection: "row", alignItems: "center", gap: compact ? 9 : 11, minHeight: compact ? 80 : 88, paddingHorizontal: compact ? 10 : 12, paddingVertical: 12, marginBottom: 9, borderWidth: 1, borderColor: theme.border, borderRadius: 19, backgroundColor: theme.surface },
  rowUnread: { borderColor: "#C9A96255", backgroundColor: "#C9A96208" },
  pressed: { opacity: 0.68 },
  avatar: { width: compact ? 46 : 50, height: compact ? 46 : 50, borderRadius: compact ? 23 : 25, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  avatarFallback: { width: compact ? 46 : 50, height: compact ? 46 : 50, borderRadius: compact ? 23 : 25, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" },
  avatarUnread: { borderColor: theme.accent },
  avatarText: { color: theme.accent, fontSize: compact ? 17 : 19, fontWeight: "800" },
  cardBody: { flex: 1, gap: 4 },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  party: { flex: 1, color: theme.text, fontSize: compact ? 14 : 15, fontWeight: "700" },
  partyUnread: { fontWeight: "900" },
  date: { color: theme.muted, fontSize: 9 },
  opportunity: { color: theme.accent, fontSize: 9, fontWeight: "800" },
  preview: { color: theme.muted, fontSize: compact ? 10 : 11 },
  previewUnread: { color: theme.text, fontWeight: "700" },
  unread: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 5, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" },
  unreadText: { color: theme.background, fontSize: 9, fontWeight: "900" },
  openIcon: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" },
  empty: { minHeight: 240, alignItems: "center", justifyContent: "center", gap: 9, paddingHorizontal: compact ? 18 : 26 },
  emptyIcon: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderColor: "#C9A96255", backgroundColor: "#C9A9620A", alignItems: "center", justifyContent: "center" },
  emptyTitle: { color: theme.text, fontSize: 17, fontWeight: "800", textAlign: "center" },
  emptyBody: { color: theme.muted, fontSize: 12, lineHeight: 19, textAlign: "center", maxWidth: 300 },
}); }
