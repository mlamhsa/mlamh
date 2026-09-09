import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Search, X } from "lucide-react-native";

import { isRtlLocale } from "@/lib/i18n";
import { useAppLocale } from "@/lib/locale-context";
import { getPublisherOpportunity, managePublisherOpportunity, type PublisherOpportunityDetail } from "@/lib/publisher-api";
import { SAUDI_CITY_OPTIONS } from "@/lib/profile-options";
import { darkTheme } from "@/lib/theme";

type OpportunityType = "actor" | "model";
type CompensationType = "fixed" | "negotiable" | "unpaid";
type Gender = "male" | "female" | "any";
type WorkDuration = "1_hour" | "2_hours" | "4_hours" | "full_day" | "";
type DateField = "workDate" | "applicationStartDate" | "applicationDeadline";
type Option = { value: string; ar: string; en: string };

const COUNTRIES: Array<Option & { enabled: boolean; currency: string }> = [
  { value: "SA", ar: "السعودية", en: "Saudi Arabia", enabled: true, currency: "SAR" },
  { value: "AE", ar: "الإمارات", en: "United Arab Emirates", enabled: false, currency: "AED" },
  { value: "QA", ar: "قطر", en: "Qatar", enabled: false, currency: "QAR" },
];
const LANGUAGE_OPTIONS: Option[] = [
  { value: "ar", ar: "العربية", en: "Arabic" }, { value: "en", ar: "الإنجليزية", en: "English" }, { value: "fr", ar: "الفرنسية", en: "French" }, { value: "es", ar: "الإسبانية", en: "Spanish" }, { value: "ur", ar: "الأردية", en: "Urdu" },
];
const DIALECT_OPTIONS: Option[] = [
  { value: "najdi", ar: "نجدي", en: "Najdi" }, { value: "hejazi", ar: "حجازي", en: "Hejazi" }, { value: "gulf", ar: "خليجي", en: "Gulf" }, { value: "saudi", ar: "سعودي عام", en: "Saudi" }, { value: "levantine", ar: "شامي", en: "Levantine" }, { value: "egyptian", ar: "مصري", en: "Egyptian" }, { value: "moroccan", ar: "مغربي", en: "Moroccan" },
];
const MODELING_OPTIONS: Option[] = [
  { value: "commercial", ar: "تجاري", en: "Commercial" }, { value: "fashion", ar: "أزياء", en: "Fashion" }, { value: "beauty", ar: "جمال", en: "Beauty" }, { value: "lifestyle", ar: "لايف ستايل", en: "Lifestyle" }, { value: "ecommerce", ar: "متاجر إلكترونية", en: "E-commerce" }, { value: "fitness", ar: "رياضي", en: "Fitness" },
];
const HAIR_OPTIONS: Option[] = [
  { value: "black", ar: "أسود", en: "Black" }, { value: "brown", ar: "بني", en: "Brown" }, { value: "blonde", ar: "أشقر", en: "Blonde" }, { value: "red", ar: "أحمر", en: "Red" }, { value: "gray", ar: "رمادي", en: "Gray" }, { value: "other", ar: "أخرى", en: "Other" },
];

