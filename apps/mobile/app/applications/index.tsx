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

  return <View style={styles.screen}>
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.accent} />}
      ListHeaderComponent={<View style={[styles.header, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]}>
        <View style={styles.topRow}><Text style={styles.brand}>MLAMH</Text><Text style={styles.headerIcon}>◌</Text></View>
        <Text style={styles.title}>{locale === "ar" ? "طلباتي" : "My applications"}</Text>
        <Text style={styles.subtitle}>{locale === "ar" ? "تابع حالة طلباتك، وعند القبول افتح المحادثة مباشرة." : "Track your applications and open the conversation as soon as you are accepted."}</Text>
        <View style={styles.statsRow}><Stat label={locale === "ar" ? "الكل" : "All"} value={counts.total} styles={styles} /><Stat label={locale === "ar" ? "مقبول" : "Accepted"} value={counts.accepted} styles={styles} /><Stat label={locale === "ar" ? "مراجعة" : "Reviewing"} value={counts.reviewing + counts.shortlisted} styles={styles} /></View>
        <View style={styles.sectionRow}><Text style={styles.sectionTitle}>{locale === "ar" ? "الطلبات" : "Applications"}</Text><Text style={styles.sectionCount}>{counts.total}</Text></View>
      </View>}
      ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyTitle}>{error ?? (locale === "ar" ? "لم تتقدم على أي فرصة بعد." : "You have not applied to any opportunities yet.")}</Text>{!error ? <Pressable style={styles.primaryButton} onPress={() => router.push("/opportunities")}><Text style={styles.primaryButtonText}>{locale === "ar" ? "استكشف الفرص" : "Discover opportunities"}</Text></Pressable> : null}</View>}
      renderItem={({ item }) => <ApplicationCard item={item} locale={locale} styles={styles} />}
    />
    <AppTabBar active="applications" locale={locale} theme={theme} notificationCount={unreadCount} />
  </View>;
}

function ApplicationCard({ item, locale, styles }: { item: MobileApplicationItem; locale: "ar" | "en"; styles: ReturnType<typeof createStyles> }) {
  const labels: Record<MobileApplicationStatus, { ar: string; en: string }> = {
    pending: { ar: "جديد", en: "Pending" }, reviewing: { ar: "قيد المراجعة", en: "Reviewing" }, shortlisted: { ar: "القائمة المختصرة", en: "Shortlisted" }, accepted: { ar: "مقبول", en: "Accepted" }, rejected: { ar: "مرفوض", en: "Rejected" },
  };
  return <View style={styles.card}>
    <View style={styles.statusRow}><View style={[styles.statusDot, item.status === "accepted" && styles.statusDotAccepted]} /><Text style={styles.status}>{labels[item.status][locale]}</Text><Text style={styles.meta}>{item.opportunity?.city ?? ""}</Text></View>
    <Text style={styles.cardTitle}>{item.opportunity?.title ?? (locale === "ar" ? "فرصة" : "Opportunity")}</Text>
    {item.opportunity?.opportunityType ? <Text style={styles.meta}>{item.opportunity.opportunityType.replaceAll("_", " ")}</Text> : null}
    <View style={styles.actionsRow}>
      {item.opportunity?.slug ? <Pressable style={styles.secondaryButton} onPress={() => router.push(`/opportunities/${item.opportunity?.slug}`)}><Text style={styles.secondaryButtonText}>{locale === "ar" ? "عرض الفرصة" : "View opportunity"}</Text></Pressable> : null}
      {item.status === "accepted" && item.conversationId ? <Pressable style={styles.primaryButton} onPress={() => router.push(`/conversations/${item.conversationId}`)}><Text style={styles.primaryButtonText}>{locale === "ar" ? "فتح المحادثة" : "Open conversation"}</Text></Pressable> : null}
    </View>
  </View>;
}

function Stat({ label, value, styles }: { label: string; value: number; styles: ReturnType<typeof createStyles> }) { return <View style={styles.statCard}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }

function createStyles(theme: typeof lightTheme | typeof darkTheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background }, centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background },
    content: { paddingHorizontal: 16, paddingTop: 54, paddingBottom: 24, gap: 10 }, header: { gap: 10, marginBottom: 6 },
    topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, brand: { color: theme.accent, fontSize: 14, fontWeight: "900", letterSpacing: 2.2 }, headerIcon: { color: theme.text, fontSize: 24 },
    title: { color: theme.text, fontSize: 32, fontWeight: "800" }, subtitle: { color: theme.muted, fontSize: 14, lineHeight: 22 },
    statsRow: { flexDirection: "row", gap: 8, marginTop: 8 }, statCard: { flex: 1, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 16, padding: 11, alignItems: "center" }, statValue: { color: theme.text, fontSize: 22, fontWeight: "800" }, statLabel: { color: theme.muted, fontSize: 10, marginTop: 2 },
    sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }, sectionTitle: { color: theme.text, fontSize: 18, fontWeight: "800" }, sectionCount: { color: theme.accent, fontSize: 13, fontWeight: "800" },
    card: { backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border, paddingVertical: 16, paddingHorizontal: 4, gap: 8 }, statusRow: { flexDirection: "row", alignItems: "center", gap: 7 }, statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#8C6A2D" }, statusDotAccepted: { backgroundColor: "#D4A017" }, status: { color: theme.accent, fontSize: 12, fontWeight: "800" }, cardTitle: { color: theme.text, fontSize: 20, lineHeight: 27, fontWeight: "700" }, meta: { color: theme.muted, fontSize: 12, marginStart: "auto" },
    actionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 5 }, primaryButton: { backgroundColor: theme.accent, borderRadius: 13, paddingHorizontal: 15, paddingVertical: 10, alignItems: "center" }, primaryButtonText: { color: "#2E2E2E", fontSize: 12, fontWeight: "900" }, secondaryButton: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, borderRadius: 13, paddingHorizontal: 15, paddingVertical: 10, alignItems: "center" }, secondaryButtonText: { color: theme.text, fontSize: 12, fontWeight: "700" },
    emptyState: { paddingVertical: 72, alignItems: "center", gap: 18 }, emptyTitle: { color: theme.text, fontSize: 16, textAlign: "center", lineHeight: 24 },
  });
}
