import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";

import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { createPublisherOpportunityDraft } from "@/lib/publisher-api";
import { darkTheme } from "@/lib/theme";

export default function NewPublisherOpportunityScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"actor" | "model">("actor");
  const [city, setCity] = useState("");
  const [countryCode, setCountryCode] = useState("SA");
  const [compensation, setCompensation] = useState<"fixed" | "negotiable" | "unpaid">("fixed");
  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState("SAR");
  const [requiredGender, setRequiredGender] = useState<"male" | "female" | "any">("any");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [requiredCount, setRequiredCount] = useState("");
  const [workDate, setWorkDate] = useState("");
  const [workDuration, setWorkDuration] = useState<"1_hour" | "2_hours" | "4_hours" | "full_day" | "">("");
  const [applicationStartDate, setApplicationStartDate] = useState("");
  const [applicationDeadline, setApplicationDeadline] = useState("");
  const [languages, setLanguages] = useState("");
  const [dialects, setDialects] = useState("");
  const [modelingTypes, setModelingTypes] = useState("");
  const [minHeightCm, setMinHeightCm] = useState("");
  const [hairColor, setHairColor] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveDraft() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const split = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);
      const result = await createPublisherOpportunityDraft({
        title,
        description,
        opportunityType: type,
        city,
        countryCode: countryCode.trim().toUpperCase() || undefined,
        compensationType: compensation,
        budget: compensation === "unpaid" ? undefined : budget,
        currency: compensation === "unpaid" ? undefined : currency.trim().toUpperCase() || undefined,
        requiredGender,
        minAge: minAge ? Number(minAge) : null,
        maxAge: maxAge ? Number(maxAge) : null,
        requiredCount: requiredCount ? Number(requiredCount) : null,
        workDate: workDate || null,
        workDuration: workDuration || null,
        applicationStartDate: applicationStartDate || null,
        applicationDeadline: applicationDeadline || null,
        roleRequirements: type === "actor"
          ? { languages: split(languages), dialects: split(dialects) }
          : { modelingTypes: split(modelingTypes), minHeightCm: minHeightCm ? Number(minHeightCm) : null, hairColor: hairColor || null },
      });
      if (!result.ok) {
        const messages: Record<string, string> = {
          INVALID_TITLE: isArabic ? "العنوان قصير جدًا." : "The title is too short.",
          INVALID_DESCRIPTION: isArabic ? "أضف وصفًا أوضح للفرصة." : "Add a clearer opportunity description.",
          INVALID_COUNTRY: isArabic ? "استخدم رمز دولة من حرفين مثل SA أو AE." : "Use a two-letter country code such as SA or AE.",
          INVALID_CURRENCY: isArabic ? "استخدم رمز عملة من ثلاثة أحرف مثل SAR أو AED." : "Use a three-letter currency code such as SAR or AED.",
          INVALID_AGE_RANGE: isArabic ? "راجع نطاق العمر المطلوب." : "Check the required age range.",
          INVALID_DATE: isArabic ? "استخدم صيغة التاريخ YYYY-MM-DD." : "Use the date format YYYY-MM-DD.",
          INVALID_APPLICATION_WINDOW: isArabic ? "تاريخ بداية التقديم يجب أن يسبق آخر موعد." : "Application start date must be before the deadline.",
          INVALID_NUMERIC_FIELD: isArabic ? "راجع العدد أو القيم الرقمية." : "Check the numeric values.",
          INVALID_ROLE_REQUIREMENTS: isArabic ? "راجع متطلبات الدور." : "Check the role requirements.",
          PUBLISHER_NOT_APPROVED: isArabic ? "يجب اعتماد حساب الجهة قبل إنشاء الفرص." : "Publisher approval is required before creating opportunities.",
          PUBLISHER_NOT_VERIFIED: isArabic ? "يجب توثيق الجهة قبل إنشاء الفرص." : "Your organization must be verified before creating opportunities.",
          ACCOUNT_RESTRICTED: isArabic ? "الحساب غير متاح لإنشاء فرص حاليًا." : "This account cannot create opportunities right now.",
        };
        setError(messages[result.code] ?? (isArabic ? "تعذر حفظ المسودة." : "Unable to save draft."));
        return;
      }
      router.replace(`/publisher/opportunities/${result.item.id}`);
    } catch {
      setError(isArabic ? "تعذر حفظ المسودة. تحقق من الاتصال وحاول مرة أخرى." : "Unable to save draft. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}><ScrollView contentContainerStyle={[styles.content, { direction: isRtl ? "rtl" : "ltr" }]} keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic">
    <View style={styles.topBar}><Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} hitSlop={12}><Text style={styles.backIcon}>{isRtl ? "›" : "‹"}</Text></Pressable><Text style={styles.stepLabel}>{isArabic ? "مسودة جديدة" : "New draft"}</Text><View style={styles.topSpacer} /></View>
    <View style={styles.hero}><Text style={styles.eyebrow}>{isArabic ? "ملامح للأعمال" : "MLAMH FOR BUSINESS"}</Text><Text accessibilityRole="header" style={styles.title}>{isArabic ? "أنشئ فرصة" : "Create opportunity"}</Text><Text style={styles.subtitle}>{isArabic ? "أدخل نفس تفاصيل الـBrief التي ستظهر للمواهب في الويب والتطبيق." : "Enter the same brief details talents will see on web and mobile."}</Text></View>
    <View style={styles.formCard}>
      <Field label={isArabic ? "عنوان الفرصة" : "Opportunity title"} styles={styles}><TextInput value={title} onChangeText={setTitle} placeholder={isArabic ? "مثال: ممثل لحملة تجارية" : "Example: Actor for a commercial campaign"} placeholderTextColor={theme.muted} style={[styles.input, { textAlign: isRtl ? "right" : "left" }]} /></Field>
      <Field label={isArabic ? "الفئة" : "Category"} styles={styles}><View style={styles.choices}><Choice active={type === "actor"} label={isArabic ? "ممثل" : "Actor"} onPress={() => setType("actor")} styles={styles} /><Choice active={type === "model"} label={isArabic ? "مودل" : "Model"} onPress={() => setType("model")} styles={styles} /></View></Field>
      <Field label={isArabic ? "الوصف" : "Description"} styles={styles}><TextInput multiline value={description} onChangeText={setDescription} placeholder={isArabic ? "المشروع، الدور، المطلوب وطريقة التنفيذ" : "Project, role, requirements and execution details"} placeholderTextColor={theme.muted} style={[styles.input, styles.textarea, { textAlign: isRtl ? "right" : "left" }]} /></Field>
      <View style={styles.twoCol}><View style={styles.col}><Field label={isArabic ? "المدينة" : "City"} styles={styles}><TextInput value={city} onChangeText={setCity} placeholder={isArabic ? "الرياض" : "Riyadh"} placeholderTextColor={theme.muted} style={styles.input} /></Field></View><View style={styles.col}><Field label={isArabic ? "الدولة" : "Country"} styles={styles}><TextInput value={countryCode} onChangeText={(v) => setCountryCode(v.toUpperCase())} maxLength={2} placeholder="SA" placeholderTextColor={theme.muted} style={styles.input} /></Field></View></View>
      <Field label={isArabic ? "الجنس المطلوب" : "Required gender"} styles={styles}><View style={styles.choices}><Choice active={requiredGender === "any"} label={isArabic ? "الجميع" : "Any"} onPress={() => setRequiredGender("any")} styles={styles} /><Choice active={requiredGender === "male"} label={isArabic ? "ذكر" : "Male"} onPress={() => setRequiredGender("male")} styles={styles} /><Choice active={requiredGender === "female"} label={isArabic ? "أنثى" : "Female"} onPress={() => setRequiredGender("female")} styles={styles} /></View></Field>
      <View style={styles.twoCol}><View style={styles.col}><Field label={isArabic ? "العمر من" : "Min age"} styles={styles}><TextInput value={minAge} onChangeText={setMinAge} keyboardType="number-pad" placeholder="18" placeholderTextColor={theme.muted} style={styles.input} /></Field></View><View style={styles.col}><Field label={isArabic ? "العمر إلى" : "Max age"} styles={styles}><TextInput value={maxAge} onChangeText={setMaxAge} keyboardType="number-pad" placeholder="35" placeholderTextColor={theme.muted} style={styles.input} /></Field></View></View>
      <Field label={isArabic ? "عدد المواهب المطلوبة" : "Required talent count"} styles={styles}><TextInput value={requiredCount} onChangeText={setRequiredCount} keyboardType="number-pad" placeholder="1" placeholderTextColor={theme.muted} style={styles.input} /></Field>
      {type === "actor" ? <><Field label={isArabic ? "اللغات المطلوبة" : "Required languages"} styles={styles}><TextInput value={languages} onChangeText={setLanguages} placeholder={isArabic ? "العربية، الإنجليزية" : "Arabic, English"} placeholderTextColor={theme.muted} style={styles.input} /></Field><Field label={isArabic ? "اللهجات" : "Dialects"} styles={styles}><TextInput value={dialects} onChangeText={setDialects} placeholder={isArabic ? "نجدي، حجازي" : "Najdi, Hejazi"} placeholderTextColor={theme.muted} style={styles.input} /></Field></> : <><Field label={isArabic ? "أنواع أعمال المودل" : "Modeling types"} styles={styles}><TextInput value={modelingTypes} onChangeText={setModelingTypes} placeholder={isArabic ? "تجاري، أزياء، جمال" : "Commercial, fashion, beauty"} placeholderTextColor={theme.muted} style={styles.input} /></Field><View style={styles.twoCol}><View style={styles.col}><Field label={isArabic ? "الحد الأدنى للطول سم" : "Min height cm"} styles={styles}><TextInput value={minHeightCm} onChangeText={setMinHeightCm} keyboardType="number-pad" placeholder="170" placeholderTextColor={theme.muted} style={styles.input} /></Field></View><View style={styles.col}><Field label={isArabic ? "لون الشعر" : "Hair color"} styles={styles}><TextInput value={hairColor} onChangeText={setHairColor} placeholder={isArabic ? "بني" : "Brown"} placeholderTextColor={theme.muted} style={styles.input} /></Field></View></View></>}
      <View style={styles.twoCol}><View style={styles.col}><Field label={isArabic ? "تاريخ العمل" : "Work date"} styles={styles}><TextInput value={workDate} onChangeText={setWorkDate} placeholder="YYYY-MM-DD" placeholderTextColor={theme.muted} style={styles.input} /></Field></View><View style={styles.col}><Field label={isArabic ? "مدة العمل" : "Duration"} styles={styles}><View style={styles.choicesCompact}>{(["1_hour","2_hours","4_hours","full_day"] as const).map((value) => <Choice key={value} active={workDuration === value} label={value === "1_hour" ? (isArabic ? "ساعة" : "1h") : value === "2_hours" ? (isArabic ? "ساعتان" : "2h") : value === "4_hours" ? (isArabic ? "4 ساعات" : "4h") : (isArabic ? "يوم كامل" : "Full day")} onPress={() => setWorkDuration(value)} styles={styles} compact />)}</View></Field></View></View>
      <View style={styles.twoCol}><View style={styles.col}><Field label={isArabic ? "بداية التقديم" : "Application start"} styles={styles}><TextInput value={applicationStartDate} onChangeText={setApplicationStartDate} placeholder="YYYY-MM-DD" placeholderTextColor={theme.muted} style={styles.input} /></Field></View><View style={styles.col}><Field label={isArabic ? "آخر موعد" : "Deadline"} styles={styles}><TextInput value={applicationDeadline} onChangeText={setApplicationDeadline} placeholder="YYYY-MM-DD" placeholderTextColor={theme.muted} style={styles.input} /></Field></View></View>
      <Field label={isArabic ? "المقابل" : "Compensation"} styles={styles}><View style={styles.choices}><Choice active={compensation === "fixed"} label={isArabic ? "محدد" : "Fixed"} onPress={() => setCompensation("fixed")} styles={styles} /><Choice active={compensation === "negotiable"} label={isArabic ? "حسب الاتفاق" : "Negotiable"} onPress={() => setCompensation("negotiable")} styles={styles} /><Choice active={compensation === "unpaid"} label={isArabic ? "بدون مقابل" : "Unpaid"} onPress={() => setCompensation("unpaid")} styles={styles} /></View></Field>
      {compensation !== "unpaid" ? <View style={styles.twoCol}><View style={styles.col}><Field label={isArabic ? "القيمة" : "Amount"} styles={styles}><TextInput value={budget} onChangeText={setBudget} keyboardType="decimal-pad" placeholder="1500" placeholderTextColor={theme.muted} style={styles.input} /></Field></View><View style={styles.col}><Field label={isArabic ? "العملة" : "Currency"} styles={styles}><TextInput value={currency} onChangeText={(v) => setCurrency(v.toUpperCase())} maxLength={3} placeholder="SAR" placeholderTextColor={theme.muted} style={styles.input} /></Field></View></View> : null}
    </View>
    <View style={styles.reviewHint}><Text style={styles.reviewHintTitle}>{isArabic ? "المراجعة قبل النشر" : "Review before publishing"}</Text><Text style={styles.reviewHintBody}>{isArabic ? "سيتم حفظها كمسودة أولًا، ثم تقدر ترسلها للمراجعة من شاشة الفرصة." : "The opportunity is saved as a draft first, then submitted for review from its detail screen."}</Text></View>
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    <Pressable disabled={saving} onPress={() => void saveDraft()} style={[styles.save, saving && styles.disabled]}><Text style={styles.saveText}>{saving ? (isArabic ? "جارٍ الحفظ…" : "Saving…") : (isArabic ? "حفظ المسودة" : "Save draft")}</Text></Pressable>
  </ScrollView></KeyboardAvoidingView>;
}

