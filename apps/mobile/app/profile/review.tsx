import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { ScreenSkeleton } from "@/components/ScreenSkeleton";
import { getTalentProfile } from "@/lib/api";
import { MOBILE_API_BASE_URL } from "@/lib/api-config";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { darkTheme } from "@/lib/theme";

type MissingRequirement = { key: string; ar: string; en: string };
type ReviewResponse = {
  ok?: boolean;
  code?: string;
  message?: string;
  completion?: number;
  approvalStatus?: string;
  missingRequirements?: MissingRequirement[];
};

async function readReviewResponse(response: Response): Promise<ReviewResponse | null> {
  const raw = await response.text().catch(() => "");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? parsed as ReviewResponse : null;
  } catch {
    return null;
  }
}

export default function ProfileReviewScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [completion, setCompletion] = useState<number | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [missing, setMissing] = useState<MissingRequirement[]>([]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const result = await getTalentProfile(locale);
        if (!active) return;
        if (!result.ok) {
          if (result.code === "UNAUTHENTICATED") router.replace({ pathname: "/login", params: { next: "/profile/review" } });
          else setMessage(isArabic ? "تعذر تحميل حالة الملف." : "Unable to load profile status.");
          return;
        }
        setCompletion(result.item.profileCompletion);
        setApprovalStatus(result.item.approvalStatus);
      } catch {
        if (active) setMessage(isArabic ? "تعذر تحميل حالة الملف. تحقق من الاتصال وحاول مرة أخرى." : "Unable to load profile status. Check your connection and try again.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [isArabic, locale]);

  async function requestReview(accessToken: string) {
    return fetch(`${MOBILE_API_BASE_URL}/api/talent/me/review?locale=${locale}`, {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${accessToken}` },
    });
  }

  async function submitReview() {
    if (submitting) return;
    setSubmitting(true);
    setMessage(null);
    setSuccess(false);
    setMissing([]);

    try {
      let { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        const refreshed = await supabase.auth.refreshSession().catch(() => null);
        session = refreshed?.data.session ?? null;
      }
      if (!session?.access_token) {
        router.replace({ pathname: "/login", params: { next: "/profile/review" } });
        return;
      }

      let response = await requestReview(session.access_token);
      if (response.status === 401) {
        const refreshed = await supabase.auth.refreshSession().catch(() => null);
        const refreshedToken = refreshed?.data.session?.access_token;
        if (refreshedToken) response = await requestReview(refreshedToken);
      }

      if (response.status === 401) {
        router.replace({ pathname: "/login", params: { next: "/profile/review" } });
        return;
      }

      const result = await readReviewResponse(response);
      if (!result) {
        setMessage(isArabic ? "تعذر قراءة استجابة المراجعة. حاول مرة أخرى." : "We couldn't read the review response. Please try again.");
        return;
      }

      if (typeof result.completion === "number" && Number.isFinite(result.completion)) setCompletion(result.completion);
      if (Array.isArray(result.missingRequirements)) setMissing(result.missingRequirements);

      if (!response.ok || !result.ok) {
        setMessage(result.message ?? (isArabic ? "تعذر إرسال الملف للمراجعة." : "Unable to submit your profile for review."));
        return;
      }

      setSuccess(true);
      setApprovalStatus(result.approvalStatus ?? "pending");
      setMessage(result.message ?? (isArabic ? "تم إرسال ملفك للمراجعة." : "Your profile was submitted for review."));
    } catch {
      setMessage(isArabic ? "تعذر إرسال الملف للمراجعة الآن. تحقق من الاتصال وحاول مرة أخرى." : "Unable to submit your profile right now. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <ScreenSkeleton variant="profile" locale={locale} label={isArabic ? "تحميل جاهزية الملف" : "Loading profile readiness"} />;

  const underReview = approvalStatus === "pending" || approvalStatus === "submitted";
  const approved = approvalStatus === "approved";
  const canSubmit = !underReview && !approved;
  const safeCompletion = Math.max(0, Math.min(100, completion ?? 0));
  const textAlign = isRtl ? "right" : "left";

  return <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { direction: isRtl ? "rtl" : "ltr" }]} contentInsetAdjustmentBehavior="automatic">
    <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} hitSlop={12} style={styles.backButton}><Text style={[styles.back, isArabic && styles.arabicText]}>{isArabic ? "رجوع" : "Back"}</Text></Pressable>
    <View style={styles.header}><Text style={[styles.brand, isArabic && styles.arabicText]}>{isArabic ? "ملامح" : "MLAMH"}</Text><Text accessibilityRole="header" style={[styles.title, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "جاهزية الملف" : "Profile readiness"}</Text><Text style={[styles.subtitle, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "قبل الإرسال، تأكد من اكتمال البيانات الأساسية المطلوبة نفسها المعتمدة على الويب." : "Before submitting, complete the same required core profile details used on the web platform."}</Text></View>

    <View accessible accessibilityLabel={isArabic ? `اكتمال الملف ${safeCompletion} بالمئة` : `Profile completion ${safeCompletion} percent`} style={styles.card}>
      <View style={[styles.scoreRow, isRtl && styles.rowRtl]}><Text style={[styles.cardTitle, isArabic && styles.arabicText]}>{isArabic ? "اكتمال الملف" : "Profile completion"}</Text><Text style={styles.score}>{safeCompletion}%</Text></View>
      <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: safeCompletion }} style={styles.track}><View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.fill, { width: `${safeCompletion}%` }]} /></View>
      <Text style={[styles.helper, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "نسبة الاكتمال مؤشر مساعد فقط. الإرسال يعتمد على اكتمال الحقول الأساسية المطلوبة، وليس على نسبة ثابتة." : "Completion is a progress indicator only. Submission depends on the required core fields, not a fixed percentage threshold."}</Text>
    </View>

    <View style={styles.card}>
      <Text style={[styles.cardTitle, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "حالة المراجعة" : "Review status"}</Text>
      <Text accessibilityLiveRegion="polite" style={[styles.status, isArabic && styles.arabicText, { textAlign }]}>{approved ? (isArabic ? "معتمد" : "Approved") : underReview ? (isArabic ? "قيد المراجعة" : "Under review") : (isArabic ? "لم يُرسل بعد" : "Not submitted yet")}</Text>
      {missing.length > 0 ? <View style={styles.requirements}><Text style={[styles.requirementTitle, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "أكمل هذه البيانات:" : "Complete these details:"}</Text>{missing.map((item) => <View key={item.key} style={[styles.requirementRow, isRtl && styles.rowRtl]}><Text accessibilityElementsHidden style={styles.requirementDot}>•</Text><Text style={[styles.requirement, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? item.ar : item.en}</Text></View>)}</View> : null}
      {message ? <View style={[styles.messageBox, success && styles.successBox]}><Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.message, success && styles.success, isArabic && styles.arabicText, { textAlign }]}>{message}</Text></View> : null}
    </View>

    {canSubmit ? <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "إرسال الملف للمراجعة" : "Submit profile for review"} accessibilityState={{ disabled: submitting, busy: submitting }} disabled={submitting} onPress={() => void submitReview()} style={({ pressed }) => [styles.primaryButton, submitting && styles.disabled, pressed && styles.pressed]}>{submitting ? <ActivityIndicator accessibilityLabel={isArabic ? "جارٍ إرسال الملف" : "Submitting profile"} color={theme.background} /> : <Text style={[styles.primaryText, isArabic && styles.arabicText]}>{isArabic ? "إرسال للمراجعة" : "Submit for review"}</Text>}</Pressable> : null}
    <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "تعديل ملفي" : "Edit my profile"} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={() => router.replace("/profile/edit")}><Text style={[styles.secondaryText, isArabic && styles.arabicText]}>{isArabic ? "تعديل الملف" : "Edit profile"}</Text></Pressable>
  </ScrollView>;
}

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  content: { width: "100%", maxWidth: 620, alignSelf: "center", paddingHorizontal: 24, paddingTop: 46, paddingBottom: 46, gap: 16 },
  rowRtl: { flexDirection: "row-reverse" },
  backButton: { minHeight: 44, alignSelf: "flex-start", justifyContent: "center" },
  back: { color: theme.muted, fontSize: 13, fontWeight: "600", paddingVertical: 8 },
  header: { gap: 8, marginBottom: 4 },
  brand: { color: theme.accent, fontSize: 17, lineHeight: 22, fontWeight: "800", letterSpacing: 1.1 },
  title: { color: theme.text, fontSize: 31, lineHeight: 38, fontWeight: "700" },
  subtitle: { color: theme.muted, fontSize: 14, lineHeight: 22 },
  card: { gap: 11, padding: 17, borderWidth: 1, borderColor: theme.border, borderRadius: 18, backgroundColor: theme.surface },
  scoreRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { color: theme.text, fontSize: 16, fontWeight: "700" },
  score: { color: theme.accent, fontSize: 21, fontWeight: "700" },
  track: { height: 5, backgroundColor: theme.border, borderRadius: 3, overflow: "hidden" },
  fill: { height: 5, backgroundColor: theme.accent, borderRadius: 3 },
  helper: { color: theme.muted, fontSize: 12, lineHeight: 19 },
  status: { color: theme.accent, fontSize: 14, fontWeight: "700" },
  requirements: { gap: 7, paddingTop: 4 },
  requirementTitle: { color: theme.text, fontSize: 12, fontWeight: "700" },
  requirementRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  requirementDot: { color: theme.accent, fontSize: 14, lineHeight: 18 },
  requirement: { flex: 1, color: theme.muted, fontSize: 12, lineHeight: 18 },
  messageBox: { borderWidth: 1, borderColor: "#C84F4F44", backgroundColor: "#C84F4F12", borderRadius: 12, padding: 11 },
  successBox: { borderColor: "#16A36A55", backgroundColor: "#16A36A10" },
  message: { color: "#E59A9A", fontSize: 13, lineHeight: 20 },
  success: { color: "#49C991" },
  primaryButton: { backgroundColor: theme.accent, borderRadius: 12, minHeight: 52, alignItems: "center", justifyContent: "center" },
  primaryText: { color: theme.background, fontSize: 15, fontWeight: "800" },
  secondaryButton: { borderWidth: 1, borderColor: theme.border, borderRadius: 12, minHeight: 50, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: theme.text, fontSize: 14, fontWeight: "700" },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.8 },
  arabicText: { letterSpacing: 0 },
}); }
