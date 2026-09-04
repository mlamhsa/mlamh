import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useColorScheme } from "react-native";
import { router } from "expo-router";

import { AppTabBar } from "@/components/AppTabBar";
import { getNotifications, getTalentProfile, type MobileTalentProfile } from "@/lib/api";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { preparePushRegistration, signOutMobile } from "@/lib/push";
import { darkTheme, lightTheme } from "@/lib/theme";

const absoluteFill = { position: "absolute" as const, top: 0, right: 0, bottom: 0, left: 0 };

export default function ProfileScreen() {
  const locale = getDeviceLocale();
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
    const [result, notifications] = await Promise.all([getTalentProfile(locale), getNotifications().catch(() => null)]);
    setUnreadCount(notifications?.unreadCount ?? 0);
    if (!result.ok) {
      if (result.code === "UNAUTHENTICATED") {
        router.replace({ pathname: "/login", params: { next: "/profile" } });
        return;
      }
      setError(locale === "ar" ? "تعذر تحميل ملف الموهبة." : "Unable to load your talent profile.");
    } else setProfile(result.item);
    setLoading(false);
    setRefreshing(false);
  }, [locale]);

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
      setPushMessage(locale === "ar" ? "تم تفعيل تنبيهات ملامح على هذا الجهاز." : "MLAMH notifications are enabled on this device.");
      return;
    }
    const messages: Record<string, { ar: string; en: string }> = {
      PHYSICAL_DEVICE_REQUIRED: { ar: "التنبيهات تحتاج جهازًا فعليًا عند الاختبار.", en: "Push notifications require a physical device for testing." },
      EAS_PROJECT_ID_MISSING: { ar: "إعداد Push لم يكتمل بعد في نسخة البناء الحالية.", en: "Push setup is not complete in this build yet." },
      PERMISSION_DENIED: { ar: "تم رفض إذن الإشعارات. يمكنك تفعيله لاحقًا من إعدادات الجهاز.", en: "Notification permission was denied. You can enable it later in device settings." },
      REGISTER_FAILED: { ar: "تعذر تسجيل هذا الجهاز حاليًا.", en: "This device could not be registered right now." },
    };
    const message = messages[result.code];
    setPushMessage(message ? message[locale] : (locale === "ar" ? "تعذر تفعيل الإشعارات حاليًا." : "Unable to enable notifications right now."));
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.accent} /></View>;

  return <View style={styles.screen}>
    <ScrollView contentContainerStyle={[styles.content, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.accent} />}>
      <View style={styles.brandRow}>
        <View><Text style={styles.eyebrow}>MLAMH</Text><Text style={styles.title}>{locale === "ar" ? "ملفي" : "Profile"}</Text></View>
        <View style={styles.headerActions}><Pressable style={styles.editButton} onPress={() => router.push("/profile/edit")}><Text style={styles.editButtonText}>{locale === "ar" ? "تعديل" : "Edit"}</Text></Pressable><View style={styles.brandMark}><Text style={styles.brandMarkText}>M</Text></View></View>
      </View>

      {error || !profile ? <View style={styles.card}><Text style={styles.sectionTitle}>{error ?? (locale === "ar" ? "ملف الموهبة غير متاح." : "Talent profile unavailable.")}</Text></View> : <>
        <View style={styles.heroCard}>
          {profile.imageUrl ? <Image source={{ uri: profile.imageUrl }} style={styles.heroImage} resizeMode="cover" /> : <View style={styles.heroPlaceholder}><Text style={styles.heroInitial}>{profile.displayName.slice(0, 1)}</Text></View>}
          <View style={styles.heroShade} />
          <View style={styles.heroContent}><View style={styles.pillRow}><Text style={styles.goldPill}>{profile.category}</Text>{profile.verified ? <Text style={styles.darkPill}>{locale === "ar" ? "موثّق" : "Verified"}</Text> : null}</View><Text style={styles.heroName}>{profile.displayName}</Text><Text style={styles.heroMeta}>{[profile.city, profile.baseCountryCode].filter(Boolean).join(" · ")}</Text></View>
        </View>

        <ReadinessCard profile={profile} locale={locale} styles={styles} />
        {profile.bio ? <View style={styles.card}><Text style={styles.sectionEyebrow}>{locale === "ar" ? "عن الموهبة" : "ABOUT"}</Text><Text style={styles.sectionTitle}>{locale === "ar" ? "نبذة" : "About"}</Text><Text style={styles.body}>{profile.bio}</Text></View> : null}

        <View style={styles.section}><View style={styles.sectionHeader}><View><Text style={styles.sectionEyebrow}>{locale === "ar" ? "المعرض" : "PORTFOLIO"}</Text><Text style={styles.sectionTitle}>{locale === "ar" ? "الأعمال والصور" : "Portfolio"}</Text></View><Pressable style={styles.mediaButton} onPress={() => router.push("/profile/media")}><Text style={styles.mediaButtonText}>{locale === "ar" ? "إدارة الصور" : "Manage media"}</Text></Pressable></View>{profile.gallery.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>{profile.gallery.map((uri, index) => <Image key={`${uri}-${index}`} source={{ uri }} style={styles.galleryImage} resizeMode="cover" />)}</ScrollView> : <Pressable style={styles.emptyMedia} onPress={() => router.push("/profile/media")}><Text style={styles.emptyMediaText}>{locale === "ar" ? "+ أضف أول صورة لمعرضك" : "+ Add your first portfolio image"}</Text></Pressable>}</View>

        {profile.skills.length ? <View style={styles.card}><Text style={styles.sectionEyebrow}>{locale === "ar" ? "الخبرات" : "SKILLS"}</Text><Text style={styles.sectionTitle}>{locale === "ar" ? "المهارات" : "Skills"}</Text><View style={styles.chips}>{profile.skills.map((skill) => <Text key={skill} style={styles.chip}>{skill}</Text>)}</View></View> : null}

        <View style={styles.card}><Text style={styles.sectionEyebrow}>{locale === "ar" ? "الملف" : "PROFILE"}</Text><Text style={styles.sectionTitle}>{locale === "ar" ? "حالة العمل" : "Work status"}</Text><View style={styles.infoRow}><Text style={styles.infoLabel}>{locale === "ar" ? "التوفر" : "Availability"}</Text><Text style={styles.infoValue}>{profile.availabilityStatus ?? (locale === "ar" ? "غير محدد" : "Not set")}</Text></View><View style={styles.infoRow}><Text style={styles.infoLabel}>{locale === "ar" ? "الظهور" : "Visibility"}</Text><Text style={styles.infoValue}>{profile.published ? (locale === "ar" ? "ظاهر" : "Published") : (locale === "ar" ? "غير منشور" : "Private")}</Text></View></View>

        <View style={styles.card}><Text style={styles.sectionEyebrow}>{locale === "ar" ? "التنبيهات" : "ALERTS"}</Text><Text style={styles.sectionTitle}>{locale === "ar" ? "تنبيهات ملامح" : "MLAMH alerts"}</Text><Text style={styles.body}>{locale === "ar" ? "فعّل التنبيهات لتصلك تحديثات الطلبات والقبول والرسائل على جهازك." : "Enable alerts for application updates, acceptances and messages on your device."}</Text><Pressable disabled={pushBusy} style={[styles.pushButton, pushBusy && styles.buttonDisabled]} onPress={() => void enableNotifications()}><Text style={styles.pushButtonText}>{pushBusy ? (locale === "ar" ? "جارٍ التفعيل…" : "Enabling…") : (locale === "ar" ? "تفعيل الإشعارات" : "Enable notifications")}</Text></Pressable>{pushMessage ? <Text style={styles.pushMessage}>{pushMessage}</Text> : null}</View>

        <Pressable style={styles.secondaryButton} disabled={signingOut} onPress={() => void signOut()}><Text style={styles.secondaryButtonText}>{signingOut ? (locale === "ar" ? "جارٍ تسجيل الخروج…" : "Signing out…") : (locale === "ar" ? "تسجيل الخروج" : "Sign out")}</Text></Pressable>
      </>}
    </ScrollView>
    <AppTabBar active="profile" locale={locale} theme={theme} notificationCount={unreadCount} />
  </View>;
}

