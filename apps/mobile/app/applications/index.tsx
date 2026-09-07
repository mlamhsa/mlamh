import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowUpRight, CheckCircle2, Clock3, FileCheck2, MapPin, MessageCircle, SearchX } from "lucide-react-native";

import { AppTabBar } from "@/components/AppTabBar";
import { ScreenSkeleton } from "@/components/ScreenSkeleton";
import { getMyApplications, getNotifications, type MobileApplicationItem, type MobileApplicationStatus } from "@/lib/api";
import { isRtlLocale } from "@/lib/i18n";
import { useAppLocale } from "@/lib/locale-context";
import { getMobileMarketLabel } from "@/lib/market-labels";
import { darkTheme } from "@/lib/theme";

type Counts = Record<MobileApplicationStatus | "total", number>;
type ApplicationFilter = "all" | "active" | "accepted";
const EMPTY_COUNTS: Counts = { total: 0, pending: 0, reviewing: 0, shortlisted: 0, accepted: 0, rejected: 0 };

export default function ApplicationsScreen() {
  const { locale } = useAppLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const { width } = useWindowDimensions();
  const compact = width <= 360;
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [items, setItems] = useState<MobileApplicationItem[]>([]);
  const [counts, setCounts] = useState<Counts>(EMPTY_COUNTS);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<ApplicationFilter>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const [result, notifications] = await Promise.all([getMyApplications(locale), getNotifications().catch(() => null)]);
      if (!result.ok) {
        if (result.code === "UNAUTHENTICATED") { router.replace({ pathname: "/login", params: { next: "/applications" } }); return; }
        setError(isArabic ? "تعذر تحميل طلباتك." : "Unable to load your applications.");
        return;
      }
      setItems(result.items);
      setCounts(result.counts);
      setUnreadCount(notifications?.unreadCount ?? 0);
    } catch {
      setError(isArabic ? "تعذر تحميل طلباتك. تحقق من الاتصال وحاول مرة أخرى." : "Unable to load your applications. Check your connection and try again.");
    } finally { setLoading(false); setRefreshing(false); }
  }, [isArabic, locale]);

  useEffect(() => { void load(); }, [load]);
  const filteredItems = useMemo(() => filter === "accepted" ? items.filter((item) => item.status === "accepted") : filter === "active" ? items.filter((item) => ["pending", "reviewing", "shortlisted"].includes(item.status)) : items, [filter, items]);
  if (loading) return <ScreenSkeleton variant="list" locale={locale} label={isArabic ? "تحميل طلباتي" : "Loading applications"} />;

  const activeCount = counts.pending + counts.reviewing + counts.shortlisted;
  const submittedToday = items.filter((item) => isToday(item.createdAt)).length;
  const align = isRtl ? "right" : "left";

  return <SafeAreaView style={styles.screen} edges={["top"]}>
    <FlatList
      data={filteredItems}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={[styles.content, compact && styles.contentCompact]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.accent} />}
      ListHeaderComponent={<View style={styles.header}>
        <Text style={[styles.brand, isArabic && styles.arabicBrand, { textAlign: align }]}>{isArabic ? "ملامح" : "MLAMH"}</Text>
        <Text accessibilityRole="header" style={[styles.title, compact && styles.titleCompact, { textAlign: align, writingDirection: isRtl ? "rtl" : "ltr" }]}>{isArabic ? "طلباتي" : "My applications"}</Text>
        <Text style={[styles.subtitle, { textAlign: align, writingDirection: isRtl ? "rtl" : "ltr", alignSelf: isRtl ? "flex-end" : "flex-start" }]}>{isArabic ? "تابع كل طلب من لحظة التقديم حتى القبول والتواصل." : "Follow every application from submission to acceptance and messaging."}</Text>
        <View style={[styles.activityNote, isRtl && styles.rowRtl]}><Clock3 size={15} color={theme.accent} /><Text style={[styles.activityNoteText, { textAlign: align, writingDirection: isRtl ? "rtl" : "ltr" }]}>{isArabic ? `${submittedToday} طلب اليوم · ${activeCount} قيد التقدم` : `${submittedToday} today · ${activeCount} in progress`}</Text></View>
        <View style={[styles.statsRow, isRtl && styles.rowRtl]}>
          <Stat icon={FileCheck2} value={counts.total} label={isArabic ? "الكل" : "Total"} styles={styles} isRtl={isRtl} />
          <Stat icon={Clock3} value={activeCount} label={isArabic ? "قيد التقدم" : "In progress"} styles={styles} isRtl={isRtl} />
          <Stat icon={CheckCircle2} value={counts.accepted} label={isArabic ? "مقبول" : "Accepted"} styles={styles} isRtl={isRtl} accent />
        </View>
        <View style={[styles.filterRow, isRtl && styles.rowRtl]}>
          <FilterTab active={filter === "all"} label={isArabic ? "الكل" : "All"} count={counts.total} onPress={() => setFilter("all")} styles={styles} isRtl={isRtl} />
          <FilterTab active={filter === "active"} label={isArabic ? "قيد التقدم" : "In progress"} count={activeCount} onPress={() => setFilter("active")} styles={styles} isRtl={isRtl} />
          <FilterTab active={filter === "accepted"} label={isArabic ? "مقبول" : "Accepted"} count={counts.accepted} onPress={() => setFilter("accepted")} styles={styles} isRtl={isRtl} />
        </View>
      </View>}
      ListEmptyComponent={<View style={styles.emptyState}><View style={styles.emptyIcon}><SearchX size={25} color={theme.accent} /></View><Text style={styles.emptyTitle}>{error ?? (isArabic ? "لا توجد طلبات في هذه الحالة" : "No applications in this view")}</Text><Text style={styles.emptyBody}>{error ? (isArabic ? "تحقق من الاتصال ثم حاول مرة أخرى." : "Check your connection and try again.") : (isArabic ? "استكشف الفرص المناسبة وابدأ أول طلب من ملامح." : "Discover a relevant opportunity and start your first application.")}</Text><Pressable style={styles.primaryButton} onPress={() => error ? void load() : router.push("/opportunities")}><Text style={styles.primaryButtonText}>{error ? (isArabic ? "إعادة المحاولة" : "Try again") : (isArabic ? "استكشف الفرص" : "Discover opportunities")}</Text></Pressable></View>}
      renderItem={({ item }) => <ApplicationCard item={item} locale={locale} styles={styles} compact={compact} />}
      showsVerticalScrollIndicator={false}
    />
    <AppTabBar active="applications" locale={locale} theme={theme} notificationCount={unreadCount} />
  </SafeAreaView>;
}

