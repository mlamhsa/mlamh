import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowUpRight, CheckCircle2, Clock3, FileCheck2, MapPin, MessageCircle, SearchX } from "lucide-react-native";

import { AppTabBar } from "@/components/AppTabBar";
import { ScreenSkeleton } from "@/components/ScreenSkeleton";
import { getMyApplications, getNotifications, type MobileApplicationItem, type MobileApplicationStatus } from "@/lib/api";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { getMobileMarketLabel } from "@/lib/market-labels";
import { darkTheme } from "@/lib/theme";

type Counts = Record<MobileApplicationStatus | "total", number>;
type ApplicationFilter = "all" | "active" | "accepted";
const EMPTY_COUNTS: Counts = { total: 0, pending: 0, reviewing: 0, shortlisted: 0, accepted: 0, rejected: 0 };

export default function ApplicationsScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const { width } = useWindowDimensions();
  const compact = width <= 360;
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [items, setItems] = useState<MobileApplicationItem[]>([]);
  const [counts, setCounts] = useState<Counts>(EMPTY_COUNTS);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<ApplicationFilter>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const [result, notifications] = await Promise.all([getMyApplications(locale), getNotifications().catch(() => null)]);
      if (!result.ok) {
        if (result.code === "UNAUTHENTICATED") { router.replace({ pathname: "/login", params: { next: "/applications" } }); return; }
        setError(isArabic ? "تعذر تحميل طلباتك." : "Unable to load your applications.");
        return;
      }
      setItems(result.items);
      setCounts(result.counts);
      setUnreadCount(notifications?.unreadCount ?? 0);
    } catch {
      setError(isArabic ? "تعذر تحميل طلباتك. تحقق من الاتصال وحاول مرة أخرى." : "Unable to load your applications. Check your connection and try again.");
    } finally { setLoading(false); setRefreshing(false); }
  }, [isArabic, locale]);

  useEffect(() => { void load(); }, [load]);
  const filteredItems = useMemo(() => {
    if (filter === "accepted") return items.filter((item) => item.status === "accepted");
    if (filter === "active") return items.filter((item) => ["pending", "reviewing", "shortlisted"].includes(item.status));
    return items;
  }, [filter, items]);

  if (loading) return <ScreenSkeleton variant="list" locale={locale} label={isArabic ? "تحميل طلباتي" : "Loading applications"} />;
  const activeCount = counts.pending + counts.reviewing + counts.shortlisted;
  const submittedToday = items.filter((item) => isToday(item.createdAt)).length;

  return <SafeAreaView style={styles.screen} edges={["top"]}>
    <FlatList
      data={filteredItems}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={[styles.content, compact && styles.contentCompact, { direction: isRtl ? "rtl" : "ltr" }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.accent} />}
      ListHeaderComponent={<View style={styles.header}>
        <Text style={[styles.brand, isArabic && styles.arabicBrand, { textAlign: isRtl ? "right" : "left" }]}>{isArabic ? "ملامح" : "MLAMH"}</Text>
        <Text accessibilityRole="header" style={[styles.title, compact && styles.titleCompact, { textAlign: isRtl ? "right" : "left", writingDirection: isRtl ? "rtl" : "ltr" }]}>{isArabic ? "طلباتي" : "My applications"}</Text>
        <Text style={[styles.subtitle, { textAlign: isRtl ? "right" : "left", writingDirection: isRtl ? "rtl" : "ltr" }]}>{isArabic ? "تابع رحلتك من التقديم حتى القبول والتواصل." : "Follow each opportunity from application to acceptance and messaging."}</Text>
        <View style={[styles.activityNote, isRtl && styles.rowRtl]}><Clock3 size={15} color={theme.accent} strokeWidth={1.8}/><Text style={[styles.activityNoteText, isRtl && styles.arabicText]}>{isArabic ? `${submittedToday} طلب اليوم · ${activeCount} قيد التقدم` : `${submittedToday} today · ${activeCount} in progress`}</Text></View>
        <View style={[styles.statsRow, isRtl && styles.rowRtl]}>
          <Stat icon={FileCheck2} value={counts.total} label={isArabic ? "الكل" : "Total"} styles={styles} compact={compact} />
          <Stat icon={Clock3} value={activeCount} label={isArabic ? "قيد التقدم" : "In progress"} styles={styles} compact={compact} />
          <Stat icon={CheckCircle2} value={counts.accepted} label={isArabic ? "مقبول" : "Accepted"} styles={styles} compact={compact} accent />
        </View>
        <View accessibilityRole="tablist" style={[styles.filterRow, isRtl && styles.rowRtl]}>
          <FilterTab active={filter === "all"} label={isArabic ? "الكل" : "All"} count={counts.total} onPress={() => setFilter("all")} styles={styles} isRtl={isRtl} compact={compact} />
          <FilterTab active={filter === "active"} label={isArabic ? "قيد التقدم" : "In progress"} count={activeCount} onPress={() => setFilter("active")} styles={styles} isRtl={isRtl} compact={compact} />
          <FilterTab active={filter === "accepted"} label={isArabic ? "مقبول" : "Accepted"} count={counts.accepted} onPress={() => setFilter("accepted")} styles={styles} isRtl={isRtl} compact={compact} />
        </View>
      </View>}
      ListEmptyComponent={<View style={[styles.emptyState, compact && styles.emptyStateCompact]}>
        <View style={styles.emptyIcon}><SearchX size={25} color={theme.accent} strokeWidth={1.8} /></View>
        <Text accessibilityRole={error ? "alert" : undefined} style={[styles.emptyTitle, isArabic && styles.arabicText]}>{error ?? (filter === "all" ? (isArabic ? "لا توجد طلبات حتى الآن" : "No applications yet") : (isArabic ? "لا توجد طلبات في هذه الحالة" : "No applications in this view"))}</Text>
        <Text style={[styles.emptyBody, isArabic && styles.arabicText]}>{error ? (isArabic ? "أعد المحاولة عند استقرار الاتصال." : "Try again when your connection is stable.") : (isArabic ? "استكشف الفرص المناسبة وابدأ أول طلب من داخل ملامح." : "Discover a relevant opportunity and start your first application in MLAMH.")}</Text>
        {error ? <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} onPress={() => void load()}><Text style={styles.primaryButtonText}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text></Pressable> : filter === "all" ? <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} onPress={() => router.push("/opportunities")}><Text style={styles.primaryButtonText}>{isArabic ? "استكشف الفرص" : "Discover opportunities"}</Text></Pressable> : null}
      </View>}
      renderItem={({ item }) => <ApplicationCard item={item} locale={locale} styles={styles} compact={compact} />}
      showsVerticalScrollIndicator={false}
    />
    <AppTabBar active="applications" locale={locale} theme={theme} notificationCount={unreadCount} />
  </SafeAreaView>;
}

