import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from "react-native";
import { router } from "expo-router";

import { getTalentProfile } from "@/lib/api";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { darkTheme, lightTheme } from "@/lib/theme";

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://mlamh.net").replace(/\/$/, "");

export default function ProfileReviewScreen() {
  const locale = getDeviceLocale();
  const theme = useColorScheme() === "dark" ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [completion, setCompletion] = useState<number | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    void (async () => {
      const result = await getTalentProfile(locale);
      if (!result.ok) {
        if (result.code === "UNAUTHENTICATED") router.replace({ pathname: "/login", params: { next: "/profile/review" } });
        else setMessage(locale === "ar" ? "تعذر تحميل حالة الملف." : "Unable to load profile status.");
        setLoading(false);
        return;
      }
      setCompletion(result.item.profileCompletion);
      setApprovalStatus(result.item.approvalStatus);
      setLoading(false);
    })();
  }, [locale]);

  async function submitReview() {
    if (submitting) return;
    setSubmitting(true); setMessage(null); setSuccess(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.replace({ pathname: "/login", params: { next: "/profile/review" } });
        return;
      }
      const response = await fetch(`${API_BASE_URL}/api/talent/me/review?locale=${locale}`, {
        method: "POST",
        headers: { Accept: "application/json", Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json() as { ok: boolean; message?: string; completion?: number; approvalStatus?: string };
      if (typeof result.completion === "number") setCompletion(result.completion);
      setMessage(result.message ?? (locale === "ar" ? "تعذر إرسال الملف للمراجعة." : "Unable to submit your profile for review."));
      if (result.ok) {
        setSuccess(true);
        setApprovalStatus(result.approvalStatus ?? "pending");
      }
    } catch {
      setMessage(locale === "ar" ? "تعذر إرسال الملف للمراجعة الآن." : "Unable to submit your profile right now.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.accent} /></View>;

  const underReview = approvalStatus === "pending" || approvalStatus === "submitted";
  const approved = approvalStatus === "approved";
  const canSubmit = !underReview && !approved;

  return <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]}>
    <Pressable onPress={() => router.back()}><Text style={styles.back}>{locale === "ar" ? "رجوع" : "Back"}</Text></Pressable>
    <View style={styles.header}><Text style={styles.eyebrow}>MLAMH</Text><Text style={styles.title}>{locale === "ar" ? "مراجعة ملفك" : "Profile review"}</Text><Text style={styles.subtitle}>{locale === "ar" ? "عندما يصبح ملفك جاهزًا، أرسله للمراجعة حتى يمكن اعتماده والظهور للمشاريع المناسبة." : "When your portfolio is ready, submit it for review so it can be approved for matching projects."}</Text></View>

    <View style={styles.card}>
      <View style={styles.scoreRow}><Text style={styles.cardTitle}>{locale === "ar" ? "اكتمال الملف" : "Profile completion"}</Text><Text style={styles.score}>{completion ?? 0}%</Text></View>
      <View style={styles.track}><View style={[styles.fill, { width: `${Math.max(0, Math.min(100, completion ?? 0))}%` }]} /></View>
      <Text style={styles.helper}>{locale === "ar" ? "الحد الأدنى للإرسال 35%، مع استكمال البيانات الأساسية المطلوبة." : "Minimum submission threshold is 35%, with all required core details completed."}</Text>
    </View>

    <View style={styles.card}>
      <Text style={styles.cardTitle}>{locale === "ar" ? "حالة المراجعة" : "Review status"}</Text>
      <Text style={styles.status}>{approved ? (locale === "ar" ? "معتمد" : "Approved") : underReview ? (locale === "ar" ? "قيد المراجعة" : "Under review") : (locale === "ar" ? "لم يُرسل بعد" : "Not submitted yet")}</Text>
      {message ? <Text style={[styles.message, success && styles.success]}>{message}</Text> : null}
    </View>

    {canSubmit ? <Pressable disabled={submitting} onPress={() => void submitReview()} style={[styles.primaryButton, submitting && styles.disabled]}>{submitting ? <ActivityIndicator color="#181818" /> : <Text style={styles.primaryText}>{locale === "ar" ? "إرسال الملف للمراجعة" : "Submit profile for review"}</Text>}</Pressable> : null}
    <Pressable style={styles.secondaryButton} onPress={() => router.replace("/profile")}><Text style={styles.secondaryText}>{locale === "ar" ? "العودة إلى ملفي" : "Back to my profile"}</Text></Pressable>
  </ScrollView>;
}

function createStyles(theme: typeof lightTheme | typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }, content: { paddingHorizontal: 22, paddingTop: 58, paddingBottom: 50, gap: 18 }, back: { color: theme.accent, fontSize: 14, fontWeight: "700" }, header: { gap: 9, marginBottom: 4 }, eyebrow: { color: theme.accent, fontSize: 12, fontWeight: "800", letterSpacing: 2.2 }, title: { color: theme.text, fontSize: 38, lineHeight: 46, fontWeight: "300" }, subtitle: { color: theme.muted, fontSize: 14, lineHeight: 23 }, card: { gap: 12, padding: 20, borderWidth: 1, borderColor: theme.border, borderRadius: 24, backgroundColor: theme.surface }, scoreRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, cardTitle: { color: theme.text, fontSize: 18, fontWeight: "600" }, score: { color: theme.accent, fontSize: 24, fontWeight: "700" }, track: { height: 8, backgroundColor: theme.border, borderRadius: 5, overflow: "hidden" }, fill: { height: 8, backgroundColor: theme.accent, borderRadius: 5 }, helper: { color: theme.muted, fontSize: 12, lineHeight: 19 }, status: { color: theme.accent, fontSize: 16, fontWeight: "700" }, message: { color: theme.muted, fontSize: 13, lineHeight: 21 }, success: { color: theme.accent }, primaryButton: { backgroundColor: theme.accent, borderRadius: 18, paddingVertical: 16, alignItems: "center" }, primaryText: { color: "#181818", fontSize: 15, fontWeight: "800" }, secondaryButton: { borderWidth: 1, borderColor: theme.border, borderRadius: 18, paddingVertical: 15, alignItems: "center" }, secondaryText: { color: theme.text, fontSize: 14, fontWeight: "600" }, disabled: { opacity: 0.5 },
}); }
