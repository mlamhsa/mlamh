import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { ArrowUpRight, Bell, Clock3, MapPin, Search, SearchX, Sparkles } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppTabBar } from "@/components/AppTabBar";
import { ScreenSkeleton } from "@/components/ScreenSkeleton";
import { resolveMobileMarket } from "@/lib/account";
import { getNotifications, getPublicOpportunities, type MobileOpportunity } from "@/lib/api";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { getMobileMarketLabel } from "@/lib/market-labels";
import { darkTheme } from "@/lib/theme";

type FilterKey = "all" | "actor" | "model";

export default function OpportunitiesScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const { width } = useWindowDimensions();
  const compact = width <= 360;
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<MobileOpportunity[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [market, setMarket] = useState("SA");
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => Date.now());

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const resolvedMarket = await resolveMobileMarket();
      setMarket(resolvedMarket);
      const [response, notifications] = await Promise.all([getPublicOpportunities(locale, resolvedMarket), getNotifications().catch(() => null)]);
      setItems(response.items);
      setUnreadCount(notifications?.unreadCount ?? 0);
      setLastUpdatedAt(Date.now());
    } catch { setError(isArabic ? "تعذر تحميل الفرص الآن." : "Unable to load opportunities right now."); }
    finally { setLoading(false); setRefreshing(false); }
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
  const newTodayCount = useMemo(() => items.filter((item) => isWithinHours(item.createdAt, 24)).length, [items]);
  const closingSoonCount = useMemo(() => items.filter((item) => isDeadlineWithinHours(item.applicationDeadline, 72)).length, [items]);
  const textAlign = isRtl ? "right" : "left";
  const marketLabel = getMobileMarketLabel(market, locale) ?? market;
  if (loading) return <ScreenSkeleton variant="list" locale={locale} />;

  return <View style={styles.screen}>
    <FlatList
      data={regular}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={[styles.content, compact && styles.contentCompact, { paddingTop: Math.max(insets.top + (compact ? 14 : 20), compact ? 24 : 32), direction: isRtl ? "rtl" : "ltr" }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.accent} colors={[theme.accent]} />}
      ListHeaderComponent={<View>
        <View style={[styles.topBar, isRtl && styles.rowRtl]}>
          <View style={styles.titleBlock}>
            <Text style={[styles.brand, isArabic && styles.arabicEyebrow, { textAlign }]}>{isArabic ? "ملامح" : "MLAMH"}</Text>
            <Text accessibilityRole="header" style={[styles.pageTitle, compact && styles.pageTitleCompact, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "الفرص" : "Opportunities"}</Text>
            <Text style={[styles.pageSubtitle, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "كل جديد يهمك في مكان واحد." : "See what is new and worth your attention."}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "التنبيهات" : "Notifications"} onPress={() => router.push("/notifications")} style={({ pressed }) => [styles.notificationButton, pressed && styles.pressed]}>
            <Bell size={20} strokeWidth={1.9} color={theme.text} />
            {unreadCount > 0 ? <View style={[styles.notificationBadge, isRtl && styles.notificationBadgeRtl]}><Text style={styles.notificationBadgeText}>{Math.min(unreadCount, 99)}</Text></View> : null}
          </Pressable>
        </View>

        <View style={[styles.marketRow, isRtl && styles.rowRtl]}>
          <View style={styles.marketCopy}><Text style={[styles.marketEyebrow, isArabic && styles.arabicEyebrow, { textAlign }]}>{isArabic ? "السوق الحالي" : "CURRENT MARKET"}</Text><Text style={[styles.marketLabel, isArabic && styles.arabicText, { textAlign }]}>{marketLabel}</Text></View>
          <Text style={[styles.marketCount, isArabic && styles.arabicText]}>{isArabic ? `${filtered.length} فرصة` : `${filtered.length} opportunities`}</Text>
        </View>

        <TodayPulse locale={locale} isRtl={isRtl} styles={styles} newTodayCount={newTodayCount} closingSoonCount={closingSoonCount} unreadCount={unreadCount} lastUpdatedAt={lastUpdatedAt} />

        <View style={[styles.searchBox, isRtl && styles.rowRtl]}><Search size={18} strokeWidth={1.9} color={theme.muted} /><TextInput value={query} onChangeText={setQuery} placeholder={isArabic ? "ابحث عن فرصة أو جهة" : "Search opportunities or companies"} placeholderTextColor={theme.muted} style={[styles.searchInput, isArabic && styles.arabicText, { textAlign, writingDirection: isRtl ? "rtl" : "ltr" }]} autoCapitalize="none" returnKeyType="search" /></View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filters, isRtl && styles.filtersRtl]}>
          <FilterChip active={filter === "all"} label={isArabic ? "الكل" : "All"} onPress={() => setFilter("all")} styles={styles} isRtl={isRtl} />
          <FilterChip active={filter === "actor"} label={isArabic ? "تمثيل" : "Acting"} onPress={() => setFilter("actor")} styles={styles} isRtl={isRtl} />
          <FilterChip active={filter === "model"} label={isArabic ? "مودل" : "Modeling"} onPress={() => setFilter("model")} styles={styles} isRtl={isRtl} />
        </ScrollView>

        {featured.length > 0 ? <View style={styles.featuredSection}>
          <View style={[styles.sectionHeader, isRtl && styles.rowRtl]}><View style={styles.sectionCopy}><Text style={[styles.sectionEyebrow, isArabic && styles.arabicEyebrow, { textAlign }]}>{isArabic ? "منتقاة" : "CURATED"}</Text><Text style={[styles.sectionTitle, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "فرص مميزة" : "Featured opportunities"}</Text></View><Sparkles size={18} color={theme.accent} strokeWidth={1.8} /></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.featuredRow, isRtl && styles.filtersRtl]}>{featured.map((item) => <FeaturedCard key={item.id} item={item} locale={locale} styles={styles} isRtl={isRtl} compact={compact} />)}</ScrollView>
        </View> : null}

        <View style={[styles.latestHeader, isRtl && styles.rowRtl]}><View style={styles.sectionCopy}><Text style={[styles.sectionEyebrow, isArabic && styles.arabicEyebrow, { textAlign }]}>{isArabic ? "الآن" : "NOW"}</Text><Text style={[styles.sectionTitle, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "أحدث الفرص" : "Latest opportunities"}</Text></View><Text style={styles.sectionCount}>{regular.length}</Text></View>
      </View>}
      ListEmptyComponent={<View style={[styles.emptyState, compact && styles.emptyStateCompact]}><View style={styles.emptyIcon}><SearchX size={24} color={theme.accent} strokeWidth={1.8} /></View><Text style={[styles.emptyTitle, isArabic && styles.arabicText]}>{error ?? (isArabic ? "لا توجد فرص مطابقة حاليًا" : "No matching opportunities right now")}</Text><Text style={[styles.emptyBody, isArabic && styles.arabicText]}>{error ? (isArabic ? "تحقق من الاتصال ثم حاول مرة أخرى." : "Check your connection and try again.") : (isArabic ? "جرّب تعديل البحث أو التصنيف." : "Try adjusting your search or category.")}</Text>{error ? <Pressable style={styles.retryButton} onPress={() => void load()}><Text style={[styles.retryText, isArabic && styles.arabicText]}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text></Pressable> : null}</View>}
      renderItem={({ item }) => <OpportunityCard item={item} locale={locale} styles={styles} isRtl={isRtl} compact={compact} />}
      showsVerticalScrollIndicator={false}
    />
    <AppTabBar active="discover" locale={locale} theme={theme} notificationCount={unreadCount} />
  </View>;
}

