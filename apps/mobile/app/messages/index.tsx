import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft, ChevronRight, Clock3, LockKeyhole, MessageCircle, MessagesSquare } from "lucide-react-native";

import { AppTabBar } from "@/components/AppTabBar";
import { ScreenSkeleton } from "@/components/ScreenSkeleton";
import { getConversations, getNotifications, type MobileConversation } from "@/lib/api";
import { isRtlLocale } from "@/lib/i18n";
import { useAppLocale } from "@/lib/locale-context";
import { darkTheme } from "@/lib/theme";

export default function MessagesScreen() {
  const { locale } = useAppLocale();
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
  if (loading) return <ScreenSkeleton variant="list" locale={locale} label={isArabic ? "جارٍ تحميل المحادثات" : "Loading conversations"} />;

  const activeToday = items.filter((item) => isToday(item.lastActivityAt)).length;
  const latestActivity = items.map((item) => item.lastActivityAt).filter((value): value is string => Boolean(value)).sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null;
  const align = isRtl ? "right" : "left";

  return <SafeAreaView style={styles.screen} edges={["top"]}>
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={[styles.content, compact && styles.contentCompact]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.accent} />}
      ListHeaderComponent={<View style={[styles.header, isRtl && styles.headerRtl]}>
        <Text style={[styles.brand, isArabic && styles.arabicBrand, { textAlign: align }]}>{isArabic ? "ملامح" : "MLAMH"}</Text>
        <View style={[styles.titleRow, isRtl && styles.rowRtl]}>
          <View style={styles.titleIcon}><MessagesSquare size={compact ? 18 : 20} color={theme.accent} strokeWidth={1.8} /></View>
          <Text accessibilityRole="header" style={[styles.title, compact && styles.titleCompact, { textAlign: align, writingDirection: isRtl ? "rtl" : "ltr" }]}>{isArabic ? "الرسائل" : "Messages"}</Text>
          {unreadCount > 0 ? <View style={styles.unreadPill}><Text style={styles.unreadPillText}>{unreadCount > 99 ? "99+" : unreadCount}</Text></View> : null}
        </View>
        <Text style={[styles.subtitle, { textAlign: align, writingDirection: isRtl ? "rtl" : "ltr", alignSelf: isRtl ? "flex-end" : "flex-start" }]}>{isArabic ? "المحادثات تفتح بعد القبول فقط، لحماية بيانات الطرفين." : "Conversations unlock only after acceptance, keeping both parties protected."}</Text>
        <View style={[styles.activityStrip, isRtl && styles.rowRtl]}>
          <ActivityMetric value={String(unreadCount)} label={isArabic ? "غير مقروء" : "Unread"} styles={styles} isRtl={isRtl} />
          <ActivityMetric value={String(activeToday)} label={isArabic ? "نشطة اليوم" : "Active today"} styles={styles} isRtl={isRtl} />
          <ActivityMetric value={latestActivity ? relativeTime(latestActivity, locale) : "—"} label={isArabic ? "آخر نشاط" : "Latest"} styles={styles} isRtl={isRtl} compact />
        </View>
        <View style={[styles.privacyNote, isRtl && styles.rowRtl]}><LockKeyhole size={15} color={theme.accent} strokeWidth={1.8} /><Text style={[styles.privacyText, { textAlign: align, writingDirection: isRtl ? "rtl" : "ltr" }]}>{isArabic ? "التواصل وبيانات الاتصال تبقى خاصة قبل القبول." : "Contact details stay private until acceptance."}</Text></View>
      </View>}
      ListEmptyComponent={<View style={styles.emptyState}><View style={styles.emptyIcon}><MessageCircle size={25} color={theme.accent} /></View><Text style={styles.emptyTitle}>{error ?? (isArabic ? "لا توجد محادثات حتى الآن" : "No conversations yet")}</Text><Text style={styles.emptyBody}>{error ? (isArabic ? "أعد المحاولة عند استقرار الاتصال." : "Try again when your connection is stable.") : (isArabic ? "عند قبول أحد طلباتك ستظهر المحادثة هنا تلقائيًا." : "When one of your applications is accepted, its conversation appears here automatically.")}</Text>{error ? <Pressable style={styles.retryButton} onPress={() => void load()}><Text style={styles.retryText}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text></Pressable> : null}</View>}
      renderItem={({ item }) => <ConversationRow item={item} locale={locale} isRtl={isRtl} compact={compact} styles={styles} />}
      showsVerticalScrollIndicator={false}
    />
    <AppTabBar active="messages" locale={locale} theme={theme} notificationCount={notificationCount} />
  </SafeAreaView>;
}

