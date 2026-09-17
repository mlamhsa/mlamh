import { router, type Href } from "expo-router";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  MapPin,
  Search,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { getMobileOpportunities } from "@/src/domains/opportunities/api";
import type { MobilePublicOpportunity } from "@/src/domains/opportunities/types";
import { useLocale } from "@/src/i18n/LocaleProvider";
import { colors, radius, spacing } from "@/src/theme/tokens";

type Mode = "all" | "quick" | "casting";

function go(href: string) {
  router.push(href as Href);
}

function compensationLabel(item: MobilePublicOpportunity, isArabic: boolean) {
  if (item.compensationType === "unpaid") return isArabic ? "غير مدفوع" : "Unpaid";
  if (item.compensationType === "negotiable") return isArabic ? "حسب الاتفاق" : "Negotiable";
  const amount = Number(item.budget);
  if (!Number.isFinite(amount) || amount <= 0) return isArabic ? "غير محدد" : "Not specified";
  return `${new Intl.NumberFormat(isArabic ? "ar-SA-u-nu-latn" : "en-US").format(amount)} ${item.currency || "SAR"}`;
}

export function OpportunitiesDirectoryScreen() {
  const { locale } = useLocale();
  const isArabic = locale === "ar";
  const DirectionArrow = isArabic ? ArrowLeft : ArrowRight;
  const align = isArabic ? "right" : "left";
  const [items, setItems] = useState<MobilePublicOpportunity[]>([]);
  const [mode, setMode] = useState<Mode>("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const response = await getMobileOpportunities(locale);
      setItems(response.items);
    } catch {
      setError(isArabic ? "تعذر تحميل الفرص الآن." : "Unable to load opportunities right now.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isArabic, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => {
      if (mode !== "all" && item.postingMode !== mode) return false;
      if (!normalized) return true;
      return [item.title, item.companyName, item.city, item.opportunityType]
        .some((value) => String(value ?? "").toLowerCase().includes(normalized));
    });
  }, [items, mode, query]);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.gold} />}
      >
        <View style={styles.hero}>
          <View style={[styles.heroTop, isArabic ? styles.rowRtl : styles.rowLtr]}>
            <View style={styles.heroCopy}>
              <View style={isArabic ? styles.rowRtl : styles.rowLtr}>
                <BriefcaseBusiness size={18} color={colors.gold} />
                <Text style={styles.eyebrow}>{isArabic ? "فرص ملامح" : "MLAMH OPPORTUNITIES"}</Text>
              </View>
              <Text style={[styles.title, { textAlign: align }]}>
                {isArabic ? "اكتشف فرصتك القادمة" : "Find your next opportunity"}
              </Text>
              <Text style={[styles.description, { textAlign: align }]}>
                {isArabic
                  ? "استعرض فرص الكاست والإعلانات وصناعة المحتوى من الشركات والوكالات."
                  : "Browse casting, advertising and content opportunities from companies and agencies."}
              </Text>
            </View>
            <View style={styles.heroIcon}><Sparkles size={21} color={colors.gold} /></View>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Search size={19} color={colors.gold} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={isArabic ? "ابحث عن فرصة أو جهة أو مدينة..." : "Search opportunity, organization or city..."}
            placeholderTextColor="rgba(255,255,255,0.28)"
            style={[styles.searchInput, { textAlign: align }]}
          />
        </View>

        <View style={styles.tabs}>
          {([
            ["all", isArabic ? "الكل" : "All"],
            ["quick", isArabic ? "طلبات الآن" : "Quick"],
            ["casting", isArabic ? "الكاستينغ" : "Casting"],
          ] as const).map(([value, label]) => (
            <Pressable
              key={value}
              accessibilityRole="button"
              onPress={() => setMode(value)}
              style={[styles.tab, mode === value && styles.tabActive]}
            >
              <Text style={[styles.tabText, mode === value && styles.tabTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.resultHeader, isArabic ? styles.rowRtl : styles.rowLtr]}>
          <Text style={styles.resultCount}>
            {loading ? "…" : `${filtered.length} ${isArabic ? "فرصة" : filtered.length === 1 ? "opportunity" : "opportunities"}`}
          </Text>
          {mode !== "all" ? (
            <Text style={styles.resultMode}>
              {mode === "quick"
                ? isArabic ? "أنا مهتم" : "I'm interested"
                : isArabic ? "تقدّم الآن" : "Apply now"}
            </Text>
          ) : null}
        </View>

        {error ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>{error}</Text>
            <Pressable onPress={() => void load()} style={styles.retryButton}>
              <Text style={styles.retryText}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text>
            </Pressable>
          </View>
        ) : loading ? (
          <View style={styles.stateCard}><Text style={styles.stateText}>{isArabic ? "جارٍ تحميل الفرص..." : "Loading opportunities..."}</Text></View>
        ) : filtered.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>{isArabic ? "لا توجد نتائج مطابقة" : "No matching results"}</Text>
            <Text style={styles.stateText}>{isArabic ? "جرّب تغيير البحث أو نوع الفرصة." : "Try another search or opportunity type."}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map((item, index) => {
              const isQuick = item.postingMode === "quick";
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  onPress={() => go(`/opportunities/${item.slug || item.id}`)}
                  style={({ pressed }) => [styles.card, index === 0 && styles.cardFeatured, pressed && styles.pressed]}
                >
                  <View style={[styles.cardTop, isArabic ? styles.rowRtl : styles.rowLtr]}>
                    <View style={isArabic ? styles.rowRtl : styles.rowLtr}>
                      <View style={[styles.modePill, isQuick ? styles.quickPill : styles.castingPill]}>
                        {isQuick ? <Zap size={11} color="#F6D487" /> : <BriefcaseBusiness size={11} color={colors.gold} />}
                        <Text style={[styles.modeText, isQuick && styles.quickText]}>
                          {isQuick ? (isArabic ? "طلب الآن" : "Quick Request") : (isArabic ? "كاستينغ" : "Casting")}
                        </Text>
                      </View>
                    </View>
                    {item.featured ? <Text style={styles.featuredLabel}>{isArabic ? "مميز" : "FEATURED"}</Text> : null}
                  </View>

                  <Text style={[styles.cardTitle, { textAlign: align }]}>{item.title}</Text>
                  <Text style={[styles.company, { textAlign: align }]}>{item.companyName}</Text>

                  <View style={styles.metaGrid}>
                    <View style={styles.metaBox}>
                      <View style={isArabic ? styles.rowRtl : styles.rowLtr}>
                        <MapPin size={12} color={colors.gold} />
                        <Text style={styles.metaLabel}>{isArabic ? "الموقع" : "Location"}</Text>
                      </View>
                      <Text numberOfLines={1} style={[styles.metaValue, { textAlign: align }]}>{item.city || (isArabic ? "غير محدد" : "Not specified")}</Text>
                    </View>
                    <View style={styles.metaBox}>
                      <View style={isArabic ? styles.rowRtl : styles.rowLtr}>
                        <Wallet size={12} color={colors.gold} />
                        <Text style={styles.metaLabel}>{isArabic ? "المقابل" : "Compensation"}</Text>
                      </View>
                      <Text numberOfLines={1} style={[styles.metaValue, { textAlign: align }]}>{compensationLabel(item, isArabic)}</Text>
                    </View>
                  </View>

                  <View style={[styles.cardFooter, isArabic ? styles.rowRtl : styles.rowLtr]}>
                    <Text style={styles.cardAction}>{isQuick ? (isArabic ? "عرض الطلب" : "View request") : (isArabic ? "عرض تفاصيل الفرصة" : "View opportunity")}</Text>
                    <DirectionArrow size={16} color={colors.gold} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 120 },
  rowRtl: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.sm },
  rowLtr: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  hero: { marginTop: spacing.xl, marginBottom: spacing.lg, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.035)", borderRadius: 28, padding: spacing.xl },
  heroTop: { alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md },
  heroCopy: { flex: 1, minWidth: 0 },
  heroIcon: { width: 48, height: 48, borderRadius: 16, borderWidth: 1, borderColor: "rgba(201,169,98,0.20)", backgroundColor: "rgba(201,169,98,0.08)", alignItems: "center", justifyContent: "center" },
  eyebrow: { color: colors.gold, fontSize: 11, fontWeight: "700" },
  title: { color: colors.textPrimary, fontSize: 31, lineHeight: 38, fontWeight: "700", marginTop: spacing.md },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 23, marginTop: spacing.sm },
  searchBox: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.lg },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 14, paddingVertical: 0 },
  tabs: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  tab: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, backgroundColor: "rgba(255,255,255,0.02)" },
  tabActive: { borderColor: "rgba(201,169,98,0.36)", backgroundColor: "rgba(201,169,98,0.10)" },
  tabText: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  tabTextActive: { color: colors.gold },
  resultHeader: { justifyContent: "space-between", marginTop: spacing.xl },
  resultCount: { color: "rgba(255,255,255,0.50)", fontSize: 12 },
  resultMode: { color: colors.gold, fontSize: 11 },
  list: { gap: spacing.md, marginTop: spacing.md },
  card: { borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(255,255,255,0.025)", borderRadius: 26, padding: spacing.lg },
  cardFeatured: { borderColor: "rgba(201,169,98,0.20)", backgroundColor: "rgba(201,169,98,0.055)" },
  pressed: { opacity: 0.84, transform: [{ scale: 0.994 }] },
  cardTop: { justifyContent: "space-between" },
  modePill: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  quickPill: { borderColor: "rgba(246,212,135,0.28)", backgroundColor: "rgba(246,212,135,0.08)" },
  castingPill: { borderColor: "rgba(201,169,98,0.24)", backgroundColor: "rgba(201,169,98,0.07)" },
  modeText: { color: colors.gold, fontSize: 10, fontWeight: "700" },
  quickText: { color: "#F6D487" },
  featuredLabel: { color: "rgba(201,169,98,0.65)", fontSize: 9, fontWeight: "700" },
  cardTitle: { color: colors.textPrimary, fontSize: 18, lineHeight: 27, fontWeight: "700", marginTop: spacing.lg },
  company: { color: "rgba(255,255,255,0.44)", fontSize: 12, marginTop: spacing.sm },
  metaGrid: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  metaBox: { flex: 1, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", backgroundColor: "rgba(0,0,0,0.16)", borderRadius: radius.lg, padding: spacing.md },
  metaLabel: { color: "rgba(255,255,255,0.30)", fontSize: 10 },
  metaValue: { color: "rgba(255,255,255,0.72)", fontSize: 12, fontWeight: "600", marginTop: 6 },
  cardFooter: { justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)", marginTop: spacing.lg, paddingTop: spacing.md },
  cardAction: { color: "rgba(255,255,255,0.42)", fontSize: 11 },
  stateCard: { marginTop: spacing.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xxl, alignItems: "center" },
  stateTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: "600", textAlign: "center" },
  stateText: { color: colors.textMuted, fontSize: 12, lineHeight: 20, textAlign: "center", marginTop: 6 },
  retryButton: { marginTop: spacing.lg, minHeight: 42, justifyContent: "center", borderRadius: radius.pill, backgroundColor: colors.gold, paddingHorizontal: spacing.xl },
  retryText: { color: "#090909", fontSize: 12, fontWeight: "700" },
});
