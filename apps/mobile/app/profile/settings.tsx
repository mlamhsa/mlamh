import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Bell, ChevronLeft, ChevronRight, Images, Languages, LifeBuoy, LogOut, Smartphone, SlidersHorizontal } from "lucide-react-native";

import { type AppLocale, getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { writeStoredLocale } from "@/lib/locale-preference";
import { preparePushRegistration, signOutMobile } from "@/lib/push";
import { darkTheme } from "@/lib/theme";

export default function ProfileSettingsScreen() {
  const [locale, setLocale] = useState<AppLocale>(() => getDeviceLocale());
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [signingOut, setSigningOut] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState<string | null>(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;
  const ForwardIcon = isRtl ? ChevronLeft : ChevronRight;

  function chooseLocale(next: AppLocale) { if (next !== locale && writeStoredLocale(next)) setLocale(next); }
  async function enableNotifications() {
    if (pushBusy) return;
    setPushBusy(true); setPushMessage(null);
    const result = await preparePushRegistration(locale);
    setPushBusy(false);
    if (result.ok) { setPushEnabled(true); setPushMessage(isArabic ? "تم تفعيل إشعارات ملامح على هذا الجهاز." : "MLAMH notifications are enabled on this device."); return; }
    const messages: Record<string, { ar: string; en: string }> = {
      PERMISSION_DENIED: { ar: "تم رفض إذن الإشعارات. يمكنك تفعيله من إعدادات الجهاز.", en: "Notification permission was denied. You can enable it in device settings." },
      PERMISSION_NOT_GRANTED: { ar: "لم يتم منح إذن الإشعارات بعد.", en: "Notification permission has not been granted yet." },
      EAS_PROJECT_ID_MISSING: { ar: "إعداد Push غير مكتمل في نسخة التطبيق الحالية.", en: "Push setup is incomplete in this app build." },
      TOKEN_FAILED: { ar: "تعذر إنشاء رمز الإشعارات لهذا الجهاز.", en: "A push token could not be created for this device." },
      REGISTER_FAILED: { ar: "تعذر تسجيل الجهاز لدى ملامح حاليًا.", en: "This device could not be registered with MLAMH right now." },
      SERVICE_UNAVAILABLE: { ar: "خدمة الإشعارات غير متاحة مؤقتًا.", en: "The notification service is temporarily unavailable." },
      UNAUTHENTICATED: { ar: "انتهت الجلسة. سجّل الدخول ثم حاول مرة أخرى.", en: "Your session expired. Sign in and try again." },
    };
    setPushMessage(messages[result.code]?.[locale] ?? (isArabic ? "تعذر تفعيل الإشعارات حاليًا." : "Unable to enable notifications right now."));
  }
  async function signOut() { if (signingOut) return; setSigningOut(true); try { await signOutMobile(); router.replace("/"); } finally { setSigningOut(false); } }

  const rows = [
    { title: isArabic ? "مركز الإشعارات" : "Notification center", subtitle: isArabic ? "عرض التنبيهات وحالة القراءة" : "View alerts and unread updates", action: () => router.push("/notifications"), icon: Bell },
    { title: isArabic ? "الصور والملف" : "Photos & portfolio", subtitle: isArabic ? "إدارة الصورة الرئيسية ومعرض الأعمال" : "Manage your primary photo and portfolio", action: () => router.push("/profile/media"), icon: Images },
    { title: isArabic ? "الدعم والسياسات" : "Support & policies", subtitle: isArabic ? "الدعم، الخصوصية، الشروط والاسترداد" : "Support, privacy, terms and refunds", action: () => router.push("/support"), icon: LifeBuoy },
  ];

  return <SafeAreaView style={styles.screen} edges={["top"]}>
    <ScrollView contentContainerStyle={[styles.content, { direction: isRtl ? "rtl" : "ltr" }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.top, isRtl && styles.rowRtl]}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}><BackIcon size={20} strokeWidth={1.9} color={theme.text} /></Pressable>
        <Text style={styles.brand}>{isArabic ? "ملامح" : "MLAMH"}</Text>
      </View>
      <View style={[styles.hero, isRtl && styles.rowRtl]}><View style={styles.heroIcon}><SlidersHorizontal size={21} color={theme.accent} strokeWidth={1.8} /></View><View style={styles.heroCopy}><Text style={[styles.title, isRtl && styles.textRtl]}>{isArabic ? "الإعدادات" : "Settings"}</Text><Text style={[styles.subtitle, isRtl && styles.textRtl]}>{isArabic ? "اللغة والتنبيهات والخصوصية والحساب في مكان واحد." : "Language, alerts, privacy and account controls in one place."}</Text></View></View>

      <Text style={[styles.sectionLabel, isRtl && styles.textRtl]}>{isArabic ? "التفضيلات" : "PREFERENCES"}</Text>
      <View style={styles.card}>
        <View style={[styles.cardHeading, isRtl && styles.rowRtl]}><View style={styles.iconShell}><Languages size={19} strokeWidth={1.9} color={theme.accent} /></View><View style={styles.cardHeadingCopy}><Text style={[styles.rowTitle, isRtl && styles.textRtl]}>{isArabic ? "اللغة" : "Language"}</Text><Text style={[styles.rowSubtitle, isRtl && styles.textRtl]}>{isArabic ? "اختر لغة التطبيق." : "Choose the app language."}</Text></View></View>
        <View style={[styles.languageOptions, isRtl && styles.rowRtl]}><Pressable onPress={() => chooseLocale("ar")} style={[styles.languageOption, locale === "ar" && styles.languageOptionActive]}><Text style={[styles.languageOptionText, locale === "ar" && styles.languageOptionTextActive]}>العربية</Text></Pressable><Pressable onPress={() => chooseLocale("en")} style={[styles.languageOption, locale === "en" && styles.languageOptionActive]}><Text style={[styles.languageOptionText, locale === "en" && styles.languageOptionTextActive]}>English</Text></Pressable></View>
      </View>

      <View style={styles.card}>
        <View style={[styles.pushHeader, isRtl && styles.rowRtl]}><View style={styles.iconShell}><Smartphone size={19} strokeWidth={1.9} color={theme.accent} /></View><View style={styles.pushCopy}><Text style={[styles.rowTitle, isRtl && styles.textRtl]}>{isArabic ? "تنبيهات الجهاز" : "Device alerts"}</Text><Text style={[styles.rowSubtitle, isRtl && styles.textRtl]}>{isArabic ? "استقبل تحديثات الطلبات والقبول والرسائل." : "Receive application, acceptance and message updates."}</Text></View><View style={[styles.statusDot, pushEnabled && styles.statusDotEnabled]} /></View>
        <Pressable disabled={pushBusy || pushEnabled} onPress={() => void enableNotifications()} style={[styles.pushButton, (pushBusy || pushEnabled) && styles.pushButtonDisabled]}>{pushBusy ? <ActivityIndicator color={theme.background} /> : <Text style={styles.pushButtonText}>{pushEnabled ? (isArabic ? "مفعّلة" : "Enabled") : (isArabic ? "تفعيل الإشعارات" : "Enable notifications")}</Text>}</Pressable>
        {pushMessage ? <Text accessibilityRole="alert" style={[styles.pushMessage, isRtl && styles.textRtl]}>{pushMessage}</Text> : null}
      </View>

      <Text style={[styles.sectionLabel, isRtl && styles.textRtl]}>{isArabic ? "الحساب والدعم" : "ACCOUNT & SUPPORT"}</Text>
      <View style={styles.group}>{rows.map((row, index) => { const RowIcon = row.icon; return <Pressable key={row.title} style={[styles.row, index === rows.length - 1 && styles.rowLast, isRtl && styles.rowRtl]} onPress={row.action}><View style={[styles.rowLead, isRtl && styles.rowRtl]}><View style={styles.iconShell}><RowIcon size={19} strokeWidth={1.9} color={theme.accent} /></View><View style={styles.rowText}><Text style={[styles.rowTitle, isRtl && styles.textRtl]}>{row.title}</Text><Text style={[styles.rowSubtitle, isRtl && styles.textRtl]}>{row.subtitle}</Text></View></View><ForwardIcon size={18} strokeWidth={1.8} color={theme.muted} /></Pressable>; })}</View>
      <Pressable disabled={signingOut} style={[styles.signOut, signingOut && styles.disabled]} onPress={() => void signOut()}>{signingOut ? <ActivityIndicator color="#E59A9A" /> : <><LogOut size={18} strokeWidth={1.9} color="#E59A9A" /><Text style={styles.signOutText}>{isArabic ? "تسجيل الخروج" : "Sign out"}</Text></>}</Pressable>
    </ScrollView>
  </SafeAreaView>;
}

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, content: { width: "100%", maxWidth: 680, alignSelf: "center", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 50, gap: 16 }, top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 46 }, rowRtl: { flexDirection: "row-reverse" }, textRtl: { textAlign: "right" }, backButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }, brand: { color: theme.accent, fontSize: 15, fontWeight: "900", letterSpacing: 1.7 }, hero: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: "#C9A96233", borderRadius: 20, backgroundColor: "#C9A96208", padding: 15 }, heroIcon: { width: 46, height: 46, borderRadius: 15, borderWidth: 1, borderColor: "#C9A96244", backgroundColor: "#C9A9620C", alignItems: "center", justifyContent: "center" }, heroCopy: { flex: 1 }, title: { color: theme.text, fontSize: 27, lineHeight: 33, fontWeight: "800" }, subtitle: { color: theme.muted, fontSize: 12, lineHeight: 18, marginTop: 3 }, sectionLabel: { color: theme.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1.5, marginTop: 2 }, card: { borderWidth: 1, borderColor: theme.border, borderRadius: 20, padding: 15, gap: 13, backgroundColor: theme.surface }, cardHeading: { flexDirection: "row", alignItems: "center", gap: 12 }, cardHeadingCopy: { flex: 1 }, iconShell: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: theme.chip, borderWidth: 1, borderColor: theme.border }, languageOptions: { flexDirection: "row", gap: 9 }, languageOption: { flex: 1, minHeight: 46, borderWidth: 1, borderColor: theme.border, borderRadius: 14, alignItems: "center", justifyContent: "center" }, languageOptionActive: { borderColor: theme.accent, backgroundColor: "#C9A96218" }, languageOptionText: { color: theme.muted, fontSize: 13, fontWeight: "800" }, languageOptionTextActive: { color: theme.accent }, pushHeader: { flexDirection: "row", alignItems: "center", gap: 12 }, pushCopy: { flex: 1 }, statusDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: theme.grayMuted }, statusDotEnabled: { backgroundColor: theme.accent }, pushButton: { minHeight: 48, borderRadius: 14, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" }, pushButtonDisabled: { opacity: 0.55 }, pushButtonText: { color: theme.background, fontSize: 13, fontWeight: "900" }, pushMessage: { color: theme.muted, fontSize: 10, lineHeight: 16 }, group: { borderWidth: 1, borderColor: theme.border, borderRadius: 20, overflow: "hidden", backgroundColor: theme.surface }, row: { minHeight: 70, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, borderBottomWidth: 1, borderBottomColor: theme.border }, rowLast: { borderBottomWidth: 0 }, rowLead: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }, rowText: { flex: 1 }, rowTitle: { color: theme.text, fontSize: 14, fontWeight: "800" }, rowSubtitle: { color: theme.muted, fontSize: 11, lineHeight: 17, marginTop: 3 }, signOut: { minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: "#C84F4F66", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 9 }, signOutText: { color: "#E59A9A", fontSize: 14, fontWeight: "900" }, disabled: { opacity: 0.5 }
}); }