function Stat({ icon: Icon, value, label, styles, compact, accent = false }: { icon: typeof FileCheck2; value: number; label: string; styles: ReturnType<typeof createStyles>; compact: boolean; accent?: boolean }) {
  return <View style={[styles.stat, compact && styles.statCompact, accent && styles.statAccent]}><Icon size={compact ? 14 : 16} color={accent ? "#C9A962" : "#8F8F89"} strokeWidth={1.8} /><Text style={[styles.statValue, compact && styles.statValueCompact, accent && styles.statValueAccent]}>{value}</Text><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={styles.statLabel}>{label}</Text></View>;
}
function FilterTab({ active, label, count, onPress, styles, isRtl, compact }: { active: boolean; label: string; count: number; onPress: () => void; styles: ReturnType<typeof createStyles>; isRtl: boolean; compact: boolean }) {
  return <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={({ pressed }) => [styles.filterTab, isRtl && styles.rowRtl, compact && styles.filterTabCompact, active && styles.filterTabActive, pressed && styles.pressed]}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[styles.filterText, active && styles.filterTextActive, isRtl && styles.arabicText]}>{label}</Text><View style={[styles.filterBadge, active && styles.filterBadgeActive]}><Text style={[styles.filterCount, active && styles.filterCountActive]}>{count}</Text></View></Pressable>;
}
function ApplicationCard({ item, locale, styles, compact }: { item: MobileApplicationItem; locale: "ar" | "en"; styles: ReturnType<typeof createStyles>; compact: boolean }) {
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const labels: Record<MobileApplicationStatus, { ar: string; en: string }> = {
    pending: { ar: "تم الاستلام", en: "Received" }, reviewing: { ar: "قيد المراجعة", en: "Reviewing" }, shortlisted: { ar: "القائمة المختصرة", en: "Shortlisted" }, accepted: { ar: "تم القبول", en: "Accepted" }, rejected: { ar: "لم يتم الاختيار", en: "Not selected" },
  };
  const status = labels[item.status][locale];
  const createdLabel = item.createdAt ? relativeTime(item.createdAt, locale) : null;
  const accepted = item.status === "accepted";
  const opportunity = item.opportunity as (MobileApplicationItem["opportunity"] & { countryCode?: string | null });
  const marketLabel = getMobileMarketLabel(opportunity?.countryCode, locale);
  const locationLabel = [opportunity?.city, marketLabel].filter(Boolean).join(" · ");
  const hint = statusHint(item.status, locale);
  return <View style={[styles.card, compact && styles.cardCompact, accepted && styles.cardAccepted]}>
    <View style={[styles.cardTop, isRtl && styles.rowRtl]}><View style={[styles.statusPill, accepted && styles.statusPillAccepted]}><Text style={[styles.status, accepted && styles.statusAccepted, isRtl && styles.arabicText]}>{status}</Text></View>{createdLabel ? <Text style={styles.date}>{createdLabel}</Text> : null}</View>
    <Text style={[styles.cardTitle, compact && styles.cardTitleCompact, { textAlign: isRtl ? "right" : "left", writingDirection: isRtl ? "rtl" : "ltr" }]}>{opportunity?.title ?? (isArabic ? "فرصة" : "Opportunity")}</Text>
    {item.status !== "rejected" ? <ApplicationProgress status={item.status} locale={locale} isRtl={isRtl} styles={styles} compact={compact} /> : null}
    <Text style={[styles.statusHint, isRtl && styles.arabicText]}>{hint}</Text>
    <View style={[styles.metaRow, isRtl && styles.rowRtl]}>{locationLabel ? <View style={[styles.metaItem, isRtl && styles.rowRtl]}><MapPin size={13} color="#8F8F89" strokeWidth={1.8} /><Text style={[styles.meta, isRtl && styles.arabicText]}>{locationLabel}</Text></View> : null}{opportunity?.opportunityType ? <Text style={[styles.typeText, isRtl && styles.arabicText]}>{formatOpportunityType(opportunity.opportunityType, isArabic)}</Text> : null}</View>
    {accepted ? <View style={[styles.acceptedBanner, isRtl && styles.rowRtl]}><CheckCircle2 size={15} color="#49C991" strokeWidth={1.9} /><Text style={[styles.acceptedHint, isRtl && styles.arabicText]}>{isArabic ? "تم فتح التواصل بعد القبول" : "Messaging unlocked after acceptance"}</Text></View> : null}
    <View style={[styles.actionsRow, isRtl && styles.rowRtl]}>
      {opportunity?.slug ? <Pressable style={({ pressed }) => [styles.secondaryButton, isRtl && styles.rowRtl, pressed && styles.pressed]} onPress={() => router.push(`/opportunities/${opportunity.slug}`)}><ArrowUpRight size={15} color="#F5F5F0" strokeWidth={1.8} style={isRtl ? styles.iconRtl : undefined} /><Text style={[styles.secondaryButtonText, isRtl && styles.arabicText]}>{isArabic ? "عرض الفرصة" : "View opportunity"}</Text></Pressable> : null}
      {accepted && item.conversationId ? <Pressable style={({ pressed }) => [styles.primaryButton, isRtl && styles.rowRtl, pressed && styles.pressed]} onPress={() => router.push(`/conversations/${item.conversationId}`)}><MessageCircle size={15} color="#050505" strokeWidth={1.9} /><Text style={[styles.primaryButtonText, isRtl && styles.arabicText]}>{isArabic ? "فتح المحادثة" : "Open conversation"}</Text></Pressable> : null}
    </View>
  </View>;
}

