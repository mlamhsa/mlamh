import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from "react-native";
import { router } from "expo-router";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

import { deleteTalentGalleryImage, getTalentProfile, setTalentPrimaryImage, uploadTalentGalleryBuffer } from "@/lib/api";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { darkTheme, lightTheme } from "@/lib/theme";

const MAX_GALLERY = 12;

export default function TalentMediaScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const theme = useColorScheme() === "dark" ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [gallery, setGallery] = useState<string[]>([]);
  const [primaryUrl, setPrimaryUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyUrl, setBusyUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
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

  async function addImage() {
    if (uploading || gallery.length >= MAX_GALLERY) return;
    setError(null);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError(isArabic ? "نحتاج إذن الوصول للصور لاختيار صورة من جهازك." : "Photo access is required to choose an image.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: false, quality: 1, selectionLimit: 1 });
      if (result.canceled || !result.assets[0]) return;

      setUploading(true);
      const asset = result.assets[0];
      const actions = asset.width > 2000 ? [{ resize: { width: 2000 } }] : [];
      const normalized = await ImageManipulator.manipulateAsync(asset.uri, actions, { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG });
      const localResponse = await fetch(normalized.uri);
      const buffer = await localResponse.arrayBuffer();
      if (buffer.byteLength > 10 * 1024 * 1024) {
        setError(isArabic ? "حجم الصورة كبير جدًا بعد المعالجة." : "The image is still too large after processing.");
        return;
      }
      const upload = await uploadTalentGalleryBuffer(buffer, "image/jpeg");
      if (!upload.ok) {
        setError(upload.code === "GALLERY_LIMIT" ? (isArabic ? "وصلت للحد الأقصى للصور." : "You reached the gallery limit.") : (isArabic ? "تعذر رفع الصورة. حاول مرة أخرى." : "Unable to upload the image. Please try again."));
        return;
      }
      setGallery(upload.gallery);
    } catch {
      setError(isArabic ? "تعذر تجهيز الصورة أو رفعها." : "Unable to process or upload the image.");
    } finally {
      setUploading(false);
    }
  }

  async function makePrimary(url: string) {
    if (busyUrl) return;
    setBusyUrl(url); setError(null);
    try {
      const result = await setTalentPrimaryImage(url);
      if (!result.ok) { setError(isArabic ? "تعذر تعيين الصورة الرئيسية." : "Unable to set the primary image."); return; }
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
    setBusyUrl(url); setError(null);
    try {
      const result = await deleteTalentGalleryImage(url);
      if (!result.ok) { setError(isArabic ? "تعذر حذف الصورة." : "Unable to delete the image."); return; }
      setGallery(result.gallery);
      setPrimaryUrl(result.primaryUrl);
    } catch {
      setError(isArabic ? "تعذر حذف الصورة. حاول مرة أخرى." : "Unable to delete the image. Please try again.");
    } finally {
      setBusyUrl(null);
    }
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator accessibilityLabel={isArabic ? "جارٍ تحميل الصور" : "Loading media"} size="large" color={theme.accent} /></View>;

  return <View style={styles.screen}><ScrollView contentContainerStyle={[styles.content, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]} contentInsetAdjustmentBehavior="automatic">
    <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} hitSlop={12}><Text style={styles.back}>{isArabic ? "رجوع" : "Back"}</Text></Pressable>
    <View style={styles.header}><Text style={styles.eyebrow}>MLAMH</Text><Text accessibilityRole="header" style={styles.title}>{isArabic ? "الصور والأعمال" : "Portfolio media"}</Text><Text style={styles.subtitle}>{isArabic ? "أضف صورًا قوية، اختر الصورة الرئيسية، واحذف ما لم يعد يمثل ملفك." : "Add strong images, choose your primary image, and remove what no longer represents your portfolio."}</Text></View>

    <View style={styles.counterRow}><Text style={styles.sectionTitle}>{isArabic ? "معرضك" : "Your gallery"}</Text><Text accessibilityLabel={isArabic ? `${gallery.length} من ${MAX_GALLERY} صورة` : `${gallery.length} of ${MAX_GALLERY} images`} style={styles.counter}>{gallery.length}/{MAX_GALLERY}</Text></View>
    {gallery.length ? <View style={styles.grid}>{gallery.map((uri, index) => {
      const isPrimary = primaryUrl === uri;
      const busy = busyUrl === uri;
      const imageLabel = isArabic ? `صورة المعرض ${index + 1}${isPrimary ? "، الصورة الرئيسية" : ""}` : `Gallery image ${index + 1}${isPrimary ? ", primary image" : ""}`;
      return <View key={`${uri}-${index}`} style={styles.imageCard}><Image accessibilityLabel={imageLabel} source={{ uri }} style={styles.image} resizeMode="cover" />{isPrimary ? <Text style={styles.primaryBadge}>{isArabic ? "الرئيسية" : "Primary"}</Text> : null}<View style={styles.imageActions}>{!isPrimary ? <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? `تعيين الصورة ${index + 1} رئيسية` : `Set image ${index + 1} as primary`} accessibilityState={{ disabled: Boolean(busyUrl), busy }} disabled={Boolean(busyUrl)} onPress={() => void makePrimary(uri)} style={styles.smallButton}><Text style={styles.smallButtonText}>{busy ? "…" : (isArabic ? "رئيسية" : "Primary")}</Text></Pressable> : null}<Pressable accessibilityRole="button" accessibilityLabel={isArabic ? `حذف الصورة ${index + 1}` : `Delete image ${index + 1}`} accessibilityState={{ disabled: Boolean(busyUrl) }} disabled={Boolean(busyUrl)} onPress={() => confirmDelete(uri)} style={styles.deleteButton}><Text style={styles.deleteText}>{isArabic ? "حذف" : "Delete"}</Text></Pressable></View></View>;
    })}</View> : <View style={styles.empty}><Text style={styles.emptyText}>{isArabic ? "لا توجد صور في المعرض بعد." : "Your gallery is empty."}</Text></View>}

    {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
    <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "إضافة صورة" : "Add image"} accessibilityState={{ disabled: uploading || gallery.length >= MAX_GALLERY, busy: uploading }} disabled={uploading || gallery.length >= MAX_GALLERY} onPress={() => void addImage()} style={({ pressed }) => [styles.addButton, (pressed || uploading || gallery.length >= MAX_GALLERY) && styles.disabled]}><Text style={styles.addButtonText}>{uploading ? (isArabic ? "جارٍ تجهيز ورفع الصورة…" : "Processing and uploading…") : (isArabic ? "+ إضافة صورة" : "+ Add image")}</Text></Pressable>
    <Text style={styles.helper}>{isArabic ? "يتم تحسين الصورة وتحويلها إلى JPEG قبل الرفع. الحد الأقصى 12 صورة." : "Images are optimized and normalized to JPEG before upload. Maximum 12 images."}</Text>
  </ScrollView></View>;
}

