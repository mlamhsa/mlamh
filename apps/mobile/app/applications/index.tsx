import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { AppTabBar } from "@/components/AppTabBar";
import { ScreenSkeleton } from "@/components/ScreenSkeleton";
import { getMyApplications, getNotifications, type MobileApplicationItem, type MobileApplicationStatus } from "@/lib/api";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { darkTheme } from "@/lib/theme";

type Counts = Record<MobileApplicationStatus | "total", number>;
type ApplicationFilter = "all" | "active" | "accepted";
const EMPTY_COUNTS: Counts = { total: 0, pending: 0, reviewing: 0, shortlisted: 0, accepted: 0, rejected: 0 };

export default function ApplicationsScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
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

  if (loading) return <ScreenSkeleton variant="list" locale={locale} />;

  return <View style={styles.screen}>
    <FlatList
      data={filteredItems}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.accent} />}
      ListHeaderComponent={<View style={[styles.header, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]}>
        <Text style={styles.brand}>{isArabic ? "ملامح" : "MLAMH"}</Text>
        <Text accessibilityRole="header" style={[styles.title, { textAlign: isArabic ? "right" : "left" }]}>{isArabic ? "طلباتي" : "My applications"}</Text>
        <Text style={[styles.subtitle, { textAlign: isArabic ? "right" : "left" }]}>{isArabic ? "تابع حالة كل طلب. المحادثة لا تُفتح إلا بعد القبول." : "Track every application. Messaging unlocks only after acceptance."}</Text>

        <View style={styles.statsRow}>
          <Stat value={counts.total} label={isArabic ? "الكل" : "Total"} styles={styles} />
          <Stat value={counts.pending + counts.reviewing + counts.shortlisted} label={isArabic ? "قيد التقدم" : "In progress"} styles={styles} />
          <Stat value={counts.accepted} label={isArabic ? "مقبول" : "Accepted"} styles={styles} accent />
        </View>

        <View accessibilityRole="tablist" style={styles.filterRow}>
          <FilterTab active={filter === "all"} label={isArabic ? "الكل" : "All"} count={counts.total} onPress={() => setFilter("all")} styles={styles} />
          <FilterTab active={filter === "active"} label={isArabic ? "قيد التقدم" : "In progress"} count={counts.pending + counts.reviewing + counts.shortlisted} onPress={() => setFilter("active")} styles={styles} />
          <FilterTab active={filter === "accepted"} label={isArabic ? "مقبول" : "Accepted"} count={counts.accepted} onPress={() => setFilter("accepted")} styles={styles} />
        </View>
      </View>}
      ListEmptyComponent={<View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>{error ?? (filter === "all" ? (isArabic ? "لا توجد طلبات حتى الآن" : "No applications yet") : (isArabic ? "لا توجد طلبات في هذه الحالة" : "No applications in this view"))}</Text>
        <Text style={styles.emptyBody}>{error ? (isArabic ? "أعد المحاولة عند استقرار الاتصال." : "Try again when your connection is stable.") : (isArabic ? "استكشف الفرص المناسبة وابدأ أول طلب من داخل ملامح." : "Discover relevant opportunities and start your first application in MLAMH.")}</Text>
        {error ? <Pressable accessibilityRole="button" style={styles.primaryButton} onPress={() => void load()}><Text style={styles.primaryButtonText}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text></Pressable> : filter === "all" ? <Pressable accessibilityRole="button" style={styles.primaryButton} onPress={() => router.push("/opportunities")}><Text style={styles.primaryButtonText}>{isArabic ? "استكشف الفرص" : "Discover opportunities"}</Text></Pressable> : null}
      </View>}
      renderItem={({ item }) => <ApplicationCard item={item} locale={locale} styles={styles} />}
    />
    <AppTabBar active="applications" locale={locale} theme={theme} notificationCount={unreadCount} />
  </View>;
}

function Stat({ value, label, styles, accent = false }: { value: number; label: string; styles: ReturnType<typeof createStyles>; accent?: boolean }) {
  return <View style={styles.stat}><Text style={[styles.statValue, accent && styles.statValueAccent]}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function FilterTab({ active, label, count, onPress, styles }: { active: boolean; label: string; count: number; onPress: () => void; styles: ReturnType<typeof createStyles> }) {
  return <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.filterTab, active && styles.filterTabActive]}><Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text><Text style={[styles.filterCount, active && styles.filterCountActive]}>{count}</Text></Pressable>;
}

