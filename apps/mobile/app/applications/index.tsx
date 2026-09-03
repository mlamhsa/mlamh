import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View, useColorScheme } from "react-native";
import { router } from "expo-router";

import { AppTabBar } from "@/components/AppTabBar";
import { getMyApplications, getNotifications, type MobileApplicationItem, type MobileApplicationStatus } from "@/lib/api";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { darkTheme, lightTheme } from "@/lib/theme";

type Counts = Record<MobileApplicationStatus | "total", number>;
const EMPTY_COUNTS: Counts = { total: 0, pending: 0, reviewing: 0, shortlisted: 0, accepted: 0, rejected: 0 };

export default function ApplicationsScreen() {
  const locale = getDeviceLocale();
  const theme = useColorScheme() === "dark" ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [items, setItems] = useState<MobileApplicationItem[]>([]);
  const [counts, setCounts] = useState<Counts>(EMPTY_COUNTS);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true); setError(null);
    try {
      const [result, notifications] = await Promise.all([getMyApplications(locale), getNotifications().catch(() => null)]);
      if (!result.ok) {
        if (result.code === "UNAUTHENTICATED") { router.replace({ pathname: "/login", params: { next: "/applications" } }); return; }
        setError(locale === "ar" ? "تعذر تحميل طلباتك." : "Unable to load your applications."); return;
      }
      setItems(result.items); setCounts(result.counts); setUnreadCount(notifications?.unreadCount ?? 0);
    } finally { setLoading(false); setRefreshing(false); }
  }, [locale]);

  useEffect(() => { void load(); }, [load]);
  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.accent} /></View>;

  return (
    <View style={styles.screen}>
      <FlatList data={items} keyExtractor={(item) => String(item.id)} contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.accent} />}
        ListHeaderComponent={<View style={[styles.header, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]}><Text style={styles.eyebrow}>MLAMH</Text><Text style={styles.title}>{locale === "ar" ? "طلباتي" : "My applications"}</Text><Text style={styles.subtitle}>{locale === "ar" ? "تابع حالة كل طلب وافتح المحادثة عند قبولك." : "Track every application and open the conversation when accepted."}</Text><View style={styles.statsRow}><Stat label={locale === "ar" ? "الكل" : "All"} value={counts.total} styles={styles} /><Stat label={locale === "ar" ? "مقبول" : "Accepted"} value={counts.accepted} styles={styles} /><Stat label={locale === "ar" ? "قيد المراجعة" : "Reviewing"} value={counts.reviewing + counts.shortlisted} styles={styles} /></View></View>}
        ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyTitle}>{error ?? (locale === "ar" ? "لم تتقدم على أي فرصة بعد." : "You have not applied to any opportunities yet.")}</Text>{!error ? <Pressable style={styles.primaryButton} onPress={() => router.push("/opportunities")}><Text style={styles.primaryButtonText}>{locale === "ar" ? "استكشف الفرص" : "Discover opportunities"}</Text></Pressable> : null}</View>}
        renderItem={({ item }) => <ApplicationCard item={item} locale={locale} styles={styles} />}
      />
      <AppTabBar active="applications" locale={locale} theme={theme} notificationCount={unreadCount} />
    </View>
  );
}

function ApplicationCard({ item, locale, styles }: { item: MobileApplicationItem; locale: "ar" | "en"; styles: ReturnType<typeof createStyles> }) {
  const labels: Record<MobileApplicationStatus, { ar: string; en: string }> = { pending: { ar: "جديد", en: "Pending" }, reviewing: { ar: "قيد المراجعة", en: "Reviewing" }, shortlisted: { ar: "القائمة المختصرة", en: "Shortlisted" }, accepted: { ar: "مقبول", en: "Accepted" }, rejected: { ar: "مرفوض", en: "Rejected" } };
  return <View style={styles.card}><View style={styles.cardTopRow}><Text style={styles.status}>{labels[item.status][locale]}</Text>{item.opportunity?.city ? <Text style={styles.meta}>{item.opportunity.city}</Text> : null}</View><Text style={styles.cardTitle}>{item.opportunity?.title ?? (locale === "ar" ? "فرصة" : "Opportunity")}</Text>{item.opportunity?.opportunityType ? <Text style={styles.meta}>{item.opportunity.opportunityType.replaceAll("_", " ")}</Text> : null}<View style={styles.actionsRow}>{item.opportunity?.slug ? <Pressable style={styles.secondaryButton} onPress={() => router.push(`/opportunities/${item.opportunity?.slug}`)}><Text style={styles.secondaryButtonText}>{locale === "ar" ? "عرض الفرصة" : "View opportunity"}</Text></Pressable> : null}{item.status === "accepted" && item.conversationId ? <Pressable style={styles.primaryButton} onPress={() => router.push(`/conversations/${item.conversationId}`)}><Text style={styles.primaryButtonText}>{locale === "ar" ? "فتح المحادثة" : "Open conversation"}</Text></Pressable> : null}</View></View>;
}
function Stat({ label, value, styles }: { label: string; value: number; styles: ReturnType<typeof createStyles> }) { return <View style={styles.statCard}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
function createStyles(theme: typeof lightTheme | typeof darkTheme) { return StyleSheet.create({ screen: { flex: 1, backgroundColor: theme.background }, centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }, content: { paddingHorizontal: 18, paddingTop: 64, paddingBottom: 24, gap: 14 }, header: { gap: 9, marginBottom: 12 }, eyebrow: { color: theme.accent, fontSize: 12, fontWeight: "700", letterSpacing: 2.2 }, title: { color: theme.text, fontSize: 38, fontWeight: "300" }, subtitle: { color: theme.muted, fontSize: 15, lineHeight: 24 }, statsRow: { flexDirection: "row", gap: 10, marginTop: 12 }, statCard: { flex: 1, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 18, padding: 12 }, statValue: { color: theme.text, fontSize: 24, fontWeight: "400" }, statLabel: { color: theme.muted, fontSize: 10, marginTop: 3 }, card: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 24, padding: 18, gap: 9 }, cardTopRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 }, status: { color: theme.accent, fontSize: 12, fontWeight: "700" }, cardTitle: { color: theme.text, fontSize: 22, lineHeight: 29, fontWeight: "400" }, meta: { color: theme.muted, fontSize: 12 }, actionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 }, primaryButton: { backgroundColor: theme.accent, borderRadius: 15, paddingHorizontal: 16, paddingVertical: 11, alignItems: "center" }, primaryButtonText: { color: "#181818", fontSize: 13, fontWeight: "700" }, secondaryButton: { borderWidth: 1, borderColor: theme.border, borderRadius: 15, paddingHorizontal: 16, paddingVertical: 11, alignItems: "center" }, secondaryButtonText: { color: theme.text, fontSize: 13, fontWeight: "600" }, emptyState: { paddingVertical: 72, alignItems: "center", gap: 18 }, emptyTitle: { color: theme.text, fontSize: 17, textAlign: "center", lineHeight: 25 } }); }
