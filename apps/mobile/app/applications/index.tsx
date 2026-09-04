import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View, useColorScheme } from "react-native";
import { router } from "expo-router";

import { AppTabBar } from "@/components/AppTabBar";
import { getMyApplications, getNotifications, type MobileApplicationItem, type MobileApplicationStatus } from "@/lib/api";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { darkTheme, lightTheme } from "@/lib/theme";

type Counts = Record<MobileApplicationStatus | "total", number>;
type ApplicationFilter = "all" | "active" | "accepted";
const EMPTY_COUNTS: Counts = { total: 0, pending: 0, reviewing: 0, shortlisted: 0, accepted: 0, rejected: 0 };

export default function ApplicationsScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const theme = useColorScheme() === "dark" ? darkTheme : lightTheme;
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

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.accent} /></View>;

  return <View style={styles.screen}>
    <FlatList
      data={filteredItems}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.accent} />}
      ListHeaderComponent={<View style={[styles.header, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]}>
        <View style={styles.topRow}>
          <View><Text style={styles.eyebrow}>MLAMH</Text><Text accessibilityRole="header" style={styles.title}>{isArabic ? "طلباتي" : "My applications"}</Text></View>
          <View style={styles.brandMark}><Text style={styles.brandMarkText}>M</Text></View>
        </View>
        <Text style={styles.subtitle}>{isArabic ? "كل فرصة في مكانها. تابع التقدم وافتح المحادثة فور القبول." : "Keep every opportunity in view. Track progress and open the conversation as soon as you are accepted."}</Text>

        <View style={styles.heroStats}>
          <View style={styles.heroStatPrimary}><Text style={styles.heroStatValue}>{counts.total}</Text><Text style={styles.heroStatLabel}>{isArabic ? "إجمالي الطلبات" : "Total applications"}</Text></View>
          <View style={styles.heroStat}><Text style={styles.heroStatValueSmall}>{counts.reviewing + counts.shortlisted}</Text><Text style={styles.heroStatLabel}>{isArabic ? "قيد التقدم" : "In progress"}</Text></View>
          <View style={styles.heroStat}><Text style={styles.heroStatValueSmall}>{counts.accepted}</Text><Text style={styles.heroStatLabel}>{isArabic ? "مقبول" : "Accepted"}</Text></View>
        </View>

        <View accessibilityRole="tablist" style={styles.filterRow}>
          <FilterTab active={filter === "all"} label={isArabic ? "الكل" : "All"} count={counts.total} onPress={() => setFilter("all")} styles={styles} />
          <FilterTab active={filter === "active"} label={isArabic ? "قيد التقدم" : "In progress"} count={counts.pending + counts.reviewing + counts.shortlisted} onPress={() => setFilter("active")} styles={styles} />
          <FilterTab active={filter === "accepted"} label={isArabic ? "مقبول" : "Accepted"} count={counts.accepted} onPress={() => setFilter("accepted")} styles={styles} />
        </View>
      </View>}
      ListEmptyComponent={<View style={styles.emptyState}>
        <View style={styles.emptyMark}><Text style={styles.emptyMarkText}>M</Text></View>
        <Text style={styles.emptyTitle}>{error ?? (filter === "all" ? (isArabic ? "لم تتقدم على أي فرصة بعد." : "You have not applied to any opportunities yet.") : (isArabic ? "لا توجد طلبات في هذه الحالة." : "No applications in this view."))}</Text>
        <Text style={styles.emptyBody}>{error ? (isArabic ? "يمكنك إعادة المحاولة بدون فقدان أي بيانات." : "You can retry without losing any data.") : (isArabic ? "اكتشف الفرص المناسبة وابدأ أول طلب عندما تكون جاهزًا." : "Discover relevant opportunities and start your first application when you are ready.")}</Text>
        {error ? <Pressable accessibilityRole="button" style={styles.primaryButton} onPress={() => void load()}><Text style={styles.primaryButtonText}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text></Pressable> : filter === "all" ? <Pressable accessibilityRole="button" style={styles.primaryButton} onPress={() => router.push("/opportunities")}><Text style={styles.primaryButtonText}>{isArabic ? "استكشف الفرص" : "Discover opportunities"}</Text></Pressable> : null}
      </View>}
      renderItem={({ item }) => <ApplicationCard item={item} locale={locale} styles={styles} />}
    />
    <AppTabBar active="applications" locale={locale} theme={theme} notificationCount={unreadCount} />
  </View>;
}