function Stat({ icon: Icon, value, label, styles, isRtl, accent = false }: { icon: typeof FileCheck2; value: number; label: string; styles: ReturnType<typeof createStyles>; isRtl: boolean; accent?: boolean }) {
  return <View style={[styles.stat, accent && styles.statAccent, { alignItems: isRtl ? "flex-end" : "flex-start" }]}><Icon size={15} color={accent ? "#C9A962" : "#8F8F89"} /><Text style={[styles.statValue, accent && styles.statValueAccent]}>{value}</Text><Text style={[styles.statLabel, { textAlign: isRtl ? "right" : "left", writingDirection: isRtl ? "rtl" : "ltr" }]}>{label}</Text></View>;
}

function FilterTab({ active, label, count, onPress, styles, isRtl }: { active: boolean; label: string; count: number; onPress: () => void; styles: ReturnType<typeof createStyles>; isRtl: boolean }) {
  return <Pressable onPress={onPress} style={[styles.filterTab, isRtl && styles.rowRtl, active && styles.filterTabActive]}><Text style={[styles.filterText, active && styles.filterTextActive, { writingDirection: isRtl ? "rtl" : "ltr" }]}>{label}</Text><View style={[styles.filterBadge, active && styles.filterBadgeActive]}><Text style={styles.filterCount}>{count}</Text></View></Pressable>;
}

