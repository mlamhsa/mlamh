import { useCallback, useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, MailCheck, ShieldCheck, TriangleAlert } from "lucide-react-native";

import { ScreenSkeleton } from "@/components/ScreenSkeleton";
import { isRtlLocale } from "@/lib/i18n";
import { useAppLocale } from "@/lib/locale-context";
import { getPublisherProfile, submitPublisherVerificationEmail, type MobilePublisherProfile } from "@/lib/publisher-api";
import { darkTheme } from "@/lib/theme";

const PUBLIC_DOMAINS = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "icloud.com", "live.com", "proton.me", "protonmail.com"];

export default function PublisherVerificationScreen() {
  const { locale } = useAppLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const { width } = useWindowDimensions();
  const compact = width <= 360;
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme, compact), [compact, theme]);
  const [profile, setProfile] = useState<MobilePublisherProfile | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getPublisherProfile();
    if (!result.ok) {
      if (result.code === "UNAUTHENTICATED") router.replace({ pathname: "/login", params: { next: "/publisher/verification" } });
      else setError(isArabic ? "تعذر تحميل حالة التوثيق." : "Unable to load verification status.");
      setLoading(false);
      return;
    }
    if (result.item.isIndividual) {
      router.replace("/publisher/profile");
      return;
    }
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
      setError(isArabic ? "استخدم بريدًا رسميًا صالحًا على نطاق الجهة، وليس بريدًا شخصيًا عامًا." : "Use a valid organization-domain email, not a public personal email provider.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
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
  const rtlText = isRtl ? styles.textRtl : undefined;

  return <SafeAreaView style={styles.screen} edges={["top"]}>
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { direction: isRtl ? "rtl" : "ltr" }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.topRow, isRtl && styles.rowRtl]}>
          <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} hitSlop={12} style={styles.backButton}><BackIcon size={21} color={theme.text} strokeWidth={1.9} /></Pressable>
          <Text style={[styles.brand, isArabic && styles.arabicText, rtlText]}>{isArabic ? "ملامح للأعمال" : "MLAMH FOR BUSINESS"}</Text>
        </View>

        <View style={styles.header}>
          <Text style={[styles.eyebrow, isArabic && styles.arabicText, rtlText]}>{isArabic ? "توثيق الجهة" : "ORGANIZATION VERIFICATION"}</Text>
          <Text accessibilityRole="header" style={[styles.title, rtlText]}>{isArabic ? "أثبت ارتباطك بالجهة" : "Verify your organization"}</Text>
          <Text style={[styles.subtitle, rtlText]}>{isArabic ? "لحماية المواهب ورفع مستوى الثقة، نتحقق من أنك مخول بتمثيل هذه الجهة قبل إظهار شارة التوثيق." : "To protect talent and maintain trust, MLAMH verifies that you are authorized to represent this organization before displaying the verified badge."}</Text>
        </View>

        <StatusCard status={status} profile={profile} locale={locale} styles={styles} isRtl={isRtl} />

        {!approved && status !== "verified" ? <View style={styles.gateCard}>
          <View style={[styles.cardHeading, isRtl && styles.rowRtl]}><View style={styles.cardIcon}><ShieldCheck size={20} color={theme.accent} strokeWidth={1.8} /></View><Text style={[styles.gateTitle, rtlText]}>{isArabic ? "اعتماد الحساب أولًا" : "Account approval comes first"}</Text></View>
          <Text style={[styles.help, rtlText]}>{isArabic ? "التوثيق خطوة إضافية بعد مراجعة حساب الجهة واعتماده. أكمل ملف الجهة وأرسله للمراجعة أولًا." : "Verification is an additional step after organization account review. Complete your profile and submit it for approval first."}</Text>
          <Pressable accessibilityRole="button" onPress={() => router.replace("/publisher/profile")} style={styles.outlineButton}><Text style={styles.outlineText}>{isArabic ? "العودة إلى ملف الجهة" : "Back to organization profile"}</Text></Pressable>
        </View> : null}

        {approved && status !== "verified" && status !== "pending" ? <View style={styles.methodCard}>
          <View style={[styles.methodTop, isRtl && styles.rowRtl]}><View style={styles.recommended}><Text style={[styles.recommendedText, isArabic && styles.arabicText]}>{isArabic ? "موصى به" : "RECOMMENDED"}</Text></View><Text style={styles.methodNumber}>01</Text></View>
          <View style={[styles.cardHeading, isRtl && styles.rowRtl]}><View style={styles.cardIcon}><MailCheck size={20} color={theme.accent} strokeWidth={1.8} /></View><Text style={[styles.methodTitle, rtlText]}>{isArabic ? "البريد الرسمي للجهة" : "Official company email"}</Text></View>
          <Text style={[styles.help, rtlText]}>{isArabic ? "استخدم بريدًا على نطاق الجهة مثل name@company.com. لا نقبل خدمات البريد الشخصي العامة." : "Use an email on the organization domain, such as name@company.com. Public personal email services are not accepted."}</Text>
          <Text style={[styles.label, rtlText]}>{isArabic ? "البريد الرسمي" : "Official email"}</Text>
          <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} textContentType="emailAddress" returnKeyType="done" placeholder="name@company.com" placeholderTextColor={theme.muted} style={[styles.input, { textAlign: isRtl ? "right" : "left" }]} accessibilityLabel={isArabic ? "البريد الرسمي للجهة" : "Official organization email"} />
          <Pressable accessibilityRole="button" accessibilityState={{ busy: submitting, disabled: submitting }} disabled={submitting} onPress={() => void submit()} style={[styles.primaryButton, submitting && styles.disabled]}><Text style={styles.primaryText}>{submitting ? (isArabic ? "جارٍ الإرسال…" : "Submitting…") : status === "rejected" ? (isArabic ? "إعادة إرسال طلب التوثيق" : "Resubmit verification") : (isArabic ? "إرسال طلب التوثيق" : "Submit verification")}</Text></Pressable>
        </View> : null}

        {approved && status !== "verified" && status !== "pending" ? <View style={styles.futureMethods}><Text style={[styles.futureTitle, rtlText]}>{isArabic ? "طرق إضافية" : "Additional methods"}</Text><Text style={[styles.help, rtlText]}>{isArabic ? "الوثيقة الرسمية وبطاقة العمل موجودتان في خارطة التوثيق، لكنهما غير مفعّلتين حاليًا." : "Official documents and business cards are part of the verification roadmap, but are not enabled yet."}</Text></View> : null}

        {error ? <View style={styles.errorBox}><Text accessibilityRole="alert" style={[styles.error, rtlText]}>{error}</Text></View> : null}
        {success ? <View style={styles.successBox}><Text accessibilityLiveRegion="polite" style={[styles.success, rtlText]}>{success}</Text></View> : null}
        <Pressable accessibilityRole="button" onPress={() => router.replace("/publisher/profile")} style={styles.footerButton}><Text style={styles.footerButtonText}>{isArabic ? "ملف الجهة" : "Organization profile"}</Text></Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