function FilterTab({ active, label, count, onPress, styles }: { active: boolean; label: string; count: number; onPress: () => void; styles: ReturnType<typeof createStyles> }) {
  return <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.filterTab, active && styles.filterTabActive]}><Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text><Text style={[styles.filterCount, active && styles.filterCountActive]}>{count}</Text></Pressable>;
}

function ApplicationCard({ item, locale, styles }: { item: MobileApplicationItem; locale: "ar" | "en"; styles: ReturnType<typeof createStyles> }) {
  const isArabic = locale === "ar";
  const labels: Record<MobileApplicationStatus, { ar: string; en: string; step: string }> = {
    pending: { ar: "تم الاستلام", en: "Received", step: "01" },
    reviewing: { ar: "قيد المراجعة", en: "Reviewing", step: "02" },
    shortlisted: { ar: "القائمة المختصرة", en: "Shortlisted", step: "03" },
    accepted: { ar: "تم القبول", en: "Accepted", step: "04" },
    rejected: { ar: "لم يتم الاختيار", en: "Not selected", step: "—" },
  };
  const status = labels[item.status];
  const createdLabel = item.createdAt ? new Date(item.createdAt).toLocaleDateString(isArabic ? "ar-SA" : "en-US", { day: "numeric", month: "short" }) : null;
  return <View style={[styles.card, item.status === "accepted" && styles.cardAccepted]}>
    <View style={styles.cardTop}>
      <View style={styles.statusBlock}><View style={[styles.stepCircle, item.status === "accepted" && styles.stepCircleAccepted]}><Text style={[styles.stepText, item.status === "accepted" && styles.stepTextAccepted]}>{status.step}</Text></View><View><Text style={styles.statusLabel}>{status[locale]}</Text>{createdLabel ? <Text style={styles.dateLabel}>{createdLabel}</Text> : null}</View></View>
      {item.opportunity?.city ? <Text style={styles.cityLabel}>{item.opportunity.city}</Text> : null}
    </View>

    <Text style={styles.cardTitle}>{item.opportunity?.title ?? (isArabic ? "فرصة" : "Opportunity")}</Text>
    <View style={styles.metaRow}>
      {item.opportunity?.opportunityType ? <Text style={styles.metaChip}>{item.opportunity.opportunityType.replaceAll("_", " ")}</Text> : null}
      {item.status === "accepted" ? <Text style={styles.acceptedHint}>{isArabic ? "المحادثة متاحة" : "Conversation unlocked"}</Text> : null}
    </View>

    <View style={styles.actionsRow}>
      {item.opportunity?.slug ? <Pressable accessibilityRole="button" style={styles.secondaryButton} onPress={() => router.push(`/opportunities/${item.opportunity?.slug}`)}><Text style={styles.secondaryButtonText}>{isArabic ? "عرض الفرصة" : "View opportunity"}</Text></Pressable> : null}
      {item.status === "accepted" && item.conversationId ? <Pressable accessibilityRole="button" style={styles.primaryButton} onPress={() => router.push(`/conversations/${item.conversationId}`)}><Text style={styles.primaryButtonText}>{isArabic ? "فتح المحادثة" : "Open conversation"}</Text></Pressable> : null}
    </View>
  </View>;
}

