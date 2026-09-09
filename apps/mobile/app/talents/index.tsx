import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { Filter, Search, ShieldCheck } from "lucide-react-native";

import { PublisherTabBar } from "@/components/PublisherTabBar";
import { formatLatinNumber, isRtlLocale, toLatinDigits } from "@/lib/i18n";
import { useAppLocale } from "@/lib/locale-context";
import { darkTheme } from "@/lib/theme";
import { getMobileTalents, type MobilePublicTalent, type TalentDirectoryFilters } from "@/lib/talents";

const EMPTY_FILTERS: TalentDirectoryFilters = {
  q: "",
  category: "",
  city: "",
  gender: "",
  nationality: "",
  ageMin: "",
  ageMax: "",
  heightMin: "",
  heightMax: "",
  page: 1,
};

export default function TalentDirectoryScreen() {
  const { locale } = useAppLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const [draft, setDraft] = useState<TalentDirectoryFilters>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<TalentDirectoryFilters>(EMPTY_FILTERS);
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
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await getMobileTalents(locale, { ...filters, page: targetPage });
      setItems((current) => append
        ? [...current, ...result.items.filter((next) => !current.some((item) => item.id === next.id))]
        : result.items);
      setTotal(result.total);
      setPage(result.currentPage);
      setTotalPages(result.totalPages);
    } catch {
      setError(isArabic ? "تعذر تحميل المواهب الآن." : "Unable to load talent right now.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [filters, isArabic, locale]);

  useEffect(() => { void load(); }, [load]);

  function applyFilters() {
    setFilters({ ...draft, page: 1 });
    setFiltersOpen(false);
  }

  function clearFilters() {
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setFiltersOpen(false);
  }

  function setCategory(value: "" | "actor" | "model") {
    const next = { ...draft, category: value, page: 1 };
    setDraft(next);
    setFilters(next);
  }

  const header = (
    <View style={styles.header}>
      <View style={[styles.brandRow, isRtl && styles.rowRtl]}>
        <View style={styles.flex}>
          <Text style={[styles.brand, directionText(isRtl)]}>{isArabic ? "ملامح للأعمال" : "MLAMH FOR BUSINESS"}</Text>
          <Text style={[styles.title, directionText(isRtl)]}>{isArabic ? "اكتشف المواهب" : "Discover talent"}</Text>
          <Text style={[styles.subtitle, directionText(isRtl)]}>
            {isArabic
              ? "اكتشف المواهب المناسبة لمشروعك مع بحث احترافي وحماية كاملة لبيانات التواصل."
              : "Professional discovery without exposing private contact details. Access expands with trust and project context."}
          </Text>
        </View>
        <View style={styles.shield}><ShieldCheck size={22} color={darkTheme.accent} /></View>
      </View>

      <View style={[styles.searchRow, isRtl && styles.rowRtl]}>
        <View style={[styles.searchBox, isRtl && styles.rowRtl]}>
          <Search size={18} color={darkTheme.muted} />
          <TextInput
            value={draft.q ?? ""}
            onChangeText={(q) => setDraft((current) => ({ ...current, q }))}
            onSubmitEditing={applyFilters}
            placeholder={isArabic ? "الاسم، المدينة أو المهارة" : "Name, city or skill"}
            placeholderTextColor={darkTheme.muted}
            style={[styles.searchInput, directionText(isRtl)]}
          />
        </View>
        <Pressable onPress={() => setFiltersOpen((value) => !value)} style={[styles.filterButton, filtersOpen && styles.filterButtonActive]}>
          <Filter size={18} color={filtersOpen ? darkTheme.background : darkTheme.accent} />
        </Pressable>
      </View>

      <View style={[styles.chips, isRtl && styles.rowRtl]}>
        {(["", "actor", "model"] as const).map((value) => (
          <Pressable key={value || "all"} onPress={() => setCategory(value)} style={[styles.chip, draft.category === value && styles.chipActive]}>
            <Text style={[styles.chipText, draft.category === value && styles.chipTextActive]}>
              {value === "actor" ? (isArabic ? "ممثلون" : "Actors") : value === "model" ? (isArabic ? "مودلز" : "Models") : (isArabic ? "الكل" : "All")}
            </Text>
          </Pressable>
        ))}

      </View>

      {filtersOpen ? (
        <View style={styles.filterPanel}>
          <View style={[styles.twoColumns, isRtl && styles.rowRtl]}>
            <FilterInput value={draft.city ?? ""} onChange={(city) => setDraft((current) => ({ ...current, city }))} placeholder={isArabic ? "المدينة" : "City"} isRtl={isRtl} />
            <FilterInput value={draft.nationality ?? ""} onChange={(nationality) => setDraft((current) => ({ ...current, nationality }))} placeholder={isArabic ? "الجنسية" : "Nationality"} isRtl={isRtl} />
          </View>
          <View style={[styles.chips, isRtl && styles.rowRtl]}>
            {(["", "male", "female"] as const).map((value) => (
              <Pressable key={value || "any"} onPress={() => setDraft((current) => ({ ...current, gender: value }))} style={[styles.chip, draft.gender === value && styles.chipActive]}>
                <Text style={[styles.chipText, draft.gender === value && styles.chipTextActive]}>
                  {value === "male" ? (isArabic ? "ذكر" : "Male") : value === "female" ? (isArabic ? "أنثى" : "Female") : (isArabic ? "أي جنس" : "Any gender")}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.filterLabel, directionText(isRtl)]}>{isArabic ? "العمر" : "Age"}</Text>
          <View style={[styles.twoColumns, isRtl && styles.rowRtl]}>
            <FilterInput value={draft.ageMin ?? ""} onChange={(ageMin) => setDraft((current) => ({ ...current, ageMin: numeric(ageMin) }))} placeholder={isArabic ? "من" : "Min"} isRtl={isRtl} technical />
            <FilterInput value={draft.ageMax ?? ""} onChange={(ageMax) => setDraft((current) => ({ ...current, ageMax: numeric(ageMax) }))} placeholder={isArabic ? "إلى" : "Max"} isRtl={isRtl} technical />
          </View>
          <View style={[styles.filterActions, isRtl && styles.rowRtl]}>
            <Pressable onPress={applyFilters} style={styles.primaryButton}><Text style={styles.primaryText}>{isArabic ? "عرض النتائج" : "Show results"}</Text></Pressable>
            <Pressable onPress={clearFilters} style={styles.secondaryButton}><Text style={styles.secondaryText}>{isArabic ? "مسح" : "Clear"}</Text></Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );

  let emptyState: React.ReactElement | null = null;
  if (loading) {
    emptyState = <View style={styles.state}><ActivityIndicator color={darkTheme.accent} /><Text style={styles.stateText}>{isArabic ? "جارٍ تجهيز المواهب…" : "Loading talent…"}</Text></View>;
  } else if (error) {
    emptyState = <View style={styles.state}><Text style={[styles.error, directionText(isRtl)]}>{error}</Text><Pressable onPress={() => void load()} style={styles.secondaryButton}><Text style={styles.secondaryText}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text></Pressable></View>;
  } else if (items.length === 0) {
    emptyState = <View style={styles.state}><Text style={[styles.emptyTitle, directionText(isRtl)]}>{isArabic ? "لا توجد نتائج مطابقة" : "No matching talent"}</Text><Text style={[styles.subtitle, directionText(isRtl)]}>{isArabic ? "وسّع البحث أو قلّل عدد الفلاتر." : "Broaden the search or remove a filter."}</Text></View>;
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={header}
        renderItem={({ item }) => <TalentCard item={item} locale={locale} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.content}
        ListEmptyComponent={emptyState}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(1, false); }} tintColor={darkTheme.accent} />}
        onEndReached={() => { if (!loading && !loadingMore && page < totalPages) void load(page + 1, true); }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.loader} color={darkTheme.accent} /> : <View style={styles.footerSpace} />}
        showsVerticalScrollIndicator={false}
      />
      <PublisherTabBar active="talents" locale={locale} />
    </View>
  );
}