function TodayPulse({ locale, isRtl, styles, newTodayCount, closingSoonCount, unreadCount, lastUpdatedAt }: { locale: "ar" | "en"; isRtl: boolean; styles: ReturnType<typeof createStyles>; newTodayCount: number; closingSoonCount: number; unreadCount: number; lastUpdatedAt: number }) {
  const ar = locale === "ar";
  return <View style={styles.todayCard}>
    <View style={[styles.todayHeader, isRtl && styles.rowRtl]}><View style={[styles.liveLabel, isRtl && styles.rowRtl]}><View style={styles.liveDot} /><Text style={[styles.todayEyebrow, isRtl && styles.arabicText]}>{ar ? "اليوم في ملامح" : "TODAY ON MLAMH"}</Text></View><Text style={[styles.updatedText, isRtl && styles.arabicText]}>{ar ? `محدّث ${formatRelativeTime(lastUpdatedAt, locale)}` : `Updated ${formatRelativeTime(lastUpdatedAt, locale)}`}</Text></View>
    <View style={[styles.pulseMetrics, isRtl && styles.rowRtl]}>
      <PulseMetric value={newTodayCount} label={ar ? "جديدة اليوم" : "New today"} styles={styles} />
      <View style={styles.pulseDivider} />
      <PulseMetric value={closingSoonCount} label={ar ? "تنتهي قريبًا" : "Closing soon"} styles={styles} />
      <View style={styles.pulseDivider} />
      <Pressable accessibilityRole="button" onPress={() => router.push("/notifications")} style={styles.pulseMetric}><Text style={[styles.pulseValue, unreadCount > 0 && styles.pulseValueAccent]}>{unreadCount}</Text><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={[styles.pulseLabel, isRtl && styles.arabicText]}>{ar ? "تحديثات لك" : "Updates for you"}</Text></Pressable>
    </View>
  </View>;
}

