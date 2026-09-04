import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View, useColorScheme } from "react-native";
import { router } from "expo-router";

import { PublisherTabBar } from "@/components/PublisherTabBar";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { getPublisherConversations, getPublisherDashboard, type MobilePublisherDashboard, type MobilePublisherOpportunity } from "@/lib/publisher-api";
import { signOutMobile } from "@/lib/push";
import { darkTheme, lightTheme } from "@/lib/theme";

export default function PublisherDashboardScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const theme = useColorScheme() === "dark" ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [data, setData] = useState<MobilePublisherDashboard | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true); setError(null);
    try {
      const [result, conversations] = await Promise.all([getPublisherDashboard(locale), getPublisherConversations().catch(() => null)]);
      if (!result) setError(isArabic ? "تعذر تحميل لوحة الجهة." : "Unable to load publisher dashboard."); else setData(result);
      setUnreadCount(conversations?.unreadCount ?? 0);
    } finally { setLoading(false); setRefreshing(false); }
  }, [isArabic, locale]);

  useEffect(() => { void load(); }, [load]);
  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.accent} /></View>;

  return <View style={styles.screen}><FlatList
    data={data?.opportunities ?? []}
    keyExtractor={(item) => String(item.id)}
    contentContainerStyle={[styles.content, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.accent} />}
    ListHeaderComponent={<>
      <View style={styles.topBar}><View><Text style={styles.eyebrow}>MLAMH</Text><Text style={styles.title}>{isArabic ? "لوحة الجهة" : "Publisher"}</Text></View><Pressable style={styles.addButton} onPress={() => router.push("/publisher/opportunities/new")} accessibilityRole="button" accessibilityLabel={isArabic ? "إضافة فرصة" : "Add opportunity"}><Text style={styles.addButtonText}>＋</Text></Pressable></View>
      {data ? <>
        <View style={styles.identityCard}><View style={styles.identityLeft}><View style={styles.logoCircle}><Text style={styles.logoText}>{data.publisher.name.slice(0, 1)}</Text></View><View><Text style={styles.identityName}>{data.publisher.name}</Text><Text style={styles.meta}>{[data.publisher.city, data.publisher.countryCode].filter(Boolean).join(" · ")}</Text></View></View><Text style={[styles.statusPill, data.publisher.approvalStatus === "approved" && styles.statusApproved]}>{data.publisher.approvalStatus === "approved" ? (isArabic ? "معتمد" : "Approved") : (isArabic ? "قيد المراجعة" : "In review")}</Text></View>
        <View style={styles.metrics}><Metric value={data.metrics.opportunities} label={isArabic ? "الفرص" : "Opportunities"} styles={styles} /><Metric value={data.metrics.applications} label={isArabic ? "الطلبات" : "Applications"} styles={styles} /><Metric value={data.metrics.accepted} label={isArabic ? "المقبولين" : "Accepted"} styles={styles} /></View>
      </> : null}
      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{isArabic ? "الفرص" : "Opportunities"}</Text><Text style={styles.sectionHint}>{data?.opportunities.length ?? 0}</Text></View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </>}
    ListEmptyComponent={!error ? <View style={styles.empty}><View style={styles.emptyIcon}><Text style={styles.emptyIconText}>＋</Text></View><Text style={styles.emptyTitle}>{isArabic ? "أنشئ أول فرصة" : "Create your first opportunity"}</Text><Text style={styles.meta}>{isArabic ? "انشر Brief واضحًا واستقبل طلبات المواهب من ملامح." : "Publish a clear brief and receive talent applications through MLAMH."}</Text><Pressable style={styles.primaryButton} onPress={() => router.push("/publisher/opportunities/new")}><Text style={styles.primaryButtonText}>{isArabic ? "فرصة جديدة" : "New opportunity"}</Text></Pressable></View> : null}
    renderItem={({ item }) => <OpportunityRow item={item} locale={locale} styles={styles} />}
    ListFooterComponent={<Pressable style={styles.signOut} onPress={() => void signOutMobile().then(() => router.replace("/"))} accessibilityRole="button"><Text style={styles.signOutText}>{isArabic ? "تسجيل الخروج" : "Sign out"}</Text></Pressable>}
  /><PublisherTabBar active="dashboard" locale={locale} theme={theme} unreadCount={unreadCount} /></View>;
}

