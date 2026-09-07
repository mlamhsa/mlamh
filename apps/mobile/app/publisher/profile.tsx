import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react-native";
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
  const { width, height } = useWindowDimensions();
  const compact = width <= 360 || height <= 700;
  const styles = useMemo(() => createStyles(theme, compact), [theme, compact]);
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;

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
  const [cityOpen, setCityOpen] = useState(false);
  const [cityQuery, setCityQuery] = useState("");
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
    setLoading(true);
    setError(null);
    const result = await getPublisherProfile();
    if (!result.ok) {
      if (result.code === "UNAUTHENTICATED") router.replace({ pathname: "/login", params: { next: "/publisher/profile" } });
      else setError(isArabic ? "تعذر تحميل ملف الناشر." : "Unable to load publisher profile.");
      setLoading(false);
      return;
    }
    hydrate(result.item);
    setLoading(false);
  }, [hydrate, isArabic]);

  useEffect(() => { void load(); }, [load]);

  async function save() {
    if (saving) return;
    if (!contactName.trim() || !publisherType || !city.trim() || (publisherType !== "individual" && !companyName.trim())) {
      setError(isArabic ? "أكمل الاسم ونوع الحساب والمدينة، واسم الجهة للحسابات المؤسسية." : "Complete the name, account type, city, and organization name for organizations.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    const result = await updatePublisherProfile({ companyName, contactName, publisherType, city, description, phone, email, website, instagram, tiktokUrl: tiktok, linkedinUrl: linkedin });
    setSaving(false);
    if (!result.ok) {
      setError(result.code === "PUBLISHER_TYPE_LOCKED" ? (isArabic ? "نوع حساب الناشر ثابت بعد إنشاء الحساب." : "Publisher account type is locked after onboarding.") : (isArabic ? "تعذر حفظ الملف. راجع البيانات وحاول مرة أخرى." : "Unable to save the profile. Review your details and try again."));
      return;
    }
    hydrate(result.item);
    setSuccess(isArabic ? "تم حفظ بيانات الناشر." : "Publisher profile saved.");
  }

  async function chooseLogo() {
    if (uploading) return;
    setError(null);
    setSuccess(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(isArabic ? "نحتاج إذن الوصول للصور لاختيار شعار الجهة." : "Photo access is required to choose an organization logo.");
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: false, quality: 1, selectionLimit: 1 });
    if (picked.canceled || !picked.assets[0]) return;
    setUploading(true);
    try {
      const asset = picked.assets[0];
      const actions = asset.width > 1600 ? [{ resize: { width: 1600 } }] : [];
      const normalized = await ImageManipulator.manipulateAsync(asset.uri, actions, { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG });
      const local = await fetch(normalized.uri);
      const buffer = await local.arrayBuffer();
      if (buffer.byteLength > 5 * 1024 * 1024) {
        setError(isArabic ? "حجم الشعار أكبر من الحد المسموح." : "The logo is larger than the allowed size.");
        return;
      }
      const result = await uploadPublisherLogoBuffer(buffer, "image/jpeg");
      if (!result.ok) {
        setError(isArabic ? "تعذر رفع الشعار. حاول مرة أخرى." : "Unable to upload the logo. Please try again.");
        return;
      }
      setProfile((current) => current ? {
        ...current,
        profileImageUrl: result.url,
        required: current.required.map((entry) => entry.key === "profile_image_url" ? { ...entry, complete: true } : entry),
        reviewReady: current.isIndividual || current.required.filter((entry) => entry.key !== "profile_image_url").every((entry) => entry.complete),
      } : current);
      setSuccess(isArabic ? "تم تحديث شعار الجهة." : "Organization logo updated.");
    } catch {
      setError(isArabic ? "تعذر تجهيز الشعار أو رفعه." : "Unable to process or upload the logo.");
    } finally {
      setUploading(false);
    }
  }

  async function submitReview() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
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
  const textAlign = isRtl ? "right" : "left";
  const publisherTypeText = publisherTypeLabel(publisherType, locale);
  const selectedCity = SAUDI_CITY_OPTIONS.find((option) => city === option.value || city === option.ar || city === option.en);
  const cityLabel = selectedCity ? (isArabic ? selectedCity.ar : selectedCity.en) : (city || (isArabic ? "اختر المدينة" : "Choose city"));
  const normalizedQuery = cityQuery.trim().toLowerCase();
  const filteredCities = SAUDI_CITY_OPTIONS.filter((option) => !normalizedQuery || `${option.ar} ${option.en}`.toLowerCase().includes(normalizedQuery));

  return <SafeAreaView style={styles.screen} edges={["top"]}>
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { direction: isRtl ? "rtl" : "ltr" }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.topRow, isRtl && styles.rowRtl]}>
          <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} style={styles.iconButton}><BackIcon size={21} color={theme.text} strokeWidth={1.9} /></Pressable>
          <Text style={[styles.brand, isArabic && styles.arabicText]}>{isArabic ? "ملامح للأعمال" : "MLAMH FOR BUSINESS"}</Text>
        </View>

        <View style={styles.header}>
          <Text accessibilityRole="header" style={[styles.title, isRtl && styles.textRtl]}>{isIndividual ? (isArabic ? "ملف الناشر" : "Publisher profile") : (isArabic ? "ملف الجهة" : "Organization profile")}</Text>
          <Text style={[styles.subtitle, isRtl && styles.textRtl]}>{isArabic ? "حدّث هويتك المهنية وبيانات التواصل. المراجعة والتوثيق حالتان منفصلتان." : "Keep your professional identity and contact details current. Profile review and verification are separate states."}</Text>
        </View>

        <View style={styles.identityCard}>
          <View style={[styles.identityRow, isRtl && styles.rowRtl]}>
            <View style={styles.logoWrap}>{profile?.profileImageUrl ? <Image accessibilityLabel={isArabic ? "شعار الجهة" : "Organization logo"} source={{ uri: profile.profileImageUrl }} style={styles.logo} /> : <View style={styles.logoFallback}><Text style={styles.logoInitial}>{(companyName || contactName || "M").slice(0, 1).toUpperCase()}</Text></View>}</View>
            <View style={styles.identityCopy}><Text style={[styles.identityName, { textAlign }, isRtl && styles.textRtl]}>{companyName || contactName || (isArabic ? "ملفك في ملامح" : "Your MLAMH profile")}</Text><Text style={[styles.identityMeta, { textAlign }, isRtl && styles.textRtl]}>{statusLabel(profile?.approvalStatus, locale)} · {profile?.verified ? (isArabic ? "موثق" : "Verified") : verificationLabel(profile?.verificationStatus, locale)}</Text></View>
          </View>
          {!isIndividual ? <Pressable disabled={uploading} style={[styles.outlineButton, uploading && styles.disabled]} onPress={() => void chooseLogo()}><Text style={styles.outlineText}>{uploading ? (isArabic ? "جارٍ رفع الشعار…" : "Uploading logo…") : (isArabic ? "تحديث شعار الجهة" : "Update organization logo")}</Text></Pressable> : null}
        </View>

        <Section title={isArabic ? "نوع الحساب" : "Account type"} styles={styles} isRtl={isRtl}>
          <View style={styles.lockedOption}><Text style={[styles.lockedOptionText, isRtl && styles.textRtl]}>{publisherTypeText}</Text><Text style={[styles.lockedHint, isRtl && styles.textRtl]}>{isArabic ? "يتم تحديده أثناء إنشاء الحساب ولا يتغير من الملف." : "Set during onboarding and not editable from the profile."}</Text></View>
        </Section>

        <Section title={isArabic ? "الهوية المهنية" : "Professional identity"} styles={styles} isRtl={isRtl}>
          {!isIndividual ? <Field label={isArabic ? "اسم الجهة" : "Organization name"} value={companyName} onChangeText={setCompanyName} align={textAlign} styles={styles} isRtl={isRtl} /> : null}
          <Field label={isIndividual ? (isArabic ? "الاسم المهني" : "Professional name") : (isArabic ? "اسم مسؤول الحساب" : "Account manager name")} value={contactName} onChangeText={setContactName} align={textAlign} styles={styles} isRtl={isRtl} />
          <View style={styles.field}><Text style={[styles.label, isRtl && styles.textRtl]}>{isArabic ? "المدينة" : "City"}</Text><Pressable onPress={() => { setCityQuery(""); setCityOpen(true); }} style={[styles.selector, isRtl && styles.rowRtl]}><Text style={[styles.selectorText, isRtl && styles.textRtl]}>{cityLabel}</Text><ChevronDown size={18} color={theme.muted} strokeWidth={1.9} /></Pressable></View>
          <Field label={isArabic ? "نبذة" : "About"} value={description} onChangeText={setDescription} align={textAlign} styles={styles} isRtl={isRtl} multiline maxLength={2000} />
        </Section>

        <Section title={isArabic ? "التواصل" : "Contact"} styles={styles} isRtl={isRtl}>
          <Field label={isArabic ? "الهاتف" : "Phone"} value={phone} onChangeText={setPhone} align={textAlign} styles={styles} isRtl={isRtl} keyboardType="phone-pad" />
          <Field label={isArabic ? "البريد الإلكتروني" : "Email"} value={email} onChangeText={setEmail} align={textAlign} styles={styles} isRtl={isRtl} keyboardType="email-address" autoCapitalize="none" />
          <Field label={isArabic ? "الموقع" : "Website"} value={website} onChangeText={setWebsite} align={textAlign} styles={styles} isRtl={isRtl} autoCapitalize="none" />
          <Field label="Instagram" value={instagram} onChangeText={setInstagram} align={textAlign} styles={styles} isRtl={isRtl} autoCapitalize="none" />
          <Field label="TikTok" value={tiktok} onChangeText={setTiktok} align={textAlign} styles={styles} isRtl={isRtl} autoCapitalize="none" />
          <Field label="LinkedIn" value={linkedin} onChangeText={setLinkedin} align={textAlign} styles={styles} isRtl={isRtl} autoCapitalize="none" />
        </Section>

        <View style={styles.readinessCard}><View style={[styles.readinessTop, isRtl && styles.rowRtl]}><View style={styles.flexOne}><Text style={[styles.eyebrow, isArabic && styles.arabicText, isRtl && styles.textRtl]}>{isArabic ? "جاهزية المراجعة" : "REVIEW READINESS"}</Text><Text style={[styles.sectionTitle, isRtl && styles.textRtl]}>{ready ? (isArabic ? "جاهز للإرسال" : "Ready to submit") : (isArabic ? "أكمل البيانات المطلوبة" : "Complete required details")}</Text></View><View style={[styles.readyBadge, ready && styles.readyBadgeActive]}>{ready ? <Check size={17} color={theme.accent} /> : <Text style={styles.readyCount}>{readiness.filter((entry) => entry.complete).length}/{readiness.length}</Text>}</View></View>{readiness.map((entry) => <View key={entry.key} style={[styles.requirementRow, isRtl && styles.rowRtl]}><Text style={entry.complete ? styles.requirementDone : styles.requirementMissing}>{entry.complete ? "✓" : "○"}</Text><Text style={[styles.requirementText, isRtl && styles.textRtl]}>{requirementLabel(entry.key, locale, isIndividual)}</Text></View>)}</View>

        {!isIndividual ? <View style={styles.verificationCard}><Text style={[styles.eyebrow, isArabic && styles.arabicText, isRtl && styles.textRtl]}>{isArabic ? "توثيق الجهة" : "ORGANIZATION VERIFICATION"}</Text><Text style={[styles.sectionTitle, isRtl && styles.textRtl]}>{profile?.verified ? (isArabic ? "الجهة موثقة" : "Organization verified") : verificationLabel(profile?.verificationStatus, locale)}</Text><Text style={[styles.help, isRtl && styles.textRtl]}>{isArabic ? "التوثيق منفصل عن اعتماد حساب الناشر ويثبت أنك مخول بتمثيل الجهة." : "Verification is separate from publisher account approval and proves that you are authorized to represent the organization."}</Text>{profile?.verificationStatus === "rejected" && profile.verificationRejectionReason ? <View style={styles.verificationReason}><Text style={[styles.verificationReasonLabel, isArabic && styles.arabicText, isRtl && styles.textRtl]}>{isArabic ? "سبب الرفض" : "REJECTION REASON"}</Text><Text style={[styles.verificationReasonText, isRtl && styles.textRtl]}>{profile.verificationRejectionReason}</Text></View> : null}{approvalApproved && !profile?.verified && !verificationPending ? <Pressable onPress={() => router.push("/publisher/verification")} style={styles.verificationButton}><Text style={styles.verificationButtonText}>{profile?.verificationStatus === "rejected" ? (isArabic ? "إعادة طلب التوثيق" : "Resubmit verification") : (isArabic ? "ابدأ توثيق الجهة" : "Start organization verification")}</Text></Pressable> : !approvalApproved && !profile?.verified ? <Text style={[styles.verificationGate, isRtl && styles.textRtl]}>{isArabic ? "يتاح التوثيق بعد اعتماد حساب الجهة." : "Verification becomes available after organization account approval."}</Text> : null}</View> : null}

        {error ? <View style={styles.errorBox}><Text accessibilityRole="alert" style={[styles.error, isRtl && styles.textRtl]}>{error}</Text></View> : null}
        {success ? <View style={styles.successBox}><Text accessibilityLiveRegion="polite" style={[styles.success, isRtl && styles.textRtl]}>{success}</Text></View> : null}
        <Pressable disabled={saving} onPress={() => void save()} style={[styles.primaryButton, saving && styles.disabled]}><Text style={styles.primaryText}>{saving ? (isArabic ? "جارٍ الحفظ…" : "Saving…") : (isArabic ? "حفظ التغييرات" : "Save changes")}</Text></Pressable>
        <Pressable disabled={submitting || approvalPending || !ready || approvalApproved} onPress={() => void submitReview()} style={[styles.submitButton, (submitting || approvalPending || !ready || approvalApproved) && styles.disabled]}><Text style={styles.submitText}>{approvalApproved ? (isArabic ? "الحساب معتمد" : "Account approved") : approvalPending ? (isArabic ? "الملف قيد المراجعة" : "Profile in review") : submitting ? (isArabic ? "جارٍ الإرسال…" : "Submitting…") : (isArabic ? "إرسال الملف للمراجعة" : "Submit profile for review")}</Text></Pressable>
      </ScrollView>

      <Modal visible={cityOpen} transparent animationType="slide" onRequestClose={() => setCityOpen(false)}>
        <View style={styles.modalBackdrop}><SafeAreaView style={styles.sheet} edges={["bottom"]}><View style={[styles.sheetHeader, isRtl && styles.rowRtl]}><View style={styles.flexOne}><Text style={[styles.sheetTitle, isRtl && styles.textRtl]}>{isArabic ? "اختر المدينة" : "Choose city"}</Text><Text style={[styles.sheetSubtitle, isRtl && styles.textRtl]}>{isArabic ? "ابحث ثم اختر مدينة واحدة." : "Search and choose one city."}</Text></View><Pressable onPress={() => setCityOpen(false)} style={styles.sheetClose}><Text style={styles.sheetCloseText}>{isArabic ? "إغلاق" : "Close"}</Text></Pressable></View><View style={[styles.searchBox, isRtl && styles.rowRtl]}><Search size={18} color={theme.muted} strokeWidth={1.9} /><TextInput value={cityQuery} onChangeText={setCityQuery} placeholder={isArabic ? "ابحث عن مدينة" : "Search city"} placeholderTextColor={theme.muted} style={[styles.searchInput, { textAlign }, isRtl && styles.textRtl]} /></View><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.cityList}>{filteredCities.map((option) => { const selected = city === option.value || city === option.ar || city === option.en; return <Pressable key={option.value} onPress={() => { setCity(option.value); setCityOpen(false); }} style={[styles.cityRow, isRtl && styles.rowRtl]}><Text style={[styles.cityText, isRtl && styles.textRtl]}>{isArabic ? option.ar : option.en}</Text>{selected ? <Check size={18} color={theme.accent} strokeWidth={2.2} /> : null}</Pressable>; })}{filteredCities.length === 0 ? <Text style={[styles.noResults, isRtl && styles.textRtl]}>{isArabic ? "لا توجد مدينة مطابقة." : "No matching city."}</Text> : null}</ScrollView></SafeAreaView></View>
      </Modal>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

