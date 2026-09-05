import { useCallback, useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";

import { ScreenSkeleton } from "@/components/ScreenSkeleton";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { getPublisherProfile, submitPublisherVerificationEmail, type MobilePublisherProfile } from "@/lib/publisher-api";
import { darkTheme } from "@/lib/theme";

const PUBLIC_DOMAINS = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "icloud.com", "live.com", "proton.me", "protonmail.com"];

export default function PublisherVerificationScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [profile, setProfile] = useState<MobilePublisherProfile | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const result = await getPublisherProfile();
    if (!result.ok) {
      if (result.code === "UNAUTHENTICATED") router.replace({ pathname: "/login", params: { next: "/publisher/verification" } });
      else setError(isArabic ? "تعذر تحميل حالة التوثيق." : "Unable to load verification status.");
      setLoading(false); return;
    }
    if (result.item.isIndividual) { router.replace("/publisher/profile"); return; }
    setProfile(result.item);
    setEmail(result.item.verificationEmail ?? "");
    setLoading(false);
  }, [isArabic]);

  useEffect(() => { void load(); }, [load]);

  async function submit() {
    if (submitting || !profile) return;
    const normalized = email.trim().toLowerCase();
    const domain = normalized.split("@")[1] ?? "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || PUBLIC_DOMAINS.includes(domain)) {
      setError(isArabic ? "استخدم بريدًا رسميًا صالحًا على نطاق الجهة، وليس Gmail أو Hotmail أو بريدًا شخصيًا عامًا." : "Use a valid organization-domain email, not Gmail, Hotmail, or another public personal email provider.");
      return;
    }
    setSubmitting(true); setError(null); setSuccess(null);
    const result = await submitPublisherVerificationEmail(normalized);
    setSubmitting(false);
    if (!result.ok) {
      const messages: Record<string, { ar: string; en: string }> = {
        PROFILE_NOT_APPROVED: { ar: "يجب اعتماد حساب الجهة أولًا قبل بدء التوثيق.", en: "Your organization account must be approved before verification can start." },
        VERIFICATION_PENDING: { ar: "طلب التوثيق قيد المراجعة بالفعل.", en: "Your verification request is already under review." },
        ALREADY_VERIFIED: { ar: "الجهة موثقة بالفعل.", en: "Your organization is already verified." },
        INVALID_COMPANY_EMAIL: { ar: "البريد غير مقبول للتوثيق. استخدم بريد الجهة الرسمي.", en: "This email cannot be used for verification. Use the official organization email." },
      };
      const message = messages[result.code];
      setError(message ? message[locale] : (isArabic ? "تعذر إرسال طلب التوثيق. حاول مرة أخرى." : "Unable to submit verification. Please try again."));
      return;
    }
    setProfile((current) => current ? { ...current, verificationStatus: "pending", verificationMethod: result.method, verificationEmail: result.email, verificationSubmittedAt: new Date().toISOString(), verificationRejectionReason: null } : current);
    setSuccess(isArabic ? "تم استلام طلب التوثيق وسيقوم فريق ملامح بمراجعته." : "Your verification request was received and will be reviewed by the MLAMH team.");
  }

  if (loading) return <ScreenSkeleton variant="detail" locale={locale} label={isArabic ? "تحميل حالة التوثيق" : "Loading verification status"} />;

  const status = profile?.verified ? "verified" : (profile?.verificationStatus ?? "unverified");
  const approved = profile?.approvalStatus === "approved";
  const align = isRtl ? "right" : "left";

  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { direction: isRtl ? "rtl" : "ltr" }]}>
      <View style={[styles.topRow, isRtl && styles.rowRtl]}><Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} hitSlop={12}><Text style={styles.back}>{isRtl ? "›" : "‹"}</Text></Pressable><Text style={styles.brand}>{isArabic ? "ملامح للأعمال" : "MLAMH FOR BUSINESS"}</Text></View>

      <View style={styles.header}><Text style={styles.eyebrow}>{isArabic ? "توثيق الجهة" : "ORGANIZATION VERIFICATION"}</Text><Text accessibilityRole="header" style={[styles.title, { textAlign: align }]}>{isArabic ? "أثبت ارتباطك بالجهة" : "Verify your organization"}</Text><Text style={[styles.subtitle, { textAlign: align }]}>{isArabic ? "لحماية المواهب ورفع مستوى الثقة، نتحقق من أنك مخول بتمثيل هذه الجهة قبل إظهار شارة التوثيق." : "To protect talent and maintain trust, MLAMH verifies that you are authorized to represent this organization before displaying the verified badge."}</Text></View>

      <StatusCard status={status} profile={profile} locale={locale} styles={styles} />

      {!approved && status !== "verified" ? <View style={styles.gateCard}><Text style={styles.gateTitle}>{isArabic ? "اعتماد الحساب أولًا" : "Account approval comes first"}</Text><Text style={[styles.help, { textAlign: align }]}>{isArabic ? "التوثيق خطوة إضافية بعد مراجعة حساب الجهة واعتماده. أكمل ملف الجهة وأرسله للمراجعة أولًا." : "Verification is an additional step after organization account review. Complete your profile and submit it for approval first."}</Text><Pressable accessibilityRole="button" onPress={() => router.replace("/publisher/profile")} style={styles.outlineButton}><Text style={styles.outlineText}>{isArabic ? "العودة إلى ملف الجهة" : "Back to organization profile"}</Text></Pressable></View> : null}

      {approved && status !== "verified" && status !== "pending" ? <View style={styles.methodCard}>
        <View style={[styles.methodTop, isRtl && styles.rowRtl]}><View style={styles.recommended}><Text style={styles.recommendedText}>{isArabic ? "موصى به" : "RECOMMENDED"}</Text></View><Text style={styles.methodNumber}>01</Text></View>
        <Text style={[styles.methodTitle, { textAlign: align }]}>{isArabic ? "البريد الرسمي للجهة" : "Official company email"}</Text>
        <Text style={[styles.help, { textAlign: align }]}>{isArabic ? "استخدم بريدًا على نطاق الجهة مثل name@company.com. لا نقبل خدمات البريد الشخصي العامة." : "Use an email on the organization domain, such as name@company.com. Public personal email services are not accepted."}</Text>
        <Text style={styles.label}>{isArabic ? "البريد الرسمي" : "Official email"}</Text>
        <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} textContentType="emailAddress" returnKeyType="done" placeholder="name@company.com" placeholderTextColor={theme.muted} style={styles.input} accessibilityLabel={isArabic ? "البريد الرسمي للجهة" : "Official organization email"} />
        <Pressable accessibilityRole="button" accessibilityState={{ busy: submitting, disabled: submitting }} disabled={submitting} onPress={() => void submit()} style={[styles.primaryButton, submitting && styles.disabled]}><Text style={styles.primaryText}>{submitting ? (isArabic ? "جارٍ الإرسال…" : "Submitting…") : status === "rejected" ? (isArabic ? "إعادة إرسال طلب التوثيق" : "Resubmit verification") : (isArabic ? "إرسال طلب التوثيق" : "Submit verification")}</Text></Pressable>
      </View> : null}

      {approved && status !== "verified" && status !== "pending" ? <View style={styles.futureMethods}><Text style={styles.futureTitle}>{isArabic ? "طرق إضافية" : "Additional methods"}</Text><Text style={[styles.help, { textAlign: align }]}>{isArabic ? "الوثيقة الرسمية وبطاقة العمل موجودتان في خارطة التوثيق، لكنهما غير مفعّلتين حاليًا. لن نعرضهما كخيارات قابلة للإرسال قبل اكتمال مسار الرفع والمراجعة." : "Official documents and business cards are part of the verification roadmap, but are not enabled yet. We do not present them as submittable options until upload and review are fully supported."}</Text></View> : null}

      {error ? <View style={styles.errorBox}><Text accessibilityRole="alert" style={styles.error}>{error}</Text></View> : null}
      {success ? <View style={styles.successBox}><Text accessibilityLiveRegion="polite" style={styles.success}>{success}</Text></View> : null}
      <Pressable accessibilityRole="button" onPress={() => router.replace("/publisher/profile")} style={styles.footerButton}><Text style={styles.footerButtonText}>{isArabic ? "ملف الجهة" : "Organization profile"}</Text></Pressable>
    </ScrollView>
  </KeyboardAvoidingView>;
}

