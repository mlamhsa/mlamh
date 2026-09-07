import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Bell, ChevronLeft, ChevronRight, Images, Languages, LifeBuoy, LogOut, Scale, Smartphone, SlidersHorizontal } from "lucide-react-native";

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
  const [switchingLocale, setSwitchingLocale] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState<string | null>(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;
  const ForwardIcon = isRtl ? ChevronLeft : ChevronRight;

  function chooseLocale(next: AppLocale) {
    if (next === locale || switchingLocale) return;
    if (!writeStoredLocale(next)) return;
    setSwitchingLocale(true);
    setLocale(next);
    setTimeout(() => router.replace("/"), 120);
  }

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

  return <SafeAreaView style={styles.screen} edges={["top"]}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.top, isRtl && styles.rowRtl]}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}><BackIcon size={20} strokeWidth={1.9} color={theme.text} /></Pressable>
        <Text style={[styles.brand, isRtl && styles.textRtl]}>{isArabic ? "ملامح" : "MLAMH"}</Text>
      </View>

      <View style={[styles.hero, isRtl && styles.rowRtl]}><View style={styles.heroIcon}><SlidersHorizontal size={21} color={theme.accent} strokeWidth={1.8} /></View><View style={styles.heroCopy}><Text style={[styles.title, isRtl && styles.textRtl]}>{isArabic ? "الإعدادات" : "Settings"}</Text><Text style={[styles.subtitle, isRtl && styles.textRtl]}>{isArabic ? "اللغة والتنبيهات والحساب في مكان واحد." : "Language, alerts and account controls in one place."}</Text></View></View>

      <Text style={[styles.sectionLabel, isRtl && styles.textRtl]}>{isArabic ? "التفضيلات" : "PREFERENCES"}</Text>
      <View style={styles.card}>
        <View style={[styles.cardHeading, isRtl && styles.rowRtl]}><View style={styles.iconShell}><Languages size={19} strokeWidth={1.9} color={theme.accent} /></View><View style={styles.cardHeadingCopy}><Text style={[styles.rowTitle, isRtl && styles.textRtl]}>{isArabic ? "اللغة" : "Language"}</Text><Text style={[styles.rowSubtitle, isRtl && styles.textRtl]}>{isArabic ? "سيُعاد تحميل التطبيق بالكامل باللغة الجديدة." : "The app will reload fully in the new language."}</Text></View></View>
        <View style={[styles.languageOptions, isRtl && styles.rowRtl]}><Pressable disabled={switchingLocale} onPress={() => chooseLocale("ar")} style={[styles.languageOption, locale === "ar" && styles.languageOptionActive]}><Text style={[styles.languageOptionText, locale === "ar" && styles.languageOptionTextActive]}>العربية</Text></Pressable><Pressable disabled={switchingLocale} onPress={() => chooseLocale("en")} style={[styles.languageOption, locale === "en" && styles.languageOptionActive]}><Text style={[styles.languageOptionText, locale === "en" && styles.languageOptionTextActive]}>English</Text></Pressable></View>
        {switchingLocale ? <View style={[styles.switchingRow, isRtl && styles.rowRtl]}><ActivityIndicator size="small" color={theme.accent}/><Text style={[styles.switchingText, isRtl && styles.textRtl]}>{isArabic ? "جارٍ إعادة تحميل الواجهة…" : "Reloading interface…"}</Text></View> : null}
      </View>

      <View style={styles.card}>
        <View style={[styles.pushHeader, isRtl && styles.rowRtl]}><View style={styles.iconShell}><Smartphone size={19} strokeWidth={1.9} color={theme.accent} /></View><View style={styles.pushCopy}><Text style={[styles.rowTitle, isRtl && styles.textRtl]}>{isArabic ? "تنبيهات الجهاز" : "Device alerts"}</Text><Text style={[styles.rowSubtitle, isRtl && styles.textRtl]}>{isArabic ? "استقبل تحديثات الطلبات والقبول والرسائل." : "Receive application, acceptance and message updates."}</Text></View><View style={[styles.statusDot, pushEnabled && styles.statusDotEnabled]} /></View>
        <Pressable disabled={pushBusy || pushEnabled} onPress={() => void enableNotifications()} style={[styles.pushButton, (pushBusy || pushEnabled) && styles.pushButtonDisabled]}>{pushBusy ? <ActivityIndicator color={theme.background} /> : <Text style={styles.pushButtonText}>{pushEnabled ? (isArabic ? "مفعّلة" : "Enabled") : (isArabic ? "تفعيل الإشعارات" : "Enable notifications")}</Text>}</Pressable>
        {pushMessage ? <Text accessibilityRole="alert" style={[styles.pushMessage, isRtl && styles.textRtl]}>{pushMessage}</Text> : null}
      </View>

      <Text style={[styles.sectionLabel, isRtl && styles.textRtl]}>{isArabic ? "الحساب" : "ACCOUNT"}</Text>
      <View style={styles.group}>
        <SettingsRow title={isArabic ? "مركز الإشعارات" : "Notification center"} subtitle={isArabic ? "عرض التنبيهات وحالة القراءة" : "View alerts and unread updates"} icon={Bell} onPress={() => router.push("/notifications")} isRtl={isRtl} ForwardIcon={ForwardIcon} styles={styles} theme={theme}/>
        <SettingsRow title={isArabic ? "الصور والملف" : "Photos & portfolio"} subtitle={isArabic ? "إدارة الصورة الرئيسية ومعرض الأعمال" : "Manage your primary photo and portfolio"} icon={Images} onPress={() => router.push("/profile/media")} isRtl={isRtl} ForwardIcon={ForwardIcon} styles={styles} theme={theme} last/>
      </View>

      <Text style={[styles.sectionLabel, isRtl && styles.textRtl]}>{isArabic ? "المساعدة والقانوني" : "HELP & LEGAL"}</Text>
      <View style={styles.group}>
        <SettingsRow title={isArabic ? "المساعدة والدعم" : "Help & support"} subtitle={isArabic ? "الشكاوى، الدعم وطرق التواصل" : "Complaints, support and contact"} icon={LifeBuoy} onPress={() => router.push("/support")} isRtl={isRtl} ForwardIcon={ForwardIcon} styles={styles} theme={theme}/>
        <SettingsRow title={isArabic ? "القانوني والسياسات" : "Legal & policies"} subtitle={isArabic ? "الخصوصية، الشروط وسياسة الاسترداد" : "Privacy, terms and refund policy"} icon={Scale} onPress={() => router.push("/support")} isRtl={isRtl} ForwardIcon={ForwardIcon} styles={styles} theme={theme} last/>
      </View>

      <Pressable disabled={signingOut} style={[styles.signOut, signingOut && styles.disabled]} onPress={() => void signOut()}>{signingOut ? <ActivityIndicator color="#E59A9A" /> : <><LogOut size={18} strokeWidth={1.9} color="#E59A9A" /><Text style={styles.signOutText}>{isArabic ? "تسجيل الخروج" : "Sign out"}</Text></>}</Pressable>
    </ScrollView>
  </SafeAreaView>;
}