function ActivityMetric({ value, label, styles, isRtl, compact = false }: { value: string; label: string; styles: ReturnType<typeof createStyles>; isRtl: boolean; compact?: boolean }) {
  return <View style={[styles.activityMetric, { alignItems: isRtl ? "flex-end" : "flex-start" }]}><Text style={[styles.activityValue, compact && styles.activityValueCompact]}>{value}</Text><Text style={[styles.activityLabel, { textAlign: isRtl ? "right" : "left", writingDirection: isRtl ? "rtl" : "ltr" }]}>{label}</Text></View>;
}

function ConversationRow({ item, locale, isRtl, compact, styles }: { item: MobileConversation; locale: "ar" | "en"; isRtl: boolean; compact: boolean; styles: ReturnType<typeof createStyles> }) {
  const isArabic = locale === "ar";
  const time = item.lastActivityAt ? relativeTime(item.lastActivityAt, locale) : "";
  const ArrowIcon = isRtl ? ChevronLeft : ChevronRight;
  const textStyle = { textAlign: (isRtl ? "right" : "left") as "right" | "left", writingDirection: (isRtl ? "rtl" : "ltr") as "rtl" | "ltr" };
  return <Pressable onPress={() => router.push(`/conversations/${item.id}`)} style={({ pressed }) => [styles.row, compact && styles.rowCompact, item.unreadCount > 0 && styles.rowUnread, isRtl && styles.rowRtl, pressed && styles.pressed]}>
    {item.partyImageUrl ? <Image source={{ uri: item.partyImageUrl }} style={[styles.avatar, compact && styles.avatarCompact, item.unreadCount > 0 && styles.avatarUnread]} /> : <View style={[styles.avatar, compact && styles.avatarCompact, styles.avatarFallback, item.unreadCount > 0 && styles.avatarUnread]}><Text style={styles.avatarInitial}>{item.partyName.slice(0, 1).toUpperCase()}</Text></View>}
    <View style={[styles.rowBody, { alignItems: isRtl ? "flex-end" : "stretch" }]}>
      <View style={[styles.rowTop, isRtl && styles.rowRtl]}><Text numberOfLines={1} style={[styles.partyName, item.unreadCount > 0 && styles.partyNameUnread, textStyle]}>{item.partyName}</Text><View style={[styles.timeRow, isRtl && styles.rowRtl]}><Clock3 size={11} color={themeMuted} /><Text style={styles.time}>{time}</Text></View></View>
      {item.opportunityTitle ? <View style={[styles.opportunityPill, isRtl && styles.opportunityPillRtl]}><Text numberOfLines={1} style={[styles.opportunity, textStyle]}>{item.opportunityTitle}</Text></View> : null}
      <View style={[styles.previewRow, isRtl && styles.rowRtl]}><Text numberOfLines={1} style={[styles.preview, item.unreadCount > 0 && styles.previewUnread, textStyle]}>{item.latestMessage ?? (isArabic ? "ابدأ المحادثة" : "Start the conversation")}</Text>{item.unreadCount > 0 ? <View style={styles.messageBadge}><Text style={styles.messageBadgeText}>{item.unreadCount > 99 ? "99+" : item.unreadCount}</Text></View> : null}</View>
    </View>
    <View style={styles.openIcon}><ArrowIcon size={17} color="#F5F5F0" /></View>
  </Pressable>;
}

