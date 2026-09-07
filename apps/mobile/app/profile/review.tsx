import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { CheckCircle2, ChevronLeft, ChevronRight, Circle, Clock3, ShieldCheck } from "lucide-react-native";

import { ScreenSkeleton } from "@/components/ScreenSkeleton";
import { getTalentProfile } from "@/lib/api";
import { MOBILE_API_BASE_URL } from "@/lib/api-config";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { darkTheme } from "@/lib/theme";

type MissingRequirement = { key: string; ar: string; en: string };
type ReviewResponse = { ok?: boolean; code?: string; message?: string; completion?: number; approvalStatus?: string; missingRequirements?: MissingRequirement[] };

async function readReviewResponse(response: Response): Promise<ReviewResponse | null> {
  const raw = await response.text().catch(() => "");
  if (!raw) return null;
  try { const parsed = JSON.parse(raw) as unknown; return parsed && typeof parsed === "object" ? parsed as ReviewResponse : null; } catch { return null; }
}

export default function ProfileReviewScreen() {
  const locale = getDeviceLocale(); const isArabic = locale === "ar"; const isRtl = isRtlLocale(locale); const theme = darkTheme; const styles = useMemo(() => createStyles(theme), [theme]);
  const [completion, setCompletion] = useState<number | null>(null); const [approvalStatus, setApprovalStatus] = useState<string | null>(null); const [loading, setLoading] = useState(true); const [submitting, setSubmitting] = useState(false); const [message, setMessage] = useState<string | null>(null); const [success, setSuccess] = useState(false); const [missing, setMissing] = useState<MissingRequirement[]>([]);
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;

  useEffect(() => { let active = true; void (async () => { try { const result = await getTalentProfile(locale); if (!active) return; if (!result.ok) { if (result.code === "UNAUTHENTICATED") router.replace({ pathname: "/login", params: { next: "/profile/review" } }); else setMessage(isArabic ? "تعذر تحميل حالة الملف." : "Unable to load profile status."); return; } setCompletion(result.item.profileCompletion); setApprovalStatus(result.item.approvalStatus); } catch { if (active) setMessage(isArabic ? "تعذر تحميل حالة الملف. تحقق من الاتصال وحاول مرة أخرى." : "Unable to load profile status. Check your connection and try again."); } finally { if (active) setLoading(false); } })(); return () => { active = false; }; }, [isArabic, locale]);

  async function requestReview(accessToken: string) { return fetch(`${MOBILE_API_BASE_URL}/api/talent/me/review?locale=${locale}`, { method: "POST", headers: { Accept: "application/json", Authorization: `Bearer ${accessToken}` } }); }

  async function submitReview() {
    if (submitting) return; setSubmitting(true); setMessage(null); setSuccess(false); setMissing([]);
    try {
      let { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { const refreshed = await supabase.auth.refreshSession().catch(() => null); session = refreshed?.data.session ?? null; }
      if (!session?.access_token) { router.replace({ pathname: "/login", params: { next: "/profile/review" } }); return; }
      let response = await requestReview(session.access_token);
      if (response.status === 401) { const refreshed = await supabase.auth.refreshSession().catch(() => null); const refreshedToken = refreshed?.data.session?.access_token; if (refreshedToken) response = await requestReview(refreshedToken); }
      if (response.status === 401) { router.replace({ pathname: "/login", params: { next: "/profile/review" } }); return; }
      const result = await readReviewResponse(response);
      if (!result) { setMessage(isArabic ? "تعذر قراءة استجابة المراجعة. حاول مرة أخرى." : "We couldn't read the review response. Please try again."); return; }
      if (typeof result.completion === "number" && Number.isFinite(result.completion)) setCompletion(result.completion);
      if (Array.isArray(result.missingRequirements)) setMissing(result.missingRequirements);
      if (!response.ok || !result.ok) { setMessage(result.message ?? (isArabic ? "تعذر إرسال الملف للمراجعة." : "Unable to submit your profile for review.")); return; }
      setSuccess(true); setApprovalStatus(result.approvalStatus ?? "pending"); setMessage(result.message ?? (isArabic ? "تم إرسال ملفك للمراجعة." : "Your profile was submitted for review."));
    } catch { setMessage(isArabic ? "تعذر إرسال الملف للمراجعة الآن. تحقق من الاتصال وحاول مرة أخرى." : "Unable to submit your profile right now. Check your connection and try again."); }
    finally { setSubmitting(false); }
  }

  if (loading) return <ScreenSkeleton variant="profile" locale={locale} label={isArabic ? "جارٍ تحميل جاهزية الملف" : "Loading profile readiness"} />;

  const underReview = approvalStatus === "pending" || approvalStatus === "submitted"; const approved = approvalStatus === "approved"; const canSubmit = !underReview && !approved; const safeCompletion = Math.max(0, Math.min(100, completion ?? 0)); const textAlign = isRtl ? "right" : "left";
  const journey = [
    { done: safeCompletion >= 100 || underReview || approved, current: canSubmit && safeCompletion < 100, ar: "إكمال المتطلبات", en: "Complete requirements" },
    { done: underReview || approved, current: canSubmit && safeCompletion >= 100, ar: "الإرسال للمراجعة", en: "Submit for review" },
    { done: approved, current: underReview, ar: "المراجعة", en: "Review" },
    { done: approved, current: approved, ar: "الاعتماد", en: "Approval" },
  ];

  return <SafeAreaView style={styles.screen} edges={["top"]}>
    <ScrollView contentContainerStyle={[styles.content, { direction: isRtl ? "rtl" : "ltr" }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.topRow, isRtl && styles.rowRtl]}><Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} style={styles.backButton}><BackIcon size={20} color={theme.text} /></Pressable><Text style={[styles.brand, isArabic && styles.arabicText]}>{isArabic ? "ملامح" : "MLAMH"}</Text></View>
      <View style={styles.header}><Text accessibilityRole="header" style={[styles.title, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "جاهزية الملف" : "Profile readiness"}</Text><Text style={[styles.subtitle, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "أكمل المتطلبات، أرسل الملف، ثم تابع حالة المراجعة والاعتماد من هنا." : "Complete the requirements, submit your profile, then follow review and approval here."}</Text></View>

      <View style={styles.journeyCard}><View style={[styles.journeyTop, isRtl && styles.rowRtl]}><ShieldCheck size={20} color={theme.accent}/><Text style={[styles.cardTitle, { textAlign }]}>{isArabic ? "رحلة الاعتماد" : "Approval journey"}</Text></View>{journey.map((step, index) => <View key={step.en} style={[styles.journeyRow, isRtl && styles.rowRtl]}>{step.done ? <CheckCircle2 size={18} color={theme.accent}/> : step.current ? <Clock3 size={18} color={theme.accent}/> : <Circle size={18} color={theme.grayMuted}/>}<Text style={[styles.journeyText, step.current && styles.journeyTextCurrent, { textAlign }]}>{index + 1}. {isArabic ? step.ar : step.en}</Text></View>)}</View>

      <View accessible accessibilityLabel={isArabic ? `اكتمال الملف ${safeCompletion} بالمئة` : `Profile completion ${safeCompletion} percent`} style={styles.card}><View style={[styles.scoreRow, isRtl && styles.rowRtl]}><Text style={[styles.cardTitle, isArabic && styles.arabicText]}>{isArabic ? "اكتمال الملف" : "Profile completion"}</Text><Text style={styles.score}>{safeCompletion}%</Text></View><View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: safeCompletion }} style={styles.track}><View style={[styles.fill, { width: `${safeCompletion}%` }]} /></View><Text style={[styles.helper, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "النسبة مؤشر مساعد. زر الإرسال يعتمد على الحقول الأساسية المطلوبة فعليًا." : "The percentage is a guide. Submission is controlled by the actual required core fields."}</Text></View>

      <View style={styles.card}><Text style={[styles.cardTitle, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "حالة الحساب" : "Profile status"}</Text><Text accessibilityLiveRegion="polite" style={[styles.status, { textAlign }]}>{approved ? (isArabic ? "معتمد — ملفك اجتاز المراجعة" : "Approved — your profile passed review") : underReview ? (isArabic ? "قيد المراجعة — لا تحتاج لإعادة الإرسال" : "Under review — no need to resubmit") : (isArabic ? "غير معتمد بعد — أكمل ثم أرسل للمراجعة" : "Not approved yet — complete and submit for review")}</Text>{missing.length > 0 ? <View style={styles.requirements}><Text style={[styles.requirementTitle, { textAlign }]}>{isArabic ? "المطلوب قبل الإرسال:" : "Required before submission:"}</Text>{missing.map((item) => <View key={item.key} style={[styles.requirementRow, isRtl && styles.rowRtl]}><Circle size={9} color={theme.accent}/><Text style={[styles.requirement, { textAlign }]}>{isArabic ? item.ar : item.en}</Text></View>)}</View> : null}{message ? <View style={[styles.messageBox, success && styles.successBox]}><Text accessibilityRole="alert" style={[styles.message, success && styles.success, { textAlign }]}>{message}</Text></View> : null}</View>

      {canSubmit ? <Pressable accessibilityRole="button" disabled={submitting} onPress={() => void submitReview()} style={({ pressed }) => [styles.primaryButton, submitting && styles.disabled, pressed && styles.pressed]}>{submitting ? <ActivityIndicator color={theme.background} /> : <Text style={styles.primaryText}>{isArabic ? "إرسال الملف للمراجعة" : "Submit profile for review"}</Text>}</Pressable> : null}
      <Pressable accessibilityRole="button" style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={() => router.replace("/profile/edit")}><Text style={styles.secondaryText}>{isArabic ? "تعديل الملف" : "Edit profile"}</Text></Pressable>
    </ScrollView>
  </SafeAreaView>;
}

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, content: { width: "100%", maxWidth: 620, alignSelf: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 46, gap: 14 }, rowRtl: { flexDirection: "row-reverse" }, topRow: { minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, backButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }, brand: { color: theme.accent, fontSize: 15, fontWeight: "900", letterSpacing: 1.5 }, header: { gap: 6, marginBottom: 2 }, title: { color: theme.text, fontSize: 29, lineHeight: 35, fontWeight: "800" }, subtitle: { color: theme.muted, fontSize: 13, lineHeight: 20 }, card: { gap: 11, padding: 16, borderWidth: 1, borderColor: theme.border, borderRadius: 18, backgroundColor: theme.surface }, journeyCard: { gap: 11, padding: 16, borderWidth: 1, borderColor: "#C9A96244", borderRadius: 19, backgroundColor: "#C9A96208" }, journeyTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 }, journeyRow: { flexDirection: "row", alignItems: "center", gap: 9, minHeight: 34 }, journeyText: { flex: 1, color: theme.muted, fontSize: 12, fontWeight: "700" }, journeyTextCurrent: { color: theme.text }, scoreRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, cardTitle: { color: theme.text, fontSize: 16, fontWeight: "800" }, score: { color: theme.accent, fontSize: 22, fontWeight: "800" }, track: { height: 6, backgroundColor: theme.border, borderRadius: 3, overflow: "hidden" }, fill: { height: 6, backgroundColor: theme.accent, borderRadius: 3 }, helper: { color: theme.muted, fontSize: 11, lineHeight: 18 }, status: { color: theme.accent, fontSize: 13, lineHeight: 20, fontWeight: "800" }, requirements: { gap: 8, paddingTop: 4 }, requirementTitle: { color: theme.text, fontSize: 12, fontWeight: "800" }, requirementRow: { flexDirection: "row", alignItems: "center", gap: 8 }, requirement: { flex: 1, color: theme.muted, fontSize: 12, lineHeight: 18 }, messageBox: { borderWidth: 1, borderColor: "#C84F4F44", backgroundColor: "#C84F4F12", borderRadius: 12, padding: 11 }, successBox: { borderColor: "#16A36A55", backgroundColor: "#16A36A10" }, message: { color: "#E59A9A", fontSize: 13, lineHeight: 20 }, success: { color: "#49C991" }, primaryButton: { backgroundColor: theme.accent, borderRadius: 14, minHeight: 54, alignItems: "center", justifyContent: "center" }, primaryText: { color: theme.background, fontSize: 15, fontWeight: "900" }, secondaryButton: { borderWidth: 1, borderColor: theme.border, borderRadius: 14, minHeight: 50, alignItems: "center", justifyContent: "center" }, secondaryText: { color: theme.text, fontSize: 14, fontWeight: "800" }, disabled: { opacity: 0.45 }, pressed: { opacity: 0.8 }, arabicText: { letterSpacing: 0 },
}); }
