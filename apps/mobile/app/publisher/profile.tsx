import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Search, Settings } from "lucide-react-native";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

import { ScreenSkeleton } from "@/components/ScreenSkeleton";
import { isRtlLocale, textAlign } from "@/lib/i18n";
import { useAppLocale } from "@/lib/locale-context";
import { leaveAuthenticatedScreen } from "@/lib/navigation";
import { getCanonicalProfileOptions, type CanonicalMobileOption } from "@/lib/profile-options-api";
import {
  getPublisherProfile,
  submitPublisherProfileForReview,
  updatePublisherProfile,
  uploadPublisherLogoBuffer,
  type MobilePublisherProfile,
} from "@/lib/publisher-api";
import { supabase } from "@/lib/supabase";
import { darkTheme } from "@/lib/theme";

const PUBLISHER_TYPES: Record<string, { ar: string; en: string }> = {
  production_company: { ar: "شركة إنتاج", en: "Production company" },
  advertising_agency: { ar: "وكالة إعلانية", en: "Advertising agency" },
  casting_agency: { ar: "وكالة كاستينغ", en: "Casting agency" },
  talent_agency: { ar: "وكالة مواهب", en: "Talent agency" },
  brand: { ar: "علامة تجارية", en: "Brand" },
  content_company: { ar: "شركة محتوى", en: "Content company" },
  individual: { ar: "فرد / مستقل", en: "Individual / freelancer" },
  other: { ar: "أخرى", en: "Other" },
};

type UploadPhase = "idle" | "preparing" | "uploading" | "finalizing";

