import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useColorScheme } from "react-native";
import { router } from "expo-router";

import { AppTabBar } from "@/components/AppTabBar";
import { getNotifications, getTalentProfile, type MobileTalentProfile } from "@/lib/api";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { preparePushRegistration, signOutMobile } from "@/lib/push";
import { darkTheme, lightTheme } from "@/lib/theme";

export default function ProfileScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const theme = useColorScheme() === "dark" ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [profile, setProfile] = useState<MobileTalentProfile | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const [result, notifications] = await Promise.all([getTalentProfile(locale), getNotifications().catch(() => null)]);
      setUnreadCount(notifications?.unreadCount ?? 0);
      if (!result.ok) {
        if (result.code === "UNAUTHENTICATED") {
          router.replace({ pathname: "/login", params: { next: "/profile" } });
          return;
        }
        setError(isArabic ? "تعذر تحميل ملف الموهبة." : "Unable to load your talent profile.");
      } else {
        setProfile(result.item);
      }
    } catch {
      setError(isArabic ? "تعذر تحميل ملف الموهبة. تحقق من الاتصال وحاول مرة أخرى." : "Unable to load your talent profile. Check your connection and try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isArabic, locale]);

  useEffect(() => { void load(); }, [load]);

  async function signOut() {
    setSigningOut(true);
    await signOutMobile();
    setSigningOut(false);
    router.replace("/");
  }

  async function enableNotifications() {
    setPushBusy(true);
    setPushMessage(null);
    const result = await preparePushRegistration(locale);
    setPushBusy(false);
    if (result.ok) {
      setPushMessage(isArabic ? "تم تفعيل تنبيهات ملامح على هذا الجهاز." : "MLAMH notifications are enabled on this device.");
      return;
    }
    const messages: Record<string, { ar: string; en: string }> = {
      PHYSICAL_DEVICE_REQUIRED: { ar: "التنبيهات تحتاج جهازًا فعليًا عند الاختبار.", en: "Push notifications require a physical device for testing." },
      EAS_PROJECT_ID_MISSING: { ar: "إعداد Push لم يكتمل بعد في نسخة البناء الحالية.", en: "Push setup is not complete in this build yet." },
      PERMISSION_DENIED: { ar: "تم رفض إذن الإشعارات. يمكنك تفعيله لاحقًا من إعدادات الجهاز.", en: "Notification permission was denied. You can enable it later in device settings." },
      REGISTER_FAILED: { ar: "تعذر تسجيل هذا الجهاز حاليًا.", en: "This device could not be registered right now." },
    };
    const message = messages[result.code];
    setPushMessage(message ? message[locale] : (isArabic ? "تعذر تفعيل الإشعارات حاليًا." : "Unable to enable notifications right now."));
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.accent} /></View>;

  return <View style={styles.screen}>
    <ScrollView
      contentContainerStyle={[styles.content, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.accent} />}
    >
      <View style={styles.topBar}>
        <View><Text style={styles.eyebrow}>MLAMH</Text><Text style={styles.pageTitle}>{isArabic ? "ملفي" : "Profile"}</Text></View>
        <View style={styles.brandMark}><Text style={styles.brandMarkText}>M</Text></View>
      </View>

      {error || !profile ? <View style={styles.errorCard}>
        <Text accessibilityRole="alert" style={styles.errorText}>{error ?? (isArabic ? "ملف الموهبة غير متاح." : "Talent profile unavailable.")}</Text>
        <Pressable accessibilityRole="button" style={styles.retryButton} onPress={() => void load()}><Text style={styles.retryText}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text></Pressable>
      </View> : <>
        <View style={styles.identitySection}>
          <View style={styles.avatarWrap}>
            {profile.imageUrl ? <Image source={{ uri: profile.imageUrl }} style={styles.avatar} resizeMode="cover" /> : <View style={styles.avatarPlaceholder}><Text style={styles.avatarInitial}>{profile.displayName.slice(0, 1)}</Text></View>}
            {profile.verified ? <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>✓</Text></View> : null}
          </View>
          <Text accessibilityRole="header" style={styles.name}>{profile.displayName}</Text>
          <Text style={styles.category}>{profile.category}</Text>
          <Text style={styles.location}>{[profile.city, profile.baseCountryCode].filter(Boolean).join(" · ") || (isArabic ? "أكمل موقعك" : "Add your location")}</Text>

          <View style={styles.statsRow}>
            <Stat value={`${profile.profileCompletion}%`} label={isArabic ? "اكتمال الملف" : "Completion"} styles={styles} />
            <View style={styles.statDivider} />
            <Stat value={String(profile.gallery.length)} label={isArabic ? "أعمال" : "Portfolio"} styles={styles} />
            <View style={styles.statDivider} />
            <Stat value={String(profile.skills.length)} label={isArabic ? "مهارات" : "Skills"} styles={styles} />
          </View>

          <Pressable accessibilityRole="button" style={({ pressed }) => [styles.editPrimary, pressed && styles.pressed]} onPress={() => router.push("/profile/edit")}>
            <Text style={styles.editPrimaryText}>{isArabic ? "تعديل الملف" : "Edit profile"}</Text>
          </Pressable>
        </View>

        <View style={styles.tabs}><Text style={[styles.tab, styles.tabActive]}>{isArabic ? "نبذة" : "About"}</Text><Text style={styles.tab}>{isArabic ? "الأعمال" : "Portfolio"}</Text><Text style={styles.tab}>{isArabic ? "المهارات" : "Skills"}</Text></View>

        {profile.bio ? <View style={styles.cleanSection}><Text style={styles.sectionTitle}>{isArabic ? "نبذة" : "About"}</Text><Text style={styles.body}>{profile.bio}</Text></View> : null}

        <ReadinessCard profile={profile} locale={locale} styles={styles} />

        <View style={styles.cleanSection}>
          <View style={styles.sectionHeader}><View><Text style={styles.sectionEyebrow}>{isArabic ? "المعرض" : "PORTFOLIO"}</Text><Text style={styles.sectionTitle}>{isArabic ? "الأعمال والصور" : "Portfolio"}</Text></View><Pressable accessibilityRole="button" onPress={() => router.push("/profile/media")}><Text style={styles.inlineAction}>{isArabic ? "إدارة" : "Manage"}</Text></Pressable></View>
          {profile.gallery.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>{profile.gallery.map((uri, index) => <Image key={`${uri}-${index}`} source={{ uri }} style={styles.galleryImage} resizeMode="cover" />)}</ScrollView> : <Pressable style={styles.emptyMedia} onPress={() => router.push("/profile/media")}><Text style={styles.emptyMediaMark}>＋</Text><Text style={styles.emptyMediaText}>{isArabic ? "أضف أول صورة لمعرضك" : "Add your first portfolio image"}</Text></Pressable>}
        </View>

        {profile.skills.length ? <View style={styles.cleanSection}><Text style={styles.sectionEyebrow}>{isArabic ? "الخبرات" : "SKILLS"}</Text><Text style={styles.sectionTitle}>{isArabic ? "المهارات" : "Skills"}</Text><View style={styles.chips}>{profile.skills.map((skill) => <Text key={skill} style={styles.chip}>{skill}</Text>)}</View></View> : null}

        <View style={styles.utilityCard}>
          <Text style={styles.sectionEyebrow}>{isArabic ? "الحالة" : "STATUS"}</Text>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>{isArabic ? "التوفر" : "Availability"}</Text><Text style={styles.infoValue}>{profile.availabilityStatus ?? (isArabic ? "غير محدد" : "Not set")}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>{isArabic ? "الظهور" : "Visibility"}</Text><Text style={styles.infoValue}>{profile.published ? (isArabic ? "ظاهر" : "Published") : (isArabic ? "غير منشور" : "Private")}</Text></View>
        </View>

        <View style={styles.utilityCard}>
          <Text style={styles.sectionEyebrow}>{isArabic ? "التنبيهات" : "ALERTS"}</Text>
          <Text style={styles.sectionTitle}>{isArabic ? "لا تفوّت تحديثًا مهمًا" : "Never miss an important update"}</Text>
          <Text style={styles.body}>{isArabic ? "فعّل التنبيهات لتصلك تحديثات الطلبات والقبول والرسائل على جهازك." : "Enable alerts for application updates, acceptances and messages on your device."}</Text>
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: pushBusy, busy: pushBusy }} disabled={pushBusy} style={[styles.outlineButton, pushBusy && styles.disabled]} onPress={() => void enableNotifications()}><Text style={styles.outlineButtonText}>{pushBusy ? (isArabic ? "جارٍ التفعيل…" : "Enabling…") : (isArabic ? "تفعيل الإشعارات" : "Enable notifications")}</Text></Pressable>
          {pushMessage ? <Text accessibilityLiveRegion="polite" style={styles.pushMessage}>{pushMessage}</Text> : null}
        </View>

        <Pressable accessibilityRole="button" disabled={signingOut} style={styles.signOutButton} onPress={() => void signOut()}><Text style={styles.signOutText}>{signingOut ? (isArabic ? "جارٍ تسجيل الخروج…" : "Signing out…") : (isArabic ? "تسجيل الخروج" : "Sign out")}</Text></Pressable>
      </>}
    </ScrollView>
    <AppTabBar active="profile" locale={locale} theme={theme} notificationCount={unreadCount} />
  </View>;
}

