import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";

import { ScreenSkeleton } from "@/components/ScreenSkeleton";
import { getTalentProfile } from "@/lib/api";
import { MOBILE_API_BASE_URL } from "@/lib/api-config";
import { isRtlLocale } from "@/lib/i18n";
import { useAppLocale } from "@/lib/locale-context";
import { leaveAuthenticatedScreen } from "@/lib/navigation";
import { getMobileTalentReviewReadiness } from "@/lib/profile-review-readiness";
import { supabase } from "@/lib/supabase";
import { darkTheme } from "@/lib/theme";

type MissingRequirement = { key: string; ar: string; en: string };
type ReviewResponse = { ok?: boolean; code?: string; message?: string; completion?: number; approvalStatus?: string; missingRequirements?: MissingRequirement[] };

const BRAND_AR = require("../../assets/logo.ar.png");
const BRAND_EN = require("../../assets/logo.en.png");

async function readReviewResponse(response: Response): Promise<ReviewResponse | null> {
  const raw = await response.text().catch(() => "");
  if (!raw) return null;
  try { const parsed = JSON.parse(raw) as unknown; return parsed && typeof parsed === "object" ? parsed as ReviewResponse : null; } catch { return null; }
}

export default function ProfileReviewScreen() {
  const params = useLocalSearchParams<{ onboarding?: string }>();
  const onboarding = params.onboarding === "1";
  const { locale } = useAppLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const { width, height } = useWindowDimensions();
  const compact = width <= 360 || height <= 700;
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [completion, setCompletion] = useState<number | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [missing, setMissing] = useState<MissingRequirement[]>([]);
  const [locallyReady, setLocallyReady] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const result = await getTalentProfile(locale);
        if (!active) return;
        if (!result.ok) {
          if (result.code === "UNAUTHENTICATED") router.replace({ pathname: "/login", params: { next: onboarding ? "/profile/review?onboarding=1" : "/profile/review" } });
          else setMessage(isArabic ? "تعذر تحميل حالة الملف." : "Unable to load profile status.");
          return;
        }
        const readiness = getMobileTalentReviewReadiness(result.item);
        setCompletion(result.item.profileCompletion);
        setApprovalStatus(result.item.approvalStatus);
        setLocallyReady(readiness.isReady);
        setMissing(readiness.missingRequirements.map(({ key, ar, en }) => ({ key, ar, en })));
      } catch {
        if (active) setMessage(isArabic ? "تعذر تحميل حالة الملف. تحقق من الاتصال وحاول مرة أخرى." : "Unable to load profile status. Check your connection and try again.");
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [isArabic, locale, onboarding]);

  async function requestReview(accessToken: string) {
    return fetch(`${MOBILE_API_BASE_URL}/api/talent/me/review?locale=${locale}`, { method: "POST", headers: { Accept: "application/json", Authorization: `Bearer ${accessToken}` } });
  }

  async function submitReview() {
    if (submitting || !locallyReady) return;
    setSubmitting(true); setMessage(null); setSuccess(false);
    try {
      let { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { const refreshed = await supabase.auth.refreshSession().catch(() => null); session = refreshed?.data.session ?? null; }
      if (!session?.access_token) { router.replace({ pathname: "/login", params: { next: onboarding ? "/profile/review?onboarding=1" : "/profile/review" } }); return; }
      let response = await requestReview(session.access_token);
      if (response.status === 401) { const refreshed = await supabase.auth.refreshSession().catch(() => null); const refreshedToken = refreshed?.data.session?.access_token; if (refreshedToken) response = await requestReview(refreshedToken); }
      if (response.status === 401) { router.replace({ pathname: "/login", params: { next: onboarding ? "/profile/review?onboarding=1" : "/profile/review" } }); return; }
      const result = await readReviewResponse(response);
      if (!result) { setMessage(isArabic ? "تعذر قراءة استجابة المراجعة. حاول مرة أخرى." : "We couldn't read the review response. Please try again."); return; }
      if (typeof result.completion === "number" && Number.isFinite(result.completion)) setCompletion(result.completion);
      if (Array.isArray(result.missingRequirements)) {
        setMissing(result.missingRequirements);
        setLocallyReady(result.missingRequirements.length === 0);
      }
      if (!response.ok || !result.ok) { setMessage(result.message ?? (isArabic ? "تعذر إرسال الملف للمراجعة." : "Unable to submit your profile for review.")); return; }
      setSuccess(true); setApprovalStatus(result.approvalStatus ?? "pending"); setMessage(result.message ?? (isArabic ? "تم إرسال ملفك للمراجعة." : "Your profile was submitted for review."));
    } catch {
      setMessage(isArabic ? "تعذر إرسال الملف للمراجعة الآن. تحقق من الاتصال وحاول مرة أخرى." : "Unable to submit your profile right now. Check your connection and try again.");
    } finally { setSubmitting(false); }
  }

  if (loading) return <ScreenSkeleton variant="profile" locale={locale} label={isArabic ? "تحميل جاهزية الملف" : "Loading profile readiness"} />;

  const underReview = approvalStatus === "pending" || approvalStatus === "submitted";
  const approved = approvalStatus === "approved";
  const canSubmit = locallyReady && !underReview && !approved;
  const safeCompletion = Math.max(0, Math.min(100, completion ?? 0));
  const textAlign = isRtl ? "right" : "left";
  const onboardingProgress = underReview || approved ? 100 : 75;
  const approvedNeedsData = approved && !locallyReady;

  return <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
    <ScrollView contentContainerStyle={[styles.content, compact && styles.contentCompact]} showsVerticalScrollIndicator={false}>
      <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => onboarding ? router.replace("/profile/journey") : leaveAuthenticatedScreen("/profile")} hitSlop={12} style={[styles.backButton, isRtl && styles.backButtonRtl]}><Text style={[styles.back, isArabic && styles.arabicText]}>{isArabic ? "رجوع" : "Back"}</Text></Pressable>
      {onboarding ? <View style={styles.onboardingCard}><View style={[styles.onboardingCopy, isRtl && styles.rowRtl]}><Text style={[styles.onboardingLabel, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "الخطوة 4 من 4" : "Step 4 of 4"}</Text><Text style={styles.onboardingValue}>{onboardingProgress}%</Text></View><View style={styles.onboardingTrack}><View style={[styles.onboardingFill, onboardingProgress < 100 && styles.onboardingFillPending]}/></View><Text style={[styles.onboardingHint, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "هذه نسبة خطوات الإعداد، وليست نسبة اكتمال الملف." : "This is setup journey progress, not profile completion."}</Text></View> : null}
      <View style={styles.header}><Image source={isArabic ? BRAND_AR : BRAND_EN} resizeMode="contain" style={[styles.brandLogo, isRtl && styles.brandLogoRtl]}/><Text accessibilityRole="header" style={[styles.title, compact && styles.titleCompact, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "جاهزية الملف" : "Profile readiness"}</Text><Text style={[styles.subtitle, isArabic && styles.arabicText, { textAlign }]}>{approvedNeedsData ? (isArabic ? "اعتمادك محفوظ. أكمل المتطلبات الأساسية الحالية حتى يبقى ملفك جاهزًا للتقديم على الفرص." : "Your approval is preserved. Complete the current required fields so your profile stays ready to apply.") : approved ? (isArabic ? "ملفك معتمد. حافظ على اكتمال المتطلبات الأساسية واستمر في تطوير ملفك." : "Your profile is approved. Keep the required fields complete and continue improving it.") : (isArabic ? "راجع المتطلبات الإلزامية ثم أرسل ملفك للمراجعة. يبقى الملف خاصًا حتى يتم اعتماده." : "Review the required fields, then submit your profile. It remains private until approved.")}</Text></View>

      <View accessible accessibilityLabel={isArabic ? `اكتمال الملف ${safeCompletion} بالمئة` : `Profile completion ${safeCompletion} percent`} style={[styles.card, compact && styles.cardCompact]}>
        <View style={[styles.scoreRow, isRtl && styles.rowRtl]}><Text style={[styles.cardTitle, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "اكتمال الملف" : "Profile completion"}</Text><Text style={styles.score}>{safeCompletion}%</Text></View>
        <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: safeCompletion }} style={styles.track}><View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.fill, { width: `${safeCompletion}%` }]} /></View>
        <Text style={[styles.helper, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "النسبة مؤشر مساعد فقط. الإرسال يعتمد على المتطلبات الإلزامية نفسها المستخدمة في نظام المراجعة." : "The percentage is only a progress indicator. Submission uses the same required fields as the review system."}</Text>
      </View>

      <View style={[styles.card, compact && styles.cardCompact]}>
        <Text style={[styles.cardTitle, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "حالة المراجعة" : "Review status"}</Text>
        <Text accessibilityLiveRegion="polite" style={[styles.status, isArabic && styles.arabicText, { textAlign }]}>{approvedNeedsData ? (isArabic ? "معتمد — يحتاج استكمال" : "Approved — needs completion") : approved ? (isArabic ? "معتمد" : "Approved") : underReview ? (isArabic ? "قيد المراجعة" : "Under review") : locallyReady ? (isArabic ? "جاهز للإرسال" : "Ready to submit") : (isArabic ? "أكمل المتطلبات أولًا" : "Complete the requirements first")}</Text>
        {underReview ? <Text style={[styles.helper, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "تم استلام ملفك، ولا تحتاج لإعادة الإرسال. ستتحدث الحالة تلقائيًا بعد قرار المراجعة." : "Your profile was received. You do not need to resubmit; the status updates after review."}</Text> : null}
        {approved ? <Text style={[styles.helper, isArabic && styles.arabicText, { textAlign }]}>{approvedNeedsData ? (isArabic ? "لا تحتاج لإعادة المراجعة. أكمل المتطلبات الناقصة ثم ارجع للفرص." : "You do not need another review. Complete the missing requirements, then return to opportunities.") : (isArabic ? "تم اعتماد ملفك وهو جاهز للظهور والتقديم وفق إعداداتك." : "Your profile is approved and ready to appear and apply according to your settings.")}</Text> : null}
        {!underReview && missing.length > 0 ? <View style={styles.requirements}><Text style={[styles.requirementTitle, isArabic && styles.arabicText, { textAlign }]}>{approvedNeedsData ? (isArabic ? "أكمل هذه المتطلبات مع بقاء اعتمادك محفوظًا:" : "Complete these requirements while keeping your approval:") : (isArabic ? "أكمل هذه البيانات قبل الإرسال:" : "Complete these before submitting:")}</Text>{missing.map((item) => <View key={item.key} style={[styles.requirementRow, isRtl && styles.rowRtl]}><Text accessibilityElementsHidden style={styles.requirementDot}>•</Text><Text style={[styles.requirement, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? item.ar : item.en}</Text></View>)}</View> : null}
        {message ? <View style={[styles.messageBox, success && styles.successBox]}><Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.message, success && styles.success, isArabic && styles.arabicText, { textAlign }]}>{message}</Text></View> : null}
      </View>

      {canSubmit ? <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "إرسال الملف للمراجعة" : "Submit profile for review"} accessibilityState={{ disabled: submitting, busy: submitting }} disabled={submitting} onPress={() => void submitReview()} style={({ pressed }) => [styles.primaryButton, submitting && styles.disabled, pressed && styles.pressed]}>{submitting ? <ActivityIndicator accessibilityLabel={isArabic ? "جارٍ إرسال الملف" : "Submitting profile"} color={theme.background} /> : <Text style={[styles.primaryText, isArabic && styles.arabicText]}>{isArabic ? "إرسال للمراجعة" : "Submit for review"}</Text>}</Pressable> : null}
      {!locallyReady && !underReview ? <Pressable accessibilityRole="button" onPress={() => onboarding ? router.replace({ pathname: "/profile/edit", params: { onboarding: "1" } }) : router.replace("/profile/edit")} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={[styles.primaryText, isArabic && styles.arabicText]}>{approved ? (isArabic ? "إكمال البيانات" : "Complete details") : (isArabic ? "إكمال المتطلبات" : "Complete requirements")}</Text></Pressable> : null}
      {onboarding && (success || underReview || approved) ? <Pressable accessibilityRole="button" onPress={() => router.replace("/profile/journey")} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={[styles.primaryText, isArabic && styles.arabicText]}>{approved ? locallyReady ? (isArabic ? "الانتقال إلى ملفي" : "Go to my profile") : (isArabic ? "العودة لرحلة الملف" : "Return to profile journey") : (isArabic ? "متابعة حالة ملفي" : "Continue to profile status")}</Text></Pressable> : null}
      <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "تعديل ملفي" : "Edit my profile"} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={() => onboarding ? router.replace({ pathname: "/profile/edit", params: { onboarding: "1" } }) : router.replace("/profile/edit")}><Text style={[styles.secondaryText, isArabic && styles.arabicText]}>{isArabic ? "تعديل الملف" : "Edit profile"}</Text></Pressable>
    </ScrollView>
  </SafeAreaView>;
}

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  content: { width: "100%", maxWidth: 620, alignSelf: "center", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24, gap: 14 },
  contentCompact: { paddingHorizontal: 14, paddingTop: 6, gap: 11 },
  rowRtl: { flexDirection: "row-reverse" },
  backButton: { minHeight: 44, alignSelf: "flex-start", justifyContent: "center" },
  backButtonRtl: { alignSelf: "flex-end" },
  back: { color: theme.muted, fontSize: 13, fontWeight: "600", paddingVertical: 8 },
  onboardingCard: { borderWidth: 1, borderColor: "#C9A96233", borderRadius: 16, backgroundColor: "#C9A96208", padding: 12, gap: 8 },
  onboardingCopy: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  onboardingLabel: { color: theme.text, fontSize: 11, fontWeight: "800" },
  onboardingValue: { color: theme.accent, fontSize: 11, fontWeight: "900" },
  onboardingTrack: { height: 4, borderRadius: 2, backgroundColor: "#FFFFFF12", overflow: "hidden" },
  onboardingFill: { width: "100%", height: "100%", backgroundColor: theme.accent },
  onboardingFillPending: { width: "75%" },
  onboardingHint: { color: theme.muted, fontSize: 10, lineHeight: 15 },
  header: { gap: 7, marginBottom: 2 },
  brandLogo: { width: 104, height: 38, alignSelf: "flex-start" },
  brandLogoRtl: { alignSelf: "flex-end" },
  title: { color: theme.text, fontSize: 29, lineHeight: 35, fontWeight: "800" },
  titleCompact: { fontSize: 25, lineHeight: 31 },
  subtitle: { color: theme.muted, fontSize: 13, lineHeight: 20 },
  card: { gap: 10, padding: 16, borderWidth: 1, borderColor: theme.border, borderRadius: 18, backgroundColor: theme.surface },
  cardCompact: { padding: 13, gap: 8 },
  scoreRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { color: theme.text, fontSize: 15, fontWeight: "800", flexShrink: 1 },
  score: { color: theme.accent, fontSize: 21, fontWeight: "800" },
  track: { height: 5, backgroundColor: theme.border, borderRadius: 3, overflow: "hidden" },
  fill: { height: 5, backgroundColor: theme.accent, borderRadius: 3 },
  helper: { color: theme.muted, fontSize: 12, lineHeight: 18 },
  status: { color: theme.accent, fontSize: 14, fontWeight: "800" },
  requirements: { gap: 7, paddingTop: 3 },
  requirementTitle: { color: theme.text, fontSize: 12, fontWeight: "800" },
  requirementRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  requirementDot: { color: theme.accent, fontSize: 14, lineHeight: 18 },
  requirement: { flex: 1, color: theme.muted, fontSize: 12, lineHeight: 18 },
  messageBox: { borderWidth: 1, borderColor: "#C84F4F44", backgroundColor: "#C84F4F12", borderRadius: 12, padding: 11 },
  successBox: { borderColor: "#16A36A55", backgroundColor: "#16A36A10" },
  message: { color: "#E59A9A", fontSize: 13, lineHeight: 20 },
  success: { color: "#49C991" },
  primaryButton: { backgroundColor: theme.accent, borderRadius: 12, minHeight: 52, alignItems: "center", justifyContent: "center", paddingHorizontal: 14 },
  primaryText: { color: theme.background, fontSize: 15, fontWeight: "900", textAlign: "center" },
  secondaryButton: { borderWidth: 1, borderColor: theme.border, borderRadius: 12, minHeight: 50, alignItems: "center", justifyContent: "center", paddingHorizontal: 14 },
  secondaryText: { color: theme.text, fontSize: 14, fontWeight: "800", textAlign: "center" },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.8 },
  arabicText: { letterSpacing: 0, writingDirection: "rtl" },
}); }