function ApplicationProgress({ status, locale, isRtl, styles, compact }: { status: Exclude<MobileApplicationStatus, "rejected">; locale: "ar" | "en"; isRtl: boolean; styles: ReturnType<typeof createStyles>; compact: boolean }) {
  const order: Array<Exclude<MobileApplicationStatus, "rejected">> = ["pending", "reviewing", "shortlisted", "accepted"];
  const labels = locale === "ar" ? ["استلام", "مراجعة", "مختصرة", "قبول"] : ["Received", "Review", "Shortlist", "Accepted"];
  const currentIndex = order.indexOf(status);
  return <View accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: 4, now: currentIndex + 1 }} accessibilityLabel={locale === "ar" ? `مرحلة الطلب: ${labels[currentIndex]}` : `Application stage: ${labels[currentIndex]}`} style={[styles.progressWrap, isRtl && styles.rowRtl]}>
    {order.map((step, index) => {
      const reached = index <= currentIndex;
      const current = index === currentIndex;
      return <View key={step} style={styles.progressSegment}>
        <View style={[styles.progressLineWrap, isRtl && styles.rowRtl]}>
          {index > 0 ? <View style={[styles.progressLine, index <= currentIndex && styles.progressLineReached]} /> : <View style={styles.progressLineSpacer} />}
          <View style={[styles.progressDot, reached && styles.progressDotReached, current && styles.progressDotCurrent]}>{reached && index < currentIndex ? <CheckCircle2 size={compact ? 10 : 11} color={themeColor} strokeWidth={2.2} /> : <View style={[styles.progressDotInner, reached && styles.progressDotInnerReached]} />}</View>
          {index < order.length - 1 ? <View style={[styles.progressLine, index < currentIndex && styles.progressLineReached]} /> : <View style={styles.progressLineSpacer} />}
        </View>
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={[styles.progressLabel, reached && styles.progressLabelReached, current && styles.progressLabelCurrent, isRtl && styles.arabicText]}>{labels[index]}</Text>
      </View>;
    })}
  </View>;
}

