import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Search, X } from "lucide-react-native";

import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { goBackOrReplace } from "@/lib/navigation";
import { createPublisherOpportunityDraft } from "@/lib/publisher-api";
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
  { value: "ar", ar: "العربية", en: "Arabic" }, { value: "en", ar: "الإنجليزية", en: "English" },
  { value: "fr", ar: "الفرنسية", en: "French" }, { value: "es", ar: "الإسبانية", en: "Spanish" },
  { value: "ur", ar: "الأردية", en: "Urdu" },
];
const DIALECT_OPTIONS: Option[] = [
  { value: "najdi", ar: "نجدي", en: "Najdi" }, { value: "hejazi", ar: "حجازي", en: "Hejazi" },
  { value: "gulf", ar: "خليجي", en: "Gulf" }, { value: "saudi", ar: "سعودي عام", en: "Saudi" },
  { value: "levantine", ar: "شامي", en: "Levantine" }, { value: "egyptian", ar: "مصري", en: "Egyptian" },
  { value: "moroccan", ar: "مغربي", en: "Moroccan" },
];
const MODELING_OPTIONS: Option[] = [
  { value: "commercial", ar: "تجاري", en: "Commercial" }, { value: "fashion", ar: "أزياء", en: "Fashion" },
  { value: "beauty", ar: "جمال", en: "Beauty" }, { value: "lifestyle", ar: "لايف ستايل", en: "Lifestyle" },
  { value: "ecommerce", ar: "متاجر إلكترونية", en: "E-commerce" }, { value: "fitness", ar: "رياضي", en: "Fitness" },
];
const HAIR_OPTIONS: Option[] = [
  { value: "black", ar: "أسود", en: "Black" }, { value: "brown", ar: "بني", en: "Brown" },
  { value: "blonde", ar: "أشقر", en: "Blonde" }, { value: "red", ar: "أحمر", en: "Red" },
  { value: "gray", ar: "رمادي", en: "Gray" }, { value: "other", ar: "أخرى", en: "Other" },
];

function latinDigits(value: string) {
  return value.replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))).replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
}
function integerInput(value: string) { return latinDigits(value).replace(/[^0-9]/g, ""); }
function numericInput(value: string) { return latinDigits(value).replace(/[^0-9.]/g, ""); }

