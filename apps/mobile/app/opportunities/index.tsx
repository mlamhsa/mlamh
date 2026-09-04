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
  const countLabel = isArabic ? `${filtered.length} فرصة متاحة` : `${filtered.length} opportunities available`;

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.accent} /></View>;

  return <View style={styles.screen}>
    <FlatList
      data={regular}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.accent} />}
      ListHeaderComponent={<View style={{ direction: isRtlLocale(locale) ? "rtl" : "ltr" }}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.eyebrow}>MLAMH</Text>
            <Text accessibilityRole="header" style={styles.pageTitle}>{isArabic ? "اكتشف فرصتك القادمة" : "Discover your next opportunity"}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "التنبيهات" : "Notifications"} onPress={() => router.push("/notifications")} style={styles.bellWrap}>
            <Text style={styles.bell}>♧</Text>{unreadCount > 0 ? <View style={styles.notificationDot} /> : null}
          </Pressable>
        </View>

        <View style={styles.marketPanel}>
          <View style={styles.marketIdentity}><View style={styles.marketPin}><Text style={styles.marketPinGlyph}>⌖</Text></View><View><Text style={styles.marketLabel}>{isArabic ? "السوق الحالي" : "Current market"}</Text><Text style={styles.marketText}>{market === "SA" ? (isArabic ? "السعودية" : "Saudi Arabia") : market}</Text></View></View>
          <Text style={styles.marketCount}>{countLabel}</Text>
        </View>

        <View style={styles.searchBox}><Text style={styles.searchGlyph}>⌕</Text><TextInput value={query} onChangeText={setQuery} placeholder={isArabic ? "ابحث باسم الفرصة أو الجهة..." : "Search by opportunity or company..."} placeholderTextColor={theme.muted} style={styles.searchInput} /></View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
          <Category active={filter === "all"} label={isArabic ? "الكل" : "All"} glyph="✦" onPress={() => setFilter("all")} styles={styles} />
          <Category active={filter === "actor"} label={isArabic ? "تمثيل" : "Acting"} glyph="A" onPress={() => setFilter("actor")} styles={styles} />
          <Category active={filter === "model"} label={isArabic ? "مودل" : "Modeling"} glyph="M" onPress={() => setFilter("model")} styles={styles} />
        </ScrollView>

        <View style={styles.sectionHeader}><View><Text style={styles.sectionEyebrow}>{isArabic ? "مختارة لك" : "CURATED"}</Text><Text style={styles.sectionTitle}>{isArabic ? "فرص مميزة" : "Featured opportunities"}</Text></View></View>
        {featured.length > 0
          ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredRow}>{featured.map((item) => <FeaturedCard key={item.id} item={item} locale={locale} styles={styles} />)}</ScrollView>
          : <View style={styles.featuredPlaceholder}><View style={styles.placeholderMark}><Text style={styles.placeholderMarkText}>M</Text></View><Text style={styles.placeholderTitle}>{isArabic ? "ستظهر الفرص المميزة هنا فور توفرها" : "Featured opportunities will appear here"}</Text><Text style={styles.placeholderBody}>{isArabic ? "نرتب الفرص حسب جودتها ووضوح تفاصيلها." : "We surface opportunities with clear, high-quality briefs."}</Text></View>}

        <View style={styles.sectionHeader}><View><Text style={styles.sectionEyebrow}>{isArabic ? "الأحدث" : "LATEST"}</Text><Text style={styles.sectionTitle}>{isArabic ? "فرص جديدة" : "New opportunities"}</Text></View><Text style={styles.sectionCount}>{regular.length}</Text></View>
      </View>}
      ListEmptyComponent={<View style={styles.emptyState}><View style={styles.emptyMark}><Text style={styles.emptyMarkText}>M</Text></View><Text style={styles.emptyTitle}>{error ?? (isArabic ? "لا توجد نتائج مطابقة حاليًا." : "No matching opportunities right now.")}</Text><Text style={styles.emptyBody}>{!error ? (isArabic ? "جرّب تعديل البحث أو اختيار تصنيف آخر." : "Try adjusting your search or category.") : ""}</Text>{error ? <Pressable style={styles.retryButton} onPress={() => void load()}><Text style={styles.retryText}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text></Pressable> : null}</View>}
      renderItem={({ item }) => <OpportunityCard item={item} locale={locale} styles={styles} />}
    />
    <AppTabBar active="discover" locale={locale} theme={theme} notificationCount={unreadCount} />
  </View>;
}

function Category({ active, label, glyph, onPress, styles }: { active: boolean; label: string; glyph: string; onPress: () => void; styles: ReturnType<typeof createStyles> }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={({ pressed }) => [styles.category, active && styles.categoryActive, pressed && styles.pressed]}><Text style={[styles.categoryGlyph, active && styles.categoryGlyphActive]}>{glyph}</Text><Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>{label}</Text></Pressable>;
}