function StatusCard({ status, profile, locale, styles }: { status: string; profile: MobilePublisherProfile | null; locale: "ar" | "en"; styles: ReturnType<typeof createStyles> }) {
  const isArabic = locale === "ar";
  const isVerified = status === "verified";
  const isPending = status === "pending";
  const isRejected = status === "rejected";
  const title = isVerified ? (isArabic ? "جهتك موثقة" : "Organization verified") : isPending ? (isArabic ? "طلبك قيد المراجعة" : "Request under review") : isRejected ? (isArabic ? "طلب التوثيق يحتاج تحديثًا" : "Verification needs an update") : (isArabic ? "جاهز لبدء التوثيق" : "Ready to start verification");
  const body = isVerified ? (isArabic ? "تم التحقق من ارتباط حسابك بهذه الجهة، ويمكن عرض شارة التوثيق وفق سياسات ملامح." : "Your connection to this organization has been verified and the badge can be shown under MLAMH policy.") : isPending ? (isArabic ? "استلمنا إثبات ارتباطك بالجهة ويقوم فريق ملامح بمراجعته الآن." : "We received your organization proof and the MLAMH team is reviewing it.") : isRejected ? (isArabic ? "راجع سبب الرفض ثم أرسل بريدًا رسميًا صالحًا جديدًا عند الحاجة." : "Review the rejection reason, then submit a valid official email again if needed.") : (isArabic ? "اختر طريقة التوثيق المتاحة وأرسل إثبات ارتباطك بالجهة." : "Use the available verification method to prove your connection to the organization.");
  return <View style={[styles.statusCard, isVerified && styles.statusVerified, isPending && styles.statusPending, isRejected && styles.statusRejected]}><Text style={styles.statusKicker}>{isArabic ? "الحالة" : "STATUS"}</Text><Text style={styles.statusTitle}>{title}</Text><Text style={styles.help}>{body}</Text>{isRejected && profile?.verificationRejectionReason ? <View style={styles.reasonBox}><Text style={styles.reasonLabel}>{isArabic ? "سبب الرفض" : "REJECTION REASON"}</Text><Text style={styles.reasonText}>{profile.verificationRejectionReason}</Text></View> : null}</View>;
}

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, content: { width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: 20, paddingTop: 34, paddingBottom: 60, gap: 20 }, rowRtl: { flexDirection: "row-reverse" }, topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, back: { color: theme.text, fontSize: 30 }, brand: { color: theme.accent, fontSize: 12, fontWeight: "900", letterSpacing: 1.2 }, header: { gap: 8 }, eyebrow: { color: theme.accent, fontSize: 9, fontWeight: "900", letterSpacing: 1.4 }, title: { color: theme.text, fontSize: 31, lineHeight: 39, fontWeight: "700" }, subtitle: { color: theme.muted, fontSize: 13, lineHeight: 21 }, statusCard: { gap: 9, padding: 18, borderRadius: 22, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface }, statusVerified: { borderColor: "#16A36A66", backgroundColor: "#16A36A0D" }, statusPending: { borderColor: "#C9A96255", backgroundColor: "#C9A9620A" }, statusRejected: { borderColor: "#C84F4F55", backgroundColor: "#C84F4F0D" }, statusKicker: { color: theme.accent, fontSize: 9, fontWeight: "900", letterSpacing: 1.2 }, statusTitle: { color: theme.text, fontSize: 20, lineHeight: 27, fontWeight: "800" }, help: { color: theme.muted, fontSize: 12, lineHeight: 20 }, reasonBox: { marginTop: 4, borderRadius: 14, borderWidth: 1, borderColor: "#C84F4F44", backgroundColor: theme.background, padding: 13, gap: 6 }, reasonLabel: { color: "#E59A9A", fontSize: 8, fontWeight: "900", letterSpacing: 1.1 }, reasonText: { color: theme.text, fontSize: 12, lineHeight: 19 }, gateCard: { gap: 11, padding: 18, borderRadius: 20, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface }, gateTitle: { color: theme.text, fontSize: 17, fontWeight: "800" }, outlineButton: { minHeight: 46, borderRadius: 13, borderWidth: 1, borderColor: theme.accent, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 }, outlineText: { color: theme.accent, fontSize: 11, fontWeight: "800" }, methodCard: { gap: 12, padding: 18, borderRadius: 22, borderWidth: 1, borderColor: "#C9A96255", backgroundColor: theme.surface }, methodTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, recommended: { borderRadius: 999, borderWidth: 1, borderColor: "#C9A96255", backgroundColor: theme.chip, paddingHorizontal: 10, paddingVertical: 6 }, recommendedText: { color: theme.accent, fontSize: 8, fontWeight: "900", letterSpacing: 1 }, methodNumber: { color: theme.grayMuted, fontSize: 11, fontWeight: "800" }, methodTitle: { color: theme.text, fontSize: 19, fontWeight: "800" }, label: { color: theme.text, fontSize: 11, fontWeight: "700", marginTop: 2 }, input: { minHeight: 50, borderRadius: 13, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.background, color: theme.text, paddingHorizontal: 14, fontSize: 13 }, primaryButton: { minHeight: 52, borderRadius: 13, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" }, primaryText: { color: theme.background, fontSize: 12, fontWeight: "900" }, futureMethods: { gap: 8, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface }, futureTitle: { color: theme.text, fontSize: 15, fontWeight: "800" }, errorBox: { borderWidth: 1, borderColor: "#C84F4F66", backgroundColor: "#C84F4F14", borderRadius: 12, padding: 12 }, error: { color: "#E59A9A", fontSize: 12, lineHeight: 18 }, successBox: { borderWidth: 1, borderColor: "#16A36A55", backgroundColor: "#16A36A10", borderRadius: 12, padding: 12 }, success: { color: "#49C991", fontSize: 12, lineHeight: 18 }, footerButton: { minHeight: 48, borderRadius: 13, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" }, footerButtonText: { color: theme.text, fontSize: 11, fontWeight: "800" }, disabled: { opacity: 0.45 },
}); }
