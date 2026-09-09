import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowUpRight, BellRing, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Inbox } from "lucide-react-native";

import { AppTabBar } from "@/components/AppTabBar";
import { PublisherTabBar } from "@/components/PublisherTabBar";
import { ScreenSkeleton } from "@/components/ScreenSkeleton";
import { getMobileAccountContext } from "@/lib/account";
import { getNotifications, markNotificationRead, type MobileNotification } from "@/lib/api";
import { isRtlLocale } from "@/lib/i18n";
import { useAppLocale } from "@/lib/locale-context";
import { useNotificationSync } from "@/lib/notifications-context";
import { darkTheme } from "@/lib/theme";

type NotificationFilter = "all" | "unread";

export default function NotificationsScreen() {
  const { locale } = useAppLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const { width } = useWindowDimensions();
  const compact = width <= 360;
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;
  const { refresh: refreshBadge } = useNotificationSync();

  const [items, setItems] = useState<MobileNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [accountType, setAccountType] = useState<"talent" | "publisher">("talent");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<NotificationFilter>("all");

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);

    try {
      const [result, account] = await Promise.all([
        getNotifications(),
        getMobileAccountContext().catch(() => null),
      ]);

      if (!result) {
        router.replace({ pathname: "/login", params: { next: "/notifications" } });
        return;
      }

      setAccountType(account?.type === "publisher" ? "publisher" : "talent");
      setItems(result.items);
      setUnreadCount(result.unreadCount);
      void refreshBadge();
    } catch {
      setError(
        isArabic
          ? "تعذر تحميل الإشعارات. تحقق من الاتصال وحاول مرة أخرى."
          : "Unable to load notifications. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isArabic, refreshBadge]);

  useEffect(() => {
    void load();
  }, [load]);

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
    if (target.type === "conversation") return router.push(`/conversations/${target.id}`);
    if (target.type === "publisher_opportunity") return router.push(`/publisher/opportunities/${target.id}`);
    if (target.type === "opportunity") return router.push(`/opportunities/${target.id}`);
    if (target.type === "talent_applications") return router.push("/applications");
  }

  if (loading) {
    return <ScreenSkeleton variant="list" locale={locale} label={isArabic ? "جارٍ تحميل الإشعارات" : "Loading notifications"} />;
  }

  const visibleItems = filter === "unread" ? items.filter((item) => !item.isRead) : items;
  const recentCount = items.filter((item) => isWithinHours(item.createdAt, 24)).length;
  const actionableCount = items.filter((item) => item.target.type !== "none").length;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <FlatList
        data={visibleItems}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.content, compact && styles.contentCompact, { direction: isRtl ? "rtl" : "ltr" }]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.accent} colors={[theme.accent]} />}
        ListHeaderComponent={(
          <View style={styles.header}>
            <View style={[styles.topRow, isRtl && styles.rowRtl]}>
              <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} style={styles.backButton}><BackIcon size={20} color={theme.text} strokeWidth={1.9}/></Pressable>
              <View style={styles.headingCopy}>
                <Text style={[styles.eyebrow, isArabic && styles.arabicEyebrow, { textAlign: isRtl ? "right" : "left" }]}>
                  {isArabic ? "ملامح · آخر المستجدات" : "MLAMH · WHAT'S NEW"}
                </Text>
                <Text accessibilityRole="header" style={[styles.title, compact && styles.titleCompact, { textAlign: isRtl ? "right" : "left", writingDirection: isRtl ? "rtl" : "ltr" }]}>
                  {isArabic ? "الإشعارات" : "Notifications"}
                </Text>
              </View>
              <View style={styles.titleIcon}>
                <BellRing size={compact ? 18 : 20} color={theme.accent} strokeWidth={1.8} />
                {unreadCount > 0 ? (
                  <View style={[styles.countBadge, isRtl && styles.countBadgeRtl]}>
                    <Text style={styles.countText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <Text style={[styles.subtitle, { textAlign: isRtl ? "right" : "left", writingDirection: isRtl ? "rtl" : "ltr" }]}>
              {isArabic
                ? "ركز على التحديثات التي تحتاج انتباهك الآن، وافتح الإجراء المرتبط بها مباشرة."
                : "Focus on updates that need your attention now and open the related action directly."}
            </Text>

            <View style={[styles.summaryCard, isRtl && styles.rowRtl, compact && styles.summaryCardCompact]}>
              <SummaryMetric icon={<Inbox size={16} color={theme.accent} strokeWidth={1.8} />} label={isArabic ? "غير مقروء" : "Unread"} value={unreadCount} accent styles={styles} isRtl={isRtl} />
              <View style={styles.summaryDivider} />
              <SummaryMetric icon={<Clock3 size={15} color={theme.muted} strokeWidth={1.8} />} label={isArabic ? "آخر 24 ساعة" : "Last 24h"} value={recentCount} styles={styles} isRtl={isRtl} />
              <View style={styles.summaryDivider} />
              <SummaryMetric icon={<CheckCircle2 size={15} color={theme.muted} strokeWidth={1.8} />} label={isArabic ? "قابل للفتح" : "Actionable"} value={actionableCount} styles={styles} isRtl={isRtl} />
            </View>

            <View accessibilityRole="tablist" style={[styles.filters, isRtl && styles.rowRtl]}>
              <Filter active={filter === "all"} label={isArabic ? `الكل ${items.length}` : `All ${items.length}`} onPress={() => setFilter("all")} styles={styles} isRtl={isRtl} />
              <Filter active={filter === "unread"} label={isArabic ? `غير مقروء ${unreadCount}` : `Unread ${unreadCount}`} onPress={() => setFilter("unread")} styles={styles} isRtl={isRtl} />
            </View>

            {error ? (
              <View style={styles.errorCard}>
                <Text accessibilityRole="alert" style={[styles.error, { textAlign: isRtl ? "right" : "left", writingDirection: isRtl ? "rtl" : "ltr" }]}>{error}</Text>
                <Pressable style={[styles.retry, isRtl && styles.retryRtl]} onPress={() => void load()}>
                  <Text style={[styles.retryText, isRtl && styles.arabicText]}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        )}
        ListEmptyComponent={!error ? (
          <EmptyState
            locale={locale}
            isRtl={isRtl}
            compact={compact}
            filter={filter}
            accountType={accountType}
            styles={styles}
          />
        ) : null}
        renderItem={({ item }) => (
          <NotificationRow
            item={item}
            locale={locale}
            isRtl={isRtl}
            compact={compact}
            styles={styles}
            onPress={() => void openNotification(item)}
          />
        )}
        ListFooterComponent={<View style={styles.footerSpace} />}
        showsVerticalScrollIndicator={false}
      />

      {accountType === "publisher"
        ? <PublisherTabBar active="notifications" locale={locale} theme={theme} notificationCount={unreadCount} />
        : <AppTabBar active="notifications" locale={locale} theme={theme} notificationCount={unreadCount} />}
    </SafeAreaView>
  );
}

function SummaryMetric({ icon, label, value, accent = false, styles, isRtl }: { icon: React.ReactNode; label: string; value: number; accent?: boolean; styles: ReturnType<typeof createStyles>; isRtl: boolean }) {
  return (
    <View style={[styles.summaryMetric, isRtl && styles.summaryRtl]}>
      {icon}
      <Text style={[styles.summaryLabel, isRtl && styles.arabicText]}>{label}</Text>
      <Text style={accent ? styles.summaryValueAccent : styles.summaryValue}>{value}</Text>
    </View>
  );
}

function Filter({ active, label, onPress, styles, isRtl }: { active: boolean; label: string; onPress: () => void; styles: ReturnType<typeof createStyles>; isRtl: boolean }) {
  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={({ pressed }) => [styles.filter, active && styles.filterActive, pressed && styles.pressed]}>
      <Text style={[styles.filterText, active && styles.filterTextActive, isRtl && styles.arabicText]}>{label}</Text>
    </Pressable>
  );
}

function EmptyState({ locale, isRtl, compact, filter, accountType, styles }: { locale: "ar" | "en"; isRtl: boolean; compact: boolean; filter: NotificationFilter; accountType: "talent" | "publisher"; styles: ReturnType<typeof createStyles> }) {
  const ar = locale === "ar";
  const unreadOnly = filter === "unread";
  const actionLabel = ar ? "رجوع" : "Back";
  const action = () => router.back();

  return (
    <View style={[styles.emptyState, compact && styles.emptyStateCompact]}>
      <View style={styles.emptyIcon}><BellRing size={25} color={themeColor} strokeWidth={1.8} /></View>
      <Text style={[styles.emptyEyebrow, isRtl && styles.arabicEyebrow]}>{ar ? "أنت على اطلاع" : "YOU'RE CAUGHT UP"}</Text>
      <Text style={[styles.emptyTitle, isRtl && styles.arabicText]}>
        {unreadOnly ? (ar ? "لا يوجد شيء ينتظر قراءتك" : "Nothing is waiting to be read") : (ar ? "لا توجد تحديثات جديدة بعد" : "No updates yet")}
      </Text>
      <Text style={[styles.emptyBody, isRtl && styles.arabicText]}>
        {unreadOnly
          ? (ar ? "عند وصول تحديث جديد سيظهر هنا مباشرة." : "New updates will appear here as soon as they arrive.")
          : (ar ? "ستظهر هنا الرسائل والقرارات والتحديثات المرتبطة بحسابك." : "Messages, decisions and account updates will appear here.")}
      </Text>
      <Pressable accessibilityRole="button" onPress={action} style={({ pressed }) => [styles.emptyAction, pressed && styles.pressed]}>
        <Text style={[styles.emptyActionText, isRtl && styles.arabicText]}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

function NotificationRow({ item, locale, isRtl, compact, styles, onPress }: { item: MobileNotification; locale: "ar" | "en"; isRtl: boolean; compact: boolean; styles: ReturnType<typeof createStyles>; onPress: () => void }) {
  const relativeTime = formatRelativeTime(item.createdAt, locale);
  const recent = isWithinHours(item.createdAt, 24);
  const actionable = item.target.type !== "none";
  const actionLabel = notificationActionLabel(item, locale);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={actionable ? actionLabel : undefined}
      onPress={onPress}
      style={({ pressed }) => [styles.row, compact && styles.rowCompact, !item.isRead && styles.rowUnread, pressed && styles.pressed]}
    >
      <View style={[styles.rowTop, isRtl && styles.rowRtl]}>
        <View style={[styles.badges, isRtl && styles.rowRtl]}>
          <View style={[styles.categoryPill, !item.isRead && styles.categoryPillUnread]}>
            <Text style={[styles.category, !item.isRead && styles.categoryUnread, isRtl && styles.arabicText]}>{categoryLabel(item.category, locale)}</Text>
          </View>
          {recent ? <View style={styles.recentPill}><Text style={[styles.recentText, isRtl && styles.arabicText]}>{locale === "ar" ? "حديث" : "Recent"}</Text></View> : null}
        </View>
        <View style={[styles.dateWrap, isRtl && styles.rowRtl]}>
          {!item.isRead ? <View style={styles.unreadDot} /> : null}
          <Text style={[styles.date, isRtl && styles.arabicText]}>{relativeTime}</Text>
        </View>
      </View>

      <Text numberOfLines={2} style={[styles.cardTitle, !item.isRead && styles.cardTitleUnread, compact && styles.cardTitleCompact, { textAlign: isRtl ? "right" : "left", writingDirection: isRtl ? "rtl" : "ltr" }]}>{item.title}</Text>
      {item.body ? <Text numberOfLines={3} style={[styles.body, { textAlign: isRtl ? "right" : "left", writingDirection: isRtl ? "rtl" : "ltr" }]}>{item.body}</Text> : null}

      <View style={[styles.openRow, isRtl && styles.rowRtl]}>
        <Text style={[styles.openText, !actionable && styles.openTextMuted, isRtl && styles.arabicText]}>{actionLabel}</Text>
        {actionable ? <View style={styles.openIcon}><ArrowUpRight size={14} color={themeColor} strokeWidth={1.8} style={isRtl ? styles.iconRtl : undefined} /></View> : null}
      </View>
    </Pressable>
  );
}

const themeColor = "#C9A962";

function categoryLabel(category: MobileNotification["category"], locale: "ar" | "en") {
  const labels = {
    application: { ar: "طلب", en: "Application" },
    message: { ar: "رسالة", en: "Message" },
    invitation: { ar: "دعوة", en: "Invitation" },
    system: { ar: "ملامح", en: "MLAMH" },
  } as const;
  return labels[category][locale];
}

function notificationActionLabel(item: MobileNotification, locale: "ar" | "en") {
  const ar = locale === "ar";
  switch (item.target.type) {
    case "conversation": return ar ? "فتح المحادثة" : "Open conversation";
    case "opportunity": return ar ? "عرض الفرصة" : "View opportunity";
    case "publisher_opportunity": return ar ? "إدارة الفرصة" : "Manage opportunity";
    case "talent_applications": return ar ? "عرض طلباتي" : "View applications";
    default: return ar ? "تم الاطلاع" : "Update only";
  }
}

function isWithinHours(value: string | null, hours: number) {
  if (!value) return false;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return false;
  const age = Date.now() - timestamp;
  return age >= 0 && age <= hours * 60 * 60 * 1000;
}

function formatRelativeTime(value: string | null, locale: "ar" | "en") {
  if (!value) return "";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "";

  const diffMs = Date.now() - timestamp;
  if (diffMs < 0) return locale === "ar" ? "الآن" : "Now";

  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (minutes < 1) return locale === "ar" ? "الآن" : "Now";
  if (minutes < 60) return locale === "ar" ? `منذ ${minutes} د` : `${minutes}m ago`;
  if (hours < 24) return locale === "ar" ? `منذ ${hours} س` : `${hours}h ago`;
  if (days === 1) return locale === "ar" ? "أمس" : "Yesterday";
  if (days < 7) return locale === "ar" ? `منذ ${days} أيام` : `${days}d ago`;

  return new Date(timestamp).toLocaleDateString(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US", { month: "short", day: "numeric" });
}

function createStyles(theme: typeof darkTheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background },
    content: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 118 },
    contentCompact: { paddingHorizontal: 13, paddingTop: 14, paddingBottom: 106 },
    header: { gap: 13, marginBottom: 20 },
    backButton:{width:42,height:42,borderRadius:14,borderWidth:1,borderColor:theme.border,backgroundColor:theme.surface,alignItems:"center",justifyContent:"center"},
    topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14, minHeight: 64 },
    rowRtl: { flexDirection: "row-reverse" },
    arabicText: { writingDirection: "rtl" },
    headingCopy: { flex: 1 },
    eyebrow: { color: theme.accent, fontSize: 9, fontWeight: "900", letterSpacing: 1.3 },
    arabicEyebrow: { letterSpacing: 0, writingDirection: "rtl" },
    title: { color: theme.text, fontSize: 29, lineHeight: 35, fontWeight: "800", marginTop: 4 },
    titleCompact: { fontSize: 26, lineHeight: 31 },
    titleIcon: { width: 46, height: 46, borderRadius: 16, borderWidth: 1, borderColor: "#C9A96244", backgroundColor: "#C9A9620C", alignItems: "center", justifyContent: "center", position: "relative" },
    countBadge: { position: "absolute", right: -5, top: -5, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
    countBadgeRtl: { right: undefined, left: -5 },
    countText: { color: theme.background, fontSize: 8, fontWeight: "900" },
    subtitle: { color: theme.muted, fontSize: 13, lineHeight: 20, maxWidth: 520 },
    summaryCard: { minHeight: 86, flexDirection: "row", alignItems: "stretch", borderWidth: 1, borderColor: "#C9A96226", borderRadius: 20, backgroundColor: "#C9A96206", overflow: "hidden" },
    summaryCardCompact: { minHeight: 78 },
    summaryMetric: { flex: 1, justifyContent: "center", paddingHorizontal: 12, paddingVertical: 12, gap: 3 },
    summaryRtl: { alignItems: "flex-end" },
    summaryDivider: { width: 1, backgroundColor: theme.border, marginVertical: 14 },
    summaryLabel: { color: theme.muted, fontSize: 9, fontWeight: "700" },
    summaryValue: { color: theme.text, fontSize: 20, fontWeight: "800" },
    summaryValueAccent: { color: theme.accent, fontSize: 24, fontWeight: "800" },
    filters: { flexDirection: "row", gap: 8 },
    filter: { minHeight: 42, borderRadius: 999, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center", paddingHorizontal: 14 },
    filterActive: { borderColor: theme.accent, backgroundColor: theme.chip },
    filterText: { color: theme.muted, fontSize: 10, fontWeight: "800" },
    filterTextActive: { color: theme.accent },
    separator: { height: 9 },
    row: { minHeight: 126, borderWidth: 1, borderColor: theme.border, borderRadius: 20, backgroundColor: theme.surface, padding: 15, gap: 9 },
    rowCompact: { minHeight: 116, padding: 13 },
    rowUnread: { borderColor: "#C9A96255", backgroundColor: "#C9A9620A" },
    pressed: { opacity: 0.68 },
    rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
    badges: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
    categoryPill: { minHeight: 25, borderRadius: 999, paddingHorizontal: 9, alignItems: "center", justifyContent: "center", backgroundColor: theme.chip },
    categoryPillUnread: { backgroundColor: "#C9A9621A" },
    category: { color: theme.muted, fontSize: 9, fontWeight: "800" },
    categoryUnread: { color: theme.accent },
    recentPill: { minHeight: 25, borderRadius: 999, paddingHorizontal: 8, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#C9A96235" },
    recentText: { color: theme.accent, fontSize: 8, fontWeight: "800" },
    dateWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
    unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.accent },
    date: { color: theme.muted, fontSize: 9, fontWeight: "700" },
    cardTitle: { color: theme.text, fontSize: 15, lineHeight: 21, fontWeight: "700" },
    cardTitleUnread: { fontWeight: "900" },
    cardTitleCompact: { fontSize: 14, lineHeight: 20 },
    body: { color: theme.muted, fontSize: 12, lineHeight: 19 },
    openRow: { minHeight: 28, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 1 },
    openText: { color: theme.accent, fontSize: 10, fontWeight: "800" },
    openTextMuted: { color: theme.muted },
    openIcon: { width: 26, height: 26, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#C9A96210" },
    iconRtl: { transform: [{ scaleX: -1 }] },
    emptyState: { minHeight: 290, borderWidth: 1, borderColor: theme.border, borderRadius: 22, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, paddingVertical: 30, gap: 9 },
    emptyStateCompact: { minHeight: 250, paddingHorizontal: 20, paddingVertical: 24 },
    emptyIcon: { width: 52, height: 52, borderRadius: 18, borderWidth: 1, borderColor: "#C9A96235", backgroundColor: "#C9A9620A", alignItems: "center", justifyContent: "center", marginBottom: 2 },
    emptyEyebrow: { color: theme.accent, fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
    emptyTitle: { color: theme.text, fontSize: 17, lineHeight: 23, fontWeight: "800", textAlign: "center" },
    emptyBody: { color: theme.muted, fontSize: 12, lineHeight: 19, textAlign: "center", maxWidth: 330 },
    emptyAction: { minHeight: 42, borderRadius: 14, paddingHorizontal: 16, marginTop: 6, backgroundColor: theme.chip, borderWidth: 1, borderColor: "#C9A96235", alignItems: "center", justifyContent: "center" },
    emptyActionText: { color: theme.accent, fontSize: 11, fontWeight: "900" },
    errorCard: { borderWidth: 1, borderColor: "#E2707038", borderRadius: 16, backgroundColor: "#E2707008", padding: 12, gap: 9 },
    error: { color: "#E7A1A1", fontSize: 11, lineHeight: 17 },
    retry: { alignSelf: "flex-start", minHeight: 34, borderRadius: 11, borderWidth: 1, borderColor: theme.border, justifyContent: "center", paddingHorizontal: 12 },
    retryRtl: { alignSelf: "flex-end" },
    retryText: { color: theme.text, fontSize: 10, fontWeight: "800" },
    footerSpace: { height: 12 },
  });
}