function Field({ label, children, styles }: { label: string; children: React.ReactNode; styles: ReturnType<typeof createStyles> }) { return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text>{children}</View>; }
function Choice({ active, label, onPress, styles, compact = false }: { active: boolean; label: string; onPress: () => void; styles: ReturnType<typeof createStyles>; compact?: boolean }) { return <Pressable onPress={onPress} style={[styles.choice, compact && styles.choiceCompact, active && styles.choiceActive]} accessibilityRole="radio" accessibilityState={{ selected: active }}><Text style={[styles.choiceText, active && styles.choiceTextActive]}>{label}</Text></Pressable>; }
function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, content: { paddingHorizontal: 18, paddingTop: 48, paddingBottom: 54, gap: 16 }, topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, backIcon: { color: theme.text, fontSize: 30, lineHeight: 34 }, stepLabel: { color: theme.muted, fontSize: 11, fontWeight: "700" }, topSpacer: { width: 30 },
  hero: { gap: 7, paddingVertical: 8 }, eyebrow: { color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.8 }, title: { color: theme.text, fontSize: 31, lineHeight: 38, fontWeight: "700" }, subtitle: { color: theme.muted, fontSize: 13, lineHeight: 21, maxWidth: 430 },
  formCard: { borderWidth: 1, borderColor: theme.border, borderRadius: 18, backgroundColor: theme.surface, padding: 16, gap: 16 }, field: { gap: 7 }, fieldLabel: { color: theme.text, fontSize: 12, fontWeight: "800" }, input: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.background, color: theme.text, borderRadius: 12, paddingHorizontal: 13, paddingVertical: Platform.OS === "ios" ? 13 : 10, fontSize: 14, minHeight: 48 }, textarea: { minHeight: 120, textAlignVertical: "top" }, twoCol: { flexDirection: "row", gap: 10 }, col: { flex: 1 },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, choicesCompact: { flexDirection: "row", flexWrap: "wrap", gap: 5 }, choice: { borderWidth: 1, borderColor: theme.border, borderRadius: 12, minHeight: 42, paddingHorizontal: 12, paddingVertical: 9, justifyContent: "center", backgroundColor: theme.background }, choiceCompact: { minHeight: 36, paddingHorizontal: 9, paddingVertical: 7 }, choiceActive: { backgroundColor: theme.accent, borderColor: theme.accent }, choiceText: { color: theme.muted, fontSize: 11, fontWeight: "700" }, choiceTextActive: { color: theme.background },
  reviewHint: { borderRadius: 14, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, padding: 14, gap: 4 }, reviewHintTitle: { color: theme.accent, fontSize: 12, fontWeight: "800" }, reviewHintBody: { color: theme.muted, fontSize: 12, lineHeight: 19 }, save: { backgroundColor: theme.accent, borderRadius: 12, minHeight: 52, paddingVertical: 15, alignItems: "center", justifyContent: "center" }, saveText: { color: theme.background, fontSize: 14, fontWeight: "900" }, disabled: { opacity: 0.5 }, error: { color: "#E59A9A", fontSize: 13, lineHeight: 20, textAlign: "center" }
}); }
