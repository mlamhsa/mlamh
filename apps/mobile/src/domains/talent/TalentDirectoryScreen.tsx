import { router } from "expo-router";
import { BadgeCheck, Filter, MapPin, Search, SlidersHorizontal, UserRound } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";

import { getMobileTalents } from "@/src/domains/talent/api";
import type { MobilePublicTalent } from "@/src/domains/talent/types";
import { useLocale } from "@/src/i18n/LocaleProvider";
import { colors, radius, spacing } from "@/src/theme/tokens";

const PAGE_SIZE = 20;

type RoleFilter = "all" | "actor" | "model";

export function TalentDirectoryScreen() {
  const { locale } = useLocale();
  const isArabic = locale === "ar";
  const align = isArabic ? "right" : "left";
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [items, setItems] = useState<MobilePublicTalent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const response = await getMobileTalents(locale, {
        page: 1,
        pageSize: PAGE_SIZE,
        q: query,
        category: role === "all" ? undefined : role,
      });
      if (!response.ok) throw new Error(response.code);
      setItems(response.items);
      setTotal(response.total);
    } catch {
      setError(isArabic ? "تعذر تحميل المواهب الآن." : "Unable to load talent right now.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isArabic, locale, query, role]);

  useEffect(() => {
    const handle = setTimeout(() => void load(false), 250);
    return () => clearTimeout(handle);
  }, [load]);

  const header = useMemo(() => (
    <View>
      <View style={styles.hero}>
        <View style={[styles.badge, isArabic ? styles.rowRtl : styles.rowLtr]}>
          <UserRound size={14} color={colors.gold} />
          <Text style={styles.badgeText}>{isArabic ? "دليل المواهب" : "TALENT DIRECTORY"}</Text>
        </View>
        <Text style={[styles.title, { textAlign: align }]}>{isArabic ? "اكتشف المواهب" : "Discover talent"}</Text>
        <Text style={[styles.subtitle, { textAlign: align }]}>
          {isArabic
            ? "ابحث بين الملفات المنشورة واكتشف الوجه المناسب لمشروعك."
            : "Browse published profiles and discover the right face for your project."}
        </Text>
        <View style={[styles.statRow, isArabic ? styles.rowRtl : styles.rowLtr]}>
          <Text style={styles.statValue}>{total}</Text>
          <Text style={styles.statLabel}>{isArabic ? "موهبة منشورة" : "published talent"}</Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Search size={19} color={colors.gold} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={isArabic ? "ابحث بالاسم أو المدينة..." : "Search by name or city..."}
          placeholderTextColor="rgba(255,255,255,0.28)"
          style={[styles.searchInput, { textAlign: align }]}
          autoCorrect={false}
          returnKeyType="search"
        />
        <SlidersHorizontal size={17} color={colors.textMuted} />
      </View>

      <View style={[styles.filters, isArabic ? styles.rowRtl : styles.rowLtr]}>
        <FilterChip active={role === "all"} label={isArabic ? "الكل" : "All"} onPress={() => setRole("all")} />
        <FilterChip active={role === "actor"} label={isArabic ? "ممثل" : "Actor"} onPress={() => setRole("actor")} />
        <FilterChip active={role === "model"} label={isArabic ? "مودل" : "Model"} onPress={() => setRole("model")} />
      </View>

      <View style={[styles.resultHeader, isArabic ? styles.rowRtl : styles.rowLtr]}>
        <Text style={styles.resultTitle}>{isArabic ? "الملفات" : "Profiles"}</Text>
        <Text style={styles.resultCount}>{items.length}/{total}</Text>
      </View>
    </View>
  ), [align, isArabic, items.length, query, role, total]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.columns}
        contentContainerStyle={styles.content}
        ListHeaderComponent={header}
        renderItem={({ item }) => <TalentCard talent={item} isArabic={isArabic} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.gold} />}
        ListEmptyComponent={loading ? (
          <View style={styles.stateCard}><ActivityIndicator color={colors.gold} /><Text style={styles.stateText}>{isArabic ? "جارٍ تحميل المواهب..." : "Loading talent..."}</Text></View>
        ) : error ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>{error}</Text>
            <Pressable onPress={() => void load(false)} style={styles.retryButton}><Text style={styles.retryText}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text></Pressable>
          </View>
        ) : (
          <View style={styles.stateCard}><Text style={styles.stateTitle}>{isArabic ? "لا توجد نتائج" : "No results"}</Text><Text style={styles.stateText}>{isArabic ? "جرّب تغيير البحث أو الفلتر." : "Try changing your search or filter."}</Text></View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function FilterChip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function TalentCard({ talent, isArabic }: { talent: MobilePublicTalent; isArabic: boolean }) {
  const role = talent.role === "actor" ? (isArabic ? "ممثل" : "Actor") : talent.role === "model" ? (isArabic ? "مودل" : "Model") : (isArabic ? "موهبة" : "Talent");
  const align = isArabic ? "right" : "left";
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => talent.slug && router.push(`/talent/${talent.slug}`)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.imageWrap}>
        {talent.imageUrl ? <Image source={{ uri: talent.imageUrl }} style={styles.image} resizeMode="cover" /> : <View style={styles.imageFallback}><UserRound size={32} color={colors.textMuted} /></View>}
        {talent.featured ? <View style={styles.featured}><BadgeCheck size={12} color={colors.gold} /><Text style={styles.featuredText}>{isArabic ? "مميزة" : "Featured"}</Text></View> : null}
      </View>
      <Text numberOfLines={1} style={[styles.name, { textAlign: align }]}>{talent.name}</Text>
      <Text style={[styles.role, { textAlign: align }]}>{role}</Text>
      {talent.city ? <View style={[styles.cityRow, isArabic ? styles.rowRtl : styles.rowLtr]}><MapPin size={11} color={colors.textMuted} /><Text numberOfLines={1} style={styles.city}>{talent.city}</Text></View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 48 },
  rowRtl: { flexDirection: "row-reverse", alignItems: "center" },
  rowLtr: { flexDirection: "row", alignItems: "center" },
  hero: { paddingTop: spacing.xl, paddingBottom: spacing.xl },
  badge: { alignSelf: "flex-start", gap: 7, borderWidth: 1, borderColor: "rgba(201,169,98,0.24)", backgroundColor: "rgba(201,169,98,0.07)", borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  badgeText: { color: colors.gold, fontSize: 10, fontWeight: "600" },
  title: { color: colors.textPrimary, fontSize: 34, lineHeight: 41, fontWeight: "700", marginTop: spacing.lg },
  subtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 23, marginTop: spacing.sm },
  statRow: { gap: 7, marginTop: spacing.lg },
  statValue: { color: colors.goldSoft, fontSize: 18, fontWeight: "700" },
  statLabel: { color: colors.textMuted, fontSize: 11 },
  searchBox: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface, paddingHorizontal: spacing.lg },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 14, minHeight: 54 },
  filters: { gap: spacing.sm, marginTop: spacing.md },
  chip: { minHeight: 38, justifyContent: "center", borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(255,255,255,0.025)", borderRadius: radius.pill, paddingHorizontal: spacing.lg },
  chipActive: { borderColor: "rgba(201,169,98,0.34)", backgroundColor: "rgba(201,169,98,0.10)" },
  chipText: { color: colors.textMuted, fontSize: 12 },
  chipTextActive: { color: colors.gold },
  resultHeader: { justifyContent: "space-between", marginTop: 30, marginBottom: spacing.md },
  resultTitle: { color: colors.textPrimary, fontSize: 19, fontWeight: "600" },
  resultCount: { color: colors.textMuted, fontSize: 11 },
  columns: { gap: spacing.md },
  card: { flex: 1, maxWidth: "50%", marginBottom: spacing.lg, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.025)", borderRadius: 22, overflow: "hidden", paddingBottom: spacing.md },
  pressed: { opacity: 0.84, transform: [{ scale: 0.992 }] },
  imageWrap: { aspectRatio: 0.8, backgroundColor: "#0b0b0b", overflow: "hidden" },
  image: { width: "100%", height: "100%" },
  imageFallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  featured: { position: "absolute", top: 10, right: 10, flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: "rgba(201,169,98,0.28)", backgroundColor: "rgba(0,0,0,0.58)", borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 5 },
  featuredText: { color: colors.gold, fontSize: 9 },
  name: { color: colors.textPrimary, fontSize: 15, fontWeight: "700", marginTop: spacing.md, paddingHorizontal: spacing.md },
  role: { color: colors.gold, fontSize: 11, marginTop: 4, paddingHorizontal: spacing.md },
  cityRow: { gap: 4, marginTop: 7, paddingHorizontal: spacing.md },
  city: { flex: 1, color: colors.textMuted, fontSize: 10 },
  stateCard: { minHeight: 180, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl },
  stateTitle: { color: colors.textPrimary, fontSize: 15, textAlign: "center" },
  stateText: { color: colors.textMuted, fontSize: 12, textAlign: "center", marginTop: spacing.sm },
  retryButton: { marginTop: spacing.lg, borderRadius: radius.pill, backgroundColor: colors.gold, paddingHorizontal: spacing.xl, paddingVertical: 11 },
  retryText: { color: "#080808", fontSize: 12, fontWeight: "700" },
});