function TalentCard({ item, locale }: { item: MobilePublicTalent; locale: "ar" | "en" }) {
  const isArabic = locale === "ar";
  const facts = [
    item.city,
    item.age != null ? (isArabic ? `${formatLatinNumber(item.age, "ar")} سنة` : `${formatLatinNumber(item.age, "en")} yrs`) : null,
    item.heightCm != null ? `${formatLatinNumber(item.heightCm, locale)} cm` : null,
  ].filter(Boolean).join(" · ");

  return (
    <Pressable onPress={() => router.push(`/talents/${encodeURIComponent(item.slug)}`)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.photoWrap}>
        {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.photo} resizeMode="cover" /> : <View style={styles.photoFallback}><Text style={styles.photoInitial}>{item.name.slice(0, 1).toUpperCase()}</Text></View>}
        {item.featured ? <View style={styles.featured}><Text style={styles.featuredText}>{isArabic ? "مميز" : "FEATURED"}</Text></View> : null}
      </View>
      <View style={[styles.cardBody, { alignItems: isArabic ? "flex-end" : "flex-start" }]}>
        <View style={[styles.nameRow, isArabic && styles.rowRtl]}>
          <Text numberOfLines={2} style={[styles.name, directionText(isArabic)]}>{item.name}</Text>
          {item.verified ? <View style={styles.verified}><ShieldCheck size={12} color={darkTheme.accent} /><Text style={styles.verifiedText}>{isArabic ? "معتمد" : "Verified"}</Text></View> : null}
        </View>
        <Text style={[styles.role, directionText(isArabic)]}>{item.role === "actor" ? (isArabic ? "ممثل" : "Actor") : (isArabic ? "مودل" : "Model")}</Text>
        {facts ? <Text numberOfLines={2} style={[styles.facts, directionText(isArabic)]}>{facts}</Text> : null}
        {item.bio ? <Text numberOfLines={2} style={[styles.bio, directionText(isArabic)]}>{item.bio}</Text> : null}
        <View style={styles.privacyLine} />
        <View style={[styles.cardFooter, isArabic && styles.rowRtl]}>
          <Text style={[styles.privateHint, directionText(isArabic)]}>{isArabic ? "بيانات التواصل محمية" : "Contact details protected"}</Text>
          <Text style={styles.viewProfile}>{isArabic ? "عرض الملف" : "View profile"}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function FilterInput({ value, onChange, placeholder, isRtl, technical = false }: { value: string; onChange: (value: string) => void; placeholder: string; isRtl: boolean; technical?: boolean }) {
  return <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={darkTheme.muted} textAlign={technical ? "left" : isRtl ? "right" : "left"} style={[styles.filterInput, technical ? styles.technical : directionText(isRtl)]} />;
}

function numeric(value: string) { return toLatinDigits(value).replace(/[^0-9]/g, ""); }
function directionText(isRtl: boolean) { return { textAlign: isRtl ? "right" as const : "left" as const, writingDirection: isRtl ? "rtl" as const : "ltr" as const }; }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: darkTheme.background },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 108 },
  header: { gap: 14, marginBottom: 18 },
  brandRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  rowRtl: { flexDirection: "row-reverse" },
  flex: { flex: 1 },
  brand: { color: darkTheme.accent, fontSize: 11, fontWeight: "900" },
  title: { color: darkTheme.text, fontSize: 28, lineHeight: 34, fontWeight: "900", marginTop: 4 },
  subtitle: { color: darkTheme.muted, fontSize: 12, lineHeight: 19 },
  shield: { width: 44, height: 44, borderRadius: 15, borderWidth: 1, borderColor: "#C9A96244", backgroundColor: "#C9A9620D", alignItems: "center", justifyContent: "center" },
  searchRow: { flexDirection: "row", gap: 8 },
  searchBox: { flex: 1, minHeight: 50, borderWidth: 1, borderColor: darkTheme.border, borderRadius: 15, backgroundColor: darkTheme.surface, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 8 },
  searchInput: { flex: 1, color: darkTheme.text, fontSize: 14 },
  filterButton: { width: 50, height: 50, borderRadius: 15, borderWidth: 1, borderColor: "#C9A96255", alignItems: "center", justifyContent: "center" },
  filterButtonActive: { backgroundColor: darkTheme.accent },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  chip: { minHeight: 36, borderRadius: 999, borderWidth: 1, borderColor: darkTheme.border, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" },
  chipActive: { borderColor: darkTheme.accent, backgroundColor: "#C9A96212" },
  chipText: { color: darkTheme.muted, fontSize: 10, fontWeight: "800" },
  chipTextActive: { color: darkTheme.accent },
  count: { marginStart: "auto", color: darkTheme.muted, fontSize: 10 },
  filterPanel: { gap: 12, padding: 14, borderWidth: 1, borderColor: darkTheme.border, borderRadius: 18, backgroundColor: darkTheme.surface },
  twoColumns: { flexDirection: "row", gap: 8 },
  filterInput: { flex: 1, minHeight: 46, borderWidth: 1, borderColor: darkTheme.border, borderRadius: 13, backgroundColor: darkTheme.background, color: darkTheme.text, paddingHorizontal: 12 },
  technical: { writingDirection: "ltr" },
  filterLabel: { color: darkTheme.muted, fontSize: 11, fontWeight: "700" },
  filterActions: { flexDirection: "row", gap: 8 },
  primaryButton: { flex: 1, minHeight: 44, borderRadius: 13, backgroundColor: darkTheme.accent, alignItems: "center", justifyContent: "center" },
  primaryText: { color: darkTheme.background, fontWeight: "900" },
  secondaryButton: { minHeight: 44, borderRadius: 13, borderWidth: 1, borderColor: darkTheme.border, paddingHorizontal: 14, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: darkTheme.text, fontWeight: "800" },
  separator: { height: 12 },
  card: { height: 210, borderWidth: 1, borderColor: darkTheme.border, borderRadius: 22, backgroundColor: darkTheme.surface, overflow: "hidden", flexDirection: "row" },
  pressed: { opacity: 0.72 },
  photoWrap: { width: 142, height: "100%", position: "relative", backgroundColor: darkTheme.background },
  photo: { width: "100%", height: "100%" },
  photoFallback: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#C9A9620A" },
  photoInitial: { color: darkTheme.accent, fontSize: 34, fontWeight: "900" },
  featured: { position: "absolute", top: 10, left: 10, borderRadius: 999, backgroundColor: darkTheme.accent, paddingHorizontal: 8, paddingVertical: 4 },
  featuredText: { color: darkTheme.background, fontSize: 8, fontWeight: "900" },
  cardBody: { flex: 1, minWidth: 0, padding: 14, gap: 5, justifyContent: "center" },
  nameRow: { width: "100%", flexDirection: "row", alignItems: "center", gap: 7 },
  name: { flex: 1, color: darkTheme.text, fontSize: 17, fontWeight: "900" },
  verified: { flexDirection: "row", alignItems: "center", gap: 3, borderWidth: 1, borderColor: "#C9A96255", borderRadius: 999, paddingHorizontal: 6, paddingVertical: 3 },
  verifiedText: { color: darkTheme.accent, fontSize: 7, fontWeight: "900" },
  role: { width: "100%", color: darkTheme.accent, fontSize: 11, fontWeight: "800" },
  facts: { width: "100%", color: darkTheme.text, fontSize: 10, lineHeight: 16 },
  bio: { width: "100%", color: darkTheme.muted, fontSize: 10, lineHeight: 16 },
  privacyLine: { width: "100%", height: 1, backgroundColor: darkTheme.border, marginTop: 3 },
  cardFooter: { width: "100%", flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 2 },
  privateHint: { flex: 1, color: darkTheme.muted, fontSize: 8 },
  viewProfile: { color: darkTheme.accent, fontSize: 10, fontWeight: "900" },
  state: { minHeight: 220, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  stateText: { color: darkTheme.muted },
  error: { color: "#E59A9A", fontSize: 12 },
  emptyTitle: { color: darkTheme.text, fontSize: 16, fontWeight: "800" },
  loader: { marginVertical: 18 },
  footerSpace: { height: 18 },
});