function FeaturedCard({ item, locale, styles }: { item: MobileOpportunity; locale: "ar" | "en"; styles: ReturnType<typeof createStyles> }) {
  const isArabic = locale === "ar";
  const compensation = item.budget && item.currency ? `${item.budget} ${item.currency}` : (isArabic ? "حسب الاتفاق" : "By agreement");
  return <Pressable onPress={() => router.push(`/opportunities/${item.slug}`)} style={({ pressed }) => [styles.featuredCard, pressed && styles.pressed]}>
    <View style={styles.featuredVisual}><View style={styles.featuredGlowLarge} /><View style={styles.featuredGlowSmall} /><Text style={styles.featuredVisualGlyph}>M</Text></View>
    <View style={styles.featuredOverlay}>
      <View style={styles.featuredTopRow}><Text style={styles.featuredTag}>{isArabic ? "مميز" : "Featured"}</Text><Text style={styles.featuredCompany}>{item.companyName}</Text></View>
      <Text numberOfLines={2} style={styles.featuredTitle}>{item.title}</Text>
      <View style={styles.featuredFooter}><Text style={styles.featuredMeta}>{[item.city, item.countryCode].filter(Boolean).join(" · ")}</Text><Text style={styles.featuredBudget}>{compensation}</Text></View>
    </View>
  </Pressable>;
}

