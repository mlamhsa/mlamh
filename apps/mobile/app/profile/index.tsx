import { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Bell, Camera, Settings } from "lucide-react-native";

import { AppTabBar } from "@/components/AppTabBar";
import { ScreenSkeleton } from "@/components/ScreenSkeleton";
import { getNotifications, getTalentProfile, type MobileTalentProfile } from "@/lib/api";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { darkTheme } from "@/lib/theme";

function countryLabel(code: string | null, locale: "ar" | "en") {
  if (code === "SA") return locale === "ar" ? "السعودية" : "Saudi Arabia";
  if (code === "AE") return locale === "ar" ? "الإمارات" : "United Arab Emirates";
  if (code === "QA") return locale === "ar" ? "قطر" : "Qatar";
  return null;
}

export default function ProfileScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [profile, setProfile] = useState<MobileTalentProfile | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const [result, notifications] = await Promise.all([getTalentProfile(locale), getNotifications().catch(() => null)]);
      setUnreadCount(notifications?.unreadCount ?? 0);
      if (!result.ok) {
        if (result.code === "UNAUTHENTICATED") router.replace({ pathname: "/login", params: { next: "/profile" } });
        else setError(isArabic ? "تعذر تحميل ملف الموهبة." : "Unable to load your talent profile.");
      } else setProfile(result.item);
    } catch {
      setError(isArabic ? "تعذر تحميل ملف الموهبة. تحقق من الاتصال وحاول مرة أخرى." : "Unable to load your talent profile. Check your connection and try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isArabic, locale]);

  useEffect(() => { void load(); }, [load]);
  if (loading) return <ScreenSkeleton variant="profile" locale={locale} />;

  return <View style={styles.screen}>
    <ScrollView contentContainerStyle={[styles.content, { direction: isRtl ? "rtl" : "ltr" }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.accent} />}>
      <View style={styles.topBar}>
        <View><Text style={styles.eyebrow}>{isArabic ? "ملامح" : "MLAMH"}</Text><Text style={styles.pageTitle}>{isArabic ? "ملفي" : "Profile"}</Text></View>
        <View style={styles.headerActions}>
          <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "الإشعارات" : "Notifications"} onPress={() => router.push("/notifications")} style={styles.iconButton}>
            <Bell size={20} strokeWidth={1.9} color={theme.text} />{unreadCount > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text></View> : null}
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "الإعدادات" : "Settings"} onPress={() => router.push("/profile/settings")} style={styles.iconButton}><Settings size={20} strokeWidth={1.9} color={theme.text} /></Pressable>
        </View>
      </View>

      {error || !profile ? <View style={styles.errorCard}><Text style={styles.errorText}>{error ?? (isArabic ? "ملف الموهبة غير متاح." : "Talent profile unavailable.")}</Text><Pressable style={styles.retryButton} onPress={() => void load()}><Text style={styles.retryText}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text></Pressable></View> : <>
        <View style={styles.identitySection}>
          <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "تعديل صورة الملف" : "Edit profile photo"} onPress={() => router.push("/profile/media")} style={styles.avatarWrap}>
            {profile.imageUrl ? <Image source={{ uri: profile.imageUrl }} style={styles.avatar} resizeMode="cover" /> : <View style={styles.avatarPlaceholder}><Text style={styles.avatarInitial}>{profile.displayName.slice(0, 1)}</Text></View>}
            <View style={styles.photoEdit}><Camera size={17} strokeWidth={2.2} color={theme.background} /></View>
          </Pressable>
          <Text accessibilityRole="header" style={styles.name}>{profile.displayName}</Text>
          <Text style={styles.category}>{profile.category}</Text>
          <Text style={styles.location}>{[countryLabel(profile.baseCountryCode, locale), profile.city].filter(Boolean).join(" · ") || (isArabic ? "أضف الدولة والمدينة" : "Add country and city")}</Text>
          <View style={styles.statsRow}><Stat value={`${profile.profileCompletion}%`} label={isArabic ? "اكتمال" : "Completion"} styles={styles} /><Stat value={String(profile.gallery.length)} label={isArabic ? "صور" : "Portfolio"} styles={styles} /><Stat value={String(profile.skills.length)} label={isArabic ? "مهارات" : "Skills"} styles={styles} /></View>
          <Pressable style={styles.primaryButton} onPress={() => router.push("/profile/edit")}><Text style={styles.primaryButtonText}>{isArabic ? "تعديل الملف" : "Edit profile"}</Text></Pressable>
        </View>

        <View style={styles.statusStrip}><StatusItem label={isArabic ? "المراجعة" : "Review"} value={approvalLabel(profile.approvalStatus, locale)} styles={styles} /><StatusItem label={isArabic ? "الظهور" : "Visibility"} value={profile.published ? (isArabic ? "ظاهر" : "Published") : (isArabic ? "خاص" : "Private")} styles={styles} /><StatusItem label={isArabic ? "التوفر" : "Availability"} value={availabilityLabel(profile.availabilityStatus, locale)} styles={styles} /></View>

        <ReadinessCard profile={profile} locale={locale} styles={styles} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}><View><Text style={styles.sectionEyebrow}>{isArabic ? "المعرض" : "PORTFOLIO"}</Text><Text style={styles.sectionTitle}>{isArabic ? "الأعمال والصور" : "Portfolio"}</Text></View><Pressable onPress={() => router.push("/profile/media")}><Text style={styles.inlineAction}>{isArabic ? "إدارة" : "Manage"}</Text></Pressable></View>
          {profile.gallery.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>{profile.gallery.map((uri, index) => <Image key={`${uri}-${index}`} source={{ uri }} style={styles.galleryImage} resizeMode="cover" />)}</ScrollView> : <Pressable style={styles.emptyMedia} onPress={() => router.push("/profile/media")}><Text style={styles.emptyMediaText}>{isArabic ? "أضف صورًا احترافية لمعرضك" : "Add professional portfolio images"}</Text></Pressable>}
        </View>
      </>}
    </ScrollView>
    <AppTabBar active="profile" locale={locale} theme={theme} notificationCount={unreadCount} />
  </View>;
}