export default function NewPublisherOpportunityScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const { width } = useWindowDimensions();
  const compact = width <= 360;
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<OpportunityType>("actor");
  const [city, setCity] = useState("");
  const [countryCode, setCountryCode] = useState("SA");
  const [compensation, setCompensation] = useState<CompensationType>("fixed");
  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState("SAR");
  const [requiredGender, setRequiredGender] = useState<Gender>("any");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [requiredCount, setRequiredCount] = useState("");
  const [workDate, setWorkDate] = useState("");
  const [workDuration, setWorkDuration] = useState<WorkDuration>("");
  const [applicationStartDate, setApplicationStartDate] = useState("");
  const [applicationDeadline, setApplicationDeadline] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [dialects, setDialects] = useState<string[]>([]);
  const [modelingTypes, setModelingTypes] = useState<string[]>([]);
  const [minHeightCm, setMinHeightCm] = useState("");
  const [hairColor, setHairColor] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picker, setPicker] = useState<"city" | "country" | null>(null);
  const [citySearch, setCitySearch] = useState("");
  const [dateField, setDateField] = useState<DateField | null>(null);
  const [dateValue, setDateValue] = useState(new Date());

  const selectedCountry = COUNTRIES.find((item) => item.value === countryCode) ?? COUNTRIES[0];
  const selectedCity = SAUDI_CITY_OPTIONS.find((item) => item.value === city || item.ar === city || item.en === city);
  const filteredCities = SAUDI_CITY_OPTIONS.filter((item) => {
    const query = citySearch.trim().toLowerCase();
    return !query || item.ar.includes(query) || item.en.toLowerCase().includes(query) || item.value.toLowerCase().includes(query);
  });

  function toggleValue(value: string, current: string[], setter: (next: string[]) => void) { setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]); }
  function openDate(field: DateField) {
    const source = field === "workDate" ? workDate : field === "applicationStartDate" ? applicationStartDate : applicationDeadline;
    setDateValue(parseIsoDate(source) ?? new Date()); setDateField(field);
  }
  function commitDate() {
    if (!dateField) return;
    const value = formatIsoDate(dateValue);
    if (dateField === "workDate") setWorkDate(value); else if (dateField === "applicationStartDate") setApplicationStartDate(value); else setApplicationDeadline(value);
    setDateField(null);
  }

  async function saveDraft() {
    if (saving) return;
    if (title.trim().length < 3) return setError(isArabic ? "أدخل عنوانًا واضحًا للفرصة." : "Enter a clear opportunity title.");
    if (description.trim().length < 10) return setError(isArabic ? "أضف وصفًا أوضح للفرصة." : "Add a clearer opportunity description.");
    setSaving(true); setError(null);
    try {
      const result = await createPublisherOpportunityDraft({
        title, description, opportunityType: type, city, countryCode, compensationType: compensation,
        budget: compensation === "unpaid" ? undefined : budget, currency: compensation === "unpaid" ? undefined : currency,
        requiredGender, minAge: minAge ? Number(minAge) : null, maxAge: maxAge ? Number(maxAge) : null,
        requiredCount: requiredCount ? Number(requiredCount) : null, workDate: workDate || null, workDuration: workDuration || null,
        applicationStartDate: applicationStartDate || null, applicationDeadline: applicationDeadline || null,
        roleRequirements: type === "actor" ? { languages, dialects } : { modelingTypes, minHeightCm: minHeightCm ? Number(minHeightCm) : null, hairColor: hairColor || null },
      });
      if (!result.ok) {
        const messages: Record<string, string> = {
          INVALID_TITLE: isArabic ? "العنوان قصير جدًا." : "The title is too short.", INVALID_DESCRIPTION: isArabic ? "أضف وصفًا أوضح للفرصة." : "Add a clearer opportunity description.",
          INVALID_COUNTRY: isArabic ? "اختر دولة صحيحة." : "Choose a valid country.", INVALID_CURRENCY: isArabic ? "اختر عملة صحيحة." : "Choose a valid currency.",
          INVALID_AGE_RANGE: isArabic ? "راجع نطاق العمر المطلوب." : "Check the required age range.", INVALID_DATE: isArabic ? "راجع التواريخ المحددة." : "Check the selected dates.",
          INVALID_APPLICATION_WINDOW: isArabic ? "تاريخ بداية التقديم يجب أن يسبق آخر موعد." : "Application start date must be before the deadline.", INVALID_NUMERIC_FIELD: isArabic ? "راجع العدد أو القيم الرقمية." : "Check the numeric values.",
          INVALID_ROLE_REQUIREMENTS: isArabic ? "راجع متطلبات الدور." : "Check the role requirements.", PUBLISHER_NOT_APPROVED: isArabic ? "يجب اعتماد حساب الجهة قبل إنشاء الفرص." : "Publisher approval is required before creating opportunities.",
          PUBLISHER_NOT_VERIFIED: isArabic ? "يجب توثيق الجهة قبل إنشاء الفرص." : "Your organization must be verified before creating opportunities.", ACCOUNT_RESTRICTED: isArabic ? "الحساب غير متاح لإنشاء فرص حاليًا." : "This account cannot create opportunities right now.",
        };
        setError(messages[result.code] ?? (isArabic ? "تعذر حفظ المسودة." : "Unable to save draft.")); return;
      }
      router.replace(`/publisher/opportunities/${result.item.id}`);
    } catch { setError(isArabic ? "تعذر حفظ المسودة. تحقق من الاتصال وحاول مرة أخرى." : "Unable to save draft. Check your connection and try again."); }
    finally { setSaving(false); }
  }

  const textRtl = isRtl ? styles.textRtl : null;
  const rowRtl = isRtl ? styles.rowRtl : null;
  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={[styles.content, compact && styles.contentCompact, { direction: isRtl ? "rtl" : "ltr" }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.topBar, rowRtl]}><Pressable onPress={() => goBackOrReplace("/publisher")} accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} style={styles.backButton}><BackIcon size={21} color={theme.text} strokeWidth={1.9}/></Pressable><Text style={[styles.stepLabel, textRtl]}>{isArabic ? "مسودة جديدة" : "New draft"}</Text></View>
        <View style={styles.hero}><Text style={[styles.eyebrow, isArabic && styles.noTracking, textRtl]}>{isArabic ? "ملامح للأعمال" : "MLAMH FOR BUSINESS"}</Text><Text accessibilityRole="header" style={[styles.title, compact && styles.titleCompact, textRtl]}>{isArabic ? "أنشئ فرصة" : "Create opportunity"}</Text><Text style={[styles.subtitle, textRtl]}>{isArabic ? "أنشئ موجز فرصة منظمًا وواضحًا للمواهب. سنحفظه كمسودة أولًا قبل الإرسال للمراجعة." : "Create a clear structured brief for talent. It will be saved as a draft before review."}</Text></View>

        <View style={[styles.formCard, compact && styles.formCardCompact]}>
          <Text style={[styles.requiredLegend, textRtl]}><Text style={styles.requiredMark}>*</Text> {isArabic ? "حقل مطلوب" : "Required field"}</Text>
          <Field required label={isArabic ? "عنوان الفرصة" : "Opportunity title"} styles={styles} isRtl={isRtl}><TextInput value={title} onChangeText={(value) => { setTitle(value); setError(null); }} placeholder={isArabic ? "مثال: ممثل لحملة تجارية" : "Example: Actor for a commercial campaign"} placeholderTextColor={theme.muted} style={[styles.input, textRtl]}/></Field>
          <Field required label={isArabic ? "الفئة" : "Category"} styles={styles} isRtl={isRtl}><View style={[styles.choices, rowRtl]}><Choice active={type === "actor"} label={isArabic ? "ممثل" : "Actor"} onPress={() => setType("actor")} styles={styles}/><Choice active={type === "model"} label={isArabic ? "مودل" : "Model"} onPress={() => setType("model")} styles={styles}/></View></Field>
          <Field required label={isArabic ? "الوصف" : "Description"} styles={styles} isRtl={isRtl}><TextInput multiline value={description} onChangeText={(value) => { setDescription(value); setError(null); }} placeholder={isArabic ? "المشروع، الدور، المطلوب وطريقة التنفيذ" : "Project, role, requirements and execution details"} placeholderTextColor={theme.muted} style={[styles.input, styles.textarea, textRtl]}/></Field>
          <View style={[styles.twoCol, compact && styles.stack, rowRtl]}><View style={styles.col}><Field label={isArabic ? "الدولة" : "Country"} styles={styles} isRtl={isRtl}><Selector value={locale === "ar" ? selectedCountry.ar : selectedCountry.en} onPress={() => setPicker("country")} styles={styles} isRtl={isRtl}/></Field></View><View style={styles.col}><Field label={isArabic ? "المدينة" : "City"} styles={styles} isRtl={isRtl}><Selector value={selectedCity ? (locale === "ar" ? selectedCity.ar : selectedCity.en) : ""} placeholder={isArabic ? "اختر المدينة" : "Choose city"} onPress={() => { setCitySearch(""); setPicker("city"); }} styles={styles} isRtl={isRtl}/></Field></View></View>
          <Field label={isArabic ? "الجنس المطلوب" : "Required gender"} styles={styles} isRtl={isRtl}><View style={[styles.choices, rowRtl]}><Choice active={requiredGender === "any"} label={isArabic ? "الجميع" : "Any"} onPress={() => setRequiredGender("any")} styles={styles}/><Choice active={requiredGender === "male"} label={isArabic ? "ذكر" : "Male"} onPress={() => setRequiredGender("male")} styles={styles}/><Choice active={requiredGender === "female"} label={isArabic ? "أنثى" : "Female"} onPress={() => setRequiredGender("female")} styles={styles}/></View></Field>
          <View style={[styles.twoCol, compact && styles.stack, rowRtl]}><View style={styles.col}><Field label={isArabic ? "العمر من" : "Min age"} styles={styles} isRtl={isRtl}><TextInput value={minAge} onChangeText={(value) => setMinAge(integerInput(value))} keyboardType="number-pad" placeholder="18" placeholderTextColor={theme.muted} style={[styles.input, textRtl]}/></Field></View><View style={styles.col}><Field label={isArabic ? "العمر إلى" : "Max age"} styles={styles} isRtl={isRtl}><TextInput value={maxAge} onChangeText={(value) => setMaxAge(integerInput(value))} keyboardType="number-pad" placeholder="35" placeholderTextColor={theme.muted} style={[styles.input, textRtl]}/></Field></View></View>
          <Field label={isArabic ? "عدد المواهب المطلوبة" : "Required talent count"} styles={styles} isRtl={isRtl}><TextInput value={requiredCount} onChangeText={(value) => setRequiredCount(integerInput(value))} keyboardType="number-pad" placeholder="1" placeholderTextColor={theme.muted} style={[styles.input, textRtl]}/></Field>
          {type === "actor" ? <><Field label={isArabic ? "اللغات المطلوبة" : "Required languages"} styles={styles} isRtl={isRtl}><MultiOptions options={LANGUAGE_OPTIONS} selected={languages} onToggle={(value) => toggleValue(value, languages, setLanguages)} locale={locale} styles={styles} isRtl={isRtl}/></Field><Field label={isArabic ? "اللهجات" : "Dialects"} styles={styles} isRtl={isRtl}><MultiOptions options={DIALECT_OPTIONS} selected={dialects} onToggle={(value) => toggleValue(value, dialects, setDialects)} locale={locale} styles={styles} isRtl={isRtl}/></Field></> : <><Field label={isArabic ? "أنواع أعمال المودل" : "Modeling types"} styles={styles} isRtl={isRtl}><MultiOptions options={MODELING_OPTIONS} selected={modelingTypes} onToggle={(value) => toggleValue(value, modelingTypes, setModelingTypes)} locale={locale} styles={styles} isRtl={isRtl}/></Field><View style={[styles.twoCol, compact && styles.stack, rowRtl]}><View style={styles.col}><Field label={isArabic ? "الحد الأدنى للطول سم" : "Min height cm"} styles={styles} isRtl={isRtl}><TextInput value={minHeightCm} onChangeText={(value) => setMinHeightCm(integerInput(value))} keyboardType="number-pad" placeholder="170" placeholderTextColor={theme.muted} style={[styles.input, textRtl]}/></Field></View><View style={styles.col}><Field label={isArabic ? "لون الشعر" : "Hair color"} styles={styles} isRtl={isRtl}><View style={[styles.choices, rowRtl]}>{HAIR_OPTIONS.map((option) => <Choice key={option.value} active={hairColor === option.value} label={locale === "ar" ? option.ar : option.en} onPress={() => setHairColor(option.value)} styles={styles} compact/>)}</View></Field></View></View></>}
          <Field label={isArabic ? "تاريخ العمل" : "Work date"} styles={styles} isRtl={isRtl}><DateSelector value={workDate} placeholder={isArabic ? "اختر تاريخ العمل" : "Choose work date"} onPress={() => openDate("workDate")} styles={styles} isRtl={isRtl}/></Field>
          <Field label={isArabic ? "مدة العمل" : "Duration"} styles={styles} isRtl={isRtl}><View style={[styles.choices, rowRtl]}>{(["1_hour", "2_hours", "4_hours", "full_day"] as const).map((value) => <Choice key={value} active={workDuration === value} label={durationLabel(value, locale)} onPress={() => setWorkDuration(value)} styles={styles} compact/>)}</View></Field>
          <View style={[styles.twoCol, compact && styles.stack, rowRtl]}><View style={styles.col}><Field label={isArabic ? "بداية التقديم" : "Application start"} styles={styles} isRtl={isRtl}><DateSelector value={applicationStartDate} placeholder={isArabic ? "اختياري" : "Optional"} onPress={() => openDate("applicationStartDate")} styles={styles} isRtl={isRtl}/></Field></View><View style={styles.col}><Field label={isArabic ? "آخر موعد" : "Deadline"} styles={styles} isRtl={isRtl}><DateSelector value={applicationDeadline} placeholder={isArabic ? "اختياري" : "Optional"} onPress={() => openDate("applicationDeadline")} styles={styles} isRtl={isRtl}/></Field></View></View>
          <Field label={isArabic ? "المقابل" : "Compensation"} styles={styles} isRtl={isRtl}><View style={[styles.choices, rowRtl]}><Choice active={compensation === "fixed"} label={isArabic ? "محدد" : "Fixed"} onPress={() => setCompensation("fixed")} styles={styles}/><Choice active={compensation === "negotiable"} label={isArabic ? "حسب الاتفاق" : "Negotiable"} onPress={() => setCompensation("negotiable")} styles={styles}/><Choice active={compensation === "unpaid"} label={isArabic ? "بدون مقابل" : "Unpaid"} onPress={() => setCompensation("unpaid")} styles={styles}/></View></Field>
          {compensation !== "unpaid" ? <View style={[styles.twoCol, compact && styles.stack, rowRtl]}><View style={styles.col}><Field label={isArabic ? "القيمة" : "Amount"} styles={styles} isRtl={isRtl}><TextInput value={budget} onChangeText={(value) => setBudget(numericInput(value))} keyboardType="decimal-pad" placeholder="1500" placeholderTextColor={theme.muted} style={[styles.input, textRtl]}/></Field></View><View style={styles.col}><Field label={isArabic ? "العملة" : "Currency"} styles={styles} isRtl={isRtl}><View style={styles.lockedValue}><Text style={styles.lockedValueText}>{currency}</Text></View></Field></View></View> : null}
        </View>

        <View style={styles.reviewHint}><Text style={[styles.reviewHintTitle, textRtl]}>{isArabic ? "المراجعة قبل النشر" : "Review before publishing"}</Text><Text style={[styles.reviewHintBody, textRtl]}>{isArabic ? "سنحفظ الفرصة كمسودة أولًا. بعدها يمكنك مراجعتها وإرسالها لفريق ملامح قبل النشر." : "The opportunity is saved as a draft first. You can review it before submitting it to MLAMH."}</Text></View>
        {error ? <View style={styles.errorBox}><Text accessibilityRole="alert" style={[styles.error, textRtl]}>{error}</Text></View> : null}
        <Pressable disabled={saving} onPress={() => void saveDraft()} style={[styles.save, saving && styles.disabled]}><Text style={styles.saveText}>{saving ? (isArabic ? "جارٍ الحفظ…" : "Saving…") : (isArabic ? "حفظ المسودة" : "Save draft")}</Text></Pressable>
      </ScrollView>

      <Modal transparent visible={picker !== null} animationType="slide" onRequestClose={() => setPicker(null)}><Pressable style={styles.modalBackdrop} onPress={() => setPicker(null)}/><SafeAreaView style={styles.sheetSafe} edges={["bottom"]}><View style={styles.sheet}><View style={[styles.sheetHeader, rowRtl]}><View><Text style={[styles.sheetTitle, textRtl]}>{picker === "city" ? (isArabic ? "اختر المدينة" : "Choose city") : (isArabic ? "اختر الدولة" : "Choose country")}</Text>{picker === "country" ? <Text style={[styles.sheetSubtitle, textRtl]}>{isArabic ? "الأسواق الأخرى جاهزة وسيتم تفعيلها لاحقًا." : "Other prepared markets will be enabled later."}</Text> : null}</View><Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "إغلاق" : "Close"} onPress={() => setPicker(null)} style={styles.sheetClose}><X size={19} color={theme.text}/></Pressable></View>{picker === "city" ? <View style={[styles.searchBox, rowRtl]}><Search size={17} color={theme.muted}/><TextInput value={citySearch} onChangeText={setCitySearch} placeholder={isArabic ? "ابحث عن مدينة" : "Search cities"} placeholderTextColor={theme.muted} style={[styles.searchInput, textRtl]}/></View> : null}<ScrollView style={styles.sheetList} keyboardShouldPersistTaps="handled">{(picker === "city" ? filteredCities.map((item) => ({ ...item, enabled: true })) : COUNTRIES).map((item) => { const active = picker === "city" ? city === item.value : countryCode === item.value; const enabled = "enabled" in item ? item.enabled : true; return <Pressable key={item.value} disabled={!enabled} onPress={() => { if (picker === "city") setCity(item.value); else { setCountryCode(item.value); const market = COUNTRIES.find((entry) => entry.value === item.value); if (market) setCurrency(market.currency); setCity(""); } setPicker(null); }} style={[styles.sheetRow, rowRtl, active && styles.sheetRowActive, !enabled && styles.sheetRowDisabled]}><Text style={[styles.sheetRowText, textRtl, active && styles.sheetRowTextActive]}>{locale === "ar" ? item.ar : item.en}</Text>{!enabled ? <Text style={styles.preparedBadge}>{isArabic ? "قريبًا" : "Prepared"}</Text> : active ? <Check size={18} color={theme.accent}/> : null}</Pressable>; })}{picker === "city" && filteredCities.length === 0 ? <Text style={[styles.noResults, textRtl]}>{isArabic ? "لا توجد مدينة مطابقة." : "No matching city."}</Text> : null}</ScrollView></View></SafeAreaView></Modal>

      <Modal transparent visible={dateField !== null} animationType="slide" onRequestClose={() => setDateField(null)}><Pressable style={styles.modalBackdrop} onPress={() => setDateField(null)}/><SafeAreaView style={styles.sheetSafe} edges={["bottom"]}><View style={styles.dateSheet}><View style={[styles.sheetHeader, rowRtl]}><Text style={[styles.sheetTitle, textRtl]}>{dateFieldLabel(dateField, locale)}</Text><Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "إغلاق" : "Close"} onPress={() => setDateField(null)} style={styles.sheetClose}><X size={19} color={theme.text}/></Pressable></View><DateTimePicker value={dateValue} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"} minimumDate={new Date()} locale={isArabic ? "ar-SA-u-ca-gregory-nu-latn" : "en-US-u-ca-gregory-nu-latn"} onChange={(_, next) => { if (next) setDateValue(next); }} themeVariant="dark"/><View style={[styles.dateActions, rowRtl]}><Pressable onPress={() => setDateField(null)} style={styles.dateCancel}><Text style={styles.dateCancelText}>{isArabic ? "إلغاء" : "Cancel"}</Text></Pressable><Pressable onPress={commitDate} style={styles.dateConfirm}><Text style={styles.dateConfirmText}>{isArabic ? "اعتماد التاريخ" : "Use date"}</Text></Pressable></View></View></SafeAreaView></Modal>
    </SafeAreaView>
  </KeyboardAvoidingView>;
}