function StatusCard({ status, profile, locale, styles, isRtl }: { status: string; profile: MobilePublisherProfile | null; locale: "ar" | "en"; styles: ReturnType<typeof createStyles>; isRtl: boolean }) {
  const isArabic = locale === "ar";
  const isVerified = status === "verified";
  const isPending = status === "pending";
  const isRejected = status === "rejected";
  const Icon = isVerified ? CheckCircle2 : isPending ? Clock3 : isRejected ? TriangleAlert : ShieldCheck;
  const title = isVerified ? (isArabic ? "جهتك موثقة" : "Organization verified") : isPending ? (isArabic ? "طلبك قيد المراجعة" : "Request under review") : isRejected ? (isArabic ? "طلب التوثيق يحتاج تحديثًا" : "Verification needs an update") : (isArabic ? "جاهز لبدء التوثيق" : "Ready to start verification");
  const body = isVerified ? (isArabic ? "تم التحقق من ارتباط حسابك بهذه الجهة، ويمكن عرض شارة التوثيق وفق سياسات ملامح." : "Your connection to this organization has been verified and the badge can be shown under MLAMH policy.") : isPending ? (isArabic ? "استلمنا إثبات ارتباطك بالجهة ويقوم فريق ملامح بمراجعته الآن." : "We received your organization proof and the MLAMH team is reviewing it.") : isRejected ? (isArabic ? "راجع سبب الرفض ثم أرسل بريدًا رسميًا صالحًا جديدًا عند الحاجة." : "Review the rejection reason, then submit a valid official email again if needed.") : (isArabic ? "اختر طريقة التوثيق المتاحة وأرسل إثبات ارتباطك بالجهة." : "Use the available verification method to prove your connection to the organization.");
  return <View style={[styles.statusCard, isVerified && styles.statusVerified, isPending && styles.statusPending, isRejected && styles.statusRejected]}>
    <View style={[styles.cardHeading, isRtl && styles.rowRtl]}><View style={styles.cardIcon}><Icon size={20} color={isRejected ? "#E59A9A" : "#C9A962"} strokeWidth={1.8} /></View><View style={styles.statusCopy}><Text style={[styles.statusKicker, isArabic && styles.arabicText, isRtl && styles.textRtl]}>{isArabic ? "الحالة" : "STATUS"}</Text><Text style={[styles.statusTitle, isRtl && styles.textRtl]}>{title}</Text></View></View>
    <Text style={[styles.help, isRtl && styles.textRtl]}>{body}</Text>
    {isRejected && profile?.verificationRejectionReason ? <View style={styles.reasonBox}><Text style={[styles.reasonLabel, isArabic && styles.arabicText, isRtl && styles.textRtl]}>{isArabic ? "سبب الرفض" : "REJECTION REASON"}</Text><Text style={[styles.reasonText, isRtl && styles.textRtl]}>{profile.verificationRejectionReason}</Text></View> : null}
  </View>;
}