function PulseMetric({ value, label, styles }: { value: number; label: string; styles: ReturnType<typeof createStyles> }) { return <View style={styles.pulseMetric}><Text style={styles.pulseValue}>{value}</Text><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={styles.pulseLabel}>{label}</Text></View>; }

function FilterChip({ active, label, onPress, styles, isRtl }: { active: boolean; label: string; onPress: () => void; styles: ReturnType<typeof createStyles>; isRtl: boolean }) { return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.filterChip, active && styles.filterChipActive]}><Text style={[styles.filterChipText, active && styles.filterChipTextActive, isRtl && styles.arabicText]}>{label}</Text></Pressable>; }

function FeaturedCard({ item, locale, styles, isRtl, compact }: { item: MobileOpportunity; locale: "ar" | "en"; styles: ReturnType<typeof createStyles>; isRtl: boolean; compact: boolean }) {
  const ar = locale === "ar";
  const compensation = item.budget && item.currency ? `${item.budget} ${item.currency}` : (ar ? "حسب الاتفاق" : "By agreement");
  const location = [item.city, getMobileMarketLabel(item.countryCode, locale)].filter(Boolean).join(" · ");
  const signals = opportunitySignals(item, locale);
  return <Pressable onPress={() => router.push(`/opportunities/${item.slug}`)} style={({ pressed }) => [styles.featuredCard, compact && styles.featuredCardCompact, pressed && styles.cardPressed]}>
    <View style={[styles.featuredAccent, isRtl && styles.featuredAccentRtl]} />
    <View style={[styles.featuredTop, isRtl && styles.rowRtl]}><View style={[styles.signalRow, isRtl && styles.rowRtl]}><Text style={[styles.featuredBadge, isRtl && styles.arabicText]}>{ar ? "مميز" : "Featured"}</Text>{signals.slice(0, 1).map((signal) => <Text key={signal} style={[styles.signalBadge, isRtl && styles.arabicText]}>{signal}</Text>)}</View><ArrowUpRight size={18} color="#F5F5F0" strokeWidth={1.8} style={isRtl ? styles.iconRtl : undefined} /></View>
    <Text numberOfLines={2} style={[styles.featuredTitle, compact && styles.featuredTitleCompact, { textAlign: isRtl ? "right" : "left", writingDirection: isRtl ? "rtl" : "ltr" }]}>{item.title}</Text>
    <Text numberOfLines={1} style={[styles.company, { textAlign: isRtl ? "right" : "left", writingDirection: isRtl ? "rtl" : "ltr" }]}>{item.companyName}</Text>
    <View style={styles.featuredBottom}><View style={[styles.locationRow, isRtl && styles.rowRtl]}><MapPin size={14} color="#8F8F89" strokeWidth={1.8} /><Text numberOfLines={1} style={[styles.meta, { textAlign: isRtl ? "right" : "left", writingDirection: isRtl ? "rtl" : "ltr" }]}>{location}</Text></View><View style={[styles.timeRow, isRtl && styles.rowRtl]}><Clock3 size={13} color="#8F8F89" strokeWidth={1.8} /><Text style={[styles.timeText, isRtl && styles.arabicText]}>{formatRelativeTime(item.createdAt, locale)}</Text><Text style={[styles.compensation, { textAlign: isRtl ? "right" : "left", writingDirection: isRtl ? "rtl" : "ltr" }]}>{compensation}</Text></View></View>
  </Pressable>;
}