function Field({ label, children, styles, isRtl, required = false }: { label: string; children: React.ReactNode; styles: ReturnType<typeof createStyles>; isRtl: boolean; required?: boolean }) { return <View style={styles.field}><Text style={[styles.fieldLabel, isRtl && styles.textRtl]}>{label}{required ? <Text style={styles.requiredMark}> *</Text> : null}</Text>{children}</View>; }
function Choice({ active, label, onPress, styles, compact = false }: { active: boolean; label: string; onPress: () => void; styles: ReturnType<typeof createStyles>; compact?: boolean }) { return <Pressable onPress={onPress} style={[styles.choice, compact && styles.choiceCompact, active && styles.choiceActive]} accessibilityRole="radio" accessibilityState={{ selected: active }}><Text style={[styles.choiceText, active && styles.choiceTextActive]}>{label}</Text></Pressable>; }
function Selector({ value, placeholder, onPress, styles, isRtl }: { value: string; placeholder?: string; onPress: () => void; styles: ReturnType<typeof createStyles>; isRtl: boolean }) { return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.selector, isRtl && styles.rowRtl]}><Text numberOfLines={1} style={[styles.selectorText, !value && styles.selectorPlaceholder, isRtl && styles.textRtl]}>{value || placeholder}</Text><ChevronDown size={18} color={darkTheme.muted}/></Pressable>; }
function DateSelector({ value, placeholder, onPress, styles, isRtl }: { value: string; placeholder: string; onPress: () => void; styles: ReturnType<typeof createStyles>; isRtl: boolean }) { return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.selector, isRtl && styles.rowRtl]}><Text style={[styles.selectorText, !value && styles.selectorPlaceholder, isRtl && styles.textRtl]}>{value || placeholder}</Text><CalendarDays size={17} color={darkTheme.accent}/></Pressable>; }
function MultiOptions({ options, selected, onToggle, locale, styles, isRtl }: { options: Option[]; selected: string[]; onToggle: (value: string) => void; locale: "ar" | "en"; styles: ReturnType<typeof createStyles>; isRtl: boolean }) { return <View style={[styles.choices, isRtl && styles.rowRtl]}>{options.map((item) => <Choice key={item.value} active={selected.includes(item.value)} label={locale === "ar" ? item.ar : item.en} onPress={() => onToggle(item.value)} styles={styles} compact/>)}</View>; }
function formatIsoDate(date: Date) { const year = date.getFullYear(); const month = String(date.getMonth() + 1).padStart(2, "0"); const day = String(date.getDate()).padStart(2, "0"); return `${year}-${month}-${day}`; }
function parseIsoDate(value: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null; const [year, month, day] = value.split("-").map(Number); const date = new Date(year, month - 1, day); return Number.isNaN(date.getTime()) ? null : date; }
function durationLabel(value: Exclude<WorkDuration, "">, locale: "ar" | "en") { const ar = { "1_hour": "ساعة", "2_hours": "ساعتان", "4_hours": "4 ساعات", full_day: "يوم كامل" }; const en = { "1_hour": "1 hour", "2_hours": "2 hours", "4_hours": "4 hours", full_day: "Full day" }; return (locale === "ar" ? ar : en)[value]; }
function dateFieldLabel(field: DateField | null, locale: "ar" | "en") { if (field === "workDate") return locale === "ar" ? "تاريخ العمل" : "Work date"; if (field === "applicationStartDate") return locale === "ar" ? "بداية التقديم" : "Application start"; return locale === "ar" ? "آخر موعد للتقديم" : "Application deadline"; }

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen:{flex:1,backgroundColor:theme.background},content:{width:"100%",maxWidth:720,alignSelf:"center",paddingHorizontal:18,paddingTop:18,paddingBottom:40,gap:15},contentCompact:{paddingHorizontal:14,paddingTop:14,gap:12},rowRtl:{flexDirection:"row-reverse"},textRtl:{textAlign:"right",writingDirection:"rtl"},noTracking:{letterSpacing:0,writingDirection:"rtl"},topBar:{minHeight:50,flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:2},backButton:{width:44,height:44,borderRadius:22,borderWidth:1,borderColor:theme.border,backgroundColor:theme.surface,alignItems:"center",justifyContent:"center"},stepLabel:{color:theme.muted,fontSize:11,fontWeight:"700"},hero:{gap:7,paddingVertical:2,marginBottom:2},eyebrow:{color:theme.accent,fontSize:9,fontWeight:"900",letterSpacing:1.5},title:{color:theme.text,fontSize:29,lineHeight:35,fontWeight:"800"},titleCompact:{fontSize:25,lineHeight:31},subtitle:{color:theme.muted,fontSize:12,lineHeight:19,maxWidth:500},formCard:{borderWidth:1,borderColor:theme.border,borderRadius:20,backgroundColor:theme.surface,padding:15,gap:15},formCardCompact:{padding:12,gap:13},requiredLegend:{color:theme.muted,fontSize:10,fontWeight:"700"},requiredMark:{color:theme.accent,fontWeight:"900"},field:{gap:7},fieldLabel:{color:theme.text,fontSize:11,fontWeight:"800"},input:{borderWidth:1,borderColor:theme.border,backgroundColor:theme.background,color:theme.text,borderRadius:13,paddingHorizontal:13,paddingVertical:Platform.OS === "ios" ? 13 : 10,fontSize:13,minHeight:48},textarea:{minHeight:108,textAlignVertical:"top"},twoCol:{flexDirection:"row",gap:9},stack:{flexDirection:"column"},col:{flex:1,minWidth:0},choices:{flexDirection:"row",flexWrap:"wrap",gap:7},choice:{borderWidth:1,borderColor:theme.border,borderRadius:12,minHeight:42,paddingHorizontal:12,paddingVertical:9,justifyContent:"center",backgroundColor:theme.background},choiceCompact:{minHeight:38,paddingHorizontal:10,paddingVertical:7},choiceActive:{backgroundColor:theme.accent,borderColor:theme.accent},choiceText:{color:theme.muted,fontSize:10,fontWeight:"800"},choiceTextActive:{color:theme.background},selector:{minHeight:48,borderRadius:13,borderWidth:1,borderColor:theme.border,backgroundColor:theme.background,paddingHorizontal:13,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:8},selectorText:{flex:1,color:theme.text,fontSize:12,fontWeight:"700"},selectorPlaceholder:{color:theme.muted,fontWeight:"500"},lockedValue:{minHeight:48,borderRadius:13,borderWidth:1,borderColor:theme.border,backgroundColor:theme.chip,alignItems:"center",justifyContent:"center"},lockedValueText:{color:theme.accent,fontSize:12,fontWeight:"900"},reviewHint:{borderRadius:15,borderWidth:1,borderColor:"#C9A96233",backgroundColor:"#C9A96208",padding:13,gap:4},reviewHintTitle:{color:theme.accent,fontSize:11,fontWeight:"900"},reviewHintBody:{color:theme.muted,fontSize:11,lineHeight:18},errorBox:{borderWidth:1,borderColor:"#C84F4F66",backgroundColor:"#C84F4F14",borderRadius:13,padding:12},error:{color:"#E59A9A",fontSize:12,lineHeight:18},save:{backgroundColor:theme.accent,borderRadius:14,minHeight:52,alignItems:"center",justifyContent:"center"},saveText:{color:theme.background,fontSize:13,fontWeight:"900"},disabled:{opacity:.5},modalBackdrop:{...StyleSheet.absoluteFill,backgroundColor:"#000000A8"},sheetSafe:{marginTop:"auto",backgroundColor:theme.surface,borderTopLeftRadius:24,borderTopRightRadius:24,overflow:"hidden"},sheet:{maxHeight:"68%",minHeight:260,borderTopWidth:1,borderColor:theme.border,paddingHorizontal:16,paddingTop:15,paddingBottom:8},dateSheet:{borderTopWidth:1,borderColor:theme.border,paddingHorizontal:16,paddingTop:15,paddingBottom:12},sheetHeader:{flexDirection:"row",alignItems:"flex-start",justifyContent:"space-between",gap:12,marginBottom:12},sheetTitle:{color:theme.text,fontSize:18,fontWeight:"900"},sheetSubtitle:{color:theme.muted,fontSize:10,lineHeight:15,marginTop:3},sheetClose:{width:40,height:40,borderRadius:20,borderWidth:1,borderColor:theme.border,alignItems:"center",justifyContent:"center"},searchBox:{minHeight:46,borderRadius:13,borderWidth:1,borderColor:theme.border,backgroundColor:theme.background,flexDirection:"row",alignItems:"center",gap:9,paddingHorizontal:12,marginBottom:10},searchInput:{flex:1,color:theme.text,fontSize:12,paddingVertical:10},sheetList:{flexGrow:0},sheetRow:{minHeight:50,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:10,borderBottomWidth:1,borderBottomColor:theme.border,paddingHorizontal:4},sheetRowActive:{backgroundColor:"#C9A96209"},sheetRowDisabled:{opacity:.42},sheetRowText:{flex:1,color:theme.text,fontSize:13,fontWeight:"700"},sheetRowTextActive:{color:theme.accent,fontWeight:"900"},preparedBadge:{color:theme.muted,fontSize:9,fontWeight:"800",borderWidth:1,borderColor:theme.border,borderRadius:999,paddingHorizontal:8,paddingVertical:4},noResults:{color:theme.muted,fontSize:12,paddingVertical:28,textAlign:"center"},dateActions:{flexDirection:"row",gap:9,marginTop:8},dateCancel:{flex:1,minHeight:48,borderRadius:13,borderWidth:1,borderColor:theme.border,alignItems:"center",justifyContent:"center"},dateCancelText:{color:theme.text,fontSize:12,fontWeight:"800"},dateConfirm:{flex:1,minHeight:48,borderRadius:13,backgroundColor:theme.accent,alignItems:"center",justifyContent:"center"},dateConfirmText:{color:theme.background,fontSize:12,fontWeight:"900"}
}); }