function ApplicationCard({ item, locale, styles, compact }: { item: MobileApplicationItem; locale: "ar" | "en"; styles: ReturnType<typeof createStyles>; compact: boolean }) {
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const labels: Record<MobileApplicationStatus, { ar: string; en: string }> = { pending:{ar:"تم الاستلام",en:"Received"}, reviewing:{ar:"قيد المراجعة",en:"Reviewing"}, shortlisted:{ar:"القائمة المختصرة",en:"Shortlisted"}, accepted:{ar:"تم القبول",en:"Accepted"}, rejected:{ar:"لم يتم الاختيار",en:"Not selected"} };
  const opportunity = item.opportunity as (MobileApplicationItem["opportunity"] & { countryCode?: string | null });
  const location = [opportunity?.city, getMobileMarketLabel(opportunity?.countryCode, locale)].filter(Boolean).join(" · ");
  const accepted = item.status === "accepted";
  const align = isRtl ? "right" : "left";
  return <View style={[styles.card, compact && styles.cardCompact, accepted && styles.cardAccepted]}>
    <View style={[styles.cardTop, isRtl && styles.rowRtl]}><View style={[styles.statusPill, accepted && styles.statusPillAccepted]}><Text style={[styles.status, accepted && styles.statusAccepted, { writingDirection: isRtl ? "rtl" : "ltr" }]}>{labels[item.status][locale]}</Text></View><Text style={styles.date}>{item.createdAt ? relativeTime(item.createdAt, locale) : ""}</Text></View>
    <Text style={[styles.cardTitle, { textAlign: align, writingDirection: isRtl ? "rtl" : "ltr" }]}>{opportunity?.title ?? (isArabic ? "فرصة" : "Opportunity")}</Text>
    {item.status !== "rejected" ? <ApplicationProgress status={item.status} locale={locale} isRtl={isRtl} styles={styles} /> : null}
    <Text style={[styles.statusHint, { textAlign: align, writingDirection: isRtl ? "rtl" : "ltr" }]}>{statusHint(item.status, locale)}</Text>
    {location ? <View style={[styles.metaRow, isRtl && styles.rowRtl]}><MapPin size={13} color="#8F8F89" /><Text style={[styles.meta, { writingDirection: isRtl ? "rtl" : "ltr" }]}>{location}</Text></View> : null}
    {accepted ? <View style={[styles.acceptedBanner, isRtl && styles.rowRtl]}><CheckCircle2 size={15} color="#49C991" /><Text style={[styles.acceptedHint, { writingDirection: isRtl ? "rtl" : "ltr" }]}>{isArabic ? "تم فتح التواصل بعد القبول" : "Messaging unlocked after acceptance"}</Text></View> : null}
    <View style={[styles.actionsRow, isRtl && styles.rowRtl]}>{opportunity?.slug ? <Pressable style={[styles.secondaryButton, isRtl && styles.rowRtl]} onPress={() => router.push(`/opportunities/${opportunity.slug}`)}><ArrowUpRight size={15} color="#F5F5F0" /><Text style={[styles.secondaryButtonText, { writingDirection: isRtl ? "rtl" : "ltr" }]}>{isArabic ? "عرض الفرصة" : "View opportunity"}</Text></Pressable> : null}{accepted && item.conversationId ? <Pressable style={[styles.primaryButton, isRtl && styles.rowRtl]} onPress={() => router.push(`/conversations/${item.conversationId}`)}><MessageCircle size={15} color="#050505" /><Text style={styles.primaryButtonText}>{isArabic ? "فتح المحادثة" : "Open conversation"}</Text></Pressable> : null}</View>
  </View>;
}

function ApplicationProgress({ status, locale, isRtl, styles }: { status: Exclude<MobileApplicationStatus, "rejected">; locale: "ar" | "en"; isRtl: boolean; styles: ReturnType<typeof createStyles> }) {
  const order: Array<Exclude<MobileApplicationStatus, "rejected">> = ["pending", "reviewing", "shortlisted", "accepted"];
  const labels = locale === "ar" ? ["استلام", "مراجعة", "مختصرة", "قبول"] : ["Received", "Review", "Shortlist", "Accepted"];
  const current = order.indexOf(status);
  return <View style={[styles.progress, isRtl && styles.rowRtl]}>{order.map((step, index) => <View key={step} style={styles.progressStep}><View style={[styles.progressDot, index <= current && styles.progressDotActive]} /><Text style={[styles.progressLabel, index <= current && styles.progressLabelActive, { writingDirection: isRtl ? "rtl" : "ltr" }]}>{labels[index]}</Text></View>)}</View>;
}

