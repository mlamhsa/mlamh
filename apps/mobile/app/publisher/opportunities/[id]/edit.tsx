import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { getPublisherOpportunity, managePublisherOpportunity, type PublisherOpportunityDetail } from "@/lib/publisher-api";
import { darkTheme } from "@/lib/theme";

export default function EditPublisherOpportunityScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const opportunityId = Number(Array.isArray(params.id) ? params.id[0] : params.id);
  const locale = getDeviceLocale(); const isArabic = locale === "ar"; const isRtl = isRtlLocale(locale);
  const theme = darkTheme; const styles = useMemo(() => createStyles(theme), [theme]);
  const [detail, setDetail] = useState<PublisherOpportunityDetail | null>(null);
  const [title, setTitle] = useState(""); const [description, setDescription] = useState(""); const [city, setCity] = useState(""); const [countryCode, setCountryCode] = useState(""); const [currency, setCurrency] = useState(""); const [budget, setBudget] = useState("");
  const [opportunityType, setOpportunityType] = useState<"actor" | "model">("actor"); const [compensationType, setCompensationType] = useState<"fixed" | "negotiable" | "unpaid">("fixed"); const [requiredGender, setRequiredGender] = useState<"male" | "female" | "any">("any");
  const [minAge, setMinAge] = useState(""); const [maxAge, setMaxAge] = useState(""); const [requiredCount, setRequiredCount] = useState(""); const [workDate, setWorkDate] = useState(""); const [workDuration, setWorkDuration] = useState<"1_hour" | "2_hours" | "4_hours" | "full_day" | "">(""); const [applicationStartDate, setApplicationStartDate] = useState(""); const [applicationDeadline, setApplicationDeadline] = useState("");
  const [languages, setLanguages] = useState(""); const [dialects, setDialects] = useState(""); const [modelingTypes, setModelingTypes] = useState(""); const [minHeightCm, setMinHeightCm] = useState(""); const [hairColor, setHairColor] = useState("");
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        if (!Number.isInteger(opportunityId) || opportunityId <= 0) { if (active) setError(isArabic ? "معرّف الفرصة غير صالح." : "Invalid opportunity identifier."); return; }
        const result = await getPublisherOpportunity(opportunityId, locale);
        if (!active) return;
        if (!result) { setError(isArabic ? "تعذر تحميل الفرصة." : "Unable to load opportunity."); return; }
        setDetail(result); const o = result.opportunity;
        setTitle(o.title); setDescription(o.description); setCity(o.city || ""); setCountryCode(o.countryCode || ""); setCurrency(o.currency || ""); setBudget(o.budget || "");
        setOpportunityType(o.opportunityType === "model" ? "model" : "actor");
        if (["fixed", "negotiable", "unpaid"].includes(o.compensationType || "")) setCompensationType(o.compensationType as "fixed" | "negotiable" | "unpaid");
        if (["male", "female", "any"].includes(o.requiredGender || "")) setRequiredGender(o.requiredGender as "male" | "female" | "any");
        setMinAge(o.minAge == null ? "" : String(o.minAge)); setMaxAge(o.maxAge == null ? "" : String(o.maxAge)); setRequiredCount(o.requiredCount == null ? "" : String(o.requiredCount)); setWorkDate(o.workDate || "");
        if (["1_hour", "2_hours", "4_hours", "full_day"].includes(o.workDuration || "")) setWorkDuration(o.workDuration as "1_hour" | "2_hours" | "4_hours" | "full_day");
        setApplicationStartDate(o.applicationStartDate || ""); setApplicationDeadline(o.applicationDeadline || "");
        const r = o.roleRequirements ?? {};
        setLanguages(Array.isArray(r.languages) ? r.languages.filter((x): x is string => typeof x === "string").join(", ") : ""); setDialects(Array.isArray(r.dialects) ? r.dialects.filter((x): x is string => typeof x === "string").join(", ") : ""); setModelingTypes(Array.isArray(r.modeling_types) ? r.modeling_types.filter((x): x is string => typeof x === "string").join(", ") : ""); setMinHeightCm(r.min_height_cm == null ? "" : String(r.min_height_cm)); setHairColor(typeof r.hair_color === "string" ? r.hair_color : "");
      } catch { if (active) setError(isArabic ? "تعذر تحميل الفرصة. تحقق من الاتصال وحاول مرة أخرى." : "Unable to load opportunity. Check your connection and try again."); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [isArabic, locale, opportunityId]);

  async function save() {
    if (saving) return;
    if (title.trim().length < 4 || description.trim().length < 20) { setError(isArabic ? "العنوان يجب أن يكون واضحًا والوصف 20 حرفًا على الأقل." : "Use a clear title and a description of at least 20 characters."); return; }
    setSaving(true); setError(null);
    try {
      const split = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);
      const result = await managePublisherOpportunity(opportunityId, {
        action: "edit", title, description, city, countryCode, currency, budget: compensationType === "unpaid" ? "" : budget, opportunityType, compensationType, requiredGender,
        minAge: minAge ? Number(minAge) : null, maxAge: maxAge ? Number(maxAge) : null, requiredCount: requiredCount ? Number(requiredCount) : null, workDate: workDate || null, workDuration: workDuration || null, applicationStartDate: applicationStartDate || null, applicationDeadline: applicationDeadline || null,
        roleRequirements: opportunityType === "actor" ? { languages: split(languages), dialects: split(dialects) } : { modelingTypes: split(modelingTypes), minHeightCm: minHeightCm ? Number(minHeightCm) : null, hairColor: hairColor || null },
      });
      if (!result.ok) { setError(editError(result.code, locale)); return; }
      router.back();
    } catch { setError(isArabic ? "تعذر حفظ التعديلات. تحقق من الاتصال وحاول مرة أخرى." : "Unable to save. Check your connection and try again."); }
    finally { setSaving(false); }
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.accent} /></View>;
  if (!detail || detail.opportunity.status === "archived") return <View style={styles.centered}><Text accessibilityRole="alert" style={styles.error}>{error || (isArabic ? "لا يمكن تعديل فرصة مؤرشفة." : "Archived opportunities cannot be edited.")}</Text><Pressable onPress={() => router.back()}><Text style={styles.backText}>{isArabic ? "رجوع" : "Back"}</Text></Pressable></View>;

  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { direction: isRtl ? "rtl" : "ltr" }]}>
    <View style={styles.topBar}><Pressable onPress={() => router.back()} hitSlop={12}><Text style={styles.backIcon}>{isRtl ? "›" : "‹"}</Text></Pressable><Text style={styles.topLabel}>{isArabic ? "تعديل المسودة" : "Edit draft"}</Text></View>
    <View style={styles.hero}><Text style={styles.eyebrow}>{isArabic ? "ملامح للأعمال" : "MLAMH FOR BUSINESS"}</Text><Text accessibilityRole="header" style={styles.title}>{isArabic ? "تعديل الفرصة" : "Edit opportunity"}</Text><Text style={styles.body}>{isArabic ? "حدّث نفس تفاصيل الـBrief المعتمدة في الويب والتطبيق." : "Update the same brief fields used across web and mobile."}</Text></View>
    <View style={styles.formCard}>
      <Field label={isArabic ? "العنوان" : "Title"} value={title} onChangeText={setTitle} styles={styles} />
      <Field label={isArabic ? "الوصف" : "Description"} value={description} onChangeText={setDescription} multiline styles={styles} />
      <Label text={isArabic ? "نوع الموهبة" : "Talent type"} styles={styles} /><View style={styles.options}><Option active={opportunityType === "actor"} label={isArabic ? "ممثل" : "Actor"} onPress={() => setOpportunityType("actor")} styles={styles} /><Option active={opportunityType === "model"} label={isArabic ? "مودل" : "Model"} onPress={() => setOpportunityType("model")} styles={styles} /></View>
      <View style={styles.rowFields}><View style={styles.rowField}><Field label={isArabic ? "المدينة" : "City"} value={city} onChangeText={setCity} styles={styles} /></View><View style={styles.rowField}><Field label={isArabic ? "الدولة" : "Country"} value={countryCode} onChangeText={(v) => setCountryCode(v.toUpperCase())} maxLength={2} styles={styles} /></View></View>
      <Label text={isArabic ? "الجنس المطلوب" : "Required gender"} styles={styles} /><View style={styles.options}><Option active={requiredGender === "any"} label={isArabic ? "الجميع" : "Any"} onPress={() => setRequiredGender("any")} styles={styles} /><Option active={requiredGender === "male"} label={isArabic ? "ذكر" : "Male"} onPress={() => setRequiredGender("male")} styles={styles} /><Option active={requiredGender === "female"} label={isArabic ? "أنثى" : "Female"} onPress={() => setRequiredGender("female")} styles={styles} /></View>
      <View style={styles.rowFields}><View style={styles.rowField}><Field label={isArabic ? "العمر من" : "Min age"} value={minAge} onChangeText={setMinAge} keyboardType="number-pad" styles={styles} /></View><View style={styles.rowField}><Field label={isArabic ? "العمر إلى" : "Max age"} value={maxAge} onChangeText={setMaxAge} keyboardType="number-pad" styles={styles} /></View></View>
      <Field label={isArabic ? "عدد المواهب" : "Talent count"} value={requiredCount} onChangeText={setRequiredCount} keyboardType="number-pad" styles={styles} />
      {opportunityType === "actor" ? <><Field label={isArabic ? "اللغات" : "Languages"} value={languages} onChangeText={setLanguages} styles={styles} /><Field label={isArabic ? "اللهجات" : "Dialects"} value={dialects} onChangeText={setDialects} styles={styles} /></> : <><Field label={isArabic ? "أنواع المودل" : "Modeling types"} value={modelingTypes} onChangeText={setModelingTypes} styles={styles} /><View style={styles.rowFields}><View style={styles.rowField}><Field label={isArabic ? "أقل طول سم" : "Min height cm"} value={minHeightCm} onChangeText={setMinHeightCm} keyboardType="number-pad" styles={styles} /></View><View style={styles.rowField}><Field label={isArabic ? "لون الشعر" : "Hair color"} value={hairColor} onChangeText={setHairColor} styles={styles} /></View></View></>}
      <View style={styles.rowFields}><View style={styles.rowField}><Field label={isArabic ? "تاريخ العمل" : "Work date"} value={workDate} onChangeText={setWorkDate} placeholder="YYYY-MM-DD" styles={styles} /></View><View style={styles.rowField}><Label text={isArabic ? "مدة العمل" : "Duration"} styles={styles} /><View style={styles.optionsCompact}>{(["1_hour","2_hours","4_hours","full_day"] as const).map((v) => <Option key={v} active={workDuration === v} label={v === "1_hour" ? "1h" : v === "2_hours" ? "2h" : v === "4_hours" ? "4h" : (isArabic ? "يوم" : "Day")} onPress={() => setWorkDuration(v)} styles={styles} compact />)}</View></View></View>
      <View style={styles.rowFields}><View style={styles.rowField}><Field label={isArabic ? "بداية التقديم" : "Application start"} value={applicationStartDate} onChangeText={setApplicationStartDate} placeholder="YYYY-MM-DD" styles={styles} /></View><View style={styles.rowField}><Field label={isArabic ? "آخر موعد" : "Deadline"} value={applicationDeadline} onChangeText={setApplicationDeadline} placeholder="YYYY-MM-DD" styles={styles} /></View></View>
      <Label text={isArabic ? "المقابل" : "Compensation"} styles={styles} /><View style={styles.options}><Option active={compensationType === "fixed"} label={isArabic ? "محدد" : "Fixed"} onPress={() => setCompensationType("fixed")} styles={styles} /><Option active={compensationType === "negotiable"} label={isArabic ? "حسب الاتفاق" : "Negotiable"} onPress={() => setCompensationType("negotiable")} styles={styles} /><Option active={compensationType === "unpaid"} label={isArabic ? "بدون مقابل" : "Unpaid"} onPress={() => setCompensationType("unpaid")} styles={styles} /></View>
      {compensationType !== "unpaid" ? <View style={styles.rowFields}><View style={styles.rowField}><Field label={isArabic ? "القيمة" : "Amount"} value={budget} onChangeText={setBudget} keyboardType="decimal-pad" styles={styles} /></View><View style={styles.rowField}><Field label={isArabic ? "العملة" : "Currency"} value={currency} onChangeText={(v) => setCurrency(v.toUpperCase())} maxLength={3} styles={styles} /></View></View> : null}
    </View>
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    <Pressable disabled={saving} style={[styles.save, saving && styles.disabled]} onPress={() => void save()}><Text style={styles.saveText}>{saving ? (isArabic ? "جارٍ الحفظ…" : "Saving…") : (isArabic ? "حفظ التعديلات" : "Save changes")}</Text></Pressable>
  </ScrollView></KeyboardAvoidingView>;
}

