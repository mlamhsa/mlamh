import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft, ChevronRight, Star, Trash2, X } from "lucide-react-native";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

import { ScreenSkeleton } from "@/components/ScreenSkeleton";
import { deleteTalentGalleryImage, getTalentProfile, reorderTalentGallery, setTalentPrimaryImage, uploadTalentGalleryBuffer } from "@/lib/api";
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
  const { width: viewportWidth } = useWindowDimensions();
  const [gallery, setGallery] = useState<string[]>([]);
  const [primaryUrl, setPrimaryUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyUrl, setBusyUrl] = useState<string | null>(null);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;

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
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: true, allowsEditing: false, orderedSelection: true, selectionLimit: remaining, quality: 1 });
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

  async function moveSelected(delta: -1 | 1) {
    const target = selectedIndex + delta;
    if (busyUrl || target < 0 || target >= gallery.length) return;
    const previous = gallery;
    const next = [...gallery];
    const [moved] = next.splice(selectedIndex, 1);
    next.splice(target, 0, moved);
    setGallery(next);
    setSelectedIndex(target);
    setBusyUrl(moved);
    setError(null);
    try {
      const result = await reorderTalentGallery(next);
      if (!result.ok) {
        setGallery(previous);
        setSelectedIndex(selectedIndex);
        setError(isArabic ? "تعذر حفظ ترتيب الصور." : "Unable to save the new photo order.");
      } else setGallery(result.gallery);
    } catch {
      setGallery(previous);
      setSelectedIndex(selectedIndex);
      setError(isArabic ? "تعذر حفظ ترتيب الصور." : "Unable to save the new photo order.");
    } finally { setBusyUrl(null); }
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
      setSelectedIndex((current) => Math.max(0, Math.min(current, result.gallery.length - 1)));
      if (result.gallery.length === 0) setViewerOpen(false);
    } catch {
      setError(isArabic ? "تعذر حذف الصورة. حاول مرة أخرى." : "Unable to delete the image. Please try again.");
    } finally {
      setBusyUrl(null);
    }
  }

  function openViewer(index: number) {
    setSelectedIndex(index);
    setViewerOpen(true);
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

  const selectedUrl = gallery[selectedIndex] ?? null;

  return <SafeAreaView style={styles.screen} edges={["top"]}>
    <ScrollView contentContainerStyle={[styles.content, { direction: isRtl ? "rtl" : "ltr" }]} showsVerticalScrollIndicator={false}>
      <View style={styles.top}>
        <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} hitSlop={8} style={styles.backButton}><BackIcon size={22} color={theme.text} strokeWidth={1.9} /></Pressable>
        <Text style={styles.brand}>{isArabic ? "ملامح" : "MLAMH"}</Text>
      </View>

      <View style={styles.header}>
        <Text style={styles.eyebrow}>{isArabic ? "الملف المهني" : "PORTFOLIO"}</Text>
        <Text accessibilityRole="header" style={styles.title}>{isArabic ? "الصور والأعمال" : "Portfolio media"}</Text>
        <Text style={styles.subtitle}>{isArabic ? "أضف صورك الاحترافية، افتحها بحجم كامل، ورتب الصورة التي تمثلك أولًا." : "Add professional images, view them full-screen and control the order that represents you best."}</Text>
      </View>

      <View style={styles.primaryCard}>
        <Pressable disabled={!primaryUrl} onPress={() => { const index = primaryUrl ? gallery.indexOf(primaryUrl) : -1; if (index >= 0) openViewer(index); }} style={styles.primaryPreview}>{primaryUrl ? <Image source={{ uri: primaryUrl }} style={styles.primaryImage} resizeMode="cover" /> : <Text style={styles.primaryPlaceholder}>＋</Text>}</Pressable>
        <View style={styles.primaryCopy}><Text style={styles.primaryTitle}>{isArabic ? "صورة الملف" : "Profile photo"}</Text><Text style={styles.primaryText}>{primaryUrl ? (isArabic ? "اضغط على الصورة لفتحها بالحجم الكامل." : "Tap the image to view it full-screen.") : (isArabic ? "أول صورة ترفعها ستصبح صورة ملفك تلقائيًا." : "Your first uploaded image becomes your profile photo automatically.")}</Text></View>
      </View>

      <View style={styles.counterRow}><Text style={styles.sectionTitle}>{isArabic ? "المعرض" : "Gallery"}</Text><Text style={styles.counter}>{gallery.length}/{MAX_GALLERY}</Text></View>

      {gallery.length ? <View style={styles.carouselSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={284} decelerationRate="fast" contentContainerStyle={styles.carouselContent}>
          {gallery.map((uri, index) => { const isPrimary = primaryUrl === uri; const selected = selectedIndex === index; return <Pressable key={`${uri}-${index}`} onPress={() => openViewer(index)} style={[styles.carouselCard, selected && styles.carouselCardSelected]}>
            <Image source={{ uri }} style={styles.carouselImage} resizeMode="cover" />
            <View style={styles.imageMeta}><Text style={styles.imagePosition}>{index + 1}/{gallery.length}</Text>{isPrimary ? <Text style={styles.primaryBadge}>{isArabic ? "الرئيسية" : "Primary"}</Text> : null}</View>
          </Pressable>; })}
        </ScrollView>
        <View style={styles.selectedActions}>
          <View style={styles.orderActions}>
            <Pressable accessibilityRole="button" disabled={selectedIndex === 0 || Boolean(busyUrl)} onPress={() => void moveSelected(-1)} style={[styles.orderButton, (selectedIndex === 0 || Boolean(busyUrl)) && styles.disabled]}><Text style={styles.orderButtonText}>{isArabic ? "السابق في الترتيب" : "Move earlier"}</Text></Pressable>
            <Pressable accessibilityRole="button" disabled={selectedIndex === gallery.length - 1 || Boolean(busyUrl)} onPress={() => void moveSelected(1)} style={[styles.orderButton, (selectedIndex === gallery.length - 1 || Boolean(busyUrl)) && styles.disabled]}><Text style={styles.orderButtonText}>{isArabic ? "التالي في الترتيب" : "Move later"}</Text></Pressable>
          </View>
          {selectedUrl && primaryUrl !== selectedUrl ? <Pressable disabled={Boolean(busyUrl)} onPress={() => void makePrimary(selectedUrl)} style={styles.primaryAction}><Text style={styles.primaryActionText}>{isArabic ? "تعيين كصورة رئيسية" : "Set as primary"}</Text></Pressable> : <View style={styles.primaryActive}><Text style={styles.primaryActiveText}>{isArabic ? "الصورة الرئيسية" : "Primary photo"}</Text></View>}
          {selectedUrl ? <Pressable disabled={Boolean(busyUrl)} onPress={() => confirmDelete(selectedUrl)} style={styles.deleteSelected}><Text style={styles.deleteText}>{isArabic ? "حذف الصورة" : "Delete photo"}</Text></Pressable> : null}
        </View>
      </View> : <View style={styles.empty}><Text style={styles.emptyTitle}>{isArabic ? "ابدأ معرضك" : "Start your portfolio"}</Text><Text style={styles.emptyText}>{isArabic ? "أضف أول صورة احترافية لملفك." : "Add the first professional image to your profile."}</Text></View>}

      {error ? <View style={styles.errorBox}><Text accessibilityRole="alert" style={styles.error}>{error}</Text></View> : null}
      {phaseLabel ? <Text style={styles.phase}>{phaseLabel}</Text> : null}

      <Pressable disabled={phase !== "idle" || gallery.length >= MAX_GALLERY} onPress={() => void addImage()} style={[styles.addButton, (phase !== "idle" || gallery.length >= MAX_GALLERY) && styles.disabled]}>
        {phase !== "idle" ? <ActivityIndicator color={theme.background} /> : <Text style={styles.addButtonText}>{isArabic ? "إضافة صور" : "Add photos"}</Text>}
      </Pressable>
      <Text style={styles.helper}>{isArabic ? "يمكنك اختيار عدة صور دفعة واحدة حتى حد 12 صورة. يتم تحسين الصور قبل الرفع." : "Select multiple images at once, up to the 12-image limit. Images are optimized before upload."}</Text>
    </ScrollView>

    <Modal visible={viewerOpen && gallery.length > 0} animationType="fade" presentationStyle="fullScreen" onRequestClose={() => setViewerOpen(false)}>
      <SafeAreaView style={styles.viewerScreen} edges={["top", "bottom"]}>
        <View style={[styles.viewerTop, isRtl && styles.viewerRowRtl]}>
          <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "إغلاق" : "Close"} onPress={() => setViewerOpen(false)} style={styles.viewerIconButton}><X size={22} color={theme.text} strokeWidth={2} /></Pressable>
          <View style={styles.viewerCounter}><Text style={styles.viewerCounterText}>{selectedIndex + 1} / {gallery.length}</Text></View>
          <View style={styles.viewerIconSpacer} />
        </View>

        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: selectedIndex * viewportWidth, y: 0 }}
          onMomentumScrollEnd={(event) => {
            const next = Math.round(event.nativeEvent.contentOffset.x / Math.max(1, viewportWidth));
            setSelectedIndex(Math.max(0, Math.min(next, gallery.length - 1)));
          }}
          style={styles.viewerPager}
        >
          {gallery.map((uri, index) => <View key={`viewer-${uri}-${index}`} style={[styles.viewerPage, { width: viewportWidth }]}><Image source={{ uri }} style={styles.viewerImage} resizeMode="contain" /></View>)}
        </ScrollView>

        <View style={styles.viewerFooter}>
          {selectedUrl && primaryUrl === selectedUrl ? <View style={styles.viewerPrimaryBadge}><Star size={16} color={theme.accent} fill={theme.accent} /><Text style={styles.viewerPrimaryText}>{isArabic ? "الصورة الرئيسية" : "Primary photo"}</Text></View> : selectedUrl ? <Pressable disabled={Boolean(busyUrl)} onPress={() => void makePrimary(selectedUrl)} style={styles.viewerPrimaryAction}><Star size={17} color={theme.background} /><Text style={styles.viewerPrimaryActionText}>{isArabic ? "تعيين كرئيسية" : "Set as primary"}</Text></Pressable> : null}
          {selectedUrl ? <Pressable disabled={Boolean(busyUrl)} onPress={() => confirmDelete(selectedUrl)} style={styles.viewerDelete}><Trash2 size={18} color="#E59A9A" /><Text style={styles.viewerDeleteText}>{isArabic ? "حذف" : "Delete"}</Text></Pressable> : null}
        </View>
      </SafeAreaView>
    </Modal>
  </SafeAreaView>;
}