const themeMuted = "#8F8F89";
function isToday(value: string | null) { if (!value) return false; const date = new Date(value); const now = new Date(); return date.toDateString() === now.toDateString(); }
function relativeTime(value: string, locale: "ar" | "en") { const delta = Date.now() - Date.parse(value); if (!Number.isFinite(delta) || delta < 0) return locale === "ar" ? "الآن" : "Now"; const minutes = Math.floor(delta / 60000); if (minutes < 1) return locale === "ar" ? "الآن" : "Now"; if (minutes < 60) return locale === "ar" ? `منذ ${minutes} د` : `${minutes}m ago`; const hours = Math.floor(minutes / 60); if (hours < 24) return locale === "ar" ? `منذ ${hours} س` : `${hours}h ago`; const days = Math.floor(hours / 24); if (days === 1) return locale === "ar" ? "أمس" : "Yesterday"; if (days < 7) return locale === "ar" ? `منذ ${days} أيام` : `${days}d ago`; return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-US-u-ca-gregory-nu-latn", { day: "numeric", month: "short" }).format(new Date(value)); }

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen:{flex:1,backgroundColor:theme.background},content:{paddingHorizontal:20,paddingTop:20,paddingBottom:118},contentCompact:{paddingHorizontal:14,paddingTop:14,paddingBottom:106},header:{gap:10,marginBottom:22},headerRtl:{alignItems:"stretch"},brand:{color:theme.accent,fontSize:12,fontWeight:"900",letterSpacing:1.9},arabicBrand:{letterSpacing:0,writingDirection:"rtl"},titleRow:{flexDirection:"row",alignItems:"center",gap:9},rowRtl:{flexDirection:"row-reverse"},titleIcon:{width:40,height:40,borderRadius:14,borderWidth:1,borderColor:"#C9A96244",backgroundColor:"#C9A9620C",alignItems:"center",justifyContent:"center"},title:{flexShrink:1,color:theme.text,fontSize:29,lineHeight:35,fontWeight:"800"},titleCompact:{fontSize:26,lineHeight:31},subtitle:{color:theme.muted,fontSize:13,lineHeight:20,maxWidth:430},unreadPill:{minWidth:25,height:25,borderRadius:13,backgroundColor:theme.accent,paddingHorizontal:7,alignItems:"center",justifyContent:"center"},unreadPillText:{color:theme.background,fontSize:10,fontWeight:"900"},activityStrip:{flexDirection:"row",gap:8},activityMetric:{flex:1,minHeight:62,borderWidth:1,borderColor:"#C9A96233",borderRadius:16,backgroundColor:"#C9A96208",paddingHorizontal:11,paddingVertical:9,justifyContent:"center"},activityValue:{color:theme.text,fontSize:17,fontWeight:"900"},activityValueCompact:{fontSize:12},activityLabel:{marginTop:2,color:theme.muted,fontSize:9},privacyNote:{flexDirection:"row",alignItems:"center",gap:8,borderWidth:1,borderColor:"#C9A96233",borderRadius:16,backgroundColor:"#C9A96208",paddingHorizontal:13,paddingVertical:11},privacyText:{flex:1,color:theme.muted,fontSize:10,lineHeight:16},row:{minHeight:96,flexDirection:"row",alignItems:"center",gap:12,borderWidth:1,borderColor:theme.border,borderRadius:20,backgroundColor:theme.surface,paddingHorizontal:14,paddingVertical:13,marginBottom:10},rowCompact:{gap:9,paddingHorizontal:11,paddingVertical:11},rowUnread:{borderColor:"#C9A96255",backgroundColor:"#C9A96208"},pressed:{opacity:.72},avatar:{width:52,height:52,borderRadius:26,borderWidth:1,borderColor:theme.border,backgroundColor:theme.surface},avatarCompact:{width:46,height:46,borderRadius:23},avatarFallback:{alignItems:"center",justifyContent:"center"},avatarUnread:{borderColor:theme.accent},avatarInitial:{color:theme.accent,fontSize:18,fontWeight:"800"},rowBody:{flex:1,gap:5},rowTop:{width:"100%",flexDirection:"row",justifyContent:"space-between",alignItems:"center",gap:8},partyName:{flex:1,color:theme.text,fontSize:15,fontWeight:"700"},partyNameUnread:{fontWeight:"900"},timeRow:{flexDirection:"row",alignItems:"center",gap:4},time:{color:theme.muted,fontSize:9},opportunityPill:{alignSelf:"flex-start",maxWidth:"100%",borderRadius:999,backgroundColor:"#C9A9620C",paddingHorizontal:8,paddingVertical:3},opportunityPillRtl:{alignSelf:"flex-end"},opportunity:{color:theme.accent,fontSize:9,fontWeight:"800"},previewRow:{width:"100%",flexDirection:"row",alignItems:"center",gap:8},preview:{flex:1,color:theme.muted,fontSize:11,lineHeight:17},previewUnread:{color:theme.text,fontWeight:"700"},messageBadge:{minWidth:20,height:20,borderRadius:10,backgroundColor:theme.accent,alignItems:"center",justifyContent:"center",paddingHorizontal:5},messageBadgeText:{color:theme.background,fontSize:8,fontWeight:"900"},openIcon:{width:32,height:32,borderRadius:16,borderWidth:1,borderColor:theme.border,alignItems:"center",justifyContent:"center"},emptyState:{minHeight:230,borderWidth:1,borderColor:theme.border,borderRadius:22,backgroundColor:theme.surface,padding:25,alignItems:"center",justifyContent:"center",gap:10},emptyIcon:{width:52,height:52,borderRadius:26,borderWidth:1,borderColor:"#C9A96255",alignItems:"center",justifyContent:"center"},emptyTitle:{color:theme.text,fontSize:17,fontWeight:"800",textAlign:"center"},emptyBody:{color:theme.muted,fontSize:12,lineHeight:19,textAlign:"center",maxWidth:310},retryButton:{marginTop:5,backgroundColor:theme.accent,borderRadius:12,minHeight:48,paddingHorizontal:18,justifyContent:"center"},retryText:{color:theme.background,fontSize:12,fontWeight:"900"}
}); }