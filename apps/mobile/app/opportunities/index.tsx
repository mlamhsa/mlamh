import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from "react-native";
import { router } from "expo-router";

import { AppTabBar } from "@/components/AppTabBar";
import { resolveMobileMarket } from "@/lib/account";
import { getNotifications, getPublicOpportunities, type MobileOpportunity } from "@/lib/api";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { darkTheme, lightTheme } from "@/lib/theme";

type FilterKey = "all" | "actor" | "model";

export default function OpportunitiesScreen() {
  const locale = getDeviceLocale();
  const theme = useColorScheme() === "dark" ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [items, setItems] = useState<MobileOpportunity[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [market, setMarket] = useState("SA");
  const isArabic = locale === "ar";

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

  const featured = filtered.filter((item) => item.featured);
  const regular = filtered.filter((item) => !item.featured);

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.accent} /></View>;

  return (
    <View style={styles.screen}>
      <FlatList
        data={regular}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.accent} />}
        ListHeaderComponent={<View style={{ direction: isRtlLocale(locale) ? "rtl" : "ltr" }}>
          <View style={styles.topBar}>
            <View style={styles.marketRow}><Text style={styles.pin}>⌖</Text><Text style={styles.marketText}>{market === "SA" ? (isArabic ? "السعودية" : "Saudi Arabia") : market}</Text><Text style={styles.chevron}>⌄</Text></View>
            <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "التنبيهات" : "Notifications"} onPress={() => router.push("/notifications")} style={styles.bellWrap}><Text style={styles.bell}>♧</Text>{unreadCount > 0 ? <View style={styles.notificationDot} /> : null}</Pressable>
          </View>

          <View style={styles.searchBox}>
            <TextInput value={query} onChangeText={setQuery} placeholder={isArabic ? "ابحث عن فرص، مواهب، شركات..." : "Search opportunities, talent, companies..."} placeholderTextColor={theme.muted} style={styles.searchInput} />
            <Text style={styles.searchGlyph}>⌕</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
            <Category active={filter === "all"} label={isArabic ? "الكل" : "All"} glyph="⌘" onPress={() => setFilter("all")} styles={styles} />
            <Category active={filter === "actor"} label={isArabic ? "تمثيل" : "Acting"} glyph="♙" onPress={() => setFilter("actor")} styles={styles} />
            <Category active={filter === "model"} label={isArabic ? "عارضة أزياء" : "Modeling"} glyph="◇" onPress={() => setFilter("model")} styles={styles} />
            <Category active={false} label={isArabic ? "تصوير" : "Photo"} glyph="◉" onPress={() => undefined} styles={styles} />
            <Category active={false} label={isArabic ? "أخرى" : "Other"} glyph="✦" onPress={() => undefined} styles={styles} />
          </ScrollView>

          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{isArabic ? "فرص مميزة" : "Featured opportunities"}</Text><Text style={styles.sectionAction}>{isArabic ? "عرض الكل" : "View all"}</Text></View>
          {featured.length > 0 ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredRow}>{featured.map((item) => <FeaturedCard key={item.id} item={item} locale={locale} styles={styles} />)}</ScrollView> : <View style={styles.featuredPlaceholder}><Text style={styles.featuredTag}>{isArabic ? "مميز" : "Featured"}</Text><Text style={styles.placeholderTitle}>{isArabic ? "فرص مميزة تظهر هنا فور نشرها" : "Featured opportunities appear here"}</Text></View>}

          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{isArabic ? "فرص جديدة" : "New opportunities"}</Text><Text style={styles.sectionAction}>{isArabic ? "عرض الكل" : "View all"}</Text></View>
        </View>}
        ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyTitle}>{error ?? (isArabic ? "لا توجد نتائج مطابقة حاليًا." : "No matching opportunities right now.")}</Text>{error ? <Pressable style={styles.retryButton} onPress={() => void load()}><Text style={styles.retryText}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text></Pressable> : null}</View>}
        renderItem={({ item }) => <OpportunityCard item={item} locale={locale} styles={styles} />}
      />
      <AppTabBar active="discover" locale={locale} theme={theme} notificationCount={unreadCount} />
    </View>
  );
}

function Category({ active, label, glyph, onPress, styles }: { active: boolean; label: string; glyph: string; onPress: () => void; styles: ReturnType<typeof createStyles> }) {
  return <Pressable onPress={onPress} style={styles.category}><View style={[styles.categoryIcon, active && styles.categoryIconActive]}><Text style={[styles.categoryGlyph, active && styles.categoryGlyphActive]}>{glyph}</Text></View><Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>{label}</Text></Pressable>;
}

function FeaturedCard({ item, locale, styles }: { item: MobileOpportunity; locale: "ar" | "en"; styles: ReturnType<typeof createStyles> }) {
  const isArabic = locale === "ar";
  return <Pressable onPress={() => router.push(`/opportunities/${item.slug}`)} style={({ pressed }) => [styles.featuredCard, pressed && styles.pressed]}>
    <View style={styles.featuredVisual}><View style={styles.featuredGlow} /><Text style={styles.featuredVisualGlyph}>✦</Text></View>
    <View style={styles.featuredOverlay}><Text style={styles.featuredTag}>{isArabic ? "مميز" : "Featured"}</Text><Text numberOfLines={2} style={styles.featuredTitle}>{item.title}</Text><Text style={styles.featuredMeta}>{[item.city, item.countryCode].filter(Boolean).join("، ")}</Text><Text style={styles.featuredBudget}>{item.budget ?? (isArabic ? "حسب الاتفاق" : "By agreement")}</Text></View>
    <View style={styles.bookmark}><Text style={styles.bookmarkGlyph}>⌑</Text></View>
  </Pressable>;
}

