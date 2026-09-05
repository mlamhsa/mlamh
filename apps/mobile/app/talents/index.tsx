import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, Platform, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";

import { PublisherTabBar } from "@/components/PublisherTabBar";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { darkTheme } from "@/lib/theme";
import { getMobileTalents, type MobilePublicTalent, type TalentDirectoryFilters } from "@/lib/talents";

const emptyFilters: TalentDirectoryFilters = { q: "", category: "", city: "", gender: "", nationality: "", ageMin: "", ageMax: "", heightMin: "", heightMax: "", page: 1 };

export default function TalentDirectoryScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [draft, setDraft] = useState<TalentDirectoryFilters>(emptyFilters);
  const [filters, setFilters] = useState<TalentDirectoryFilters>(emptyFilters);
  const [items, setItems] = useState<MobilePublicTalent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (targetPage = 1, append = false) => {
    if (append) setLoadingMore(true); else setLoading(true);
    setError(null);
    try {
      const result = await getMobileTalents(locale, { ...filters, page: targetPage });
      setItems((current) => append ? [...current, ...result.items.filter((next) => !current.some((item) => item.id === next.id))] : result.items);
      setTotal(result.total);
      setPage(result.currentPage);
      setTotalPages(result.totalPages);
    } catch {
      setError(isArabic ? "تعذر تحميل دليل المواهب الآن." : "We couldn't load the talent directory right now.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [filters, isArabic, locale]);

  useEffect(() => { void load(1, false); }, [load]);

  function applyFilters() {
    setFilters({ ...draft, page: 1 });
    setFiltersOpen(false);
  }

  function clearFilters() {
    setDraft(emptyFilters);
    setFilters(emptyFilters);
    setFiltersOpen(false);
  }

  const hasFilters = Object.entries(filters).some(([key, value]) => key !== "page" && Boolean(String(value ?? "").trim()));
  const resultLabel = isArabic ? `${total} موهبة` : `${total} talent${total === 1 ? "" : "s"}`;

  const header = <View style={[styles.headerWrap, { direction: isRtl ? "rtl" : "ltr" }]}>
    <View style={[styles.topRow, isRtl && styles.rowRtl]}>
      <View style={styles.brandGroup}><Text style={styles.brand}>{isArabic ? "ملامح" : "MLAMH"}</Text><Text style={styles.sectionTag}>{isArabic ? "دليل المواهب" : "TALENT DIRECTORY"}</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "إغلاق دليل المواهب" : "Close talent directory"} onPress={() => router.back()} hitSlop={10}><Text style={styles.close}>×</Text></Pressable>
    </View>
    <View style={styles.hero}>
      <Text accessibilityRole="header" style={[styles.title, { textAlign: isRtl ? "right" : "left" }]}>{isArabic ? "اكتشف المواهب المناسبة لمشروعك" : "Discover the right talent for your project"}</Text>
      <Text style={[styles.subtitle, { textAlign: isRtl ? "right" : "left" }]}>{isArabic ? "ممثلون ومودلز معتمدون، مع فلاتر تساعدك على الوصول للأنسب بسرعة." : "Approved actors and models with focused filters to help you find the right fit faster."}</Text>
    </View>
    <View style={[styles.searchRow, isRtl && styles.rowRtl]}>
      <TextInput
        value={draft.q ?? ""}
        onChangeText={(q) => setDraft((current) => ({ ...current, q }))}
        onSubmitEditing={applyFilters}
        returnKeyType="search"
        placeholder={isArabic ? "ابحث بالاسم أو المدينة" : "Search by name or city"}
        placeholderTextColor={theme.muted}
        style={[styles.searchInput, { textAlign: isRtl ? "right" : "left" }]}
        accessibilityLabel={isArabic ? "البحث في المواهب" : "Search talents"}
      />
      <Pressable accessibilityRole="button" onPress={() => setFiltersOpen((value) => !value)} style={[styles.filterButton, filtersOpen && styles.filterButtonActive]}><Text style={[styles.filterButtonText, filtersOpen && styles.filterButtonTextActive]}>{isArabic ? "تصفية" : "Filters"}</Text></Pressable>
    </View>
    <View style={[styles.quickFilters, isRtl && styles.rowRtl]}>
      {(["", "actor", "model"] as const).map((value) => <Pressable key={value || "all"} accessibilityRole="button" accessibilityState={{ selected: draft.category === value }} onPress={() => { const next = { ...draft, category: value }; setDraft(next); setFilters({ ...next, page: 1 }); }} style={[styles.chip, draft.category === value && styles.chipActive]}><Text style={[styles.chipText, draft.category === value && styles.chipTextActive]}>{value === "actor" ? (isArabic ? "ممثلون" : "Actors") : value === "model" ? (isArabic ? "مودلز" : "Models") : (isArabic ? "الكل" : "All")}</Text></Pressable>)}
      <Text style={styles.resultCount}>{resultLabel}</Text>
    </View>
    {filtersOpen ? <View style={styles.filterPanel}>
      <View style={[styles.twoColumn, isRtl && styles.rowRtl]}>
        <FilterInput value={draft.city ?? ""} onChange={(city) => setDraft((current) => ({ ...current, city }))} placeholder={isArabic ? "المدينة" : "City"} styles={styles} isRtl={isRtl} />
        <FilterInput value={draft.nationality ?? ""} onChange={(nationality) => setDraft((current) => ({ ...current, nationality }))} placeholder={isArabic ? "الجنسية" : "Nationality"} styles={styles} isRtl={isRtl} />
      </View>
      <View style={[styles.quickFilters, isRtl && styles.rowRtl]}>{(["", "male", "female"] as const).map((value) => <Pressable key={value || "any"} onPress={() => setDraft((current) => ({ ...current, gender: value }))} style={[styles.chip, draft.gender === value && styles.chipActive]}><Text style={[styles.chipText, draft.gender === value && styles.chipTextActive]}>{value === "male" ? (isArabic ? "ذكر" : "Male") : value === "female" ? (isArabic ? "أنثى" : "Female") : (isArabic ? "أي جنس" : "Any gender")}</Text></Pressable>)}</View>
      <Text style={[styles.rangeLabel, { textAlign: isRtl ? "right" : "left" }]}>{isArabic ? "العمر" : "Age"}</Text>
      <View style={[styles.twoColumn, isRtl && styles.rowRtl]}><FilterInput keyboard="numeric" value={draft.ageMin ?? ""} onChange={(ageMin) => setDraft((current) => ({ ...current, ageMin }))} placeholder={isArabic ? "من" : "Min"} styles={styles} isRtl={isRtl} /><FilterInput keyboard="numeric" value={draft.ageMax ?? ""} onChange={(ageMax) => setDraft((current) => ({ ...current, ageMax }))} placeholder={isArabic ? "إلى" : "Max"} styles={styles} isRtl={isRtl} /></View>
      <Text style={[styles.rangeLabel, { textAlign: isRtl ? "right" : "left" }]}>{isArabic ? "الطول (سم)" : "Height (cm)"}</Text>
      <View style={[styles.twoColumn, isRtl && styles.rowRtl]}><FilterInput keyboard="numeric" value={draft.heightMin ?? ""} onChange={(heightMin) => setDraft((current) => ({ ...current, heightMin }))} placeholder={isArabic ? "من" : "Min"} styles={styles} isRtl={isRtl} /><FilterInput keyboard="numeric" value={draft.heightMax ?? ""} onChange={(heightMax) => setDraft((current) => ({ ...current, heightMax }))} placeholder={isArabic ? "إلى" : "Max"} styles={styles} isRtl={isRtl} /></View>
      <View style={[styles.filterActions, isRtl && styles.rowRtl]}><Pressable onPress={applyFilters} style={styles.applyButton}><Text style={styles.applyButtonText}>{isArabic ? "عرض النتائج" : "Show results"}</Text></Pressable><Pressable onPress={clearFilters} style={styles.clearButton}><Text style={styles.clearButtonText}>{isArabic ? "مسح" : "Clear"}</Text></Pressable></View>
    </View> : null}
    {hasFilters ? <Text style={[styles.filterHint, { textAlign: isRtl ? "right" : "left" }]}>{isArabic ? "النتائج مرتبة حسب المطابقة مع فلاترك الحالية." : "Results reflect your current filters."}</Text> : null}
  </View>;

  return <View style={styles.screen}>
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => <TalentCard item={item} locale={locale} styles={styles} />}
      ListHeaderComponent={header}
      ListEmptyComponent={loading ? <View style={styles.loadingState}><ActivityIndicator color={theme.accent} /><Text style={styles.loadingText}>{isArabic ? "جارٍ تجهيز المواهب…" : "Loading talents…"}</Text></View> : error ? <View style={styles.emptyState}><Text style={styles.emptyTitle}>{error}</Text><Pressable onPress={() => void load(1, false)} style={styles.retryButton}><Text style={styles.retryText}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text></Pressable></View> : <View style={styles.emptyState}><Text style={styles.emptyTitle}>{isArabic ? "لا توجد مواهب مطابقة" : "No matching talents"}</Text><Text style={styles.emptyBody}>{isArabic ? "جرّب توسيع نطاق البحث أو إزالة بعض الفلاتر." : "Broaden your search or remove a few filters."}</Text></View>}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(1, false); }} tintColor={theme.accent} colors={[theme.accent]} />}
      onEndReached={() => { if (!loading && !loadingMore && page < totalPages) void load(page + 1, true); }}
      onEndReachedThreshold={0.35}
      ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footerLoader} color={theme.accent} /> : <View style={styles.footerSpace} />}
      showsVerticalScrollIndicator={false}
    />
    <PublisherTabBar active="talents" locale={locale} theme={theme} />
  </View>;
}

