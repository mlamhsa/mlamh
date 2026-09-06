import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

import { ScreenSkeleton } from "@/components/ScreenSkeleton";
import { deleteTalentGalleryImage, getTalentProfile, setTalentPrimaryImage, uploadTalentGalleryBuffer } from "@/lib/api";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { darkTheme } from "@/lib/theme";

const MAX_GALLERY = 12;

type UploadPhase = "idle" | "preparing" | "uploading" | "finalizing";

export default function TalentMediaScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [gallery, setGallery] = useState<string[]>([]);
  const [primaryUrl, setPrimaryUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyUrl, setBusyUrl] = useState<string | null>(null);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const result = await getTalentProfile(locale);
        if (!active) return;
        if (!result.ok) {
          if (result.code === "UNAUTHENTICATED") router.replace({ pathname: "/login", params: { next: "/profile/media" } });
          else setError(isArabic ? "تعذر تحميل الصور." : "Unable to load your media.");
        } else {
          setGallery(result.item.gallery);
          setPrimaryUrl(result.item.imageUrl);
        }
      } catch {
        if (active) setError(isArabic ? "تعذر تحميل الصور. تحقق من الاتصال وحاول مرة أخرى." : "Unable to load your media. Check your connection and try again.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [isArabic, locale]);

  function uploadError(code: string) {
    const messages: Record<string, { ar: string; en: string }> = {
      GALLERY_LIMIT: { ar: "وصلت للحد الأقصى وهو 12 صورة.", en: "You reached the 12-image portfolio limit." },
      FILE_TOO_LARGE: { ar: "حجم الصورة كبير جدًا.", en: "This image is too large." },
      UNSUPPORTED_FILE_TYPE: { ar: "صيغة الصورة غير مدعومة.", en: "This image format is not supported." },
      UPLOAD_FAILED: { ar: "تعذر رفع الصورة إلى التخزين.", en: "The image upload could not be completed." },
      REQUEST_FAILED: { ar: "خدمة رفع الصور غير متاحة حاليًا.", en: "The media upload service is not available right now." },
      UNAUTHENTICATED: { ar: "انتهت الجلسة. سجّل الدخول ثم حاول مرة أخرى.", en: "Your session expired. Sign in and try again." },
    };
    return messages[code]?.[locale] ?? (isArabic ? "تعذر رفع الصورة. حاول مرة أخرى." : "Unable to upload the image. Please try again.");
  }

  async function addImage() {
    if (phase !== "idle" || gallery.length >= MAX_GALLERY) return;
    setError(null);
    setUploadProgress(null);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError(isArabic ? "نحتاج إذن الوصول للصور لاختيار صور من جهازك." : "Photo access is required to choose images.");
        return;
      }

      const remaining = MAX_GALLERY - gallery.length;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        allowsEditing: false,
        orderedSelection: true,
        selectionLimit: remaining,
        quality: 1,
      });
      if (result.canceled || !result.assets.length) return;

      const assets = result.assets.slice(0, remaining);
      setUploadProgress({ current: 0, total: assets.length });
      let nextPrimaryUrl = primaryUrl;

      for (let index = 0; index < assets.length; index += 1) {
        const asset = assets[index];
        setUploadProgress({ current: index + 1, total: assets.length });
        setPhase("preparing");

        const actions = asset.width > 2000 ? [{ resize: { width: 2000 } }] : [];
        const normalized = await ImageManipulator.manipulateAsync(asset.uri, actions, { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG });
        const localResponse = await fetch(normalized.uri);
        const buffer = await localResponse.arrayBuffer();
        if (buffer.byteLength > 10 * 1024 * 1024) {
          setError(isArabic ? `الصورة ${index + 1} كبيرة جدًا بعد المعالجة.` : `Image ${index + 1} is still too large after processing.`);
          break;
        }

        setPhase("uploading");
        const upload = await uploadTalentGalleryBuffer(buffer, "image/jpeg");
        if (!upload.ok) {
          setError(uploadError(upload.code));
          break;
        }
        setGallery(upload.gallery);

        if (!nextPrimaryUrl) {
          setPhase("finalizing");
          const primary = await setTalentPrimaryImage(upload.url);
          if (primary.ok) {
            nextPrimaryUrl = primary.url;
            setPrimaryUrl(primary.url);
          }
        }
      }
    } catch {
      setError(isArabic ? "تعذر تجهيز الصور أو رفعها." : "Unable to process or upload the selected images.");
    } finally {
      setPhase("idle");
      setUploadProgress(null);
    }
  }

  async function makePrimary(url: string) {
    if (busyUrl) return;
    setBusyUrl(url);
    setError(null);
    try {
      const result = await setTalentPrimaryImage(url);
      if (!result.ok) {
        setError(isArabic ? "تعذر تعيين الصورة الرئيسية." : "Unable to set the primary image.");
        return;
      }
      setPrimaryUrl(result.url);
    } catch {
      setError(isArabic ? "تعذر تعيين الصورة الرئيسية. حاول مرة أخرى." : "Unable to set the primary image. Please try again.");
    } finally {
      setBusyUrl(null);
    }
  }

  function confirmDelete(url: string) {
    Alert.alert(
      isArabic ? "حذف الصورة؟" : "Delete image?",
      isArabic ? "سيتم حذف الصورة من معرضك نهائيًا." : "This image will be permanently removed from your gallery.",
      [
        { text: isArabic ? "إلغاء" : "Cancel", style: "cancel" },
        { text: isArabic ? "حذف" : "Delete", style: "destructive", onPress: () => void removeImage(url) },
      ],
    );
  }

  async function removeImage(url: string) {
    if (busyUrl) return;
    setBusyUrl(url);
    setError(null);
    try {
      const result = await deleteTalentGalleryImage(url);
      if (!result.ok) {
        setError(isArabic ? "تعذر حذف الصورة." : "Unable to delete the image.");
        return;
      }
      setGallery(result.gallery);
      setPrimaryUrl(result.primaryUrl);
    } catch {
      setError(isArabic ? "تعذر حذف الصورة. حاول مرة أخرى." : "Unable to delete the image. Please try again.");
    } finally {
      setBusyUrl(null);
    }
  }

  if (loading) return <ScreenSkeleton variant="profile" locale={locale} label={isArabic ? "جارٍ تحميل معرض الصور" : "Loading portfolio media"} />;

  const progressSuffix = uploadProgress ? ` ${uploadProgress.current}/${uploadProgress.total}` : "";
  const phaseLabel = phase === "preparing"
    ? `${isArabic ? "جارٍ تجهيز الصورة" : "Preparing photo"}${progressSuffix}…`
    : phase === "uploading"
      ? `${isArabic ? "جارٍ رفع الصورة" : "Uploading photo"}${progressSuffix}…`
      : phase === "finalizing"
        ? `${isArabic ? "جارٍ تعيين صورة الملف" : "Setting profile photo"}${progressSuffix}…`
        : null;

  return <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { direction: isRtl ? "rtl" : "ltr" }]}>
    <View style={styles.top}>
      <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} hitSlop={8} style={styles.backButton}><Text style={styles.back}>{isRtl ? "›" : "‹"}</Text></Pressable>
      <Text style={styles.brand}>{isArabic ? "ملامح" : "MLAMH"}</Text>
    </View>

    <View style={styles.header}>
      <Text style={styles.eyebrow}>{isArabic ? "الملف المهني" : "PORTFOLIO"}</Text>
      <Text accessibilityRole="header" style={styles.title}>{isArabic ? "الصور والأعمال" : "Portfolio media"}</Text>
      <Text style={styles.subtitle}>{isArabic ? "أضف صورك الاحترافية وحدد الصورة التي تظهر كصورة ملفك." : "Add professional images and choose the photo that represents your profile."}</Text>
    </View>

    <View style={styles.primaryCard}>
      <View style={styles.primaryPreview}>{primaryUrl ? <Image source={{ uri: primaryUrl }} style={styles.primaryImage} resizeMode="cover" /> : <Text style={styles.primaryPlaceholder}>＋</Text>}</View>
      <View style={styles.primaryCopy}><Text style={styles.primaryTitle}>{isArabic ? "صورة الملف" : "Profile photo"}</Text><Text style={styles.primaryText}>{primaryUrl ? (isArabic ? "هذه الصورة تظهر أولًا في ملفك." : "This photo leads your talent profile.") : (isArabic ? "أول صورة ترفعها ستصبح صورة ملفك تلقائيًا." : "Your first uploaded image becomes your profile photo automatically.")}</Text></View>
    </View>

    <View style={styles.counterRow}><Text style={styles.sectionTitle}>{isArabic ? "المعرض" : "Gallery"}</Text><Text style={styles.counter}>{gallery.length}/{MAX_GALLERY}</Text></View>

    {gallery.length ? <View style={styles.grid}>{gallery.map((uri, index) => {
      const isPrimary = primaryUrl === uri;
      const busy = busyUrl === uri;
      return <View key={`${uri}-${index}`} style={styles.imageCard}>
        <View><Image source={{ uri }} style={[styles.image, isPrimary && styles.imagePrimary]} resizeMode="cover" />{isPrimary ? <Text style={styles.primaryBadge}>{isArabic ? "الرئيسية" : "Primary"}</Text> : null}</View>
        <View style={styles.imageActions}>
          {!isPrimary ? <Pressable disabled={Boolean(busyUrl)} onPress={() => void makePrimary(uri)} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>{busy ? (isArabic ? "جارٍ التحديث…" : "Updating…") : (isArabic ? "تعيين رئيسية" : "Set primary")}</Text></Pressable> : <View style={styles.primarySpacer} />}
          <Pressable disabled={Boolean(busyUrl)} onPress={() => confirmDelete(uri)} style={styles.deleteAction}><Text style={styles.deleteText}>{isArabic ? "حذف" : "Delete"}</Text></Pressable>
        </View>
      </View>;
    })}</View> : <View style={styles.empty}><Text style={styles.emptyTitle}>{isArabic ? "ابدأ معرضك" : "Start your portfolio"}</Text><Text style={styles.emptyText}>{isArabic ? "أضف أول صورة احترافية لملفك." : "Add the first professional image to your profile."}</Text></View>}

    {error ? <View style={styles.errorBox}><Text accessibilityRole="alert" style={styles.error}>{error}</Text></View> : null}
    {phaseLabel ? <Text style={styles.phase}>{phaseLabel}</Text> : null}

    <Pressable disabled={phase !== "idle" || gallery.length >= MAX_GALLERY} onPress={() => void addImage()} style={[styles.addButton, (phase !== "idle" || gallery.length >= MAX_GALLERY) && styles.disabled]}>
      {phase !== "idle" ? <ActivityIndicator color={theme.background} /> : <Text style={styles.addButtonText}>{isArabic ? "إضافة صور" : "Add photos"}</Text>}
    </Pressable>
    <Text style={styles.helper}>{isArabic ? "يمكنك اختيار عدة صور دفعة واحدة حتى حد 12 صورة. يتم تحسين الصور قبل الرفع." : "Select multiple images at once, up to the 12-image limit. Images are optimized before upload."}</Text>
  </ScrollView>;
}