function OpportunityCard({ item, locale, styles }: { item: MobileOpportunity; locale: "ar" | "en"; styles: ReturnType<typeof createStyles> }) {
  const isArabic = locale === "ar";
  return <Pressable onPress={() => router.push(`/opportunities/${item.slug}`)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
    <View style={styles.cardVisual}><Text style={styles.cardVisualGlyph}>✦</Text></View>
    <View style={styles.cardBody}><Text numberOfLines={2} style={styles.cardTitle}>{item.title}</Text><Text style={styles.company}>{item.companyName}</Text><Text style={styles.meta}>{[item.city, item.countryCode].filter(Boolean).join(" · ")}</Text><Text style={styles.openLabel}>{isArabic ? "عرض التفاصيل" : "View details"}</Text></View>
  </Pressable>;
}

function createStyles(theme: typeof lightTheme | typeof darkTheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background },
    content: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 24, gap: 11 },
    topBar: { marginTop: 30, minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    marketRow: { flexDirection: "row", alignItems: "center", gap: 5 }, pin: { color: theme.text, fontSize: 18 }, marketText: { color: theme.text, fontSize: 13, fontWeight: "800" }, chevron: { color: theme.accent, fontSize: 14 },
    bellWrap: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" }, bell: { color: theme.text, fontSize: 22 }, notificationDot: { position: "absolute", top: 7, right: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: "#D04B4B" },
    searchBox: { marginTop: 2, height: 44, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: theme.border, borderRadius: 12, backgroundColor: theme.input, paddingHorizontal: 12 },
    searchInput: { flex: 1, color: theme.text, fontSize: 12, paddingVertical: 10 }, searchGlyph: { color: theme.text, fontSize: 19 },
    categories: { gap: 9, paddingTop: 13, paddingBottom: 8 },
    category: { width: 62, alignItems: "center", gap: 6 }, categoryIcon: { width: 46, height: 46, borderRadius: 12, backgroundColor: theme.surfaceElevated, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" }, categoryIconActive: { backgroundColor: theme.accent, borderColor: theme.accent }, categoryGlyph: { color: theme.text, fontSize: 19 }, categoryGlyphActive: { color: "#111111" }, categoryLabel: { color: theme.text, fontSize: 9, fontWeight: "600", textAlign: "center" }, categoryLabelActive: { color: theme.text, fontWeight: "800" },
    sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 9, marginBottom: 2 }, sectionTitle: { color: theme.text, fontSize: 16, fontWeight: "800" }, sectionAction: { color: theme.accent, fontSize: 11, fontWeight: "700" },
    featuredRow: { gap: 10, paddingBottom: 5 },
    featuredCard: { width: 300, height: 245, borderRadius: 18, overflow: "hidden", backgroundColor: theme.surfaceElevated, borderWidth: 1, borderColor: theme.border },
    featuredVisual: { flex: 1, backgroundColor: theme.surfaceElevated, alignItems: "center", justifyContent: "center", overflow: "hidden" }, featuredGlow: { position: "absolute", width: 210, height: 210, borderRadius: 105, backgroundColor: theme.accent, opacity: 0.09 }, featuredVisualGlyph: { color: theme.accent, opacity: 0.45, fontSize: 58 },
    featuredOverlay: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 14, paddingTop: 32, backgroundColor: "rgba(0,0,0,0.72)", gap: 4 }, featuredTag: { alignSelf: "flex-start", color: "#111111", backgroundColor: theme.accent, borderRadius: 8, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 4, fontSize: 9, fontWeight: "900" }, featuredTitle: { color: "#FFFFFF", fontSize: 18, lineHeight: 23, fontWeight: "800" }, featuredMeta: { color: "#E9E0D3", fontSize: 10 }, featuredBudget: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" }, bookmark: { position: "absolute", right: 12, bottom: 12, width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.55)", alignItems: "center", justifyContent: "center" }, bookmarkGlyph: { color: "#FFFFFF", fontSize: 18 },
    featuredPlaceholder: { minHeight: 145, borderRadius: 18, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surfaceElevated, padding: 16, justifyContent: "flex-end", gap: 8 }, placeholderTitle: { color: theme.text, fontSize: 17, lineHeight: 22, fontWeight: "700" },
    card: { minHeight: 112, borderRadius: 15, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surfaceElevated, overflow: "hidden", flexDirection: "row", marginBottom: 2 }, cardVisual: { width: 118, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }, cardVisualGlyph: { color: theme.accent, fontSize: 34, opacity: 0.45 }, cardBody: { flex: 1, padding: 12, gap: 4, justifyContent: "center" }, cardTitle: { color: theme.text, fontSize: 15, lineHeight: 20, fontWeight: "800" }, company: { color: theme.text, fontSize: 10, fontWeight: "600" }, meta: { color: theme.muted, fontSize: 9 }, openLabel: { color: theme.accent, fontSize: 10, fontWeight: "800", marginTop: 2 },
    pressed: { opacity: 0.76, transform: [{ scale: 0.995 }] }, emptyState: { paddingVertical: 60, alignItems: "center", gap: 16 }, emptyTitle: { color: theme.text, fontSize: 16, textAlign: "center" }, retryButton: { borderRadius: 12, backgroundColor: theme.accent, paddingHorizontal: 20, paddingVertical: 12 }, retryText: { color: "#111111", fontWeight: "800" },
  });
}
