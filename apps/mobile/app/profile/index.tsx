import { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { AppTabBar } from "@/components/AppTabBar";
import { ScreenSkeleton } from "@/components/ScreenSkeleton";
import { getNotifications, getTalentProfile, type MobileTalentProfile } from "@/lib/api";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { preparePushRegistration, signOutMobile } from "@/lib/push";
import { darkTheme } from "@/lib/theme";

export default function ProfileScreen() {
  const locale = getDeviceLocale(); const isArabic = locale === "ar"; const isRtl = isRtlLocale(locale);
  const theme = darkTheme; const styles = useMemo(() => createStyles(theme), [theme]);
  const [profile, setProfile] = useState<MobileTalentProfile | null>(null); const [unreadCount, setUnreadCount] = useState(0); const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false); const [error, setError] = useState<string | null>(null); const [signingOut, setSigningOut] = useState(false); const [pushBusy, setPushBusy] = useState(false); const [pushMessage, setPushMessage] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true); setError(null);
    try {
      const [result, notifications] = await Promise.all([getTalentProfile(locale), getNotifications().catch(() => null)]);
      setUnreadCount(notifications?.unreadCount ?? 0);
      if (!result.ok) { if (result.code === "UNAUTHENTICATED") router.replace({ pathname: "/login", params: { next: "/profile" } }); else setError(isArabic ? "تعذر تحميل ملف الموهبة." : "Unable to load your talent profile."); }
      else setProfile(result.item);
    } catch { setError(isArabic ? "تعذر تحميل ملف الموهبة. تحقق من الاتصال وحاول مرة أخرى." : "Unable to load your talent profile. Check your connection and try again."); }
    finally { setLoading(false); setRefreshing(false); }
  }, [isArabic, locale]);
  useEffect(() => { void load(); }, [load]);

  async function signOut() { setSigningOut(true); await signOutMobile(); setSigningOut(false); router.replace("/"); }
  async function enableNotifications() {
    setPushBusy(true); setPushMessage(null); const result = await preparePushRegistration(locale); setPushBusy(false);
    if (result.ok) { setPushMessage(isArabic ? "تم تفعيل تنبيهات ملامح على هذا الجهاز." : "MLAMH notifications are enabled on this device."); return; }
    const messages: Record<string, { ar: string; en: string }> = {
      PHYSICAL_DEVICE_REQUIRED: { ar: "التنبيهات تحتاج جهازًا فعليًا عند الاختبار.", en: "Push notifications require a physical device for testing." },
      EAS_PROJECT_ID_MISSING: { ar: "إعداد Push لم يكتمل بعد في نسخة البناء الحالية.", en: "Push setup is not complete in this build yet." },
      PERMISSION_DENIED: { ar: "تم رفض إذن الإشعارات. يمكنك تفعيله لاحقًا من إعدادات الجهاز.", en: "Notification permission was denied. You can enable it later in device settings." },
      REGISTER_FAILED: { ar: "تعذر تسجيل هذا الجهاز حاليًا.", en: "This device could not be registered right now." },
    };
    setPushMessage(messages[result.code]?.[locale] ?? (isArabic ? "تعذر تفعيل الإشعارات حاليًا." : "Unable to enable notifications right now."));
  }

  if (loading) return <ScreenSkeleton variant="profile" locale={locale} />;
  return <View style={styles.screen}><ScrollView contentContainerStyle={[styles.content, { direction: isRtl ? "rtl" : "ltr" }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.accent} />}>
    <View style={styles.topBar}><View><Text style={styles.eyebrow}>{isArabic ? "ملامح" : "MLAMH"}</Text><Text style={styles.pageTitle}>{isArabic ? "ملفي" : "Profile"}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "الدعم والسياسات" : "Support and policies"} onPress={() => router.push("/support")}><Text style={styles.topAction}>{isArabic ? "المساعدة" : "Support"}</Text></Pressable></View>

    {error || !profile ? <View style={styles.errorCard}><Text accessibilityRole="alert" style={styles.errorText}>{error ?? (isArabic ? "ملف الموهبة غير متاح." : "Talent profile unavailable.")}</Text><Pressable style={styles.retryButton} onPress={() => void load()}><Text style={styles.retryText}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text></Pressable></View> : <>
      <View style={styles.identitySection}>
        <View style={styles.avatarWrap}>{profile.imageUrl ? <Image source={{ uri: profile.imageUrl }} style={styles.avatar} resizeMode="cover" /> : <View style={styles.avatarPlaceholder}><Text style={styles.avatarInitial}>{profile.displayName.slice(0, 1)}</Text></View>}{profile.verified ? <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>✓</Text></View> : null}</View>
        <Text accessibilityRole="header" style={styles.name}>{profile.displayName}</Text><Text style={styles.category}>{profile.category}</Text><Text style={styles.location}>{[profile.city, profile.baseCountryCode].filter(Boolean).join(" · ") || (isArabic ? "أكمل موقعك" : "Add your location")}</Text>
        <View style={styles.statsRow}><Stat value={`${profile.profileCompletion}%`} label={isArabic ? "اكتمال" : "Completion"} styles={styles} /><Stat value={String(profile.gallery.length)} label={isArabic ? "صور" : "Portfolio"} styles={styles} /><Stat value={String(profile.skills.length)} label={isArabic ? "مهارات" : "Skills"} styles={styles} /></View>
        <Pressable style={styles.primaryButton} onPress={() => router.push("/profile/edit")}><Text style={styles.primaryButtonText}>{isArabic ? "تعديل الملف" : "Edit profile"}</Text></Pressable>
      </View>

      <View style={styles.statusStrip}><StatusItem label={isArabic ? "المراجعة" : "Review"} value={approvalLabel(profile.approvalStatus, locale)} styles={styles} /><StatusItem label={isArabic ? "الظهور" : "Visibility"} value={profile.published ? (isArabic ? "ظاهر" : "Published") : (isArabic ? "خاص" : "Private")} styles={styles} /><StatusItem label={isArabic ? "التوفر" : "Availability"} value={availabilityLabel(profile.availabilityStatus, locale)} styles={styles} /></View>

      <ReadinessCard profile={profile} locale={locale} styles={styles} />

      {profile.bio ? <Section eyebrow={isArabic ? "نبذة" : "ABOUT"} title={isArabic ? "عنّي" : "About"} styles={styles}><Text style={styles.body}>{profile.bio}</Text></Section> : null}
      <Section eyebrow={isArabic ? "المعرض" : "PORTFOLIO"} title={isArabic ? "الأعمال والصور" : "Portfolio"} styles={styles} action={<Pressable onPress={() => router.push("/profile/media")}><Text style={styles.inlineAction}>{isArabic ? "إدارة" : "Manage"}</Text></Pressable>}>
        {profile.gallery.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>{profile.gallery.map((uri, index) => <Image key={`${uri}-${index}`} source={{ uri }} style={styles.galleryImage} resizeMode="cover" />)}</ScrollView> : <Pressable style={styles.emptyMedia} onPress={() => router.push("/profile/media")}><Text style={styles.emptyMediaText}>{isArabic ? "أضف صورًا احترافية لمعرضك" : "Add professional portfolio images"}</Text></Pressable>}
      </Section>

      {profile.skills.length || profile.languages.length ? <Section eyebrow={isArabic ? "الخبرات" : "EXPERIENCE"} title={isArabic ? "المهارات واللغات" : "Skills & languages"} styles={styles}><View style={styles.chips}>{[...profile.skills, ...profile.languages].map((item, i) => <Text key={`${item}-${i}`} style={styles.chip}>{item}</Text>)}</View></Section> : null}

      <View style={styles.utilityCard}><Text style={styles.sectionEyebrow}>{isArabic ? "التنبيهات" : "ALERTS"}</Text><Text style={styles.sectionTitle}>{isArabic ? "تحديثات الفرص والطلبات" : "Opportunity & application updates"}</Text><Text style={styles.body}>{isArabic ? "فعّل التنبيهات لتصلك حالات الطلبات والقبول والرسائل." : "Enable alerts for applications, acceptance and messages."}</Text><Pressable disabled={pushBusy} style={[styles.outlineButton, pushBusy && styles.disabled]} onPress={() => void enableNotifications()}><Text style={styles.outlineButtonText}>{pushBusy ? (isArabic ? "جارٍ التفعيل…" : "Enabling…") : (isArabic ? "تفعيل الإشعارات" : "Enable notifications")}</Text></Pressable>{pushMessage ? <Text style={styles.helper}>{pushMessage}</Text> : null}</View>

      <Pressable style={styles.legalRow} onPress={() => router.push("/support")}><Text style={styles.legalText}>{isArabic ? "الدعم · الخصوصية · الشروط · الاسترداد · الشكاوى" : "Support · Privacy · Terms · Refunds · Complaints"}</Text><Text style={styles.legalArrow}>{isRtl ? "‹" : "›"}</Text></Pressable>
      <Pressable disabled={signingOut} style={styles.signOutButton} onPress={() => void signOut()}><Text style={styles.signOutText}>{signingOut ? (isArabic ? "جارٍ تسجيل الخروج…" : "Signing out…") : (isArabic ? "تسجيل الخروج" : "Sign out")}</Text></Pressable>
    </>}
  </ScrollView><AppTabBar active="profile" locale={locale} theme={theme} notificationCount={unreadCount} /></View>;
}

