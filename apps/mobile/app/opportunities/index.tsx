import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";

import { AppTabBar } from "@/components/AppTabBar";
import { ScreenSkeleton } from "@/components/ScreenSkeleton";
import { resolveMobileMarket } from "@/lib/account";
import { getNotifications, getPublicOpportunities, type MobileOpportunity } from "@/lib/api";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { darkTheme } from "@/lib/theme";

type FilterKey = "all" | "actor" | "model";

export default function OpportunitiesScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [items, setItems] = useState<MobileOpportunity[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [market, setMarket] = useState("SA");

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const resolvedMarket = await resolveMobileMarket();
      setMarket(resolvedMarket);
      const [response, notifications] = await Promise.all([
        getPublicOpportunities(locale, resolvedMarket),
        getNotifications().catch(() => null),
      ]);
      setItems(response.items);
      setUnreadCount(notifications?.unreadCount ?? 0);
    } catch {
      setError(isArabic ? "تعذر تحميل الفرص الآن." : "Unable to load opportunities right now.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isArabic, locale]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      const type = item.opportunityType.toLowerCase();
      const matchesFilter = filter === "all" || type.includes(filter);
      const haystack = `${item.title} ${item.companyName} ${item.city ?? ""} ${item.opportunityType}`.toLowerCase();
      return matchesFilter && (!needle || haystack.includes(needle));
    });
  }, [filter, items, query]);

  const featured = filtered.filter((item) => item.featured).slice(0, 4);
  const regular = filtered.filter((item) => !item.featured);
  const textAlign = isRtl ? "right" : "left";

  if (loading) return <ScreenSkeleton variant="list" />;

  return <View style={styles.screen}>
    <FlatList
      data={regular}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.accent} colors={[theme.accent]} />}
      ListHeaderComponent={<View style={{ direction: isRtl ? "rtl" : "ltr" }}>
        <View style={[styles.topBar, isRtl && styles.topBarRtl]}>
          <View style={styles.titleBlock}><Text style={[styles.brand, isArabic && styles.arabicText]}>{isArabic ? "ملامح" : "MLAMH"}</Text><Text accessibilityRole="header" style={[styles.pageTitle, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "الفرص" : "Opportunities"}</Text><Text style={[styles.pageSubtitle, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "اكتشف فرصًا مناسبة لتخصصك وتقدّم مباشرة." : "Discover relevant opportunities and apply directly."}</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "التنبيهات" : "Notifications"} onPress={() => router.push("/notifications")} style={({ pressed }) => [styles.notificationButton, pressed && styles.pressed]}><Text style={styles.notificationText}>{unreadCount > 0 ? String(Math.min(unreadCount, 99)) : "•"}</Text></Pressable>
        </View>

        <View style={[styles.marketRow, isRtl && styles.marketRowRtl]}><Text style={[styles.marketLabel, isArabic && styles.arabicText]}>{market === "SA" ? (isArabic ? "السعودية" : "Saudi Arabia") : market}</Text><Text style={[styles.marketCount, isArabic && styles.arabicText]}>{isArabic ? `${filtered.length} فرصة` : `${filtered.length} opportunities`}</Text></View>

        <View style={styles.searchBox}><TextInput value={query} onChangeText={setQuery} placeholder={isArabic ? "ابحث عن فرصة أو جهة" : "Search opportunities or companies"} placeholderTextColor={theme.muted} style={[styles.searchInput, isArabic && styles.arabicText, { textAlign }]} autoCapitalize="none" returnKeyType="search" /></View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filters, isRtl && styles.filtersRtl]}>
          <FilterChip active={filter === "all"} label={isArabic ? "الكل" : "All"} onPress={() => setFilter("all")} styles={styles} isArabic={isArabic} />
          <FilterChip active={filter === "actor"} label={isArabic ? "تمثيل" : "Acting"} onPress={() => setFilter("actor")} styles={styles} isArabic={isArabic} />
          <FilterChip active={filter === "model"} label={isArabic ? "مودل" : "Modeling"} onPress={() => setFilter("model")} styles={styles} isArabic={isArabic} />
        </ScrollView>

        {featured.length > 0 ? <View style={styles.featuredSection}><Text style={[styles.sectionTitle, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "فرص مميزة" : "Featured"}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.featuredRow, isRtl && styles.featuredRowRtl]}>{featured.map((item) => <FeaturedCard key={item.id} item={item} locale={locale} styles={styles} />)}</ScrollView></View> : null}

        <View style={[styles.latestHeader, isRtl && styles.latestHeaderRtl]}><Text style={[styles.sectionTitle, isArabic && styles.arabicText]}>{isArabic ? "أحدث الفرص" : "Latest opportunities"}</Text><Text style={[styles.sectionCount, isArabic && styles.arabicText]}>{regular.length}</Text></View>
      </View>}
      ListEmptyComponent={<View style={styles.emptyState}><Text style={[styles.emptyTitle, isArabic && styles.arabicText, { textAlign: "center" }]}>{error ?? (isArabic ? "لا توجد فرص مطابقة حاليًا" : "No matching opportunities right now")}</Text><Text style={[styles.emptyBody, isArabic && styles.arabicText]}>{error ? (isArabic ? "تحقق من الاتصال ثم حاول مرة أخرى." : "Check your connection and try again.") : (isArabic ? "جرّب تعديل البحث أو التصنيف." : "Try adjusting your search or category.")}</Text>{error ? <Pressable style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]} onPress={() => void load()}><Text style={[styles.retryText, isArabic && styles.arabicText]}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text></Pressable> : null}</View>}
      renderItem={({ item }) => <OpportunityCard item={item} locale={locale} styles={styles} isRtl={isRtl} />}
    />
    <AppTabBar active="discover" locale={locale} theme={theme} notificationCount={unreadCount} />
  </View>;
}