function ApplicationCard({ item, locale, styles }: { item: MobileApplicationItem; locale: "ar" | "en"; styles: ReturnType<typeof createStyles> }) {
  const isArabic = locale === "ar";
  const labels: Record<MobileApplicationStatus, { ar: string; en: string }> = {
    pending: { ar: "تم الاستلام", en: "Received" },
    reviewing: { ar: "قيد المراجعة", en: "Reviewing" },
    shortlisted: { ar: "القائمة المختصرة", en: "Shortlisted" },
    accepted: { ar: "تم القبول", en: "Accepted" },
    rejected: { ar: "لم يتم الاختيار", en: "Not selected" },
  };
  const status = labels[item.status][locale];
  const createdLabel = item.createdAt ? new Date(item.createdAt).toLocaleDateString(isArabic ? "ar-SA-u-nu-latn" : "en-US", { day: "numeric", month: "short" }) : null;
  const accepted = item.status === "accepted";
  return <View style={[styles.card, accepted && styles.cardAccepted]}>
    <View style={styles.cardTop}><Text style={[styles.status, accepted && styles.statusAccepted]}>{status}</Text>{createdLabel ? <Text style={styles.date}>{createdLabel}</Text> : null}</View>
    <Text style={[styles.cardTitle, { textAlign: isArabic ? "right" : "left" }]}>{item.opportunity?.title ?? (isArabic ? "فرصة" : "Opportunity")}</Text>
    <View style={styles.metaRow}>{item.opportunity?.city ? <Text style={styles.meta}>{item.opportunity.city}</Text> : null}{item.opportunity?.opportunityType ? <Text style={styles.meta}>{item.opportunity.opportunityType.replaceAll("_", " ")}</Text> : null}</View>
    {accepted ? <Text style={styles.acceptedHint}>{isArabic ? "تم فتح التواصل بعد القبول" : "Messaging unlocked after acceptance"}</Text> : null}
    <View style={styles.actionsRow}>
      {item.opportunity?.slug ? <Pressable accessibilityRole="button" style={styles.secondaryButton} onPress={() => router.push(`/opportunities/${item.opportunity?.slug}`)}><Text style={styles.secondaryButtonText}>{isArabic ? "عرض الفرصة" : "View opportunity"}</Text></Pressable> : null}
      {accepted && item.conversationId ? <Pressable accessibilityRole="button" style={styles.primaryButton} onPress={() => router.push(`/conversations/${item.conversationId}`)}><Text style={styles.primaryButtonText}>{isArabic ? "فتح المحادثة" : "Open conversation"}</Text></Pressable> : null}
    </View>
  </View>;
}

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, content: { paddingHorizontal: 20, paddingTop: 54, paddingBottom: 30, gap: 12 },
  header: { gap: 12, marginBottom: 8 }, brand: { color: theme.accent, fontSize: 17, fontWeight: "800", letterSpacing: 1.1 }, title: { color: theme.text, fontSize: 31, lineHeight: 38, fontWeight: "700" }, subtitle: { color: theme.muted, fontSize: 13, lineHeight: 20, maxWidth: 420 },
  statsRow: { flexDirection: "row", borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.border, paddingVertical: 14 }, stat: { flex: 1, gap: 3 }, statValue: { color: theme.text, fontSize: 22, fontWeight: "800" }, statValueAccent: { color: theme.accent }, statLabel: { color: theme.muted, fontSize: 10 },
  filterRow: { flexDirection: "row", gap: 18, borderBottomWidth: 1, borderBottomColor: theme.border }, filterTab: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 11 }, filterTabActive: { borderBottomWidth: 2, borderBottomColor: theme.accent }, filterText: { color: theme.muted, fontSize: 11, fontWeight: "700" }, filterTextActive: { color: theme.text }, filterCount: { color: theme.muted, fontSize: 9, fontWeight: "800" }, filterCountActive: { color: theme.accent },
  card: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 16, padding: 16, gap: 10 }, cardAccepted: { borderColor: theme.accent }, cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, status: { color: theme.muted, fontSize: 11, fontWeight: "800" }, statusAccepted: { color: theme.accent }, date: { color: theme.muted, fontSize: 9 }, cardTitle: { color: theme.text, fontSize: 19, lineHeight: 26, fontWeight: "700" }, metaRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" }, meta: { color: theme.muted, fontSize: 10 }, acceptedHint: { color: theme.accent, fontSize: 11, fontWeight: "700" }, actionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 2 },
  primaryButton: { backgroundColor: theme.accent, borderRadius: 12, minHeight: 42, paddingHorizontal: 15, paddingVertical: 10, alignItems: "center", justifyContent: "center" }, primaryButtonText: { color: theme.background, fontSize: 12, fontWeight: "900" }, secondaryButton: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, borderRadius: 12, minHeight: 42, paddingHorizontal: 15, paddingVertical: 10, alignItems: "center", justifyContent: "center" }, secondaryButtonText: { color: theme.text, fontSize: 12, fontWeight: "700" },
  emptyState: { paddingVertical: 72, alignItems: "center", gap: 12, paddingHorizontal: 24 }, emptyTitle: { color: theme.text, fontSize: 17, fontWeight: "800", textAlign: "center", lineHeight: 24 }, emptyBody: { color: theme.muted, fontSize: 12, lineHeight: 19, textAlign: "center", maxWidth: 300 },
}); }
