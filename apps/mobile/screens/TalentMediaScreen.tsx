import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, ChevronRight, Images, Star, Trash2, X } from "lucide-react-native";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

import { DraggableGalleryStrip } from "@/components/DraggableGalleryStrip";
import { ScreenSkeleton } from "@/components/ScreenSkeleton";
import { deleteTalentGalleryImage, getTalentProfile, reorderTalentGallery, setTalentPrimaryImage, uploadTalentGalleryBuffer } from "@/lib/api";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { darkTheme } from "@/lib/theme";

const MAX_GALLERY = 12;
type UploadPhase = "idle" | "preparing" | "uploading" | "finalizing";

type Notice = { type: "success" | "error"; text: string } | null;

export default function TalentMediaScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const params = useLocalSearchParams<{ onboarding?: string | string[] }>();
  const onboardingParam = Array.isArray(params.onboarding) ? params.onboarding[0] : params.onboarding;
  const onboarding = onboardingParam === "1";
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { width: viewportWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = viewportWidth <= 360;
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;

  const [gallery, setGallery] = useState<string[]>([]);
  const [primaryUrl, setPrimaryUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyUrl, setBusyUrl] = useState<string | null>(null);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const result = await getTalentProfile(locale);
        if (!active) return;
        if (!result.ok) {
          if (result.code === "UNAUTHENTICATED") {
            router.replace({ pathname: "/login", params: { next: onboarding ? "/profile/media?onboarding=1" : "/profile/media" } });
          } else {
            setError(isArabic ? "تعذر تحميل الصور." : "Unable to load your media.");
          }
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
    return () => {
      active = false;
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, [isArabic, locale, onboarding]);

  function showNotice(next: Exclude<Notice, null>) {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setNotice(next);
    noticeTimer.current = setTimeout(() => setNotice(null), 2200);
  }

  function leaveMedia() {
    if (onboarding) router.replace("/profile/journey");
    else router.back();
  }

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
        const normalized = await ImageManipulator.manipulateAsync(asset.uri, actions, {
          compress: 0.82,
          format: ImageManipulator.SaveFormat.JPEG,
        });
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
            showNotice({ type: "success", text: isArabic ? "✓ تم تعيين أول صورة كصورة رئيسية" : "✓ First photo set as primary" });
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
      showNotice({ type: "success", text: isArabic ? "✓ تم تعيين الصورة الرئيسية" : "✓ Primary photo updated" });
    } catch {
      setError(isArabic ? "تعذر تعيين الصورة الرئيسية. حاول مرة أخرى." : "Unable to set the primary image. Please try again.");
    } finally {
      setBusyUrl(null);
    }
  }

  async function saveReorder(next: string[]) {
    if (busyUrl) return false;
    const previous = gallery;
    setGallery(next);
    setError(null);
    try {
      const result = await reorderTalentGallery(next);
      if (!result.ok) {
        setGallery(previous);
        setError(isArabic ? "تعذر حفظ ترتيب الصور." : "Unable to save the new photo order.");
        return false;
      }
      setGallery(result.gallery);
      const current = next[selectedIndex];
      const nextIndex = current ? result.gallery.indexOf(current) : selectedIndex;
      if (nextIndex >= 0) setSelectedIndex(nextIndex);
      showNotice({ type: "success", text: isArabic ? "✓ تم حفظ ترتيب الصور" : "✓ Photo order saved" });
      return true;
    } catch {
      setGallery(previous);
      setError(isArabic ? "تعذر حفظ ترتيب الصور." : "Unable to save the new photo order.");
      return false;
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

  if (loading) {
    return <ScreenSkeleton variant="profile" locale={locale} label={isArabic ? "جارٍ تحميل معرض الصور" : "Loading portfolio media"} />;
  }

  const progressSuffix = uploadProgress ? ` ${uploadProgress.current}/${uploadProgress.total}` : "";
  const phaseLabel = phase === "preparing"
    ? `${isArabic ? "جارٍ تجهيز الصورة" : "Preparing photo"}${progressSuffix}…`
    : phase === "uploading"
      ? `${isArabic ? "جارٍ رفع الصورة" : "Uploading photo"}${progressSuffix}…`
      : phase === "finalizing"
        ? `${isArabic ? "جارٍ تعيين صورة الملف" : "Setting profile photo"}${progressSuffix}…`
        : null;
  const selectedUrl = gallery[selectedIndex] ?? null;
  const textRtl = isRtl ? styles.textRtl : undefined;

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={[styles.content, compact && styles.contentCompact]} showsVerticalScrollIndicator={false}>
        <View style={[styles.top, isRtl && styles.rowRtl]}>
          <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={leaveMedia} hitSlop={8} style={styles.backButton}>
            <BackIcon size={22} color={theme.text} strokeWidth={1.9} />
          </Pressable>
          <Text style={styles.brand}>MLAMH</Text>
        </View>

        {onboarding ? (
          <View style={styles.onboardingProgress}>
            <View style={[styles.onboardingProgressCopy, isRtl && styles.rowRtl]}>
              <Text style={[styles.onboardingStep, textRtl]}>{isArabic ? "الخطوة 3 من 4" : "Step 3 of 4"}</Text>
              <Text style={styles.onboardingValue}>75%</Text>
            </View>
            <View style={styles.onboardingTrack}><View style={styles.onboardingFill} /></View>
          </View>
        ) : null}

        <View style={styles.header}>
          <View style={[styles.eyebrowRow, isRtl && styles.rowRtl]}><Images size={15} color={theme.accent} /><Text style={[styles.eyebrow, textRtl]}>{isArabic ? "معرضك المهني" : "YOUR PORTFOLIO"}</Text></View>
          <Text accessibilityRole="header" style={[styles.title, compact && styles.titleCompact, textRtl]}>{isArabic ? "صور تخلي ملفك يتكلم" : "Make every image count"}</Text>
          <Text style={[styles.subtitle, textRtl]}>{onboarding
            ? (isArabic ? "أضف صورة رئيسية واضحة الآن. تقدر تكمل معرضك لاحقًا؛ هدفنا أن يصبح ملفك جاهزًا للمراجعة." : "Add a clear primary photo now. You can build out the rest later; the goal is to get review-ready.")
            : (isArabic ? "رتّب أعمالك بالسحب، واختر الصورة الرئيسية التي تمثلك أمام الجهات." : "Drag to arrange your work and choose the primary photo that represents you to publishers.")}</Text>
        </View>

        {notice ? (
          <View accessibilityRole="alert" style={[styles.notice, notice.type === "success" ? styles.noticeSuccess : styles.noticeError]}>
            <Text style={[styles.noticeText, textRtl]}>{notice.text}</Text>
          </View>
        ) : null}

        <View style={[styles.primaryCard, compact && styles.primaryCardCompact, isRtl && styles.rowRtl]}>
          <Pressable disabled={!primaryUrl} onPress={() => { const index = primaryUrl ? gallery.indexOf(primaryUrl) : -1; if (index >= 0) openViewer(index); }} style={[styles.primaryPreview, compact && styles.primaryPreviewCompact]}>
            {primaryUrl ? <Image source={{ uri: primaryUrl }} style={styles.primaryImage} resizeMode="cover" /> : <Text style={styles.primaryPlaceholder}>＋</Text>}
          </Pressable>
          <View style={styles.primaryCopy}>
            <Text style={[styles.primaryTitle, textRtl]}>{isArabic ? "الصورة الرئيسية" : "Primary photo"}</Text>
            <Text style={[styles.primaryText, textRtl]}>{primaryUrl
              ? (isArabic ? "هذه أول صورة تراها الجهات في ملفك." : "This is the first image publishers see on your profile.")
              : (isArabic ? "أول صورة ترفعها ستصبح صورة ملفك تلقائيًا." : "Your first uploaded image becomes your profile photo automatically.")}</Text>
          </View>
        </View>

        <View style={[styles.counterRow, isRtl && styles.rowRtl]}>
          <View>
            <Text style={[styles.sectionTitle, textRtl]}>{isArabic ? "المعرض" : "Gallery"}</Text>
            <Text style={[styles.sectionHint, textRtl]}>{isArabic ? "اضغط مطولًا واسحب لترتيب الصور" : "Long press and drag to reorder"}</Text>
          </View>
          <Text style={styles.counter}>{gallery.length}/{MAX_GALLERY}</Text>
        </View>

        {gallery.length ? (
          <View style={styles.gallerySection}>
            <DraggableGalleryStrip
              items={gallery}
              primaryUrl={primaryUrl}
              locale={locale}
              isRtl={isRtl}
              disabled={Boolean(busyUrl) || phase !== "idle"}
              selectedIndex={selectedIndex}
              onSelect={setSelectedIndex}
              onOpen={openViewer}
              onReorder={saveReorder}
            />

            <View style={[styles.selectedActions, compact && styles.selectedActionsCompact]}>
              {selectedUrl && primaryUrl !== selectedUrl ? (
                <Pressable disabled={Boolean(busyUrl)} onPress={() => void makePrimary(selectedUrl)} style={styles.primaryAction}>
                  <Star size={16} color={theme.background} />
                  <Text style={styles.primaryActionText}>{isArabic ? "تعيين كصورة رئيسية" : "Set as primary"}</Text>
                </Pressable>
              ) : (
                <View style={styles.primaryActive}>
                  <Star size={15} color={theme.accent} fill={theme.accent} />
                  <Text style={styles.primaryActiveText}>{isArabic ? "هذه الصورة الرئيسية" : "Primary photo"}</Text>
                </View>
              )}
              {selectedUrl ? (
                <Pressable disabled={Boolean(busyUrl)} onPress={() => confirmDelete(selectedUrl)} style={styles.deleteSelected}>
                  <Trash2 size={16} color="#E59A9A" />
                  <Text style={styles.deleteText}>{isArabic ? "حذف الصورة" : "Delete photo"}</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : (
          <View style={[styles.empty, compact && styles.emptyCompact]}>
            <Images size={26} color={theme.accent} />
            <Text style={styles.emptyTitle}>{isArabic ? "ابدأ معرضك" : "Start your portfolio"}</Text>
            <Text style={styles.emptyText}>{isArabic ? "أضف أول صورة احترافية لملفك." : "Add the first professional image to your profile."}</Text>
          </View>
        )}

        {error ? <View style={styles.errorBox}><Text accessibilityRole="alert" style={[styles.error, textRtl]}>{error}</Text></View> : null}
        {phaseLabel ? <Text style={styles.phase}>{phaseLabel}</Text> : null}

        <Pressable disabled={phase !== "idle" || gallery.length >= MAX_GALLERY} onPress={() => void addImage()} style={[styles.addButton, (phase !== "idle" || gallery.length >= MAX_GALLERY) && styles.disabled]}>
          {phase !== "idle" ? <ActivityIndicator color={theme.background} /> : <Text style={styles.addButtonText}>{isArabic ? "إضافة صور" : "Add photos"}</Text>}
        </Pressable>
        <Text style={styles.helper}>{isArabic ? "حتى 12 صورة. يتم تحسين الصور تلقائيًا قبل الرفع." : "Up to 12 images. Photos are optimized automatically before upload."}</Text>

        {onboarding ? (
          <View style={styles.onboardingActions}>
            {primaryUrl ? (
              <Pressable accessibilityRole="button" onPress={() => router.replace("/profile/journey")} style={styles.onboardingDone}>
                <Text style={styles.onboardingDoneText}>{isArabic ? "حفظ الصور والمتابعة" : "Save photos and continue"}</Text>
              </Pressable>
            ) : (
              <View style={styles.onboardingPending}><Text style={[styles.onboardingPendingText, textRtl]}>{isArabic ? "أضف صورة رئيسية واحدة على الأقل لإكمال هذه الخطوة." : "Add at least one primary photo to complete this step."}</Text></View>
            )}
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={viewerOpen && gallery.length > 0} animationType="fade" presentationStyle="fullScreen" onRequestClose={() => setViewerOpen(false)}>
        <View style={[styles.viewerScreen, { paddingTop: Math.max(insets.top, 12), paddingBottom: Math.max(insets.bottom, 10) }]}>
          <View style={[styles.viewerTop, isRtl && styles.rowRtl]}>
            <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "إغلاق عارض الصور" : "Close photo viewer"} hitSlop={12} onPress={() => setViewerOpen(false)} style={[styles.viewerCloseButton, isRtl && styles.rowRtl]}>
              <X size={20} color={theme.text} strokeWidth={2} /><Text style={styles.viewerCloseText}>{isArabic ? "إغلاق" : "Close"}</Text>
            </Pressable>
            <View style={styles.viewerCounter}><Text style={styles.viewerCounterText}>{selectedIndex + 1} / {gallery.length}</Text></View>
          </View>

          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} contentOffset={{ x: selectedIndex * viewportWidth, y: 0 }} onMomentumScrollEnd={(event) => {
            const next = Math.round(event.nativeEvent.contentOffset.x / Math.max(1, viewportWidth));
            setSelectedIndex(Math.max(0, Math.min(next, gallery.length - 1)));
          }} style={styles.viewerPager}>
            {gallery.map((uri, index) => <View key={`viewer-${uri}-${index}`} style={[styles.viewerPage, { width: viewportWidth }]}><Image source={{ uri }} style={styles.viewerImage} resizeMode="contain" /></View>)}
          </ScrollView>

          <View style={[styles.viewerFooter, isRtl && styles.rowRtl]}>
            {selectedUrl && primaryUrl === selectedUrl ? (
              <View style={[styles.viewerPrimaryBadge, isRtl && styles.rowRtl]}><Star size={16} color={theme.accent} fill={theme.accent} /><Text style={styles.viewerPrimaryText}>{isArabic ? "الصورة الرئيسية" : "Primary photo"}</Text></View>
            ) : selectedUrl ? (
              <Pressable disabled={Boolean(busyUrl)} onPress={() => void makePrimary(selectedUrl)} style={[styles.viewerPrimaryAction, isRtl && styles.rowRtl]}><Star size={17} color={theme.background} /><Text style={styles.viewerPrimaryActionText}>{isArabic ? "تعيين كرئيسية" : "Set as primary"}</Text></Pressable>
            ) : null}
            {selectedUrl ? <Pressable disabled={Boolean(busyUrl)} onPress={() => confirmDelete(selectedUrl)} style={[styles.viewerDelete, isRtl && styles.rowRtl]}><Trash2 size={18} color="#E59A9A" /><Text style={styles.viewerDeleteText}>{isArabic ? "حذف" : "Delete"}</Text></Pressable> : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(theme: typeof darkTheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background },
    content: { width: "100%", maxWidth: 680, alignSelf: "center", paddingHorizontal: 18, paddingTop: 8, paddingBottom: 36, gap: 16 },
    contentCompact: { paddingHorizontal: 13, gap: 13 },
    rowRtl: { flexDirection: "row-reverse" },
    textRtl: { textAlign: "right", writingDirection: "rtl" },
    top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 48 },
    backButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" },
    brand: { color: theme.accent, fontSize: 12, fontWeight: "900", letterSpacing: 2.2 },
    onboardingProgress: { borderWidth: 1, borderColor: "#C9A96233", borderRadius: 16, backgroundColor: "#C9A96208", padding: 12, gap: 9 },
    onboardingProgressCopy: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    onboardingStep: { color: theme.text, fontSize: 11, fontWeight: "800" },
    onboardingValue: { color: theme.accent, fontSize: 11, fontWeight: "900" },
    onboardingTrack: { height: 4, borderRadius: 2, backgroundColor: "#FFFFFF12", overflow: "hidden" },
    onboardingFill: { width: "75%", height: "100%", borderRadius: 2, backgroundColor: theme.accent },
    header: { gap: 7 },
    eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 7 },
    eyebrow: { color: theme.accent, fontSize: 9, fontWeight: "900", letterSpacing: 1.3 },
    title: { color: theme.text, fontSize: 29, lineHeight: 35, fontWeight: "800" },
    titleCompact: { fontSize: 26, lineHeight: 31 },
    subtitle: { color: theme.muted, fontSize: 13, lineHeight: 21 },
    notice: { borderRadius: 13, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 10 },
    noticeSuccess: { borderColor: "#C9A96255", backgroundColor: "#C9A96210" },
    noticeError: { borderColor: "#C84F4F55", backgroundColor: "#C84F4F12" },
    noticeText: { color: theme.text, fontSize: 11, fontWeight: "800" },
    primaryCard: { flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1, borderColor: "#C9A96233", borderRadius: 18, padding: 12, backgroundColor: theme.surface },
    primaryCardCompact: { gap: 10, padding: 10 },
    primaryPreview: { width: 66, height: 84, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" },
    primaryPreviewCompact: { width: 60, height: 76 },
    primaryImage: { width: "100%", height: "100%" },
    primaryPlaceholder: { color: theme.accent, fontSize: 28 },
    primaryCopy: { flex: 1, gap: 5 },
    primaryTitle: { color: theme.text, fontSize: 15, fontWeight: "900" },
    primaryText: { color: theme.muted, fontSize: 11, lineHeight: 18 },
    counterRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 10 },
    sectionTitle: { color: theme.text, fontSize: 18, fontWeight: "800" },
    sectionHint: { color: theme.muted, fontSize: 9, marginTop: 3 },
    counter: { color: theme.accent, fontSize: 11, fontWeight: "800" },
    gallerySection: { gap: 12 },
    selectedActions: { borderWidth: 1, borderColor: theme.border, borderRadius: 16, padding: 10, gap: 8, backgroundColor: theme.surface },
    selectedActionsCompact: { padding: 9 },
    primaryAction: { minHeight: 47, borderRadius: 12, backgroundColor: theme.accent, flexDirection: "row", gap: 7, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
    primaryActionText: { color: theme.background, fontSize: 12, fontWeight: "900" },
    primaryActive: { minHeight: 47, borderRadius: 12, borderWidth: 1, borderColor: theme.accent, backgroundColor: "#C9A96212", flexDirection: "row", gap: 7, alignItems: "center", justifyContent: "center" },
    primaryActiveText: { color: theme.accent, fontSize: 12, fontWeight: "900" },
    deleteSelected: { minHeight: 40, flexDirection: "row", gap: 7, alignItems: "center", justifyContent: "center" },
    deleteText: { color: "#E59A9A", fontSize: 11, fontWeight: "800" },
    empty: { minHeight: 160, borderWidth: 1, borderStyle: "dashed", borderColor: theme.border, borderRadius: 18, alignItems: "center", justifyContent: "center", gap: 7, padding: 20 },
    emptyCompact: { minHeight: 145, padding: 16 },
    emptyTitle: { color: theme.text, fontSize: 16, fontWeight: "800" },
    emptyText: { color: theme.muted, fontSize: 12, textAlign: "center" },
    errorBox: { borderWidth: 1, borderColor: "#C84F4F55", backgroundColor: "#C84F4F12", borderRadius: 12, padding: 11 },
    error: { color: "#E59A9A", fontSize: 12, lineHeight: 18 },
    phase: { color: theme.accent, fontSize: 11, textAlign: "center", fontWeight: "800" },
    addButton: { backgroundColor: theme.accent, borderRadius: 14, minHeight: 54, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
    addButtonText: { color: theme.background, fontSize: 14, fontWeight: "900" },
    disabled: { opacity: 0.45 },
    helper: { color: theme.muted, fontSize: 10, lineHeight: 16, textAlign: "center" },
    onboardingActions: { gap: 8, paddingTop: 2 },
    onboardingDone: { minHeight: 54, borderRadius: 14, borderWidth: 1, borderColor: theme.accent, backgroundColor: "#C9A96212", alignItems: "center", justifyContent: "center", paddingHorizontal: 14 },
    onboardingDoneText: { color: theme.accent, fontSize: 14, fontWeight: "900", textAlign: "center" },
    onboardingPending: { borderRadius: 14, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, padding: 12 },
    onboardingPendingText: { color: theme.muted, fontSize: 11, lineHeight: 17 },
    viewerScreen: { flex: 1, backgroundColor: "#000" },
    viewerTop: { minHeight: 66, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", zIndex: 5 },
    viewerCloseButton: { minWidth: 94, height: 44, borderRadius: 22, backgroundColor: "#171717", borderWidth: 1, borderColor: "#FFFFFF18", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 12 },
    viewerCloseText: { color: theme.text, fontSize: 12, fontWeight: "800" },
    viewerCounter: { minHeight: 36, borderRadius: 18, backgroundColor: "#151515", paddingHorizontal: 14, alignItems: "center", justifyContent: "center" },
    viewerCounterText: { color: theme.text, fontSize: 12, fontWeight: "800" },
    viewerPager: { flex: 1 },
    viewerPage: { flex: 1, alignItems: "center", justifyContent: "center" },
    viewerImage: { width: "100%", height: "100%" },
    viewerFooter: { paddingHorizontal: 18, paddingTop: 12, flexDirection: "row", alignItems: "center", gap: 10 },
    viewerPrimaryAction: { flex: 1, minHeight: 50, borderRadius: 14, backgroundColor: theme.accent, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 10 },
    viewerPrimaryActionText: { color: theme.background, fontSize: 13, fontWeight: "900", textAlign: "center" },
    viewerPrimaryBadge: { flex: 1, minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: theme.accent, backgroundColor: "#C9A96212", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 10 },
    viewerPrimaryText: { color: theme.accent, fontSize: 13, fontWeight: "900", textAlign: "center" },
    viewerDelete: { minWidth: 98, minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: "#C84F4F66", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 10 },
    viewerDeleteText: { color: "#E59A9A", fontSize: 12, fontWeight: "900" },
  });
}
