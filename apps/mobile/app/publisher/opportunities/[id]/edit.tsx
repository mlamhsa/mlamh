import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { getPublisherOpportunity, managePublisherOpportunity, type PublisherOpportunityDetail } from "@/lib/publisher-api";
import { darkTheme, lightTheme } from "@/lib/theme";

export default function EditPublisherOpportunityScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const opportunityId = Number(rawId);
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const theme = useColorScheme() === "dark" ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [detail, setDetail] = useState<PublisherOpportunityDetail | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [currency, setCurrency] = useState("");
  const [budget, setBudget] = useState("");
  const [opportunityType, setOpportunityType] = useState<"actor" | "model">("actor");
  const [compensationType, setCompensationType] = useState<"fixed" | "negotiable" | "unpaid">("fixed");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        if (!Number.isInteger(opportunityId) || opportunityId <= 0) {
          if (active) setError(isArabic ? "معرّف الفرصة غير صالح." : "Invalid opportunity identifier.");
          return;
        }
        const result = await getPublisherOpportunity(opportunityId, locale);
        if (!active) return;
        if (!result) { setError(isArabic ? "تعذر تحميل الفرصة." : "Unable to load opportunity."); return; }
        setDetail(result);
        setTitle(result.opportunity.title);
        setDescription(result.opportunity.description);
        setCity(result.opportunity.city || "");
        setCountryCode(result.opportunity.countryCode || "");
        setCurrency(result.opportunity.currency || "");
        setBudget(result.opportunity.budget || "");
        if (result.opportunity.opportunityType === "model") setOpportunityType("model");
        if (["fixed", "negotiable", "unpaid"].includes(result.opportunity.compensationType || "")) setCompensationType(result.opportunity.compensationType as "fixed" | "negotiable" | "unpaid");
      } catch {
        if (active) setError(isArabic ? "تعذر تحميل الفرصة. تحقق من الاتصال وحاول مرة أخرى." : "Unable to load opportunity. Check your connection and try again.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [isArabic, locale, opportunityId]);

  async function save() {
    if (saving) return;
    if (title.trim().length < 4 || description.trim().length < 20) { setError(isArabic ? "العنوان يجب أن يكون واضحًا والوصف 20 حرفًا على الأقل." : "Use a clear title and a description of at least 20 characters."); return; }
    setSaving(true); setError(null);
    try {
      const result = await managePublisherOpportunity(opportunityId, { action: "edit", title, description, city, countryCode, currency, budget: compensationType === "unpaid" ? "" : budget, opportunityType, compensationType });
      if (!result.ok) { setError(isArabic ? "تعذر حفظ التعديلات. راجع الدولة والعملة والبيانات المطلوبة." : "Unable to save. Check country, currency, and required fields."); return; }
      router.back();
    } catch {
      setError(isArabic ? "تعذر حفظ التعديلات. تحقق من الاتصال وحاول مرة أخرى." : "Unable to save. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.accent} /></View>;
  if (!detail || detail.opportunity.status === "archived") return <View style={styles.centered}><Text accessibilityRole="alert" style={styles.error}>{error || (isArabic ? "لا يمكن تعديل فرصة مؤرشفة." : "Archived opportunities cannot be edited.")}</Text><Pressable onPress={() => router.back()}><Text style={styles.backText}>{isArabic ? "رجوع" : "Back"}</Text></Pressable></View>;

  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "إلغاء" : "Cancel"} onPress={() => router.back()} hitSlop={12}><Text style={styles.backIcon}>‹</Text></Pressable>
        <View style={styles.brandMark}><Text style={styles.brandMarkText}>M</Text></View>
      </View>

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>MLAMH · OWNER</Text>
        <Text accessibilityRole="header" style={styles.title}>{isArabic ? "تعديل الفرصة" : "Edit opportunity"}</Text>
        <Text style={styles.body}>{isArabic ? "حدّث المعلومات التي ستظهر للمواهب مع الحفاظ على وضوح الفرصة." : "Update what talent will see while keeping the opportunity clear and concise."}</Text>
      </View>

      <View style={styles.formCard}>
        <Field label={isArabic ? "العنوان" : "Title"} accessibilityLabel={isArabic ? "عنوان الفرصة" : "Opportunity title"} value={title} onChangeText={setTitle} returnKeyType="next" styles={styles} />
        <Field label={isArabic ? "الوصف" : "Description"} accessibilityLabel={isArabic ? "وصف الفرصة" : "Opportunity description"} value={description} onChangeText={setDescription} multiline styles={styles} />

        <Text style={styles.label}>{isArabic ? "نوع الموهبة" : "Talent type"}</Text>
        <View accessibilityRole="radiogroup" style={styles.options}>
          {(["actor", "model"] as const).map((value) => <Option key={value} active={opportunityType === value} label={value === "actor" ? (isArabic ? "ممثل" : "Actor") : (isArabic ? "مودل" : "Model")} onPress={() => setOpportunityType(value)} styles={styles} />)}
        </View>

        <View style={styles.rowFields}>
          <View style={styles.rowField}><Field label={isArabic ? "المدينة" : "City"} accessibilityLabel={isArabic ? "المدينة" : "City"} value={city} onChangeText={setCity} placeholder={isArabic ? "اسم المدينة" : "City name"} returnKeyType="next" styles={styles} /></View>
          <View style={styles.rowField}><Field label={isArabic ? "الدولة" : "Country"} accessibilityLabel={isArabic ? "رمز الدولة من حرفين" : "Two-letter country code"} value={countryCode} onChangeText={(value) => setCountryCode(value.toUpperCase())} placeholder="SA / AE" maxLength={2} autoCapitalize="characters" returnKeyType="next" styles={styles} /></View>
        </View>

        <Text style={styles.label}>{isArabic ? "المقابل" : "Compensation"}</Text>
        <View accessibilityRole="radiogroup" style={styles.options}>
          {(["fixed", "negotiable", "unpaid"] as const).map((value) => <Option key={value} active={compensationType === value} label={compLabel(value, locale)} onPress={() => setCompensationType(value)} styles={styles} />)}
        </View>

        {compensationType !== "unpaid" ? <View style={styles.rowFields}>
          <View style={styles.rowField}><Field label={isArabic ? "القيمة" : "Amount"} accessibilityLabel={isArabic ? "قيمة المقابل" : "Compensation amount"} value={budget} onChangeText={setBudget} placeholder="1500" keyboardType="decimal-pad" returnKeyType="next" styles={styles} /></View>
          <View style={styles.rowField}><Field label={isArabic ? "العملة" : "Currency"} accessibilityLabel={isArabic ? "رمز العملة من ثلاثة أحرف" : "Three-letter currency code"} value={currency} onChangeText={(value) => setCurrency(value.toUpperCase())} placeholder="SAR" maxLength={3} autoCapitalize="characters" returnKeyType="done" styles={styles} /></View>
        </View> : null}
      </View>

      {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
      <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "حفظ التعديلات" : "Save changes"} accessibilityState={{ disabled: saving, busy: saving }} disabled={saving} style={[styles.save, saving && styles.disabled]} onPress={() => void save()}><Text style={styles.saveText}>{saving ? (isArabic ? "جارٍ الحفظ…" : "Saving…") : (isArabic ? "حفظ التعديلات" : "Save changes")}</Text></Pressable>
    </ScrollView>
  </KeyboardAvoidingView>;
}

function Field({ label, styles, multiline, ...props }: { label: string; styles: ReturnType<typeof createStyles>; multiline?: boolean } & React.ComponentProps<typeof TextInput>) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...props} multiline={multiline} textAlignVertical={multiline ? "top" : "center"} style={[styles.input, multiline && styles.multiline]} placeholderTextColor={styles.placeholder.color} /></View>;
}
function Option({ active, label, onPress, styles }: { active: boolean; label: string; onPress: () => void; styles: ReturnType<typeof createStyles> }) {
  return <Pressable accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ selected: active }} onPress={onPress} style={[styles.option, active && styles.optionActive]}><Text style={[styles.optionText, active && styles.optionTextActive]}>{label}</Text></Pressable>;
}
function compLabel(value: string, locale: "ar" | "en") { if (locale === "ar") return value === "fixed" ? "محدد" : value === "negotiable" ? "قابل للتفاوض" : "بدون مقابل"; return value === "fixed" ? "Fixed" : value === "negotiable" ? "Negotiable" : "Unpaid"; }
function createStyles(theme: typeof lightTheme | typeof darkTheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background },
    centered: { flex: 1, gap: 18, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: theme.background },
    content: { paddingHorizontal: 16, paddingTop: 48, paddingBottom: 70, gap: 18 },
    topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    backIcon: { color: theme.text, fontSize: 32, lineHeight: 36 },
    backText: { color: theme.accent, fontSize: 13, fontWeight: "700" },
    brandMark: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: theme.accent, alignItems: "center", justifyContent: "center", backgroundColor: theme.surface },
    brandMarkText: { color: theme.accent, fontSize: 17, fontWeight: "900" },
    hero: { gap: 8, paddingHorizontal: 2 },
    eyebrow: { color: theme.accent, fontSize: 11, fontWeight: "800", letterSpacing: 2 },
    title: { color: theme.text, fontSize: 34, lineHeight: 42, fontWeight: "700" },
    body: { color: theme.muted, fontSize: 14, lineHeight: 22 },
    formCard: { gap: 16, padding: 18, borderRadius: 28, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface },
    field: { gap: 7 },
    label: { color: theme.text, fontSize: 12, fontWeight: "800" },
    input: { minHeight: 52, borderWidth: 1, borderColor: theme.border, borderRadius: 16, paddingHorizontal: 14, color: theme.text, backgroundColor: theme.background, fontSize: 14 },
    multiline: { minHeight: 150, paddingTop: 14 },
    placeholder: { color: theme.muted },
    options: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    option: { minHeight: 44, borderWidth: 1, borderColor: theme.border, borderRadius: 14, paddingHorizontal: 15, paddingVertical: 11, backgroundColor: theme.background, justifyContent: "center" },
    optionActive: { backgroundColor: theme.accent, borderColor: theme.accent },
    optionText: { color: theme.text, fontSize: 11, fontWeight: "700" },
    optionTextActive: { color: "#2E2E2E" },
    rowFields: { flexDirection: "row", gap: 10 },
    rowField: { flex: 1 },
    save: { minHeight: 54, alignItems: "center", justifyContent: "center", borderRadius: 17, backgroundColor: theme.accent },
    saveText: { color: "#2E2E2E", fontSize: 14, fontWeight: "900" },
    disabled: { opacity: 0.55 },
    error: { color: "#EF8B8B", fontSize: 12, lineHeight: 18, textAlign: "center" },
  });
}
