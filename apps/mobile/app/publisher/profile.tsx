import { useCallback, useEffect, useMemo, useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

import { ScreenSkeleton } from "@/components/ScreenSkeleton";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import {
  getPublisherProfile,
  submitPublisherProfileForReview,
  updatePublisherProfile,
  uploadPublisherLogoBuffer,
  type MobilePublisherProfile,
} from "@/lib/publisher-api";
import { SAUDI_CITY_OPTIONS, type MobileOption } from "@/lib/profile-options";
import { darkTheme } from "@/lib/theme";

const PUBLISHER_TYPES: MobileOption[] = [
  { value: "production_company", ar: "شركة إنتاج", en: "Production company" },
  { value: "advertising_agency", ar: "وكالة إعلانية", en: "Advertising agency" },
  { value: "casting_agency", ar: "وكالة كاستينغ", en: "Casting agency" },
  { value: "talent_agency", ar: "وكالة مواهب", en: "Talent agency" },
  { value: "brand", ar: "علامة تجارية", en: "Brand" },
  { value: "content_company", ar: "شركة محتوى", en: "Content company" },
  { value: "individual", ar: "فرد / مستقل", en: "Individual / freelancer" },
  { value: "other", ar: "أخرى", en: "Other" },
];

export default function PublisherProfileScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [profile, setProfile] = useState<MobilePublisherProfile | null>(null);
  const [publisherType, setPublisherType] = useState("individual");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const hydrate = useCallback((item: MobilePublisherProfile) => {
    setProfile(item);
    setPublisherType(item.publisherType ?? "individual");
    setCompanyName(item.companyName ?? "");
    setContactName(item.contactName ?? "");
    setCity(item.city ?? "");
    setDescription(item.description ?? "");
    setPhone(item.phone ?? "");
    setEmail(item.email ?? "");
    setWebsite(item.website ?? "");
    setInstagram(item.instagram ?? "");
    setTiktok(item.tiktokUrl ?? "");
    setLinkedin(item.linkedinUrl ?? "");
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const result = await getPublisherProfile();
    if (!result.ok) {
      if (result.code === "UNAUTHENTICATED") router.replace({ pathname: "/login", params: { next: "/publisher/profile" } });
      else setError(isArabic ? "تعذر تحميل ملف الناشر." : "Unable to load publisher profile.");
      setLoading(false); return;
    }
    hydrate(result.item); setLoading(false);
  }, [hydrate, isArabic]);

  useEffect(() => { void load(); }, [load]);

  async function save() {
    if (saving) return;
    if (!contactName.trim() || !publisherType || !city.trim() || (publisherType !== "individual" && !companyName.trim())) {
      setError(isArabic ? "أكمل الاسم ونوع الحساب والمدينة، واسم الجهة للحسابات المؤسسية." : "Complete the name, account type, city, and organization name for organizations.");
      return;
    }
    setSaving(true); setError(null); setSuccess(null);
    const result = await updatePublisherProfile({
      companyName, contactName, publisherType, city, description, phone, email, website, instagram, tiktokUrl: tiktok, linkedinUrl: linkedin,
    });
    setSaving(false);
    if (!result.ok) { setError(isArabic ? "تعذر حفظ الملف. راجع البيانات وحاول مرة أخرى." : "Unable to save the profile. Review your details and try again."); return; }
    hydrate(result.item);
    setSuccess(isArabic ? "تم حفظ بيانات الناشر." : "Publisher profile saved.");
  }

  async function chooseLogo() {
    if (uploading) return;
    setError(null); setSuccess(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { setError(isArabic ? "نحتاج إذن الوصول للصور لاختيار شعار الجهة." : "Photo access is required to choose an organization logo."); return; }
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: false, quality: 1, selectionLimit: 1 });
    if (picked.canceled || !picked.assets[0]) return;
    setUploading(true);
    try {
      const asset = picked.assets[0];
      const actions = asset.width > 1600 ? [{ resize: { width: 1600 } }] : [];
      const normalized = await ImageManipulator.manipulateAsync(asset.uri, actions, { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG });
      const local = await fetch(normalized.uri);
      const buffer = await local.arrayBuffer();
      if (buffer.byteLength > 5 * 1024 * 1024) { setError(isArabic ? "حجم الشعار أكبر من الحد المسموح." : "The logo is larger than the allowed size."); return; }
      const result = await uploadPublisherLogoBuffer(buffer, "image/jpeg");
      if (!result.ok) { setError(isArabic ? "تعذر رفع الشعار. حاول مرة أخرى." : "Unable to upload the logo. Please try again."); return; }
      setProfile((current) => current ? { ...current, profileImageUrl: result.url, required: current.required.map((entry) => entry.key === "profile_image_url" ? { ...entry, complete: true } : entry), reviewReady: current.isIndividual || current.required.filter((entry) => entry.key !== "profile_image_url").every((entry) => entry.complete) } : current);
      setSuccess(isArabic ? "تم تحديث شعار الجهة." : "Organization logo updated.");
    } catch { setError(isArabic ? "تعذر تجهيز الشعار أو رفعه." : "Unable to process or upload the logo."); }
    finally { setUploading(false); }
  }

  async function submitReview() {
    if (submitting) return;
    setSubmitting(true); setError(null); setSuccess(null);
    const result = await submitPublisherProfileForReview();
    setSubmitting(false);
    if (!result.ok) {
      setError(result.code === "PROFILE_INCOMPLETE" ? (isArabic ? "أكمل متطلبات الجاهزية قبل إرسال الملف للمراجعة." : "Complete the readiness requirements before submitting for review.") : (isArabic ? "تعذر إرسال الملف للمراجعة." : "Unable to submit the profile for review."));
      return;
    }
    setProfile((current) => current ? { ...current, approvalStatus: result.approvalStatus } : current);
    setSuccess(isArabic ? "تم إرسال ملفك لفريق ملامح للمراجعة." : "Your profile was submitted to the MLAMH team for review.");
  }

  if (loading) return <ScreenSkeleton variant="profile" locale={locale} label={isArabic ? "تحميل ملف الناشر" : "Loading publisher profile"} />;

  const isIndividual = publisherType === "individual";
  const readiness = profile?.required ?? [];
  const ready = readiness.every((entry) => entry.complete);
  const approvalPending = profile?.approvalStatus === "pending" || profile?.approvalStatus === "submitted";
  const approvalApproved = profile?.approvalStatus === "approved";
  const verificationPending = profile?.verificationStatus === "pending";
  const align = isRtl ? "right" : "left";

  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { direction: isRtl ? "rtl" : "ltr" }]}>
      <View style={[styles.topRow, isRtl && styles.rowRtl]}><Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={12}><Text style={styles.back}>{isRtl ? "›" : "‹"}</Text></Pressable><Text style={styles.brand}>{isArabic ? "ملامح للأعمال" : "MLAMH FOR BUSINESS"}</Text></View>
      <View style={styles.header}><Text accessibilityRole="header" style={[styles.title, { textAlign: align }]}>{isIndividual ? (isArabic ? "ملف الناشر" : "Publisher profile") : (isArabic ? "ملف الجهة" : "Organization profile")}</Text><Text style={[styles.subtitle, { textAlign: align }]}>{isArabic ? "حدّث هويتك المهنية وبيانات التواصل. المراجعة والتحقق حالتان منفصلتان." : "Keep your professional identity and contact details current. Profile review and verification are separate states."}</Text></View>

      <View style={styles.identityCard}>
        <View style={[styles.identityRow, isRtl && styles.rowRtl]}><View style={styles.logoWrap}>{profile?.profileImageUrl ? <Image source={{ uri: profile.profileImageUrl }} style={styles.logo} /> : <View style={styles.logoFallback}><Text style={styles.logoInitial}>{(companyName || contactName || "M").slice(0, 1).toUpperCase()}</Text></View>}</View><View style={styles.identityCopy}><Text style={[styles.identityName, { textAlign: align }]}>{companyName || contactName || (isArabic ? "ملفك في ملامح" : "Your MLAMH profile")}</Text><Text style={[styles.identityMeta, { textAlign: align }]}>{statusLabel(profile?.approvalStatus, locale)} · {profile?.verified ? (isArabic ? "موثق" : "Verified") : verificationLabel(profile?.verificationStatus, locale)}</Text></View></View>
        {!isIndividual ? <Pressable disabled={uploading} style={[styles.outlineButton, uploading && styles.disabled]} onPress={() => void chooseLogo()}><Text style={styles.outlineText}>{uploading ? (isArabic ? "جارٍ رفع الشعار…" : "Uploading logo…") : (isArabic ? "تحديث شعار الجهة" : "Update organization logo")}</Text></Pressable> : null}
      </View>

      <Section title={isArabic ? "نوع الحساب" : "Account type"} styles={styles}><View style={styles.options}>{PUBLISHER_TYPES.map((option) => <Pressable accessibilityRole="button" accessibilityState={{ selected: publisherType === option.value }} key={option.value} onPress={() => setPublisherType(option.value)} style={[styles.option, publisherType === option.value && styles.optionActive]}><Text style={[styles.optionText, publisherType === option.value && styles.optionTextActive]}>{locale === "ar" ? option.ar : option.en}</Text></Pressable>)}</View></Section>

      <Section title={isArabic ? "الهوية المهنية" : "Professional identity"} styles={styles}>
        {!isIndividual ? <Field label={isArabic ? "اسم الجهة" : "Organization name"} value={companyName} onChangeText={setCompanyName} align={align} styles={styles} /> : null}
        <Field label={isIndividual ? (isArabic ? "الاسم المهني" : "Professional name") : (isArabic ? "اسم مسؤول الحساب" : "Account manager name")} value={contactName} onChangeText={setContactName} align={align} styles={styles} />
        <Text style={styles.label}>{isArabic ? "المدينة" : "City"}</Text><View style={styles.options}>{SAUDI_CITY_OPTIONS.map((option) => <Pressable key={option.value} onPress={() => setCity(option.ar)} style={[styles.option, city === option.ar && styles.optionActive]}><Text style={[styles.optionText, city === option.ar && styles.optionTextActive]}>{locale === "ar" ? option.ar : option.en}</Text></Pressable>)}</View>
        <Field label={isArabic ? "نبذة" : "About"} value={description} onChangeText={setDescription} align={align} styles={styles} multiline maxLength={2000} />
      </Section>

      <Section title={isArabic ? "التواصل" : "Contact"} styles={styles}>
        <Field label={isArabic ? "الهاتف" : "Phone"} value={phone} onChangeText={setPhone} align={align} styles={styles} keyboardType="phone-pad" />
        <Field label={isArabic ? "البريد الإلكتروني" : "Email"} value={email} onChangeText={setEmail} align={align} styles={styles} keyboardType="email-address" autoCapitalize="none" />
        <Field label={isArabic ? "الموقع" : "Website"} value={website} onChangeText={setWebsite} align={align} styles={styles} autoCapitalize="none" />
        <Field label="Instagram" value={instagram} onChangeText={setInstagram} align={align} styles={styles} autoCapitalize="none" />
        <Field label="TikTok" value={tiktok} onChangeText={setTiktok} align={align} styles={styles} autoCapitalize="none" />
        <Field label="LinkedIn" value={linkedin} onChangeText={setLinkedin} align={align} styles={styles} autoCapitalize="none" />
      </Section>

      <View style={styles.readinessCard}><View style={[styles.readinessTop, isRtl && styles.rowRtl]}><View><Text style={styles.eyebrow}>{isArabic ? "جاهزية المراجعة" : "REVIEW READINESS"}</Text><Text style={styles.sectionTitle}>{ready ? (isArabic ? "جاهز للإرسال" : "Ready to submit") : (isArabic ? "أكمل البيانات المطلوبة" : "Complete required details")}</Text></View><Text style={[styles.readyBadge, ready && styles.readyBadgeActive]}>{ready ? "✓" : `${readiness.filter((entry) => entry.complete).length}/${readiness.length}`}</Text></View>{readiness.map((entry) => <View key={entry.key} style={[styles.requirementRow, isRtl && styles.rowRtl]}><Text style={entry.complete ? styles.requirementDone : styles.requirementMissing}>{entry.complete ? "✓" : "○"}</Text><Text style={styles.requirementText}>{requirementLabel(entry.key, locale, isIndividual)}</Text></View>)}</View>

      {!isIndividual ? <View style={styles.verificationCard}><Text style={styles.eyebrow}>{isArabic ? "توثيق الجهة" : "ORGANIZATION VERIFICATION"}</Text><Text style={styles.sectionTitle}>{profile?.verified ? (isArabic ? "الجهة موثقة" : "Organization verified") : verificationLabel(profile?.verificationStatus, locale)}</Text><Text style={styles.help}>{isArabic ? "التوثيق منفصل عن اعتماد حساب الناشر ويثبت أنك مخول بتمثيل الجهة. لن تظهر شارة التوثيق قبل اعتماد الطلب." : "Verification is separate from publisher account approval and proves that you are authorized to represent the organization. The badge is never shown before approval."}</Text>{profile?.verificationStatus === "rejected" && profile.verificationRejectionReason ? <View style={styles.verificationReason}><Text style={styles.verificationReasonLabel}>{isArabic ? "سبب الرفض" : "REJECTION REASON"}</Text><Text style={styles.verificationReasonText}>{profile.verificationRejectionReason}</Text></View> : null}{approvalApproved && !profile?.verified && !verificationPending ? <Pressable accessibilityRole="button" onPress={() => router.push("/publisher/verification")} style={styles.verificationButton}><Text style={styles.verificationButtonText}>{profile?.verificationStatus === "rejected" ? (isArabic ? "إعادة طلب التوثيق" : "Resubmit verification") : (isArabic ? "ابدأ توثيق الجهة" : "Start organization verification")}</Text></Pressable> : !approvalApproved && !profile?.verified ? <Text style={styles.verificationGate}>{isArabic ? "يتاح التوثيق بعد اعتماد حساب الجهة." : "Verification becomes available after organization account approval."}</Text> : null}</View> : null}

      {error ? <View style={styles.errorBox}><Text accessibilityRole="alert" style={styles.error}>{error}</Text></View> : null}
      {success ? <View style={styles.successBox}><Text accessibilityLiveRegion="polite" style={styles.success}>{success}</Text></View> : null}
      <Pressable accessibilityRole="button" accessibilityState={{ busy: saving, disabled: saving }} disabled={saving} onPress={() => void save()} style={[styles.primaryButton, saving && styles.disabled]}><Text style={styles.primaryText}>{saving ? (isArabic ? "جارٍ الحفظ…" : "Saving…") : (isArabic ? "حفظ التغييرات" : "Save changes")}</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityState={{ busy: submitting, disabled: submitting || approvalPending || !ready || approvalApproved }} disabled={submitting || approvalPending || !ready || approvalApproved} onPress={() => void submitReview()} style={[styles.submitButton, (submitting || approvalPending || !ready || approvalApproved) && styles.disabled]}><Text style={styles.submitText}>{approvalApproved ? (isArabic ? "الحساب معتمد" : "Account approved") : approvalPending ? (isArabic ? "الملف قيد المراجعة" : "Profile in review") : submitting ? (isArabic ? "جارٍ الإرسال…" : "Submitting…") : (isArabic ? "إرسال الملف للمراجعة" : "Submit profile for review")}</Text></Pressable>
    </ScrollView>
  </KeyboardAvoidingView>;
}