function Field({ label, styles, multiline, ...props }: { label: string; styles: ReturnType<typeof createStyles>; multiline?: boolean } & React.ComponentProps<typeof TextInput>) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...props} multiline={multiline} textAlignVertical={multiline ? "top" : "center"} style={[styles.input, multiline && styles.multiline]} placeholderTextColor={styles.placeholder.color} /></View>; }
function Label({ text, styles }: { text: string; styles: ReturnType<typeof createStyles> }) { return <Text style={styles.label}>{text}</Text>; }
function Option({ active, label, onPress, styles, compact = false }: { active: boolean; label: string; onPress: () => void; styles: ReturnType<typeof createStyles>; compact?: boolean }) { return <Pressable accessibilityRole="radio" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.option, compact && styles.optionCompact, active && styles.optionActive]}><Text style={[styles.optionText, active && styles.optionTextActive]}>{label}</Text></Pressable>; }
function editError(code: string, locale: "ar" | "en") { const ar: Record<string,string> = { INVALID_AGE_RANGE: "راجع نطاق العمر.", INVALID_DATE: "استخدم صيغة التاريخ YYYY-MM-DD.", INVALID_APPLICATION_WINDOW: "بداية التقديم يجب أن تسبق آخر موعد.", INVALID_ROLE_REQUIREMENTS: "راجع متطلبات الدور.", INVALID_NUMERIC_FIELD: "راجع القيم الرقمية.", EDIT_LOCKED: "لا يمكن تعديل الفرصة في حالتها الحالية.", INVALID_COUNTRY: "راجع رمز الدولة.", INVALID_CURRENCY: "راجع رمز العملة." }; const en: Record<string,string> = { INVALID_AGE_RANGE: "Check the age range.", INVALID_DATE: "Use YYYY-MM-DD date format.", INVALID_APPLICATION_WINDOW: "Application start must be before the deadline.", INVALID_ROLE_REQUIREMENTS: "Check role requirements.", INVALID_NUMERIC_FIELD: "Check numeric values.", EDIT_LOCKED: "This opportunity cannot be edited in its current state.", INVALID_COUNTRY: "Check the country code.", INVALID_CURRENCY: "Check the currency code." }; return (locale === "ar" ? ar : en)[code] ?? (locale === "ar" ? "تعذر حفظ التعديلات." : "Unable to save changes."); }
function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, centered: { flex: 1, gap: 18, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: theme.background }, content: { paddingHorizontal: 18, paddingTop: 48, paddingBottom: 70, gap: 17 }, topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, backIcon: { color: theme.text, fontSize: 30 }, topLabel: { color: theme.muted, fontSize: 11, fontWeight: "700" }, backText: { color: theme.accent, fontSize: 13, fontWeight: "700" }, hero: { gap: 7 }, eyebrow: { color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.7 }, title: { color: theme.text, fontSize: 31, lineHeight: 38, fontWeight: "700" }, body: { color: theme.muted, fontSize: 13, lineHeight: 21 },
  formCard: { gap: 15, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface }, field: { gap: 7 }, label: { color: theme.text, fontSize: 12, fontWeight: "800" }, input: { minHeight: 48, borderWidth: 1, borderColor: theme.border, borderRadius: 12, paddingHorizontal: 13, color: theme.text, backgroundColor: theme.background, fontSize: 14 }, multiline: { minHeight: 130, paddingTop: 13 }, placeholder: { color: theme.muted }, options: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, optionsCompact: { flexDirection: "row", flexWrap: "wrap", gap: 5 }, option: { minHeight: 40, borderWidth: 1, borderColor: theme.border, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: theme.background, justifyContent: "center" }, optionCompact: { minHeight: 34, paddingHorizontal: 8, paddingVertical: 6 }, optionActive: { backgroundColor: theme.accent, borderColor: theme.accent }, optionText: { color: theme.muted, fontSize: 11, fontWeight: "700" }, optionTextActive: { color: theme.background }, rowFields: { flexDirection: "row", gap: 9 }, rowField: { flex: 1 }, save: { minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: theme.accent }, saveText: { color: theme.background, fontSize: 14, fontWeight: "900" }, disabled: { opacity: 0.5 }, error: { color: "#E59A9A", fontSize: 12, lineHeight: 18, textAlign: "center" },
}); }