function Stat({ value, label, styles }: { value: string; label: string; styles: ReturnType<typeof createStyles> }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function ReadinessCard({ profile, locale, styles }: { profile: MobileTalentProfile; locale: "ar" | "en"; styles: ReturnType<typeof createStyles> }) {
  const tasks = [
    { done: profile.gallery.length >= 3, ar: "أضف 3 صور قوية على الأقل", en: "Add at least 3 strong portfolio images", action: () => router.push("/profile/media") },
    { done: Boolean(profile.bio?.trim()), ar: "اكتب نبذة مهنية مختصرة", en: "Write a concise professional bio", action: () => router.push("/profile/edit") },
    { done: profile.skills.length > 0, ar: "أضف مهاراتك الأساسية", en: "Add your core skills", action: () => router.push("/profile/edit") },
    { done: Boolean(profile.city), ar: "حدد مدينتك", en: "Set your city", action: () => router.push("/profile/edit") },
  ];
  const remaining = tasks.filter((task) => !task.done);
  const isArabic = locale === "ar";
  return <View style={styles.readinessCard}>
    <View style={styles.progressTop}><View style={styles.progressText}><Text style={styles.sectionEyebrow}>{isArabic ? "الجاهزية" : "READINESS"}</Text><Text style={styles.sectionTitle}>{isArabic ? "جاهزية ملفك" : "Profile readiness"}</Text><Text style={styles.progressCaption}>{remaining.length === 0 ? (isArabic ? "ملف قوي وجاهز للظهور" : "Strong portfolio, ready to be discovered") : (isArabic ? `${remaining.length} خطوات مقترحة` : `${remaining.length} suggested steps`)}</Text></View><Text style={styles.progressValue}>{profile.profileCompletion}%</Text></View>
    <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, profile.profileCompletion))}%` }]} /></View>
    {remaining.slice(0, 3).map((task) => <Pressable accessibilityRole="button" key={task.en} style={styles.taskRow} onPress={task.action}><View style={styles.taskDot} /><Text style={styles.taskText}>{isArabic ? task.ar : task.en}</Text><Text style={styles.taskArrow}>›</Text></Pressable>)}
  </View>;
}

function createStyles(theme: typeof lightTheme | typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 30, gap: 20 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, eyebrow: { color: theme.accent, fontSize: 11, fontWeight: "900", letterSpacing: 2.4 }, pageTitle: { color: theme.text, fontSize: 34, fontWeight: "700", marginTop: 2 }, brandMark: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: theme.accent, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }, brandMarkText: { color: theme.accent, fontSize: 19, fontWeight: "900" },
  identitySection: { alignItems: "center", gap: 7, paddingTop: 6 }, avatarWrap: { width: 122, height: 122, marginBottom: 6 }, avatar: { width: 122, height: 122, borderRadius: 61, borderWidth: 2, borderColor: theme.accent }, avatarPlaceholder: { width: 122, height: 122, borderRadius: 61, borderWidth: 2, borderColor: theme.accent, backgroundColor: theme.charcoal, alignItems: "center", justifyContent: "center" }, avatarInitial: { color: theme.accent, fontSize: 50, fontWeight: "300" }, verifiedBadge: { position: "absolute", right: 3, bottom: 5, width: 28, height: 28, borderRadius: 14, backgroundColor: theme.accent, borderWidth: 3, borderColor: theme.background, alignItems: "center", justifyContent: "center" }, verifiedText: { color: theme.charcoal, fontWeight: "900", fontSize: 13 }, name: { color: theme.text, fontSize: 28, lineHeight: 34, fontWeight: "800", textAlign: "center" }, category: { color: theme.accent, fontSize: 13, fontWeight: "800" }, location: { color: theme.muted, fontSize: 12 },
  statsRow: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 10, marginBottom: 7, paddingVertical: 12 }, stat: { flex: 1, alignItems: "center", gap: 3 }, statValue: { color: theme.text, fontSize: 19, fontWeight: "800" }, statLabel: { color: theme.muted, fontSize: 9, textAlign: "center" }, statDivider: { width: 1, height: 32, backgroundColor: theme.border }, editPrimary: { width: "100%", minHeight: 52, borderRadius: 16, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" }, editPrimaryText: { color: theme.charcoal, fontSize: 14, fontWeight: "900" }, pressed: { opacity: 0.76, transform: [{ scale: 0.995 }] },
  tabs: { flexDirection: "row", alignItems: "center", gap: 24, borderBottomWidth: 1, borderBottomColor: theme.border }, tab: { color: theme.muted, fontSize: 12, fontWeight: "700", paddingVertical: 11 }, tabActive: { color: theme.accent, borderBottomWidth: 2, borderBottomColor: theme.accent },
  cleanSection: { gap: 11 }, sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }, sectionEyebrow: { color: theme.accent, fontSize: 9, fontWeight: "900", letterSpacing: 1.8 }, sectionTitle: { color: theme.text, fontSize: 19, fontWeight: "800" }, body: { color: theme.muted, fontSize: 14, lineHeight: 23 }, inlineAction: { color: theme.accent, fontSize: 12, fontWeight: "900" },
  readinessCard: { gap: 12, padding: 18, borderWidth: 1, borderColor: theme.border, borderRadius: 22, backgroundColor: theme.surface }, progressTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }, progressText: { flex: 1, gap: 3 }, progressCaption: { color: theme.muted, fontSize: 10 }, progressValue: { color: theme.accent, fontSize: 23, fontWeight: "900" }, progressTrack: { height: 6, borderRadius: 3, overflow: "hidden", backgroundColor: theme.border }, progressFill: { height: 6, borderRadius: 3, backgroundColor: theme.accent }, taskRow: { minHeight: 42, flexDirection: "row", alignItems: "center", gap: 9, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 10 }, taskDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.accent }, taskText: { flex: 1, color: theme.text, fontSize: 12 }, taskArrow: { color: theme.accent, fontSize: 20 },
  galleryRow: { gap: 10, paddingVertical: 2 }, galleryImage: { width: 162, height: 212, borderRadius: 18, backgroundColor: theme.surface }, emptyMedia: { minHeight: 130, borderWidth: 1, borderStyle: "dashed", borderColor: theme.border, borderRadius: 20, alignItems: "center", justifyContent: "center", gap: 7 }, emptyMediaMark: { color: theme.accent, fontSize: 28 }, emptyMediaText: { color: theme.muted, fontSize: 12, fontWeight: "700" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, chip: { color: theme.text, backgroundColor: theme.chip, borderWidth: 1, borderColor: theme.border, borderRadius: 14, overflow: "hidden", paddingHorizontal: 11, paddingVertical: 7, fontSize: 11, fontWeight: "700" },
  utilityCard: { gap: 12, padding: 18, borderWidth: 1, borderColor: theme.border, borderRadius: 22, backgroundColor: theme.surface }, infoRow: { flexDirection: "row", justifyContent: "space-between", gap: 14, paddingVertical: 4 }, infoLabel: { color: theme.muted, fontSize: 12 }, infoValue: { color: theme.text, fontSize: 12, fontWeight: "800" }, outlineButton: { minHeight: 48, borderRadius: 15, borderWidth: 1, borderColor: theme.accent, alignItems: "center", justifyContent: "center" }, outlineButtonText: { color: theme.accent, fontSize: 12, fontWeight: "900" }, pushMessage: { color: theme.muted, fontSize: 11, lineHeight: 18 }, disabled: { opacity: 0.5 },
  signOutButton: { minHeight: 48, alignItems: "center", justifyContent: "center" }, signOutText: { color: theme.muted, fontSize: 12, fontWeight: "700" },
  errorCard: { minHeight: 220, borderWidth: 1, borderColor: theme.border, borderRadius: 22, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center", gap: 14, padding: 20 }, errorText: { color: theme.text, textAlign: "center", fontSize: 15 }, retryButton: { backgroundColor: theme.accent, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 11 }, retryText: { color: theme.charcoal, fontWeight: "900" },
}); }