export default function PublisherProfileScreen() {
  const { locale } = useAppLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const align = textAlign(locale);
  const styles = useMemo(() => createStyles(), []);
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;

  const [profile, setProfile] = useState<MobilePublisherProfile | null>(null);
  const [cities, setCities] = useState<CanonicalMobileOption[]>([]);
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
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>("idle");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const hydrate = useCallback((item: MobilePublisherProfile, authEmail?: string | null) => {
    setProfile(item);
    setPublisherType(item.publisherType ?? "individual");
    setCompanyName(item.companyName ?? "");
    setContactName(item.contactName ?? "");
    setCity(item.city ?? "");
    setDescription(item.description ?? "");
    setPhone(item.phone ?? "");
    setEmail(item.email ?? authEmail ?? "");
    setWebsite(item.website ?? "");
    setInstagram(item.instagram ?? "");
    setTiktok(item.tiktokUrl ?? "");
    setLinkedin(item.linkedinUrl ?? "");
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [result, options, auth] = await Promise.all([
      getPublisherProfile(),
      getCanonicalProfileOptions(),
      supabase.auth.getUser().catch(() => ({ data: { user: null } })),
    ]);
    setCities(options.cities);
    if (!result.ok) {
      if (result.code === "UNAUTHENTICATED") router.replace({ pathname: "/login", params: { next: "/publisher/profile" } });
      else setError(isArabic ? "تعذر تحميل ملف الجهة." : "Unable to load the organization profile.");
      setLoading(false);
      return;
    }
    hydrate(result.item, auth.data.user?.email ?? null);
    setLoading(false);
  }, [hydrate, isArabic]);

  useEffect(() => { void load(); }, [load]);

  async function save() {
    if (saving) return;
    if (!contactName.trim() || !publisherType || !city.trim() || (publisherType !== "individual" && !companyName.trim())) {
      setError(isArabic ? "أكمل البيانات المطلوبة قبل الحفظ." : "Complete the required fields before saving.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    const result = await updatePublisherProfile({
      companyName: companyName.trim(), contactName: contactName.trim(), publisherType, city,
      description: description.trim(), phone: phone.trim(), email: email.trim(), website: website.trim(),
      instagram: instagram.trim(), tiktokUrl: tiktok.trim(), linkedinUrl: linkedin.trim(),
    });
    setSaving(false);
    if (!result.ok) {
      setError(isArabic ? "تعذر حفظ البيانات. راجع الحقول وحاول مرة أخرى." : "Unable to save. Review the fields and try again.");
      return;
    }
    hydrate(result.item, email);
    setSuccess(isArabic ? "تم حفظ بيانات الجهة." : "Organization profile saved.");
  }

  async function chooseLogo() {
    if (uploadPhase !== "idle") return;
    setError(null); setSuccess(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(isArabic ? "نحتاج إذن الوصول للصور لاختيار شعار الجهة." : "Photo access is required to choose an organization logo.");
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], selectionLimit: 1, quality: 1 });
    if (picked.canceled || !picked.assets[0]) return;
    try {
      setUploadPhase("preparing");
      const asset = picked.assets[0];
      const normalized = await ImageManipulator.manipulateAsync(
        asset.uri,
        asset.width > 1600 ? [{ resize: { width: 1600 } }] : [],
        { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG },
      );
      const local = await fetch(normalized.uri);
      const buffer = await local.arrayBuffer();
      if (buffer.byteLength > 5 * 1024 * 1024) throw new Error("FILE_TOO_LARGE");
      setUploadPhase("uploading");
      const result = await uploadPublisherLogoBuffer(buffer, "image/jpeg");
      if (!result.ok) throw new Error(result.code);
      setUploadPhase("finalizing");
      setProfile((current) => current ? { ...current, profileImageUrl: result.url } : current);
      setSuccess(isArabic ? "تم تحديث شعار الجهة." : "Organization logo updated.");
    } catch (cause) {
      setError(cause instanceof Error && cause.message === "FILE_TOO_LARGE"
        ? (isArabic ? "حجم الشعار أكبر من الحد المسموح." : "The logo is larger than the allowed size.")
        : (isArabic ? "تعذر تجهيز الشعار أو رفعه. حاول مرة أخرى." : "Unable to process or upload the logo. Try again."));
    } finally { setUploadPhase("idle"); }
  }

  async function submitReview() {
    if (submitting || !profile?.reviewReady) return;
    setSubmitting(true); setError(null); setSuccess(null);
    const result = await submitPublisherProfileForReview();
    setSubmitting(false);
    if (!result.ok) {
      setError(isArabic ? "تعذر إرسال الملف للمراجعة." : "Unable to submit the profile for review.");
      return;
    }
    setProfile((current) => current ? { ...current, approvalStatus: result.approvalStatus } : current);
    setSuccess(isArabic ? "تم إرسال الملف للمراجعة." : "Profile submitted for review.");
  }

  if (loading) return <ScreenSkeleton variant="profile" locale={locale} label={isArabic ? "جارٍ تحميل ملف الجهة" : "Loading organization profile"} />;

  const isIndividual = publisherType === "individual";
  const displayName = isIndividual ? contactName : companyName;
  const selectedCity = cities.find((option) => [option.value, option.ar, option.en].includes(city));
  const cityLabel = selectedCity ? selectedCity[locale] : city;
  const query = cityQuery.trim().toLowerCase();
  const filteredCities = cities.filter((option) => !query || `${option.ar} ${option.en} ${option.value}`.toLowerCase().includes(query));
  const readyItems = profile?.required ?? [];
  const approvalLocked = ["submitted", "pending", "approved"].includes(profile?.approvalStatus ?? "");
  const uploadLabel = uploadPhase === "preparing" ? (isArabic ? "جارٍ تجهيز الشعار…" : "Preparing logo…")
    : uploadPhase === "uploading" ? (isArabic ? "جارٍ رفع الشعار…" : "Uploading logo…")
      : uploadPhase === "finalizing" ? (isArabic ? "جارٍ إنهاء التحديث…" : "Finalizing…")
        : (isArabic ? "تحديث شعار الجهة" : "Update organization logo");

  return <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.topRow, isRtl && styles.rowRtl]}>
          <Pressable onPress={() => leaveAuthenticatedScreen("/publisher")} style={styles.iconButton}><BackIcon size={21} color={darkTheme.text} /></Pressable>
          <Text style={[styles.brand, { textAlign: align }]}>{isArabic ? "ملامح للأعمال" : "MLAMH FOR BUSINESS"}</Text>
          <Pressable accessibilityLabel={isArabic ? "الإعدادات" : "Settings"} onPress={() => router.push("/publisher/settings")} style={styles.iconButton}><Settings size={20} color={darkTheme.text} /></Pressable>
        </View>

        <View style={[styles.header, { alignItems: isRtl ? "flex-end" : "flex-start" }]}>
          <Text style={[styles.title, rtlText(isRtl)]}>{isIndividual ? (isArabic ? "ملف الناشر" : "Publisher profile") : (isArabic ? "ملف الجهة" : "Organization profile")}</Text>
          <Text style={[styles.subtitle, rtlText(isRtl)]}>{isArabic ? "هوية مهنية واضحة، بيانات تواصل مضبوطة، وحالة مراجعة مفهومة." : "A clear professional identity, controlled contact details and transparent review status."}</Text>
        </View>

        <View style={styles.card}>
          <View style={[styles.identityRow, isRtl && styles.rowRtl]}>
            {profile?.profileImageUrl ? <Image source={{ uri: profile.profileImageUrl }} style={styles.logo} /> : <View style={styles.logoFallback}><Text style={styles.logoInitial}>{(displayName || "M").slice(0, 1).toUpperCase()}</Text></View>}
            <View style={styles.identityCopy}>
              <Text numberOfLines={2} style={[styles.identityName, rtlText(isRtl)]}>{displayName || (isArabic ? "أكمل هوية حسابك" : "Complete your account identity")}</Text>
              {!isIndividual ? <Text style={[styles.contactPerson, rtlText(isRtl)]}>{contactName ? `${isArabic ? "مسؤول الحساب" : "Account manager"}: ${contactName}` : ""}</Text> : null}
              <Text style={[styles.meta, rtlText(isRtl)]}>{publisherTypeLabel(publisherType, locale)}{cityLabel ? ` · ${cityLabel}` : ""}</Text>
            </View>
          </View>
          {!isIndividual ? <Pressable disabled={uploadPhase !== "idle"} onPress={() => void chooseLogo()} style={[styles.secondaryButton, uploadPhase !== "idle" && styles.disabled]}>{uploadPhase !== "idle" ? <ActivityIndicator size="small" color={darkTheme.accent} /> : null}<Text style={styles.secondaryText}>{uploadLabel}</Text></Pressable> : null}
        </View>

        <Section title={isArabic ? "الهوية المهنية" : "Professional identity"} isRtl={isRtl}>
          {!isIndividual ? <Field label={isArabic ? "اسم الجهة *" : "Organization name *"} value={companyName} onChangeText={setCompanyName} isRtl={isRtl} /> : null}
          <Field label={isIndividual ? (isArabic ? "الاسم المهني *" : "Professional name *") : (isArabic ? "اسم مسؤول الحساب *" : "Account manager name *")} value={contactName} onChangeText={setContactName} isRtl={isRtl} />
          <View style={styles.field}><Text style={[styles.label, rtlText(isRtl)]}>{isArabic ? "نوع الحساب" : "Account type"}</Text><View style={styles.readonly}><Text style={[styles.readonlyText, rtlText(isRtl)]}>{publisherTypeLabel(publisherType, locale)}</Text></View></View>
          <View style={styles.field}><Text style={[styles.label, rtlText(isRtl)]}>{isArabic ? "المدينة *" : "City *"}</Text><Pressable onPress={() => { setCityQuery(""); setCityOpen(true); }} style={[styles.selector, isRtl && styles.rowRtl]}><Text style={[styles.selectorText, rtlText(isRtl)]}>{cityLabel || (isArabic ? "اختر المدينة" : "Choose city")}</Text><ChevronDown size={18} color={darkTheme.muted} /></Pressable></View>
          <Field label={isArabic ? "نبذة" : "About"} value={description} onChangeText={setDescription} isRtl={isRtl} multiline />
        </Section>

        <Section title={isArabic ? "التواصل" : "Contact"} isRtl={isRtl}>
          <Text style={[styles.help, rtlText(isRtl)]}>{isArabic ? "هذه البيانات لا تصبح دليل تواصل عامًا للمواهب؛ وصولها تحكمه سياسات ملامح." : "These details are not exposed as a public talent contact directory; MLAMH access rules govern them."}</Text>
          <Field label={isArabic ? "الهاتف" : "Phone"} value={phone} onChangeText={setPhone} isRtl={isRtl} technical keyboardType="phone-pad" />
          <Field label={isArabic ? "البريد الإلكتروني" : "Email"} value={email} onChangeText={setEmail} isRtl={isRtl} technical keyboardType="email-address" />
          <Field label={isArabic ? "الموقع" : "Website"} value={website} onChangeText={setWebsite} isRtl={isRtl} technical />
          <Field label="Instagram" value={instagram} onChangeText={setInstagram} isRtl={isRtl} technical />
          <Field label="TikTok" value={tiktok} onChangeText={setTiktok} isRtl={isRtl} technical />
          <Field label="LinkedIn" value={linkedin} onChangeText={setLinkedin} isRtl={isRtl} technical />
        </Section>

        <View style={styles.card}>
          <View style={[styles.readinessHeader, isRtl && styles.rowRtl]}><View style={styles.flex}><Text style={[styles.sectionTitle, rtlText(isRtl)]}>{isArabic ? "جاهزية المراجعة" : "Review readiness"}</Text><Text style={[styles.help, rtlText(isRtl)]}>{profile?.reviewReady ? (isArabic ? "جاهز للإرسال" : "Ready to submit") : (isArabic ? "أكمل العناصر المطلوبة" : "Complete required items")}</Text></View><View style={[styles.readyBadge, profile?.reviewReady && styles.readyBadgeActive]}>{profile?.reviewReady ? <Check size={18} color={darkTheme.accent} /> : <Text style={styles.readyCount}>{readyItems.filter((item) => item.complete).length}/{readyItems.length}</Text>}</View></View>
          {readyItems.map((item) => <View key={item.key} style={[styles.requirement, isRtl && styles.rowRtl]}><Text style={item.complete ? styles.done : styles.missing}>{item.complete ? "✓" : "○"}</Text><Text style={[styles.requirementText, rtlText(isRtl)]}>{requirementLabel(item.key, locale, isIndividual)}</Text></View>)}
        </View>

        {error ? <Text accessibilityRole="alert" style={[styles.error, rtlText(isRtl)]}>{error}</Text> : null}
        {success ? <Text accessibilityLiveRegion="polite" style={[styles.success, rtlText(isRtl)]}>{success}</Text> : null}
        <Pressable disabled={saving} onPress={() => void save()} style={[styles.primaryButton, saving && styles.disabled]}>{saving ? <ActivityIndicator color={darkTheme.background} /> : null}<Text style={styles.primaryText}>{saving ? (isArabic ? "جارٍ الحفظ…" : "Saving…") : (isArabic ? "حفظ التغييرات" : "Save changes")}</Text></Pressable>
        <Pressable disabled={submitting || approvalLocked || !profile?.reviewReady} onPress={() => void submitReview()} style={[styles.reviewButton, (submitting || approvalLocked || !profile?.reviewReady) && styles.disabled]}><Text style={styles.reviewText}>{profile?.approvalStatus === "approved" ? (isArabic ? "الحساب معتمد" : "Account approved") : approvalLocked ? (isArabic ? "الملف قيد المراجعة" : "Profile in review") : submitting ? (isArabic ? "جارٍ الإرسال…" : "Submitting…") : (isArabic ? "إرسال الملف للمراجعة" : "Submit for review")}</Text></Pressable>
      </ScrollView>
    </KeyboardAvoidingView>

    <Modal visible={cityOpen} transparent animationType="slide" onRequestClose={() => setCityOpen(false)}>
      <View style={styles.backdrop}><SafeAreaView style={styles.sheet} edges={["bottom"]}>
        <View style={[styles.sheetHeader, isRtl && styles.rowRtl]}><View style={styles.flex}><Text style={[styles.sheetTitle, rtlText(isRtl)]}>{isArabic ? "اختر المدينة" : "Choose city"}</Text><Text style={[styles.help, rtlText(isRtl)]}>{isArabic ? "القائمة تأتي من مصدر المدن الموحد في ملامح." : "Cities come from MLAMH's canonical source."}</Text></View><Pressable onPress={() => setCityOpen(false)}><Text style={styles.close}>{isArabic ? "إغلاق" : "Close"}</Text></Pressable></View>
        <View style={[styles.search, isRtl && styles.rowRtl]}><Search size={18} color={darkTheme.muted} /><TextInput value={cityQuery} onChangeText={setCityQuery} placeholder={isArabic ? "ابحث عن مدينة" : "Search city"} placeholderTextColor={darkTheme.muted} style={[styles.searchInput, rtlText(isRtl)]} /></View>
        <ScrollView keyboardShouldPersistTaps="handled">{filteredCities.map((option) => { const selected = [option.value, option.ar, option.en].includes(city); return <Pressable key={option.value} onPress={() => { setCity(option.value); setCityOpen(false); }} style={[styles.cityRow, isRtl && styles.rowRtl]}><Text style={[styles.cityText, rtlText(isRtl)]}>{option[locale]}</Text>{selected ? <Check size={18} color={darkTheme.accent} /> : null}</Pressable>; })}</ScrollView>
      </SafeAreaView></View>
    </Modal>
  </SafeAreaView>;
}