function Field({ label, align, styles, isRtl, multiline, ...props }: { label: string; align: "left" | "right"; styles: ReturnType<typeof createStyles>; isRtl: boolean; multiline?: boolean } & React.ComponentProps<typeof TextInput>) {
  return <View style={styles.field}><Text style={[styles.label, isRtl && styles.textRtl]}>{label}</Text><TextInput {...props} multiline={multiline} accessibilityLabel={label} textAlign={align} textAlignVertical={multiline ? "top" : "center"} placeholderTextColor={darkTheme.muted} style={[styles.input, multiline && styles.multiline, isRtl && styles.textRtl]} /></View>;
}
function Section({ title, children, styles, isRtl }: { title: string; children: React.ReactNode; styles: ReturnType<typeof createStyles>; isRtl: boolean }) { return <View style={styles.section}><Text style={[styles.sectionTitle, isRtl && styles.textRtl]}>{title}</Text>{children}</View>; }
function statusLabel(value: string | undefined, locale: "ar" | "en") { const ar: Record<string,string> = { approved: "معتمد", pending: "قيد المراجعة", submitted: "قيد المراجعة", rejected: "يحتاج مراجعة", changes_requested: "يحتاج تعديل", not_submitted: "لم يُرسل" }; const en: Record<string,string> = { approved: "Approved", pending: "In review", submitted: "In review", rejected: "Needs review", changes_requested: "Needs changes", not_submitted: "Not submitted" }; return (locale === "ar" ? ar : en)[value ?? "not_submitted"] ?? (locale === "ar" ? "لم يُرسل" : "Not submitted"); }
function verificationLabel(value: string | null | undefined, locale: "ar" | "en") { const ar: Record<string,string> = { pending: "التوثيق قيد المراجعة", verified: "موثق", rejected: "طلب التوثيق مرفوض", unverified: "غير موثق" }; const en: Record<string,string> = { pending: "Verification in review", verified: "Verified", rejected: "Verification rejected", unverified: "Not verified" }; return (locale === "ar" ? ar : en)[value ?? "unverified"] ?? (locale === "ar" ? "غير موثق" : "Not verified"); }
function requirementLabel(key: string, locale: "ar" | "en", individual: boolean) { const labels: Record<string, { ar: string; en: string }> = { company_name: { ar: "اسم الجهة", en: "Organization name" }, contact_name: { ar: individual ? "الاسم المهني" : "اسم مسؤول الحساب", en: individual ? "Professional name" : "Account manager name" }, publisher_type: { ar: "نوع الحساب", en: "Account type" }, city: { ar: "المدينة", en: "City" }, profile_image_url: { ar: "شعار الجهة", en: "Organization logo" } }; return labels[key]?.[locale] ?? key; }
function publisherTypeLabel(value: string, locale: "ar" | "en") { const option = PUBLISHER_TYPES.find((item) => item.value === value); return option ? (locale === "ar" ? option.ar : option.en) : value; }

