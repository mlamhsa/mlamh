import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Camera, CheckCircle2, ImagePlus, Save, Send, Trash2 } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { MobileApiError } from "@/src/api/client";
import {
  createTalentGalleryUpload,
  deleteTalentGalleryImage,
  finalizeTalentGalleryUpload,
  getOwnTalentProfile,
  setTalentPrimaryImage,
  submitOwnTalentProfileForReview,
  updateOwnTalentProfile,
  type OwnTalentProfile,
} from "@/src/domains/talent/profile-api";
import { useLocale } from "@/src/i18n/LocaleProvider";
import { localizeApprovalStatus, normalizeInputDigits, normalizeNumericInput } from "@/src/i18n/format";
import { useSessionContext } from "@/src/runtime/SessionContext";
import { supabase } from "@/src/services/supabase";
import { colors, radius, spacing, typography } from "@/src/theme/tokens";

function base64ToArrayBuffer(value: string) {
  const binary = globalThis.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes.buffer;
}

function numeric(value: string) {
  const normalized = normalizeNumericInput(value).trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function list(value: string) {
  return [...new Set(value.split(/[,،;\n]+/).map((item) => item.trim()).filter(Boolean))];
}

export default function TalentProfileScreen() {
  const { locale } = useLocale();
  const session = useSessionContext();
  const isArabic = locale === "ar";
  const align = isArabic ? "right" : "left";
  const writingDirection = isArabic ? "rtl" : "ltr";

  const [profile, setProfile] = useState<OwnTalentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [bio, setBio] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [skills, setSkills] = useState("");
  const [languages, setLanguages] = useState("");
  const [dialects, setDialects] = useState("");
  const [availabilityStatus, setAvailabilityStatus] = useState("available_now");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getOwnTalentProfile(locale);
      if (!result.ok) throw new Error(result.code);
      const item = result.item;
      setProfile(item);
      setDisplayName(item.displayName || "");
      setDateOfBirth(item.dateOfBirth?.slice(0, 10) || "");
      setBio(item.bio || "");
      setHeightCm(item.heightCm == null ? "" : String(item.heightCm));
      setWeightKg(item.weightKg == null ? "" : String(item.weightKg));
      setSkills(item.skills.join(", "));
      setLanguages(item.languages.join(", "));
      setDialects(item.dialects.join(", "));
      setAvailabilityStatus(item.availabilityStatus || "available_now");
    } catch {
      setError(isArabic ? "تعذر تحميل ملفك الآن." : "Unable to load your profile right now.");
    } finally {
      setLoading(false);
    }
  }, [isArabic, locale]);

  useEffect(() => { void load(); }, [load]);

  const protectedLocked = profile?.approvalStatus === "pending" || profile?.approvalStatus === "submitted" || profile?.approvalStatus === "approved";
  const canSubmit = profile && !["pending", "submitted", "approved"].includes(profile.approvalStatus || "");

  async function save() {
    if (!profile || saving) return;
    setSaving(true);
    setError("");
    try {
      const payload: Parameters<typeof updateOwnTalentProfile>[1] = {
        bio: bio.trim() || null,
        heightCm: numeric(heightCm),
        weightKg: numeric(weightKg),
        skills: list(skills),
        languages: list(languages),
        dialects: list(dialects),
        availabilityStatus,
      };
      if (!protectedLocked && displayName.trim() !== profile.displayName.trim()) payload.displayName = displayName.trim();
      const normalizedDateOfBirth = normalizeInputDigits(dateOfBirth).trim();
      if (!protectedLocked && normalizedDateOfBirth !== (profile.dateOfBirth?.slice(0, 10) || "")) payload.dateOfBirth = normalizedDateOfBirth || null;
      await updateOwnTalentProfile(locale, payload);
      await load();
      Alert.alert(isArabic ? "تم الحفظ" : "Saved", isArabic ? "تم تحديث ملفك المهني." : "Your talent profile was updated.");
    } catch (saveError) {
      const message = saveError instanceof MobileApiError && saveError.code === "PROTECTED_FIELDS_LOCKED"
        ? (isArabic ? "لا يمكن تعديل بيانات الهوية الأساسية أثناء المراجعة أو بعد الاعتماد من هذا المسار." : "Core identity fields cannot be edited here while under review or after approval.")
        : (isArabic ? "تعذر حفظ الملف. راجع البيانات وحاول مرة أخرى." : "Unable to save the profile. Check the fields and try again.");
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function addPhoto() {
    if (!profile || uploading || profile.gallery.length >= 12) return;
    setUploading(true);
    setError("");
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) throw new Error("PHOTO_PERMISSION");
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: false,
        quality: 0.9,
      });
      if (picked.canceled || !picked.assets[0]) return;
      const prepared = await ImageManipulator.manipulateAsync(
        picked.assets[0].uri,
        [{ resize: { width: 1600 } }],
        { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG, base64: true },
      );
      if (!prepared.base64) throw new Error("IMAGE_PREPARE_FAILED");
      const bytes = base64ToArrayBuffer(prepared.base64);
      const upload = await createTalentGalleryUpload("image/jpeg", bytes.byteLength);
      const { error: uploadError } = await supabase.storage
        .from(upload.bucket)
        .uploadToSignedUrl(upload.path, upload.token, bytes, { contentType: "image/jpeg" });
      if (uploadError) throw uploadError;
      const finalized = await finalizeTalentGalleryUpload(upload.path);
      if (!profile.imageUrl && finalized.url) await setTalentPrimaryImage(finalized.url);
      await load();
    } catch {
      setError(isArabic ? "تعذر رفع الصورة. استخدم صورة JPG أو PNG أو WEBP بحجم مناسب وحاول مرة أخرى." : "Unable to upload the photo. Use a supported image and try again.");
    } finally {
      setUploading(false);
    }
  }

  async function makePrimary(url: string) {
    if (profile?.approvalStatus === "pending" || profile?.approvalStatus === "submitted") {
      Alert.alert(isArabic ? "الملف قيد المراجعة" : "Profile under review", isArabic ? "لا يمكن تغيير الصورة الشخصية أثناء المراجعة." : "The profile photo cannot be changed while under review.");
      return;
    }
    try {
      await setTalentPrimaryImage(url);
      await load();
    } catch {
      setError(isArabic ? "تعذر اعتماد الصورة الشخصية." : "Unable to set the profile photo.");
    }
  }

  async function removePhoto(url: string) {
    try {
      await deleteTalentGalleryImage(url);
      await load();
    } catch {
      setError(isArabic ? "تعذر حذف الصورة." : "Unable to delete the photo.");
    }
  }

  async function submitReview() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await submitOwnTalentProfileForReview(locale);
      await session.refresh();
      await load();
      Alert.alert(isArabic ? "تم الإرسال" : "Submitted", result.message);
    } catch (submitError) {
      const message = submitError instanceof MobileApiError && submitError.message
        ? submitError.message
        : (isArabic ? "تعذر إرسال الملف للمراجعة. أكمل البيانات المطلوبة ثم حاول مرة أخرى." : "Unable to submit the profile. Complete the required information and try again.");
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (session.status !== "talent") {
    return <View style={styles.center}><Text style={styles.stateText}>{isArabic ? "هذه الصفحة مخصصة للمواهب." : "This page is for talent accounts."}</Text></View>;
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.gold} /><Text style={styles.stateText}>{isArabic ? "جارٍ تحميل ملفك…" : "Loading your profile…"}</Text></View>;
  }

  if (!profile) {
    return <View style={styles.center}><Text style={styles.stateText}>{error || (isArabic ? "تعذر فتح الملف." : "Unable to open profile.")}</Text><Pressable onPress={() => void load()} style={styles.primaryButton}><Text style={styles.primaryButtonText}>{isArabic ? "إعادة المحاولة" : "Retry"}</Text></Pressable></View>;
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={[styles.eyebrow, { textAlign: align }]}>{isArabic ? "ملفي المهني" : "TALENT PROFILE"}</Text>
        <Text style={[styles.title, { textAlign: align, writingDirection }]}>{isArabic ? "جهّز ملفك للفرص" : "Get your profile opportunity-ready"}</Text>
        <Text style={[styles.subtitle, { textAlign: align, writingDirection }]}>{isArabic ? "عدّل بياناتك، أضف صورك، ثم أرسل الملف للمراجعة من نفس المكان." : "Edit your details, add photos, then submit the profile for review from one place."}</Text>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}><Text style={styles.progressValue}>{profile.profileCompletion}%</Text><Text style={styles.progressLabel}>{isArabic ? "اكتمال الملف" : "Profile completion"}</Text></View>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${profile.profileCompletion}%` }]} /></View>
          <Text style={[styles.statusText, { textAlign: align, writingDirection }]}>{isArabic ? `حالة المراجعة: ${localizeApprovalStatus(profile.approvalStatus, locale)}` : `Review status: ${localizeApprovalStatus(profile.approvalStatus, locale)}`}</Text>
        </View>

        <Section title={isArabic ? "الصورة والمعرض" : "Photo & gallery"} isArabic={isArabic}>
          {profile.imageUrl ? <Image source={{ uri: profile.imageUrl }} style={styles.primaryImage} resizeMode="cover" /> : <View style={styles.photoPlaceholder}><Camera size={28} color={colors.gold} /><Text style={styles.placeholderText}>{isArabic ? "أضف صورة شخصية واضحة" : "Add a clear profile photo"}</Text></View>}
          <Pressable disabled={uploading || profile.gallery.length >= 12} onPress={() => void addPhoto()} style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed, uploading && styles.disabled]}>
            {uploading ? <ActivityIndicator color={colors.gold} /> : <ImagePlus size={18} color={colors.gold} />}
            <Text style={styles.outlineText}>{uploading ? (isArabic ? "جارٍ رفع الصورة…" : "Uploading…") : (isArabic ? "إضافة صورة" : "Add photo")}</Text>
          </Pressable>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>
            {profile.gallery.map((url) => <View key={url} style={styles.galleryItem}><Pressable onPress={() => void makePrimary(url)}><Image source={{ uri: url }} style={styles.galleryImage} /></Pressable><Pressable accessibilityLabel={isArabic ? "حذف الصورة" : "Delete photo"} onPress={() => void removePhoto(url)} style={styles.deletePhoto}><Trash2 size={13} color="#FFB0B0" /></Pressable>{profile.imageUrl === url ? <View style={styles.primaryBadge}><CheckCircle2 size={12} color="#080808" /></View> : null}</View>)}
          </ScrollView>
        </Section>

        <Section title={isArabic ? "البيانات الأساسية" : "Basic details"} isArabic={isArabic}>
          <Field label={isArabic ? "الاسم" : "Display name"} value={displayName} onChangeText={setDisplayName} editable={!protectedLocked} isArabic={isArabic} />
          <Field label={isArabic ? "تاريخ الميلاد" : "Date of birth"} value={dateOfBirth} onChangeText={setDateOfBirth} editable={!protectedLocked} placeholder="YYYY-MM-DD" isArabic={isArabic} ltr />
          {protectedLocked ? <Text style={[styles.helper, { textAlign: align, writingDirection }]}>{isArabic ? "بيانات الهوية الأساسية محمية أثناء المراجعة وبعد الاعتماد." : "Core identity details are protected while under review and after approval."}</Text> : null}
          <Field label={isArabic ? "النبذة" : "Bio"} value={bio} onChangeText={setBio} multiline isArabic={isArabic} />
          <View style={styles.twoColumns}><View style={styles.flex}><Field label={isArabic ? "الطول سم" : "Height cm"} value={heightCm} onChangeText={setHeightCm} keyboardType="numeric" isArabic={isArabic} ltr /></View><View style={styles.flex}><Field label={isArabic ? "الوزن كجم" : "Weight kg"} value={weightKg} onChangeText={setWeightKg} keyboardType="numeric" isArabic={isArabic} ltr /></View></View>
        </Section>

        <Section title={isArabic ? "المهارات والتوفر" : "Skills & availability"} isArabic={isArabic}>
          <Field label={isArabic ? "المهارات — افصل بفاصلة" : "Skills — comma separated"} value={skills} onChangeText={setSkills} isArabic={isArabic} />
          <Field label={isArabic ? "اللغات — افصل بفاصلة" : "Languages — comma separated"} value={languages} onChangeText={setLanguages} isArabic={isArabic} />
          <Field label={isArabic ? "اللهجات — افصل بفاصلة" : "Dialects — comma separated"} value={dialects} onChangeText={setDialects} isArabic={isArabic} />
          <Text style={[styles.fieldLabel, { textAlign: align }]}>{isArabic ? "التوفر" : "Availability"}</Text>
          <View style={styles.chips}>{[["available_now", isArabic ? "متاح الآن" : "Available now"],["available_this_week", isArabic ? "هذا الأسبوع" : "This week"],["available_next_month", isArabic ? "الشهر القادم" : "Next month"],["unavailable", isArabic ? "غير متاح" : "Unavailable"]].map(([value,label]) => <Pressable key={value} onPress={() => setAvailabilityStatus(value)} style={[styles.chip, availabilityStatus === value && styles.chipActive]}><Text style={[styles.chipText, availabilityStatus === value && styles.chipTextActive]}>{label}</Text></Pressable>)}</View>
        </Section>

        {error ? <Text style={[styles.error, { textAlign: align, writingDirection }]}>{error}</Text> : null}

        <Pressable disabled={saving} onPress={() => void save()} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, saving && styles.disabled]}>
          {saving ? <ActivityIndicator color="#080808" /> : <Save size={18} color="#080808" />}
          <Text style={styles.primaryButtonText}>{saving ? (isArabic ? "جارٍ الحفظ…" : "Saving…") : (isArabic ? "حفظ التعديلات" : "Save changes")}</Text>
        </Pressable>

        {canSubmit ? <Pressable disabled={submitting} onPress={() => void submitReview()} style={({ pressed }) => [styles.reviewButton, pressed && styles.pressed, submitting && styles.disabled]}><Send size={18} color={colors.gold} /><Text style={styles.reviewText}>{submitting ? (isArabic ? "جارٍ الإرسال…" : "Submitting…") : (isArabic ? "إرسال الملف للمراجعة" : "Submit profile for review")}</Text></Pressable> : null}

        {profile.slug ? <Pressable onPress={() => router.push(`/talent/${profile.slug}` as never)} style={styles.previewLink}><Text style={styles.previewText}>{isArabic ? "معاينة الملف العام" : "Preview public profile"}</Text></Pressable> : null}
      </ScrollView>
    </View>
  );
}

function Section({ title, isArabic, children }: { title: string; isArabic: boolean; children: React.ReactNode }) {
  return <View style={styles.section}><Text style={[styles.sectionTitle, { textAlign: isArabic ? "right" : "left", writingDirection: isArabic ? "rtl" : "ltr" }]}>{title}</Text>{children}</View>;
}

function Field({ label, value, onChangeText, isArabic, editable = true, multiline = false, placeholder, keyboardType, ltr = false }: { label: string; value: string; onChangeText: (value: string) => void; isArabic: boolean; editable?: boolean; multiline?: boolean; placeholder?: string; keyboardType?: "default" | "numeric"; ltr?: boolean }) {
  return <View style={styles.field}><Text style={[styles.fieldLabel, { textAlign: isArabic ? "right" : "left" }]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} editable={editable} multiline={multiline} placeholder={placeholder} placeholderTextColor={colors.textMuted} keyboardType={keyboardType} style={[styles.input, multiline && styles.multiline, !editable && styles.readonly, { textAlign: ltr ? "left" : isArabic ? "right" : "left", writingDirection: ltr ? "ltr" : isArabic ? "rtl" : "ltr" }]} /></View>;
}

const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.background},content:{paddingHorizontal:spacing.lg,paddingTop:spacing.xl,paddingBottom:80},center:{flex:1,backgroundColor:colors.background,alignItems:"center",justifyContent:"center",gap:spacing.md,padding:spacing.xl},
  eyebrow:{color:colors.gold,fontSize:typography.eyebrow,letterSpacing:2.2,fontWeight:"700"},title:{color:colors.textPrimary,fontSize:30,lineHeight:38,fontWeight:"600",marginTop:spacing.sm},subtitle:{color:colors.textSecondary,fontSize:typography.body,lineHeight:24,marginTop:spacing.md},
  progressCard:{marginTop:spacing.xl,borderWidth:1,borderColor:"rgba(201,169,98,0.22)",backgroundColor:"rgba(201,169,98,0.05)",borderRadius:radius.xl,padding:spacing.lg},progressHeader:{flexDirection:"row",alignItems:"baseline",justifyContent:"space-between"},progressValue:{color:colors.gold,fontSize:26,fontWeight:"800"},progressLabel:{color:colors.textSecondary,fontSize:12},progressTrack:{height:6,borderRadius:999,backgroundColor:"rgba(255,255,255,0.08)",marginTop:spacing.md,overflow:"hidden"},progressFill:{height:"100%",backgroundColor:colors.gold,borderRadius:999},statusText:{color:colors.textMuted,fontSize:10,marginTop:spacing.md},
  section:{marginTop:spacing.xl,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface,borderRadius:radius.xl,padding:spacing.lg,gap:spacing.md},sectionTitle:{color:colors.textPrimary,fontSize:16,fontWeight:"800"},
  primaryImage:{width:"100%",height:260,borderRadius:radius.lg,backgroundColor:"#111"},photoPlaceholder:{height:180,borderRadius:radius.lg,borderWidth:1,borderStyle:"dashed",borderColor:"rgba(201,169,98,0.28)",alignItems:"center",justifyContent:"center",gap:spacing.sm},placeholderText:{color:colors.textMuted,fontSize:11},
  outlineButton:{minHeight:48,borderWidth:1,borderColor:"rgba(201,169,98,0.28)",borderRadius:radius.lg,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:spacing.sm},outlineText:{color:colors.gold,fontSize:12,fontWeight:"700"},galleryRow:{gap:spacing.sm},galleryItem:{width:88,height:108,position:"relative"},galleryImage:{width:88,height:108,borderRadius:12,backgroundColor:"#111"},deletePhoto:{position:"absolute",top:5,left:5,width:26,height:26,borderRadius:13,backgroundColor:"rgba(0,0,0,0.78)",alignItems:"center",justifyContent:"center"},primaryBadge:{position:"absolute",right:5,bottom:5,width:24,height:24,borderRadius:12,backgroundColor:colors.gold,alignItems:"center",justifyContent:"center"},
  field:{gap:6},fieldLabel:{color:colors.textSecondary,fontSize:11,fontWeight:"700"},input:{minHeight:50,borderWidth:1,borderColor:colors.border,borderRadius:radius.lg,backgroundColor:"#0B0B0B",color:colors.textPrimary,paddingHorizontal:spacing.md,fontSize:14},multiline:{minHeight:110,textAlignVertical:"top",paddingTop:spacing.md},readonly:{opacity:0.55},helper:{color:colors.textMuted,fontSize:10,lineHeight:17},
  twoColumns:{flexDirection:"row",gap:spacing.md},flex:{flex:1},chips:{flexDirection:"row",flexWrap:"wrap",gap:spacing.sm},chip:{borderWidth:1,borderColor:colors.border,borderRadius:999,paddingHorizontal:12,paddingVertical:9},chipActive:{borderColor:colors.gold,backgroundColor:"rgba(201,169,98,0.10)"},chipText:{color:colors.textMuted,fontSize:10},chipTextActive:{color:colors.gold},
  error:{color:"#FFB0B0",fontSize:11,lineHeight:19,marginTop:spacing.lg},primaryButton:{minHeight:54,marginTop:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.gold,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:spacing.sm,paddingHorizontal:spacing.lg},primaryButtonText:{color:"#080808",fontSize:13,fontWeight:"800"},reviewButton:{minHeight:54,marginTop:spacing.md,borderWidth:1,borderColor:"rgba(201,169,98,0.35)",borderRadius:radius.lg,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:spacing.sm},reviewText:{color:colors.gold,fontSize:13,fontWeight:"800"},previewLink:{alignItems:"center",paddingVertical:spacing.xl},previewText:{color:colors.textSecondary,fontSize:12,textDecorationLine:"underline"},stateText:{color:colors.textMuted,fontSize:12,textAlign:"center"},pressed:{opacity:0.82},disabled:{opacity:0.55},
});
