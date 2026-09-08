import { useEffect, useMemo, useRef, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, Vibration, View, useWindowDimensions } from "react-native";
import { GripHorizontal, Star } from "lucide-react-native";

import { darkTheme } from "@/lib/theme";

type DraggableGalleryStripProps = {
  items: string[];
  primaryUrl: string | null;
  locale: "ar" | "en";
  isRtl: boolean;
  disabled?: boolean;
  selectedIndex: number;
  onSelect: (index: number) => void;
  onOpen: (index: number) => void;
  onReorder: (nextItems: string[]) => Promise<boolean>;
};

const GAP = 10;
const LONG_PRESS_MS = 280;

function moveItem(items: string[], from: number, to: number) {
  if (from === to) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function DraggableGalleryStrip({
  items,
  primaryUrl,
  locale,
  isRtl,
  disabled = false,
  selectedIndex,
  onSelect,
  onOpen,
  onReorder,
}: DraggableGalleryStripProps) {
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { width } = useWindowDimensions();
  const cardWidth = Math.round(Math.min(154, Math.max(124, (width - 58) / 2.35)));
  const step = cardWidth + GAP;
  const [draftItems, setDraftItems] = useState(items);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [saving, setSaving] = useState(false);
  const startXRef = useRef(0);
  const originIndexRef = useRef<number | null>(null);
  const currentIndexRef = useRef<number | null>(null);
  const originalItemsRef = useRef<string[]>(items);
  const draftItemsRef = useRef<string[]>(items);
  const scrollRef = useRef<ScrollView | null>(null);
  const didPositionRtlRef = useRef(false);

  useEffect(() => {
    if (draggingIndex !== null || saving) return;
    setDraftItems(items);
    draftItemsRef.current = items;
  }, [draggingIndex, items, saving]);

  useEffect(() => {
    if (!isRtl) didPositionRtlRef.current = false;
  }, [isRtl]);

  function positionRtlStart() {
    if (!isRtl || didPositionRtlRef.current || draftItems.length === 0) return;
    didPositionRtlRef.current = true;
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: false }));
  }

  function beginDrag(index: number, pageX: number) {
    if (disabled || saving || draftItemsRef.current.length < 2) return;
    startXRef.current = pageX;
    originIndexRef.current = index;
    currentIndexRef.current = index;
    originalItemsRef.current = [...draftItemsRef.current];
    setDraggingIndex(index);
    setDragOffset(0);
    onSelect(index);
    Vibration.vibrate(12);
  }

  function updateDrag(pageX: number) {
    if (draggingIndex === null || originIndexRef.current === null) return;
    const physicalDelta = pageX - startXRef.current;
    const logicalDelta = physicalDelta * (isRtl ? -1 : 1);
    setDragOffset(physicalDelta);

    const shift = Math.round(logicalDelta / Math.max(step, 1));
    const target = Math.max(0, Math.min(draftItemsRef.current.length - 1, originIndexRef.current + shift));
    const current = currentIndexRef.current ?? originIndexRef.current;
    if (target === current) return;

    const next = moveItem(draftItemsRef.current, current, target);
    draftItemsRef.current = next;
    setDraftItems(next);
    currentIndexRef.current = target;
    setDraggingIndex(target);
    onSelect(target);
    Vibration.vibrate(6);
  }

  async function finishDrag() {
    if (originIndexRef.current === null) return;
    const next = [...draftItemsRef.current];
    const changed = next.some((item, index) => item !== originalItemsRef.current[index]);
    setDragOffset(0);
    setDraggingIndex(null);
    originIndexRef.current = null;
    currentIndexRef.current = null;

    if (!changed) return;
    setSaving(true);
    const ok = await onReorder(next).catch(() => false);
    if (!ok) {
      draftItemsRef.current = originalItemsRef.current;
      setDraftItems(originalItemsRef.current);
    }
    setSaving(false);
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        scrollEnabled={draggingIndex === null && !saving}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.content, isRtl && styles.contentRtl]}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={positionRtlStart}
      >
        {draftItems.map((uri, index) => {
          const primary = uri === primaryUrl;
          const selected = index === selectedIndex;
          const dragging = index === draggingIndex;
          return (
            <Pressable
              key={uri}
              accessibilityRole="button"
              accessibilityLabel={locale === "ar" ? `الصورة ${index + 1} من ${draftItems.length}` : `Photo ${index + 1} of ${draftItems.length}`}
              accessibilityHint={locale === "ar" ? "اضغط للعرض، أو اضغط مطولًا واسحب لإعادة الترتيب" : "Tap to view, or long press and drag to reorder"}
              disabled={disabled || saving}
              delayLongPress={LONG_PRESS_MS}
              onPress={() => { onSelect(index); onOpen(index); }}
              onPressIn={(event) => { startXRef.current = event.nativeEvent.pageX; }}
              onLongPress={(event) => beginDrag(index, event.nativeEvent.pageX)}
              onTouchMove={(event) => updateDrag(event.nativeEvent.pageX)}
              onTouchEnd={() => void finishDrag()}
              onTouchCancel={() => void finishDrag()}
              style={[
                styles.card,
                { width: cardWidth },
                selected && styles.cardSelected,
                dragging && styles.cardDragging,
                dragging && { transform: [{ translateX: dragOffset * 0.08 }, { scale: 1.035 }] },
              ]}
            >
              <Image source={{ uri }} resizeMode="cover" style={styles.image} />
              <View style={[styles.meta, isRtl && styles.rowRtl]}>
                <View style={[styles.position, isRtl && styles.rowRtl]}>
                  <GripHorizontal size={13} color={theme.muted} />
                  <Text style={styles.positionText}>{index + 1}/{draftItems.length}</Text>
                </View>
                {primary ? (
                  <View style={[styles.primaryBadge, isRtl && styles.rowRtl]}>
                    <Star size={10} color={theme.background} fill={theme.background} />
                    <Text style={styles.primaryBadgeText}>{locale === "ar" ? "الرئيسية" : "Primary"}</Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
      <Text style={[styles.helper, isRtl && styles.textRtl]}>
        {saving
          ? (locale === "ar" ? "جارٍ حفظ ترتيب الصور…" : "Saving photo order…")
          : (locale === "ar" ? "اضغط مطولًا على الصورة ثم اسحب يمينًا أو يسارًا لترتيب المعرض." : "Long press a photo, then drag left or right to reorder your portfolio.")}
      </Text>
    </View>
  );
}

function createStyles(theme: typeof darkTheme) {
  return StyleSheet.create({
    wrapper: { gap: 8 },
    content: { gap: GAP, paddingRight: 22, paddingVertical: 4, minWidth: "100%" },
    contentRtl: { flexDirection: "row-reverse", paddingRight: 0, paddingLeft: 22 },
    rowRtl: { flexDirection: "row-reverse" },
    textRtl: { textAlign: "right", writingDirection: "rtl" },
    card: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      overflow: "hidden",
      opacity: 1,
    },
    cardSelected: { borderColor: "#C9A96288" },
    cardDragging: {
      borderColor: theme.accent,
      opacity: 0.94,
      shadowColor: "#000",
      shadowOpacity: 0.32,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 7 },
      elevation: 8,
      zIndex: 20,
    },
    image: { width: "100%", aspectRatio: 0.82, backgroundColor: theme.surfaceElevated },
    meta: {
      minHeight: 38,
      paddingHorizontal: 9,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 7,
    },
    position: { flexDirection: "row", alignItems: "center", gap: 5 },
    positionText: { color: theme.muted, fontSize: 9, fontWeight: "800" },
    primaryBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderRadius: 999,
      backgroundColor: theme.accent,
      paddingHorizontal: 7,
      paddingVertical: 4,
    },
    primaryBadgeText: { color: theme.background, fontSize: 7, fontWeight: "900" },
    helper: { color: theme.muted, fontSize: 10, lineHeight: 16 },
  });
}