function ReadinessCard({ profile, locale, styles }: { profile: MobileTalentProfile; locale: "ar" | "en"; styles: ReturnType<typeof createStyles> }) {
  const tasks = [
    { done: profile.gallery.length >= 3, ar: "أضف 3 صور قوية على الأقل", en: "Add at least 3 strong portfolio images", action: () => router.push("/profile/media") },
    { done: Boolean(profile.bio?.trim()), ar: "اكتب نبذة مهنية مختصرة", en: "Write a concise professional bio", action: () => router.push("/profile/edit") },
    { done: profile.skills.length > 0, ar: "أضف مهاراتك الأساسية", en: "Add your core skills", action: () => router.push("/profile/edit") },
    { done: Boolean(profile.city), ar: "حدد مدينتك", en: "Set your city", action: () => router.push("/profile/edit") },
  ];
  const remaining = tasks.filter((task) => !task.done);
  return <View style={styles.progressCard}><View style={styles.progressTop}><View><Text style={styles.sectionEyebrow}>{locale === "ar" ? "الجاهزية" : "READINESS"}</Text><Text style={styles.sectionTitle}>{locale === "ar" ? "جاهزية ملفك" : "Profile readiness"}</Text><Text style={styles.progressCaption}>{remaining.length === 0 ? (locale === "ar" ? "ملف قوي وجاهز للظهور" : "Strong portfolio, ready to be discovered") : (locale === "ar" ? `${remaining.length} خطوات مقترحة` : `${remaining.length} suggested steps`)}</Text></View><Text style={styles.progressValue}>{profile.profileCompletion}%</Text></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${profile.profileCompletion}%` }]} /></View>{remaining.slice(0, 3).map((task) => <Pressable key={task.en} style={styles.taskRow} onPress={task.action}><View style={styles.taskDot} /><Text style={styles.taskText}>{locale === "ar" ? task.ar : task.en}</Text><Text style={styles.taskArrow}>›</Text></Pressable>)}{remaining.length === 0 ? <Text style={styles.body}>{profile.approvalStatus === "approved" ? (locale === "ar" ? "ملفك معتمد وجاهز للتقديم على الفرص المناسبة." : "Your profile is approved and ready for matching opportunities.") : (locale === "ar" ? "محتوى ملفك جاهز. حالة المراجعة تظهر هنا فور تحديثها." : "Your portfolio content is ready. Review status will appear here when updated.")}</Text> : null}</View>;
}

function createStyles(theme: typeof lightTheme | typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }, content: { paddingHorizontal: 18, paddingTop: 58, paddingBottom: 30, gap: 16 },
  brandRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, headerActions: { flexDirection: "row", alignItems: "center", gap: 9 }, editButton: { borderWidth: 1, borderColor: theme.border, borderRadius: 15, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: theme.surface }, editButtonText: { color: theme.text, fontSize: 12, fontWeight: "700" }, eyebrow: { color: theme.accent, fontSize: 12, fontWeight: "800", letterSpacing: 2.2 }, title: { color: theme.text, fontSize: 38, fontWeight: "300" }, brandMark: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: theme.accent, alignItems: "center", justifyContent: "center", backgroundColor: theme.surface }, brandMarkText: { color: theme.accent, fontSize: 18, fontWeight: "800" },
  heroCard: { minHeight: 420, borderRadius: 30, overflow: "hidden", borderWidth: 1, borderColor: theme.bronze, backgroundColor: theme.charcoal, justifyContent: "flex-end" }, heroImage: { ...absoluteFill }, heroPlaceholder: { ...absoluteFill, alignItems: "center", justifyContent: "center", backgroundColor: theme.charcoal }, heroInitial: { color: theme.accent, fontSize: 90, fontWeight: "200" }, heroShade: { ...absoluteFill, backgroundColor: "#2E2E2E66" }, heroContent: { padding: 22, gap: 8 }, pillRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" }, goldPill: { color: theme.charcoal, backgroundColor: theme.accent, borderRadius: 14, overflow: "hidden", paddingHorizontal: 11, paddingVertical: 6, fontSize: 11, fontWeight: "800" }, darkPill: { color: theme.ivory, backgroundColor: "#2E2E2ECC", borderWidth: 1, borderColor: theme.bronze, borderRadius: 14, overflow: "hidden", paddingHorizontal: 11, paddingVertical: 6, fontSize: 11 }, heroName: { color: theme.ivory, fontSize: 34, fontWeight: "600" }, heroMeta: { color: theme.ivory, opacity: 0.78, fontSize: 14 },
  progressCard: { gap: 12, padding: 20, borderWidth: 1, borderColor: theme.border, borderRadius: 24, backgroundColor: theme.surface }, progressTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }, progressCaption: { color: theme.muted, fontSize: 11, marginTop: 4 }, progressValue: { color: theme.accent, fontSize: 22, fontWeight: "700" }, progressTrack: { height: 7, borderRadius: 4, overflow: "hidden", backgroundColor: theme.border }, progressFill: { height: 7, borderRadius: 4, backgroundColor: theme.accent }, taskRow: { minHeight: 42, flexDirection: "row", alignItems: "center", gap: 10, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 10 }, taskDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.accent }, taskText: { flex: 1, color: theme.text, fontSize: 12, lineHeight: 18 }, taskArrow: { color: theme.accent, fontSize: 20 },
  card: { gap: 12, padding: 20, borderWidth: 1, borderColor: theme.border, borderRadius: 24, backgroundColor: theme.surface }, section: { gap: 12 }, sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }, sectionEyebrow: { color: theme.accent, fontSize: 10, fontWeight: "800", letterSpacing: 1.5 }, sectionTitle: { color: theme.text, fontSize: 20, fontWeight: "700" }, mediaButton: { borderWidth: 1, borderColor: theme.accent, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 }, mediaButtonText: { color: theme.accent, fontSize: 11, fontWeight: "700" }, body: { color: theme.muted, fontSize: 14, lineHeight: 23 }, galleryRow: { gap: 10 }, galleryImage: { width: 145, height: 190, borderRadius: 22, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }, emptyMedia: { borderWidth: 1, borderStyle: "dashed", borderColor: theme.border, borderRadius: 22, minHeight: 110, alignItems: "center", justifyContent: "center", padding: 18 }, emptyMediaText: { color: theme.accent, fontSize: 13, fontWeight: "700" }, chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, chip: { color: theme.text, backgroundColor: theme.chip, borderWidth: 1, borderColor: theme.border, borderRadius: 15, overflow: "hidden", paddingHorizontal: 12, paddingVertical: 7, fontSize: 12 }, infoRow: { flexDirection: "row", justifyContent: "space-between", gap: 18 }, infoLabel: { color: theme.muted, fontSize: 13 }, infoValue: { color: theme.text, fontSize: 13, fontWeight: "700" }, pushButton: { backgroundColor: theme.accent, borderRadius: 16, paddingVertical: 13, alignItems: "center" }, pushButtonText: { color: theme.charcoal, fontSize: 13, fontWeight: "800" }, pushMessage: { color: theme.muted, fontSize: 11, lineHeight: 18 }, buttonDisabled: { opacity: 0.55 }, secondaryButton: { borderWidth: 1, borderColor: theme.bronze, borderRadius: 18, paddingVertical: 15, alignItems: "center" }, secondaryButtonText: { color: theme.bronze, fontSize: 14, fontWeight: "700" },
}); }
