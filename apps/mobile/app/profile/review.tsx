import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from "react-native";
import { router } from "expo-router";

import { getTalentProfile } from "@/lib/api";
import { MOBILE_API_BASE_URL } from "@/lib/api-config";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { darkTheme, lightTheme } from "@/lib/theme";

export default function ProfileReviewScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const theme = useColorScheme() === "dark" ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [completion, setCompletion] = useState<number | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
    setSubmitting(true); setMessage(null); setSuccess(false);
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
      const result = await response.json() as { ok: boolean; message?: string; completion?: number; approvalStatus?: string };
      if (typeof result.completion === "number") setCompletion(result.completion);
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

  return <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]} contentInsetAdjustmentBehavior="automatic">
    <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} hitSlop={12}><Text style={styles.back}>{isArabic ? "رجوع" : "Back"}</Text></Pressable>
    <View style={styles.header}><Text style={styles.eyebrow}>MLAMH</Text><Text accessibilityRole="header" style={styles.title}>{isArabic ? "مراجعة ملفك" : "Profile review"}</Text><Text style={styles.subtitle}>{isArabic ? "عندما يصبح ملفك جاهزًا، أرسله للمراجعة حتى يمكن اعتماده والظهور للمشاريع المناسبة." : "When your portfolio is ready, submit it for review so it can be approved for matching projects."}</Text></View>

    <View accessible accessibilityLabel={isArabic ? `اكتمال الملف ${safeCompletion} بالمئة` : `Profile completion ${safeCompletion} percent`} style={styles.card}>
      <View style={styles.scoreRow}><Text style={styles.cardTitle}>{isArabic ? "اكتمال الملف" : "Profile completion"}</Text><Text style={styles.score}>{safeCompletion}%</Text></View>
      <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: safeCompletion }} style={styles.track}><View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.fill, { width: `${safeCompletion}%` }]} /></View>
      <Text style={styles.helper}>{isArabic ? "الحد الأدنى للإرسال 35%، مع استكمال البيانات الأساسية المطلوبة." : "Minimum submission threshold is 35%, with all required core details completed."}</Text>
    </View>

    <View style={styles.card}>
      <Text style={styles.cardTitle}>{isArabic ? "حالة المراجعة" : "Review status"}</Text>
      <Text accessibilityLiveRegion="polite" style={styles.status}>{approved ? (isArabic ? "معتمد" : "Approved") : underReview ? (isArabic ? "قيد المراجعة" : "Under review") : (isArabic ? "لم يُرسل بعد" : "Not submitted yet")}</Text>
      {message ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.message, success && styles.success]}>{message}</Text> : null}
    </View>

    {canSubmit ? <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "إرسال الملف للمراجعة" : "Submit profile for review"} accessibilityState={{ disabled: submitting, busy: submitting }} disabled={submitting} onPress={() => void submitReview()} style={[styles.primaryButton, submitting && styles.disabled]}>{submitting ? <ActivityIndicator accessibilityLabel={isArabic ? "جارٍ إرسال الملف" : "Submitting profile"} color="#181818" /> : <Text style={styles.primaryText}>{isArabic ? "إرسال الملف للمراجعة" : "Submit profile for review"}</Text>}</Pressable> : null}
    <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "العودة إلى ملفي" : "Back to my profile"} style={styles.secondaryButton} onPress={() => router.replace("/profile")}><Text style={styles.secondaryText}>{isArabic ? "العودة إلى ملفي" : "Back to my profile"}</Text></Pressable>
  </ScrollView>;
}

function createStyles(theme: typeof lightTheme | typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }, content: { paddingHorizontal: 22, paddingTop: 58, paddingBottom: 50, gap: 18 }, back: { color: theme.accent, fontSize: 14, fontWeight: "700", paddingVertical: 8 }, header: { gap: 9, marginBottom: 4 }, eyebrow: { color: theme.accent, fontSize: 12, fontWeight: "800", letterSpacing: 2.2 }, title: { color: theme.text, fontSize: 38, lineHeight: 46, fontWeight: "300" }, subtitle: { color: theme.muted, fontSize: 14, lineHeight: 23 }, card: { gap: 12, padding: 20, borderWidth: 1, borderColor: theme.border, borderRadius: 24, backgroundColor: theme.surface }, scoreRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, cardTitle: { color: theme.text, fontSize: 18, fontWeight: "600" }, score: { color: theme.accent, fontSize: 24, fontWeight: "700" }, track: { height: 8, backgroundColor: theme.border, borderRadius: 5, overflow: "hidden" }, fill: { height: 8, backgroundColor: theme.accent, borderRadius: 5 }, helper: { color: theme.muted, fontSize: 12, lineHeight: 19 }, status: { color: theme.accent, fontSize: 16, fontWeight: "700" }, message: { color: theme.muted, fontSize: 13, lineHeight: 21 }, success: { color: theme.accent }, primaryButton: { backgroundColor: theme.accent, borderRadius: 18, minHeight: 52, paddingVertical: 16, alignItems: "center", justifyContent: "center" }, primaryText: { color: "#181818", fontSize: 15, fontWeight: "800" }, secondaryButton: { borderWidth: 1, borderColor: theme.border, borderRadius: 18, minHeight: 50, paddingVertical: 15, alignItems: "center", justifyContent: "center" }, secondaryText: { color: theme.text, fontSize: 14, fontWeight: "600" }, disabled: { opacity: 0.5 },
}); }