function createStyles(theme: typeof darkTheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background },
    content: { width: "100%", maxWidth: 680, alignSelf: "center", paddingHorizontal: 18, paddingTop: 48, paddingBottom: 54, gap: 18 },
    top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    backButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    back: { color: theme.text, fontSize: 30, lineHeight: 34 },
    brand: { color: theme.accent, fontSize: 17, fontWeight: "800", letterSpacing: 1.1 },
    header: { gap: 7 },
    eyebrow: { color: theme.accent, fontSize: 9, fontWeight: "900", letterSpacing: 1.5 },
    title: { color: theme.text, fontSize: 30, lineHeight: 37, fontWeight: "700" },
    subtitle: { color: theme.muted, fontSize: 13, lineHeight: 21 },
    primaryCard: { flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1, borderColor: theme.border, borderRadius: 18, padding: 14, backgroundColor: theme.surface },
    primaryPreview: { width: 72, height: 88, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" },
    primaryImage: { width: "100%", height: "100%" },
    primaryPlaceholder: { color: theme.accent, fontSize: 30 },
    primaryCopy: { flex: 1, gap: 5 },
    primaryTitle: { color: theme.text, fontSize: 16, fontWeight: "900" },
    primaryText: { color: theme.muted, fontSize: 12, lineHeight: 18 },
    counterRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 9 },
    sectionTitle: { color: theme.text, fontSize: 18, fontWeight: "800" },
    counter: { color: theme.accent, fontSize: 11, fontWeight: "800" },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    imageCard: { width: "31.7%", gap: 6 },
    image: { width: "100%", aspectRatio: 0.76, borderRadius: 12, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
    imagePrimary: { borderColor: theme.accent },
    primaryBadge: { position: "absolute", top: 6, left: 6, color: theme.background, backgroundColor: theme.accent, borderRadius: 9, overflow: "hidden", paddingHorizontal: 6, paddingVertical: 3, fontSize: 8, fontWeight: "900" },
    imageActions: { gap: 4 },
    secondaryAction: { minHeight: 44, borderWidth: 1, borderColor: theme.border, borderRadius: 9, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
    secondaryActionText: { color: theme.text, fontSize: 8, fontWeight: "700", textAlign: "center" },
    primarySpacer: { minHeight: 44 },
    deleteAction: { minHeight: 44, alignItems: "center", justifyContent: "center" },
    deleteText: { color: "#E59A9A", fontSize: 9, fontWeight: "800" },
    empty: { minHeight: 170, borderWidth: 1, borderStyle: "dashed", borderColor: theme.border, borderRadius: 16, alignItems: "center", justifyContent: "center", gap: 5, padding: 22 },
    emptyTitle: { color: theme.text, fontSize: 16, fontWeight: "800" },
    emptyText: { color: theme.muted, fontSize: 12, textAlign: "center" },
    errorBox: { borderWidth: 1, borderColor: "#C84F4F55", backgroundColor: "#C84F4F12", borderRadius: 12, padding: 11 },
    error: { color: "#E59A9A", fontSize: 12, lineHeight: 18 },
    phase: { color: theme.accent, fontSize: 11, textAlign: "center", fontWeight: "800" },
    addButton: { backgroundColor: theme.accent, borderRadius: 14, minHeight: 54, alignItems: "center", justifyContent: "center" },
    addButtonText: { color: theme.background, fontSize: 14, fontWeight: "900" },
    disabled: { opacity: 0.45 },
    helper: { color: theme.muted, fontSize: 10, lineHeight: 16, textAlign: "center" },
  });
}
