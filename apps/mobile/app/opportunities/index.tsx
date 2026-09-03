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

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const market = await resolveMobileMarket();
      const [response, notifications] = await Promise.all([
        getPublicOpportunities(locale, market),
        getNotifications().catch(() => null),
      ]);
      setItems(response.items);
      setUnreadCount(notifications?.unreadCount ?? 0);
    } catch {
      setError(locale === "ar" ? "تعذر تحميل الفرص الآن." : "Unable to load opportunities right now.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [locale]);

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
        ListHeaderComponent={<>
          <View style={[styles.hero, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]}>
            <View style={styles.brandRow}><Text style={styles.brand}>MLAMH</Text><Text style={styles.heroPill}>{locale === "ar" ? "منصة المواهب الإبداعية" : "Creative talent platform"}</Text></View>
            <Text style={styles.heroTitle}>{locale === "ar" ? "اكتشف فرصتك القادمة" : "Discover your next opportunity"}</Text>
            <Text style={styles.heroBody}>{locale === "ar" ? "فرص حقيقية للمواهب، من مكان واحد وبطريقة أسرع." : "Real opportunities for talent, all in one place and easier to discover."}</Text>
            <View style={styles.searchBox}><TextInput value={query} onChangeText={setQuery} placeholder={locale === "ar" ? "ابحث عن فرصة، مدينة أو جهة…" : "Search opportunity, city or company…"} placeholderTextColor={theme.muted} style={styles.searchInput} /><Text style={styles.searchGlyph}>⌕</Text></View>
            <View style={styles.filters}><FilterChip active={filter === "all"} label={locale === "ar" ? "الكل" : "All"} onPress={() => setFilter("all")} styles={styles} /><FilterChip active={filter === "actor"} label={locale === "ar" ? "تمثيل" : "Acting"} onPress={() => setFilter("actor")} styles={styles} /><FilterChip active={filter === "model"} label={locale === "ar" ? "مودل" : "Modeling"} onPress={() => setFilter("model")} styles={styles} /></View>
          </View>

          {featured.length > 0 ? <View style={styles.sectionBlock}><View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{locale === "ar" ? "فرص مميزة" : "Featured opportunities"}</Text><Text style={styles.sectionHint}>{featured.length}</Text></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredRow}>{featured.map((item) => <FeaturedCard key={item.id} item={item} locale={locale} styles={styles} />)}</ScrollView></View> : null}

          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{locale === "ar" ? "أحدث الفرص" : "Latest opportunities"}</Text><Text style={styles.sectionHint}>{filtered.length}</Text></View>
        </>}
        ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyTitle}>{error ?? (locale === "ar" ? "لا توجد نتائج مطابقة حاليًا." : "No matching opportunities right now.")}</Text>{error ? <Pressable style={styles.retryButton} onPress={() => void load()}><Text style={styles.retryText}>{locale === "ar" ? "إعادة المحاولة" : "Try again"}</Text></Pressable> : null}</View>}
        renderItem={({ item }) => <OpportunityCard item={item} locale={locale} styles={styles} />}
      />
      <AppTabBar active="discover" locale={locale} theme={theme} notificationCount={unreadCount} />
    </View>
  );
}

function FilterChip({ active, label, onPress, styles }: { active: boolean; label: string; onPress: () => void; styles: ReturnType<typeof createStyles> }) { return <Pressable onPress={onPress} style={[styles.filterChip, active && styles.filterChipActive]}><Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text></Pressable>; }
function FeaturedCard({ item, locale, styles }: { item: MobileOpportunity; locale: "ar" | "en"; styles: ReturnType<typeof createStyles> }) { return <Pressable onPress={() => router.push(`/opportunities/${item.slug}`)} style={({ pressed }) => [styles.featuredCard, pressed && styles.pressed]}><Text style={styles.featuredTag}>{locale === "ar" ? "مميزة" : "Featured"}</Text><Text numberOfLines={2} style={styles.featuredTitle}>{item.title}</Text><Text style={styles.company}>{item.companyName}</Text><Text style={styles.meta}>{[item.city, item.opportunityType.replaceAll("_", " ")].filter(Boolean).join(" · ")}</Text></Pressable>; }
function OpportunityCard({ item, locale, styles }: { item: MobileOpportunity; locale: "ar" | "en"; styles: ReturnType<typeof createStyles> }) { return <Pressable onPress={() => router.push(`/opportunities/${item.slug}`)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}><View style={styles.cardTop}><Text style={styles.type}>{item.opportunityType.replaceAll("_", " ")}</Text>{item.city ? <Text style={styles.meta}>{item.city}</Text> : null}</View><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.company}>{item.companyName}</Text><Text numberOfLines={2} style={styles.description}>{item.description}</Text><Text style={styles.openLabel}>{locale === "ar" ? "عرض الفرصة ←" : "View opportunity →"}</Text></Pressable>; }

