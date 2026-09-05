import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { getTalentProfile } from "@/lib/api";
import { MOBILE_API_BASE_URL } from "@/lib/api-config";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { darkTheme } from "@/lib/theme";

type MissingRequirement = { key: string; ar: string; en: string };

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

  async function submitReview() {
    if (submitting) return;
    setSubmitting(true); setMessage(null); setSuccess(false); setMissing([]);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.replace({ pathname: "/login", params: { next: "/profile/review" } });
        return;
      }
      const response = await fetch(`${MOBILE_API_BASE_URL}/api/talent/me/review?locale=${locale}`, {
        method: "POST",
        headers: { Accept: "application/json", Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json() as { ok: boolean; message?: string; completion?: number; approvalStatus?: string; missingRequirements?: MissingRequirement[] };
      if (typeof result.completion === "number") setCompletion(result.completion);
      if (Array.isArray(result.missingRequirements)) setMissing(result.missingRequirements);
      setMessage(result.message ?? (isArabic ? "تعذر إرسال الملف للمراجعة." : "Unable to submit your profile for review."));
      if (result.ok) {
        setSuccess(true);
        setApprovalStatus(result.approvalStatus ?? "pending");
      }
    } catch {
      setMessage(isArabic ? "تعذر إرسال الملف للمراجعة الآن." : "Unable to submit your profile right now.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator accessibilityLabel={isArabic ? "جارٍ تحميل حالة الملف" : "Loading profile status"} size="large" color={theme.accent} /></View>;

  const underReview = approvalStatus === "pending" || approvalStatus === "submitted";
  const approved = approvalStatus === "approved";
  const canSubmit = !underReview && !approved;
  const safeCompletion = Math.max(0, Math.min(100, completion ?? 0));
  const textAlign = isRtl ? "right" : "left";

  return <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { direction: isRtl ? "rtl" : "ltr" }]} contentInsetAdjustmentBehavior="automatic">
    <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} hitSlop={12}><Text style={[styles.back, isArabic && styles.arabicText]}>{isArabic ? "رجوع" : "Back"}</Text></Pressable>
    <View style={styles.header}><Text style={[styles.brand, isArabic && styles.arabicText]}>{isArabic ? "ملامح" : "MLAMH"}</Text><Text accessibilityRole="header" style={[styles.title, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "جاهزية الملف" : "Profile readiness"}</Text><Text style={[styles.subtitle, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "قبل الإرسال، تأكد من اكتمال البيانات الأساسية المطلوبة نفسها المعتمدة على الويب." : "Before submitting, complete the same required core profile details used on the web platform."}</Text></View>

    <View accessible accessibilityLabel={isArabic ? `اكتمال الملف ${safeCompletion} بالمئة` : `Profile completion ${safeCompletion} percent`} style={styles.card}>
      <View style={styles.scoreRow}><Text style={[styles.cardTitle, isArabic && styles.arabicText]}>{isArabic ? "اكتمال الملف" : "Profile completion"}</Text><Text style={styles.score}>{safeCompletion}%</Text></View>
      <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: safeCompletion }} style={styles.track}><View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.fill, { width: `${safeCompletion}%` }]} /></View>
      <Text style={[styles.helper, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "نسبة الاكتمال مؤشر مساعد فقط. الإرسال يعتمد على اكتمال الحقول الأساسية المطلوبة، وليس على نسبة ثابتة." : "Completion is a progress indicator only. Submission depends on the required core fields, not a fixed percentage threshold."}</Text>
    </View>

    <View style={styles.card}>
      <Text style={[styles.cardTitle, isArabic && styles.arabicText]}>{isArabic ? "حالة المراجعة" : "Review status"}</Text>
      <Text accessibilityLiveRegion="polite" style={[styles.status, isArabic && styles.arabicText]}>{approved ? (isArabic ? "معتمد" : "Approved") : underReview ? (isArabic ? "قيد المراجعة" : "Under review") : (isArabic ? "لم يُرسل بعد" : "Not submitted yet")}</Text>
      {missing.length > 0 ? <View style={styles.requirements}><Text style={[styles.requirementTitle, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "أكمل هذه البيانات:" : "Complete these details:"}</Text>{missing.map((item) => <Text key={item.key} style={[styles.requirement, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? item.ar : item.en}</Text>)}</View> : null}
      {message ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.message, success && styles.success, isArabic && styles.arabicText, { textAlign }]}>{message}</Text> : null}
    </View>

    {canSubmit ? <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "إرسال الملف للمراجعة" : "Submit profile for review"} accessibilityState={{ disabled: submitting, busy: submitting }} disabled={submitting} onPress={() => void submitReview()} style={({ pressed }) => [styles.primaryButton, submitting && styles.disabled, pressed && styles.pressed]}>{submitting ? <ActivityIndicator accessibilityLabel={isArabic ? "جارٍ إرسال الملف" : "Submitting profile"} color={theme.background} /> : <Text style={[styles.primaryText, isArabic && styles.arabicText]}>{isArabic ? "إرسال للمراجعة" : "Submit for review"}</Text>}</Pressable> : null}
    <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "تعديل ملفي" : "Edit my profile"} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={() => router.replace("/profile/edit")}><Text style={[styles.secondaryText, isArabic && styles.arabicText]}>{isArabic ? "تعديل الملف" : "Edit profile"}</Text></Pressable>
  </ScrollView>;
}

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }, content: { width: "100%", maxWidth: 620, alignSelf: "center", paddingHorizontal: 24, paddingTop: 46, paddingBottom: 46, gap: 16 }, back: { color: theme.muted, fontSize: 13, fontWeight: "600", paddingVertical: 8 }, header: { gap: 8, marginBottom: 4 }, brand: { color: theme.accent, fontSize: 17, lineHeight: 22, fontWeight: "800", letterSpacing: 1.1 }, title: { color: theme.text, fontSize: 31, lineHeight: 38, fontWeight: "700" }, subtitle: { color: theme.muted, fontSize: 14, lineHeight: 22 }, card: { gap: 11, padding: 17, borderWidth: 1, borderColor: theme.border, borderRadius: 15, backgroundColor: theme.surface }, scoreRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, cardTitle: { color: theme.text, fontSize: 16, fontWeight: "700" }, score: { color: theme.accent, fontSize: 21, fontWeight: "700" }, track: { height: 5, backgroundColor: theme.border, borderRadius: 3, overflow: "hidden" }, fill: { height: 5, backgroundColor: theme.accent, borderRadius: 3 }, helper: { color: theme.muted, fontSize: 12, lineHeight: 19 }, status: { color: theme.accent, fontSize: 14, fontWeight: "700" }, requirements: { gap: 5, paddingTop: 4 }, requirementTitle: { color: theme.text, fontSize: 12, fontWeight: "700" }, requirement: { color: theme.muted, fontSize: 12, lineHeight: 18 }, message: { color: theme.muted, fontSize: 13, lineHeight: 20 }, success: { color: theme.accent }, primaryButton: { backgroundColor: theme.accent, borderRadius: 12, minHeight: 52, alignItems: "center", justifyContent: "center" }, primaryText: { color: theme.background, fontSize: 15, fontWeight: "800" }, secondaryButton: { borderWidth: 1, borderColor: theme.border, borderRadius: 12, minHeight: 50, alignItems: "center", justifyContent: "center" }, secondaryText: { color: theme.text, fontSize: 14, fontWeight: "700" }, disabled: { opacity: 0.45 }, pressed: { opacity: 0.8 }, arabicText: { letterSpacing: 0 },
}); }
