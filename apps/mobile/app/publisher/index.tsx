import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { PublisherTabBar } from "@/components/PublisherTabBar";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { getPublisherConversations, getPublisherDashboard, type MobilePublisherDashboard, type MobilePublisherOpportunity } from "@/lib/publisher-api";
import { signOutMobile } from "@/lib/push";
import { darkTheme } from "@/lib/theme";

export default function PublisherDashboardScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [data, setData] = useState<MobilePublisherDashboard | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const [result, conversations] = await Promise.all([getPublisherDashboard(locale), getPublisherConversations().catch(() => null)]);
      if (!result) setError(isArabic ? "تعذر تحميل لوحة الجهة." : "Unable to load publisher dashboard.");
      else setData(result);
      setUnreadCount(conversations?.unreadCount ?? 0);
    } catch {
      setError(isArabic ? "تعذر تحميل لوحة الجهة. تحقق من الاتصال وحاول مرة أخرى." : "Unable to load publisher dashboard. Check your connection and try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isArabic, locale]);

  useEffect(() => { void load(); }, [load]);
  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.accent} /></View>;

  return <View style={styles.screen}><FlatList
    data={data?.opportunities ?? []}
    keyExtractor={(item) => String(item.id)}
    contentContainerStyle={[styles.content, { direction: isRtl ? "rtl" : "ltr" }]}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.accent} />}
    ListHeaderComponent={<>
      <View style={styles.topBar}><View><Text style={styles.eyebrow}>{isArabic ? "ملامح للأعمال" : "MLAMH FOR BUSINESS"}</Text><Text accessibilityRole="header" style={styles.title}>{isArabic ? "لوحة الجهة" : "Publisher dashboard"}</Text></View><Pressable style={styles.addButton} onPress={() => router.push("/publisher/opportunities/new")} accessibilityRole="button" accessibilityLabel={isArabic ? "إضافة فرصة" : "Add opportunity"}><Text style={styles.addButtonText}>{isArabic ? "فرصة جديدة" : "New"}</Text></Pressable></View>
      <Text style={styles.subtitle}>{isArabic ? "انشر الفرص، راجع المتقدمين، واتخذ قرارك من مكان واحد." : "Publish opportunities, review applicants and make decisions from one place."}</Text>
      {data ? <>
        <View style={styles.identityCard}><View style={styles.identityLeft}><View style={styles.logoCircle}><Text style={styles.logoText}>{data.publisher.name.slice(0, 1)}</Text></View><View style={styles.identityCopy}><Text numberOfLines={1} style={styles.identityName}>{data.publisher.name}</Text><Text style={styles.meta}>{[data.publisher.city, data.publisher.countryCode].filter(Boolean).join(" · ") || (isArabic ? "جهة ملامح" : "MLAMH publisher")}</Text></View></View><Text style={[styles.statusPill, data.publisher.approvalStatus === "approved" && styles.statusApproved]}>{data.publisher.approvalStatus === "approved" ? (isArabic ? "معتمد" : "Approved") : (isArabic ? "قيد المراجعة" : "In review")}</Text></View>
        <View style={styles.metrics}><Metric value={data.metrics.published} label={isArabic ? "منشورة" : "Published"} styles={styles} /><Metric value={data.metrics.applications} label={isArabic ? "طلبات" : "Applications"} styles={styles} /><Metric value={data.metrics.accepted} label={isArabic ? "مقبول" : "Accepted"} styles={styles} /></View>
      </> : null}
      <View style={styles.sectionHeader}><View><Text style={styles.sectionEyebrow}>{isArabic ? "إدارة" : "MANAGE"}</Text><Text style={styles.sectionTitle}>{isArabic ? "الفرص" : "Opportunities"}</Text></View><Text style={styles.sectionHint}>{data?.opportunities.length ?? 0}</Text></View>
      {error ? <View style={styles.errorCard}><Text accessibilityRole="alert" style={styles.error}>{error}</Text><Pressable style={styles.retryButton} onPress={() => void load()}><Text style={styles.retryButtonText}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text></Pressable></View> : null}
    </>}
    ListEmptyComponent={!error ? <View style={styles.empty}><Text style={styles.emptyTitle}>{isArabic ? "لا توجد فرص بعد" : "No opportunities yet"}</Text><Text style={styles.meta}>{isArabic ? "أنشئ Brief واضحًا واستقبل طلبات المواهب من ملامح." : "Create a clear brief and receive talent applications through MLAMH."}</Text><Pressable style={styles.primaryButton} onPress={() => router.push("/publisher/opportunities/new")}><Text style={styles.primaryButtonText}>{isArabic ? "إنشاء أول فرصة" : "Create first opportunity"}</Text></Pressable></View> : null}
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
function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }, content: { paddingHorizontal: 18, paddingTop: 52, paddingBottom: 30, gap: 14 },
  topBar: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }, eyebrow: { color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.8 }, title: { color: theme.text, fontSize: 31, lineHeight: 38, fontWeight: "700", marginTop: 3 }, subtitle: { color: theme.muted, fontSize: 13, lineHeight: 21, maxWidth: 420 }, addButton: { minHeight: 40, borderRadius: 12, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center", paddingHorizontal: 14 }, addButtonText: { color: theme.background, fontSize: 11, fontWeight: "900" },
  identityCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.border }, identityLeft: { flexDirection: "row", alignItems: "center", gap: 11, flex: 1 }, identityCopy: { flex: 1 }, logoCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" }, logoText: { color: theme.accent, fontSize: 19, fontWeight: "900" }, identityName: { color: theme.text, fontSize: 17, fontWeight: "800" },
  statusPill: { color: theme.muted, borderWidth: 1, borderColor: theme.border, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5, fontSize: 9 }, statusApproved: { color: theme.accent, borderColor: theme.accent }, metrics: { flexDirection: "row", gap: 8 }, metric: { flex: 1, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.border }, metricValue: { color: theme.text, fontSize: 24, fontWeight: "800" }, metricLabel: { color: theme.muted, fontSize: 9, marginTop: 3 },
  sectionHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 8 }, sectionEyebrow: { color: theme.accent, fontSize: 9, fontWeight: "900", letterSpacing: 1.6 }, sectionTitle: { color: theme.text, fontSize: 20, fontWeight: "800", marginTop: 2 }, sectionHint: { color: theme.muted, fontSize: 11, fontWeight: "800" }, opportunityCard: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: theme.border }, pressed: { opacity: 0.68 }, rowTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }, opportunityText: { flex: 1, gap: 5 }, opportunityTitle: { color: theme.text, fontSize: 17, lineHeight: 23, fontWeight: "800" }, published: { color: theme.accent, fontSize: 9, fontWeight: "800" }, meta: { color: theme.muted, fontSize: 11, lineHeight: 18 },
  empty: { minHeight: 210, alignItems: "center", justifyContent: "center", gap: 9, borderWidth: 1, borderColor: theme.border, borderRadius: 18, padding: 22 }, emptyTitle: { color: theme.text, fontSize: 18, fontWeight: "800" }, primaryButton: { marginTop: 7, backgroundColor: theme.accent, borderRadius: 12, paddingHorizontal: 17, paddingVertical: 12 }, primaryButtonText: { color: theme.background, fontSize: 11, fontWeight: "900" },
  errorCard: { gap: 10, padding: 14, borderWidth: 1, borderColor: theme.border, borderRadius: 14, backgroundColor: theme.surface }, error: { color: "#E59A9A", fontSize: 13 }, retryButton: { alignSelf: "flex-start", borderWidth: 1, borderColor: theme.border, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 8 }, retryButtonText: { color: theme.text, fontSize: 11, fontWeight: "700" },
  signOut: { marginTop: 26, borderTopWidth: 1, borderTopColor: theme.border, paddingVertical: 16, alignItems: "center" }, signOutText: { color: "#E59A9A", fontSize: 12, fontWeight: "800" }
}); }