function Metric({ value, label, styles }: { value: number; label: string; styles: ReturnType<typeof createStyles> }) { return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>; }
function OpportunityRow({ item, locale, styles }: { item: MobilePublisherOpportunity; locale: "ar" | "en"; styles: ReturnType<typeof createStyles> }) { return <Pressable style={({ pressed }) => [styles.opportunityCard, pressed && styles.pressed]} onPress={() => router.push(`/publisher/opportunities/${item.id}`)} accessibilityRole="button"><View style={styles.rowTop}><View style={styles.opportunityText}><Text style={styles.opportunityTitle}>{item.title}</Text><Text style={styles.meta}>{locale === "ar" ? `${item.applications} طلب · ${item.accepted} مقبول` : `${item.applications} applications · ${item.accepted} accepted`}</Text></View><Text style={styles.published}>{opportunityStatusLabel(item.status, item.published, locale)}</Text></View></Pressable>; }
function opportunityStatusLabel(status: string | null, published: boolean, locale: "ar" | "en") {
  const ar: Record<string,string> = { draft: "مسودة", open: "مسودة", pending_review: "قيد المراجعة", needs_changes: "تحتاج تعديل", published: "منشورة", closed: "مغلقة", rejected: "مرفوضة", archived: "مؤرشفة" };
  const en: Record<string,string> = { draft: "Draft", open: "Draft", pending_review: "In review", needs_changes: "Needs changes", published: "Published", closed: "Closed", rejected: "Rejected", archived: "Archived" };
  const value = status ? (locale === "ar" ? ar : en)[status] : null;
  return value ?? (published ? (locale === "ar" ? "منشورة" : "Published") : (locale === "ar" ? "مسودة" : "Draft"));
}
function createStyles(theme: typeof lightTheme | typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }, content: { paddingHorizontal: 16, paddingTop: 54, paddingBottom: 30, gap: 13 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }, eyebrow: { color: theme.accent, fontSize: 11, fontWeight: "900", letterSpacing: 2.1 }, title: { color: theme.text, fontSize: 31, fontWeight: "800", marginTop: 2 }, addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" }, addButtonText: { color: "#2E2E2E", fontSize: 27, lineHeight: 28, fontWeight: "500" },
  identityCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, padding: 15, borderWidth: 1, borderColor: theme.border, borderRadius: 22, backgroundColor: theme.surface }, identityLeft: { flexDirection: "row", alignItems: "center", gap: 11, flex: 1 }, logoCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor: theme.background, borderWidth: 1, borderColor: theme.accent, alignItems: "center", justifyContent: "center" }, logoText: { color: theme.accent, fontSize: 21, fontWeight: "900" }, identityName: { color: theme.text, fontSize: 18, fontWeight: "800" },
  statusPill: { color: theme.muted, borderWidth: 1, borderColor: theme.border, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6, fontSize: 10 }, statusApproved: { color: "#2E2E2E", backgroundColor: theme.accent, borderColor: theme.accent }, metrics: { flexDirection: "row", gap: 8 }, metric: { flex: 1, padding: 13, borderWidth: 1, borderColor: theme.border, borderRadius: 18, backgroundColor: theme.surface }, metricValue: { color: theme.text, fontSize: 25, fontWeight: "800" }, metricLabel: { color: theme.muted, fontSize: 9, marginTop: 4 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 }, sectionTitle: { color: theme.text, fontSize: 20, fontWeight: "800" }, sectionHint: { color: theme.accent, fontSize: 12, fontWeight: "800" }, opportunityCard: { padding: 16, borderWidth: 1, borderColor: theme.border, borderRadius: 20, backgroundColor: theme.surface }, pressed: { opacity: 0.72 }, rowTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }, opportunityText: { flex: 1, gap: 5 }, opportunityTitle: { color: theme.text, fontSize: 17, lineHeight: 23, fontWeight: "800" }, published: { color: theme.accent, fontSize: 10, fontWeight: "800" }, meta: { color: theme.muted, fontSize: 11, lineHeight: 18 },
  empty: { minHeight: 220, alignItems: "center", justifyContent: "center", gap: 9, borderWidth: 1, borderStyle: "dashed", borderColor: theme.border, borderRadius: 24, padding: 22 }, emptyIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" }, emptyIconText: { color: "#2E2E2E", fontSize: 28 }, emptyTitle: { color: theme.text, fontSize: 18, fontWeight: "800" }, primaryButton: { marginTop: 6, backgroundColor: theme.accent, borderRadius: 15, paddingHorizontal: 18, paddingVertical: 12 }, primaryButtonText: { color: "#2E2E2E", fontSize: 12, fontWeight: "900" }, error: { color: "#C84F4F", fontSize: 13 }, signOut: { marginTop: 24, borderWidth: 1, borderColor: "rgba(200,79,79,0.45)", borderRadius: 17, paddingVertical: 13, alignItems: "center" }, signOutText: { color: "#C84F4F", fontSize: 13, fontWeight: "800" }
}); }