function Section({ title, children, isRtl }: { title: string; children: React.ReactNode; isRtl: boolean }) {
  return <View style={stylesStatic.section}><Text style={[stylesStatic.sectionTitle, rtlText(isRtl)]}>{title}</Text>{children}</View>;
}

function Field({ label, value, onChangeText, isRtl, technical = false, multiline = false, keyboardType }: { label: string; value: string; onChangeText: (v: string) => void; isRtl: boolean; technical?: boolean; multiline?: boolean; keyboardType?: "phone-pad" | "email-address" }) {
  return <View style={stylesStatic.field}><Text style={[stylesStatic.label, rtlText(isRtl)]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} multiline={multiline} keyboardType={keyboardType} autoCapitalize={technical ? "none" : "sentences"} textAlign={technical ? "left" : (isRtl ? "right" : "left")} style={[stylesStatic.input, multiline && stylesStatic.multiline, technical ? stylesStatic.technical : rtlText(isRtl)]} /></View>;
}

function publisherTypeLabel(value: string, locale: "ar" | "en") { return PUBLISHER_TYPES[value]?.[locale] ?? value; }
function requirementLabel(key: string, locale: "ar" | "en", individual: boolean) {
  const labels: Record<string, { ar: string; en: string }> = {
    company_name: { ar: "اسم الجهة", en: "Organization name" }, contact_name: { ar: individual ? "الاسم المهني" : "اسم مسؤول الحساب", en: individual ? "Professional name" : "Account manager name" }, publisher_type: { ar: "نوع الحساب", en: "Account type" }, city: { ar: "المدينة", en: "City" }, profile_image_url: { ar: "الشعار / الصورة", en: "Logo / image" },
  };
  return labels[key]?.[locale] ?? key;
}
function rtlText(isRtl: boolean) { return { textAlign: isRtl ? "right" as const : "left" as const, writingDirection: isRtl ? "rtl" as const : "ltr" as const }; }