export default function EditPublisherOpportunityScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const opportunityId = Number(Array.isArray(params.id) ? params.id[0] : params.id);
  const { locale } = useAppLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const { width } = useWindowDimensions();
  const compact = width <= 360;
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;

  const [detail, setDetail] = useState<PublisherOpportunityDetail | null>(null);
  const [title, setTitle] = useState(""); const [description, setDescription] = useState("");
  const [city, setCity] = useState(""); const [countryCode, setCountryCode] = useState("SA"); const [currency, setCurrency] = useState("SAR"); const [budget, setBudget] = useState("");
  const [opportunityType, setOpportunityType] = useState<OpportunityType>("actor"); const [compensationType, setCompensationType] = useState<CompensationType>("fixed"); const [requiredGender, setRequiredGender] = useState<Gender>("any");
  const [minAge, setMinAge] = useState(""); const [maxAge, setMaxAge] = useState(""); const [requiredCount, setRequiredCount] = useState("");
  const [workDate, setWorkDate] = useState(""); const [workDuration, setWorkDuration] = useState<WorkDuration>(""); const [applicationStartDate, setApplicationStartDate] = useState(""); const [applicationDeadline, setApplicationDeadline] = useState("");
  const [languages, setLanguages] = useState<string[]>([]); const [dialects, setDialects] = useState<string[]>([]); const [modelingTypes, setModelingTypes] = useState<string[]>([]); const [minHeightCm, setMinHeightCm] = useState(""); const [hairColor, setHairColor] = useState("");
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null);
  const [picker, setPicker] = useState<"city" | "country" | null>(null); const [citySearch, setCitySearch] = useState("");
  const [dateField, setDateField] = useState<DateField | null>(null); const [dateValue, setDateValue] = useState(new Date());

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        if (!Number.isInteger(opportunityId) || opportunityId <= 0) { if (active) setError(isArabic ? "معرّف الفرصة غير صالح." : "Invalid opportunity identifier."); return; }
        const result = await getPublisherOpportunity(opportunityId, locale);
        if (!active) return;
        if (!result) { setError(isArabic ? "تعذر تحميل الفرصة." : "Unable to load opportunity."); return; }
        setDetail(result); const o = result.opportunity; const r = o.roleRequirements ?? {};
        setTitle(o.title); setDescription(o.description); setCity(o.city || ""); setCountryCode(o.countryCode || "SA"); setCurrency(o.currency || "SAR"); setBudget(o.budget || "");
        setOpportunityType(o.opportunityType === "model" ? "model" : "actor");
        if (["fixed", "negotiable", "unpaid"].includes(o.compensationType || "")) setCompensationType(o.compensationType as CompensationType);
        if (["male", "female", "any"].includes(o.requiredGender || "")) setRequiredGender(o.requiredGender as Gender);
        setMinAge(o.minAge == null ? "" : String(o.minAge)); setMaxAge(o.maxAge == null ? "" : String(o.maxAge)); setRequiredCount(o.requiredCount == null ? "" : String(o.requiredCount));
        setWorkDate(o.workDate || ""); if (["1_hour", "2_hours", "4_hours", "full_day"].includes(o.workDuration || "")) setWorkDuration(o.workDuration as WorkDuration);
        setApplicationStartDate(o.applicationStartDate || ""); setApplicationDeadline(o.applicationDeadline || "");
        setLanguages(Array.isArray(r.languages) ? r.languages.filter((x): x is string => typeof x === "string") : []);
        setDialects(Array.isArray(r.dialects) ? r.dialects.filter((x): x is string => typeof x === "string") : []);
        const modeling = Array.isArray(r.modelingTypes) ? r.modelingTypes : Array.isArray(r.modeling_types) ? r.modeling_types : [];
        setModelingTypes(modeling.filter((x): x is string => typeof x === "string"));
        const height = r.minHeightCm ?? r.min_height_cm; setMinHeightCm(height == null ? "" : String(height));
        const hair = r.hairColor ?? r.hair_color; setHairColor(typeof hair === "string" ? hair : "");
      } catch { if (active) setError(isArabic ? "تعذر تحميل الفرصة. تحقق من الاتصال وحاول مرة أخرى." : "Unable to load opportunity. Check your connection and try again."); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [isArabic, locale, opportunityId]);

  const selectedCountry = COUNTRIES.find((item) => item.value === countryCode) ?? COUNTRIES[0];
  const selectedCity = SAUDI_CITY_OPTIONS.find((item) => item.value === city || item.ar === city || item.en === city);
  const filteredCities = SAUDI_CITY_OPTIONS.filter((item) => { const q = citySearch.trim().toLowerCase(); return !q || item.ar.includes(q) || item.en.toLowerCase().includes(q) || item.value.toLowerCase().includes(q); });
  const textRtl = isRtl ? styles.textRtl : null; const rowRtl = isRtl ? styles.rowRtl : null;

  function toggleValue(value: string, current: string[], setter: (next: string[]) => void) { setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]); }
  function openDate(field: DateField) { const source = field === "workDate" ? workDate : field === "applicationStartDate" ? applicationStartDate : applicationDeadline; setDateValue(parseIsoDate(source) ?? new Date()); setDateField(field); }
  function commitDate() { if (!dateField) return; const value = formatIsoDate(dateValue); if (dateField === "workDate") setWorkDate(value); else if (dateField === "applicationStartDate") setApplicationStartDate(value); else setApplicationDeadline(value); setDateField(null); }

  async function save() {
    if (saving) return;
    if (title.trim().length < 4 || description.trim().length < 20) { setError(isArabic ? "العنوان يجب أن يكون واضحًا والوصف 20 حرفًا على الأقل." : "Use a clear title and a description of at least 20 characters."); return; }
    setSaving(true); setError(null);
    try {
      const result = await managePublisherOpportunity(opportunityId, {
        action: "edit", title, description, city, countryCode, currency, budget: compensationType === "unpaid" ? "" : budget, opportunityType, compensationType, requiredGender,
        minAge: minAge ? Number(minAge) : null, maxAge: maxAge ? Number(maxAge) : null, requiredCount: requiredCount ? Number(requiredCount) : null,
        workDate: workDate || null, workDuration: workDuration || null, applicationStartDate: applicationStartDate || null, applicationDeadline: applicationDeadline || null,
        roleRequirements: opportunityType === "actor" ? { languages, dialects } : { modelingTypes, minHeightCm: minHeightCm ? Number(minHeightCm) : null, hairColor: hairColor || null },
      });
      if (!result.ok) { setError(editError(result.code, locale)); return; }
      router.back();
    } catch { setError(isArabic ? "تعذر حفظ التعديلات. تحقق من الاتصال وحاول مرة أخرى." : "Unable to save. Check your connection and try again."); }
    finally { setSaving(false); }
  }

  if (loading) return <SafeAreaView style={styles.centered}><ActivityIndicator size="large" color={theme.accent} /><Text style={styles.loadingText}>{isArabic ? "جارٍ تحميل الفرصة…" : "Loading opportunity…"}</Text></SafeAreaView>;
  if (!detail || detail.opportunity.status === "archived") return <SafeAreaView style={styles.centered}><Text accessibilityRole="alert" style={[styles.error, textRtl]}>{error || (isArabic ? "لا يمكن تعديل فرصة مؤرشفة." : "Archived opportunities cannot be edited.")}</Text><Pressable onPress={() => router.back()}><Text style={styles.backText}>{isArabic ? "رجوع" : "Back"}</Text></Pressable></SafeAreaView>;

  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}><SafeAreaView style={styles.screen} edges={["top", "bottom"]}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, compact && styles.contentCompact, { direction: isRtl ? "rtl" : "ltr" }]} showsVerticalScrollIndicator={false}>
    <View style={[styles.topBar, rowRtl]}><Pressable onPress={() => router.back()} style={styles.backButton}><BackIcon size={21} color={theme.text} /></Pressable><Text style={[styles.topLabel, textRtl]}>{isArabic ? "تعديل المسودة" : "Edit draft"}</Text></View>
    <View style={styles.hero}><Text style={[styles.eyebrow, isArabic && styles.noTracking, textRtl]}>{isArabic ? "ملامح للأعمال" : "MLAMH FOR BUSINESS"}</Text><Text accessibilityRole="header" style={[styles.title, compact && styles.titleCompact, textRtl]}>{isArabic ? "تعديل الفرصة" : "Edit opportunity"}</Text><Text style={[styles.body, textRtl]}>{isArabic ? "حدّث تفاصيل موجز الفرصة بنفس تجربة الإنشاء." : "Update the brief using the same native creation flow."}</Text></View>

    <View style={[styles.formCard, compact && styles.formCardCompact]}>
      <Field label={isArabic ? "العنوان" : "Title"} styles={styles} isRtl={isRtl}><TextInput value={title} onChangeText={setTitle} placeholderTextColor={theme.muted} style={[styles.input, textRtl]} /></Field>
      <Field label={isArabic ? "الوصف" : "Description"} styles={styles} isRtl={isRtl}><TextInput multiline value={description} onChangeText={setDescription} placeholderTextColor={theme.muted} style={[styles.input, styles.textarea, textRtl]} /></Field>
      <Field label={isArabic ? "نوع الموهبة" : "Talent type"} styles={styles} isRtl={isRtl}><View style={[styles.choices, rowRtl]}><Choice active={opportunityType === "actor"} label={isArabic ? "ممثل" : "Actor"} onPress={() => setOpportunityType("actor")} styles={styles} /><Choice active={opportunityType === "model"} label={isArabic ? "مودل" : "Model"} onPress={() => setOpportunityType("model")} styles={styles} /></View></Field>
      <View style={[styles.twoCol, compact && styles.stack, rowRtl]}><View style={styles.col}><Field label={isArabic ? "الدولة" : "Country"} styles={styles} isRtl={isRtl}><Selector value={locale === "ar" ? selectedCountry.ar : selectedCountry.en} onPress={() => setPicker("country")} styles={styles} isRtl={isRtl} /></Field></View><View style={styles.col}><Field label={isArabic ? "المدينة" : "City"} styles={styles} isRtl={isRtl}><Selector value={selectedCity ? (locale === "ar" ? selectedCity.ar : selectedCity.en) : ""} placeholder={isArabic ? "اختر المدينة" : "Choose city"} onPress={() => { setCitySearch(""); setPicker("city"); }} styles={styles} isRtl={isRtl} /></Field></View></View>
      <Field label={isArabic ? "الجنس المطلوب" : "Required gender"} styles={styles} isRtl={isRtl}><View style={[styles.choices, rowRtl]}><Choice active={requiredGender === "any"} label={isArabic ? "الجميع" : "Any"} onPress={() => setRequiredGender("any")} styles={styles} /><Choice active={requiredGender === "male"} label={isArabic ? "ذكر" : "Male"} onPress={() => setRequiredGender("male")} styles={styles} /><Choice active={requiredGender === "female"} label={isArabic ? "أنثى" : "Female"} onPress={() => setRequiredGender("female")} styles={styles} /></View></Field>
      <View style={[styles.twoCol, compact && styles.stack, rowRtl]}><View style={styles.col}><Field label={isArabic ? "العمر من" : "Min age"} styles={styles} isRtl={isRtl}><TextInput value={minAge} onChangeText={setMinAge} keyboardType="number-pad" style={[styles.input, textRtl]} /></Field></View><View style={styles.col}><Field label={isArabic ? "العمر إلى" : "Max age"} styles={styles} isRtl={isRtl}><TextInput value={maxAge} onChangeText={setMaxAge} keyboardType="number-pad" style={[styles.input, textRtl]} /></Field></View></View>
      <Field label={isArabic ? "عدد المواهب" : "Talent count"} styles={styles} isRtl={isRtl}><TextInput value={requiredCount} onChangeText={setRequiredCount} keyboardType="number-pad" style={[styles.input, textRtl]} /></Field>
      {opportunityType === "actor" ? <><Field label={isArabic ? "اللغات" : "Languages"} styles={styles} isRtl={isRtl}><MultiOptions options={LANGUAGE_OPTIONS} selected={languages} onToggle={(v) => toggleValue(v, languages, setLanguages)} locale={locale} styles={styles} isRtl={isRtl} /></Field><Field label={isArabic ? "اللهجات" : "Dialects"} styles={styles} isRtl={isRtl}><MultiOptions options={DIALECT_OPTIONS} selected={dialects} onToggle={(v) => toggleValue(v, dialects, setDialects)} locale={locale} styles={styles} isRtl={isRtl} /></Field></> : <><Field label={isArabic ? "أنواع المودل" : "Modeling types"} styles={styles} isRtl={isRtl}><MultiOptions options={MODELING_OPTIONS} selected={modelingTypes} onToggle={(v) => toggleValue(v, modelingTypes, setModelingTypes)} locale={locale} styles={styles} isRtl={isRtl} /></Field><View style={[styles.twoCol, compact && styles.stack, rowRtl]}><View style={styles.col}><Field label={isArabic ? "أقل طول سم" : "Min height cm"} styles={styles} isRtl={isRtl}><TextInput value={minHeightCm} onChangeText={setMinHeightCm} keyboardType="number-pad" style={[styles.input, textRtl]} /></Field></View><View style={styles.col}><Field label={isArabic ? "لون الشعر" : "Hair color"} styles={styles} isRtl={isRtl}><View style={[styles.choices, rowRtl]}>{HAIR_OPTIONS.map((o) => <Choice key={o.value} active={hairColor === o.value} label={locale === "ar" ? o.ar : o.en} onPress={() => setHairColor(o.value)} styles={styles} compact />)}</View></Field></View></View></>}
      <Field label={isArabic ? "تاريخ العمل" : "Work date"} styles={styles} isRtl={isRtl}><DateSelector value={workDate} placeholder={isArabic ? "اختر تاريخ العمل" : "Choose work date"} onPress={() => openDate("workDate")} styles={styles} isRtl={isRtl} /></Field>
      <Field label={isArabic ? "مدة العمل" : "Duration"} styles={styles} isRtl={isRtl}><View style={[styles.choices, rowRtl]}>{(["1_hour","2_hours","4_hours","full_day"] as const).map((v) => <Choice key={v} active={workDuration === v} label={durationLabel(v, locale)} onPress={() => setWorkDuration(v)} styles={styles} compact />)}</View></Field>
      <View style={[styles.twoCol, compact && styles.stack, rowRtl]}><View style={styles.col}><Field label={isArabic ? "بداية التقديم" : "Application start"} styles={styles} isRtl={isRtl}><DateSelector value={applicationStartDate} placeholder={isArabic ? "اختياري" : "Optional"} onPress={() => openDate("applicationStartDate")} styles={styles} isRtl={isRtl} /></Field></View><View style={styles.col}><Field label={isArabic ? "آخر موعد" : "Deadline"} styles={styles} isRtl={isRtl}><DateSelector value={applicationDeadline} placeholder={isArabic ? "اختياري" : "Optional"} onPress={() => openDate("applicationDeadline")} styles={styles} isRtl={isRtl} /></Field></View></View>
      <Field label={isArabic ? "المقابل" : "Compensation"} styles={styles} isRtl={isRtl}><View style={[styles.choices, rowRtl]}><Choice active={compensationType === "fixed"} label={isArabic ? "محدد" : "Fixed"} onPress={() => setCompensationType("fixed")} styles={styles} /><Choice active={compensationType === "negotiable"} label={isArabic ? "حسب الاتفاق" : "Negotiable"} onPress={() => setCompensationType("negotiable")} styles={styles} /><Choice active={compensationType === "unpaid"} label={isArabic ? "بدون مقابل" : "Unpaid"} onPress={() => setCompensationType("unpaid")} styles={styles} /></View></Field>
      {compensationType !== "unpaid" ? <View style={[styles.twoCol, compact && styles.stack, rowRtl]}><View style={styles.col}><Field label={isArabic ? "القيمة" : "Amount"} styles={styles} isRtl={isRtl}><TextInput value={budget} onChangeText={setBudget} keyboardType="decimal-pad" style={[styles.input, textRtl]} /></Field></View><View style={styles.col}><Field label={isArabic ? "العملة" : "Currency"} styles={styles} isRtl={isRtl}><View style={styles.lockedValue}><Text style={styles.lockedValueText}>{currency}</Text></View></Field></View></View> : null}
    </View>
    {error ? <View style={styles.errorBox}><Text accessibilityRole="alert" style={[styles.error, textRtl]}>{error}</Text></View> : null}
    <Pressable disabled={saving} style={[styles.save, saving && styles.disabled]} onPress={() => void save()}><Text style={styles.saveText}>{saving ? (isArabic ? "جارٍ الحفظ…" : "Saving…") : (isArabic ? "حفظ التعديلات" : "Save changes")}</Text></Pressable>
  </ScrollView>

  <Modal transparent visible={picker !== null} animationType="slide" onRequestClose={() => setPicker(null)}><Pressable style={styles.modalBackdrop} onPress={() => setPicker(null)} /><SafeAreaView style={styles.sheetSafe} edges={["bottom"]}><View style={styles.sheet}><View style={[styles.sheetHeader, rowRtl]}><View><Text style={[styles.sheetTitle, textRtl]}>{picker === "city" ? (isArabic ? "اختر المدينة" : "Choose city") : (isArabic ? "اختر الدولة" : "Choose country")}</Text>{picker === "country" ? <Text style={[styles.sheetSubtitle, textRtl]}>{isArabic ? "الأسواق الأخرى جاهزة وسيتم تفعيلها لاحقًا." : "Other prepared markets will be enabled later."}</Text> : null}</View><Pressable onPress={() => setPicker(null)} style={styles.sheetClose}><X size={19} color={theme.text} /></Pressable></View>{picker === "city" ? <View style={[styles.searchBox, rowRtl]}><Search size={17} color={theme.muted} /><TextInput value={citySearch} onChangeText={setCitySearch} placeholder={isArabic ? "ابحث عن مدينة" : "Search cities"} placeholderTextColor={theme.muted} style={[styles.searchInput, textRtl]} /></View> : null}<ScrollView style={styles.sheetList}>{(picker === "city" ? filteredCities.map((item) => ({ ...item, enabled: true })) : COUNTRIES).map((item) => { const active = picker === "city" ? city === item.value : countryCode === item.value; const enabled = "enabled" in item ? item.enabled : true; return <Pressable key={item.value} disabled={!enabled} onPress={() => { if (picker === "city") setCity(item.value); else { setCountryCode(item.value); const market = COUNTRIES.find((entry) => entry.value === item.value); if (market) setCurrency(market.currency); setCity(""); } setPicker(null); }} style={[styles.sheetRow, rowRtl, active && styles.sheetRowActive, !enabled && styles.sheetRowDisabled]}><Text style={[styles.sheetRowText, textRtl, active && styles.sheetRowTextActive]}>{locale === "ar" ? item.ar : item.en}</Text>{!enabled ? <Text style={styles.preparedBadge}>{isArabic ? "قريبًا" : "Prepared"}</Text> : active ? <Check size={18} color={theme.accent} /> : null}</Pressable>; })}{picker === "city" && filteredCities.length === 0 ? <Text style={[styles.noResults, textRtl]}>{isArabic ? "لا توجد مدينة مطابقة." : "No matching city."}</Text> : null}</ScrollView></View></SafeAreaView></Modal>

  <Modal transparent visible={dateField !== null} animationType="slide" onRequestClose={() => setDateField(null)}><Pressable style={styles.modalBackdrop} onPress={() => setDateField(null)} /><SafeAreaView style={styles.sheetSafe} edges={["bottom"]}><View style={styles.dateSheet}><View style={[styles.sheetHeader, rowRtl]}><Text style={[styles.sheetTitle, textRtl]}>{dateFieldLabel(dateField, locale)}</Text><Pressable onPress={() => setDateField(null)} style={styles.sheetClose}><X size={19} color={theme.text} /></Pressable></View><DateTimePicker value={dateValue} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"} locale={isArabic ? "ar-SA" : "en-US"} onChange={(_, next) => { if (next) setDateValue(next); }} themeVariant="dark" /><View style={[styles.dateActions, rowRtl]}><Pressable onPress={() => setDateField(null)} style={styles.dateCancel}><Text style={styles.dateCancelText}>{isArabic ? "إلغاء" : "Cancel"}</Text></Pressable><Pressable onPress={commitDate} style={styles.dateConfirm}><Text style={styles.dateConfirmText}>{isArabic ? "اعتماد التاريخ" : "Use date"}</Text></Pressable></View></View></SafeAreaView></Modal>
  </SafeAreaView></KeyboardAvoidingView>;
}