function OpportunityCard({ item, locale, styles, isRtl, compact }: { item: MobileOpportunity; locale: "ar" | "en"; styles: ReturnType<typeof createStyles>; isRtl: boolean; compact: boolean }) {
  const ar = locale === "ar";
  const location = [item.city, getMobileMarketLabel(item.countryCode, locale)].filter(Boolean).join(" · ") || (ar ? "مرن" : "Flexible");
  const signals = opportunitySignals(item, locale);
  return <Pressable onPress={() => router.push(`/opportunities/${item.slug}`)} style={({ pressed }) => [styles.card, compact && styles.cardCompact, pressed && styles.cardPressed]}><View style={[styles.cardHeader, isRtl && styles.rowRtl]}><View style={[styles.signalRow, isRtl && styles.rowRtl]}><View style={styles.typePill}><Text style={[styles.typeBadge, isRtl && styles.arabicText]}>{humanizeType(item.opportunityType)}</Text></View>{signals.slice(0, 1).map((signal) => <Text key={signal} style={[styles.signalBadge, isRtl && styles.arabicText]}>{signal}</Text>)}</View><View style={styles.openIcon}><ArrowUpRight size={17} color="#F5F5F0" strokeWidth={1.8} style={isRtl ? styles.iconRtl : undefined} /></View></View><Text numberOfLines={2} style={[styles.cardTitle, compact && styles.cardTitleCompact, { textAlign: isRtl ? "right" : "left", writingDirection: isRtl ? "rtl" : "ltr" }]}>{item.title}</Text><Text numberOfLines={1} style={[styles.company, { textAlign: isRtl ? "right" : "left", writingDirection: isRtl ? "rtl" : "ltr" }]}>{item.companyName}</Text><View style={[styles.cardFooter, isRtl && styles.rowRtl]}><View style={[styles.locationRow, isRtl && styles.rowRtl]}><MapPin size={14} color="#8F8F89" strokeWidth={1.8} /><Text numberOfLines={1} style={[styles.meta, { textAlign: isRtl ? "right" : "left", writingDirection: isRtl ? "rtl" : "ltr" }]}>{location}</Text></View><View style={[styles.timeRow, isRtl && styles.rowRtl]}><Clock3 size={13} color="#8F8F89" strokeWidth={1.8} /><Text style={[styles.timeText, isRtl && styles.arabicText]}>{formatRelativeTime(item.createdAt, locale)}</Text></View></View></Pressable>;
}

