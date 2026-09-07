import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
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
        if (result.code === "UNAUTHENTICATED") {
          router.replace({ pathname: "/login", params: { next: "/applications" } });
          return;
        }
        setError(isArabic ? "تعذر تحميل طلباتك." : "Unable to load your applications.");
        return;
      }
      setItems(result.items);
      setCounts(result.counts);
      setUnreadCount(notifications?.unreadCount ?? 0);
    } catch {
      setError(isArabic ? "تعذر تحميل طلباتك. تحقق من الاتصال وحاول مرة أخرى." : "Unable to load your applications. Check your connection and try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isArabic, locale]);

  useEffect(() => { void load(); }, [load]);
  const filteredItems = useMemo(() => {
    if (filter === "accepted") return items.filter((item) => item.status === "accepted");
    if (filter === "active") return items.filter((item) => ["pending", "reviewing", "shortlisted"].includes(item.status));
    return items;
  }, [filter, items]);

  if (loading) return <ScreenSkeleton variant="list" locale={locale} label={isArabic ? "تحميل طلباتي" : "Loading applications"} />;
  const activeCount = counts.pending + counts.reviewing + counts.shortlisted;

  return <SafeAreaView style={styles.screen} edges={["top"]}>
    <FlatList
      data={filteredItems}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={[styles.content, { direction: isRtl ? "rtl" : "ltr" }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.accent} />}
      ListHeaderComponent={<View style={styles.header}>
        <Text style={styles.brand}>{isArabic ? "ملامح" : "MLAMH"}</Text>
        <Text accessibilityRole="header" style={[styles.title, { textAlign: isRtl ? "right" : "left" }]}>{isArabic ? "طلباتي" : "My applications"}</Text>
        <Text style={[styles.subtitle, { textAlign: isRtl ? "right" : "left" }]}>{isArabic ? "تابع رحلتك من التقديم حتى القبول والتواصل." : "Follow each opportunity from application to acceptance and messaging."}</Text>
        <View style={[styles.statsRow, isRtl && styles.rowRtl]}>
          <Stat icon={FileCheck2} value={counts.total} label={isArabic ? "الكل" : "Total"} styles={styles} />
          <Stat icon={Clock3} value={activeCount} label={isArabic ? "قيد التقدم" : "In progress"} styles={styles} />
          <Stat icon={CheckCircle2} value={counts.accepted} label={isArabic ? "مقبول" : "Accepted"} styles={styles} accent />
        </View>
        <View accessibilityRole="tablist" style={[styles.filterRow, isRtl && styles.rowRtl]}>
          <FilterTab active={filter === "all"} label={isArabic ? "الكل" : "All"} count={counts.total} onPress={() => setFilter("all")} styles={styles} />
          <FilterTab active={filter === "active"} label={isArabic ? "قيد التقدم" : "In progress"} count={activeCount} onPress={() => setFilter("active")} styles={styles} />
          <FilterTab active={filter === "accepted"} label={isArabic ? "مقبول" : "Accepted"} count={counts.accepted} onPress={() => setFilter("accepted")} styles={styles} />
        </View>
      </View>}
      ListEmptyComponent={<View style={styles.emptyState}>
        <View style={styles.emptyIcon}><SearchX size={25} color={theme.accent} strokeWidth={1.8} /></View>
        <Text accessibilityRole={error ? "alert" : undefined} style={styles.emptyTitle}>{error ?? (filter === "all" ? (isArabic ? "لا توجد طلبات حتى الآن" : "No applications yet") : (isArabic ? "لا توجد طلبات في هذه الحالة" : "No applications in this view"))}</Text>
        <Text style={styles.emptyBody}>{error ? (isArabic ? "أعد المحاولة عند استقرار الاتصال." : "Try again when your connection is stable.") : (isArabic ? "استكشف الفرص المناسبة وابدأ أول طلب من داخل ملامح." : "Discover a relevant opportunity and start your first application in MLAMH.")}</Text>
        {error ? <Pressable style={styles.primaryButton} onPress={() => void load()}><Text style={styles.primaryButtonText}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text></Pressable> : filter === "all" ? <Pressable style={styles.primaryButton} onPress={() => router.push("/opportunities")}><Text style={styles.primaryButtonText}>{isArabic ? "استكشف الفرص" : "Discover opportunities"}</Text></Pressable> : null}
      </View>}
      renderItem={({ item }) => <ApplicationCard item={item} locale={locale} styles={styles} />}
      showsVerticalScrollIndicator={false}
    />
    <AppTabBar active="applications" locale={locale} theme={theme} notificationCount={unreadCount} />
  </SafeAreaView>;
}

function Stat({ icon: Icon, value, label, styles, accent = false }: { icon: typeof FileCheck2; value: number; label: string; styles: ReturnType<typeof createStyles>; accent?: boolean }) {
  return <View style={[styles.stat, accent && styles.statAccent]}><Icon size={16} color={accent ? "#C9A962" : "#8F8F89"} strokeWidth={1.8} /><Text style={[styles.statValue, accent && styles.statValueAccent]}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}
function FilterTab({ active, label, count, onPress, styles }: { active: boolean; label: string; count: number; onPress: () => void; styles: ReturnType<typeof createStyles> }) {
  return <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.filterTab, active && styles.filterTabActive]}><Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text><View style={[styles.filterBadge, active && styles.filterBadgeActive]}><Text style={[styles.filterCount, active && styles.filterCountActive]}>{count}</Text></View></Pressable>;
}
function ApplicationCard({ item, locale, styles }: { item: MobileApplicationItem; locale: "ar" | "en"; styles: ReturnType<typeof createStyles> }) {
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const labels: Record<MobileApplicationStatus, { ar: string; en: string }> = {
    pending: { ar: "تم الاستلام", en: "Received" }, reviewing: { ar: "قيد المراجعة", en: "Reviewing" }, shortlisted: { ar: "القائمة المختصرة", en: "Shortlisted" }, accepted: { ar: "تم القبول", en: "Accepted" }, rejected: { ar: "لم يتم الاختيار", en: "Not selected" },
  };
  const status = labels[item.status][locale];
  const createdLabel = item.createdAt ? new Date(item.createdAt).toLocaleDateString(isArabic ? "ar-SA-u-nu-latn" : "en-US", { day: "numeric", month: "short" }) : null;
  const accepted = item.status === "accepted";
  const opportunity = item.opportunity as (MobileApplicationItem["opportunity"] & { countryCode?: string | null });
  const marketLabel = getMobileMarketLabel(opportunity?.countryCode, locale);
  const locationLabel = [opportunity?.city, marketLabel].filter(Boolean).join(" · ");
  return <View style={[styles.card, accepted && styles.cardAccepted]}>
    <View style={[styles.cardTop, isRtl && styles.rowRtl]}><View style={[styles.statusPill, accepted && styles.statusPillAccepted]}><Text style={[styles.status, accepted && styles.statusAccepted]}>{status}</Text></View>{createdLabel ? <Text style={styles.date}>{createdLabel}</Text> : null}</View>
    <Text style={[styles.cardTitle, { textAlign: isRtl ? "right" : "left" }]}>{opportunity?.title ?? (isArabic ? "فرصة" : "Opportunity")}</Text>
    <View style={[styles.metaRow, isRtl && styles.rowRtl]}>{locationLabel ? <View style={styles.metaItem}><MapPin size={13} color="#8F8F89" strokeWidth={1.8} /><Text style={styles.meta}>{locationLabel}</Text></View> : null}{opportunity?.opportunityType ? <Text style={styles.typeText}>{formatOpportunityType(opportunity.opportunityType, isArabic)}</Text> : null}</View>
    {accepted ? <View style={[styles.acceptedBanner, isRtl && styles.rowRtl]}><CheckCircle2 size={15} color="#49C991" strokeWidth={1.9} /><Text style={styles.acceptedHint}>{isArabic ? "تم فتح التواصل بعد القبول" : "Messaging unlocked after acceptance"}</Text></View> : null}
    <View style={[styles.actionsRow, isRtl && styles.rowRtl]}>
      {opportunity?.slug ? <Pressable style={styles.secondaryButton} onPress={() => router.push(`/opportunities/${opportunity.slug}`)}><ArrowUpRight size={15} color="#F5F5F0" strokeWidth={1.8} /><Text style={styles.secondaryButtonText}>{isArabic ? "عرض الفرصة" : "View opportunity"}</Text></Pressable> : null}
      {accepted && item.conversationId ? <Pressable style={styles.primaryButton} onPress={() => router.push(`/conversations/${item.conversationId}`)}><MessageCircle size={15} color="#050505" strokeWidth={1.9} /><Text style={styles.primaryButtonText}>{isArabic ? "فتح المحادثة" : "Open conversation"}</Text></Pressable> : null}
    </View>
  </View>;
}
function formatOpportunityType(value: string, isArabic: boolean) { const normalized = value.toLowerCase(); if (normalized === "actor") return isArabic ? "تمثيل" : "Actor"; if (normalized === "model") return isArabic ? "مودل" : "Model"; return value.replaceAll("_", " "); }
function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30, gap: 12 }, rowRtl: { flexDirection: "row-reverse" }, header: { gap: 11, marginBottom: 8 }, brand: { color: theme.accent, fontSize: 12, fontWeight: "900", letterSpacing: 1.9 }, title: { color: theme.text, fontSize: 29, lineHeight: 35, fontWeight: "800" }, subtitle: { color: theme.muted, fontSize: 13, lineHeight: 20, maxWidth: 420 }, statsRow: { flexDirection: "row", gap: 8, marginTop: 3 }, stat: { flex: 1, minHeight: 82, gap: 4, borderWidth: 1, borderColor: theme.border, borderRadius: 17, backgroundColor: theme.surface, paddingHorizontal: 12, paddingVertical: 11, justifyContent: "center" }, statAccent: { borderColor: "#C9A96255", backgroundColor: "#C9A96208" }, statValue: { color: theme.text, fontSize: 21, fontWeight: "800" }, statValueAccent: { color: theme.accent }, statLabel: { color: theme.muted, fontSize: 9 }, filterRow: { flexDirection: "row", gap: 8, marginTop: 2 }, filterTab: { flex: 1, minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderWidth: 1, borderColor: theme.border, borderRadius: 999, backgroundColor: theme.surface, paddingHorizontal: 8 }, filterTabActive: { borderColor: theme.accent, backgroundColor: theme.chip }, filterText: { color: theme.muted, fontSize: 10, fontWeight: "700" }, filterTextActive: { color: theme.accent }, filterBadge: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: theme.chip, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 }, filterBadgeActive: { backgroundColor: "#C9A96222" }, filterCount: { color: theme.muted, fontSize: 8, fontWeight: "800" }, filterCountActive: { color: theme.accent }, card: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 20, padding: 16, gap: 11 }, cardAccepted: { borderColor: "#49C99166", backgroundColor: "#49C99108" }, cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, statusPill: { alignSelf: "flex-start", borderRadius: 999, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 9, paddingVertical: 5 }, statusPillAccepted: { borderColor: "#49C99155", backgroundColor: "#49C99110" }, status: { color: theme.muted, fontSize: 9, fontWeight: "900" }, statusAccepted: { color: "#49C991" }, date: { color: theme.muted, fontSize: 9 }, cardTitle: { color: theme.text, fontSize: 19, lineHeight: 26, fontWeight: "800" }, metaRow: { flexDirection: "row", gap: 10, flexWrap: "wrap", alignItems: "center" }, metaItem: { flexDirection: "row", alignItems: "center", gap: 5 }, meta: { color: theme.muted, fontSize: 10 }, typeText: { color: theme.accent, fontSize: 9, fontWeight: "800" }, acceptedBanner: { flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 12, backgroundColor: "#49C9910C", paddingHorizontal: 10, paddingVertical: 8 }, acceptedHint: { color: "#49C991", fontSize: 10, fontWeight: "800" }, actionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 1 }, primaryButton: { flexDirection: "row", gap: 7, backgroundColor: theme.accent, borderRadius: 12, minHeight: 44, paddingHorizontal: 14, paddingVertical: 10, alignItems: "center", justifyContent: "center" }, primaryButtonText: { color: theme.background, fontSize: 11, fontWeight: "900" }, secondaryButton: { flexDirection: "row", gap: 7, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, borderRadius: 12, minHeight: 44, paddingHorizontal: 14, paddingVertical: 10, alignItems: "center", justifyContent: "center" }, secondaryButtonText: { color: theme.text, fontSize: 11, fontWeight: "700" }, emptyState: { minHeight: 235, borderWidth: 1, borderColor: theme.border, borderRadius: 22, backgroundColor: theme.surface, padding: 25, alignItems: "center", justifyContent: "center", gap: 10 }, emptyIcon: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: "#C9A96255", backgroundColor: "#C9A9620A", alignItems: "center", justifyContent: "center" }, emptyTitle: { color: theme.text, fontSize: 17, fontWeight: "800", textAlign: "center", lineHeight: 24 }, emptyBody: { color: theme.muted, fontSize: 12, lineHeight: 19, textAlign: "center", maxWidth: 300 }
}); }