function SettingsRow({ title, subtitle, icon: RowIcon, onPress, isRtl, ForwardIcon, styles, theme, last = false }: { title: string; subtitle: string; icon: typeof Bell; onPress: () => void; isRtl: boolean; ForwardIcon: typeof ChevronLeft; styles: ReturnType<typeof createStyles>; theme: typeof darkTheme; last?: boolean }) {
  return <Pressable style={[styles.row, last && styles.rowLast, isRtl && styles.rowRtl]} onPress={onPress}><View style={[styles.rowLead, isRtl && styles.rowRtl]}><View style={styles.iconShell}><RowIcon size={19} strokeWidth={1.9} color={theme.accent}/></View><View style={styles.rowText}><Text style={[styles.rowTitle, isRtl && styles.textRtl]}>{title}</Text><Text style={[styles.rowSubtitle, isRtl && styles.textRtl]}>{subtitle}</Text></View></View><ForwardIcon size={18} strokeWidth={1.8} color={theme.muted}/></Pressable>;
}

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, content: { width: "100%", maxWidth: 680, alignSelf: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 50, gap: 16 }, top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 46 }, rowRtl: { flexDirection: "row-reverse" }, textRtl: { textAlign: "right", writingDirection: "rtl" }, backButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }, brand: { color: theme.accent, fontSize: 15, fontWeight: "900", letterSpacing: 1.7 }, hero: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: "#C9A96233", borderRadius: 20, backgroundColor: "#C9A96208", padding: 15 }, heroIcon: { width: 46, height: 46, borderRadius: 15, borderWidth: 1, borderColor: "#C9A96244", backgroundColor: "#C9A9620C", alignItems: "center", justifyContent: "center" }, heroCopy: { flex: 1 }, title: { color: theme.text, fontSize: 27, lineHeight: 33, fontWeight: "800" }, subtitle: { color: theme.muted, fontSize: 12, lineHeight: 18, marginTop: 3 }, sectionLabel: { color: theme.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1.5, marginTop: 2 }, card: { borderWidth: 1, borderColor: theme.border, borderRadius: 20, padding: 15, gap: 13, backgroundColor: theme.surface }, cardHeading: { flexDirection: "row", alignItems: "center", gap: 12 }, cardHeadingCopy: { flex: 1 }, iconShell: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: theme.chip, borderWidth: 1, borderColor: theme.border }, languageOptions: { flexDirection: "row", gap: 9 }, languageOption: { flex: 1, minHeight: 46, borderWidth: 1, borderColor: theme.border, borderRadius: 14, alignItems: "center", justifyContent: "center" }, languageOptionActive: { borderColor: theme.accent, backgroundColor: "#C9A96218" }, languageOptionText: { color: theme.muted, fontSize: 13, fontWeight: "800" }, languageOptionTextActive: { color: theme.accent }, switchingRow: { flexDirection: "row", alignItems: "center", gap: 8 }, switchingText: { color: theme.muted, fontSize: 11 }, pushHeader: { flexDirection: "row", alignItems: "center", gap: 12 }, pushCopy: { flex: 1 }, statusDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: theme.grayMuted }, statusDotEnabled: { backgroundColor: theme.accent }, pushButton: { minHeight: 48, borderRadius: 14, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" }, pushButtonDisabled: { opacity: 0.55 }, pushButtonText: { color: theme.background, fontSize: 13, fontWeight: "900" }, pushMessage: { color: theme.muted, fontSize: 10, lineHeight: 16 }, group: { borderWidth: 1, borderColor: theme.border, borderRadius: 20, overflow: "hidden", backgroundColor: theme.surface }, row: { minHeight: 70, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, borderBottomWidth: 1, borderBottomColor: theme.border }, rowLast: { borderBottomWidth: 0 }, rowLead: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }, rowText: { flex: 1 }, rowTitle: { color: theme.text, fontSize: 14, fontWeight: "800" }, rowSubtitle: { color: theme.muted, fontSize: 11, lineHeight: 17, marginTop: 3 }, signOut: { minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: "#C84F4F66", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 9 }, signOutText: { color: "#E59A9A", fontSize: 14, fontWeight: "900" }, disabled: { opacity: 0.5 }
}); }