function OpportunityCard({ item, locale, styles }: { item: MobileOpportunity; locale: "ar" | "en"; styles: ReturnType<typeof createStyles> }) {
  const isArabic = locale === "ar";
  return <Pressable onPress={() => router.push(`/opportunities/${item.slug}`)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
    <View style={styles.cardVisual}><View style={styles.cardVisualRing}><Text style={styles.cardVisualGlyph}>M</Text></View></View>
    <View style={styles.cardBody}>
      <View style={styles.cardTop}><Text style={styles.cardType}>{item.opportunityType.replaceAll("_", " ")}</Text><Text style={styles.cardArrow}>›</Text></View>
      <Text numberOfLines={2} style={styles.cardTitle}>{item.title}</Text>
      <Text numberOfLines={1} style={styles.company}>{item.companyName}</Text>
      <View style={styles.cardFooter}><Text numberOfLines={1} style={styles.meta}>{[item.city, item.countryCode].filter(Boolean).join(" · ") || (isArabic ? "عن بُعد / مرن" : "Remote / flexible")}</Text><Text style={styles.openLabel}>{isArabic ? "التفاصيل" : "Details"}</Text></View>
    </View>
  </Pressable>;
}

function createStyles(theme: typeof lightTheme | typeof darkTheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background },
    content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 30, gap: 13 },
    topBar: { marginTop: 28, minHeight: 76, flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 16 },
    eyebrow: { color: theme.accent, fontSize: 11, fontWeight: "900", letterSpacing: 2.4, marginBottom: 5 },
    pageTitle: { color: theme.text, fontSize: 29, lineHeight: 36, fontWeight: "800", maxWidth: 290 },
    bellWrap: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" },
    bell: { color: theme.text, fontSize: 22 },
    notificationDot: { position: "absolute", top: 7, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: theme.accent },
    marketPanel: { marginTop: 8, borderRadius: 22, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, minHeight: 76, paddingHorizontal: 15, paddingVertical: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
    marketIdentity: { flexDirection: "row", alignItems: "center", gap: 11, flex: 1 },
    marketPin: { width: 42, height: 42, borderRadius: 21, backgroundColor: theme.chip, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" },
    marketPinGlyph: { color: theme.accent, fontSize: 18 },
    marketLabel: { color: theme.muted, fontSize: 9, fontWeight: "700" },
    marketText: { color: theme.text, fontSize: 14, fontWeight: "800", marginTop: 2 },
    marketCount: { color: theme.muted, fontSize: 10, fontWeight: "700" },
    searchBox: { marginTop: 12, minHeight: 50, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: theme.border, borderRadius: 18, backgroundColor: theme.input, paddingHorizontal: 14 },
    searchInput: { flex: 1, color: theme.text, fontSize: 13, paddingVertical: 12 },
    searchGlyph: { color: theme.accent, fontSize: 19 },
    categories: { gap: 9, paddingTop: 13, paddingBottom: 10 },
    category: { minWidth: 92, minHeight: 44, borderRadius: 22, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface },
    categoryActive: { backgroundColor: theme.accent, borderColor: theme.accent },
    categoryGlyph: { color: theme.accent, fontSize: 14, fontWeight: "900" },
    categoryGlyphActive: { color: theme.charcoal },
    categoryLabel: { color: theme.text, fontSize: 11, fontWeight: "700" },
    categoryLabelActive: { color: theme.charcoal, fontWeight: "900" },
    sectionHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 14, marginBottom: 6 },
    sectionEyebrow: { color: theme.accent, fontSize: 9, fontWeight: "900", letterSpacing: 1.8, marginBottom: 3 },
    sectionTitle: { color: theme.text, fontSize: 20, fontWeight: "800" },
    sectionCount: { color: theme.muted, fontSize: 12, fontWeight: "700" },
    featuredRow: { gap: 12, paddingBottom: 6 },
    featuredCard: { width: 314, height: 270, borderRadius: 28, overflow: "hidden", backgroundColor: theme.charcoal, borderWidth: 1, borderColor: theme.bronze },
    featuredVisual: { flex: 1, backgroundColor: theme.charcoal, alignItems: "center", justifyContent: "center", overflow: "hidden" },
    featuredGlowLarge: { position: "absolute", width: 250, height: 250, borderRadius: 125, backgroundColor: theme.accent, opacity: 0.08, right: -62, top: -76 },
    featuredGlowSmall: { position: "absolute", width: 130, height: 130, borderRadius: 65, backgroundColor: theme.bronze, opacity: 0.12, left: -42, bottom: 22 },
    featuredVisualGlyph: { color: theme.accent, opacity: 0.5, fontSize: 74, fontWeight: "300", letterSpacing: -8 },
    featuredOverlay: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 16, paddingTop: 36, backgroundColor: "#2E2E2EE6", gap: 8 },
    featuredTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
    featuredTag: { color: theme.charcoal, backgroundColor: theme.accent, borderRadius: 10, overflow: "hidden", paddingHorizontal: 9, paddingVertical: 5, fontSize: 9, fontWeight: "900" },
    featuredCompany: { flex: 1, color: theme.ivory, opacity: 0.72, fontSize: 10, textAlign: "right" },
    featuredTitle: { color: theme.ivory, fontSize: 21, lineHeight: 27, fontWeight: "800" },
    featuredFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
    featuredMeta: { color: theme.ivory, opacity: 0.72, fontSize: 10, flex: 1 },
    featuredBudget: { color: theme.accent, fontSize: 11, fontWeight: "800" },
    featuredPlaceholder: { minHeight: 170, borderRadius: 24, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, padding: 18, justifyContent: "center", alignItems: "center", gap: 8 },
    placeholderMark: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: theme.accent, alignItems: "center", justifyContent: "center", marginBottom: 3 },
    placeholderMarkText: { color: theme.accent, fontSize: 22, fontWeight: "900" },
    placeholderTitle: { color: theme.text, fontSize: 16, lineHeight: 22, fontWeight: "800", textAlign: "center" },
    placeholderBody: { color: theme.muted, fontSize: 11, lineHeight: 18, textAlign: "center", maxWidth: 270 },
    card: { minHeight: 132, borderRadius: 22, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, overflow: "hidden", flexDirection: "row", marginBottom: 2 },
    cardVisual: { width: 104, backgroundColor: theme.chip, alignItems: "center", justifyContent: "center" },
    cardVisualRing: { width: 54, height: 54, borderRadius: 27, borderWidth: 1, borderColor: theme.bronze, alignItems: "center", justifyContent: "center" },
    cardVisualGlyph: { color: theme.accent, fontSize: 25, fontWeight: "800" },
    cardBody: { flex: 1, padding: 14, gap: 5, justifyContent: "center" },
    cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
    cardType: { color: theme.accent, fontSize: 9, fontWeight: "900", letterSpacing: 0.5, textTransform: "uppercase" },
    cardArrow: { color: theme.muted, fontSize: 22, lineHeight: 22 },
    cardTitle: { color: theme.text, fontSize: 16, lineHeight: 22, fontWeight: "800" },
    company: { color: theme.text, fontSize: 10, fontWeight: "700" },
    cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 2 },
    meta: { color: theme.muted, fontSize: 9, flex: 1 },
    openLabel: { color: theme.accent, fontSize: 10, fontWeight: "900" },
    pressed: { opacity: 0.76, transform: [{ scale: 0.995 }] },
    emptyState: { paddingVertical: 64, alignItems: "center", gap: 10 },
    emptyMark: { width: 58, height: 58, borderRadius: 29, borderWidth: 1, borderColor: theme.accent, alignItems: "center", justifyContent: "center", marginBottom: 5 },
    emptyMarkText: { color: theme.accent, fontSize: 26, fontWeight: "900" },
    emptyTitle: { color: theme.text, fontSize: 16, textAlign: "center", lineHeight: 23, fontWeight: "800" },
    emptyBody: { color: theme.muted, fontSize: 11, textAlign: "center" },
    retryButton: { borderRadius: 14, backgroundColor: theme.accent, paddingHorizontal: 20, paddingVertical: 12, marginTop: 5 },
    retryText: { color: theme.charcoal, fontWeight: "900" },
  });
}