function createStyles(theme: typeof lightTheme | typeof darkTheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background }, centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }, content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 24, gap: 13 },
    hero: { marginTop: 30, borderRadius: 30, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, padding: 22, gap: 15 }, brandRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }, brand: { color: theme.accent, fontSize: 14, fontWeight: "800", letterSpacing: 2.2 }, heroPill: { color: theme.accent, borderWidth: 1, borderColor: theme.accent, borderRadius: 16, overflow: "hidden", paddingHorizontal: 10, paddingVertical: 6, fontSize: 10 }, heroTitle: { color: theme.text, fontSize: 38, lineHeight: 46, fontWeight: "300" }, heroBody: { color: theme.muted, fontSize: 14, lineHeight: 23 },
    searchBox: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: theme.border, borderRadius: 20, backgroundColor: theme.background, paddingHorizontal: 14 }, searchInput: { flex: 1, color: theme.text, fontSize: 14, paddingVertical: 15 }, searchGlyph: { color: theme.accent, fontSize: 24 }, filters: { flexDirection: "row", gap: 8, flexWrap: "wrap" }, filterChip: { borderWidth: 1, borderColor: theme.border, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 9 }, filterChipActive: { backgroundColor: theme.accent, borderColor: theme.accent }, filterText: { color: theme.muted, fontSize: 12, fontWeight: "600" }, filterTextActive: { color: "#181818" },
    sectionBlock: { gap: 12, marginTop: 7 }, sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 }, sectionTitle: { color: theme.text, fontSize: 21, fontWeight: "500" }, sectionHint: { color: theme.muted, fontSize: 12 }, featuredRow: { gap: 10 }, featuredCard: { width: 270, minHeight: 190, borderRadius: 25, borderWidth: 1, borderColor: theme.accent, backgroundColor: theme.surface, padding: 18, gap: 10, justifyContent: "flex-end" }, featuredTag: { alignSelf: "flex-start", color: "#181818", backgroundColor: theme.accent, borderRadius: 13, overflow: "hidden", paddingHorizontal: 9, paddingVertical: 5, fontSize: 10, fontWeight: "800" }, featuredTitle: { color: theme.text, fontSize: 23, lineHeight: 29, fontWeight: "500" },
    card: { borderRadius: 24, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, padding: 18, gap: 9 }, cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }, type: { color: theme.accent, fontSize: 11, textTransform: "uppercase", letterSpacing: 1.1 }, cardTitle: { color: theme.text, fontSize: 22, lineHeight: 29, fontWeight: "400" }, company: { color: theme.accent, fontSize: 13, fontWeight: "700" }, meta: { color: theme.muted, fontSize: 11 }, description: { color: theme.muted, fontSize: 13, lineHeight: 20 }, openLabel: { color: theme.text, fontSize: 12, fontWeight: "700", marginTop: 4 }, pressed: { opacity: 0.72, transform: [{ scale: 0.995 }] },
    emptyState: { paddingVertical: 60, alignItems: "center", gap: 16 }, emptyTitle: { color: theme.text, fontSize: 17, textAlign: "center" }, retryButton: { borderRadius: 16, backgroundColor: theme.accent, paddingHorizontal: 20, paddingVertical: 12 }, retryText: { color: "#181818", fontWeight: "700" },
  });
}