function FilterInput({ value, onChange, placeholder, styles, isRtl, keyboard }: { value: string; onChange: (value: string) => void; placeholder: string; styles: ReturnType<typeof createStyles>; isRtl: boolean; keyboard?: "numeric" }) {
  return <TextInput value={value} onChangeText={onChange} keyboardType={keyboard} placeholder={placeholder} placeholderTextColor="#6B6B6B" style={[styles.filterInput, { textAlign: isRtl ? "right" : "left" }]} />;
}

function TalentCard({ item, locale, styles }: { item: MobilePublicTalent; locale: "ar" | "en"; styles: ReturnType<typeof createStyles> }) {
  const isArabic = locale === "ar";
  const facts = [item.city, item.age ? `${item.age}` : null, item.heightCm ? `${item.heightCm} cm` : null].filter(Boolean).join(" · ");
  return <Pressable accessibilityRole="button" accessibilityLabel={`${item.name}, ${item.role === "actor" ? (isArabic ? "ممثل" : "Actor") : (isArabic ? "مودل" : "Model")}`} onPress={() => router.push(`/talents/${encodeURIComponent(item.slug)}`)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
    <View style={styles.photoWrap}>{item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.photo} resizeMode="cover" /> : <View style={styles.photoFallback}><Text style={styles.photoInitial}>{item.name.slice(0, 1).toUpperCase()}</Text></View>}{item.featured ? <View style={styles.featuredBadge}><Text style={styles.featuredText}>{isArabic ? "مميز" : "FEATURED"}</Text></View> : null}</View>
    <View style={styles.cardBody}><View style={styles.nameRow}><Text numberOfLines={1} style={styles.name}>{item.name}</Text>{item.verified ? <Text style={styles.verified}>✓</Text> : null}</View><Text style={styles.role}>{item.role === "actor" ? (isArabic ? "ممثل" : "Actor") : (isArabic ? "مودل" : "Model")}</Text>{facts ? <Text style={styles.facts}>{facts}</Text> : null}{item.bio ? <Text numberOfLines={2} style={styles.bio}>{item.bio}</Text> : null}</View>
  </Pressable>;
}

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, listContent: { paddingBottom: 8 }, headerWrap: { width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: 20, paddingTop: Platform.OS === "ios" ? 22 : 28, paddingBottom: 18, gap: 16 }, topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, rowRtl: { flexDirection: "row-reverse" }, brandGroup: { gap: 2 }, brand: { color: theme.accent, fontSize: 18, fontWeight: "900", letterSpacing: 1.1 }, sectionTag: { color: theme.muted, fontSize: 9, fontWeight: "700", letterSpacing: 1.3 }, close: { color: theme.text, fontSize: 30, lineHeight: 34, fontWeight: "300" }, hero: { gap: 7, paddingTop: 8 }, title: { color: theme.text, fontSize: 29, lineHeight: 36, fontWeight: "800" }, subtitle: { color: theme.muted, fontSize: 13, lineHeight: 21, maxWidth: 560 }, searchRow: { flexDirection: "row", gap: 9 }, searchInput: { flex: 1, minHeight: 50, borderRadius: 12, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, color: theme.text, paddingHorizontal: 14, fontSize: 14 }, filterButton: { minWidth: 76, minHeight: 50, borderRadius: 12, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 }, filterButtonActive: { borderColor: theme.accent, backgroundColor: theme.chip }, filterButtonText: { color: theme.muted, fontSize: 12, fontWeight: "800" }, filterButtonTextActive: { color: theme.text }, quickFilters: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 7 }, chip: { borderRadius: 999, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, paddingHorizontal: 12, paddingVertical: 8 }, chipActive: { borderColor: theme.accent, backgroundColor: theme.chip }, chipText: { color: theme.muted, fontSize: 11, fontWeight: "700" }, chipTextActive: { color: theme.text }, resultCount: { color: theme.muted, fontSize: 10, marginStart: "auto" }, filterPanel: { borderWidth: 1, borderColor: theme.border, borderRadius: 16, backgroundColor: theme.surface, padding: 14, gap: 10 }, twoColumn: { flexDirection: "row", gap: 8 }, filterInput: { flex: 1, minHeight: 46, borderRadius: 10, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.background, color: theme.text, paddingHorizontal: 12, fontSize: 12 }, rangeLabel: { color: theme.text, fontSize: 11, fontWeight: "800", marginTop: 2 }, filterActions: { flexDirection: "row", gap: 8, marginTop: 3 }, applyButton: { flex: 1, minHeight: 46, borderRadius: 10, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" }, applyButtonText: { color: theme.background, fontSize: 12, fontWeight: "900" }, clearButton: { minWidth: 76, minHeight: 46, borderRadius: 10, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center", paddingHorizontal: 14 }, clearButtonText: { color: theme.text, fontSize: 11, fontWeight: "800" }, filterHint: { color: theme.muted, fontSize: 10, lineHeight: 16 }, separator: { height: 10 }, card: { width: "auto", maxWidth: 720, marginHorizontal: 20, alignSelf: "stretch", flexDirection: "row", minHeight: 128, borderWidth: 1, borderColor: theme.border, borderRadius: 16, backgroundColor: theme.surface, overflow: "hidden" }, photoWrap: { width: 112, minHeight: 128, backgroundColor: theme.grayElevated }, photo: { width: "100%", height: "100%" }, photoFallback: { flex: 1, alignItems: "center", justifyContent: "center" }, photoInitial: { color: theme.accent, fontSize: 34, fontWeight: "800" }, featuredBadge: { position: "absolute", left: 7, top: 7, borderRadius: 999, backgroundColor: theme.accent, paddingHorizontal: 7, paddingVertical: 4 }, featuredText: { color: theme.background, fontSize: 7, fontWeight: "900", letterSpacing: 0.8 }, cardBody: { flex: 1, padding: 14, gap: 4, justifyContent: "center" }, nameRow: { flexDirection: "row", alignItems: "center", gap: 6 }, name: { flexShrink: 1, color: theme.text, fontSize: 17, fontWeight: "800" }, verified: { color: theme.accent, fontSize: 13, fontWeight: "900" }, role: { color: theme.accent, fontSize: 10, fontWeight: "800", textTransform: "uppercase" }, facts: { color: theme.muted, fontSize: 11, lineHeight: 17 }, bio: { color: theme.muted, fontSize: 11, lineHeight: 17, marginTop: 2 }, loadingState: { paddingVertical: 70, alignItems: "center", gap: 12 }, loadingText: { color: theme.muted, fontSize: 12 }, emptyState: { marginHorizontal: 20, marginTop: 26, borderWidth: 1, borderColor: theme.border, borderRadius: 16, backgroundColor: theme.surface, padding: 24, alignItems: "center", gap: 9 }, emptyTitle: { color: theme.text, fontSize: 16, fontWeight: "800", textAlign: "center" }, emptyBody: { color: theme.muted, fontSize: 12, lineHeight: 19, textAlign: "center" }, retryButton: { marginTop: 4, minHeight: 42, borderRadius: 10, backgroundColor: theme.accent, paddingHorizontal: 18, alignItems: "center", justifyContent: "center" }, retryText: { color: theme.background, fontSize: 12, fontWeight: "900" }, footerLoader: { paddingVertical: 24 }, footerSpace: { height: 24 }, pressed: { opacity: 0.75 },
}); }
