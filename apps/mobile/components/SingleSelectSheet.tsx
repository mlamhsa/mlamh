import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Check, Search, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { AppLocale } from "@/lib/i18n";
import { darkTheme } from "@/lib/theme";

export type SelectSheetOption = {
  value: string;
  ar: string;
  en: string;
};

type Props = {
  visible: boolean;
  title: string;
  searchPlaceholder: string;
  options: SelectSheetOption[];
  value: string | null;
  locale: AppLocale;
  onClose: () => void;
  onConfirm: (value: string) => void;
  confirmLabel?: string;
  emptyLabel?: string;
};

export function SingleSelectSheet({
  visible,
  title,
  searchPlaceholder,
  options,
  value,
  locale,
  onClose,
  onConfirm,
  confirmLabel,
  emptyLabel,
}: Props) {
  const insets = useSafeAreaInsets();
  const isArabic = locale === "ar";
  const [query, setQuery] = useState("");
  const [draftValue, setDraftValue] = useState<string | null>(value);

  useEffect(() => {
    if (!visible) return;
    setDraftValue(value);
    setQuery("");
  }, [value, visible]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return options;
    return options.filter((option) => `${option.ar} ${option.en}`.toLocaleLowerCase().includes(needle));
  }, [options, query]);

  const selected = options.find((option) => option.value === draftValue) ?? null;
  const confirmDisabled = !draftValue;

  function close() {
    setDraftValue(value);
    setQuery("");
    onClose();
  }

  function confirm() {
    if (!draftValue) return;
    onConfirm(draftValue);
    setQuery("");
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.backdrop}>
        <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "إغلاق" : "Close"} style={StyleSheet.absoluteFill} onPress={close} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) }]}>
          <View style={styles.handle} />
          <View style={[styles.header, isArabic && styles.rowRtl]}>
            <Text style={[styles.title, isArabic && styles.textRtl]}>{title}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "إغلاق" : "Close"} onPress={close} style={styles.closeButton}>
              <X size={20} color={darkTheme.text} />
            </Pressable>
          </View>

          {selected ? (
            <View style={[styles.currentSelection, isArabic && styles.rowRtl]}>
              <View style={styles.currentCheck}><Check size={14} color={darkTheme.background} strokeWidth={3} /></View>
              <View style={styles.currentCopy}>
                <Text style={[styles.currentLabel, isArabic && styles.textRtl]}>{isArabic ? "الاختيار الحالي" : "Current selection"}</Text>
                <Text style={[styles.currentValue, isArabic && styles.textRtl]}>{selected[locale]}</Text>
              </View>
            </View>
          ) : null}

          <View style={[styles.searchBox, isArabic && styles.rowRtl]}>
            <Search size={18} color={darkTheme.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={searchPlaceholder}
              placeholderTextColor={darkTheme.muted}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              style={[styles.searchInput, isArabic && styles.textRtl]}
            />
          </View>

          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {filtered.length ? filtered.map((option) => {
              const active = draftValue === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  onPress={() => setDraftValue(option.value)}
                  style={[styles.row, isArabic && styles.rowRtl, active && styles.rowActive]}
                >
                  <Text style={[styles.rowText, isArabic && styles.textRtl, active && styles.rowTextActive]}>{option[locale]}</Text>
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active ? <Check size={14} color={darkTheme.background} strokeWidth={3} /> : null}
                  </View>
                </Pressable>
              );
            }) : (
              <Text style={[styles.empty, isArabic && styles.textRtl]}>{emptyLabel ?? (isArabic ? "لا توجد نتائج مطابقة" : "No matching results")}</Text>
            )}
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            disabled={confirmDisabled}
            onPress={confirm}
            style={[styles.confirmButton, confirmDisabled && styles.disabled]}
          >
            <Text style={styles.confirmText}>{confirmLabel ?? (isArabic ? "تأكيد الاختيار" : "Confirm selection")}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "#000000A8" },
  sheet: { maxHeight: "82%", backgroundColor: "#101010", borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: "#FFFFFF18", paddingHorizontal: 16, paddingTop: 9 },
  handle: { alignSelf: "center", width: 42, height: 4, borderRadius: 2, backgroundColor: "#FFFFFF33", marginBottom: 9 },
  header: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 },
  title: { flex: 1, color: darkTheme.text, fontSize: 19, fontWeight: "900" },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#FFFFFF0F", alignItems: "center", justifyContent: "center" },
  currentSelection: { minHeight: 66, flexDirection: "row", alignItems: "center", gap: 11, borderWidth: 1, borderColor: "#C9A96255", backgroundColor: "#C9A9620C", borderRadius: 16, paddingHorizontal: 13, marginBottom: 10 },
  currentCheck: { width: 28, height: 28, borderRadius: 14, backgroundColor: darkTheme.accent, alignItems: "center", justifyContent: "center" },
  currentCopy: { flex: 1, gap: 2 },
  currentLabel: { color: darkTheme.muted, fontSize: 9, fontWeight: "800" },
  currentValue: { color: darkTheme.text, fontSize: 14, fontWeight: "900" },
  searchBox: { minHeight: 50, borderWidth: 1, borderColor: darkTheme.border, borderRadius: 15, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 13, marginBottom: 8, backgroundColor: "#090909" },
  searchInput: { flex: 1, color: darkTheme.text, fontSize: 14, paddingVertical: 12 },
  list: { maxHeight: 380 },
  row: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, borderBottomWidth: 1, borderBottomColor: darkTheme.border, paddingHorizontal: 4 },
  rowActive: { backgroundColor: "#C9A96208" },
  rowText: { flex: 1, color: darkTheme.text, fontSize: 14 },
  rowTextActive: { color: darkTheme.accent, fontWeight: "900" },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: "#FFFFFF2A", alignItems: "center", justifyContent: "center" },
  radioActive: { borderColor: darkTheme.accent, backgroundColor: darkTheme.accent },
  empty: { color: darkTheme.muted, fontSize: 13, paddingVertical: 28, textAlign: "center" },
  confirmButton: { minHeight: 54, borderRadius: 15, backgroundColor: darkTheme.accent, alignItems: "center", justifyContent: "center", marginTop: 12 },
  confirmText: { color: darkTheme.background, fontSize: 15, fontWeight: "900" },
  disabled: { opacity: 0.45 },
  rowRtl: { flexDirection: "row-reverse" },
  textRtl: { textAlign: "right", writingDirection: "rtl" },
});