function statusHint(status: MobileApplicationStatus, locale: "ar" | "en") { const ar = locale === "ar"; return status === "pending" ? (ar ? "تم استلام طلبك وهو بانتظار المراجعة." : "Your application was received and is waiting for review.") : status === "reviewing" ? (ar ? "الجهة تراجع طلبك الآن." : "The publisher is reviewing your application.") : status === "shortlisted" ? (ar ? "وصلت إلى القائمة المختصرة." : "You reached the shortlist.") : status === "accepted" ? (ar ? "تم قبولك ويمكنك بدء التواصل." : "You were accepted and can start messaging.") : (ar ? "لم يتم اختيارك لهذه الفرصة." : "You were not selected for this opportunity."); }
function isToday(value: string | null) { if (!value) return false; return new Date(value).toDateString() === new Date().toDateString(); }
function relativeTime(value: string, locale: "ar" | "en") { const delta = Date.now() - Date.parse(value); const mins = Math.max(0, Math.floor(delta / 60000)); if (mins < 1) return locale === "ar" ? "الآن" : "Now"; if (mins < 60) return locale === "ar" ? `منذ ${mins} د` : `${mins}m ago`; const hours = Math.floor(mins / 60); if (hours < 24) return locale === "ar" ? `منذ ${hours} س` : `${hours}h ago`; const days = Math.floor(hours / 24); if (days < 7) return locale === "ar" ? `منذ ${days} أيام` : `${days}d ago`; return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-US-u-ca-gregory-nu-latn", { day:"numeric", month:"short" }).format(new Date(value)); }

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen:{flex:1,backgroundColor:theme.background},content:{paddingHorizontal:20,paddingTop:20,paddingBottom:118},contentCompact:{paddingHorizontal:14,paddingTop:14,paddingBottom:106},header:{gap:10,marginBottom:20},brand:{color:theme.accent,fontSize:12,fontWeight:"900",letterSpacing:1.9},arabicBrand:{letterSpacing:0,writingDirection:"rtl"},title:{color:theme.text,fontSize:30,lineHeight:36,fontWeight:"800"},titleCompact:{fontSize:27,lineHeight:32},subtitle:{color:theme.muted,fontSize:13,lineHeight:20,maxWidth:440},rowRtl:{flexDirection:"row-reverse"},activityNote:{flexDirection:"row",alignItems:"center",gap:8,borderWidth:1,borderColor:"#C9A96233",backgroundColor:"#C9A96208",borderRadius:15,padding:11},activityNoteText:{flex:1,color:theme.muted,fontSize:10},statsRow:{flexDirection:"row",gap:8},stat:{flex:1,minHeight:76,borderWidth:1,borderColor:theme.border,borderRadius:16,backgroundColor:theme.surface,padding:11,justifyContent:"center"},statAccent:{borderColor:"#C9A96255",backgroundColor:"#C9A96208"},statValue:{color:theme.text,fontSize:19,fontWeight:"900",marginTop:3},statValueAccent:{color:theme.accent},statLabel:{color:theme.muted,fontSize:9,marginTop:2},filterRow:{flexDirection:"row",gap:8},filterTab:{flex:1,minHeight:44,borderWidth:1,borderColor:theme.border,borderRadius:13,alignItems:"center",justifyContent:"center",flexDirection:"row",gap:6,paddingHorizontal:8},filterTabActive:{borderColor:theme.accent,backgroundColor:"#C9A96212"},filterText:{color:theme.muted,fontSize:10,fontWeight:"700"},filterTextActive:{color:theme.text},filterBadge:{minWidth:20,height:20,borderRadius:10,backgroundColor:theme.background,alignItems:"center",justifyContent:"center"},filterBadgeActive:{backgroundColor:theme.accent},filterCount:{fontSize:8,fontWeight:"900",color:theme.text},card:{borderWidth:1,borderColor:theme.border,borderRadius:20,backgroundColor:theme.surface,padding:15,gap:12,marginBottom:10},cardCompact:{padding:12},cardAccepted:{borderColor:"#49C99155"},cardTop:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},statusPill:{borderRadius:999,backgroundColor:"#C9A96210",paddingHorizontal:10,paddingVertical:5},statusPillAccepted:{backgroundColor:"#49C99116"},status:{color:theme.accent,fontSize:9,fontWeight:"900"},statusAccepted:{color:"#49C991"},date:{color:theme.muted,fontSize:9},cardTitle:{color:theme.text,fontSize:18,lineHeight:25,fontWeight:"800"},statusHint:{color:theme.muted,fontSize:11,lineHeight:18},metaRow:{flexDirection:"row",alignItems:"center",gap:6},meta:{color:theme.muted,fontSize:10},acceptedBanner:{flexDirection:"row",alignItems:"center",gap:7,borderRadius:13,backgroundColor:"#49C99110",padding:10},acceptedHint:{color:"#9BDDBD",fontSize:10},actionsRow:{flexDirection:"row",gap:8},primaryButton:{flex:1,minHeight:46,borderRadius:13,backgroundColor:theme.accent,alignItems:"center",justifyContent:"center",flexDirection:"row",gap:6,paddingHorizontal:10},primaryButtonText:{color:theme.background,fontSize:11,fontWeight:"900"},secondaryButton:{flex:1,minHeight:46,borderRadius:13,borderWidth:1,borderColor:theme.border,alignItems:"center",justifyContent:"center",flexDirection:"row",gap:6,paddingHorizontal:10},secondaryButtonText:{color:theme.text,fontSize:11,fontWeight:"800"},progress:{flexDirection:"row",justifyContent:"space-between",gap:6},progressStep:{flex:1,alignItems:"center",gap:5},progressDot:{width:8,height:8,borderRadius:4,backgroundColor:theme.grayMuted},progressDotActive:{backgroundColor:theme.accent},progressLabel:{color:theme.muted,fontSize:8,textAlign:"center"},progressLabelActive:{color:theme.text},emptyState:{minHeight:240,borderWidth:1,borderColor:theme.border,borderRadius:22,backgroundColor:theme.surface,padding:24,alignItems:"center",justifyContent:"center",gap:10},emptyIcon:{width:52,height:52,borderRadius:26,borderWidth:1,borderColor:"#C9A96255",alignItems:"center",justifyContent:"center"},emptyTitle:{color:theme.text,fontSize:17,fontWeight:"800",textAlign:"center"},emptyBody:{color:theme.muted,fontSize:12,lineHeight:19,textAlign:"center",maxWidth:310}
}); }