function Field({ label, align, styles, multiline, ...props }: { label: string; align: "left" | "right"; styles: ReturnType<typeof createStyles>; multiline?: boolean } & React.ComponentProps<typeof TextInput>) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...props} multiline={multiline} textAlign={align} textAlignVertical={multiline ? "top" : "center"} placeholderTextColor={darkTheme.muted} style={[styles.input, multiline && styles.multiline]} /></View>; }
function Section({ title, children, styles }: { title: string; children: React.ReactNode; styles: ReturnType<typeof createStyles> }) { return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>; }
function statusLabel(value: string | undefined, locale: "ar" | "en") { const ar: Record<string,string> = { approved: "معتمد", pending: "قيد المراجعة", submitted: "قيد المراجعة", rejected: "يحتاج مراجعة", changes_requested: "يحتاج تعديل", not_submitted: "لم يُرسل" }; const en: Record<string,string> = { approved: "Approved", pending: "In review", submitted: "In review", rejected: "Needs review", changes_requested: "Needs changes", not_submitted: "Not submitted" }; return (locale === "ar" ? ar : en)[value ?? "not_submitted"] ?? (locale === "ar" ? "لم يُرسل" : "Not submitted"); }
function verificationLabel(value: string | null | undefined, locale: "ar" | "en") { const ar: Record<string,string> = { pending: "التوثيق قيد المراجعة", verified: "موثق", rejected: "طلب التوثيق مرفوض", unverified: "غير موثق" }; const en: Record<string,string> = { pending: "Verification in review", verified: "Verified", rejected: "Verification rejected", unverified: "Not verified" }; return (locale === "ar" ? ar : en)[value ?? "unverified"] ?? (locale === "ar" ? "غير موثق" : "Not verified"); }
function requirementLabel(key: string, locale: "ar" | "en", individual: boolean) { const labels: Record<string, { ar: string; en: string }> = { company_name: { ar: "اسم الجهة", en: "Organization name" }, contact_name: { ar: individual ? "الاسم المهني" : "اسم مسؤول الحساب", en: individual ? "Professional name" : "Account manager name" }, publisher_type: { ar: "نوع الحساب", en: "Account type" }, city: { ar: "المدينة", en: "City" }, profile_image_url: { ar: "شعار الجهة", en: "Organization logo" } }; return labels[key]?.[locale] ?? key; }

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, content: { width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: 20, paddingTop: 34, paddingBottom: 60, gap: 20 }, rowRtl: { flexDirection: "row-reverse" }, topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, back: { color: theme.text, fontSize: 30 }, brand: { color: theme.accent, fontSize: 12, fontWeight: "900", letterSpacing: 1.2 }, header: { gap: 7 }, title: { color: theme.text, fontSize: 31, lineHeight: 39, fontWeight: "700" }, subtitle: { color: theme.muted, fontSize: 13, lineHeight: 21 }, identityCard: { gap: 14, padding: 16, borderRadius: 22, borderWidth: 1, borderColor: "#C9A96233", backgroundColor: theme.surface }, identityRow: { flexDirection: "row", alignItems: "center", gap: 12 }, logoWrap: { width: 62, height: 62 }, logo: { width: 62, height: 62, borderRadius: 17, backgroundColor: theme.surfaceElevated }, logoFallback: { width: 62, height: 62, borderRadius: 17, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surfaceElevated, alignItems: "center", justifyContent: "center" }, logoInitial: { color: theme.accent, fontSize: 24, fontWeight: "800" }, identityCopy: { flex: 1, gap: 4 }, identityName: { color: theme.text, fontSize: 18, fontWeight: "800" }, identityMeta: { color: theme.muted, fontSize: 10 }, outlineButton: { minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: theme.accent, alignItems: "center", justifyContent: "center" }, outlineText: { color: theme.accent, fontSize: 11, fontWeight: "800" }, section: { gap: 10, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: theme.border }, sectionTitle: { color: theme.text, fontSize: 17, fontWeight: "800" }, field: { gap: 6 }, label: { color: theme.text, fontSize: 11, fontWeight: "700" }, input: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, color: theme.text, paddingHorizontal: 13, paddingVertical: Platform.OS === "ios" ? 13 : 10, fontSize: 13 }, multiline: { minHeight: 96 }, options: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, option: { minHeight: 38, borderRadius: 999, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, justifyContent: "center", paddingHorizontal: 11, paddingVertical: 7 }, optionActive: { borderColor: theme.accent, backgroundColor: theme.chip }, optionText: { color: theme.muted, fontSize: 10, fontWeight: "700" }, optionTextActive: { color: theme.accent }, readinessCard: { gap: 10, padding: 16, borderWidth: 1, borderColor: theme.border, borderRadius: 18, backgroundColor: theme.surface }, readinessTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }, eyebrow: { color: theme.accent, fontSize: 9, fontWeight: "900", letterSpacing: 1.3 }, readyBadge: { minWidth: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: theme.border, color: theme.muted, textAlign: "center", textAlignVertical: "center", lineHeight: 32, fontSize: 10, fontWeight: "900" }, readyBadgeActive: { color: theme.accent, borderColor: theme.accent }, requirementRow: { flexDirection: "row", alignItems: "center", gap: 9, minHeight: 32 }, requirementDone: { color: theme.accent, width: 16 }, requirementMissing: { color: theme.muted, width: 16 }, requirementText: { color: theme.text, fontSize: 11 }, verificationCard: { gap: 9, padding: 16, borderWidth: 1, borderColor: "#C9A96233", borderRadius: 18, backgroundColor: theme.surface }, help: { color: theme.muted, fontSize: 11, lineHeight: 18 }, verificationButton: { minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: theme.accent, backgroundColor: theme.chip, alignItems: "center", justifyContent: "center", marginTop: 3 }, verificationButtonText: { color: theme.accent, fontSize: 11, fontWeight: "900" }, verificationGate: { color: theme.grayMuted, fontSize: 10, lineHeight: 17 }, verificationReason: { borderWidth: 1, borderColor: "#C84F4F44", backgroundColor: theme.background, borderRadius: 12, padding: 11, gap: 5 }, verificationReasonLabel: { color: "#E59A9A", fontSize: 8, fontWeight: "900", letterSpacing: 1 }, verificationReasonText: { color: theme.text, fontSize: 11, lineHeight: 18 }, errorBox: { borderWidth: 1, borderColor: "#C84F4F66", backgroundColor: "#C84F4F14", borderRadius: 12, padding: 12 }, error: { color: "#E59A9A", fontSize: 12, lineHeight: 18 }, successBox: { borderWidth: 1, borderColor: "#16A36A55", backgroundColor: "#16A36A10", borderRadius: 12, padding: 12 }, success: { color: "#49C991", fontSize: 12, lineHeight: 18 }, primaryButton: { minHeight: 52, borderRadius: 13, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" }, primaryText: { color: theme.background, fontSize: 13, fontWeight: "900" }, submitButton: { minHeight: 50, borderRadius: 13, borderWidth: 1, borderColor: theme.accent, alignItems: "center", justifyContent: "center" }, submitText: { color: theme.accent, fontSize: 12, fontWeight: "900" }, disabled: { opacity: 0.45 },
}); }