function createStyles(theme: typeof darkTheme, compact: boolean) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  content: { width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: compact ? 14 : 20, paddingTop: compact ? 4 : 8, paddingBottom: 60, gap: compact ? 14 : 18 },
  rowRtl: { flexDirection: "row-reverse" }, textRtl: { textAlign: "right", writingDirection: "rtl" }, arabicText: { letterSpacing: 0 }, flexOne: { flex: 1 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 46 }, iconButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }, brand: { color: theme.accent, fontSize: compact ? 11 : 12, fontWeight: "900", letterSpacing: 1.2 },
  header: { gap: 6 }, title: { color: theme.text, fontSize: compact ? 26 : 30, lineHeight: compact ? 32 : 37, fontWeight: "800" }, subtitle: { color: theme.muted, fontSize: compact ? 11 : 12, lineHeight: compact ? 18 : 20 },
  identityCard: { gap: 12, padding: compact ? 13 : 16, borderRadius: 20, borderWidth: 1, borderColor: "#C9A96233", backgroundColor: theme.surface }, identityRow: { flexDirection: "row", alignItems: "center", gap: 12 }, logoWrap: { width: compact ? 54 : 62, height: compact ? 54 : 62 }, logo: { width: "100%", height: "100%", borderRadius: 16, backgroundColor: theme.surfaceElevated }, logoFallback: { width: "100%", height: "100%", borderRadius: 16, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surfaceElevated, alignItems: "center", justifyContent: "center" }, logoInitial: { color: theme.accent, fontSize: compact ? 21 : 24, fontWeight: "800" }, identityCopy: { flex: 1, gap: 3 }, identityName: { color: theme.text, fontSize: compact ? 16 : 18, fontWeight: "800" }, identityMeta: { color: theme.muted, fontSize: 10 },
  outlineButton: { minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: theme.accent, alignItems: "center", justifyContent: "center" }, outlineText: { color: theme.accent, fontSize: 11, fontWeight: "800" },
  section: { gap: 10, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: theme.border }, sectionTitle: { color: theme.text, fontSize: compact ? 15 : 17, fontWeight: "800" }, field: { gap: 6 }, label: { color: theme.text, fontSize: 11, fontWeight: "700" }, input: { minHeight: compact ? 46 : 48, borderRadius: 12, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, color: theme.text, paddingHorizontal: 13, paddingVertical: Platform.OS === "ios" ? 12 : 10, fontSize: 13 }, multiline: { minHeight: compact ? 84 : 96 },
  selector: { minHeight: compact ? 46 : 48, borderRadius: 12, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }, selectorText: { flex: 1, color: theme.text, fontSize: 13 },
  lockedOption: { minHeight: 56, borderRadius: 16, borderWidth: 1, borderColor: "#C9A96233", backgroundColor: theme.chip, paddingHorizontal: 14, paddingVertical: 10, justifyContent: "center", gap: 3 }, lockedOptionText: { color: theme.accent, fontSize: 12, fontWeight: "800" }, lockedHint: { color: theme.grayMuted, fontSize: 9, lineHeight: 14 },
  readinessCard: { gap: 10, padding: compact ? 13 : 16, borderWidth: 1, borderColor: theme.border, borderRadius: 18, backgroundColor: theme.surface }, readinessTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }, eyebrow: { color: theme.accent, fontSize: 9, fontWeight: "900", letterSpacing: 1.3 }, readyBadge: { minWidth: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" }, readyBadgeActive: { borderColor: theme.accent }, readyCount: { color: theme.muted, fontSize: 10, fontWeight: "900" }, requirementRow: { flexDirection: "row", alignItems: "center", gap: 9, minHeight: 32 }, requirementDone: { color: theme.accent, width: 16 }, requirementMissing: { color: theme.muted, width: 16 }, requirementText: { flex: 1, color: theme.text, fontSize: 11 },
  verificationCard: { gap: 9, padding: compact ? 13 : 16, borderWidth: 1, borderColor: "#C9A96233", borderRadius: 18, backgroundColor: theme.surface }, help: { color: theme.muted, fontSize: 11, lineHeight: 18 }, verificationButton: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: theme.accent, backgroundColor: theme.chip, alignItems: "center", justifyContent: "center", marginTop: 3 }, verificationButtonText: { color: theme.accent, fontSize: 11, fontWeight: "900" }, verificationGate: { color: theme.grayMuted, fontSize: 10, lineHeight: 17 }, verificationReason: { borderWidth: 1, borderColor: "#C84F4F44", backgroundColor: theme.background, borderRadius: 12, padding: 11, gap: 5 }, verificationReasonLabel: { color: "#E59A9A", fontSize: 8, fontWeight: "900", letterSpacing: 1 }, verificationReasonText: { color: theme.text, fontSize: 11, lineHeight: 18 },
  errorBox: { borderWidth: 1, borderColor: "#C84F4F66", backgroundColor: "#C84F4F14", borderRadius: 12, padding: 12 }, error: { color: "#E59A9A", fontSize: 12, lineHeight: 18 }, successBox: { borderWidth: 1, borderColor: "#16A36A55", backgroundColor: "#16A36A10", borderRadius: 12, padding: 12 }, success: { color: "#49C991", fontSize: 12, lineHeight: 18 }, primaryButton: { minHeight: 52, borderRadius: 13, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" }, primaryText: { color: theme.background, fontSize: 13, fontWeight: "900" }, submitButton: { minHeight: 50, borderRadius: 13, borderWidth: 1, borderColor: theme.accent, alignItems: "center", justifyContent: "center" }, submitText: { color: theme.accent, fontSize: 12, fontWeight: "900" }, disabled: { opacity: 0.45 },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "#00000088" }, sheet: { maxHeight: "68%", backgroundColor: theme.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 16, paddingTop: 16 }, sheetHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 }, sheetTitle: { color: theme.text, fontSize: 19, fontWeight: "800" }, sheetSubtitle: { color: theme.muted, fontSize: 10, marginTop: 3 }, sheetClose: { minHeight: 38, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" }, sheetCloseText: { color: theme.text, fontSize: 11, fontWeight: "800" }, searchBox: { minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 9 }, searchInput: { flex: 1, color: theme.text, fontSize: 13, paddingVertical: 11 }, cityList: { paddingVertical: 8, paddingBottom: 22 }, cityRow: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, borderBottomWidth: 1, borderBottomColor: theme.border }, cityText: { flex: 1, color: theme.text, fontSize: 13 }, noResults: { color: theme.muted, fontSize: 12, paddingVertical: 24 },
}); }
