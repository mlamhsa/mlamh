import { router } from "expo-router";
import { BriefcaseBusiness, ChevronLeft, ChevronRight, Eye, Users, Zap } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getPublisherOpportunities,
  type PublisherOpportunityItem,
  type PublisherOpportunitiesResponse,
} from "@/src/domains/publisher/opportunities";
import { useLocale } from "@/src/i18n/LocaleProvider";
import { colors, radius, spacing, typography } from "@/src/theme/tokens";

type FilterKey = "all" | "pending_review" | "needs_changes" | "published" | "rejected" | "closed";

function statusLabel(status: string, isArabic: boolean) {
  const labels: Record<string, [string, string]> = {
    draft: ["مسودة", "Draft"],
    pending_review: ["قيد المراجعة", "In review"],
    needs_changes: ["تحتاج تعديلات", "Needs changes"],
    rejected: ["مرفوضة", "Rejected"],
    published: ["منشورة", "Published"],
    open: ["منشورة", "Published"],
    closed: ["مغلقة", "Closed"],
    archived: ["مؤرشفة", "Archived"],
  };
  return isArabic ? (labels[status]?.[0] ?? status) : (labels[status]?.[1] ?? status);
}

export function PublisherOpportunitiesScreen() {
  const { locale } = useLocale();
  const isArabic = locale === "ar";
  const align = isArabic ? "right" : "left";
  const BackIcon = isArabic ? ChevronRight : ChevronLeft;
  const [data, setData] = useState<PublisherOpportunitiesResponse | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(false);
    try {
      setData(await getPublisherOpportunities());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const items = useMemo(() => {
    const source = data?.items ?? [];
    if (filter === "all") return source;
    if (filter === "published") return source.filter((item) => item.status === "published" || item.status === "open");
    return source.filter((item) => item.status === filter);
  }, [data?.items, filter]);

  const filters: Array<{ key: FilterKey; ar: string; en: string; count: number }> = [
    { key: "all", ar: "الكل", en: "All", count: data?.counts.total ?? 0 },
    { key: "pending_review", ar: "المراجعة", en: "Review", count: data?.counts.pendingReview ?? 0 },
    { key: "needs_changes", ar: "تعديلات", en: "Changes", count: data?.counts.needsChanges ?? 0 },
    { key: "published", ar: "منشورة", en: "Published", count: data?.counts.published ?? 0 },
    { key: "rejected", ar: "مرفوضة", en: "Rejected", count: data?.counts.rejected ?? 0 },
    { key: "closed", ar: "مغلقة", en: "Closed", count: data?.counts.closed ?? 0 },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <BackIcon size={20} color={colors.textSecondary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={[styles.eyebrow, { textAlign: align }]}>{isArabic ? "مساحة الناشر" : "PUBLISHER"}</Text>
          <Text style={[styles.title, { textAlign: align }]}>{isArabic ? "فرصي" : "My opportunities"}</Text>
        </View>
        <BriefcaseBusiness size={20} color={colors.gold} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.gold} />}
      >
        <Text style={[styles.subtitle, { textAlign: align }]}>
          {isArabic
            ? "تابع حالة كل فرصة وعدد المتقدمين بدون خلط بين طلبات الآن والكاستينغ."
            : "Track each opportunity and applicant count without mixing Quick Requests with Casting."}
        </Text>

        {data ? (
          <View style={styles.statsRow}>
            <Stat value={data.counts.total} label={isArabic ? "الفرص" : "Opportunities"} />
            <Stat value={data.counts.applicants} label={isArabic ? "المتقدمون" : "Applicants"} />
            <Stat value={data.counts.published} label={isArabic ? "المنشورة" : "Published"} />
          </View>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {filters.map((item) => {
            const active = filter === item.key;
            return (
              <Pressable key={item.key} onPress={() => setFilter(item.key)} style={[styles.filterChip, active && styles.filterChipActive]}>
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {isArabic ? item.ar : item.en} · {item.count}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loading ? <Text style={styles.centerText}>{isArabic ? "جارٍ تحميل فرصك..." : "Loading your opportunities..."}</Text> : null}
        {!loading && error ? (
          <View style={styles.stateCard}>
            <Text style={[styles.stateText, { textAlign: align }]}>{isArabic ? "تعذر تحميل الفرص." : "Unable to load opportunities."}</Text>
            <Pressable onPress={() => void load()} style={styles.retryButton}><Text style={styles.retryText}>{isArabic ? "إعادة المحاولة" : "Retry"}</Text></Pressable>
          </View>
        ) : null}
        {!loading && !error && items.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={[styles.stateText, { textAlign: align }]}>{isArabic ? "لا توجد فرص ضمن هذا التصنيف." : "No opportunities in this filter."}</Text>
          </View>
        ) : null}

        <View style={styles.list}>
          {items.map((item) => <OpportunityCard key={item.id} item={item} isArabic={isArabic} align={align} />)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function OpportunityCard({ item, isArabic, align }: { item: PublisherOpportunityItem; isArabic: boolean; align: "right" | "left" }) {
  const isQuick = item.postingMode === "quick";
  const isLive = item.status === "published" || item.status === "open";
  const ModeIcon = isQuick ? Zap : BriefcaseBusiness;
  return (
    <View style={styles.card}>
      <View style={[styles.cardTop, isArabic ? styles.rowRtl : styles.rowLtr]}>
        <View style={styles.modeIcon}><ModeIcon size={16} color={colors.gold} /></View>
        <View style={styles.cardCopy}>
          <Text style={[styles.cardTitle, { textAlign: align }]} numberOfLines={2}>{item.title}</Text>
          <Text style={[styles.meta, { textAlign: align }]}>
            {isQuick ? (isArabic ? "طلب الآن" : "Quick Request") : (isArabic ? "كاستينغ" : "Casting")}
            {" · "}{isArabic ? (item.cityAr ?? item.cityEn ?? "—") : (item.cityEn ?? item.cityAr ?? "—")}
          </Text>
        </View>
        <View style={styles.statusPill}><Text style={styles.statusText}>{statusLabel(item.status, isArabic)}</Text></View>
      </View>

      <View style={[styles.cardBottom, isArabic ? styles.rowRtl : styles.rowLtr]}>
        <View style={[styles.applicants, isArabic ? styles.rowRtl : styles.rowLtr]}>
          <Users size={14} color={colors.textMuted} />
          <Text style={styles.applicantText}>{item.applicantCount} {isArabic ? "متقدم" : "applicants"}</Text>
        </View>
        {isLive ? (
          <Pressable onPress={() => router.push(`/opportunities/${item.id}` as never)} style={styles.liveButton}>
            <Eye size={14} color="#090909" />
            <Text style={styles.liveText}>{isArabic ? "عرض المنشور" : "View live"}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  rowRtl: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.sm },
  rowLtr: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  header: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: spacing.lg },
  backButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, borderWidth: 1, borderColor: colors.border },
  headerCopy: { flex: 1 },
  eyebrow: { color: colors.gold, fontSize: 9, fontWeight: "800", letterSpacing: 1.6 },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: "700", marginTop: 2 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 56 },
  subtitle: { color: colors.textSecondary, fontSize: typography.body, lineHeight: 23 },
  statsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  stat: { flex: 1, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, alignItems: "center" },
  statValue: { color: colors.textPrimary, fontSize: 20, fontWeight: "800" },
  statLabel: { color: colors.textMuted, fontSize: 9, marginTop: 4, textAlign: "center" },
  filters: { gap: spacing.sm, paddingVertical: spacing.lg },
  filterChip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: 9 },
  filterChipActive: { borderColor: "rgba(201,169,98,0.40)", backgroundColor: "rgba(201,169,98,0.10)" },
  filterText: { color: colors.textMuted, fontSize: 10, fontWeight: "700" },
  filterTextActive: { color: colors.gold },
  centerText: { color: colors.textMuted, fontSize: 12, textAlign: "center", marginTop: spacing.xl },
  stateCard: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, marginTop: spacing.sm },
  stateText: { color: colors.textMuted, fontSize: 12, lineHeight: 20 },
  retryButton: { alignSelf: "center", marginTop: spacing.md, borderRadius: 999, backgroundColor: colors.gold, paddingHorizontal: spacing.lg, paddingVertical: 10 },
  retryText: { color: "#090909", fontSize: 11, fontWeight: "800" },
  list: { gap: spacing.md },
  card: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg },
  cardTop: { alignItems: "flex-start" },
  modeIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(201,169,98,0.22)", backgroundColor: "rgba(201,169,98,0.06)" },
  cardCopy: { flex: 1 },
  cardTitle: { color: colors.textPrimary, fontSize: 14, lineHeight: 20, fontWeight: "700" },
  meta: { color: colors.textMuted, fontSize: 10, marginTop: 5 },
  statusPill: { borderRadius: 999, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 9, paddingVertical: 6 },
  statusText: { color: colors.textSecondary, fontSize: 9, fontWeight: "700" },
  cardBottom: { justifyContent: "space-between", marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  applicants: { gap: 6 },
  applicantText: { color: colors.textMuted, fontSize: 10 },
  liveButton: { minHeight: 36, flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, backgroundColor: colors.gold, paddingHorizontal: spacing.md },
  liveText: { color: "#090909", fontSize: 10, fontWeight: "800" },
});
