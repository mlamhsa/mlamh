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
  const theme = useColorScheme() === "dark" ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [data, setData] = useState<MobilePublisherDashboard | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true); setError(null);
    const [result, conversations] = await Promise.all([getPublisherDashboard(locale), getPublisherConversations().catch(() => null)]);
    if (!result) setError(locale === "ar" ? "تعذر تحميل لوحة الجهة." : "Unable to load publisher dashboard."); else setData(result);
    setUnreadCount(conversations?.unreadCount ?? 0); setLoading(false); setRefreshing(false);
  }, [locale]);

  useEffect(() => { void load(); }, [load]);
  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.accent} /></View>;

  return <View style={styles.screen}><FlatList
    data={data?.opportunities ?? []}
    keyExtractor={(item) => String(item.id)}
    contentContainerStyle={[styles.content, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.accent} />}
    ListHeaderComponent={<>
      <View style={styles.header}><Text style={styles.eyebrow}>MLAMH</Text><Text style={styles.title}>{locale === "ar" ? "لوحة الجهة" : "Publisher dashboard"}</Text><Text style={styles.subtitle}>{data?.publisher.name ?? "MLAMH"}</Text></View>
      {data ? <><View style={styles.identityCard}><View><Text style={styles.identityName}>{data.publisher.name}</Text><Text style={styles.meta}>{[data.publisher.city, data.publisher.countryCode].filter(Boolean).join(" · ")}</Text></View><Text style={[styles.statusPill, data.publisher.approvalStatus === "approved" && styles.statusApproved]}>{data.publisher.approvalStatus === "approved" ? (locale === "ar" ? "معتمد" : "Approved") : (locale === "ar" ? "قيد المراجعة" : "In review")}</Text></View><View style={styles.metrics}><Metric value={data.metrics.opportunities} label={locale === "ar" ? "الفرص" : "Opportunities"} styles={styles} /><Metric value={data.metrics.applications} label={locale === "ar" ? "الطلبات" : "Applications"} styles={styles} /><Metric value={data.metrics.accepted} label={locale === "ar" ? "المقبولين" : "Accepted"} styles={styles} /></View></> : null}
      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{locale === "ar" ? "فرصك" : "Your opportunities"}</Text><Pressable style={styles.createButton} onPress={() => router.push("/publisher/opportunities/new")}><Text style={styles.createButtonText}>{locale === "ar" ? "+ فرصة جديدة" : "+ New opportunity"}</Text></Pressable></View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </>}
    ListEmptyComponent={!error ? <View style={styles.empty}><Text style={styles.emptyTitle}>{locale === "ar" ? "لم تنشر أي فرصة بعد." : "No opportunities yet."}</Text><Text style={styles.meta}>{locale === "ar" ? "ابدأ بإنشاء أول فرصة من التطبيق." : "Create your first opportunity from the app."}</Text></View> : null}
    renderItem={({ item }) => <OpportunityRow item={item} locale={locale} styles={styles} />}
    ListFooterComponent={<Pressable style={styles.signOut} onPress={() => void signOutMobile().then(() => router.replace("/"))}><Text style={styles.signOutText}>{locale === "ar" ? "تسجيل الخروج" : "Sign out"}</Text></Pressable>}
  /><PublisherTabBar active="dashboard" locale={locale} theme={theme} unreadCount={unreadCount} /></View>;
}

function Metric({ value, label, styles }: { value: number; label: string; styles: ReturnType<typeof createStyles> }) { return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>; }
function OpportunityRow({ item, locale, styles }: { item: MobilePublisherOpportunity; locale: "ar" | "en"; styles: ReturnType<typeof createStyles> }) { return <Pressable style={styles.opportunityCard} onPress={() => router.push(`/publisher/opportunities/${item.id}`)}><View style={styles.rowTop}><Text style={styles.opportunityTitle}>{item.title}</Text><Text style={styles.published}>{item.published ? (locale === "ar" ? "منشورة" : "Published") : (locale === "ar" ? "مسودة" : "Draft")}</Text></View><View style={styles.rowStats}><Text style={styles.meta}>{locale === "ar" ? `${item.applications} طلب` : `${item.applications} applications`}</Text><Text style={styles.meta}>{locale === "ar" ? `${item.accepted} مقبول` : `${item.accepted} accepted`}</Text></View></Pressable>; }
function createStyles(theme: typeof lightTheme | typeof darkTheme) { return StyleSheet.create({ screen: { flex: 1, backgroundColor: theme.background }, centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }, content: { paddingHorizontal: 18, paddingTop: 60, paddingBottom: 32, gap: 14 }, header: { gap: 7, marginBottom: 4 }, eyebrow: { color: theme.accent, fontSize: 12, fontWeight: "800", letterSpacing: 2.2 }, title: { color: theme.text, fontSize: 36, fontWeight: "300" }, subtitle: { color: theme.muted, fontSize: 14 }, identityCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, padding: 18, borderWidth: 1, borderColor: theme.border, borderRadius: 24, backgroundColor: theme.surface }, identityName: { color: theme.text, fontSize: 20, fontWeight: "600" }, statusPill: { color: theme.muted, borderWidth: 1, borderColor: theme.border, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6, fontSize: 10 }, statusApproved: { color: "#181818", backgroundColor: theme.accent, borderColor: theme.accent }, metrics: { flexDirection: "row", gap: 9 }, metric: { flex: 1, padding: 14, borderWidth: 1, borderColor: theme.border, borderRadius: 20, backgroundColor: theme.surface }, metricValue: { color: theme.text, fontSize: 26, fontWeight: "400" }, metricLabel: { color: theme.muted, fontSize: 10, marginTop: 4 }, sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 8 }, sectionTitle: { color: theme.text, fontSize: 21, fontWeight: "600" }, createButton: { backgroundColor: theme.accent, borderRadius: 15, paddingHorizontal: 13, paddingVertical: 9 }, createButtonText: { color: "#181818", fontSize: 11, fontWeight: "800" }, opportunityCard: { padding: 17, borderWidth: 1, borderColor: theme.border, borderRadius: 22, backgroundColor: theme.surface, gap: 10 }, rowTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }, opportunityTitle: { flex: 1, color: theme.text, fontSize: 18, lineHeight: 24, fontWeight: "600" }, published: { color: theme.accent, fontSize: 10, fontWeight: "700" }, rowStats: { flexDirection: "row", gap: 14 }, meta: { color: theme.muted, fontSize: 11, lineHeight: 18 }, empty: { minHeight: 170, alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderStyle: "dashed", borderColor: theme.border, borderRadius: 24, padding: 20 }, emptyTitle: { color: theme.text, fontSize: 17, fontWeight: "600" }, error: { color: "#EF8B8B", fontSize: 13 }, signOut: { marginTop: 24, borderWidth: 1, borderColor: "rgba(239,68,68,0.4)", borderRadius: 18, paddingVertical: 14, alignItems: "center" }, signOutText: { color: "#EF8B8B", fontSize: 13, fontWeight: "700" } }); }