function FilterChip({ active, label, onPress, styles, isArabic }: { active: boolean; label: string; onPress: () => void; styles: ReturnType<typeof createStyles>; isArabic: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={({ pressed }) => [styles.filterChip, active && styles.filterChipActive, pressed && styles.pressed]}><Text style={[styles.filterChipText, active && styles.filterChipTextActive, isArabic && styles.arabicText]}>{label}</Text></Pressable>;
}

function FeaturedCard({ item, locale, styles }: { item: MobileOpportunity; locale: "ar" | "en"; styles: ReturnType<typeof createStyles> }) {
  const isArabic = locale === "ar";
  const compensation = item.budget && item.currency ? `${item.budget} ${item.currency}` : (isArabic ? "حسب الاتفاق" : "By agreement");
  return <Pressable accessibilityRole="button" onPress={() => router.push(`/opportunities/${item.slug}`)} style={({ pressed }) => [styles.featuredCard, pressed && styles.pressed]}>
    <View style={styles.featuredTop}><Text style={[styles.featuredBadge, isArabic && styles.arabicText]}>{isArabic ? "مميز" : "Featured"}</Text><Text numberOfLines={1} style={[styles.company, isArabic && styles.arabicText]}>{item.companyName}</Text></View>
    <Text numberOfLines={2} style={[styles.featuredTitle, isArabic && styles.arabicText]}>{item.title}</Text>
    <View style={styles.metaRow}><Text numberOfLines={1} style={[styles.meta, isArabic && styles.arabicText]}>{[item.city, item.countryCode].filter(Boolean).join(" · ")}</Text><Text style={[styles.compensation, isArabic && styles.arabicText]}>{compensation}</Text></View>
  </Pressable>;
}

function OpportunityCard({ item, locale, styles, isRtl }: { item: MobileOpportunity; locale: "ar" | "en"; styles: ReturnType<typeof createStyles>; isRtl: boolean }) {
  const isArabic = locale === "ar";
  const location = [item.city, item.countryCode].filter(Boolean).join(" · ") || (isArabic ? "مرن" : "Flexible");
  return <Pressable accessibilityRole="button" onPress={() => router.push(`/opportunities/${item.slug}`)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
    <View style={[styles.cardHeader, isRtl && styles.cardHeaderRtl]}><Text style={[styles.typeBadge, isArabic && styles.arabicText]}>{humanizeType(item.opportunityType)}</Text><Text style={styles.chevron}>{isRtl ? "‹" : "›"}</Text></View>
    <Text numberOfLines={2} style={[styles.cardTitle, isArabic && styles.arabicText, { textAlign: isRtl ? "right" : "left" }]}>{item.title}</Text>
    <Text numberOfLines={1} style={[styles.company, isArabic && styles.arabicText, { textAlign: isRtl ? "right" : "left" }]}>{item.companyName}</Text>
    <Text numberOfLines={1} style={[styles.meta, isArabic && styles.arabicText, { textAlign: isRtl ? "right" : "left" }]}>{location}</Text>
  </Pressable>;
}

function humanizeType(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase()); }

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 30, gap: 12 },
  topBar: { marginTop: 18, flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 18 }, topBarRtl: { flexDirection: "row-reverse" }, titleBlock: { flex: 1, gap: 5 }, brand: { color: theme.accent, fontSize: 14, lineHeight: 20, fontWeight: "800", letterSpacing: 1.2 }, pageTitle: { color: theme.text, fontSize: 32, lineHeight: 39, fontWeight: "700" }, pageSubtitle: { color: theme.muted, fontSize: 13, lineHeight: 20, maxWidth: 390 },
  notificationButton: { minWidth: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center", paddingHorizontal: 9 }, notificationText: { color: theme.accent, fontSize: 12, fontWeight: "800" },
  marketRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 18 }, marketRowRtl: { flexDirection: "row-reverse" }, marketLabel: { color: theme.text, fontSize: 13, fontWeight: "700" }, marketCount: { color: theme.muted, fontSize: 12 },
  searchBox: { marginTop: 12, minHeight: 50, borderWidth: 1, borderColor: theme.border, borderRadius: 12, backgroundColor: theme.surface, paddingHorizontal: 14, justifyContent: "center" }, searchInput: { color: theme.text, fontSize: 14, paddingVertical: 12 },
  filters: { gap: 8, paddingTop: 12, paddingBottom: 8 }, filtersRtl: { flexDirection: "row-reverse" }, filterChip: { minHeight: 38, paddingHorizontal: 15, borderRadius: 19, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }, filterChipActive: { borderColor: theme.accent, backgroundColor: theme.chip }, filterChipText: { color: theme.muted, fontSize: 12, fontWeight: "700" }, filterChipTextActive: { color: theme.accent },
  featuredSection: { marginTop: 12, gap: 10 }, sectionTitle: { color: theme.text, fontSize: 18, lineHeight: 24, fontWeight: "700" }, featuredRow: { gap: 10, paddingBottom: 4 }, featuredRowRtl: { flexDirection: "row-reverse" }, featuredCard: { width: 286, minHeight: 176, borderRadius: 18, borderWidth: 1, borderColor: "#C9A96255", backgroundColor: theme.surfaceElevated, padding: 18, justifyContent: "space-between", gap: 14 }, featuredTop: { gap: 7 }, featuredBadge: { alignSelf: "flex-start", color: theme.accent, fontSize: 11, fontWeight: "800" }, featuredTitle: { color: theme.text, fontSize: 21, lineHeight: 28, fontWeight: "700" }, metaRow: { gap: 6 }, compensation: { color: theme.accent, fontSize: 12, fontWeight: "700" },
  latestHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 18, marginBottom: 2 }, latestHeaderRtl: { flexDirection: "row-reverse" }, sectionCount: { color: theme.muted, fontSize: 12 },
  card: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, borderRadius: 16, padding: 16, gap: 8, marginBottom: 2 }, cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, cardHeaderRtl: { flexDirection: "row-reverse" }, typeBadge: { color: theme.accent, fontSize: 11, fontWeight: "700" }, chevron: { color: theme.muted, fontSize: 22, lineHeight: 22 }, cardTitle: { color: theme.text, fontSize: 18, lineHeight: 25, fontWeight: "700" }, company: { color: theme.text, fontSize: 12, lineHeight: 18, opacity: 0.85 }, meta: { color: theme.muted, fontSize: 11, lineHeight: 17 },
  emptyState: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, borderRadius: 16, padding: 24, alignItems: "center", gap: 8, marginTop: 8 }, emptyTitle: { color: theme.text, fontSize: 16, lineHeight: 23, fontWeight: "700" }, emptyBody: { color: theme.muted, fontSize: 12, lineHeight: 19, textAlign: "center" }, retryButton: { minHeight: 42, paddingHorizontal: 18, borderRadius: 12, borderWidth: 1, borderColor: theme.accent, alignItems: "center", justifyContent: "center", marginTop: 6 }, retryText: { color: theme.accent, fontSize: 12, fontWeight: "800" }, pressed: { opacity: 0.78 }, arabicText: { letterSpacing: 0 },
}); }