function Stat({ value, label, styles }: { value: string; label: string; styles: ReturnType<typeof createStyles> }) { return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
function StatusItem({ label, value, styles }: { label: string; value: string; styles: ReturnType<typeof createStyles> }) { return <View style={styles.statusItem}><Text style={styles.statusLabel}>{label}</Text><Text numberOfLines={1} style={styles.statusValue}>{value}</Text></View>; }
function ReadinessCard({ profile, locale, styles }: { profile: MobileTalentProfile; locale: "ar" | "en"; styles: ReturnType<typeof createStyles> }) {
  const isArabic = locale === "ar";
  const tasks = [
    { done: Boolean(profile.imageUrl), ar: "أضف الصورة الرئيسية", en: "Add your primary photo", route: "/profile/media" as const },
    { done: Boolean(profile.baseCountryCode), ar: "حدد الدولة", en: "Set your country", route: "/profile/edit" as const },
    { done: Boolean(profile.city), ar: "حدد المدينة", en: "Set your city", route: "/profile/edit" as const },
    { done: Boolean(profile.gender), ar: "حدد الجنس", en: "Set gender", route: "/profile/edit" as const },
    { done: Boolean(profile.dateOfBirth), ar: "أضف تاريخ الميلاد", en: "Add date of birth", route: "/profile/edit" as const },
  ];
  const remaining = tasks.filter((task) => !task.done);
  return <View style={styles.readinessCard}><View style={styles.progressTop}><View><Text style={styles.sectionEyebrow}>{isArabic ? "الجاهزية" : "READINESS"}</Text><Text style={styles.sectionTitle}>{remaining.length ? (isArabic ? "جهّز ملفك للمراجعة" : "Prepare for review") : (isArabic ? "الحقول الأساسية مكتملة" : "Core requirements complete")}</Text></View><Text style={styles.progressValue}>{profile.profileCompletion}%</Text></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, profile.profileCompletion))}%` }]} /></View>{remaining.slice(0, 5).map((task) => <Pressable key={task.en} style={styles.taskRow} onPress={() => router.push(task.route)}><Text style={styles.taskText}>{isArabic ? task.ar : task.en}</Text><Text style={styles.taskArrow}>›</Text></Pressable>)}<Pressable style={styles.reviewLink} onPress={() => router.push("/profile/review")}><Text style={styles.reviewLinkText}>{isArabic ? "مراجعة الجاهزية وإرسال الملف" : "Review readiness & submit"}</Text></Pressable></View>;
}
function approvalLabel(value: string | null, locale: "ar" | "en") { const ar: Record<string,string> = { approved: "معتمد", pending: "قيد المراجعة", submitted: "قيد المراجعة", changes_requested: "يحتاج تعديل", rejected: "مرفوض", not_submitted: "لم يُرسل" }; const en: Record<string,string> = { approved: "Approved", pending: "In review", submitted: "In review", changes_requested: "Needs changes", rejected: "Rejected", not_submitted: "Not submitted" }; return (locale === "ar" ? ar : en)[value ?? "not_submitted"] ?? (locale === "ar" ? "لم يُرسل" : "Not submitted"); }
function availabilityLabel(value: string | null, locale: "ar" | "en") { const map: Record<string, { ar: string; en: string }> = { available_now: { ar: "متاح الآن", en: "Available now" }, available_this_week: { ar: "متاح هذا الأسبوع", en: "Available this week" }, available_next_month: { ar: "متاح الشهر القادم", en: "Available next month" }, unavailable: { ar: "غير متاح", en: "Unavailable" } }; return value && map[value] ? map[value][locale] : (locale === "ar" ? "غير محدد" : "Not set"); }

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen:{flex:1,backgroundColor:theme.background},content:{width:"100%",maxWidth:720,alignSelf:"center",paddingHorizontal:20,paddingTop:24,paddingBottom:40,gap:18},topBar:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},headerActions:{flexDirection:"row",gap:10},iconButton:{width:46,height:46,borderRadius:23,borderWidth:1,borderColor:theme.border,alignItems:"center",justifyContent:"center",position:"relative"},iconGlyph:{fontSize:19,color:theme.text},badge:{position:"absolute",right:-3,top:-3,minWidth:18,height:18,borderRadius:9,backgroundColor:theme.accent,alignItems:"center",justifyContent:"center",paddingHorizontal:4},badgeText:{fontSize:9,fontWeight:"900",color:theme.background},eyebrow:{color:theme.accent,fontSize:12,fontWeight:"900",letterSpacing:2},pageTitle:{color:theme.text,fontSize:36,lineHeight:44,fontWeight:"800"},errorCard:{borderWidth:1,borderColor:theme.border,borderRadius:18,padding:24,alignItems:"center",gap:16},errorText:{color:theme.text,fontSize:16,textAlign:"center"},retryButton:{backgroundColor:theme.accent,borderRadius:12,paddingHorizontal:24,paddingVertical:14},retryText:{color:theme.background,fontWeight:"900"},identitySection:{alignItems:"center",gap:8},avatarWrap:{width:132,height:132,borderRadius:66,position:"relative"},avatar:{width:132,height:132,borderRadius:66},avatarPlaceholder:{width:132,height:132,borderRadius:66,borderWidth:1,borderColor:theme.border,alignItems:"center",justifyContent:"center",backgroundColor:theme.surface},avatarInitial:{fontSize:54,color:theme.accent,fontWeight:"500"},photoEdit:{position:"absolute",right:2,bottom:4,width:34,height:34,borderRadius:17,backgroundColor:theme.accent,alignItems:"center",justifyContent:"center",borderWidth:3,borderColor:theme.background},photoEditText:{color:theme.background,fontSize:20,fontWeight:"900"},name:{color:theme.text,fontSize:30,fontWeight:"900"},category:{color:theme.accent,fontSize:16,fontWeight:"800"},location:{color:theme.muted,fontSize:15},statsRow:{width:"100%",flexDirection:"row",borderTopWidth:1,borderBottomWidth:1,borderColor:theme.border,marginTop:12},stat:{flex:1,alignItems:"center",paddingVertical:15},statValue:{color:theme.text,fontSize:24,fontWeight:"900"},statLabel:{color:theme.muted,fontSize:12,marginTop:3},primaryButton:{width:"100%",backgroundColor:theme.accent,borderRadius:14,minHeight:54,alignItems:"center",justifyContent:"center",marginTop:4},primaryButtonText:{color:theme.background,fontWeight:"900",fontSize:16},statusStrip:{flexDirection:"row",gap:10},statusItem:{flex:1,borderBottomWidth:1,borderColor:theme.border,paddingBottom:12},statusLabel:{color:theme.muted,fontSize:11},statusValue:{color:theme.text,fontSize:14,fontWeight:"800",marginTop:5},readinessCard:{borderWidth:1,borderColor:theme.border,borderRadius:18,padding:18,gap:13},progressTop:{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-start"},progressValue:{color:theme.accent,fontSize:28,fontWeight:"900"},progressTrack:{height:7,borderRadius:4,backgroundColor:theme.border,overflow:"hidden"},progressFill:{height:"100%",backgroundColor:theme.accent},sectionEyebrow:{color:theme.accent,fontSize:10,fontWeight:"900",letterSpacing:2},sectionTitle:{color:theme.text,fontSize:22,fontWeight:"900",marginTop:4},taskRow:{minHeight:50,borderTopWidth:1,borderColor:theme.border,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},taskText:{color:theme.text,fontSize:14},taskArrow:{color:theme.accent,fontSize:24},reviewLink:{minHeight:52,borderRadius:13,borderWidth:1,borderColor:theme.accent,alignItems:"center",justifyContent:"center"},reviewLinkText:{color:theme.accent,fontWeight:"900"},section:{gap:12},sectionHeader:{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-end"},inlineAction:{color:theme.accent,fontWeight:"900"},galleryRow:{gap:10},galleryImage:{width:116,height:150,borderRadius:14,backgroundColor:theme.surface},emptyMedia:{minHeight:130,borderWidth:1,borderStyle:"dashed",borderColor:theme.border,borderRadius:16,alignItems:"center",justifyContent:"center"},emptyMediaText:{color:theme.muted,fontSize:14}
});}
