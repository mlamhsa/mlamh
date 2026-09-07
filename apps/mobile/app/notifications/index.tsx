import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowUpRight, BellRing, Inbox, MailOpen } from "lucide-react-native";

import { AppTabBar } from "@/components/AppTabBar";
import { PublisherTabBar } from "@/components/PublisherTabBar";
import { ScreenSkeleton } from "@/components/ScreenSkeleton";
import { getMobileAccountContext } from "@/lib/account";
import { getNotifications, markNotificationRead, type MobileNotification } from "@/lib/api";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { useNotificationSync } from "@/lib/notifications-context";
import { darkTheme } from "@/lib/theme";

export default function NotificationsScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { refresh: refreshBadge } = useNotificationSync();
  const [items, setItems] = useState<MobileNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [accountType, setAccountType] = useState<"talent" | "publisher">("talent");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const [result, account] = await Promise.all([getNotifications(), getMobileAccountContext().catch(() => null)]);
      if (!result) { router.replace({ pathname: "/login", params: { next: "/notifications" } }); return; }
      setAccountType(account?.type === "publisher" ? "publisher" : "talent");
      setItems(result.items); setUnreadCount(result.unreadCount); void refreshBadge();
    } catch {
      setError(isArabic ? "تعذر تحميل الإشعارات. تحقق من الاتصال وحاول مرة أخرى." : "Unable to load notifications. Check your connection and try again.");
    } finally { setLoading(false); setRefreshing(false); }
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

  if (loading) return <ScreenSkeleton variant="list" locale={locale} label={isArabic ? "جارٍ تحميل الإشعارات" : "Loading notifications"} />;
  const visibleItems = filter === "unread" ? items.filter((item) => !item.isRead) : items;
  const readCount = Math.max(0, items.length - unreadCount);

  return <SafeAreaView style={styles.screen} edges={["top"]}>
    <FlatList
      data={visibleItems}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={[styles.content, { direction: isRtl ? "rtl" : "ltr" }]}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.accent} colors={[theme.accent]} />}
      ListHeaderComponent={<View style={styles.header}>
        <View style={[styles.topRow, isRtl && styles.rowRtl]}>
          <View style={styles.headingCopy}><Text style={styles.eyebrow}>{isArabic ? "MLAMH · مركز التحديثات" : "MLAMH · ACTIVITY CENTER"}</Text><Text accessibilityRole="header" style={[styles.title, { textAlign: isRtl ? "right" : "left" }]}>{isArabic ? "الإشعارات" : "Notifications"}</Text></View>
          <View style={styles.titleIcon}><BellRing size={20} color={theme.accent} strokeWidth={1.8} />{unreadCount > 0 ? <View style={styles.countBadge}><Text style={styles.countText}>{unreadCount > 99 ? "99+" : unreadCount}</Text></View> : null}</View>
        </View>
        <Text style={[styles.subtitle, { textAlign: isRtl ? "right" : "left" }]}>{isArabic ? "الطلبات والقبول والرسائل والتنبيهات المهمة في مكان واحد." : "Applications, decisions, messages and important account updates in one place."}</Text>
        <View style={[styles.summaryCard, isRtl && styles.rowRtl]}>
          <View style={styles.summaryPrimary}><Inbox size={16} color={theme.accent} strokeWidth={1.8} /><Text style={styles.summaryLabel}>{isArabic ? "غير مقروء" : "Unread"}</Text><Text style={styles.summaryValue}>{unreadCount}</Text></View>
          <View style={styles.summaryDivider} />
          <View style={styles.summarySecondary}><MailOpen size={15} color={theme.muted} strokeWidth={1.8} /><Text style={styles.summaryLabel}>{isArabic ? "مقروء" : "Read"}</Text><Text style={styles.summaryValueSmall}>{readCount}</Text></View>
          <View style={styles.summaryDivider} />
          <View style={styles.summarySecondary}><Text style={styles.summaryLabel}>{isArabic ? "الإجمالي" : "Total"}</Text><Text style={styles.summaryValueSmall}>{items.length}</Text></View>
        </View>
        <View accessibilityRole="tablist" style={[styles.filters, isRtl && styles.rowRtl]}><Filter active={filter === "all"} label={isArabic ? `الكل ${items.length}` : `All ${items.length}`} onPress={() => setFilter("all")} styles={styles} /><Filter active={filter === "unread"} label={isArabic ? `غير مقروء ${unreadCount}` : `Unread ${unreadCount}`} onPress={() => setFilter("unread")} styles={styles} /></View>
        {error ? <View style={styles.errorCard}><Text accessibilityRole="alert" style={styles.error}>{error}</Text><Pressable style={styles.retry} onPress={() => void load()}><Text style={styles.retryText}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text></Pressable></View> : null}
      </View>}
      ListEmptyComponent={!error ? <View style={styles.emptyState}><View style={styles.emptyIcon}><BellRing size={25} color={theme.accent} strokeWidth={1.8} /></View><Text style={styles.emptyEyebrow}>{isArabic ? "كل شيء محدث" : "YOU'RE CAUGHT UP"}</Text><Text style={styles.emptyTitle}>{filter === "unread" ? (isArabic ? "لا توجد إشعارات غير مقروءة" : "No unread notifications") : (isArabic ? "لا توجد إشعارات بعد" : "No notifications yet")}</Text><Text style={styles.emptyBody}>{isArabic ? "ستظهر هنا تحديثات الطلبات والرسائل والقرارات المهمة." : "Important application, message and decision updates will appear here."}</Text></View> : null}
      renderItem={({ item }) => <NotificationRow item={item} locale={locale} isRtl={isRtl} styles={styles} onPress={() => void openNotification(item)} />}
      ListFooterComponent={<View style={styles.footerSpace} />}
      showsVerticalScrollIndicator={false}
    />
    {accountType === "publisher" ? <PublisherTabBar active="notifications" locale={locale} theme={theme} notificationCount={unreadCount} /> : <AppTabBar active="notifications" locale={locale} theme={theme} notificationCount={unreadCount} />}
  </SafeAreaView>;
}
function Filter({ active, label, onPress, styles }: { active: boolean; label: string; onPress: () => void; styles: ReturnType<typeof createStyles> }) { return <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.filter, active && styles.filterActive]}><Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text></Pressable>; }
function NotificationRow({ item, locale, isRtl, styles, onPress }: { item: MobileNotification; locale: "ar" | "en"; isRtl: boolean; styles: ReturnType<typeof createStyles>; onPress: () => void }) {
  const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US", { month: "short", day: "numeric" }) : "";
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, !item.isRead && styles.rowUnread, pressed && styles.pressed]}>
    <View style={[styles.rowTop, isRtl && styles.rowRtl]}><View style={[styles.categoryPill, !item.isRead && styles.categoryPillUnread]}><Text style={[styles.category, !item.isRead && styles.categoryUnread]}>{categoryLabel(item.category, locale)}</Text></View><View style={[styles.dateWrap, isRtl && styles.rowRtl]}>{!item.isRead ? <View style={styles.unreadDot} /> : null}<Text style={styles.date}>{date}</Text></View></View>
    <Text numberOfLines={2} style={[styles.cardTitle, !item.isRead && styles.cardTitleUnread, { textAlign: isRtl ? "right" : "left" }]}>{item.title}</Text>
    {item.body ? <Text numberOfLines={3} style={[styles.body, { textAlign: isRtl ? "right" : "left" }]}>{item.body}</Text> : null}
    <View style={[styles.openRow, isRtl && styles.rowRtl]}><Text style={styles.openText}>{locale === "ar" ? "فتح التحديث" : "Open update"}</Text><View style={styles.openIcon}><ArrowUpRight size={14} color={themeColor} strokeWidth={1.8} /></View></View>
  </Pressable>;
}
const themeColor = "#C9A962";
function categoryLabel(category: MobileNotification["category"], locale: "ar" | "en") { const labels = { application: { ar: "طلب", en: "Application" }, message: { ar: "رسالة", en: "Message" }, invitation: { ar: "دعوة", en: "Invitation" }, system: { ar: "ملامح", en: "MLAMH" } } as const; return labels[category][locale]; }
function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen:{flex:1,backgroundColor:theme.background},content:{paddingHorizontal:18,paddingTop:10,paddingBottom:20},header:{gap:13,marginBottom:16},topRow:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:14,minHeight:52},rowRtl:{flexDirection:"row-reverse"},headingCopy:{flex:1},eyebrow:{color:theme.accent,fontSize:9,fontWeight:"900",letterSpacing:1.3},title:{color:theme.text,fontSize:29,lineHeight:35,fontWeight:"800",marginTop:4},titleIcon:{width:46,height:46,borderRadius:16,borderWidth:1,borderColor:"#C9A96244",backgroundColor:"#C9A9620C",alignItems:"center",justifyContent:"center",position:"relative"},countBadge:{position:"absolute",right:-5,top:-5,minWidth:20,height:20,borderRadius:10,backgroundColor:theme.accent,alignItems:"center",justifyContent:"center",paddingHorizontal:4},countText:{color:theme.background,fontSize:8,fontWeight:"900"},subtitle:{color:theme.muted,fontSize:13,lineHeight:20,maxWidth:520},summaryCard:{minHeight:86,flexDirection:"row",alignItems:"stretch",borderWidth:1,borderColor:theme.border,borderRadius:19,backgroundColor:theme.surface,overflow:"hidden"},summaryPrimary:{flex:1.25,justifyContent:"center",paddingHorizontal:15,paddingVertical:12,gap:3},summarySecondary:{flex:1,justifyContent:"center",paddingHorizontal:13,paddingVertical:12,gap:3},summaryDivider:{width:1,backgroundColor:theme.border,marginVertical:14},summaryLabel:{color:theme.muted,fontSize:9,fontWeight:"700"},summaryValue:{color:theme.accent,fontSize:25,fontWeight:"800"},summaryValueSmall:{color:theme.text,fontSize:20,fontWeight:"800"},filters:{flexDirection:"row",gap:8},filter:{minHeight:42,borderRadius:999,borderWidth:1,borderColor:theme.border,backgroundColor:theme.surface,alignItems:"center",justifyContent:"center",paddingHorizontal:14},filterActive:{borderColor:theme.accent,backgroundColor:theme.chip},filterText:{color:theme.muted,fontSize:10,fontWeight:"800"},filterTextActive:{color:theme.accent},separator:{height:9},row:{minHeight:126,borderWidth:1,borderColor:theme.border,borderRadius:20,backgroundColor:theme.surface,padding:15,gap:9},rowUnread:{borderColor:"#C9A96255",backgroundColor:"#C9A9620A"},pressed:{opacity:.72},rowTop:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:10},categoryPill:{borderWidth:1,borderColor:theme.border,borderRadius:999,paddingHorizontal:9,paddingVertical:5},categoryPillUnread:{borderColor:"#C9A96255",backgroundColor:theme.chip},category:{color:theme.muted,fontSize:8,fontWeight:"800"},categoryUnread:{color:theme.accent},dateWrap:{flexDirection:"row",alignItems:"center",gap:6},unreadDot:{width:6,height:6,borderRadius:3,backgroundColor:theme.accent},date:{color:theme.grayMuted,fontSize:9},cardTitle:{color:theme.text,fontSize:15,lineHeight:21,fontWeight:"600"},cardTitleUnread:{fontWeight:"900"},body:{color:theme.muted,fontSize:12,lineHeight:19},openRow:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:5,marginTop:2},openText:{color:theme.accent,fontSize:9,fontWeight:"800"},openIcon:{width:28,height:28,borderRadius:14,borderWidth:1,borderColor:"#C9A96244",alignItems:"center",justifyContent:"center"},errorCard:{gap:9,borderWidth:1,borderColor:"#8C4A4A66",borderRadius:15,backgroundColor:"#8C4A4A12",padding:13},error:{color:"#E59A9A",fontSize:12,lineHeight:18},retry:{alignSelf:"flex-start",borderWidth:1,borderColor:theme.border,borderRadius:10,paddingHorizontal:14,minHeight:44,justifyContent:"center"},retryText:{color:theme.text,fontSize:10,fontWeight:"800"},emptyState:{minHeight:225,borderWidth:1,borderColor:theme.border,borderRadius:22,backgroundColor:theme.surface,padding:24,alignItems:"center",justifyContent:"center",gap:8},emptyIcon:{width:50,height:50,borderRadius:25,borderWidth:1,borderColor:"#C9A96255",backgroundColor:"#C9A9620A",alignItems:"center",justifyContent:"center"},emptyEyebrow:{color:theme.accent,fontSize:8,fontWeight:"900",letterSpacing:1.2},emptyTitle:{color:theme.text,fontSize:17,fontWeight:"800",textAlign:"center"},emptyBody:{color:theme.muted,fontSize:11,lineHeight:18,textAlign:"center",maxWidth:280},footerSpace:{height:16}
}); }