function createStyles(theme: typeof darkTheme, compact: boolean) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  content: { width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: compact ? 14 : 20, paddingTop: compact ? 8 : 10, paddingBottom: compact ? 36 : 52, gap: compact ? 15 : 18 },
  rowRtl: { flexDirection: "row-reverse" },
  textRtl: { textAlign: "right", writingDirection: "rtl" },
  arabicText: { letterSpacing: 0 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 46 },
  backButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" },
  brand: { color: theme.accent, fontSize: compact ? 11 : 12, fontWeight: "900", letterSpacing: 1.2 },
  header: { gap: compact ? 6 : 8 },
  eyebrow: { color: theme.accent, fontSize: 9, fontWeight: "900", letterSpacing: 1.4 },
  title: { color: theme.text, fontSize: compact ? 27 : 31, lineHeight: compact ? 34 : 39, fontWeight: "700" },
  subtitle: { color: theme.muted, fontSize: compact ? 12 : 13, lineHeight: compact ? 19 : 21 },
  statusCard: { gap: 10, padding: compact ? 14 : 17, borderRadius: 20, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface },
  statusVerified: { borderColor: "#16A36A66", backgroundColor: "#16A36A0D" },
  statusPending: { borderColor: "#C9A96255", backgroundColor: "#C9A9620A" },
  statusRejected: { borderColor: "#C84F4F55", backgroundColor: "#C84F4F0D" },
  cardHeading: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardIcon: { width: 40, height: 40, borderRadius: 13, borderWidth: 1, borderColor: "#C9A96244", backgroundColor: "#C9A9620C", alignItems: "center", justifyContent: "center" },
  statusCopy: { flex: 1, gap: 2 },
  statusKicker: { color: theme.accent, fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  statusTitle: { color: theme.text, fontSize: compact ? 18 : 20, lineHeight: compact ? 24 : 27, fontWeight: "800" },
  help: { color: theme.muted, fontSize: compact ? 11 : 12, lineHeight: compact ? 18 : 20 },
  reasonBox: { marginTop: 2, borderRadius: 13, borderWidth: 1, borderColor: "#C84F4F44", backgroundColor: theme.background, padding: 11, gap: 4 },
  reasonLabel: { color: "#E59A9A", fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  reasonText: { color: theme.text, fontSize: 11, lineHeight: 18 },
  gateCard: { borderWidth: 1, borderColor: theme.border, borderRadius: 18, backgroundColor: theme.surface, padding: compact ? 13 : 15, gap: 10 },
  gateTitle: { flex: 1, color: theme.text, fontSize: 16, fontWeight: "800" },
  outlineButton: { minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: theme.accent, alignItems: "center", justifyContent: "center" },
  outlineText: { color: theme.accent, fontSize: 12, fontWeight: "900" },
  methodCard: { borderWidth: 1, borderColor: "#C9A96244", borderRadius: 20, backgroundColor: theme.surface, padding: compact ? 14 : 17, gap: 11 },
  methodTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  recommended: { borderRadius: 999, backgroundColor: theme.chip, paddingHorizontal: 9, paddingVertical: 5 },
  recommendedText: { color: theme.accent, fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  methodNumber: { color: theme.muted, fontSize: 11, fontWeight: "800" },
  methodTitle: { flex: 1, color: theme.text, fontSize: compact ? 17 : 19, fontWeight: "800" },
  label: { color: theme.text, fontSize: 11, fontWeight: "800", marginTop: 2 },
  input: { minHeight: 52, borderWidth: 1, borderColor: theme.border, borderRadius: 13, backgroundColor: theme.background, color: theme.text, paddingHorizontal: 14, fontSize: 14 },
  primaryButton: { minHeight: 50, borderRadius: 13, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" },
  primaryText: { color: theme.background, fontSize: 13, fontWeight: "900" },
  futureMethods: { borderWidth: 1, borderColor: theme.border, borderRadius: 17, backgroundColor: theme.surface, padding: 14, gap: 6 },
  futureTitle: { color: theme.text, fontSize: 14, fontWeight: "800" },
  errorBox: { borderWidth: 1, borderColor: "#C84F4F55", backgroundColor: "#C84F4F12", borderRadius: 12, padding: 12 },
  error: { color: "#E59A9A", fontSize: 12, lineHeight: 18 },
  successBox: { borderWidth: 1, borderColor: "#16A36A55", backgroundColor: "#16A36A10", borderRadius: 12, padding: 12 },
  success: { color: "#49C991", fontSize: 12, lineHeight: 18 },
  footerButton: { minHeight: 48, borderRadius: 13, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" },
  footerButtonText: { color: theme.text, fontSize: 12, fontWeight: "800" },
  disabled: { opacity: 0.45 },
}); }