const stylesStatic = StyleSheet.create({
  section: { gap: 12, padding: 16, borderWidth: 1, borderColor: darkTheme.border, borderRadius: 20, backgroundColor: darkTheme.surface }, sectionTitle: { color: darkTheme.text, fontSize: 17, fontWeight: "800" }, field: { gap: 7 }, label: { color: darkTheme.muted, fontSize: 12, fontWeight: "700" }, input: { minHeight: 50, borderWidth: 1, borderColor: darkTheme.border, borderRadius: 14, backgroundColor: darkTheme.background, color: darkTheme.text, paddingHorizontal: 13, paddingVertical: 11, fontSize: 14 }, multiline: { minHeight: 100, textAlignVertical: "top" }, technical: { writingDirection: "ltr" },
});
function createStyles() { return StyleSheet.create({
  screen:{flex:1,backgroundColor:darkTheme.background},content:{padding:18,paddingBottom:42,gap:16},topRow:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:10},rowRtl:{flexDirection:"row-reverse"},iconButton:{width:42,height:42,borderRadius:14,borderWidth:1,borderColor:darkTheme.border,backgroundColor:darkTheme.surface,alignItems:"center",justifyContent:"center"},brand:{flex:1,color:darkTheme.accent,fontSize:12,fontWeight:"900"},header:{gap:7},title:{color:darkTheme.text,fontSize:28,fontWeight:"900"},subtitle:{color:darkTheme.muted,fontSize:13,lineHeight:20,maxWidth:520},card:{gap:14,padding:16,borderWidth:1,borderColor:darkTheme.border,borderRadius:20,backgroundColor:darkTheme.surface},identityRow:{flexDirection:"row",alignItems:"center",gap:12},logo:{width:62,height:62,borderRadius:18},logoFallback:{width:62,height:62,borderRadius:18,backgroundColor:"#C9A96216",borderWidth:1,borderColor:"#C9A96255",alignItems:"center",justifyContent:"center"},logoInitial:{color:darkTheme.accent,fontSize:23,fontWeight:"900"},identityCopy:{flex:1,gap:3},identityName:{color:darkTheme.text,fontSize:18,fontWeight:"900"},contactPerson:{color:darkTheme.text,fontSize:11},meta:{color:darkTheme.muted,fontSize:11},secondaryButton:{minHeight:46,borderWidth:1,borderColor:"#C9A96255",borderRadius:14,flexDirection:"row",gap:8,alignItems:"center",justifyContent:"center"},secondaryText:{color:darkTheme.accent,fontSize:12,fontWeight:"800"},section:{gap:12,padding:16,borderWidth:1,borderColor:darkTheme.border,borderRadius:20,backgroundColor:darkTheme.surface},sectionTitle:{color:darkTheme.text,fontSize:17,fontWeight:"800"},field:{gap:7},label:{color:darkTheme.muted,fontSize:12,fontWeight:"700"},readonly:{minHeight:50,borderWidth:1,borderColor:darkTheme.border,borderRadius:14,backgroundColor:"#FFFFFF05",paddingHorizontal:13,justifyContent:"center"},readonlyText:{color:darkTheme.text,fontSize:14},selector:{minHeight:50,borderWidth:1,borderColor:darkTheme.border,borderRadius:14,backgroundColor:darkTheme.background,paddingHorizontal:13,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:10},selectorText:{flex:1,color:darkTheme.text,fontSize:14},help:{color:darkTheme.muted,fontSize:11,lineHeight:17},readinessHeader:{flexDirection:"row",alignItems:"center",gap:10},flex:{flex:1},readyBadge:{minWidth:38,height:38,borderRadius:19,borderWidth:1,borderColor:darkTheme.border,alignItems:"center",justifyContent:"center",paddingHorizontal:7},readyBadgeActive:{borderColor:"#C9A96266",backgroundColor:"#C9A9620F"},readyCount:{color:darkTheme.muted,fontSize:10,fontWeight:"800"},requirement:{flexDirection:"row",alignItems:"center",gap:8},done:{color:darkTheme.accent,fontWeight:"900"},missing:{color:darkTheme.muted},requirementText:{flex:1,color:darkTheme.text,fontSize:12},error:{padding:12,borderRadius:12,backgroundColor:"#E59A9A12",color:"#E59A9A",fontSize:12},success:{padding:12,borderRadius:12,backgroundColor:"#C9A96210",color:darkTheme.accent,fontSize:12},primaryButton:{minHeight:52,borderRadius:16,backgroundColor:darkTheme.accent,flexDirection:"row",gap:8,alignItems:"center",justifyContent:"center"},primaryText:{color:darkTheme.background,fontWeight:"900"},reviewButton:{minHeight:52,borderRadius:16,borderWidth:1,borderColor:"#C9A96266",alignItems:"center",justifyContent:"center"},reviewText:{color:darkTheme.accent,fontWeight:"800"},disabled:{opacity:.45},backdrop:{flex:1,justifyContent:"flex-end",backgroundColor:"#00000088"},sheet:{maxHeight:"78%",backgroundColor:darkTheme.surface,borderTopLeftRadius:26,borderTopRightRadius:26,padding:18,gap:14},sheetHeader:{flexDirection:"row",alignItems:"center",gap:12},sheetTitle:{color:darkTheme.text,fontSize:20,fontWeight:"900"},close:{color:darkTheme.accent,fontWeight:"800"},search:{minHeight:48,borderWidth:1,borderColor:darkTheme.border,borderRadius:14,backgroundColor:darkTheme.background,paddingHorizontal:12,flexDirection:"row",alignItems:"center",gap:8},searchInput:{flex:1,color:darkTheme.text,fontSize:14},cityRow:{minHeight:50,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:10,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:darkTheme.border},cityText:{flex:1,color:darkTheme.text,fontSize:14},
});}