function Field({ label, children, styles, isRtl }: { label: string; children: React.ReactNode; styles: ReturnType<typeof createStyles>; isRtl: boolean }) { return <View style={styles.field}><Text style={[styles.label, isRtl && styles.textRtl]}>{label}</Text>{children}</View>; }
function Choice({ active, label, onPress, styles, compact = false }: { active: boolean; label: string; onPress: () => void; styles: ReturnType<typeof createStyles>; compact?: boolean }) { return <Pressable onPress={onPress} style={[styles.choice, compact && styles.choiceCompact, active && styles.choiceActive]}><Text style={[styles.choiceText, active && styles.choiceTextActive]}>{label}</Text></Pressable>; }
function Selector({ value, placeholder, onPress, styles, isRtl }: { value: string; placeholder?: string; onPress: () => void; styles: ReturnType<typeof createStyles>; isRtl: boolean }) { return <Pressable onPress={onPress} style={[styles.selector, isRtl && styles.rowRtl]}><Text numberOfLines={1} style={[styles.selectorText, !value && styles.selectorPlaceholder, isRtl && styles.textRtl]}>{value || placeholder}</Text><ChevronDown size={18} color={darkTheme.muted} /></Pressable>; }
function DateSelector({ value, placeholder, onPress, styles, isRtl }: { value: string; placeholder: string; onPress: () => void; styles: ReturnType<typeof createStyles>; isRtl: boolean }) { return <Pressable onPress={onPress} style={[styles.selector, isRtl && styles.rowRtl]}><Text style={[styles.selectorText, !value && styles.selectorPlaceholder, isRtl && styles.textRtl]}>{value || placeholder}</Text><CalendarDays size={17} color={darkTheme.accent} /></Pressable>; }
function MultiOptions({ options, selected, onToggle, locale, styles, isRtl }: { options: Option[]; selected: string[]; onToggle: (value: string) => void; locale: "ar" | "en"; styles: ReturnType<typeof createStyles>; isRtl: boolean }) { return <View style={[styles.choices, isRtl && styles.rowRtl]}>{options.map((item) => <Choice key={item.value} active={selected.includes(item.value)} label={locale === "ar" ? item.ar : item.en} onPress={() => onToggle(item.value)} styles={styles} compact />)}</View>; }
function formatIsoDate(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function parseIsoDate(value: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null; const [y,m,d] = value.split("-").map(Number); const date = new Date(y, m - 1, d); return Number.isNaN(date.getTime()) ? null : date; }
function durationLabel(value: Exclude<WorkDuration, "">, locale: "ar" | "en") { const ar = { "1_hour": "ساعة", "2_hours": "ساعتان", "4_hours": "4 ساعات", full_day: "يوم كامل" }; const en = { "1_hour": "1 hour", "2_hours": "2 hours", "4_hours": "4 hours", full_day: "Full day" }; return (locale === "ar" ? ar : en)[value]; }
function dateFieldLabel(field: DateField | null, locale: "ar" | "en") { if (field === "workDate") return locale === "ar" ? "تاريخ العمل" : "Work date"; if (field === "applicationStartDate") return locale === "ar" ? "بداية التقديم" : "Application start"; return locale === "ar" ? "آخر موعد للتقديم" : "Application deadline"; }
function editError(code: string, locale: "ar" | "en") { const ar: Record<string,string> = { EDIT_LOCKED: "لا يمكن تعديل الفرصة في حالتها الحالية.", ARCHIVED: "لا يمكن تعديل فرصة مؤرشفة.", FORBIDDEN: "لا تملك صلاحية تعديل هذه الفرصة.", INVALID_TITLE: "العنوان غير صالح.", INVALID_DESCRIPTION: "الوصف غير صالح.", INVALID_COUNTRY: "اختر دولة صحيحة.", INVALID_CURRENCY: "اختر عملة صحيحة.", INVALID_AGE_RANGE: "راجع نطاق العمر.", INVALID_DATE: "راجع التواريخ المحددة.", INVALID_APPLICATION_WINDOW: "راجع فترة التقديم.", INVALID_NUMERIC_FIELD: "راجع القيم الرقمية.", INVALID_ROLE_REQUIREMENTS: "راجع متطلبات الدور." }; const en: Record<string,string> = { EDIT_LOCKED: "This opportunity cannot be edited in its current state.", ARCHIVED: "Archived opportunities cannot be edited.", FORBIDDEN: "You do not have permission to edit this opportunity.", INVALID_TITLE: "Invalid title.", INVALID_DESCRIPTION: "Invalid description.", INVALID_COUNTRY: "Choose a valid country.", INVALID_CURRENCY: "Choose a valid currency.", INVALID_AGE_RANGE: "Check the age range.", INVALID_DATE: "Check the selected dates.", INVALID_APPLICATION_WINDOW: "Check the application window.", INVALID_NUMERIC_FIELD: "Check numeric values.", INVALID_ROLE_REQUIREMENTS: "Check role requirements." }; return (locale === "ar" ? ar : en)[code] ?? (locale === "ar" ? "تعذر حفظ التعديلات." : "Unable to save changes."); }

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen:{flex:1,backgroundColor:theme.background}, centered:{flex:1,alignItems:"center",justifyContent:"center",gap:14,padding:24,backgroundColor:theme.background}, loadingText:{color:theme.muted,fontSize:12},
  content:{width:"100%",maxWidth:720,alignSelf:"center",paddingHorizontal:18,paddingTop:18,paddingBottom:40,gap:15}, contentCompact:{paddingHorizontal:14,paddingTop:14,gap:12}, rowRtl:{flexDirection:"row-reverse"}, textRtl:{textAlign:"right",writingDirection:"rtl"}, noTracking:{letterSpacing:0,writingDirection:"rtl"},
  topBar:{minHeight:50,flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:2}, backButton:{width:44,height:44,borderRadius:22,borderWidth:1,borderColor:theme.border,backgroundColor:theme.surface,alignItems:"center",justifyContent:"center"}, topLabel:{color:theme.muted,fontSize:11,fontWeight:"700"}, backText:{color:theme.accent,fontSize:13,fontWeight:"800"},
  hero:{gap:7,paddingVertical:2,marginBottom:2}, eyebrow:{color:theme.accent,fontSize:9,fontWeight:"900",letterSpacing:1.5}, title:{color:theme.text,fontSize:29,lineHeight:35,fontWeight:"800"}, titleCompact:{fontSize:25,lineHeight:31}, body:{color:theme.muted,fontSize:12,lineHeight:19},
  formCard:{borderWidth:1,borderColor:theme.border,borderRadius:20,backgroundColor:theme.surface,padding:15,gap:15}, formCardCompact:{padding:12,gap:13}, field:{gap:7}, label:{color:theme.text,fontSize:11,fontWeight:"800"}, input:{minHeight:48,borderWidth:1,borderColor:theme.border,borderRadius:13,paddingHorizontal:13,paddingVertical:Platform.OS==="ios"?13:10,color:theme.text,backgroundColor:theme.background,fontSize:13}, textarea:{minHeight:108,textAlignVertical:"top"},
  twoCol:{flexDirection:"row",gap:9}, stack:{flexDirection:"column"}, col:{flex:1,minWidth:0}, choices:{flexDirection:"row",flexWrap:"wrap",gap:7}, choice:{minHeight:42,borderWidth:1,borderColor:theme.border,borderRadius:12,paddingHorizontal:12,paddingVertical:9,backgroundColor:theme.background,justifyContent:"center"}, choiceCompact:{minHeight:38,paddingHorizontal:10,paddingVertical:7}, choiceActive:{backgroundColor:theme.accent,borderColor:theme.accent}, choiceText:{color:theme.muted,fontSize:10,fontWeight:"800"}, choiceTextActive:{color:theme.background},
  selector:{minHeight:48,borderRadius:13,borderWidth:1,borderColor:theme.border,backgroundColor:theme.background,paddingHorizontal:13,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:8}, selectorText:{flex:1,color:theme.text,fontSize:12,fontWeight:"700"}, selectorPlaceholder:{color:theme.muted,fontWeight:"500"}, lockedValue:{minHeight:48,borderRadius:13,borderWidth:1,borderColor:theme.border,backgroundColor:theme.chip,alignItems:"center",justifyContent:"center"}, lockedValueText:{color:theme.accent,fontSize:12,fontWeight:"900"},
  errorBox:{borderWidth:1,borderColor:"#C84F4F66",backgroundColor:"#C84F4F14",borderRadius:13,padding:12}, error:{color:"#E59A9A",fontSize:12,lineHeight:18}, save:{minHeight:52,alignItems:"center",justifyContent:"center",borderRadius:14,backgroundColor:theme.accent}, saveText:{color:theme.background,fontSize:13,fontWeight:"900"}, disabled:{opacity:.5},
  modalBackdrop:{...StyleSheet.absoluteFill,backgroundColor:"#000000A8"}, sheetSafe:{marginTop:"auto",backgroundColor:theme.surface,borderTopLeftRadius:24,borderTopRightRadius:24,overflow:"hidden"}, sheet:{maxHeight:"68%",minHeight:260,borderTopWidth:1,borderColor:theme.border,paddingHorizontal:16,paddingTop:15,paddingBottom:8}, dateSheet:{borderTopWidth:1,borderColor:theme.border,paddingHorizontal:16,paddingTop:15,paddingBottom:12}, sheetHeader:{flexDirection:"row",alignItems:"flex-start",justifyContent:"space-between",gap:12,marginBottom:12}, sheetTitle:{color:theme.text,fontSize:18,fontWeight:"900"}, sheetSubtitle:{color:theme.muted,fontSize:10,lineHeight:15,marginTop:3}, sheetClose:{width:40,height:40,borderRadius:20,borderWidth:1,borderColor:theme.border,alignItems:"center",justifyContent:"center"},
  searchBox:{minHeight:46,borderRadius:13,borderWidth:1,borderColor:theme.border,backgroundColor:theme.background,flexDirection:"row",alignItems:"center",gap:9,paddingHorizontal:12,marginBottom:10}, searchInput:{flex:1,color:theme.text,fontSize:12,paddingVertical:10}, sheetList:{flexGrow:0}, sheetRow:{minHeight:50,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:10,borderBottomWidth:1,borderBottomColor:theme.border,paddingHorizontal:4}, sheetRowActive:{backgroundColor:"#C9A96209"}, sheetRowDisabled:{opacity:.42}, sheetRowText:{flex:1,color:theme.text,fontSize:13,fontWeight:"700"}, sheetRowTextActive:{color:theme.accent,fontWeight:"900"}, preparedBadge:{color:theme.muted,fontSize:9,fontWeight:"800",borderWidth:1,borderColor:theme.border,borderRadius:999,paddingHorizontal:8,paddingVertical:4}, noResults:{color:theme.muted,fontSize:12,paddingVertical:28,textAlign:"center"},
  dateActions:{flexDirection:"row",gap:9,marginTop:8}, dateCancel:{flex:1,minHeight:48,borderRadius:13,borderWidth:1,borderColor:theme.border,alignItems:"center",justifyContent:"center"}, dateCancelText:{color:theme.text,fontSize:12,fontWeight:"800"}, dateConfirm:{flex:1,minHeight:48,borderRadius:13,backgroundColor:theme.accent,alignItems:"center",justifyContent:"center"}, dateConfirmText:{color:theme.background,fontSize:12,fontWeight:"900"},
}); }