function createStyles(theme: typeof lightTheme | typeof darkTheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background },
    content: { paddingHorizontal: 16, paddingTop: 54, paddingBottom: 28, gap: 12 },
    header: { gap: 16, marginBottom: 8 },
    topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    eyebrow: { color: theme.accent, fontSize: 11, fontWeight: "900", letterSpacing: 2.4 },
    title: { color: theme.text, fontSize: 35, lineHeight: 42, fontWeight: "700", marginTop: 2 },
    brandMark: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: theme.accent, alignItems: "center", justifyContent: "center", backgroundColor: theme.surface },
    brandMarkText: { color: theme.accent, fontSize: 18, fontWeight: "900" },
    subtitle: { color: theme.muted, fontSize: 13, lineHeight: 21, maxWidth: 360 },
    heroStats: { flexDirection: "row", gap: 8 },
    heroStatPrimary: { flex: 1.25, minHeight: 92, borderRadius: 22, backgroundColor: theme.charcoal, borderWidth: 1, borderColor: theme.bronze, padding: 14, justifyContent: "center" },
    heroStat: { flex: 1, minHeight: 92, borderRadius: 22, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, padding: 14, justifyContent: "center" },
    heroStatValue: { color: theme.accent, fontSize: 30, fontWeight: "800" },
    heroStatValueSmall: { color: theme.text, fontSize: 24, fontWeight: "800" },
    heroStatLabel: { color: theme.muted, fontSize: 10, lineHeight: 15, marginTop: 3 },
    filterRow: { flexDirection: "row", alignItems: "center", gap: 6, borderBottomWidth: 1, borderBottomColor: theme.border },
    filterTab: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 11, paddingHorizontal: 4, marginEnd: 8 },
    filterTabActive: { borderBottomWidth: 2, borderBottomColor: theme.accent },
    filterText: { color: theme.muted, fontSize: 11, fontWeight: "700" },
    filterTextActive: { color: theme.text },
    filterCount: { color: theme.muted, fontSize: 9, fontWeight: "800" },
    filterCountActive: { color: theme.accent },
    card: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 22, padding: 16, gap: 11 },
    cardAccepted: { borderColor: theme.accent },
    cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
    statusBlock: { flexDirection: "row", alignItems: "center", gap: 9 },
    stepCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: theme.bronze, backgroundColor: theme.background, alignItems: "center", justifyContent: "center" },
    stepCircleAccepted: { backgroundColor: theme.accent, borderColor: theme.accent },
    stepText: { color: theme.bronze, fontSize: 9, fontWeight: "900" },
    stepTextAccepted: { color: theme.charcoal },
    statusLabel: { color: theme.accent, fontSize: 11, fontWeight: "900" },
    dateLabel: { color: theme.muted, fontSize: 9, marginTop: 2 },
    cityLabel: { color: theme.muted, fontSize: 10 },
    cardTitle: { color: theme.text, fontSize: 20, lineHeight: 27, fontWeight: "750" },
    metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" },
    metaChip: { color: theme.text, backgroundColor: theme.chip, borderRadius: 11, overflow: "hidden", paddingHorizontal: 9, paddingVertical: 5, fontSize: 9, fontWeight: "700" },
    acceptedHint: { color: theme.accent, fontSize: 10, fontWeight: "800" },
    actionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 2 },
    primaryButton: { backgroundColor: theme.accent, borderRadius: 13, minHeight: 42, paddingHorizontal: 15, paddingVertical: 10, alignItems: "center", justifyContent: "center" },
    primaryButtonText: { color: theme.charcoal, fontSize: 12, fontWeight: "900" },
    secondaryButton: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, borderRadius: 13, minHeight: 42, paddingHorizontal: 15, paddingVertical: 10, alignItems: "center", justifyContent: "center" },
    secondaryButtonText: { color: theme.text, fontSize: 12, fontWeight: "700" },
    emptyState: { paddingVertical: 72, alignItems: "center", gap: 12, paddingHorizontal: 24 },
    emptyMark: { width: 54, height: 54, borderRadius: 27, borderWidth: 1, borderColor: theme.accent, alignItems: "center", justifyContent: "center" },
    emptyMarkText: { color: theme.accent, fontSize: 22, fontWeight: "900" },
    emptyTitle: { color: theme.text, fontSize: 17, fontWeight: "800", textAlign: "center", lineHeight: 24 },
    emptyBody: { color: theme.muted, fontSize: 12, lineHeight: 19, textAlign: "center", maxWidth: 300 },
  });
}