function createStyles(theme: typeof darkTheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background },
    content: { width: "100%", maxWidth: 680, alignSelf: "center", paddingHorizontal: 18, paddingTop: 8, paddingBottom: 54, gap: 16 },
    top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 48 },
    backButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" },
    brand: { color: theme.accent, fontSize: 15, fontWeight: "900", letterSpacing: 1.6 },
    header: { gap: 7 },
    eyebrow: { color: theme.accent, fontSize: 9, fontWeight: "900", letterSpacing: 1.5 },
    title: { color: theme.text, fontSize: 28, lineHeight: 34, fontWeight: "800" },
    subtitle: { color: theme.muted, fontSize: 13, lineHeight: 21 },
    primaryCard: { flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1, borderColor: "#C9A96233", borderRadius: 20, padding: 14, backgroundColor: theme.surface },
    primaryPreview: { width: 76, height: 94, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" },
    primaryImage: { width: "100%", height: "100%" },
    primaryPlaceholder: { color: theme.accent, fontSize: 30 },
    primaryCopy: { flex: 1, gap: 5 },
    primaryTitle: { color: theme.text, fontSize: 16, fontWeight: "900" },
    primaryText: { color: theme.muted, fontSize: 12, lineHeight: 18 },
    counterRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 9 },
    sectionTitle: { color: theme.text, fontSize: 18, fontWeight: "800" },
    counter: { color: theme.accent, fontSize: 11, fontWeight: "800" },
    carouselSection: { gap: 14 },
    carouselContent: { gap: 12, paddingRight: 18 },
    carouselCard: { width: 272, borderRadius: 20, borderWidth: 1, borderColor: theme.border, overflow: "hidden", backgroundColor: theme.surface },
    carouselCardSelected: { borderColor: theme.accent },
    carouselImage: { width: "100%", aspectRatio: 0.78, backgroundColor: theme.surface },
    imageMeta: { minHeight: 42, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    imagePosition: { color: theme.muted, fontSize: 11, fontWeight: "800" },
    primaryBadge: { color: theme.background, backgroundColor: theme.accent, borderRadius: 9, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 4, fontSize: 8, fontWeight: "900" },
    selectedActions: { borderWidth: 1, borderColor: theme.border, borderRadius: 18, padding: 12, gap: 10, backgroundColor: theme.surface },
    orderActions: { flexDirection: "row", gap: 8 },
    orderButton: { flex: 1, minHeight: 44, borderWidth: 1, borderColor: theme.border, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
    orderButtonText: { color: theme.text, fontSize: 11, fontWeight: "800", textAlign: "center" },
    primaryAction: { minHeight: 48, borderRadius: 12, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" },
    primaryActionText: { color: theme.background, fontSize: 13, fontWeight: "900" },
    primaryActive: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: theme.accent, backgroundColor: "#C9A96212", alignItems: "center", justifyContent: "center" },
    primaryActiveText: { color: theme.accent, fontSize: 13, fontWeight: "900" },
    deleteSelected: { minHeight: 44, alignItems: "center", justifyContent: "center" },
    deleteText: { color: "#E59A9A", fontSize: 11, fontWeight: "800" },
    empty: { minHeight: 170, borderWidth: 1, borderStyle: "dashed", borderColor: theme.border, borderRadius: 18, alignItems: "center", justifyContent: "center", gap: 5, padding: 22 },
    emptyTitle: { color: theme.text, fontSize: 16, fontWeight: "800" },
    emptyText: { color: theme.muted, fontSize: 12, textAlign: "center" },
    errorBox: { borderWidth: 1, borderColor: "#C84F4F55", backgroundColor: "#C84F4F12", borderRadius: 12, padding: 11 },
    error: { color: "#E59A9A", fontSize: 12, lineHeight: 18 },
    phase: { color: theme.accent, fontSize: 11, textAlign: "center", fontWeight: "800" },
    addButton: { backgroundColor: theme.accent, borderRadius: 14, minHeight: 54, alignItems: "center", justifyContent: "center" },
    addButtonText: { color: theme.background, fontSize: 14, fontWeight: "900" },
    disabled: { opacity: 0.45 },
    helper: { color: theme.muted, fontSize: 10, lineHeight: 16, textAlign: "center" },
    viewerScreen: { flex: 1, backgroundColor: "#000" },
    viewerTop: { minHeight: 58, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    viewerRowRtl: { flexDirection: "row-reverse" },
    viewerIconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#151515", alignItems: "center", justifyContent: "center" },
    viewerIconSpacer: { width: 44, height: 44 },
    viewerCounter: { minHeight: 34, borderRadius: 17, backgroundColor: "#151515", paddingHorizontal: 14, alignItems: "center", justifyContent: "center" },
    viewerCounterText: { color: theme.text, fontSize: 12, fontWeight: "800" },
    viewerPager: { flex: 1 },
    viewerPage: { flex: 1, alignItems: "center", justifyContent: "center" },
    viewerImage: { width: "100%", height: "100%" },
    viewerFooter: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 10, flexDirection: "row", alignItems: "center", gap: 10 },
    viewerPrimaryAction: { flex: 1, minHeight: 50, borderRadius: 14, backgroundColor: theme.accent, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
    viewerPrimaryActionText: { color: theme.background, fontSize: 13, fontWeight: "900" },
    viewerPrimaryBadge: { flex: 1, minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: theme.accent, backgroundColor: "#C9A96212", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
    viewerPrimaryText: { color: theme.accent, fontSize: 13, fontWeight: "900" },
    viewerDelete: { minWidth: 98, minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: "#C84F4F66", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
    viewerDeleteText: { color: "#E59A9A", fontSize: 12, fontWeight: "900" },
  });
}