function isWithinHours(value: string | number | null | undefined, hours: number) { const timestamp = typeof value === "number" ? value : value ? new Date(value).getTime() : NaN; if (!Number.isFinite(timestamp)) return false; const age = Date.now() - timestamp; return age >= 0 && age <= hours * 60 * 60 * 1000; }
function isDeadlineWithinHours(value: string | null | undefined, hours: number) { if (!value) return false; const timestamp = new Date(value).getTime(); if (!Number.isFinite(timestamp)) return false; const remaining = timestamp - Date.now(); return remaining >= 0 && remaining <= hours * 60 * 60 * 1000; }
function opportunitySignals(item: MobileOpportunity, locale: "ar" | "en") { const ar = locale === "ar"; const signals: string[] = []; if (isWithinHours(item.createdAt, 24)) signals.push(ar ? "جديد" : "New"); if (isDeadlineWithinHours(item.applicationDeadline, 72)) signals.push(ar ? "ينتهي قريبًا" : "Closing soon"); return signals; }
function formatRelativeTime(value: string | number, locale: "ar" | "en") { const timestamp = typeof value === "number" ? value : new Date(value).getTime(); if (!Number.isFinite(timestamp)) return locale === "ar" ? "الآن" : "now"; const diffMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000)); if (diffMinutes < 1) return locale === "ar" ? "الآن" : "now"; if (diffMinutes < 60) return locale === "ar" ? `منذ ${diffMinutes} د` : `${diffMinutes}m ago`; const hours = Math.floor(diffMinutes / 60); if (hours < 24) return locale === "ar" ? `منذ ${hours} س` : `${hours}h ago`; const days = Math.floor(hours / 24); if (days === 1) return locale === "ar" ? "أمس" : "yesterday"; if (days < 7) return locale === "ar" ? `منذ ${days} أيام` : `${days}d ago`; return new Date(timestamp).toLocaleDateString(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US", { month: "short", day: "numeric" }); }
function humanizeType(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase()); }
function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen:{flex:1,backgroundColor:theme.background},content:{paddingHorizontal:20,paddingBottom:118,gap:14},contentCompact:{paddingHorizontal:14,paddingBottom:106},rowRtl:{flexDirection:"row-reverse"},arabicText:{letterSpacing:0,writingDirection:"rtl"},arabicEyebrow:{letterSpacing:0,writingDirection:"rtl"},topBar:{minHeight:74,flexDirection:"row",alignItems:"flex-start",justifyContent:"space-between",gap:18},titleBlock:{flex:1,gap:5},brand:{color:theme.accent,fontSize:12,fontWeight:"900",letterSpacing:2},pageTitle:{color:theme.text,fontSize:30,lineHeight:36,fontWeight:"800"},pageTitleCompact:{fontSize:27,lineHeight:32},pageSubtitle:{color:theme.muted,fontSize:13,lineHeight:20,maxWidth:390},notificationButton:{width:44,height:44,borderRadius:22,borderWidth:1,borderColor:theme.border,backgroundColor:theme.surface,alignItems:"center",justifyContent:"center",position:"relative"},notificationBadge:{position:"absolute",top:-3,right:-3,minWidth:18,height:18,borderRadius:9,paddingHorizontal:4,backgroundColor:theme.accent,alignItems:"center",justifyContent:"center"},notificationBadgeRtl:{right:undefined,left:-3},notificationBadgeText:{color:theme.background,fontSize:8,fontWeight:"900"},marketRow:{flexDirection:"row",alignItems:"flex-end",justifyContent:"space-between",marginTop:18,borderWidth:1,borderColor:"#C9A96226",borderRadius:18,backgroundColor:"#C9A96206",padding:14},marketCopy:{flexShrink:1},marketEyebrow:{color:theme.accent,fontSize:8,fontWeight:"900",letterSpacing:1.4},marketLabel:{color:theme.text,fontSize:15,fontWeight:"800",marginTop:3},marketCount:{color:theme.muted,fontSize:11},todayCard:{marginTop:10,borderWidth:1,borderColor:"#C9A96242",borderRadius:19,backgroundColor:theme.surface,padding:14,gap:13},todayHeader:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:10},liveLabel:{flexDirection:"row",alignItems:"center",gap:7},liveDot:{width:7,height:7,borderRadius:4,backgroundColor:"#49C991"},todayEyebrow:{color:theme.text,fontSize:10,fontWeight:"900",letterSpacing:.6},updatedText:{color:theme.muted,fontSize:9},pulseMetrics:{flexDirection:"row",alignItems:"stretch"},pulseMetric:{flex:1,minHeight:54,alignItems:"center",justifyContent:"center",gap:3,paddingHorizontal:4},pulseDivider:{width:1,backgroundColor:theme.border,marginVertical:5},pulseValue:{color:theme.text,fontSize:20,fontWeight:"800"},pulseValueAccent:{color:theme.accent},pulseLabel:{color:theme.muted,fontSize:9,fontWeight:"700",textAlign:"center"},searchBox:{marginTop:10,minHeight:54,borderWidth:1,borderColor:theme.border,borderRadius:16,backgroundColor:theme.surface,paddingHorizontal:14,flexDirection:"row",alignItems:"center",gap:10},searchInput:{flex:1,color:theme.text,fontSize:14,paddingVertical:12},filters:{gap:8,paddingTop:12,paddingBottom:8},filtersRtl:{flexDirection:"row-reverse"},filterChip:{minHeight:38,paddingHorizontal:16,borderRadius:19,borderWidth:1,borderColor:theme.border,backgroundColor:theme.surface,alignItems:"center",justifyContent:"center"},filterChipActive:{borderColor:theme.accent,backgroundColor:theme.chip},filterChipText:{color:theme.muted,fontSize:12,fontWeight:"700"},filterChipTextActive:{color:theme.accent},featuredSection:{marginTop:14,gap:11},sectionHeader:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},sectionCopy:{flexShrink:1},sectionEyebrow:{color:theme.accent,fontSize:8,fontWeight:"900",letterSpacing:1.5},sectionTitle:{color:theme.text,fontSize:19,lineHeight:25,fontWeight:"800",marginTop:2},featuredRow:{gap:10,paddingBottom:4},featuredCard:{width:292,minHeight:204,borderRadius:20,borderWidth:1,borderColor:"#C9A96255",backgroundColor:theme.surfaceElevated,padding:18,gap:9,overflow:"hidden"},featuredCardCompact:{width:258,minHeight:194,padding:15},featuredAccent:{position:"absolute",left:0,top:0,bottom:0,width:3,backgroundColor:theme.accent},featuredAccentRtl:{left:undefined,right:0},featuredTop:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},signalRow:{flexDirection:"row",alignItems:"center",gap:6,flexWrap:"wrap",flexShrink:1},featuredBadge:{color:theme.accent,fontSize:10,fontWeight:"900"},signalBadge:{color:"#49C991",backgroundColor:"#49C99112",borderWidth:1,borderColor:"#49C99144",borderRadius:999,overflow:"hidden",paddingHorizontal:8,paddingVertical:4,fontSize:8,fontWeight:"900"},featuredTitle:{color:theme.text,fontSize:21,lineHeight:28,fontWeight:"800"},featuredTitleCompact:{fontSize:19,lineHeight:25},featuredBottom:{marginTop:"auto",gap:7},locationRow:{flexDirection:"row",alignItems:"center",gap:6,flexShrink:1},timeRow:{flexDirection:"row",alignItems:"center",gap:5},company:{color:theme.text,fontSize:12,fontWeight:"700",opacity:.88},meta:{color:theme.muted,fontSize:11,flexShrink:1},timeText:{color:theme.muted,fontSize:9},compensation:{color:theme.accent,fontSize:12,fontWeight:"800",marginStart:"auto"},latestHeader:{flexDirection:"row",alignItems:"flex-end",justifyContent:"space-between",marginTop:20,marginBottom:2},sectionCount:{color:theme.muted,fontSize:11},card:{borderWidth:1,borderColor:theme.border,backgroundColor:theme.surface,borderRadius:18,padding:16,gap:9,marginBottom:2},cardCompact:{padding:13,gap:8},cardPressed:{transform:[{scale:.992}],opacity:.9},cardHeader:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},typePill:{borderWidth:1,borderColor:"#C9A96244",backgroundColor:"#C9A9620C",borderRadius:999,paddingHorizontal:10,paddingVertical:5},typeBadge:{color:theme.accent,fontSize:9,fontWeight:"900"},openIcon:{width:32,height:32,borderRadius:16,borderWidth:1,borderColor:theme.border,alignItems:"center",justifyContent:"center"},iconRtl:{transform:[{scaleX:-1}]},cardTitle:{color:theme.text,fontSize:18,lineHeight:25,fontWeight:"800"},cardTitleCompact:{fontSize:17,lineHeight:23},cardFooter:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:10},emptyState:{borderWidth:1,borderColor:theme.border,backgroundColor:theme.surface,borderRadius:20,padding:26,alignItems:"center",gap:9,marginTop:8},emptyStateCompact:{padding:19},emptyIcon:{width:48,height:48,borderRadius:24,borderWidth:1,borderColor:"#C9A96255",backgroundColor:"#C9A9620A",alignItems:"center",justifyContent:"center"},emptyTitle:{color:theme.text,fontSize:16,lineHeight:23,fontWeight:"800",textAlign:"center"},emptyBody:{color:theme.muted,fontSize:12,lineHeight:19,textAlign:"center"},retryButton:{minHeight:44,paddingHorizontal:18,borderRadius:12,borderWidth:1,borderColor:theme.accent,alignItems:"center",justifyContent:"center",marginTop:6},retryText:{color:theme.accent,fontSize:12,fontWeight:"800"},pressed:{opacity:.78}
}); }