const themeColor = "#050505";
function isToday(value: string | null) { if (!value) return false; const date = new Date(value); const now = new Date(); return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate(); }
function relativeTime(value: string, locale: "ar" | "en") { const delta = Date.now() - Date.parse(value); if (!Number.isFinite(delta) || delta < 0) return locale === "ar" ? "الآن" : "Now"; const minutes = Math.floor(delta / 60000); if (minutes < 1) return locale === "ar" ? "الآن" : "Now"; if (minutes < 60) return locale === "ar" ? `منذ ${minutes} د` : `${minutes}m ago`; const hours = Math.floor(minutes / 60); if (hours < 24) return locale === "ar" ? `منذ ${hours} س` : `${hours}h ago`; const days = Math.floor(hours / 24); if (days === 1) return locale === "ar" ? "أمس" : "Yesterday"; if (days < 7) return locale === "ar" ? `منذ ${days} أيام` : `${days}d ago`; return new Date(value).toLocaleDateString(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US", { day: "numeric", month: "short" }); }
function statusHint(status: MobileApplicationStatus, locale: "ar" | "en") { const ar = locale === "ar"; if (status === "pending") return ar ? "تم استلام طلبك وينتظر المراجعة." : "Your application was received and is waiting for review."; if (status === "reviewing") return ar ? "الجهة تراجع طلبك الآن." : "Your application is being reviewed."; if (status === "shortlisted") return ar ? "أنت ضمن القائمة المختصرة — راقب التحديثات." : "You are shortlisted — watch for updates."; if (status === "accepted") return ar ? "تم قبولك ويمكنك الانتقال إلى المحادثة." : "Accepted — you can move to the conversation."; return ar ? "لم يتم الاختيار لهذه الفرصة. استمر في استكشاف فرص أخرى." : "Not selected for this opportunity. Keep exploring other opportunities."; }
function formatOpportunityType(value: string, isArabic: boolean) { const normalized = value.toLowerCase(); if (normalized === "actor") return isArabic ? "تمثيل" : "Actor"; if (normalized === "model") return isArabic ? "مودل" : "Model"; return value.replaceAll("_", " "); }
function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 118, gap: 14 }, contentCompact: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 106 }, rowRtl: { flexDirection: "row-reverse" }, arabicText: { writingDirection: "rtl" }, header: { gap: 11, marginBottom: 12 }, brand: { color: theme.accent, fontSize: 12, fontWeight: "900", letterSpacing: 1.9 }, arabicBrand: { letterSpacing: 0, writingDirection: "rtl" }, title: { color: theme.text, fontSize: 29, lineHeight: 35, fontWeight: "800" }, titleCompact: { fontSize: 26, lineHeight: 31 }, subtitle: { color: theme.muted, fontSize: 13, lineHeight: 20, maxWidth: 420 }, activityNote: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#C9A96233", borderRadius: 14, backgroundColor: "#C9A96208", paddingHorizontal: 11, paddingVertical: 9 }, activityNoteText: { color: theme.text, fontSize: 10, fontWeight: "700" }, statsRow: { flexDirection: "row", gap: 8, marginTop: 2 }, stat: { flex: 1, minHeight: 84, gap: 4, borderWidth: 1, borderColor: theme.border, borderRadius: 18, backgroundColor: theme.surface, paddingHorizontal: 12, paddingVertical: 11, justifyContent: "center" }, statCompact: { minHeight: 74, paddingHorizontal: 8, paddingVertical: 9 }, statAccent: { borderColor: "#C9A96255", backgroundColor: "#C9A96208" }, statValue: { color: theme.text, fontSize: 21, fontWeight: "800" }, statValueCompact: { fontSize: 18 }, statValueAccent: { color: theme.accent }, statLabel: { color: theme.muted, fontSize: 9 }, filterRow: { flexDirection: "row", gap: 8, marginTop: 3 }, filterTab: { flex: 1, minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderWidth: 1, borderColor: theme.border, borderRadius: 999, backgroundColor: theme.surface, paddingHorizontal: 8 }, filterTabCompact: { minHeight: 40, gap: 3, paddingHorizontal: 5 }, filterTabActive: { borderColor: theme.accent, backgroundColor: theme.chip }, filterText: { color: theme.muted, fontSize: 10, fontWeight: "700", flexShrink: 1 }, filterTextActive: { color: theme.accent }, filterBadge: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: theme.chip, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 }, filterBadgeActive: { backgroundColor: "#C9A96222" }, filterCount: { color: theme.muted, fontSize: 8, fontWeight: "800" }, filterCountActive: { color: theme.accent }, card: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 20, padding: 16, gap: 11 }, cardCompact: { padding: 13, gap: 9 }, cardAccepted: { borderColor: "#49C99166", backgroundColor: "#49C99108" }, cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, statusPill: { alignSelf: "flex-start", borderRadius: 999, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 9, paddingVertical: 5 }, statusPillAccepted: { borderColor: "#49C99155", backgroundColor: "#49C99110" }, status: { color: theme.muted, fontSize: 9, fontWeight: "900" }, statusAccepted: { color: "#49C991" }, date: { color: theme.muted, fontSize: 9 }, statusHint: { color: theme.muted, fontSize: 10, lineHeight: 16 }, cardTitle: { color: theme.text, fontSize: 19, lineHeight: 26, fontWeight: "800" }, cardTitleCompact: { fontSize: 17, lineHeight: 23 }, progressWrap: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", borderWidth: 1, borderColor: "#C9A96222", borderRadius: 15, backgroundColor: "#C9A96206", paddingHorizontal: 7, paddingVertical: 10 }, progressSegment: { flex: 1, alignItems: "center", gap: 5 }, progressLineWrap: { width: "100%", flexDirection: "row", alignItems: "center" }, progressLine: { flex: 1, height: 2, backgroundColor: theme.border }, progressLineReached: { backgroundColor: theme.accent }, progressLineSpacer: { flex: 1, height: 2, backgroundColor: "transparent" }, progressDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }, progressDotReached: { borderColor: theme.accent, backgroundColor: theme.accent }, progressDotCurrent: { transform: [{ scale: 1.08 }], shadowColor: "#C9A962", shadowOpacity: 0.28, shadowRadius: 5, shadowOffset: { width: 0, height: 0 }, elevation: 2 }, progressDotInner: { width: 5, height: 5, borderRadius: 3, backgroundColor: theme.muted }, progressDotInnerReached: { backgroundColor: theme.background }, progressLabel: { color: theme.muted, fontSize: 8, fontWeight: "700", textAlign: "center" }, progressLabelReached: { color: theme.text }, progressLabelCurrent: { color: theme.accent, fontWeight: "900" }, metaRow: { flexDirection: "row", gap: 10, flexWrap: "wrap", alignItems: "center" }, metaItem: { flexDirection: "row", alignItems: "center", gap: 5 }, meta: { color: theme.muted, fontSize: 10 }, typeText: { color: theme.accent, fontSize: 9, fontWeight: "800" }, acceptedBanner: { flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 12, backgroundColor: "#49C9910C", paddingHorizontal: 10, paddingVertical: 8 }, acceptedHint: { color: "#49C991", fontSize: 10, fontWeight: "800", flexShrink: 1 }, actionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 1 }, primaryButton: { flexDirection: "row", gap: 7, backgroundColor: theme.accent, borderRadius: 12, minHeight: 44, paddingHorizontal: 14, paddingVertical: 10, alignItems: "center", justifyContent: "center" }, primaryButtonText: { color: theme.background, fontSize: 11, fontWeight: "900" }, secondaryButton: { flexDirection: "row", gap: 7, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, borderRadius: 12, minHeight: 44, paddingHorizontal: 14, paddingVertical: 10, alignItems: "center", justifyContent: "center" }, secondaryButtonText: { color: theme.text, fontSize: 11, fontWeight: "700" }, pressed: { opacity: 0.7 }, iconRtl: { transform: [{ scaleX: -1 }] }, emptyState: { minHeight: 235, borderWidth: 1, borderColor: theme.border, borderRadius: 22, backgroundColor: theme.surface, padding: 25, alignItems: "center", justifyContent: "center", gap: 10 }, emptyStateCompact: { minHeight: 205, padding: 18 }, emptyIcon: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: "#C9A96255", backgroundColor: "#C9A9620A", alignItems: "center", justifyContent: "center" }, emptyTitle: { color: theme.text, fontSize: 17, fontWeight: "800", textAlign: "center", lineHeight: 24 }, emptyBody: { color: theme.muted, fontSize: 12, lineHeight: 19, textAlign: "center", maxWidth: 300 }
}); }