function Stat({ value, label, styles }: { value: string; label: string; styles: ReturnType<typeof createStyles> }) { return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
function StatusItem({ label, value, styles }: { label: string; value: string; styles: ReturnType<typeof createStyles> }) { return <View style={styles.statusItem}><Text style={styles.statusLabel}>{label}</Text><Text numberOfLines={1} style={styles.statusValue}>{value}</Text></View>; }
function Section({ eyebrow, title, action, children, styles }: { eyebrow: string; title: string; action?: React.ReactNode; children: React.ReactNode; styles: ReturnType<typeof createStyles> }) { return <View style={styles.section}><View style={styles.sectionHeader}><View><Text style={styles.sectionEyebrow}>{eyebrow}</Text><Text style={styles.sectionTitle}>{title}</Text></View>{action}</View>{children}</View>; }
function ReadinessCard({ profile, locale, styles }: { profile: MobileTalentProfile; locale: "ar" | "en"; styles: ReturnType<typeof createStyles> }) {
  const isArabic = locale === "ar";
  const tasks = [
    { done: Boolean(profile.displayName?.trim()), ar: "أضف الاسم المهني", en: "Add your professional name", route: "/profile/edit" as const },
    { done: Boolean(profile.imageUrl), ar: "أضف الصورة الرئيسية", en: "Add your primary photo", route: "/profile/media" as const },
    { done: profile.primaryRole === "actor" || profile.primaryRole === "model", ar: "حدد الدور الأساسي", en: "Set your primary role", route: "/profile/edit" as const },
    { done: Boolean(profile.city), ar: "حدد المدينة", en: "Set your city", route: "/profile/edit" as const },
    { done: Boolean(profile.gender), ar: "حدد الجنس", en: "Set gender", route: "/profile/edit" as const },
    { done: Boolean(profile.dateOfBirth), ar: "أضف تاريخ الميلاد", en: "Add date of birth", route: "/profile/edit" as const },
    { done: Boolean(profile.nationalitySlug || profile.nationality), ar: "أضف الجنسية", en: "Add nationality", route: "/profile/edit" as const },
  ];
  const remaining = tasks.filter((task) => !task.done);
  const ready = remaining.length === 0;
  return <View style={styles.readinessCard}><View style={styles.progressTop}><View><Text style={styles.sectionEyebrow}>{isArabic ? "الجاهزية" : "READINESS"}</Text><Text style={styles.sectionTitle}>{ready ? (isArabic ? "الحقول الأساسية مكتملة" : "Core requirements complete") : (isArabic ? "جهّز ملفك للمراجعة" : "Prepare for review")}</Text></View><Text style={styles.progressValue}>{profile.profileCompletion}%</Text></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, profile.profileCompletion))}%` }]} /></View><Text style={styles.readinessNote}>{isArabic ? "نسبة الاكتمال مؤشر فقط؛ قبول الإرسال يعتمد على الحقول الأساسية المعتمدة في ملامح." : "Completion is an indicator only; submission readiness follows MLAMH's canonical required fields."}</Text>{remaining.slice(0, 4).map((task) => <Pressable key={task.en} style={styles.taskRow} onPress={() => router.push(task.route)}><Text style={styles.taskText}>{isArabic ? task.ar : task.en}</Text><Text style={styles.taskArrow}>›</Text></Pressable>)}<Pressable style={styles.reviewLink} onPress={() => router.push("/profile/review")}><Text style={styles.reviewLinkText}>{isArabic ? "مراجعة الجاهزية وإرسال الملف" : "Review readiness & submit"}</Text></Pressable></View>;
}
function approvalLabel(value: string | null, locale: "ar" | "en") { const ar: Record<string,string> = { approved: "معتمد", pending: "قيد المراجعة", submitted: "قيد المراجعة", changes_requested: "يحتاج تعديل", rejected: "مرفوض", not_submitted: "لم يُرسل" }; const en: Record<string,string> = { approved: "Approved", pending: "In review", submitted: "In review", changes_requested: "Needs changes", rejected: "Rejected", not_submitted: "Not submitted" }; return (locale === "ar" ? ar : en)[value ?? "not_submitted"] ?? (locale === "ar" ? "لم يُرسل" : "Not submitted"); }
function availabilityLabel(value: string | null, locale: "ar" | "en") { const ar: Record<string,string> = { available_now: "متاح الآن", available_this_week: "هذا الأسبوع", available_next_month: "الشهر القادم", unavailable: "غير متاح" }; const en: Record<string,string> = { available_now: "Available now", available_this_week: "This week", available_next_month: "Next month", unavailable: "Unavailable" }; return (locale === "ar" ? ar : en)[value ?? ""] ?? (locale === "ar" ? "غير محدد" : "Not set"); }

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, content: { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 34, gap: 20 }, topBar: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }, eyebrow: { color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.7 }, pageTitle: { color: theme.text, fontSize: 32, lineHeight: 39, fontWeight: "700", marginTop: 2 }, topAction: { color: theme.muted, fontSize: 11, fontWeight: "700", paddingVertical: 7 },
  identitySection: { alignItems: "center", gap: 6 }, avatarWrap: { width: 112, height: 112, marginBottom: 4 }, avatar: { width: 112, height: 112, borderRadius: 56, borderWidth: 1, borderColor: theme.border }, avatarPlaceholder: { width: 112, height: 112, borderRadius: 56, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }, avatarInitial: { color: theme.accent, fontSize: 42, fontWeight: "500" }, verifiedBadge: { position: "absolute", right: 2, bottom: 3, width: 26, height: 26, borderRadius: 13, backgroundColor: theme.accent, borderWidth: 3, borderColor: theme.background, alignItems: "center", justifyContent: "center" }, verifiedText: { color: theme.background, fontWeight: "900", fontSize: 11 }, name: { color: theme.text, fontSize: 26, lineHeight: 32, fontWeight: "800", textAlign: "center" }, category: { color: theme.accent, fontSize: 12, fontWeight: "800" }, location: { color: theme.muted, fontSize: 11 },
  statsRow: { width: "100%", flexDirection: "row", borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.border, marginTop: 8 }, stat: { flex: 1, alignItems: "center", paddingVertical: 12 }, statValue: { color: theme.text, fontSize: 18, fontWeight: "800" }, statLabel: { color: theme.muted, fontSize: 9, marginTop: 2 }, primaryButton: { width: "100%", minHeight: 50, borderRadius: 12, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center", marginTop: 4 }, primaryButtonText: { color: theme.background, fontSize: 13, fontWeight: "900" },
  statusStrip: { flexDirection: "row", gap: 8 }, statusItem: { flex: 1, gap: 3, borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 10 }, statusLabel: { color: theme.muted, fontSize: 9 }, statusValue: { color: theme.text, fontSize: 11, fontWeight: "800" },
  section: { gap: 11 }, sectionHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }, sectionEyebrow: { color: theme.accent, fontSize: 9, fontWeight: "900", letterSpacing: 1.5 }, sectionTitle: { color: theme.text, fontSize: 18, fontWeight: "800", marginTop: 2 }, body: { color: theme.muted, fontSize: 13, lineHeight: 21 }, inlineAction: { color: theme.accent, fontSize: 11, fontWeight: "800" },
  readinessCard: { gap: 11, padding: 16, borderWidth: 1, borderColor: theme.border, borderRadius: 16, backgroundColor: theme.surface }, progressTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, progressValue: { color: theme.accent, fontSize: 21, fontWeight: "900" }, progressTrack: { height: 5, borderRadius: 3, overflow: "hidden", backgroundColor: theme.border }, progressFill: { height: 5, backgroundColor: theme.accent }, readinessNote: { color: theme.muted, fontSize: 10, lineHeight: 17 }, taskRow: { minHeight: 38, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 9, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 9 }, taskText: { flex: 1, color: theme.text, fontSize: 11 }, taskArrow: { color: theme.accent, fontSize: 18 }, reviewLink: { minHeight: 42, alignItems: "center", justifyContent: "center", borderRadius: 11, borderWidth: 1, borderColor: theme.accent }, reviewLinkText: { color: theme.accent, fontSize: 11, fontWeight: "800" },
  galleryRow: { gap: 9 }, galleryImage: { width: 150, height: 200, borderRadius: 14, backgroundColor: theme.surface }, emptyMedia: { minHeight: 110, borderWidth: 1, borderStyle: "dashed", borderColor: theme.border, borderRadius: 14, alignItems: "center", justifyContent: "center" }, emptyMediaText: { color: theme.muted, fontSize: 11, fontWeight: "700" }, chips: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, chip: { color: theme.text, backgroundColor: theme.chip, borderWidth: 1, borderColor: theme.border, borderRadius: 999, overflow: "hidden", paddingHorizontal: 10, paddingVertical: 6, fontSize: 10, fontWeight: "700" },
  utilityCard: { gap: 11, padding: 16, borderWidth: 1, borderColor: theme.border, borderRadius: 16, backgroundColor: theme.surface }, outlineButton: { minHeight: 46, borderRadius: 11, borderWidth: 1, borderColor: theme.accent, alignItems: "center", justifyContent: "center" }, outlineButtonText: { color: theme.accent, fontSize: 11, fontWeight: "900" }, helper: { color: theme.muted, fontSize: 10, lineHeight: 17 }, legalRow: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.border }, legalText: { flex: 1, color: theme.muted, fontSize: 10, lineHeight: 16 }, legalArrow: { color: theme.accent, fontSize: 20 }, signOutButton: { minHeight: 48, alignItems: "center", justifyContent: "center" }, signOutText: { color: "#E59A9A", fontSize: 11, fontWeight: "800" }, disabled: { opacity: 0.5 },
  errorCard: { minHeight: 210, borderWidth: 1, borderColor: theme.border, borderRadius: 16, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center", gap: 14, padding: 20 }, errorText: { color: theme.text, textAlign: "center", fontSize: 14 }, retryButton: { backgroundColor: theme.accent, borderRadius: 11, paddingHorizontal: 17, paddingVertical: 10 }, retryText: { color: theme.background, fontWeight: "900" },
}); }