function createStyles(theme: typeof lightTheme | typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }, content: { paddingHorizontal: 18, paddingTop: 58, paddingBottom: 50, gap: 18 }, back: { color: theme.accent, fontSize: 14, fontWeight: "700", paddingVertical: 8 }, header: { gap: 9 }, eyebrow: { color: theme.accent, fontSize: 12, fontWeight: "800", letterSpacing: 2.2 }, title: { color: theme.text, fontSize: 36, fontWeight: "300" }, subtitle: { color: theme.muted, fontSize: 14, lineHeight: 22 }, counterRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, sectionTitle: { color: theme.text, fontSize: 20, fontWeight: "600" }, counter: { color: theme.accent, fontSize: 13, fontWeight: "700" }, grid: { flexDirection: "row", flexWrap: "wrap", gap: 9 }, imageCard: { width: "31.5%", gap: 6 }, image: { width: "100%", aspectRatio: 0.76, borderRadius: 18, backgroundColor: theme.surface }, primaryBadge: { position: "absolute", top: 7, left: 7, color: "#181818", backgroundColor: theme.accent, borderRadius: 10, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 4, fontSize: 8, fontWeight: "800" }, imageActions: { gap: 5 }, smallButton: { borderWidth: 1, borderColor: theme.accent, borderRadius: 10, minHeight: 44, paddingHorizontal: 6, paddingVertical: 8, alignItems: "center", justifyContent: "center" }, smallButtonText: { color: theme.accent, fontSize: 9, fontWeight: "700" }, deleteButton: { borderWidth: 1, borderColor: "rgba(239,68,68,0.4)", borderRadius: 10, minHeight: 44, paddingHorizontal: 6, paddingVertical: 8, alignItems: "center", justifyContent: "center" }, deleteText: { color: "#EF8B8B", fontSize: 9, fontWeight: "700" }, empty: { minHeight: 180, borderWidth: 1, borderStyle: "dashed", borderColor: theme.border, borderRadius: 24, alignItems: "center", justifyContent: "center", padding: 24 }, emptyText: { color: theme.muted, fontSize: 14, textAlign: "center" }, error: { color: "#EF8B8B", fontSize: 13, lineHeight: 20 }, addButton: { backgroundColor: theme.accent, borderRadius: 18, minHeight: 52, paddingVertical: 16, alignItems: "center", justifyContent: "center" }, addButtonText: { color: "#181818", fontSize: 15, fontWeight: "800" }, disabled: { opacity: 0.48 }, helper: { color: theme.muted, fontSize: 10, lineHeight: 16, textAlign: "center" }
}); }
