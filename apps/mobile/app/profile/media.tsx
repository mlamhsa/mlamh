import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from "react-native";
import { router } from "expo-router";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

import { getTalentProfile, uploadTalentGalleryBuffer } from "@/lib/api";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { darkTheme, lightTheme } from "@/lib/theme";

const MAX_GALLERY = 12;

export default function TalentMediaScreen() {
  const locale = getDeviceLocale();
  const theme = useColorScheme() === "dark" ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [gallery, setGallery] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const result = await getTalentProfile(locale);
      if (!result.ok) {
        if (result.code === "UNAUTHENTICATED") router.replace({ pathname: "/login", params: { next: "/profile/media" } });
        else setError(locale === "ar" ? "تعذر تحميل الصور." : "Unable to load your media.");
      } else setGallery(result.item.gallery);
      setLoading(false);
    })();
  }, [locale]);

  async function addImage() {
    if (uploading || gallery.length >= MAX_GALLERY) return;
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(locale === "ar" ? "نحتاج إذن الوصول للصور لاختيار صورة من جهازك." : "Photo access is required to choose an image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: false, quality: 1, selectionLimit: 1 });
    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      const actions = asset.width > 2000 ? [{ resize: { width: 2000 } }] : [];
      const normalized = await ImageManipulator.manipulateAsync(asset.uri, actions, { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG });
      const localResponse = await fetch(normalized.uri);
      const buffer = await localResponse.arrayBuffer();
      if (buffer.byteLength > 10 * 1024 * 1024) {
        setError(locale === "ar" ? "حجم الصورة كبير جدًا بعد المعالجة." : "The image is still too large after processing.");
        return;
      }
      const upload = await uploadTalentGalleryBuffer(buffer, "image/jpeg");
      if (!upload.ok) {
        const message = upload.code === "GALLERY_LIMIT"
          ? (locale === "ar" ? "وصلت للحد الأقصى للصور." : "You reached the gallery limit.")
          : (locale === "ar" ? "تعذر رفع الصورة. حاول مرة أخرى." : "Unable to upload the image. Please try again.");
        setError(message);
        return;
      }
      setGallery(upload.gallery);
    } catch {
      setError(locale === "ar" ? "تعذر تجهيز الصورة أو رفعها." : "Unable to process or upload the image.");
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.accent} /></View>;

  return <View style={styles.screen}><ScrollView contentContainerStyle={[styles.content, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]}>
    <Pressable onPress={() => router.back()} hitSlop={12}><Text style={styles.back}>{locale === "ar" ? "رجوع" : "Back"}</Text></Pressable>
    <View style={styles.header}><Text style={styles.eyebrow}>MLAMH</Text><Text style={styles.title}>{locale === "ar" ? "الصور والأعمال" : "Portfolio media"}</Text><Text style={styles.subtitle}>{locale === "ar" ? "أضف صورًا قوية ومتنوعة تعكس حضورك المهني. يتم تحسين الصور قبل الرفع." : "Add strong, varied images that represent your professional presence. Images are optimized before upload."}</Text></View>

    <View style={styles.counterRow}><Text style={styles.sectionTitle}>{locale === "ar" ? "معرضك" : "Your gallery"}</Text><Text style={styles.counter}>{gallery.length}/{MAX_GALLERY}</Text></View>
    {gallery.length ? <View style={styles.grid}>{gallery.map((uri, index) => <Image key={`${uri}-${index}`} source={{ uri }} style={styles.image} resizeMode="cover" />)}</View> : <View style={styles.empty}><Text style={styles.emptyText}>{locale === "ar" ? "لا توجد صور في المعرض بعد." : "Your gallery is empty."}</Text></View>}

    {error ? <Text style={styles.error}>{error}</Text> : null}
    <Pressable disabled={uploading || gallery.length >= MAX_GALLERY} onPress={() => void addImage()} style={({ pressed }) => [styles.addButton, (pressed || uploading || gallery.length >= MAX_GALLERY) && styles.disabled]}><Text style={styles.addButtonText}>{uploading ? (locale === "ar" ? "جارٍ تجهيز ورفع الصورة…" : "Processing and uploading…") : (locale === "ar" ? "+ إضافة صورة" : "+ Add image")}</Text></Pressable>
    <Text style={styles.helper}>{locale === "ar" ? "JPEG / PNG / WebP · يتم تحويل الصورة المرفوعة إلى JPEG محسّن." : "JPEG / PNG / WebP · selected images are normalized to optimized JPEG."}</Text>
  </ScrollView></View>;
}

function createStyles(theme: typeof lightTheme | typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }, content: { paddingHorizontal: 18, paddingTop: 58, paddingBottom: 50, gap: 18 }, back: { color: theme.accent, fontSize: 14, fontWeight: "700" }, header: { gap: 9 }, eyebrow: { color: theme.accent, fontSize: 12, fontWeight: "800", letterSpacing: 2.2 }, title: { color: theme.text, fontSize: 36, fontWeight: "300" }, subtitle: { color: theme.muted, fontSize: 14, lineHeight: 22 }, counterRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, sectionTitle: { color: theme.text, fontSize: 20, fontWeight: "600" }, counter: { color: theme.accent, fontSize: 13, fontWeight: "700" }, grid: { flexDirection: "row", flexWrap: "wrap", gap: 9 }, image: { width: "31.5%", aspectRatio: 0.76, borderRadius: 18, backgroundColor: theme.surface }, empty: { minHeight: 180, borderWidth: 1, borderStyle: "dashed", borderColor: theme.border, borderRadius: 24, alignItems: "center", justifyContent: "center", padding: 24 }, emptyText: { color: theme.muted, fontSize: 14, textAlign: "center" }, error: { color: "#EF8B8B", fontSize: 13, lineHeight: 20 }, addButton: { backgroundColor: theme.accent, borderRadius: 18, paddingVertical: 16, alignItems: "center" }, addButtonText: { color: "#181818", fontSize: 15, fontWeight: "800" }, disabled: { opacity: 0.48 }, helper: { color: theme.muted, fontSize: 10, lineHeight: 16, textAlign: "center" }
}); }
